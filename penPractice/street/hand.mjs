// Street Hand: four fast graffiti-style writing hands, each built from the Clear & Quick Print stroke model.
//
//   caps    Street caps — condensed, leaning capitals with sharp corners and a kick on the last stroke
//   bounce  Bounce — everyday lowercase print whose letters hop the baseline, tilt and change size
//   tag     Handstyle — tag-style script: narrow, steep, very angular, stems and tails stretched past the lines
//   throw   Throw-ups — one-line bubble letters drawn round a skeleton, overlapping left to right
// Same units as the other hands: cap height 1; y down: 0 top line, 0.5 middle, 1 baseline, 1.45 descender.
import { glyph as pg, GAP } from '../print/strokes.mjs';
import { pairGap } from '../print/hand.mjs';

const R = x => +x.toFixed(4);
const mapG = (g, fn) => ({ ...g, strokes: g.strokes.map(s => { const q = s.map(p => fn(p)).map(([x, y]) => [R(x), R(y)]); q.cont = s.cont; return q; }) });
function angular(g, step) {                                 // curves → straight segments; real corners are kept
  const turn = (a, b, c) => { const u = unit(a, b), v = unit(b, c); return Math.acos(Math.max(-1, Math.min(1, u[0] * v[0] + u[1] * v[1]))); };
  return { ...g, strokes: g.strokes.map(s => {
    if (s.length <= 6) return s;
    const n = Math.max(s.length > 20 ? 6 : 3, Math.round((s.length - 1) / step)), keep = new Set();
    for (let i = 0; i <= n; i++) keep.add(Math.round(i * (s.length - 1) / n));
    for (let i = 1; i < s.length - 1; i++) if (turn(s[i - 1], s[i], s[i + 1]) > 0.45) keep.add(i);
    return [...keep].sort((a, b) => a - b).map(i => s[i]);
  }) };
}
const shear = (g, k) => mapG(g, ([x, y]) => [x + (1 - y) * k, y]);
const squeeze = (g, k) => ({ ...mapG(g, ([x, y]) => [x * k, y]), w: g.w * k });
const unit = (a, b) => { const d = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1; return [(b[0] - a[0]) / d, (b[1] - a[1]) / d]; };
function kick(g, len) {                                     // a flick on the end of the last stroke
  const strokes = g.strokes.slice(), last = strokes.length - 1, s = strokes[last];
  if (!s || s.length < 2) return g;
  const e = s.at(-1), [dx, dy] = unit(s.at(-2), e);
  const k = dy > 0.5 ? [len, -len * 0.4] : dx > 0.5 ? [len * 0.35, -len * 0.8] : dx < -0.5 ? [-len * 0.3, -len * 0.8] : [len * 0.7, len * 0.1];
  strokes[last] = [...s, [e[0] + k[0], e[1] + k[1]]];
  return { ...g, strokes };
}
function stretch(g, up, tail, bar) {                       // stems start above the top line; tails and bars run long
  const strokes = g.strokes.map((s, i) => {
    if (s.length < 2) return s;
    let q = s.slice();
    if (q[0][1] < 0.05) { const [dx, dy] = unit(q[0], q[1]); if (dy > 0.6) q = [[q[0][0] - dx * up, q[0][1] - dy * up], ...q]; }
    if (i === g.strokes.length - 1) {
      const e = q.at(-1), [dx, dy] = unit(q.at(-2), e);
      if (e[1] > 0.95 && dy > 0.4) q = [...q, [e[0] + dx * tail, e[1] + dy * tail]];
      else if (Math.abs(dy) < 0.3 && dx > 0) q = [...q, [e[0] + bar, e[1]]];
    }
    return q;
  });
  return { ...g, strokes };
}
const ring = (x, y, r) => Array.from({ length: 13 }, (_, i) => [x + Math.cos(i / 12 * Math.PI * 2) * r, y + Math.sin(i / 12 * Math.PI * 2) * r]);
const up = ch => (/[a-z]/.test(ch) ? ch.toUpperCase() : ch);

function capsLayout(glyph, gap, wordGap) {
  return (text, C, { gapScale = 1, wordGap: wg = wordGap } = {}) => {
    const items = []; let x = 0, prev = null;
    for (const raw of text) {
      if (raw === ' ') { if (prev) x += wg * C; prev = null; continue; }
      const g = glyph(raw);
      if (prev) x += gap * gapScale * C;
      items.push({ ch: raw, x, w: g.w, strokes: g.strokes }); x += g.w * C; prev = raw;
    }
    return { items, w: x };
  };
}
const memo = fn => { const c = {}; return ch => (c[ch] ||= fn(ch)); };

// ---------- Street caps
const NOKICK = 'TIJYQ147';                                    // a kick would make these read as other letters
const capsGlyph = memo(ch => { const b = pg(up(ch)), a = squeeze(angular(b, /[0-9]/.test(ch) ? 3 : 5), 0.8); const g = shear(NOKICK.includes(up(ch)) ? a : kick(a, 0.13), 0.2); return { ...g, w: R(b.w * 0.8 + 0.05) }; });
export const caps = { name: 'Street caps', glyph: capsGlyph, layout: capsLayout(capsGlyph, 0.15, 0.5), slantGuide: 0.2, exGap: 0.55, rowGap: 0.6, exShift: 0.08 };

// ---------- Bounce
const bounceGlyph = memo(ch => { const b = pg(ch); return { ...mapG(b, ([x, y]) => [x * 1.04, y]), w: b.w * 1.04, strokes: b.strokes.map(s => (s.length === 1 ? ring(s[0][0] * 1.04, s[0][1] - 0.02, 0.055) : s.map(([x, y]) => [R(x * 1.04), y]))) }; });
const BOUNCE = [[0, -7, 1], [-0.1, 6, 0.9], [0.06, -4, 1.1], [-0.06, 8, 0.95], [0.09, -6, 1.06], [-0.03, 3, 1]];
export const bounce = {
  name: 'Bounce', glyph: bounceGlyph, ink: 1.3,
  layout(text, C, { gapScale = 1, wordGap = GAP.word } = {}) {
    const items = []; let x = 0, prev = null, n = 0;
    for (const ch of text) {
      if (ch === ' ') { if (prev) x += wordGap * C; prev = null; continue; }
      if (prev) x += pairGap(prev, ch) * 1.1 * gapScale * C;
      const g = bounceGlyph(ch), [dy, deg, sc] = BOUNCE[n++ % BOUNCE.length], a = deg * Math.PI / 180, cx = g.w / 2;
      const strokes = g.strokes.map(s => s.map(([u, v]) => { const px = (u - cx) * sc, py = (v - 1) * sc; return [R(cx + px * Math.cos(a) - py * Math.sin(a)), R(1 + dy + px * Math.sin(a) + py * Math.cos(a))]; }));
      items.push({ ch, x, w: g.w, strokes }); x += g.w * C; prev = ch;
    }
    return { items, w: x };
  },
};

// ---------- Handstyle (tag-style script)
const WIDE = 'EFL';                                         // bar letters keep more width, or E reads as I
const tagGlyph = memo(ch => { const b = pg(up(ch)), k = WIDE.includes(up(ch)) ? 0.85 : 0.64; const g = shear(stretch(squeeze(angular(b, 8), k), 0.14, 0.24, 0.18), 0.36); return { ...g, w: R(b.w * k + 0.04) }; });
export const tag = { name: 'Handstyle', glyph: tagGlyph, layout: capsLayout(tagGlyph, 0.07, 0.45), slantGuide: 0.36, pad: 0.12, exGap: 0.45, rowGap: 0.55, exShift: 0.15 };

// ---------- Throw-ups (bubble letters)
const BW = 0.3;
const throwGlyph = memo(ch => { const b = pg(up(ch)); return { ...mapG(b, ([x, y]) => [x * 0.78 + BW / 2, 0.16 + y * 0.68]), w: R(b.w * 0.78 + BW) }; });
export const throwUp = { name: 'Throw-up', glyph: throwGlyph, layout: capsLayout(throwGlyph, -0.1, 0.3), render: 'bubble', bubble: BW, pad: 0.05, exGap: 0.25, rowGap: 0.3 };

export const hands = { caps, bounce, tag, throw: throwUp };
