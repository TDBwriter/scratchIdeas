// Shared drawing library for the Pen Practice handwriting books (Clear & Quick Print, cursive, street styles).
//
// A "hand" is a stroke model: { glyph(ch) → { w, strokes }, layout(text, C, opts) → { items, w } }.
// Units: cap height = 1; y runs down: 0 = top line, 0.5 = dashed middle line, 1 = baseline, 1.45 = descender line.
// Each stroke is an ordered point list (order = stroke order, point order = direction). A stroke array may carry
// `.cont = true` when it continues the stroke before it (joined writing), so it gets no start dot of its own.
// Optional hand fields: render ('line' | 'bubble'), bubble (bubble width, cap heights), pad (extra row room,
// cap heights), exGap / rowGap (letter gaps in exemplars and practice rows), ink (pen width factor).

export const INK = '#000', TRACE = '#b0b0b0', RULE = '#8a8a8a', BODY = '#d0d0d0';
export const PAGES = { eink: { w: 157.5, h: 210, pad: 9 }, letter: { w: 215.9, h: 279.4, pad: 13 }, a4: { w: 210, h: 297, pad: 13 } };
export const HEAD = 19, FOOT = 9;
export let PAGE, AW, AH, PH;
export function setPage(name) {
  PAGE = PAGES[name];
  if (!PAGE) throw new Error(`unknown --page ${name}`);
  AW = PAGE.w - 2 * PAGE.pad;                            // content width (mm)
  AH = PAGE.h - 2 * PAGE.pad - HEAD - FOOT;              // content height (mm)
  PH = AH - 14;                                         // practice area height on the back of a sheet
}
export let HAND = null;
export function setHand(h) { HAND = h; }
export function withHand(h, fn) { const prev = HAND; HAND = h || prev; try { return fn(); } finally { HAND = prev; } }

// ---------- small helpers
export const f = n => (+n).toFixed(2);
export const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
export const svg = (w, h, body, cls = '') => `<svg class="${cls}" viewBox="0 0 ${f(w)} ${f(h)}" width="${f(w)}mm" height="${f(h)}mm" xmlns="http://www.w3.org/2000/svg">${body}</svg>`;
export const ln = (x1, y1, x2, y2, { c = INK, w = 0.35, dash = '' } = {}) => `<line x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}" stroke="${c}" stroke-width="${w}" ${dash ? `stroke-dasharray="${dash}"` : ''} stroke-linecap="round"/>`;
export const pd = P => `M${P.map(p => `${f(p[0])} ${f(p[1])}`).join(' L')}`;
export const path = (d, { c = INK, w = 0.35, dash = '', fill = 'none' } = {}) => `<path d="${d}" stroke="${c}" stroke-width="${w}" fill="${fill}" ${dash ? `stroke-dasharray="${dash}"` : ''} stroke-linecap="round" stroke-linejoin="round"/>`;
export const rect = (x, y, w, h, { c = INK, w: sw = 0.35, dash = '', fill = 'none' } = {}) => `<rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" stroke="${c}" stroke-width="${sw}" fill="${fill}" ${dash ? `stroke-dasharray="${dash}"` : ''}/>`;
export const dotc = (x, y, r, c = INK) => `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="${c}"/>`;
export const odot = (x, y, r) => `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="#fff" stroke="${INK}" stroke-width="${f(Math.max(0.2, r * 0.45))}"/>`;
export const txt = (x, y, s, { size = 2.4, c = '#333', anchor = 'start', mono = true, weight = 500 } = {}) =>
  `<text x="${f(x)}" y="${f(y)}" font-family="${mono ? 'JetBrains Mono' : 'Inter'}" font-size="${size}" font-weight="${weight}" fill="${c}" text-anchor="${anchor}">${esc(s)}</text>`;
export const arrowHead = (x, y, ang, s = 1.4, c = INK, w = 0.35) => path(`M${f(x - Math.cos(ang - 0.45) * s)} ${f(y - Math.sin(ang - 0.45) * s)} L${f(x)} ${f(y)} L${f(x - Math.cos(ang + 0.45) * s)} ${f(y - Math.sin(ang + 0.45) * s)}`, { c, w });
export const sum = a => a.reduce((s, v) => s + v, 0);
export const lbl = (x, y, s, anchor = 'start', size = 2.3) => `<text x="${f(x)}" y="${f(y)}" font-family="JetBrains Mono" font-size="${size}" font-weight="700" fill="#000" text-anchor="${anchor}" paint-order="stroke" stroke="#fff" stroke-width="0.9">${esc(s)}</text>`;

// ---------- path geometry
export function trimPath(P, a, b) {                       // the part of polyline P between lengths a and b (mm)
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
export const plen = P => sum(P.slice(1).map((p, i) => Math.hypot(p[0] - P[i][0], p[1] - P[i][1])));

// ---------- writing in the current hand (mm; y0 = top line, C = cap height)
export const gOf = ch => (typeof ch === 'string' ? HAND.glyph(ch) : ch);
const place = (strokes, x, y0, C) => strokes.map(st => { const Q = st.map(([u, v]) => [x + u * C, y0 + v * C]); Q.cont = st.cont; return Q; });
export const strokesAt = (ch, x, y0, C) => place(gOf(ch).strokes, x, y0, C);
export function drawStrokes(strokes, x, y0, C, mode, hand = HAND) {
  const S = place(strokes, x, y0, C);
  if (hand.render === 'bubble' && mode !== 'dots' && mode !== 'startdot') return bubble(S, C, mode, hand);
  const k0 = hand.ink || 1;
  const wi = Math.max(0.32, C * 0.055 * k0), wt = Math.max(0.55, C * 0.085), r = Math.max(0.32, C * 0.045);
  let s = '';
  S.forEach((P, k) => {
    const [px, py] = P[0];
    if (mode === 'ink') s += P.length === 1 ? dotc(px, py, wi * 0.9) : path(pd(P), { w: wi });
    else if (mode === 'ghost') s += (P.length === 1 ? dotc(px, py, wt * 0.6, TRACE) : path(pd(P), { c: TRACE, w: wt })) + (P.cont ? '' : dotc(px, py, r * 0.75));
    else if (mode === 'dots') {
      if (P.length === 1) { s += odot(px, py, r); return; }
      const L = plen(P), n = Math.max(2, Math.round(L / Math.max(1.05, C * 0.12)));
      for (let i = 1; i <= n; i++) { const q = trimPath(P, 0, L * i / n).at(-1); s += dotc(q[0], q[1], Math.max(0.17, C * 0.02), '#4a4a4a'); }
      if (!P.cont) s += dotc(px, py, r);
    }
    else if (mode === 'startdot' && k === 0) s += dotc(px, py, r);
  });
  return s;
}
// bubble letters (throw-ups): a fat skeleton drawn as an outline; letters drawn later overlap earlier ones
function bubble(S, C, mode, hand) {
  const W = C * (hand.bubble || 0.34), t = Math.max(0.35, C * 0.045);
  const outer = mode === 'ghost' ? TRACE : INK, inner = mode === 'fill' ? '#c8c8c8' : '#fff';
  const draw = (c, w) => S.map(P => (P.length === 1 ? dotc(P[0][0], P[0][1], w / 2, c) : path(pd(P), { c, w }))).join('');
  return draw(outer, W + 2 * t) + draw(inner, W);
}
export const drawGlyph = (ch, x, y0, C, mode) => drawStrokes(gOf(ch).strokes, x, y0, C, mode);
export function writeText(text, x, y0, C, mode, o = {}) {
  const hand = o.hand || HAND, L = hand.layout(text, C, o);
  return { s: L.items.map(it => drawStrokes(it.strokes, x + it.x, y0 + (o.jitter ? o.jitter(it) : 0), C, mode, hand)).join(''), w: L.w, items: L.items };
}
export const textW = (text, C, o = {}) => (o.hand || HAND).layout(text, C, o).w;
export function wrap(text, C, maxW, o = {}) {
  const lines = []; let cur = '';
  for (const word of text.split(' ')) { const t = cur ? `${cur} ${word}` : word; if (cur && textW(t, C, o) > maxW) { lines.push(cur); cur = word; } else cur = t; }
  if (cur) lines.push(cur);
  return lines;
}
export const glyphMaxV = ch => Math.max(1, ...gOf(ch).strokes.flat().map(p => p[1]));

// ---------- guide lines and writing rows
const STY = { four: ['top', 'mid', 'base', 'desc'], three: ['top', 'mid', 'base'], two: ['mid', 'base'], one: ['base'], none: [] };
const LINES = { top: [0, RULE, 0.22, ''], mid: [0.5, RULE, 0.22, '1.3 1'], base: [1, INK, 0.33, ''], desc: [1.45, '#b5b5b5', 0.22, '0.5 0.9'] };
export function rules(x, w, y0, C, style) {
  let s = STY[style].map(k => { const [v, c, sw, d] = LINES[k]; return ln(x, y0 + v * C, x + w, y0 + v * C, { c, w: sw, dash: d }); }).join('');
  const k = HAND && HAND.slantGuide;                     // slant guides for slanted hands
  if (k && style !== 'none') { const top = STY[style].includes('top') ? 0 : 0.5, bot = STY[style].includes('desc') ? 1.45 : 1, step = Math.max(7, C * 1.1); for (let gx = x + step * 0.6; gx < x + w - 2; gx += step) s += ln(gx - (bot - 1) * C * k, y0 + bot * C, Math.min(x + w, gx + (1 - top) * C * k), y0 + top * C, { c: '#cfcfcf', w: 0.2 }); }
  return s;
}
export const ext = style => (style === 'three' ? 1.08 : 1.45);
const padOf = () => (HAND && HAND.pad) || 0;
export const rowH = (C, style) => 1.4 + C * (ext(style) + 2 * padOf()) + Math.max(1.8, C * 0.3);
export const row = (C, style, content = () => '', w = AW) => { const y0 = 1.4 + padOf() * C; return svg(w, rowH(C, style), rules(0, w, y0, C, style) + content(y0), 'row'); };
export const rows = (n, C, style, w = AW) => Array.from({ length: n }, () => row(C, style, () => '', w)).join('');
export const fitC = (n, style, h, max = 10) => { let C = max; while (C > 5 && n * rowH(C, style) > h) C -= 0.1; return C; };
export const spare = (n, C, style, h) => Math.max(0, Math.floor((h - n * rowH(C, style)) / rowH(C, style)));   // empty rows that still fit
export const lined = (n, pitch = 9, w = AW) => svg(w, n * pitch + 1, Array.from({ length: n }, (_, i) => ln(0, (i + 1) * pitch, w, (i + 1) * pitch, { c: '#555', w: 0.25 })).join(''), 'lined');

// ---------- exemplar: big letters with numbered stroke starts and direction arrows
export function exGlyph(ch, x, y0, C) {
  const S = strokesAt(ch, x, y0, C), body = Math.max(0.9, C * 0.12), r = Math.max(1.25, C * 0.072);
  let s = HAND.render === 'bubble' ? bubble(S, C, 'ink', HAND) + S.map(P => (P.length === 1 ? '' : path(pd(P), { c: '#9a9a9a', w: 0.3, dash: '1 0.8' }))).join('')
    : S.map(P => (P.length === 1 ? dotc(P[0][0], P[0][1], body * 0.75, BODY) : path(pd(P), { c: BODY, w: body }))).join('');
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
export function exemplar(chars, w, h, maxC = 20) {
  const arr = [...chars].filter(c => c !== ' '), GX = HAND.exGap ?? (/[a-z]/.test(chars) ? 0.6 : 0.75), pad = 4.2 + padOf() * 14;
  const gw = c => gOf(c).w;
  const plan = nr => {
    const per = Math.ceil(arr.length / nr), rs = [];
    for (let i = 0; i < arr.length; i += per) rs.push(arr.slice(i, i + per));
    const exts = rs.map(r => (r.some(c => glyphMaxV(c) > 1.2) ? 1.45 : 1.1) + padOf());
    let C = nr > 1 ? Math.min(maxC, 13.5) : maxC;
    for (const r of rs) C = Math.min(C, (w - 12) / (sum(r.map(gw)) + GX * (r.length - 1)));
    C = Math.min(C, (h - pad * rs.length - 2) / sum(exts));
    return { rs, exts, C };
  };
  const p1 = plan(1), p2 = plan(2), p = p1.C >= Math.min(14, maxC) || p1.C >= p2.C ? p1 : p2;
  const used = sum(p.exts.map(e => pad + p.C * e));
  let y = 1, s = '';
  p.rs.forEach((r, i) => {
    const y0 = y + pad, rw = (sum(r.map(gw)) + GX * (r.length - 1)) * p.C;
    s += rules(3, w - 6, y0, p.C, p.exts[i] - padOf() > 1.2 ? 'four' : 'three');
    let x = (w - rw) / 2 - (HAND.exShift || 0) * p.C;
    for (const c of r) { s += exGlyph(c, x, y0, p.C); x += (gw(c) + GX) * p.C; }
    y = y0 + p.C * p.exts[i];
  });
  return { s, h: used + 3 };
}
export const exSvg = (chars, w, h, maxC) => { const e = exemplar(chars, w, h, maxC); return svg(w, e.h, e.s); };
export const sayGrid = (chars, talk) => `<div class="say-h">Say it as you write</div><div class="say">${[...chars].map(c => `<div><b>${esc(c)}</b><span>${esc(talk[c] || '')}</span></div>`).join('')}</div>`;

// ---------- practice pages (backs)
export function letterRows(chars, words, help) {
  const lower = /[a-z]/.test(chars), style = lower ? 'four' : 'three';
  const arr = [...chars];
  let ws = words.slice();
  while (ws.length > 1 && fitC(arr.length + ws.length, style, PH - 2) < 8) ws.pop();
  const C = fitC(arr.length + ws.length, style, PH - 2);
  const gap = HAND.rowGap ?? 0.85;
  let html = '';
  for (const ch of arr) html += row(C, style, y0 => {
    let x = 2, s = '';
    for (const m of [...Array(help.ghost).fill('ghost'), ...Array(help.dots).fill('dots')]) { s += drawGlyph(ch, x, y0, C, m); x += (gOf(ch).w + gap) * C; }
    return s;
  });
  for (const wd of ws) html += row(C, style, y0 => {
    let x = 2, s = '';
    for (const m of help.words) { const t = writeText(wd, x, y0, C, m); s += t.s; x += t.w + 1.3 * C; }
    return s;
  });
  return html + rows(spare(arr.length + ws.length, C, style, PH - 2), C, style);
}
export function warmups(WARM, help, style = 'three') {
  const C = fitC(WARM.length, style, PH - 2);
  return WARM.map(([, g]) => row(C, style, y0 => {
    let x = 2.5, s = '';
    if (typeof g === 'string' && g.length > 1) {               // a joined pattern, written as text
      for (const m of [...Array(Math.min(help.ghost, 2)).fill('ghost'), ...Array(Math.min(help.dots, 2)).fill('dots')]) { const t = writeText(g, x, y0, C, m); s += t.s; x += t.w + 0.9 * C; }
      return s;
    }
    for (const m of [...Array(help.ghost).fill('ghost'), ...Array(help.dots).fill('dots')]) { s += drawGlyph(g, x, y0, C, m); x += (gOf(g).w + 0.7) * C; }
    return s;
  })).join('');
}
export function sample(sentence, final) {
  const C = 6, lines = wrap(sentence, C, AW - 6);
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
export function wordRows(words, { max = 9, dotted = true } = {}) {
  const style = /[a-z]/.test(words.join('')) ? 'four' : 'three';
  const C = fitC(words.length * 1.5, style, PH - 4, max);
  return words.map(wd => {
    let C1 = C; while (textW(wd, C1) > AW - 6 && C1 > 5) C1 -= 0.2;
    const lines = textW(wd, C) > AW / 2 - 4 || !dotted ? 1 : 0;
    return row(C1, style, y0 => { const t = writeText(wd, 2, y0, C1, 'ghost'); return t.s + (lines ? '' : writeText(wd, t.w + 2 + 1.2 * C1, y0, C1, 'dots').s); }) + (lines ? row(C1, style) : '');
  }).join('');
}
export function spaceRows(words, again) {
  const n = words.length + 1, C = fitC(n, 'four', PH - 8, 9);
  return words.map(wd => row(C, 'four', y0 => {
    let x = 2, s = '';
    for (const m of again ? ['dots'] : ['ghost', 'dots']) { const t = writeText(wd, x, y0, C, m); s += t.s; x += t.w + 1.6 * C; }
    return s;
  })).join('') + `<div class="sl">Your own words — straights, rounds, both:</div>` + rows(Math.max(1, spare(words.length, C, 'four', PH - 9)), C, 'four');
}
export function sentenceRows(sentences, again, { oMarks = true, style = 'two' } = {}) {
  const C0 = 6.8;
  return sentences.map(t => {
    let C = C0; while (textW(t, C) > AW - 4 && C > 4.8) C -= 0.1;
    const model = row(C, style, y0 => {
      const W = writeText(t, 2, y0, C, again ? 'dots' : 'ghost');
      let s = W.s;
      if (!again && oMarks) for (let i = 1; i < W.items.length; i++) { const a = W.items[i - 1], b = W.items[i], gap = b.x - (a.x + a.w * C); if (gap > C * 0.4) s += `<ellipse cx="${f(2 + a.x + a.w * C + gap / 2)}" cy="${f(y0 + C * 0.75)}" rx="${f(C * 0.2)}" ry="${f(C * 0.22)}" fill="none" stroke="${TRACE}" stroke-width="0.3" stroke-dasharray="0.7 0.5"/>`; }
      return s;
    });
    return model + row(C, style);
  }).join('');
}
export function fadingLines(text, again) {
  const [c1, c2, c3] = again ? [6.5, 5.8, 5.2] : [7.5, 6.5, 6];
  const ghost = wrap(text, c1, AW - 4).map(t => row(c1, 'four', y0 => writeText(t, 2, y0, c1, 'ghost').s)).join('');
  return `<div class="sl"><b>Four lines</b> — trace, then copy</div>${ghost}${rows(1, c1, 'four')}
    <div class="sl"><b>Two lines</b> — imagine the top line</div>${rows(3, c2, 'two')}
    <div class="sl"><b>One line</b> — imagine the dashed line too</div>${rows(3, c3, 'one')}`;
}
export function blankRows(sentences) {
  return sentences.map(t => `<div class="sl">${svg(AW, 8, writeText(t, 0, 1, 5.2, 'ink').s)}</div><div class="frame" style="height:21mm"></div>`).join('') +
    `<div class="sl">Anything you like — a note, a quote, today’s date:</div><div class="frame grow"></div>`;
}
export function timedRows(text, again, { C = 6, style = 'two', trials = 4, modelC = 5, modelH = 8 } = {}) {
  const trial = k => `<div class="sl"><b>Trial ${k}</b> · 30 seconds <span class="tally">letters ______ × 2 = ______ per minute</span></div>${rows(2, C, style)}`;
  return `<div class="sl">Write this again and again until the timer stops:</div>${svg(AW, modelH, writeText(text, 0, 1 + padOf() * modelC, modelC, 'ink').s)}${Array.from({ length: trials }, (_, i) => trial(i + 1)).join('')}
    <div class="sl"><b>Best</b> ______ per minute${again ? ' · last time ______' : ''}</div>`;
}
export function pangramRows(texts, style = 'two') {
  let C = 7.5;
  const need = c => texts.reduce((a, t) => a + wrap(t, c, AW - 4).length * 2 + 1, 0) * rowH(c, style);
  while (C > 5.2 && need(C) > PH - 4) C -= 0.1;
  return texts.map(t => { const ls = wrap(t, C, AW - 4); return ls.map(l => row(C, style, y0 => writeText(l, 2, y0, C, 'ghost').s)).join('') + rows(ls.length + 1, C, style); }).join('');
}
export function copyModels(models) {
  const C = 5.4, cw = (AW - 6) / 2;
  const pair = items => `<div class="cm">${[true, false].map(m => `<div>${items.map(t => row(C, 'one', y0 => (m ? writeText(t, 1, y0, C, 'ink').s : ''), cw)).join('')}</div>`).join('')}</div>`;
  const form = (name, val) => { const n = 17, b = 6; let g = lbl(0, 6.2, name, 'start', 2.3); for (let i = 0; i < n; i++) g += rect(20 + i * b, 0.5, b, 7.5, { w: 0.3 }); [...val].forEach((c, i) => { if (c !== ' ') g += drawGlyph(c, 20 + i * b + (b - gOf(c).w * 4.6) / 2, 1.9, 4.6, 'ink'); }); return svg(AW, 9, g); };
  return models.map(m => (m.form ? `<div class="sl"><b>${m.label}</b> — copy each line in the empty boxes below it</div>${m.form.map(([n, v]) => form(n, v) + form('', '')).join('')}`
    : `<div class="sl"><b>${m.label}</b>${m.note ? ` — ${m.note}` : ''}</div>${pair(m.lines)}`)).join('\n    ');
}
export function confusions(pairs, { C = 7.5, own = 'Your own trouble letters (from the read-back):' } = {}) {
  const cw = (AW - 4) / 2, half = Math.ceil(pairs.length / 2);
  const cell = ([p, note]) => svg(cw, rowH(C, 'four') + 3, txt(0, 2.4, note, { size: 2.2, c: '#444' }) + rules(0, cw, 4.2 + padOf() * C, C, 'four') + writeText(p, 1.5, 4.2 + padOf() * C, C, 'ghost', { wordGap: 0.7 }).s);
  return `<div class="cf">${[0, 1].map(c => `<div>${pairs.slice(c * half, (c + 1) * half).map(cell).join('')}</div>`).join('')}</div>
    <div class="sl">${own}</div>${rows(4, C, 'four')}`;
}
export function useBlocks(blocks) {
  return blocks.map(b => {
    if (b.form) {
      const n = Math.floor((AW - 24) / 6.2);
      return `<div class="sl"><b>A form</b> — capitals, one per box</div>` + b.form.map(name => { let g = lbl(0, 6.4, name, 'start', 2.2); for (let i = 0; i < n; i++) g += rect(23 + i * 6.2, 0.5, 6.2, 8, { w: 0.3 }); return svg(AW, 10, g); }).join('');
    }
    if (b.record) return `<div class="sl"><b>${esc(b.title || 'Read-back')}</b></div>` + b.record.map(t => `<div class="recl"><span>${esc(t)}</span><i></i></div>`).join('');
    if (b.blank === 'envelope') return `<div class="sl"><b>${esc(b.label)}</b></div>` + svg(AW, 52, rect(1, 1, AW - 2, 50, { w: 0.4 }) + rect(AW - 21, 5, 16, 19, { c: RULE, w: 0.3, dash: '1 0.8' }) + lbl(AW - 13, 15.5, 'stamp', 'middle', 2));
    if (b.blank === 'notes') return `<div class="sl"><b>${esc(b.label)}</b></div><div class="notes">${[0, 1, 2].map(() => '<div></div>').join('')}</div>`;
    if (b.blank === 'card') return `<div class="sl"><b>${esc(b.label)}</b></div><div class="frame grow"></div>`;
    if (b.blank === 'frame') return `<div class="sl"><b>${esc(b.label)}</b></div><div class="frame" style="height:${f(b.h)}mm"></div>`;
    const C = b.C || 8, style = b.style || (/[a-z]/.test(b.model || 'a') ? 'two' : 'three');
    let Cm = C; while (b.model && textW(b.model, Cm) > AW - 4 && Cm > 4.5) Cm -= 0.1;
    return `<div class="sl"><b>${esc(b.label)}</b></div>` + (b.model ? row(Cm, style, y0 => writeText(b.model, 2, y0, Cm, 'ghost').s) : '') + rows(b.rows || 2, C, style);
  }).join('');
}

// ---------- small page pieces shared by every book
export const legend = (ch = 'a', C = 7) => `<div class="legend">${svg(42, 9, drawGlyph(ch, 3, 0.6, C, 'ghost') + drawGlyph(ch, 18, 0.6, C, 'dots') + rect(32, 3.3, 9, 4.6, { c: '#6f6f6f', w: 0.35 }) + txt(11.5, 7, '→', { size: 2.6 }) + txt(26.5, 7, '→', { size: 2.6 }))}<div class="lg-t"><span>trace</span><span>dots</span><span>free</span></div></div>`;
export const noteSvg = (lines, C = 6, style = 'two') => lines.map(t => row(C, style, y0 => writeText(t, 2, y0, C, 'ink').s)).join('');
