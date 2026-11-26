// Builds the handbook: "Sketch What You See — Techniques and History", a reading book whose parts and units
// mirror the workbook's one for one (same ids, titles and order) but which stands entirely on its own.
//
//   node build.mjs [--page eink|letter|a4] [--figs]      (--figs re-exports diagrams and sketches)
//
// Text: text-a.mjs, text-b.mjs, text-c.mjs. Titles, parts and key sentences come from ../sketch/ so the two books
// can never drift apart. Diagrams and pencil sketches are exported by ../sketch/build.mjs --figs. Plates: plates/.
// Flowing layout paginated by Chromium; the contents get their page numbers from a first pass read with pdftotext.

import { createRequire } from 'node:module';
import { existsSync, mkdirSync, writeFileSync, readFileSync, rmSync, cpSync, readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { resolve, join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { book as wbBook, parts, lessons } from '../sketch/lessons.mjs';
import { theory } from '../sketch/theory.mjs';
import * as A from './text-a.mjs';
import * as B from './text-b.mjs';
import * as C from './text-c.mjs';

const { chromium } = createRequire(import.meta.url)('playwright');
const HERE = dirname(fileURLToPath(import.meta.url));
const opt = { page: 'eink', figs: false, out: resolve(HERE, '../out/handbook') };
const argv = process.argv.slice(2);
for (let i = 0; i < argv.length; i++) { if (argv[i] === '--page') opt.page = argv[++i]; else if (argv[i] === '--figs') opt.figs = true; }
const PAGES = { eink: { w: 157.5, h: 210, m: [15, 14, 17, 14] }, letter: { w: 215.9, h: 279.4, m: [20, 22, 22, 22] }, a4: { w: 210, h: 297, m: [20, 22, 22, 22] } };
const PAGE = PAGES[opt.page];
const BOOK = { title: 'Sketch What You See', subtitle: 'Techniques and history of drawing from observation', series: wbBook.series };
const units = { ...A.units, ...B.units, ...C.units };
for (const l of lessons) if (!units[l.id]) throw new Error(`no handbook text for ${l.id}`);

// ---------- figures, sketches and plates
mkdirSync(opt.out, { recursive: true });
const figsFile = join(opt.out, 'figs.json');
if (opt.figs || !existsSync(figsFile)) execFileSync('node', [resolve(HERE, '../sketch/build.mjs'), '--figs', figsFile], { stdio: 'inherit' });
const FIGS = JSON.parse(readFileSync(figsFile, 'utf8'));
cpSync(join(HERE, 'plates'), join(opt.out, 'plates'), { recursive: true });
const pngSize = f => { const b = readFileSync(join(HERE, 'plates', f)); return [b.readUInt32BE(16), b.readUInt32BE(20)]; };

// ---------- markup → HTML
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
function figure(spec) {
  const [kindName, cap = ''] = spec.split('|'), [kind, name] = kindName.split(':');
  let body;
  if (kind === 'diagram') { if (!FIGS.diagrams[name]) throw new Error(`no diagram ${name}`); body = `<div class="fig-svg">${FIGS.diagrams[name]}</div>`; }
  else if (kind === 'tf') { if (!FIGS.tf[name]) throw new Error(`no small figure ${name}`); body = `<div class="fig-svg small">${FIGS.tf[name]}</div>`; }
  else if (kind === 'ref') { if (!FIGS.refs[name]) throw new Error(`no sketch for ${name}`); body = `<div class="fig-ref">${FIGS.refs[name]}</div>`; }
  else if (kind === 'plate') {
    const [w, h] = pngSize(name), tall = h / w > 0.9;
    body = `<img class="plate${tall ? ' tall' : ''}" src="plates/${name}"/>`;
  } else if (kind === 'plates') body = `<div class="pair">${name.split(',').map(n => `<img class="plate" src="plates/${n}"/>`).join('')}</div>`;
  else throw new Error(`bad figure ${spec}`);
  return `<figure>${body}${cap ? `<figcaption>${esc(cap)}</figcaption>` : ''}</figure>`;
}
function blocks(list) {
  let html = '', ul = null, ol = null;
  const flush = () => { if (ul) { html += `<ul>${ul}</ul>`; ul = null; } if (ol) { html += `<ol>${ol}</ol>`; ol = null; } };
  for (const b of list) {
    if (b.startsWith('- ')) { if (ol) flush(); ul = (ul || '') + `<li>${esc(b.slice(2))}</li>`; continue; }
    if (/^\d+\. /.test(b)) { if (ul) flush(); ol = (ol || '') + `<li>${esc(b.replace(/^\d+\. /, ''))}</li>`; continue; }
    flush();
    if (b.startsWith('## ')) html += `<h3>${esc(b.slice(3))}</h3>`;
    else if (b.startsWith('> ')) { const t = b.slice(2), k = t.lastIndexOf(' — '); html += `<blockquote><p>${esc(k > 0 ? t.slice(0, k) : t)}</p>${k > 0 ? `<cite>${esc(t.slice(k + 3))}</cite>` : ''}</blockquote>`; }
    else if (b.startsWith('fig:')) html += figure(b.slice(4));
    else html += `<p>${esc(b)}</p>`;
  }
  flush();
  return html;
}

// ---------- the book
const partName = n => parts.find(p => p.n === n).name;
const up = s => s.toUpperCase();
function buildHtml() {
  let h = '';
  h += `<section class="title"><div class="t-series">${esc(up(BOOK.series))}</div><div class="t-title">${esc(BOOK.title)}</div><div class="t-sub">${esc(BOOK.subtitle)}</div>
    <div class="t-plate"><img src="plates/fulmer-plate1.png"/></div><div class="t-foot">Lines · shapes · proportion · space · light · the field · whole scenes</div></section>`;
  const tocRow = (label, key, cls = '') => `<div class="toc-row ${cls}"><span>${label}</span><em>{{p:${key}}}</em></div>`;
  h += `<section class="toc"><h2 class="sec-h">Contents</h2>${tocRow('Introduction', 'intro', 'major')}${parts.map(p => tocRow(`Part ${p.n} · ${esc(p.name)}`, `part-${p.n}`, 'major') + lessons.filter(l => l.part === p.n).map(l => tocRow(`<b>${l.id}</b>${esc(l.title)}`, l.id)).join('')).join('')}${tocRow('Glossary', 'glossary', 'major')}${tocRow('Sources and further reading', 'sources', 'major')}${tocRow('Picture credits', 'credits', 'major')}</section>`;
  h += `<section class="chap"><div class="kick">INTRODUCTION</div><h2 class="chap-h">About this book</h2>${blocks(A.intro)}</section>`;
  for (const p of parts) {
    const ls = lessons.filter(l => l.part === p.n);
    h += `<section class="part"><div class="kick">${esc(up(`Part ${p.n} · ${p.name}`))}</div><div class="part-n">${p.n}</div><h2 class="part-h">${esc(p.name)}</h2>${A.partIntros[p.n].map(t => `<p class="part-intro">${esc(t)}</p>`).join('')}
      <div class="part-list">${ls.map(l => `<div><span>${l.id}</span>${esc(l.title)}<em>{{p:${l.id}}}</em></div>`).join('')}</div></section>`;
    for (const l of ls) {
      h += `<section class="unit"><div class="kick">${l.id} · ${esc(up(`Part ${p.n} · ${p.name}`))}</div><h2 class="unit-h">${esc(l.title)}</h2>
        <div class="key">${esc(theory[l.id].key)}</div>${blocks(units[l.id])}</section>`;
    }
  }
  h += `<section class="chap"><div class="kick">GLOSSARY</div><h2 class="chap-h">Glossary</h2><dl class="gloss">${C.glossary.map(([t, d]) => `<dt>${esc(t)}</dt><dd>${esc(d)}</dd>`).join('')}</dl></section>`;
  h += `<section class="chap"><div class="kick">SOURCES AND FURTHER READING</div><h2 class="chap-h">Sources and further reading</h2><ul class="refs">${C.sources.map(s => `<li>${esc(s)}</li>`).join('')}</ul>
    <div class="kick credits-k">PICTURE CREDITS</div><h3>Picture credits</h3>${C.credits.map(s => `<p class="small">${esc(s)}</p>`).join('')}
    <p class="small colophon">${esc(BOOK.series)} · ${esc(BOOK.title)} — ${esc(BOOK.subtitle)} · ${opt.page === 'eink' ? 'e-ink edition, 157.5 × 210 mm' : `${opt.page} edition`}. Set in Caladea, Inter and JetBrains Mono (SIL Open Font License).</p></section>`;
  return h;
}

const css = `@page { size: ${PAGE.w}mm ${PAGE.h}mm; }
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body { background: #fff; color: #000; }
body { font: 3.55mm/1.5 Caladea, "DejaVu Serif", serif; hyphens: auto; }
section { break-before: page; }
section.title { break-before: auto; height: ${PAGE.h - PAGE.m[0] - PAGE.m[2] - 2}mm; display: flex; flex-direction: column; }
p { margin: 0 0 2mm; text-align: justify; orphans: 3; widows: 3; }
.kick { font: 600 2.3mm "JetBrains Mono", monospace; letter-spacing: 0.35mm; color: #555; }
.chap-h, .sec-h { font: 800 8mm/1.1 Inter, sans-serif; margin: 1.5mm 0 5mm; }
.unit-h { font: 800 6.6mm/1.12 Inter, sans-serif; margin: 1.5mm 0 3mm; padding-bottom: 2.5mm; border-bottom: 0.5mm solid #000; }
.unit-h span { font: 700 3.4mm "JetBrains Mono", monospace; display: block; color: #444; margin-bottom: 1mm; }
.key { font: 700 4mm/1.3 Inter, sans-serif; border-left: 1.2mm solid #000; padding: 0.4mm 0 0.4mm 3mm; margin: 0 0 3mm; }
h3 { font: 700 2.7mm "JetBrains Mono", monospace; letter-spacing: 0.35mm; text-transform: uppercase; margin: 4mm 0 1.2mm; break-after: avoid; }
ul, ol { margin: 0 0 2.2mm 5.5mm; }
li { margin-bottom: 0.8mm; }
blockquote { margin: 2.5mm 0 3mm; padding: 0.5mm 0 0.5mm 4mm; border-left: 0.5mm solid #000; break-inside: avoid; }
blockquote p { font-style: italic; text-align: left; margin: 0; }
blockquote cite { display: block; font: 2.6mm/1.35 Inter, sans-serif; font-style: normal; color: #444; margin-top: 1mm; }
figure { margin: 3mm 0 3.5mm; break-inside: avoid; }
figure .fig-svg { border: 0.3mm solid #bbb; }
figure .fig-svg.small { width: 70mm; margin: 0 auto; }
figure svg { display: block; }
figure img.plate { display: block; max-width: 100%; max-height: 88mm; margin: 0 auto; border: 0.3mm solid #999; }
figure .pair img.plate { flex: 1; min-width: 0; max-height: none; width: 50%; }
figure img.plate.tall { max-width: 64%; }
figure .ref img { width: 100%; display: block; border: 0.3mm solid #999; }
figure .ref { position: relative; }
figure .ref .ov { position: absolute; inset: 0; width: 100%; height: 100%; }
figure .pair { display: flex; gap: 4mm; }
figcaption { font: 2.6mm/1.38 Inter, sans-serif; color: #444; margin-top: 1.2mm; }
.title .t-series { font: 600 2.8mm "JetBrains Mono", monospace; letter-spacing: 0.6mm; color: #444; margin-top: 6mm; }
.title .t-title { font: 800 13mm/1 Inter, sans-serif; margin-top: 4mm; letter-spacing: -0.3mm; }
.title .t-sub { font: 4.4mm/1.3 Caladea, serif; font-style: italic; margin: 3mm 0 8mm; }
.title .t-plate img { width: 100%; display: block; }
.title .t-foot { margin-top: auto; font: 2.6mm "JetBrains Mono", monospace; color: #555; }
.toc-row { display: flex; align-items: baseline; font: 2.85mm/1.5 Inter, sans-serif; }
.toc-row b { font: 600 2.4mm "JetBrains Mono", monospace; display: inline-block; width: 10mm; color: #444; }
.toc-row span { flex: 1; }
.toc-row em { font: 600 2.5mm "JetBrains Mono", monospace; font-style: normal; padding-left: 2mm; }
.toc-row.major { font-weight: 800; font-size: 3.2mm; margin-top: 2.2mm; border-bottom: 0.35mm solid #000; }
.part-n { font: 800 34mm/1 Inter, sans-serif; margin-top: 10mm; }
.part-h { font: 800 11mm/1.05 Inter, sans-serif; margin: 2mm 0 6mm; }
.part-intro { font-size: 3.9mm; line-height: 1.5; text-align: left; }
.part-list { margin-top: 6mm; border-top: 0.5mm solid #000; }
.part-list div { display: flex; align-items: baseline; font: 600 3.4mm/1 Inter, sans-serif; padding: 2.3mm 0; border-bottom: 0.3mm solid #ccc; }
.part-list span { font: 700 2.6mm "JetBrains Mono", monospace; width: 12mm; }
.part-list em { margin-left: auto; font: 600 2.5mm "JetBrains Mono", monospace; font-style: normal; }
.gloss dt { font: 700 3.1mm Inter, sans-serif; margin-top: 2mm; break-after: avoid; }
.gloss dd { margin: 0.4mm 0 0 0; }
.refs { list-style: none; margin-left: 0; }
.refs li { padding-left: 5mm; text-indent: -5mm; margin-bottom: 1.2mm; }
.credits-k { margin-top: 7mm; }
.small { font-size: 3mm; text-align: left; }
.colophon { margin-top: 6mm; color: #555; }
`;

// ---------- render: pass 1 finds the pages, pass 2 writes them into the contents
const html = n => `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${esc(BOOK.title)} — ${esc(BOOK.subtitle)}</title><style>${css}</style></head><body>${buildHtml().replace(/\{\{p:([^}]+)\}\}/g, (_, k) => String(n[k] ?? '00'))}</body></html>`;
const base = `sketch-what-you-see-handbook-${opt.page}`;
const htmlPath = join(opt.out, `${base}.html`), pdf = join(opt.out, `${base}.pdf`);
const footer = `<div style="width:100%;font:8px Inter,sans-serif;color:#555;text-align:center;"><span class="pageNumber"></span></div>`;
const keys = ['intro', ...parts.flatMap(p => [`part-${p.n}`, ...lessons.filter(l => l.part === p.n).map(l => l.id)]), 'glossary', 'sources', 'credits'];
const reEsc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const pattern = k => k === 'intro' ? /\bINTRODUCTION\b/ : k === 'glossary' ? /\bGLOSSARY\b/ : k === 'sources' ? /SOURCES AND FURTHER READING/ : k === 'credits' ? /PICTURE CREDITS/
  : k.startsWith('part-') ? new RegExp(`PART ${k.slice(5)}\\s*·\\s*${reEsc(up(partName(Number(k.slice(5)))))}`) : new RegExp(`${reEsc(k)}\\s*·\\s*PART`);

const browser = await chromium.launch();
let numbers = {};
try {
  const page = await browser.newPage();
  for (let pass = 1; pass <= 3; pass++) {
    writeFileSync(htmlPath, html(numbers));
    await page.goto(pathToFileURL(htmlPath).href, { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    await page.pdf({ path: pdf, width: `${PAGE.w}mm`, height: `${PAGE.h}mm`, printBackground: true, displayHeaderFooter: true, headerTemplate: '<span></span>', footerTemplate: footer,
      margin: { top: `${PAGE.m[0]}mm`, right: `${PAGE.m[1]}mm`, bottom: `${PAGE.m[2]}mm`, left: `${PAGE.m[3]}mm` } });
    const pages = execFileSync('pdftotext', ['-enc', 'UTF-8', pdf, '-']).toString().split('\f');
    const found = {}; let from = 1;
    for (const k of keys) {
      const re = pattern(k); let i = from;
      while (i < pages.length && !re.test(pages[i])) i++;
      if (i >= pages.length) throw new Error(`could not find ${k} in the PDF`);
      found[k] = i + 1; from = i;
    }
    const same = keys.every(k => found[k] === numbers[k]);
    numbers = found;
    if (same) { console.log(`pagination settled after pass ${pass}`); break; }
  }
  const nPages = execFileSync('pdfinfo', [pdf]).toString().match(/Pages:\s+(\d+)/)[1];
  const thumbs = join(opt.out, 'thumbs'); rmSync(thumbs, { recursive: true, force: true }); mkdirSync(thumbs, { recursive: true });
  execFileSync('pdftoppm', ['-r', '40', '-png', pdf, join(thumbs, 'p')]);
  const files = readdirSync(thumbs).filter(f => f.endsWith('.png')).sort().map(f => join(thumbs, f));
  execFileSync('montage', [...files, '-tile', '10x', '-geometry', '+5+5', '-background', '#ddd', join(opt.out, `contact-${opt.page}.png`)]);
  console.log(`wrote ${pdf} (${nPages} pages) and contact-${opt.page}.png`);
} finally {
  await browser.close();
}
