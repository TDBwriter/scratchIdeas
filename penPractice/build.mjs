// Pen Practice sheet builder: lesson JSON → true-size PDF for Kindle Scribe + PNG previews.
//
//   node build.mjs [--page eink|letter|a4] [--seed N] [--left] [--out DIR] lessons/*.json
//
// --page eink (default) is 157.5 × 210 mm (3:4): the Kindle Scribe 2022/2024 screen, and within
// 0.5 mm of the reMarkable 2 screen, so millimetre sizes in a lesson are real millimetres on both.
// It scales to the 11" Scribe, reMarkable Paper Pro and iPad (all 3:4). --page letter / a4 lay the
// same lessons out again for print (more rows, same real sizes). PDFs have working links.
//
//   --seed N   new random layout of targets (fresh practice, same lesson)
//   --left     left-handed variant (horizontal lines start on the right)
//
// Requires: playwright (Chromium), and ImageMagick `convert` for the grayscale PNG previews.

import { createRequire } from 'node:module';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { resolve, join } from 'node:path';

const { chromium } = createRequire(import.meta.url)('playwright');

// ---------- arguments
const opt = { page: 'eink', seed: 1, left: false, out: 'out', files: [] };
const argv = process.argv.slice(2);
for (let i = 0; i < argv.length; i++) {
  if (argv[i] === '--page') opt.page = argv[++i];
  else if (argv[i] === '--seed') opt.seed = Number(argv[++i]);
  else if (argv[i] === '--left') opt.left = true;
  else if (argv[i] === '--out') opt.out = argv[++i];
  else opt.files.push(argv[i]);
}
if (!opt.files.length) {
  console.error('usage: node build.mjs [--page eink|letter|a4] [--seed N] [--left] [--out DIR] lessons/*.json');
  process.exit(1);
}

const PAGES = {                                        // mm
  eink:   { w: 157.5, h: 210,   pad: 9 },               // Scribe 2022/2024 ≈ reMarkable 2 (true size)
  letter: { w: 215.9, h: 279.4, pad: 13 },
  a4:     { w: 210,   h: 297,   pad: 13 },
};
const PAGE = PAGES[opt.page];
if (!PAGE) { console.error(`unknown --page ${opt.page} (use ${Object.keys(PAGES).join(', ')})`); process.exit(1); }
const INK = '#000', GHOST = '#b0b0b0', RULE = '#8a8a8a', FAINT = '#c4c4c4';
const HEAD_H = 31, FOOT_H = 20;

// Deterministic RNG: the same seed rebuilds the same page; a new seed gives fresh targets.
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), a | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const f = n => n.toFixed(2);

// Small icon for each guide level: trace (ghost path + dots), dots only, free.
function guideIcon(mode) {
  const dots = `<circle cx="2" cy="3" r="1" fill="${INK}"/><circle cx="12" cy="3" r="0.9" fill="#fff" stroke="${INK}" stroke-width="0.4"/>`;
  const body = mode === 'ghost'
    ? `<line x1="2" y1="3" x2="12" y2="3" stroke="${GHOST}" stroke-width="0.7" stroke-dasharray="1.4 0.9"/>${dots}`
    : mode === 'dots' ? dots
    : `<rect x="1" y="0.8" width="12" height="4.4" fill="none" stroke="${RULE}" stroke-width="0.35"/>`;
  return `<svg viewBox="0 0 14 6" width="14mm" height="6mm">${body}</svg>`;
}

// ---------- lesson type: line drill (dot-to-dot straight lines)
function lineDrill(lesson, rand) {
  const cols = 2, gap = 4, rows = Math.ceil(lesson.cells.length / cols);
  const cw = (PAGE.w - 2 * PAGE.pad - gap * (cols - 1)) / cols;
  const ch = (PAGE.h - 2 * PAGE.pad - HEAD_H - FOOT_H - 7 - gap * (rows - 1)) / rows;
  const [minL, maxL] = lesson.length_mm;
  const len = max => Math.min(max, minL + rand() * (maxL - minL));

  const cells = lesson.cells.map((c, i) => {
    const m = 5, top = 8;                                  // inner margins; top clears the cell number
    const W = cw - 2 * m, H = ch - top - m;
    const segs = [];
    if (c.orientation === 'horizontal') {
      for (let k = 0; k < 3; k++) {
        const L = len(W), x = m + rand() * (W - L), y = top + H * (k + 0.5) / 3;
        segs.push([x, y, x + L, y]);
      }
    } else if (c.orientation === 'vertical') {
      for (let k = 0; k < 3; k++) {
        const L = len(H), x = m + W * (k + 0.5) / 3, y = top + rand() * (H - L);
        segs.push([x, y, x, y + L]);
      }
    } else {                                               // two parallel 45° diagonals, kept apart
      const half = (W - 6) / 2, up = rand() < 0.5;       // same direction in a cell, so no false "peak"
      for (let k = 0; k < 2; k++) {
        const side = Math.min(half, H), L = len(side * Math.SQRT2), d = L / Math.SQRT2;
        const x0 = m + (half + 6) * k + rand() * (half - d), y0 = top + rand() * (H - d);
        segs.push(up ? [x0, y0 + d, x0 + d, y0] : [x0, y0, x0 + d, y0 + d]);
      }
    }
    if (opt.left) for (const s of segs) if (s[1] === s[3]) [s[0], s[2]] = [s[2], s[0]];

    let body = '';
    if (c.guide === 'free') {
      const L = len(W), x = m, y = top;                    // a reference length to match, nothing else
      body = `<line x1="${f(x)}" y1="${f(y)}" x2="${f(x + L)}" y2="${f(y)}" stroke="${INK}" stroke-width="0.5"/>`
        + [x, x + L].map(t => `<line x1="${f(t)}" y1="${f(y - 1.6)}" x2="${f(t)}" y2="${f(y + 1.6)}" stroke="${INK}" stroke-width="0.45"/>`).join('')
        + `<text x="${f(x + L + 2)}" y="${f(y + 1.1)}" class="t">×3</text>`;
    } else {
      for (const [x1, y1, x2, y2] of segs) {
        if (c.guide === 'ghost') body += `<line x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}" stroke="${GHOST}" stroke-width="0.7" stroke-dasharray="1.6 1.1"/>`;
        body += `<circle cx="${f(x1)}" cy="${f(y1)}" r="1.05" fill="${INK}"/>`
          + `<circle cx="${f(x2)}" cy="${f(y2)}" r="0.95" fill="#fff" stroke="${INK}" stroke-width="0.4"/>`;
      }
    }
    return `<div class="cell"><svg viewBox="0 0 ${f(cw)} ${f(ch)}" width="${f(cw)}mm" height="${f(ch)}mm">`
      + `<text x="2.4" y="5" class="n">${i + 1}</text>${body}</svg></div>`;
  }).join('');
  return `<div class="grid" style="grid-template-columns:repeat(${cols},${f(cw)}mm);grid-auto-rows:${f(ch)}mm;gap:${gap}mm">${cells}</div>`;
}

// ---------- lesson type: letter rows (ruled bands, trace → dots → free)
function letterRows(lesson) {
  const r = lesson.ruling, fs = lesson.font.size_mm, fam = lesson.font.family;
  const W = PAGE.w - 2 * PAGE.pad;
  const rowH = r.ascender_mm + r.descender_mm + r.row_gap_mm;
  const slots = Math.floor((W - 4) / r.slot_mm);
  const seq = Array.from({ length: slots }, (_, i) => lesson.glyphs[i % lesson.glyphs.length]);

  const ruling = (base, scale = 1) => {
    const y = v => f(base - v * scale);
    return `<line x1="0" y1="${y(r.ascender_mm)}" x2="${f(W)}" y2="${y(r.ascender_mm)}" stroke="${FAINT}" stroke-width="0.25"/>`
      + `<line x1="0" y1="${y(r.x_height_mm)}" x2="${f(W)}" y2="${y(r.x_height_mm)}" stroke="${RULE}" stroke-width="0.3" stroke-dasharray="1.2 0.9"/>`
      + `<line x1="0" y1="${f(base)}" x2="${f(W)}" y2="${f(base)}" stroke="${INK}" stroke-width="0.35"/>`
      + `<line x1="0" y1="${y(-r.descender_mm)}" x2="${f(W)}" y2="${y(-r.descender_mm)}" stroke="${FAINT}" stroke-width="0.25" stroke-dasharray="0.4 0.8"/>`;
  };
  const glyph = (g, x, base, scale, guide, fill) => {
    const top = base - (lesson.start[g] === 'asc' ? r.ascender_mm : r.x_height_mm) * scale;
    return `<text x="${f(x)}" y="${f(base)}" class="glyph" data-guide="${guide}" data-top="${f(top)}" data-scale="${scale}"`
      + ` font-family="${esc(fam)}" font-size="${f(fs * scale)}" text-anchor="middle" fill="${fill}">${esc(g)}</text>`;
  };

  // Exemplar strip: the target letters, large, with start dots and pull-down arrows.
  const xs = 2.2, exH = (r.ascender_mm + r.descender_mm) * xs + 4, exBase = 2 + r.ascender_mm * xs;
  const exemplar = `<svg class="exemplar" viewBox="0 0 ${f(W)} ${f(exH)}" width="${f(W)}mm" height="${f(exH)}mm">`
    + ruling(exBase, xs)
    + lesson.glyphs.map((g, k) => glyph(g, W * (k + 0.5) / lesson.glyphs.length, exBase, xs, 'exemplar', INK)).join('')
    + `</svg>`;

  // Use the lesson's rows, then fill any remaining height with free rows (more practice on big paper).
  const avail = PAGE.h - 2 * PAGE.pad - HEAD_H - FOOT_H - exH - 6;
  const plan = [...lesson.rows];
  while ((plan.length + 1) * rowH <= avail) plan.push({ guide: 'free' });

  const rows = plan.map(row => {
    const base = r.row_gap_mm * 0.55 + r.ascender_mm;
    let marks = '';
    seq.forEach((g, k) => {
      const cx = 2 + r.slot_mm * (k + 0.5);
      if (row.guide === 'free') {
        const x = f(2 + r.slot_mm * k);
        marks += `<line x1="${x}" y1="${f(base - r.x_height_mm - 0.9)}" x2="${x}" y2="${f(base - r.x_height_mm + 0.9)}" stroke="${FAINT}" stroke-width="0.25"/>`;
      } else {
        marks += glyph(g, cx, base, 1, row.guide, row.guide === 'ghost' ? GHOST : 'none');
      }
    });
    return `<div class="row"><svg viewBox="0 0 ${f(W)} ${f(rowH)}" width="${f(W)}mm" height="${f(rowH)}mm">`
      + ruling(base) + marks + `</svg></div>`;
  }).join('');
  return exemplar + `<div class="rows">${rows}</div>`;
}

// Runs in the page once fonts are loaded: puts a start dot at the top of each glyph's first stem
// (and a pull-down arrow on the exemplars). Measured from the rendered glyph, so it follows the font.
function placeStartDots() {
  const NS = 'http://www.w3.org/2000/svg';
  for (const t of document.querySelectorAll('text.glyph')) {
    if (t.dataset.guide === 'free') continue;
    const fs = parseFloat(t.getAttribute('font-size'));
    const bb = t.getBBox();
    const x = bb.x + fs * 0.115;                          // left side bearing + half a stem (sans fonts)
    const y = parseFloat(t.dataset.top) + 0.2 * parseFloat(t.dataset.scale);
    const dot = document.createElementNS(NS, 'circle');
    dot.setAttribute('cx', x); dot.setAttribute('cy', y);
    dot.setAttribute('r', t.dataset.guide === 'exemplar' ? 1.3 : 0.85);
    dot.setAttribute('fill', '#000');
    if (t.dataset.guide === 'exemplar') { dot.setAttribute('fill', '#fff'); dot.setAttribute('stroke', '#000'); dot.setAttribute('stroke-width', '0.5'); }
    t.after(dot);
    if (t.dataset.guide === 'exemplar') {
      const ax = x - 3.2, y1 = y + 1, y2 = y + fs * 0.32;
      const a = document.createElementNS(NS, 'path');
      a.setAttribute('d', `M${ax} ${y1} L${ax} ${y2} M${ax - 1} ${y2 - 1.4} L${ax} ${y2} L${ax + 1} ${y2 - 1.4}`);
      a.setAttribute('stroke', '#000'); a.setAttribute('stroke-width', '0.45'); a.setAttribute('fill', 'none');
      t.after(a);
    }
  }
}

// ---------- page assembly
const lessons = opt.files.map(p => JSON.parse(readFileSync(p, 'utf8')));
const rand = rng(opt.seed);

const legend = `<div class="legend">${['ghost', 'dots', 'free'].map((m, i) =>
  `<div>${guideIcon(m)}<span>${['trace', 'dots', 'free'][i]}</span></div>`).join('<b>→</b>')}</div>`;

const lessonPage = (l, i) => `
<section class="page" id="lesson-${i}">
  <header class="head" style="height:${HEAD_H}mm">
    <div class="track">${esc(l.track)}</div>
    <div class="title">${esc(l.title)}</div>
    <div class="obj">${esc(l.objective)}</div>
    ${legend}
  </header>
  ${l.type === 'line-drill' ? lineDrill(l, rand) : letterRows(l)}
  <footer class="foot" style="height:${FOOT_H}mm">
    <div><div class="id">${esc(l.id)} · ${esc(l.track)}${opt.left ? ' · left-handed' : ''} · seed ${opt.seed}</div>
      <div class="check">✎ ${esc(l.self_check)}</div></div>
    <div class="side"><a href="#why-${i}">Why? ▸</a><div class="reps">reps ☐ ☐ ☐</div></div>
  </footer>
</section>`;

const cover = `
<section class="page cover">
  <div class="track">Pen Practice · sampler</div>
  <div class="big">Draw and write,<br>a little better every day.</div>
  <ol class="how">
    <li>Open a lesson and write directly on the page with your pen.</li>
    <li>Each page fades its help: <b>trace</b> → <b>dots</b> → <b>free</b>.</li>
    <li>Circle your best attempt. Repeat the page tomorrow.</li>
  </ol>
  <div class="toc">${lessons.map((l, i) => `<a href="#lesson-${i}"><span>${esc(l.id)}</span>${esc(l.title)}<em>${esc(l.track)}</em></a>`).join('')}</div>
  <div class="note">True size on Kindle Scribe (10.2") · 3:4 pages scale to other pen tablets</div>
</section>`;

const why = lessons.map((l, i) => `
  <div class="whyitem" id="why-${i}"><div class="track">${esc(l.id)} · ${esc(l.track)}</div>
  <div class="wt">${esc(l.title)}</div><p>${esc(l.deep_dive)}</p><a href="#lesson-${i}">◂ back to the lesson</a></div>`).join('');

const html = `<!doctype html><html><head><meta charset="utf-8"><title>Pen Practice sampler</title><style>
@page { size: ${PAGE.w}mm ${PAGE.h}mm; margin: 0; }
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body { background: #fff; color: #000; font-family: Inter, "DejaVu Sans", sans-serif; }
a { color: inherit; text-decoration: none; }
.page { width: ${PAGE.w}mm; height: ${PAGE.h}mm; padding: ${PAGE.pad}mm; position: relative; overflow: hidden;
        display: flex; flex-direction: column; break-after: page; }
.track { font: 600 2.5mm "JetBrains Mono", monospace; letter-spacing: 0.4mm; text-transform: uppercase; color: #444; }
.head { position: relative; flex: none; }
.title { font: 800 7.4mm/1.1 Inter, sans-serif; margin-top: 1.4mm; }
.obj { font: 400 3.3mm/1.35 Inter, sans-serif; margin-top: 1.8mm; max-width: 96mm; }
.legend { position: absolute; top: 0; right: 0; display: flex; align-items: center; gap: 1.2mm;
          font: 2.3mm "JetBrains Mono", monospace; color: #444; }
.legend div { display: flex; flex-direction: column; align-items: center; gap: 0.4mm; }
.legend b { font-weight: 400; color: #888; margin-bottom: 3mm; }
.grid { display: grid; flex: none; margin-top: 3mm; }
.cell { position: relative; border: 0.35mm solid #000; }
.row { position: relative; }
.exemplar { flex: none; margin-bottom: 2mm; }
svg text.n { font: 700 3.4px "JetBrains Mono", monospace; }
svg text.t { font: 600 3px "JetBrains Mono", monospace; }
.foot { margin-top: auto; flex: none; border-top: 0.5mm solid #000; padding-top: 2mm;
        display: grid; grid-template-columns: 1fr auto; gap: 4mm; }
.foot .id { font: 600 2.3mm "JetBrains Mono", monospace; color: #555; }
.foot .check { font: 3mm/1.35 Inter, sans-serif; margin-top: 1.2mm; }
.foot .side { text-align: right; font: 600 2.8mm "JetBrains Mono", monospace; }
.foot .side a { display: inline-block; border: 0.4mm solid #000; padding: 1mm 2.2mm; }
.foot .reps { margin-top: 2.2mm; font-weight: 500; }
.cover .big { font: 800 10mm/1.12 Inter, sans-serif; margin: 10mm 0 8mm; }
.cover .how { font: 3.8mm/1.5 Inter, sans-serif; padding-left: 5mm; }
.cover .toc { margin-top: 12mm; border-top: 0.6mm solid #000; }
.cover .toc a { display: grid; grid-template-columns: 18mm 1fr auto; align-items: baseline; padding: 4mm 0;
                border-bottom: 0.3mm solid #bbb; font: 600 4.6mm Inter, sans-serif; }
.cover .toc span { font: 700 3.2mm "JetBrains Mono", monospace; }
.cover .toc em { font: 400 3mm "JetBrains Mono", monospace; color: #555; font-style: normal; }
.cover .note { margin-top: auto; font: 2.6mm "JetBrains Mono", monospace; color: #555; }
.whyitem { border-top: 0.6mm solid #000; padding: 4mm 0 7mm; }
.whyitem .wt { font: 700 5.4mm Inter, sans-serif; margin: 1mm 0 2mm; }
.whyitem p { font: 3.7mm/1.5 Inter, sans-serif; max-width: 125mm; }
.whyitem a { display: inline-block; margin-top: 3mm; font: 600 2.8mm "JetBrains Mono", monospace; border: 0.4mm solid #000; padding: 1mm 2.2mm; }
</style></head><body>
${cover}
${lessons.map(lessonPage).join('')}
<section class="page"><div class="title" style="margin-bottom:6mm">Why it works</div>${why}</section>
</body></html>`;

// ---------- render
const out = resolve(opt.out);
mkdirSync(out, { recursive: true });
const name = 'pen-practice-sampler' + (opt.page === 'eink' ? '' : `-${opt.page}`);
writeFileSync(join(out, `${name}.html`), html);

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 600, height: 800 }, deviceScaleFactor: 300 / 96 });
  await page.setContent(html, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(placeStartDots);

  await page.pdf({ path: join(out, `${name}.pdf`), width: `${PAGE.w}mm`, height: `${PAGE.h}mm`, printBackground: true });

  // PNG previews at exact Scribe pixels, for the e-ink edition only.
  const pages = opt.page === 'eink' ? await page.$$('section.page') : [];
  for (let i = 0; i < pages.length; i++) {
    const png = join(out, `page-${i + 1}.png`);
    await pages[i].screenshot({ path: png });
    try {   // exact Scribe pixels, 16 grays
      execFileSync('convert', [png, '-resize', '1860x2480!', '-colorspace', 'Gray', '-posterize', '16', '-type', 'Grayscale', '-depth', '8', png]);
    } catch { /* ImageMagick missing: keep the colour screenshot */ }
  }
  console.log(`wrote ${join(out, `${name}.pdf`)}${pages.length ? ` and ${pages.length} PNG previews` : ''}`);
} finally {
  await browser.close();
}
