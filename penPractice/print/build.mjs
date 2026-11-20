// Builds the "Clear & Quick Print" handwriting workbook PDF from lessons.mjs and strokes.mjs.
//
//   node build.mjs [--page eink|letter|a4] [--out DIR] [--refs]
//
// --page eink (default): 157.5 × 210 mm, true size on Kindle Scribe 2022/2024 and reMarkable 2.
// Every lesson unit is one sheet: instructions on the front (odd page), practice on the back (even page),
// so it prints double-sided as loose leaf and reads front → back on an e-reader. No link navigation.
// All letters are drawn from the stroke model in strokes.mjs (stroke order, direction, start dots).
// Part plates use the pencil-sketch generator (../../sketchArt/sketch.mjs), generated once into DIR/refs.
// Writes DIR/clear-quick-print-<page>.pdf, a contact sheet of every page and a front/back preview of six sheets.
// Requires: playwright (Chromium), ImageMagick (montage).

import { createRequire } from 'node:module';
import { existsSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { resolve, join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { glyph, GAP } from './strokes.mjs';
import { book, parts, lessons, talk } from './lessons.mjs';

const { chromium } = createRequire(import.meta.url)('playwright');
const HERE = dirname(fileURLToPath(import.meta.url));
const SKETCH = resolve(HERE, '../../sketchArt/sketch.mjs');

const opt = { page: 'eink', out: resolve(HERE, '../out/print'), refs: false };
const argv = process.argv.slice(2);
for (let i = 0; i < argv.length; i++) {
  if (argv[i] === '--page') opt.page = argv[++i];
  else if (argv[i] === '--out') opt.out = resolve(argv[++i]);
  else if (argv[i] === '--refs') opt.refs = true;
}
const PAGES = { eink: { w: 157.5, h: 210, pad: 9 }, letter: { w: 215.9, h: 279.4, pad: 13 }, a4: { w: 210, h: 297, pad: 13 } };
const PAGE = PAGES[opt.page];
if (!PAGE) { console.error(`unknown --page ${opt.page}`); process.exit(1); }
const HEAD = 19, FOOT = 9;
const AW = PAGE.w - 2 * PAGE.pad;                        // content width (mm)
const AH = PAGE.h - 2 * PAGE.pad - HEAD - FOOT;          // content height (mm)
const PH = AH - 14;                                       // practice area height on the back of a sheet
const INK = '#000', TRACE = '#b0b0b0', RULE = '#8a8a8a', BODY = '#d0d0d0';

// ---------- small helpers
const f = n => (+n).toFixed(2);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const svg = (w, h, body, cls = '') => `<svg class="${cls}" viewBox="0 0 ${f(w)} ${f(h)}" width="${f(w)}mm" height="${f(h)}mm" xmlns="http://www.w3.org/2000/svg">${body}</svg>`;
const ln = (x1, y1, x2, y2, { c = INK, w = 0.35, dash = '' } = {}) => `<line x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}" stroke="${c}" stroke-width="${w}" ${dash ? `stroke-dasharray="${dash}"` : ''} stroke-linecap="round"/>`;
const pd = P => `M${P.map(p => `${f(p[0])} ${f(p[1])}`).join(' L')}`;
const path = (d, { c = INK, w = 0.35, dash = '', fill = 'none' } = {}) => `<path d="${d}" stroke="${c}" stroke-width="${w}" fill="${fill}" ${dash ? `stroke-dasharray="${dash}"` : ''} stroke-linecap="round" stroke-linejoin="round"/>`;
const rect = (x, y, w, h, { c = INK, w: sw = 0.35, dash = '', fill = 'none' } = {}) => `<rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" stroke="${c}" stroke-width="${sw}" fill="${fill}" ${dash ? `stroke-dasharray="${dash}"` : ''}/>`;
const dotc = (x, y, r, c = INK) => `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="${c}"/>`;
const odot = (x, y, r) => `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="#fff" stroke="${INK}" stroke-width="${f(Math.max(0.2, r * 0.45))}"/>`;
const txt = (x, y, s, { size = 2.4, c = '#333', anchor = 'start', mono = true, weight = 500 } = {}) =>
  `<text x="${f(x)}" y="${f(y)}" font-family="${mono ? 'JetBrains Mono' : 'Inter'}" font-size="${size}" font-weight="${weight}" fill="${c}" text-anchor="${anchor}">${esc(s)}</text>`;
const arrowHead = (x, y, ang, s = 1.4, c = INK, w = 0.35) => path(`M${f(x - Math.cos(ang - 0.45) * s)} ${f(y - Math.sin(ang - 0.45) * s)} L${f(x)} ${f(y)} L${f(x - Math.cos(ang + 0.45) * s)} ${f(y - Math.sin(ang + 0.45) * s)}`, { c, w });
const sum = a => a.reduce((s, v) => s + v, 0);

// ---------- the book's hand: letters drawn from the stroke model (mm; y0 = top line, C = cap height)
const gOf = ch => (typeof ch === 'string' ? glyph(ch) : ch);
const strokesAt = (ch, x, y0, C) => gOf(ch).strokes.map(st => st.map(([u, v]) => [x + u * C, y0 + v * C]));
function drawGlyph(ch, x, y0, C, mode) {
  const S = strokesAt(ch, x, y0, C);
  const wi = Math.max(0.32, C * 0.055), wt = Math.max(0.55, C * 0.085), r = Math.max(0.32, C * 0.045);
  let s = '';
  S.forEach((P, k) => {
    const [px, py] = P[0];
    if (mode === 'ink') s += P.length === 1 ? dotc(px, py, wi * 0.9) : path(pd(P), { w: wi });
    else if (mode === 'ghost') s += (P.length === 1 ? dotc(px, py, wt * 0.6, TRACE) : path(pd(P), { c: TRACE, w: wt })) + dotc(px, py, r * 0.75);
    else if (mode === 'dots') {
      if (P.length === 1) { s += odot(px, py, r); return; }
      const L = plen(P), n = Math.max(2, Math.round(L / Math.max(1.05, C * 0.12)));
      for (let i = 1; i <= n; i++) { const q = trimPath(P, 0, L * i / n).at(-1); s += dotc(q[0], q[1], Math.max(0.17, C * 0.02), '#4a4a4a'); }
      s += dotc(px, py, r);
    }
    else if (mode === 'startdot' && k === 0) s += dotc(px, py, r);
  });
  return s;
}
// letter gap by shape: two straight sides need the most room, two rounds the least
const LEFT_ROUND = 'acdegoqsCGOQS0', RIGHT_ROUND = 'bcopesBDOPQS0';
const pairGap = (a, b) => GAP.letter * [1.15, 0.85, 0.6][(RIGHT_ROUND.includes(a) ? 1 : 0) + (LEFT_ROUND.includes(b) ? 1 : 0)];
function layout(text, C, { gapScale = 1, wordGap = GAP.word } = {}) {   // → [{ ch, x }] in mm from 0, plus width
  const out = []; let x = 0, prev = null;
  for (const ch of text) {
    if (ch === ' ') { if (prev) x += wordGap * C; prev = null; continue; }
    if (prev) x += pairGap(prev, ch) * gapScale * C;
    out.push({ ch, x }); x += glyph(ch).w * C; prev = ch;
  }
  return { items: out, w: x };
}
function writeText(text, x, y0, C, mode, o = {}) {
  const L = layout(text, C, o);
  return { s: L.items.map(it => drawGlyph(it.ch, x + it.x, y0 + (o.jitter ? o.jitter(it) : 0), C, mode)).join(''), w: L.w, items: L.items };
}
const textW = (text, C, o) => layout(text, C, o).w;
function wrap(text, C, maxW) {
  const lines = []; let cur = '';
  for (const word of text.split(' ')) { const t = cur ? `${cur} ${word}` : word; if (cur && textW(t, C) > maxW) { lines.push(cur); cur = word; } else cur = t; }
  if (cur) lines.push(cur);
  return lines;
}

// ---------- guide lines and writing rows
const STY = { four: ['top', 'mid', 'base', 'desc'], three: ['top', 'mid', 'base'], two: ['mid', 'base'], one: ['base'], none: [] };
const LINES = { top: [0, RULE, 0.22, ''], mid: [0.5, RULE, 0.22, '1.3 1'], base: [1, INK, 0.33, ''], desc: [1.45, '#b5b5b5', 0.22, '0.5 0.9'] };
function rules(x, w, y0, C, style) {
  return STY[style].map(k => { const [v, c, sw, d] = LINES[k]; return ln(x, y0 + v * C, x + w, y0 + v * C, { c, w: sw, dash: d }); }).join('');
}
const ext = style => (style === 'three' ? 1.08 : 1.45);
const rowH = (C, style) => 1.4 + C * ext(style) + Math.max(1.8, C * 0.3);
const row = (C, style, content = () => '', w = AW) => svg(w, rowH(C, style), rules(0, w, 1.4, C, style) + content(1.4), 'row');
const rows = (n, C, style, w = AW) => Array.from({ length: n }, () => row(C, style, () => '', w)).join('');
const fitC = (n, style, h, max = 10) => { let C = max; while (C > 5 && n * rowH(C, style) > h) C -= 0.1; return C; };
const spare = (n, C, style, h) => Math.max(0, Math.floor((h - n * rowH(C, style)) / rowH(C, style)));   // empty rows that still fit

// ---------- exemplar: big letters with numbered stroke starts and direction arrows
function trimPath(P, a, b) {                              // the part of polyline P between lengths a and b (mm)
  const out = []; let acc = 0;
  for (let i = 1; i < P.length; i++) {
    const [x0, y0] = P[i - 1], [x1, y1] = P[i], d = Math.hypot(x1 - x0, y1 - y0);
    const at = t => [x0 + (x1 - x0) * t, y0 + (y1 - y0) * t];
    if (acc + d >= a && acc <= b) {
      if (!out.length) out.push(at(Math.max(0, (a - acc) / (d || 1))));
      if (acc + d <= b) out.push([x1, y1]); else { out.push(at((b - acc) / (d || 1))); break; }
    }
    acc += d;
  }
  return out;
}
const plen = P => sum(P.slice(1).map((p, i) => Math.hypot(p[0] - P[i][0], p[1] - P[i][1])));
function exGlyph(ch, x, y0, C) {
  const S = strokesAt(ch, x, y0, C), body = Math.max(0.9, C * 0.12), r = Math.max(1.25, C * 0.072);
  let s = S.map(P => (P.length === 1 ? dotc(P[0][0], P[0][1], body * 0.75, BODY) : path(pd(P), { c: BODY, w: body }))).join('');
  S.forEach(P => {
    if (P.length < 2) return;
    const L = plen(P), closed = Math.hypot(P[0][0] - P.at(-1)[0], P[0][1] - P.at(-1)[1]) < 1;
    const Q = trimPath(P, Math.min(L * 0.25, 1.2), L - Math.min(L * 0.3, closed ? 4.5 : 1.4));
    if (Q.length < 2) return;
    const [a, b] = [Q.at(-2), Q.at(-1)];
    s += path(pd(Q), { w: 0.3 }) + arrowHead(b[0], b[1], Math.atan2(b[1] - a[1], b[0] - a[0]), 1.35, INK, 0.32);
  });
  const placed = S.filter(P => P.length === 1).map(P => P[0]);
  S.forEach((P, k) => {
    const p0 = P[0];
    let d = [-1, 0];
    if (P.length > 1) { const q = P[Math.min(P.length - 1, 2)]; const n = Math.hypot(q[0] - p0[0], q[1] - p0[1]) || 1; d = [(q[0] - p0[0]) / n, (q[1] - p0[1]) / n]; }
    const back = [-d[0], -d[1]], cands = [back, [-back[1], back[0]], [back[1], -back[0]], [0, -1], [1, -1], [-1, -1]];
    let pos = null;
    for (const c of cands) {
      const n = Math.hypot(c[0], c[1]), q = [p0[0] + c[0] / n * r * 1.75, p0[1] + c[1] / n * r * 1.75];
      if (placed.every(o => Math.hypot(o[0] - q[0], o[1] - q[1]) > r * 2.15)) { pos = q; break; }
    }
    if (!pos) pos = [p0[0] + r * 1.75, p0[1] - r * 1.75];
    placed.push(pos);
    s += `<circle cx="${f(pos[0])}" cy="${f(pos[1])}" r="${f(r)}" fill="#fff" stroke="${INK}" stroke-width="0.3"/>` + `<text x="${f(pos[0])}" y="${f(pos[1] + r * 0.48)}" font-family="Inter" font-size="${f(r * 1.35)}" font-weight="800" text-anchor="middle">${k + 1}</text>`;
  });
  return s;
}
function exemplar(chars, w, h, maxC = 20) {
  const arr = [...chars].filter(c => c !== ' '), GX = /[a-z]/.test(chars) ? 0.6 : 0.75, pad = 4.2;
  const plan = nr => {
    const per = Math.ceil(arr.length / nr), rs = [];
    for (let i = 0; i < arr.length; i += per) rs.push(arr.slice(i, i + per));
    const exts = rs.map(r => (r.some(c => 'gjpqy'.includes(c)) ? 1.45 : 1.1));
    let C = nr > 1 ? Math.min(maxC, 13.5) : maxC;
    for (const r of rs) C = Math.min(C, (w - 12) / (sum(r.map(c => glyph(c).w)) + GX * (r.length - 1)));
    C = Math.min(C, (h - pad * rs.length - 2) / sum(exts));
    return { rs, exts, C };
  };
  const p1 = plan(1), p2 = plan(2), p = p1.C >= Math.min(14, maxC) || p1.C >= p2.C ? p1 : p2;
  const used = sum(p.exts.map(e => pad + p.C * e));
  let y = 1, s = '';
  p.rs.forEach((r, i) => {
    const y0 = y + pad, rw = (sum(r.map(c => glyph(c).w)) + GX * (r.length - 1)) * p.C;
    s += rules(3, w - 6, y0, p.C, p.exts[i] > 1.2 ? 'four' : 'three');
    let x = (w - rw) / 2;
    for (const c of r) { s += exGlyph(c, x, y0, p.C); x += (glyph(c).w + GX) * p.C; }
    y = y0 + p.C * p.exts[i];
  });
  return { s, h: used + 3 };
}
const exSvg = (chars, w, h, maxC) => { const e = exemplar(chars, w, h, maxC); return svg(w, e.h, e.s); };
const sayGrid = chars => `<div class="say-h">Say it as you write</div><div class="say">${[...chars].map(c => `<div><b>${esc(c)}</b><span>${esc(talk[c] || '')}</span></div>`).join('')}</div>`;

// ---------- instruction-page diagrams (w × h mm)
const lbl = (x, y, s, anchor = 'start', size = 2.3) => `<text x="${f(x)}" y="${f(y)}" font-family="JetBrains Mono" font-size="${size}" font-weight="700" fill="#000" text-anchor="${anchor}" paint-order="stroke" stroke="#fff" stroke-width="0.9">${esc(s)}</text>`;
const D = {
  setup(w, h) {
    const C = Math.min(22, (h - 8) / 1.45), y0 = 3, lw = w * 0.6;
    let s = rules(0, lw, y0, C, 'four') + writeText('Hhxg', 3, y0, C, 'ink').s;
    [['top line', 0], ['dashed middle line', 0.5], ['baseline', 1], ['descender line', 1.45]].forEach(([t, v]) => { s += lbl(lw - 1, y0 + v * C - 0.8, t, 'end', 2.2); });
    const tilt = (cx, deg, name) => {
      const pw = 15, ph = 20;
      let g = rect(-pw / 2, -ph / 2, pw, ph, { w: 0.4, fill: '#fff' });
      for (let k = 1; k < 6; k++) g += ln(-pw / 2 + 1.5, -ph / 2 + k * 3.2, pw / 2 - 1.5, -ph / 2 + k * 3.2, { c: RULE, w: 0.2 });
      return `<g transform="translate(${f(cx)} ${f(h * 0.44)}) rotate(${deg})">${g}</g>` + lbl(cx, h - 3, name, 'middle', 2.2);
    };
    const rx = lw + (w - lw) / 2;
    return s + tilt(rx - 10, -20, 'right hand') + tilt(rx + 11, 20, 'left hand');
  },
  lpm(w, h) {
    const C = 6, lines = wrap(book.sentence, C, w - 8);
    let s = '', y = 2;
    for (const t of lines) { s += rules(2, w - 4, y, C, 'two') + writeText(t, 4, y, C, 'ink').s; y += C * 1.45 + 1.6; }
    const tx = 4;
    s += txt(tx, y + 4.5, `one sentence = ${book.sentenceLetters} letters (spaces and the full stop don’t count)`, { size: 2.45, c: '#000' });
    s += txt(tx, y + 9.5, 'letters written in the fast minute = letters per minute', { size: 2.45, c: '#000', weight: 700 });
    s += txt(tx, y + 14.5, `example: 2 whole sentences + “The quick” = 35 + 35 + 8 = 78`, { size: 2.45, c: '#444' });
    return s;
  },
  capsReview(w, h) {
    const rowsT = ['ABCDEFGHIJKLM', 'NOPQRSTUVWXYZ', '0123456789'];
    const C = Math.min(9.5, (h - 4) / (rowsT.length * 1.42), ...rowsT.map(t => (w - 8) / (textW(t.split('').join(' '), 1, { wordGap: 0.42 }))));
    let s = '', y = 2;
    for (const t of rowsT) { s += rules(2, w - 4, y, C, 'three') + writeText(t.split('').join(' '), 4, y, C, 'ink', { wordGap: 0.42 }).s; y += C * 1.42; }
    return s;
  },
  letterSpace(w, h) {
    const C = Math.min(9, (h - 4) / (3 * 1.62)), word = 'million';
    let s = '', y = 2;
    [['too tight', 0.15], ['even', 1], ['too loose', 2.6]].forEach(([name, g]) => {
      s += rules(30, w - 32, y, C, 'two') + lbl(2, y + C * 0.95, name, 'start', 2.4) + writeText(word, 34, y, C, 'ink', { gapScale: g }).s;
      y += C * 1.62;
    });
    return s;
  },
  wordSpace(w, h) {
    const C = Math.min(8, (h - 4) / (3 * 1.62)), t = 'see you at six';
    let s = '', y = 2;
    [['too tight', 0.22, false], ['one o', GAP.word, true], ['too wide', 1.5, false]].forEach(([name, g, o]) => {
      s += rules(30, w - 32, y, C, 'two') + lbl(2, y + C * 0.95, name, 'start', 2.4);
      const W = writeText(t, 34, y, C, 'ink', { wordGap: g });
      s += W.s;
      if (o) for (let i = 1; i < W.items.length; i++) { const a = W.items[i - 1], b = W.items[i]; const gap = b.x - (a.x + glyph(a.ch).w * C); if (gap > C * 0.4) s += `<ellipse cx="${f(34 + a.x + glyph(a.ch).w * C + gap / 2)}" cy="${f(y + C * 0.75)}" rx="${f(C * 0.2)}" ry="${f(C * 0.22)}" fill="none" stroke="${TRACE}" stroke-width="0.35" stroke-dasharray="0.8 0.6"/>`; }
      y += C * 1.62;
    });
    return s;
  },
  onLine(w, h) {
    const C = Math.min(9, (h - 6) / (2 * 1.75)), t = 'running late';
    let s = '', y = 2;
    const jig = it => (Math.sin(it.x * 1.7 + 1) * 0.16) * C;
    s += rules(34, w - 36, y, C, 'four') + lbl(2, y + C * 0.95, 'floating', 'start', 2.4) + lbl(2, y + C * 0.95 + 3.2, 'and sinking', 'start', 2.4) + writeText(t, 38, y, C, 'ink', { jitter: jig }).s;
    y += C * 1.75;
    s += rules(34, w - 36, y, C, 'four') + lbl(2, y + C * 0.95, 'on the line', 'start', 2.4) + writeText(t, 38, y, C, 'ink').s;
    return s;
  },
  noLines(w, h) {
    const cw = w * 0.56, ch = h - 6, C = 5.2;
    let s = rect(2, 2, cw, ch, { w: 0.4 });
    ['Back at six -', 'dinner is in', 'the oven.'].forEach((t, i) => {
      const yb = 10 + i * 11;
      s += ln(5, yb + 0.2, 7.5, yb + 0.2, { c: RULE, w: 0.25 }) + ln(cw - 3.5, yb + 0.2, cw - 1, yb + 0.2, { c: RULE, w: 0.25 });
      s += writeText(t, 9, yb - C, C, 'ink').s;
    });
    s += lbl(cw / 2 + 2, ch - 1, 'two tiny marks = one level line', 'middle', 2.1);
    const x2 = cw + 8, w2 = w - x2 - 2;
    s += rect(x2 + 2.5, 5, w2 - 2.5, ch - 6, { c: RULE, w: 0.25 });
    for (let k = 1; k < 8; k++) s += ln(x2 + 3.5, 5 + k * 5.2, x2 + w2 - 1, 5 + k * 5.2, { c: '#c4c4c4', w: 0.25 });
    s += rect(x2, 2, w2 - 2.5, ch - 6, { w: 0.4, fill: 'rgba(255,255,255,0.55)' });
    s += lbl(x2 + w2 / 2, ch - 1, 'ruled sheet underneath', 'middle', 2.1);
    return s;
  },
  speed(w, h) {
    let s = '', y = 2;
    [[10, 'practice size'], [7, 'smaller'], [5, 'everyday size']].forEach(([C, name]) => {
      s += rules(2, w - 4, y, C, 'two') + writeText('quick notes', 4, y, C, 'ink').s + lbl(w - 3, y + C * 0.95, name, 'end', 2.4);
      y += C * 1.45 + 3;
    });
    return s;
  },
  pangram(w, h) {
    const C = 6, lines = wrap('Jackdaws love my big sphinx of quartz.', C, w - 8);
    let s = '', y = 2;
    for (const t of lines) { s += rules(2, w - 4, y, C, 'two') + writeText(t, 4, y, C, 'ink').s; y += C * 1.45 + 1.6; }
    s += txt(4, y + 5, 'a b c d e f g h i j k l m n o p q r s t u v w x y z', { size: 2.6, c: '#000', weight: 700 });
    s += txt(4, y + 10, 'every letter of the alphabet, at least once', { size: 2.4, c: '#444' });
    return s;
  },
  forms(w, h) {
    let s = '';
    const box = 5, field = (y, name, val, n) => {
      let g = lbl(2, y + box * 0.72, name, 'start', 2.2);
      for (let i = 0; i < n; i++) g += rect(22 + i * box, y, box, box * 1.25, { w: 0.3 });
      [...val].forEach((c, i) => { if (c !== ' ') g += drawGlyph(c, 22 + i * box + (box - glyph(c).w * 4) / 2, y + 1.1, 4, 'ink'); });
      return g;
    };
    s += field(3, 'NAME', 'SAM LEE', 10) + field(11, 'DATE', '12/05/27', 10) + field(19, 'PHONE', '0181 5550', 10);
    const x2 = 22 + 10 * box + 8, C = 5;
    ['2 lemons', 'rice', 'dish soap', 'stamps'].forEach((t, i) => { const y = 3 + i * 10; s += ln(x2, y + C, w - 2, y + C, { w: 0.3 }) + writeText(t, x2 + 1, y, C, 'ink').s; });
    s += lbl(22 + 5 * box, h - 2, 'forms: capitals, one per box', 'middle', 2.1) + lbl((x2 + w) / 2, h - 2, 'lists: one item per line', 'middle', 2.1);
    return s;
  },
  confusions(w, h) {
    const items = [['a d', 'close a at the top'], ['u v', 'u has a stem'], ['n h', 'only h is tall'], ['1 l I', 'flag, plain, bars'], ['0 O', '0 is narrow'], ['5 S', '5 has a flat hat']];
    const cw = w / 3, C = Math.min(9, (h - 8) / 2 / 1.65);
    let s = '';
    items.forEach(([p, note], i) => {
      const cx = (i % 3) * cw, y = 2 + Math.floor(i / 3) * (h / 2);
      s += rules(cx + 2, cw - 4, y, C, 'four') + writeText(p, cx + 4, y, C, 'ink', { wordGap: 0.6 }).s + lbl(cx + 3, y + C * 1.45 + 3.4, note, 'start', 2.1);
    });
    return s;
  },
  compare(w, h) {
    const pw = 26, ph = 34, y = 4;
    const sheetIcon = (x, name) => {
      let g = rect(x, y, pw, ph, { w: 0.4, fill: '#fff' });
      for (let k = 0; k < 6; k++) g += ln(x + 3, y + 7 + k * 4.4, x + pw - 3, y + 7 + k * 4.4, { c: RULE, w: 0.25 });
      g += writeText('The quick', x + 3, y + 2.2, 3.2, 'ink').s;
      return g + lbl(x + pw / 2, y + ph + 4.5, name, 'middle', 2.4);
    };
    const xa = w / 2 - pw - 14, xb = w / 2 + 14;
    let s = sheetIcon(xa, 'day one') + sheetIcon(xb, 'today');
    s += ln(xa + pw + 3, y + ph / 2 - 2, xb - 3, y + ph / 2 - 2, { w: 0.4 }) + arrowHead(xb - 3, y + ph / 2 - 2, 0) + ln(xb - 3, y + ph / 2 + 2, xa + pw + 3, y + ph / 2 + 2, { w: 0.4 }) + arrowHead(xa + pw + 3, y + ph / 2 + 2, Math.PI);
    s += lbl(w / 2, y + ph / 2 + 8, 'side by side', 'middle', 2.2);
    return s;
  },
};

// ---------- practice pages (backs)
function letterRows(chars, words, help) {
  const lower = /[a-z]/.test(chars), style = lower ? 'four' : 'three';
  const arr = [...chars];
  let ws = words.slice();
  while (ws.length > 1 && fitC(arr.length + ws.length, style, PH - 2) < 8) ws.pop();
  const C = fitC(arr.length + ws.length, style, PH - 2);
  let html = '';
  for (const ch of arr) html += row(C, style, y0 => {
    let x = 2, s = '';
    for (const m of [...Array(help.ghost).fill('ghost'), ...Array(help.dots).fill('dots')]) { s += drawGlyph(ch, x, y0, C, m); x += (glyph(ch).w + 0.85) * C; }
    return s;
  });
  for (const wd of ws) html += row(C, style, y0 => {
    let x = 2, s = '';
    for (const m of help.words) { const t = writeText(wd, x, y0, C, m); s += t.s; x += t.w + 1.3 * C; }
    return s;
  });
  return html + rows(spare(arr.length + ws.length, C, style, PH - 2), C, style);
}
const WARM = [
  ['tall pulls', { w: 0.1, strokes: [[[0, 0], [0, 1]]] }], ['short pulls', { w: 0.1, strokes: [[[0, 0.5], [0, 1]]] }],
  ['slants', { w: 0.32, strokes: [[[0.32, 0], [0, 1]]] }], ['slants', { w: 0.32, strokes: [[[0, 0], [0.32, 1]]] }],
  ['points', 'v'], ['rounds', 'c'], ['circles', 'o'], ['humps', 'n'], ['cups', 'u'],
];
function warmups(help) {
  const C = fitC(WARM.length, 'three', PH - 2);
  return WARM.map(([, g]) => row(C, 'three', y0 => {
    let x = 2.5, s = '';
    for (const m of [...Array(help.ghost).fill('ghost'), ...Array(help.dots).fill('dots')]) { s += drawGlyph(g, x, y0, C, m); x += (gOf(g).w + 0.7) * C; }
    return s;
  })).join('');
}
const lined = (n, pitch = 9, w = AW) => svg(w, n * pitch + 1, Array.from({ length: n }, (_, i) => ln(0, (i + 1) * pitch, w, (i + 1) * pitch, { c: '#555', w: 0.25 })).join(''), 'lined');
function sample(final) {
  const C = 6, lines = wrap(book.sentence, C, AW - 6);
  const model = lines.map(t => row(C, 'two', y0 => writeText(t, 2, y0, C, 'ink').s)).join('');
  const rec = final
    ? `<table class="rec"><tr><th></th><th>day one</th><th>today</th><th>change</th></tr><tr><td>careful: seconds</td><td></td><td></td><td></td></tr><tr><td>fast minute: letters per minute</td><td></td><td></td><td></td></tr><tr><td>words misread</td><td></td><td></td><td></td></tr></table>`
    : `<table class="rec"><tr><td>careful: seconds</td><td></td><td>fast minute: letters per minute</td><td></td></tr><tr><td>words misread</td><td></td><td>date</td><td></td></tr></table>`;
  return `<div class="sl">Copy this sentence:</div>${model}
    <div class="sl"><b>1 · Everyday</b> — the way you normally write</div>${lined(2)}
    <div class="sl"><b>2 · Careful</b> — your neatest. Seconds it took: ______</div>${lined(2)}
    <div class="sl"><b>3 · Fast minute</b> — 60-second timer: write it again and again</div>${lined(final ? 4 : 5)}
    <div class="sl"><b>Record</b></div>${rec}`;
}
function wordRows(words) {
  const C = fitC(words.length * 1.5, 'three', PH - 4, 9);
  return words.map(wd => {
    let C1 = C; while (textW(wd, C1) > AW - 6 && C1 > 5) C1 -= 0.2;
    const lines = textW(wd, C) > AW / 2 - 4 ? 1 : 0;
    return row(C1, 'three', y0 => { const t = writeText(wd, 2, y0, C1, 'ghost'); return t.s + (lines ? '' : writeText(wd, t.w + 2 + 1.2 * C1, y0, C1, 'dots').s); }) + (lines ? row(C1, 'three') : '');
  }).join('');
}
function spaceRows(words, again) {
  const n = words.length + 1, C = fitC(n, 'four', PH - 8, 9);
  return words.map(wd => row(C, 'four', y0 => {
    let x = 2, s = '';
    for (const m of again ? ['dots'] : ['ghost', 'dots']) { const t = writeText(wd, x, y0, C, m); s += t.s; x += t.w + 1.6 * C; }
    return s;
  })).join('') + `<div class="sl">Your own words — straights, rounds, both:</div>` + rows(Math.max(1, spare(words.length, C, 'four', PH - 9)), C, 'four');
}
function sentenceRows(sentences, again) {
  const C0 = 6.8;
  return sentences.map(t => {
    let C = C0; while (textW(t, C) > AW - 4 && C > 4.8) C -= 0.1;
    const model = row(C, 'two', y0 => {
      const W = writeText(t, 2, y0, C, again ? 'dots' : 'ghost');
      let s = W.s;
      if (!again) for (let i = 1; i < W.items.length; i++) { const a = W.items[i - 1], b = W.items[i], gap = b.x - (a.x + glyph(a.ch).w * C); if (gap > C * 0.4) s += `<ellipse cx="${f(2 + a.x + glyph(a.ch).w * C + gap / 2)}" cy="${f(y0 + C * 0.75)}" rx="${f(C * 0.2)}" ry="${f(C * 0.22)}" fill="none" stroke="${TRACE}" stroke-width="0.3" stroke-dasharray="0.7 0.5"/>`; }
      return s;
    });
    return model + row(C, 'two');
  }).join('');
}
function fadingLines(text, again) {
  const [c1, c2, c3] = again ? [6.5, 5.8, 5.2] : [7.5, 6.5, 6];
  const ghost = wrap(text, c1, AW - 4).map(t => row(c1, 'four', y0 => writeText(t, 2, y0, c1, 'ghost').s)).join('');
  return `<div class="sl"><b>Four lines</b> — trace, then copy</div>${ghost}${rows(1, c1, 'four')}
    <div class="sl"><b>Two lines</b> — imagine the top line</div>${rows(3, c2, 'two')}
    <div class="sl"><b>One line</b> — imagine the dashed line too</div>${rows(3, c3, 'one')}`;
}
function blankRows(sentences) {
  return sentences.map(t => `<div class="sl">${svg(AW, 8, writeText(t, 0, 1, 5.2, 'ink').s)}</div><div class="frame" style="height:21mm"></div>`).join('') +
    `<div class="sl">Anything you like — a note, a quote, today’s date:</div><div class="frame grow"></div>`;
}
function timedRows(text, again) {
  const C = 6;
  const trial = k => `<div class="sl"><b>Trial ${k}</b> · 30 seconds <span class="tally">letters ______ × 2 = ______ per minute</span></div>${rows(2, C, 'two')}`;
  return `<div class="sl">Write this again and again until the timer stops:</div>${svg(AW, 8, writeText(text, 0, 1, 5, 'ink').s)}${[1, 2, 3, 4].map(trial).join('')}
    <div class="sl"><b>Best</b> ______ per minute${again ? ' · last time ______' : ''}</div>`;
}
function pangramRows(texts) {
  let C = 7.5;
  const need = c => texts.reduce((a, t) => a + wrap(t, c, AW - 4).length * 2 + 1, 0) * rowH(c, 'two');
  while (C > 5.2 && need(C) > PH - 4) C -= 0.1;
  return texts.map(t => { const ls = wrap(t, C, AW - 4); return ls.map(l => row(C, 'two', y0 => writeText(l, 2, y0, C, 'ghost').s)).join('') + rows(ls.length + 1, C, 'two'); }).join('');
}
function copyModels() {
  const C = 5.4, cw = (AW - 6) / 2;
  const pair = items => `<div class="cm">${[true, false].map(m => `<div>${items.map(t => row(C, 'one', y0 => (m ? writeText(t, 1, y0, C, 'ink').s : ''), cw)).join('')}</div>`).join('')}</div>`;
  const form = (name, val) => { const n = 17, b = 6; let g = lbl(0, 6.2, name, 'start', 2.3); for (let i = 0; i < n; i++) g += rect(20 + i * b, 0.5, b, 7.5, { w: 0.3 }); [...val].forEach((c, i) => { if (c !== ' ') g += drawGlyph(c, 20 + i * b + (b - glyph(c).w * 4.6) / 2, 1.9, 4.6, 'ink'); }); return svg(AW, 9, g); };
  return `<div class="sl"><b>A list</b> — copy it in the right-hand column</div>${pair(['2 lemons', 'rice', 'dish soap', 'stamps'])}
    <div class="sl"><b>A message</b></div>${pair(['Sam called at 3:15.', 'The car is ready -', 'call 0181 555 0123.'])}
    <div class="sl"><b>A form</b> — copy each line in the empty boxes below it</div>${form('NAME', 'SAM LEE')}${form('', '')}${form('DATE', '12/05/2027')}${form('', '')}`;
}
function confusions(pairs) {
  const C = 7.5, cw = (AW - 4) / 2, half = Math.ceil(pairs.length / 2);
  const cell = ([p, note]) => svg(cw, rowH(C, 'four') + 3, txt(0, 2.4, note, { size: 2.2, c: '#444' }) + rules(0, cw, 4.2, C, 'four') + writeText(p, 1.5, 4.2, C, 'ghost', { wordGap: 0.7 }).s);
  return `<div class="cf">${[0, 1].map(c => `<div>${pairs.slice(c * half, (c + 1) * half).map(cell).join('')}</div>`).join('')}</div>
    <div class="sl">Your own trouble letters (from the read-back):</div>${rows(4, C, 'four')}`;
}

// use-it blocks
function useBlocks(blocks) {
  return blocks.map(b => {
    if (b.form) {
      const n = Math.floor((AW - 24) / 6.2);
      return `<div class="sl"><b>A form</b> — capitals, one per box</div>` + b.form.map(name => { let g = lbl(0, 6.4, name, 'start', 2.2); for (let i = 0; i < n; i++) g += rect(23 + i * 6.2, 0.5, 6.2, 8, { w: 0.3 }); return svg(AW, 10, g); }).join('');
    }
    if (b.record) return `<div class="sl"><b>Read-back</b></div>` + b.record.map(t => `<div class="recl"><span>${esc(t)}</span><i></i></div>`).join('');
    if (b.blank === 'envelope') return `<div class="sl"><b>${esc(b.label)}</b></div>` + svg(AW, 52, rect(1, 1, AW - 2, 50, { w: 0.4 }) + rect(AW - 21, 5, 16, 19, { c: RULE, w: 0.3, dash: '1 0.8' }) + lbl(AW - 13, 15.5, 'stamp', 'middle', 2));
    if (b.blank === 'notes') return `<div class="sl"><b>${esc(b.label)}</b></div><div class="notes">${[0, 1, 2].map(() => '<div></div>').join('')}</div>`;
    if (b.blank === 'card') return `<div class="sl"><b>${esc(b.label)}</b></div><div class="frame grow"></div>`;
    const C = b.C || 8, style = b.style || (/[a-z]/.test(b.model || 'a') ? 'two' : 'three');
    let Cm = C; while (b.model && textW(b.model, Cm) > AW - 4 && Cm > 4.5) Cm -= 0.1;
    return `<div class="sl"><b>${esc(b.label)}</b></div>` + (b.model ? row(Cm, style, y0 => writeText(b.model, 2, y0, Cm, 'ghost').s) : '') + rows(b.rows || 2, C, style);
  }).join('');
}

// ---------- pages: sheets, instructions on the front and practice on the back
const pageList = [];
const pageOf = {};
const partName = n => parts.find(p => p.n === n).name;
const legend = () => `<div class="legend">${svg(42, 9, drawGlyph('a', 3, 0.6, 7, 'ghost') + drawGlyph('a', 18, 0.6, 7, 'dots') + rect(32, 3.3, 9, 4.6, { c: '#6f6f6f', w: 0.35 }) + txt(11.5, 7, '→', { size: 2.6 }) + txt(26.5, 7, '→', { size: 2.6 }))}<div class="lg-t"><span>trace</span><span>dots</span><span>free</span></div></div>`;
const head = (l, kind, extra = '') => `<header class="head${extra ? ' has-legend' : ''}"><div class="kick">PART ${l.part} · ${esc(partName(l.part).toUpperCase())} <b>${l.id}</b></div><div class="ttl">${esc(l.title)}</div><div class="kind">${kind}</div>${extra}</header>`;
const list = (items, cls = '') => `<ul class="${cls}">${items.map(c => `<li>${esc(c)}</li>`).join('')}</ul>`;
const checkBox = items => `<div class="vbox"><b>Check yourself</b>${list(items)}</div>`;
const slipBox = s => `<div class="slip"><b>Common slip</b> ${esc(s)}</div>`;
const whyBox = s => `<div class="why"><b>Why it works</b> ${esc(s)}</div>`;
const steps = (items, h = 'Do this') => `<div class="steps-h">${h}</div><ol class="steps">${items.map(s => `<li>${esc(s)}</li>`).join('')}</ol>`;
const habitFull = () => `<div class="habit use">${book.habit.map((s, i) => `<div><b>${i + 1}</b><span>${s}</span><em>${esc(book.habitNotes[i])}</em></div>`).join('')}</div>`;
const habitMini = () => `<div class="habit mini">${book.habit.map((s, i) => `<div><b>${i + 1}</b><span>${s}</span></div>`).join('')}</div>`;

function page(side, cls, body, { id = '', label = '', hints = true } = {}) {
  const n = pageList.length + 1;
  if (id) pageOf[id] = n;
  const hint = !hints ? '' : side === 'front' ? 'practice overleaf ▸' : side === 'back' ? '◂ instructions overleaf' : '';
  const footer = side === 'cover' || side === 'backcover' ? '' : `<footer class="foot ${n % 2 ? 'odd' : 'even'}"><span class="pn">${n}</span><span class="fl-mid">${esc(label)}</span><span class="hint">${hint}</span></footer>`;
  pageList.push(`<section class="page ${side} ${cls}"${id ? ` id="${id}"` : ''}>${body}${footer}</section>`);
}
function sheet(front, back) {                              // front always lands on an odd page: one printed sheet
  if ((pageList.length + 1) % 2 !== 1) throw new Error(`sheet would start on even page ${pageList.length + 1}`);
  page(front[3] || 'front', front[0], front[1], front[2]); page(back[3] || 'back', back[0], back[1], back[2]);
}

function makeRefs() {
  const dir = join(opt.out, 'refs');
  for (const seed of [41, 42]) if (opt.refs || !existsSync(join(dir, `diner-${seed}.png`))) execFileSync('node', [SKETCH, '--seed', String(seed), '--no-notes', '--out', dir], { stdio: 'inherit' });
  return (scene, seed, width) => `<div class="ref" style="width:${f(width)}mm"><img src="refs/${scene}-${seed}.png"/></div>`;
}
const noteSvg = (lines, C = 6) => lines.map(t => row(C, 'two', y0 => writeText(t, 2, y0, C, 'ink').s)).join('');

function buildPages(img) {
  const fade = svg(AW, rowH(10, 'four') + 4, rules(0, AW, 1.4, 10, 'four') + [0, 1].map(i => drawGlyph('a', 3 + i * 9, 1.4, 10, 'ghost')).join('') + [2, 3].map(i => drawGlyph('a', 3 + i * 9, 1.4, 10, 'dots')).join('') + writeText('a', 3 + 4 * 9, 1.4, 10, 'ink').s + lbl(10.5, rowH(10, 'four') + 2.5, 'trace', 'middle') + lbl(28.5, rowH(10, 'four') + 2.5, 'dots', 'middle') + lbl(41, rowH(10, 'four') + 2.5, 'free →', 'start'));
  const coverBody = `<div class="cv-series">${esc(book.series)}</div><div class="cv-title">${esc(book.title)}</div><div class="cv-sub">${esc(book.subtitle)}</div>
    <div class="cv-ex">${exSvg('AaGg', AW, 50, 28)}</div>
    <div class="cv-model">${noteSvg(wrap(book.sentence, 8, AW - 6), 8)}</div><div class="cv-fade">${fade}</div>
    <div class="cv-meta">23 lessons · capitals → lowercase → spacing → speed</div><div class="cv-dev">For Kindle Scribe, reMarkable, pen tablets and loose-leaf print — write directly on the pages</div>`;
  const howBody = `<div class="h-title">How this book works</div>
    <div class="h-lead">Every lesson comes as a sheet: read the front, write on the back.</div>
    <div class="spread-demo"><div><b>Front</b><span>the letters with stroke order and direction, the steps, what to check, the common slip and why it works</span></div><div><b>Back</b><span>the practice rows, with help that fades</span></div></div>
    <div class="h-note">Printed double-sided, every sheet stands on its own — pull it out, take it with you, or print it again for more practice. On an e-reader, the practice is the next page and the instructions are one swipe back.</div>
    <div class="h-lead">Four rules run through every letter:</div>
    <div class="habit">${book.habit.map((s, i) => `<div><b>${i + 1}</b><span>${s}</span><em>${esc(book.habitNotes[i])}</em></div>`).join('')}</div>
    <div class="h-lead">The guide lines:</div>${svg(AW, 18.5, rules(0, AW * 0.62, 2, 10, 'four') + writeText('Hhxg', 2, 2, 10, 'ink').s + [['top line', 0], ['dashed middle', 0.5], ['baseline', 1], ['descender', 1.45]].map(([t, v]) => lbl(AW * 0.62 + 2, 2 + v * 10 + 0.9, t, 'start', 2.3)).join(''))}
    <div class="h-lead">Each lesson has up to three sheets:</div>
    <table class="kinds"><tr><td><b>Practice</b></td><td>row by row, with help that fades</td></tr><tr><td><b>Repeat</b></td><td>the same skill with less help, for another day</td></tr><tr><td><b>Use it</b></td><td>real writing: numbers, labels, forms, cards, notes</td></tr></table>
    <div class="h-lead">Help fades on every practice row:</div>${legend()}
    <ul class="tips"><li>Use the pen, thin and black, and write straight onto the page — or print double-sided, flipping on the long edge.</li><li>Ten minutes a day beats an hour once a week. Circle your best letter in every row.</li><li>Left-handers: tilt the page to the right and keep your hand below the line, so you can see what you write.</li></ul>`;
  sheet(['cover', coverBody, {}, 'cover'], ['how', howBody, { id: 'how', label: 'how this book works', hints: false }]);

  const tocCol = ps => ps.map(p => `<div class="toc-part"><span>Part ${p.n} · ${esc(p.name)}</span><em>{{p:part-${p.n}}}</em></div>${lessons.filter(l => l.part === p.n).map(l => `<div class="toc-l"><span>${l.id}</span>${esc(l.title)}<em>{{p:${l.id}}}</em></div>`).join('')}`).join('');
  const tocBody = `<div class="h-title">Contents</div><div class="toc-cols"><div>${tocCol(parts.slice(0, 3))}</div><div>${tocCol(parts.slice(3))}<div class="toc-part"><span>Progress tracker</span><em>{{p:progress}}</em></div><div class="toc-part"><span>About this book</span><em>{{p:about}}</em></div></div></div>`;
  const hasRepeat = l => l.kind === 'letters' || l.repeat;
  const progressBody = `<div class="h-title">Progress tracker</div><table class="prog"><tr><th>lesson</th><th>page</th><th>practice</th><th>repeat</th><th>use it</th></tr>${lessons.map(l => `<tr><td><b>${l.id}</b> ${esc(l.title)}</td><td>{{p:${l.id}}}</td><td>☐ ____</td><td>${hasRepeat(l) ? '☐ ____' : '—'}</td><td>${l.use ? '☐ ____' : '—'}</td></tr>`).join('')}</table>`;
  sheet(['toc', tocBody, { id: 'contents', label: 'contents', hints: false }], ['progress', progressBody, { id: 'progress', label: 'progress tracker', hints: false }]);

  for (const p of parts) {
    const ls = lessons.filter(l => l.part === p.n);
    sheet(['opener', `<div class="op-n">Part ${p.n}</div><div class="op-name">${esc(p.name)}</div><div class="op-intro">${esc(p.intro)}</div>
        <div class="op-list">${ls.map(l => `<div><span>${l.id}</span>${esc(l.title)}<em>{{p:${l.id}}}</em></div>`).join('')}</div>`, { id: `part-${p.n}`, label: `part ${p.n} · ${p.name.toLowerCase()}`, hints: false }],
      ['plate', `<div class="plate-in">${img(p.plate.scene, p.plate.seed, AW)}<div class="plate-note">${noteSvg(p.plate.note)}</div><div class="plate-cap">from the sketchbook</div></div>`, { label: `part ${p.n} · ${p.name.toLowerCase()}`, hints: false }]);
    for (const l of ls) lessonSheets(l);
  }

  sheet(['about', `<div class="h-title">About this book</div><p>Every letter in this book is drawn from one stroke model made for it: simple, unjoined, school-neutral print with a single-storey a and g. The stroke numbers, arrows, trace letters and start dots all come from the same pen paths, so they always agree.</p><p>The pencil sketches are original drawings generated for the Pen Practice series; nothing is copied from other books or courses. Typefaces: Inter and JetBrains Mono (SIL Open Font License).</p><p>Pages are sized to the Kindle Scribe screen (157.5 × 210 mm) and the reMarkable 2. Every lesson is one sheet — instructions on the front, practice on the back — so it works as loose leaf printed double-sided, or page by page on an e-reader. Print editions on Letter and A4 keep the same real sizes.</p><p class="small">${esc(book.series)} · ${esc(book.title)} · e-ink edition</p>`, { id: 'about', label: 'about', hints: false }],
    ['backcover', `<div class="bc-in"><div class="cv-series">${esc(book.series)}</div><div class="bc-title">${esc(book.title)}</div>${img('diner', 42, AW)}<div class="plate-note">${noteSvg(['Want more practice?', 'Print any sheet again.'])}</div><div class="bc-note">Every sheet stands on its own.</div></div>`, { label: '', hints: false }, 'backcover']);
}

const TASKS = {
  letters: 'Each row: trace two, follow the dots for two, then fill the line on your own.',
  lettersRepeat: 'Each row: trace one, follow the dots for one, then on your own.',
  warmups: 'Each row: trace, follow the dots, then keep the rhythm going to the end.',
  wordRows: 'Trace each word, follow the dots, then write it again on your own.',
  spaceRows: 'Trace the word, follow the dotted one, then write it on your own. Watch the gaps, not the letters.',
  spaceRowsRepeat: 'Follow the dotted word, then write it twice. Watch the gaps, not the letters.',
  sentenceRows: 'Trace the sentence — the faint o shows each word gap — then write it on the line below.',
  sentenceRowsRepeat: 'Follow the dotted sentence, judging the word gaps by eye, then write it again below.',
  fadingLines: 'The same sentence while the guide lines disappear. Keep the sizes the same.',
  blankRows: 'Write each sentence in the box below it. No lines — make two tiny marks if you need them.',
  timedRows: 'Set a 30-second timer for each trial. Count the letters, then double the count.',
  pangramRows: 'Trace each pangram, then copy it on the lines below.',
  copyModels: 'Copy each model at your everyday speed.',
  confusions: 'Trace each pair, then write it three times on your own. Exaggerate the difference.',
  sample: 'Three ways, one sentence. Date the sheet.',
};

function practiceBack(l, again) {
  const sp = l.practice;
  let inner, task, legendOn = true;
  if (l.kind === 'letters') { inner = letterRows(l.letters, again ? l.words2 : l.words, again ? { ghost: 1, dots: 1, words: ['ghost'] } : { ghost: 2, dots: 2, words: ['ghost', 'dots'] }); task = TASKS[again ? 'lettersRepeat' : 'letters']; }
  else if (sp.type === 'warmups') { inner = warmups(again ? { ghost: 1, dots: 2 } : { ghost: 3, dots: 3 }); task = TASKS.warmups; }
  else if (sp.type === 'sample') { inner = sample(sp.final); task = TASKS.sample; legendOn = false; }
  else if (sp.type === 'wordRows') { inner = wordRows(sp.words); task = TASKS.wordRows; }
  else if (sp.type === 'spaceRows') { inner = spaceRows(again ? sp.words2 : sp.words, again); task = TASKS[again ? 'spaceRowsRepeat' : 'spaceRows']; }
  else if (sp.type === 'sentenceRows') { inner = sentenceRows(again ? sp.sentences2 : sp.sentences, again); task = TASKS[again ? 'sentenceRowsRepeat' : 'sentenceRows']; }
  else if (sp.type === 'fadingLines') { inner = fadingLines(again ? 'Jackdaws love my big sphinx of quartz.' : sp.text, again); task = TASKS.fadingLines; }
  else if (sp.type === 'blankRows') { inner = blankRows(sp.sentences); task = TASKS.blankRows; legendOn = false; }
  else if (sp.type === 'timedRows') { inner = timedRows(again ? sp.text2 : sp.text, again); task = TASKS.timedRows; legendOn = false; }
  else if (sp.type === 'pangramRows') { inner = pangramRows(again ? sp.texts2 : sp.texts); task = TASKS.pangramRows; }
  else if (sp.type === 'copyModels') { inner = copyModels(); task = TASKS.copyModels; legendOn = false; }
  else if (sp.type === 'confusions') { inner = confusions(sp.pairs); task = TASKS.confusions; }
  else throw new Error(`unknown practice ${sp.type}`);
  const kind = l.kind === 'test' ? (sp.final ? 'FINAL SAMPLE' : 'DAY ONE') : again ? 'REPEAT' : 'PRACTICE';
  return `${head(l, kind, legendOn ? legend() : '')}<div class="body"><div class="task">${esc(task)}</div><div class="drill">${inner}</div><div class="repline">date ________ · circle your best${l.kind === 'letters' ? ' letter in each row' : ''}<span>${l.kind === 'test' ? '' : 'reps ☐ ☐ ☐'}</span></div></div>`;
}

function lessonSheets(l) {
  const lb = s => `${l.id} · ${s}`;
  const diagram = h => (l.kind === 'letters' ? exSvg(l.letters, AW, h) : svg(AW, h, D[l.diagram](AW, h)));
  const dh = l.dh || (l.kind === 'letters' ? ([...l.letters].length > 7 ? 54 : 46) : 54);

  // 1 · How to (front) + Practice (back)
  const learn = `${head(l, l.kind === 'test' ? 'HOW TO' : 'HOW TO')}<div class="body">
    <div class="lead"><b>You’ll learn</b> ${esc(l.learn)}</div>
    <div class="idea">${esc(l.idea)}</div>
    <div class="diagram">${diagram(dh)}</div>
    ${l.kind === 'letters' ? sayGrid(l.letters) : ''}
    ${steps(l.steps)}
    <div class="vfill"></div>${checkBox(l.check)}${slipBox(l.slip)}${whyBox(l.why)}</div>`;
  sheet(['learn', learn, { id: l.id, label: lb('how to') }], ['practice', practiceBack(l, false), { label: lb(l.kind === 'test' ? 'sample' : 'practice') }]);

  // 2 · Again (front) + Repeat (back)
  if (l.kind === 'letters' || l.repeat) {
    const v = `${head(l, 'AGAIN')}<div class="body"><div class="lead"><b>Same skill, less help.</b> Do this sheet on a different day from the first one.</div>
      <div class="thistime"><b>This time</b> ${esc(l.again)}</div>
      <div class="diagram">${diagram(l.kind === 'letters' ? Math.min(dh, 46) : 42)}</div>
      ${l.kind === 'letters' ? sayGrid(l.letters) : ''}
      ${steps(l.steps, 'The steps again')}
      <div class="vfill"></div>${checkBox(l.check)}${slipBox(l.slip)}${l.kind === 'letters' ? '' : whyBox(l.why)}</div>`;
    sheet(['learn', v, { id: `${l.id}-again`, label: lb('again') }], ['practice', practiceBack(l, true), { label: lb('repeat') }]);
  }

  // 3 · Use it: how to (front) + Use it (back)
  if (l.use) {
    const u = l.use;
    const front = `${head(l, 'USE IT · HOW TO')}<div class="body">
      <div class="lead"><b>Your task</b> ${esc(u.prompt)}</div>${habitFull()}
      ${steps(u.how, 'How to approach it')}
      <div class="vbox"><b>Real writing</b> Use your everyday pen and speed. This is the writing the lessons were for — it doesn’t have to be perfect, it has to be read.</div>
      <div class="vfill"></div>${checkBox(u.check)}${slipBox(u.slip)}</div>`;
    const back = `${head(l, 'USE IT')}<div class="body"><div class="task">${esc(u.prompt)}</div><div class="drill">${useBlocks(u.blocks)}</div><div class="repline">date ________<span>reps ☐ ☐ ☐</span></div></div>`;
    sheet(['learn', front, { id: `${l.id}-use`, label: lb('use it, how to') }], ['practice', back, { label: lb('use it') }]);
  }
}

// ---------- CSS
const css = `@page { size: ${PAGE.w}mm ${PAGE.h}mm; margin: 0; }
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body { background: #fff; color: #000; font-family: Inter, "DejaVu Sans", sans-serif; }
svg { display: block; }
.page { width: ${PAGE.w}mm; height: ${PAGE.h}mm; padding: ${PAGE.pad}mm; position: relative; overflow: hidden; display: flex; flex-direction: column; break-after: page; }
.head { height: ${HEAD}mm; flex: none; position: relative; border-bottom: 0.5mm solid #000; }
.kick { font: 600 2.4mm "JetBrains Mono", monospace; letter-spacing: 0.35mm; color: #444; }
.kick b { color: #000; margin-left: 2mm; }
.ttl { font: 800 6.2mm/1.08 Inter, sans-serif; margin-top: 1.2mm; max-width: 108mm; }
.has-legend .ttl { max-width: 90mm; font-size: 5.6mm; }
.kind { position: absolute; top: 0; right: 0; font: 700 2.4mm "JetBrains Mono", monospace; letter-spacing: 0.4mm; background: #000; color: #fff; padding: 0.8mm 1.8mm; }
.legend { position: absolute; right: 0; bottom: 1mm; }
.lg-t { display: flex; justify-content: space-between; width: 42mm; font: 2mm "JetBrains Mono", monospace; color: #555; padding: 0 0.5mm; }
.body { flex: 1; padding-top: 3mm; display: flex; flex-direction: column; min-height: 0; }
.foot { height: ${FOOT}mm; flex: none; border-top: 0.35mm solid #000; display: flex; align-items: center; gap: 3mm; font: 2.3mm "JetBrains Mono", monospace; color: #555; margin-top: auto; }
.foot .pn { font: 700 3mm "JetBrains Mono", monospace; color: #000; }
.foot .fl-mid { flex: 1; }
.foot.odd { flex-direction: row-reverse; }
.foot.odd .fl-mid { text-align: right; }
.foot .hint { font-weight: 600; color: #000; }
.lead { font: 3.5mm/1.35 Inter, sans-serif; }
.lead b { font-weight: 800; margin-right: 1mm; }
.idea { font: 3.2mm/1.42 Inter, sans-serif; margin-top: 2mm; color: #111; }
.diagram { margin: 2.5mm 0 1.5mm; border: 0.3mm solid #bbb; flex: none; }
.say-h, .steps-h { font: 700 2.6mm "JetBrains Mono", monospace; letter-spacing: 0.35mm; text-transform: uppercase; margin-top: 1mm; }
.say { display: grid; grid-template-columns: 1fr 1fr; column-gap: 4mm; font: 2.7mm/1.25 Inter, sans-serif; margin: 0.6mm 0 1mm; }
.say div { display: flex; gap: 1.8mm; padding: 0.25mm 0; border-bottom: 0.2mm solid #ddd; }
.say b { font: 800 3.2mm Inter, sans-serif; width: 3.2mm; flex: none; }
.steps { font: 3.1mm/1.36 Inter, sans-serif; padding-left: 5.5mm; margin-top: 1mm; }
.steps li { margin-bottom: 0.5mm; }
.vfill { flex: 1; min-height: 1mm; }
.vbox { border-top: 0.35mm solid #000; padding-top: 1.4mm; margin-top: 2mm; font: 2.85mm/1.38 Inter, sans-serif; }
.vbox b, .why b, .thistime b { font: 700 2.4mm "JetBrains Mono", monospace; letter-spacing: 0.3mm; text-transform: uppercase; margin-right: 1mm; }
.vbox ul { padding-left: 4.5mm; margin-top: 0.6mm; }
.slip { margin-top: 2mm; border-left: 1mm solid #000; padding: 1.4mm 2.5mm; font: 2.9mm/1.35 Inter, sans-serif; background: #f2f2f2; }
.slip b { margin-right: 1mm; }
.why { margin-top: 2mm; border: 0.35mm solid #000; padding: 1.6mm 2.5mm; font: 2.85mm/1.38 Inter, sans-serif; }
.thistime { margin-top: 2.5mm; border: 0.5mm solid #000; padding: 2mm 2.5mm; font: 3.2mm/1.4 Inter, sans-serif; }
.habit { display: grid; grid-template-columns: repeat(4, 1fr); gap: 2mm; }
.habit div { border: 0.4mm solid #000; padding: 2mm; display: flex; flex-direction: column; gap: 1mm; }
.habit b { font: 800 6mm "JetBrains Mono", monospace; }
.habit span { font: 800 3.6mm Inter, sans-serif; }
.habit em { font: 2.5mm/1.3 Inter, sans-serif; font-style: normal; color: #333; }
.habit.use { margin: 2.5mm 0 1.5mm; }
.habit.mini { margin: 2.5mm 0 1mm; }
.habit.mini div { padding: 1.2mm 1.5mm; flex-direction: row; align-items: baseline; gap: 1.5mm; }
.habit.mini b { font-size: 3.6mm; }
.habit.mini span { font-size: 3mm; }
.task { font: 600 3.1mm/1.35 Inter, sans-serif; margin-bottom: 2mm; min-height: 4.2mm; }
.drill { flex: 1; min-height: 0; overflow: hidden; display: flex; flex-direction: column; }
.repline { margin-top: auto; padding-top: 1.5mm; font: 2.4mm "JetBrains Mono", monospace; color: #555; display: flex; justify-content: space-between; }
.repline span { font-weight: 700; color: #000; }
.sl { font: 2.9mm/1.35 Inter, sans-serif; margin: 1.6mm 0 0.6mm; }
.sl b { font-weight: 800; }
.sl .tally { float: right; font: 2.5mm "JetBrains Mono", monospace; }
.lined { margin-top: -2mm; }
.rec { border-collapse: collapse; width: 100%; font: 2.7mm Inter, sans-serif; margin-top: 1mm; }
.rec td, .rec th { border: 0.3mm solid #000; padding: 1.6mm 1.5mm; height: 8mm; }
.rec th { font: 700 2.3mm "JetBrains Mono", monospace; text-align: left; }
.rec td:nth-child(odd) { width: 32%; }
.frame { border: 0.35mm solid #000; margin-top: 1mm; position: relative; flex: none; }
.frame.grow { flex: 1; min-height: 12mm; }
.notes { display: flex; gap: 4mm; }
.notes div { width: 38mm; height: 38mm; border: 0.35mm solid #000; background: #f4f4f4; }
.recl { display: flex; align-items: flex-end; gap: 2mm; height: 9mm; font: 2.8mm Inter, sans-serif; }
.recl i { flex: 1; border-bottom: 0.3mm solid #000; }
.cm, .cf { display: flex; gap: 6mm; }
.cm > div, .cf > div { flex: 1; }
.cover { justify-content: flex-start; }
.cv-series { font: 600 2.8mm "JetBrains Mono", monospace; letter-spacing: 0.6mm; text-transform: uppercase; color: #444; }
.cv-title { font: 800 12.5mm/1 Inter, sans-serif; margin-top: 4mm; letter-spacing: -0.3mm; }
.cv-sub { font: 4mm/1.3 Inter, sans-serif; margin: 3mm 0 4mm; color: #222; }
.cv-ex { border: 0.3mm solid #bbb; }
.cv-model { margin-top: 4mm; }
.cv-fade { margin-top: 3mm; }
.cv-meta { font: 600 2.8mm "JetBrains Mono", monospace; margin-top: 4mm; }
.cv-dev { font: 2.6mm "JetBrains Mono", monospace; margin-top: auto; color: #555; }
.h-title { font: 800 8mm/1.1 Inter, sans-serif; margin-bottom: 3mm; }
.h-lead { font: 700 3.2mm Inter, sans-serif; margin: 2.6mm 0 1.6mm; }
.h-note { font: 2.8mm/1.4 Inter, sans-serif; margin-top: 1.5mm; color: #333; }
.spread-demo { display: grid; grid-template-columns: 1fr 1fr; gap: 2mm; }
.spread-demo div { border: 0.4mm solid #000; padding: 2mm; display: flex; flex-direction: column; gap: 1mm; font: 2.7mm/1.35 Inter, sans-serif; }
.spread-demo b { font: 800 3.4mm Inter, sans-serif; }
.kinds { border-collapse: collapse; width: 100%; font: 3mm/1.35 Inter, sans-serif; }
.kinds td { border-bottom: 0.3mm solid #ccc; padding: 1.2mm 1mm; vertical-align: top; }
.kinds td:first-child { width: 22mm; }
.how .legend { position: static; }
.tips { font: 2.9mm/1.42 Inter, sans-serif; padding-left: 4.5mm; margin-top: 2mm; }
.toc-cols { display: grid; grid-template-columns: 1fr 1fr; gap: 6mm; }
.toc-part { font: 800 3.3mm Inter, sans-serif; margin: 2.6mm 0 1mm; border-bottom: 0.4mm solid #000; padding-bottom: 0.6mm; }
.toc-l { font: 2.85mm/1.55 Inter, sans-serif; }
.toc-l span { font: 600 2.4mm "JetBrains Mono", monospace; display: inline-block; width: 9mm; flex: none; color: #444; }
.toc-part, .toc-l, .op-list div { display: flex; align-items: baseline; }
.toc-part span { flex: 1; }
.toc-l em, .toc-part em, .op-list em { margin-left: auto; font: 600 2.5mm "JetBrains Mono", monospace; font-style: normal; padding-left: 2mm; }
.opener .op-n { font: 700 3mm "JetBrains Mono", monospace; letter-spacing: 0.6mm; text-transform: uppercase; color: #444; }
.opener .op-name { font: 800 12mm/1.05 Inter, sans-serif; margin: 2mm 0 3mm; }
.opener .op-intro { font: 3.6mm/1.45 Inter, sans-serif; margin-bottom: 5mm; max-width: 125mm; }
.op-list { margin-top: 5mm; border-top: 0.5mm solid #000; }
.op-list div { font: 600 3.6mm/1 Inter, sans-serif; padding: 2.6mm 0; border-bottom: 0.3mm solid #ccc; }
.op-list span { font: 700 2.7mm "JetBrains Mono", monospace; display: inline-block; width: 12mm; flex: none; }
.plate, .backcover { justify-content: center; }
.plate-in, .bc-in { margin: auto 0; }
.ref img { width: 100%; display: block; border: 0.3mm solid #999; }
.plate-note { margin-top: 3mm; }
.plate-cap { font: 2.4mm "JetBrains Mono", monospace; color: #555; margin-top: 1.5mm; text-align: right; }
.bc-title { font: 800 8mm/1.1 Inter, sans-serif; margin: 2mm 0 5mm; }
.bc-note { font: 3.2mm/1.4 Inter, sans-serif; margin-top: 3mm; }
.prog { border-collapse: collapse; width: 100%; font: 2.55mm/1.25 Inter, sans-serif; }
.prog th { font: 700 2.2mm "JetBrains Mono", monospace; text-align: left; border-bottom: 0.4mm solid #000; padding: 0.8mm; }
.prog td { border-bottom: 0.25mm solid #ccc; padding: 1.2mm 0.8mm; white-space: nowrap; }
.prog td:first-child { white-space: normal; }
.about p { font: 3.2mm/1.5 Inter, sans-serif; margin-bottom: 3mm; }
.small { font-size: 2.4mm !important; color: #555; }
`;

// ---------- render
mkdirSync(opt.out, { recursive: true });
const img = makeRefs();
buildPages(img);
const pagesHtml = pageList.join('\n').replace(/\{\{p:([^}]+)\}\}/g, (_, id) => { if (!pageOf[id]) throw new Error(`no page for ${id}`); return String(pageOf[id]); });
const html = `<!doctype html><html><head><meta charset="utf-8"><title>${esc(book.title)}</title><style>${css}</style></head><body>${pagesHtml}</body></html>`;
const base = `clear-quick-print-${opt.page}`;
const htmlPath = join(opt.out, `${base}.html`);
writeFileSync(htmlPath, html);

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 600, height: 800 }, deviceScaleFactor: 1 });
  await page.goto(pathToFileURL(htmlPath).href, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  const pdf = join(opt.out, `${base}.pdf`);
  await page.pdf({ path: pdf, width: `${PAGE.w}mm`, height: `${PAGE.h}mm`, printBackground: true });
  // overflow check: flag pages whose content spills past the page or whose practice area clips its rows
  const spill = await page.$$eval('section.page', ps => ps.map((p, i) => {
    const b = p.querySelector('.body') || p, d = p.querySelector('.drill');
    return b.scrollHeight > b.clientHeight + 2 || (d && d.scrollHeight > d.clientHeight + 2) ? i + 1 : 0;
  }).filter(Boolean));
  if (spill.length) console.warn('content overflows on pages:', spill.join(', '));
  const thumbs = join(opt.out, 'thumbs'); rmSync(thumbs, { recursive: true, force: true }); mkdirSync(thumbs, { recursive: true });
  const all = await page.$$('section.page');
  for (let i = 0; i < all.length; i++) await all[i].screenshot({ path: join(thumbs, `p${String(i + 1).padStart(3, '0')}.png`) });
  execFileSync('montage', [join(thumbs, 'p*.png'), '-tile', '10x', '-geometry', '238x317+6+6', '-background', '#ddd', join(opt.out, `contact-${opt.page}.png`)]);
  const pick = ['P1.1', 'P1.3-again', 'P1.5-use', 'P2.3', 'P3.2', 'P4.1'].map(id => pageOf[id]);
  const files = pick.flatMap(n => [n, n + 1].map(k => join(thumbs, `p${String(k).padStart(3, '0')}.png`)));
  execFileSync('montage', [...files, '-tile', '2x', '-geometry', '+8+8', '-background', '#ddd', join(opt.out, `sheets-${opt.page}.png`)]);
  console.log(`wrote ${pdf} (${all.length} pages), contact-${opt.page}.png and sheets-${opt.page}.png`);
} finally {
  await browser.close();
}
