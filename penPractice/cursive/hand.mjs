// A simple modern looped cursive, as joined pen strokes.
//
// Units as everywhere in Pen Practice: cap height = 1; y down: 0 top line, 0.5 dashed middle line, 1 baseline,
// 1.45 descender line. Lowercase letters are drawn upright here and slanted ~10° at the end.
// Every lowercase letter = entry (a lead-in that starts on the baseline at x = 0) + body (ends on the baseline at
// x = w, ready to join — or at the middle line for the four high-exit letters b, o, v, w).
// In a word, the entry is the join: after b, o, v or w it is replaced by a high connector from the middle line.
// Dots and crosses (i, j, t, x) are written after the whole word. Capitals and numbers are the print forms,
// slanted to match, and don't join.
import { glyph as printGlyph } from '../print/strokes.mjs';

const R = (x, n = 3) => +x.toFixed(n);
function bez(p0, p1, p2, p3, n = 12) {
  return Array.from({ length: n }, (_, i) => { const t = (i + 1) / n, u = 1 - t; return [u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0], u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1]]; });
}
// tiny path language: "M x y", "L x y", "C x1 y1 x2 y2 x y" (absolute); a path without M continues from `from`
function trace(d, from = null) {
  const t = d.match(/[MLC]|-?\d*\.?\d+/g), pts = [];
  let cur = from, i = 0;
  while (i < t.length) {
    const c = t[i++];
    const num = () => +t[i++];
    if (c === 'M') { cur = [num(), num()]; pts.push(cur); }
    else if (c === 'L') { const p = [num(), num()]; pts.push(p); cur = p; }
    else if (c === 'C') { const p1 = [num(), num()], p2 = [num(), num()], p3 = [num(), num()]; pts.push(...bez(cur, p1, p2, p3)); cur = p3; }
    else throw new Error(`bad path op ${c}`);
  }
  return pts;
}
const under = (sx, sy) => `M0 1 C${R(sx * 0.45)} 1 ${R(sx * 0.9)} ${R(sy + (1 - sy) * 0.45)} ${sx} ${sy}`;
const over = 'M0 1 C0.03 0.66 0.1 0.5 0.18 0.52';
const exitAt = a => `L${a} 0.86 C${a} 0.97 ${R(a + 0.08)} 1 ${R(a + 0.2)} 1`;
const loopUp = 'M0 1 C0.16 1 0.36 0.6 0.34 0.18', loopTop = 'C0.33 0 0.2 0 0.19 0.16';
// oval letters: the lead-in rises at the left, then runs along the top; the oval retraces back over it
const oval = (s = 0.42) => `M0 1 C0.02 0.66 0.1 0.5 0.24 0.5 C0.32 0.5 0.38 0.51 ${s} 0.54`;
const ovalBody = 'C0.36 0.47 0.18 0.5 0.16 0.72 C0.14 0.92 0.26 1 0.34 1 C0.42 1 0.48 0.9 0.5 0.5';
const descLoop = (x, w) => `L${x} 1.28 C${x} 1.46 ${R(x - 0.18)} 1.46 ${R(x - 0.16)} 1.3 C${R(x - 0.14)} 1.14 ${R(x + 0.08)} 1.02 ${w} 1`;

const L = {
  a: { w: 0.7, top: true, entry: oval(), body: `${ovalBody} ${exitAt(0.5)}` },
  b: { w: 0.62, high: true, entry: loopUp, body: `${loopTop} L0.19 0.86 C0.2 0.99 0.42 1 0.44 0.76 C0.45 0.6 0.38 0.52 0.32 0.53 C0.38 0.56 0.48 0.52 0.62 0.5` },
  c: { w: 0.5, top: true, entry: 'M0 1 C0.02 0.66 0.1 0.5 0.24 0.5 C0.32 0.5 0.38 0.5 0.44 0.53', body: 'C0.38 0.46 0.22 0.48 0.17 0.62 C0.12 0.78 0.18 1 0.5 1' },
  d: { w: 0.7, top: true, entry: oval(), body: `${ovalBody} L0.5 0.02 ${exitAt(0.5)}` },
  e: { w: 0.42, entry: 'M0 1 C0.14 1 0.38 0.84 0.32 0.62', body: 'C0.29 0.48 0.11 0.52 0.1 0.74 C0.1 0.94 0.24 1 0.42 1' },
  f: { w: 0.48, entry: loopUp, body: `${loopTop} L0.19 1.3 C0.19 1.44 0.33 1.42 0.33 1.26 C0.33 1.12 0.26 1.02 0.19 0.98 C0.28 1 0.36 1 0.48 1` },
  g: { w: 0.72, top: true, entry: oval(), body: `${ovalBody} ${descLoop(0.5, 0.72)}` },
  h: { w: 0.66, entry: loopUp, body: `${loopTop} L0.19 1 L0.19 0.72 C0.22 0.5 0.46 0.48 0.47 0.72 ${exitAt(0.47)}` },
  i: { w: 0.38, entry: under(0.18, 0.5), body: exitAt(0.18), after: [[[0.18, 0.33]]] },
  j: { w: 0.46, entry: under(0.2, 0.5), body: 'L0.2 1.28 C0.2 1.46 0.02 1.46 0.04 1.3 C0.06 1.14 0.3 1.02 0.46 1', after: [[[0.2, 0.33]]] },
  k: { w: 0.64, entry: loopUp, body: `${loopTop} L0.19 1 L0.19 0.74 C0.26 0.48 0.5 0.5 0.44 0.66 C0.4 0.74 0.3 0.74 0.24 0.72 C0.36 0.76 0.4 0.98 0.52 1 L0.64 1` },
  l: { w: 0.4, entry: loopUp, body: `${loopTop} ${exitAt(0.19)}` },
  m: { w: 0.92, entry: over, body: `C0.21 0.54 0.22 0.6 0.22 0.68 L0.22 1 L0.22 0.74 C0.25 0.52 0.46 0.48 0.47 0.72 L0.47 1 L0.47 0.74 C0.5 0.52 0.72 0.48 0.73 0.72 ${exitAt(0.73)}` },
  n: { w: 0.68, entry: over, body: `C0.21 0.54 0.22 0.6 0.22 0.68 L0.22 1 L0.22 0.74 C0.25 0.52 0.48 0.48 0.49 0.72 ${exitAt(0.49)}` },
  o: { w: 0.68, high: true, top: true, entry: oval(), body: 'C0.36 0.47 0.18 0.5 0.16 0.72 C0.14 0.94 0.28 1.01 0.36 0.99 C0.48 0.96 0.5 0.66 0.42 0.54 C0.48 0.56 0.56 0.52 0.68 0.5' },
  p: { w: 0.52, entry: under(0.14, 0.46), body: 'L0.14 1.45 L0.14 0.8 C0.16 0.52 0.46 0.48 0.46 0.74 C0.46 0.98 0.24 1.02 0.16 0.96 C0.26 1 0.36 1 0.52 1' },
  q: { w: 0.78, top: true, entry: oval(), body: `${ovalBody} L0.5 1.42 C0.5 1.46 0.54 1.4 0.58 1.3 C0.62 1.14 0.66 1.02 0.78 1` },
  r: { w: 0.54, entry: under(0.16, 0.45), body: `C0.22 0.44 0.3 0.47 0.34 0.52 ${exitAt(0.34)}` },
  s: { w: 0.44, entry: under(0.2, 0.47), body: 'C0.36 0.6 0.4 0.85 0.28 0.97 C0.2 1.02 0.1 0.98 0.1 0.92 C0.14 1 0.3 1 0.44 1' },
  t: { w: 0.38, entry: 'M0 1 C0.08 1 0.16 0.6 0.18 0.18', body: exitAt(0.18), after: [[[0.04, 0.5], [0.36, 0.5]]] },
  u: { w: 0.64, entry: under(0.14, 0.5), body: `L0.14 0.82 C0.14 0.96 0.2 1 0.27 1 C0.36 1 0.42 0.86 0.44 0.5 ${exitAt(0.44)}` },
  v: { w: 0.66, high: true, entry: over, body: 'C0.21 0.56 0.26 0.8 0.32 1 C0.36 0.84 0.42 0.62 0.46 0.5 C0.5 0.56 0.56 0.52 0.66 0.5' },
  w: { w: 0.9, high: true, entry: under(0.14, 0.5), body: 'L0.14 0.82 C0.14 0.96 0.2 1 0.27 1 C0.36 1 0.42 0.86 0.44 0.5 C0.45 0.86 0.5 1 0.58 1 C0.66 1 0.72 0.85 0.73 0.5 C0.76 0.56 0.82 0.53 0.9 0.5' },
  x: { w: 0.56, entry: over, body: 'C0.22 0.6 0.3 0.86 0.36 0.97 C0.38 1 0.44 1 0.56 1', after: [[[0.42, 0.52], [0.14, 1]]] },
  y: { w: 0.66, entry: under(0.14, 0.5), body: `L0.14 0.82 C0.14 0.96 0.2 1 0.27 1 C0.36 1 0.42 0.86 0.44 0.5 ${descLoop(0.44, 0.66)}` },
  z: { w: 0.48, entry: 'M0 1 C0.03 0.66 0.08 0.52 0.14 0.52', body: 'C0.24 0.48 0.4 0.48 0.42 0.54 L0.12 0.98 C0.24 0.96 0.34 1 0.48 1' },
};
// parse once
for (const g of Object.values(L)) { g.E = trace(g.entry); g.S = g.E.at(-1); g.B = trace(g.body, g.S); }

export const SLANT = 0.18;                                 // tan(~10°): x moves right as y moves up
const shear = (P, k) => P.map(([x, y]) => [R(x + (1 - y) * k, 4), R(y, 4)]);
function highEntry(S, top) {                                // join from the middle line after b, o, v, w
  const [sx, sy] = S;
  return [[0, 0.5], ...bez([0, 0.5], [sx * 0.35, top ? 0.5 : 0.58], [sx * 0.7, top ? 0.5 : sy + 0.05], S, 8)];
}

export function makeHand({ slant = SLANT, name = 'cursive' } = {}) {
  const cache = {};
  const cap = ch => { const g = printGlyph(ch); return { w: g.w, strokes: g.strokes.map(s => shear(s, slant)) }; };
  function lower(ch, high) {
    const g = L[ch], entry = high ? highEntry(g.S, g.top) : g.E;
    const main = shear([...entry, ...g.B], slant);
    return { w: g.w, high: !!g.high, join: entry.length, strokes: [main, ...(g.after || []).map(a => shear(a, slant))] };
  }
  function glyph(ch) {
    if (cache[ch]) return cache[ch];
    return (cache[ch] = L[ch] ? lower(ch, false) : cap(ch));
  }
  function layout(text, C, { wordGap = 0.5, gapScale = 1 } = {}) {
    const items = []; let x = 0, prev = null;            // prev: null (start), 'low', 'high', 'cap'
    for (const ch of text) {
      if (ch === ' ') { if (prev) x += wordGap * C; prev = null; continue; }
      if (L[ch]) {
        if (prev === 'cap') x += 0.06 * C * gapScale;
        const g = lower(ch, prev === 'high');
        if (prev === 'low' || prev === 'high') g.strokes[0].cont = true;
        items.push({ ch, x, w: g.w, join: prev === 'low' || prev === 'high' ? g.join : 0, strokes: g.strokes }); x += g.w * C; prev = L[ch].high ? 'high' : 'low';
      } else {
        if (prev) x += (prev === 'cap' ? 0.18 : 0.12) * C * gapScale;
        const g = cap(ch);
        items.push({ ch, x, w: g.w, strokes: g.strokes }); x += g.w * C; prev = 'cap';
      }
    }
    return { items, w: x };
  }
  return { name, glyph, layout, slantGuide: slant, exGap: 0.35, rowGap: 0.45, exShift: slant * 0.4 };
}
export const hand = makeHand();
export const handUpright = makeHand({ slant: 0, name: 'cursive-upright' });
export const LETTERS = Object.keys(L);
