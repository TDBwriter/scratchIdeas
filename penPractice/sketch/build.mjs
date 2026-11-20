// Builds the "Sketch What You See" workbook PDF from lessons.mjs.
//
//   node build.mjs [--page eink|letter|a4] [--out DIR] [--refs]
//
// --page eink (default): 157.5 × 210 mm, true size on Kindle Scribe 2022/2024 and reMarkable 2.
// Reference sketches come from ../../sketchArt/sketch.mjs (generated once into DIR/refs; --refs regenerates).
// Each lesson: Learn page → Practice page (+ a repeat page with fresh targets) → From-life page.
// Writes DIR/sketch-what-you-see-<page>.pdf, a contact sheet of every page, and full-size previews of a few.
// Requires: playwright (Chromium), ImageMagick (convert, montage).

import { createRequire } from 'node:module';
import { existsSync, mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { resolve, join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { book, parts, lessons, extras, overlayNotes } from './lessons.mjs';

const { chromium } = createRequire(import.meta.url)('playwright');
const HERE = dirname(fileURLToPath(import.meta.url));
const SKETCH = resolve(HERE, '../../sketchArt/sketch.mjs');

const opt = { page: 'eink', out: resolve(HERE, '../out/sketch'), refs: false };
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
const INK = '#000', GHOST = '#a6a6a6', GUIDE = '#6f6f6f', FAINT = '#c9c9c9';

// ---------- small helpers
function rng(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6D2B79F5) >>> 0; let t = Math.imul(a ^ (a >>> 15), a | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const f = n => (+n).toFixed(2);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const lerp = (a, b, t) => a + (b - a) * t;
const lerp2 = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];
const between = (R, a, b) => lerp(a, b, R());
const pick = (R, arr) => arr[Math.floor(R() * arr.length)];
let uid = 0;

// SVG primitives in millimetres
const svg = (w, h, body, cls = '') => `<svg class="${cls}" viewBox="0 0 ${f(w)} ${f(h)}" width="${f(w)}mm" height="${f(h)}mm" xmlns="http://www.w3.org/2000/svg">${body}</svg>`;
const ln = (x1, y1, x2, y2, { c = INK, w = 0.35, dash = '', op = 1 } = {}) => `<line x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}" stroke="${c}" stroke-width="${w}" ${dash ? `stroke-dasharray="${dash}"` : ''} opacity="${op}" stroke-linecap="round"/>`;
const gl = (x1, y1, x2, y2) => ln(x1, y1, x2, y2, { c: GHOST, w: 0.6, dash: '1.5 1.1' });
const path = (d, { c = INK, w = 0.35, dash = '', fill = 'none', op = 1 } = {}) => `<path d="${d}" stroke="${c}" stroke-width="${w}" fill="${fill}" ${dash ? `stroke-dasharray="${dash}"` : ''} opacity="${op}" stroke-linecap="round" stroke-linejoin="round"/>`;
const poly = (pts, o = {}) => path(`M${pts.map(p => `${f(p[0])} ${f(p[1])}`).join(' L')} Z`, o);
const pline = (pts, o = {}) => path(`M${pts.map(p => `${f(p[0])} ${f(p[1])}`).join(' L')}`, o);
const dot = (x, y, r = 0.95) => `<circle cx="${f(x)}" cy="${f(y)}" r="${r}" fill="${INK}"/>`;
const odot = (x, y, r = 0.85) => `<circle cx="${f(x)}" cy="${f(y)}" r="${r}" fill="#fff" stroke="${INK}" stroke-width="0.4"/>`;
const circ = (x, y, r, o = {}) => path(`M${f(x - r)} ${f(y)} a${f(r)} ${f(r)} 0 1 0 ${f(2 * r)} 0 a${f(r)} ${f(r)} 0 1 0 ${f(-2 * r)} 0`, o);
const ell = (x, y, rx, ry, o = {}) => path(`M${f(x - rx)} ${f(y)} a${f(rx)} ${f(ry)} 0 1 0 ${f(2 * rx)} 0 a${f(rx)} ${f(ry)} 0 1 0 ${f(-2 * rx)} 0`, o);
const halfEll = (x, y, rx, ry, front = true, o = {}) => path(`M${f(x - rx)} ${f(y)} a${f(rx)} ${f(ry)} 0 0 ${front ? 0 : 1} ${f(2 * rx)} 0`, o);
const txt = (x, y, s, { size = 2.6, c = '#444', anchor = 'start', mono = true, weight = 500 } = {}) =>
  `<text x="${f(x)}" y="${f(y)}" font-family="${mono ? 'JetBrains Mono, monospace' : 'Inter, sans-serif'}" font-size="${size}" font-weight="${weight}" fill="${c}" text-anchor="${anchor}">${esc(s)}</text>`;
const cellBox = (x, y, w, h, n) => poly([[x, y], [x + w, y], [x + w, y + h], [x, y + h]], { w: 0.35 }) + (n ? txt(x + 1.8, y + 4, String(n), { size: 3, c: INK, weight: 700 }) : '');
const arrowHead = (x, y, ang, s = 1.6, c = INK) => pline([[x - Math.cos(ang - 0.45) * s, y - Math.sin(ang - 0.45) * s], [x, y], [x - Math.cos(ang + 0.45) * s, y - Math.sin(ang + 0.45) * s]], { c, w: 0.4 });
function arrow(x1, y1, x2, y2, o = {}) { return ln(x1, y1, x2, y2, o) + arrowHead(x2, y2, Math.atan2(y2 - y1, x2 - x1), 1.6, o.c || INK); }
function hatch(pts, { angle = -0.95, gap = 1.1, w = 0.22, c = INK, op = 0.75, cross = false } = {}) {
  const id = `c${++uid}`, xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
  const cx = (Math.min(...xs) + Math.max(...xs)) / 2, cy = (Math.min(...ys) + Math.max(...ys)) / 2;
  const D = Math.hypot(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)) / 2 + 1;
  const pass = a => { let s = ''; const ux = Math.cos(a), uy = Math.sin(a); for (let t = -D; t <= D; t += gap) s += ln(cx - uy * t - ux * D, cy + ux * t - uy * D, cx - uy * t + ux * D, cy + ux * t + uy * D, { c, w, op }); return s; };
  return `<clipPath id="${id}"><path d="M${pts.map(p => `${f(p[0])} ${f(p[1])}`).join(' L')} Z"/></clipPath><g clip-path="url(#${id})">${pass(angle)}${cross ? pass(angle + 1.15) : ''}</g>`;
}
const ellPts = (x, y, rx, ry, a0 = 0, a1 = Math.PI * 2, n = 40) => Array.from({ length: n + 1 }, (_, i) => { const t = lerp(a0, a1, i / n); return [x + Math.cos(t) * rx, y + Math.sin(t) * ry]; });
function quadThrough(a, m, b) { const c = [2 * m[0] - (a[0] + b[0]) / 2, 2 * m[1] - (a[1] + b[1]) / 2]; return `M${f(a[0])} ${f(a[1])} Q${f(c[0])} ${f(c[1])} ${f(b[0])} ${f(b[1])}`; }
function smoothD(pts) {
  let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    d += ` C${f(p1[0] + (p2[0] - p0[0]) / 6)} ${f(p1[1] + (p2[1] - p0[1]) / 6)} ${f(p2[0] - (p3[0] - p1[0]) / 6)} ${f(p2[1] - (p3[1] - p1[1]) / 6)} ${f(p2[0])} ${f(p2[1])}`;
  }
  return d;
}
const grid = (cols, rows, x, y, w, h, gap) => { const cw = (w - gap * (cols - 1)) / cols, ch = (h - gap * (rows - 1)) / rows; return { cw, ch, at: (c, r) => [x + c * (cw + gap), y + r * (ch + gap)] }; };

// ---------- simple subjects (outlines in mm, for contour and gap drills)
function pearPts(cx, cy, s) { return [[0, -1], [0.18, -0.92], [0.28, -0.6], [0.25, -0.25], [0.48, 0.1], [0.55, 0.5], [0.38, 0.85], [0, 0.98], [-0.38, 0.85], [-0.55, 0.5], [-0.48, 0.1], [-0.25, -0.25], [-0.28, -0.6], [-0.18, -0.92], [0, -1]].map(([x, y]) => [cx + x * s, cy + y * s]); }
function mugD(cx, cy, s) {
  const w = 0.55 * s, h = 0.8 * s, t = cy - h / 2, b = cy + h / 2, ry = 0.12 * s;
  return `M${f(cx - w)} ${f(t)} L${f(cx - w)} ${f(b)} A${f(w)} ${f(ry)} 0 0 0 ${f(cx + w)} ${f(b)} L${f(cx + w)} ${f(t)} M${f(cx - w)} ${f(t)} A${f(w)} ${f(ry)} 0 1 0 ${f(cx + w)} ${f(t)} A${f(w)} ${f(ry)} 0 1 0 ${f(cx - w)} ${f(t)}`
    + ` M${f(cx + w)} ${f(t + 0.18 * s)} C${f(cx + w + 0.42 * s)} ${f(t + 0.12 * s)} ${f(cx + w + 0.42 * s)} ${f(b - 0.2 * s)} ${f(cx + w)} ${f(b - 0.22 * s)}`;
}
function leafPts(cx, cy, s) { return [[-1, 0], [-0.6, -0.32], [0, -0.42], [0.55, -0.25], [1, 0], [0.55, 0.25], [0, 0.42], [-0.6, 0.32], [-1, 0]].map(([x, y]) => [cx + x * s, cy + y * s]); }
function chair(cx, cy, s) {                               // front view of a ladder-back chair: outline + gap polygons
  const L = cx - 0.5 * s, Rr = cx + 0.5 * s, top = cy - 1.0 * s, seat = cy, bot = cy + 0.75 * s, t = 0.07 * s;
  const lines = [[[L, top], [L, bot]], [[L + t, top], [L + t, bot]], [[Rr, top], [Rr, bot]], [[Rr - t, top], [Rr - t, bot]], [[L, top], [Rr, top]], [[L, top + t], [Rr, top + t]],
    [[L, top + 0.33 * s], [Rr, top + 0.33 * s]], [[L, top + 0.33 * s + t], [Rr, top + 0.33 * s + t]], [[L, top + 0.66 * s], [Rr, top + 0.66 * s]], [[L, top + 0.66 * s + t], [Rr, top + 0.66 * s + t]],
    [[L - 0.04 * s, seat], [Rr + 0.04 * s, seat]], [[L - 0.04 * s, seat + 0.1 * s], [Rr + 0.04 * s, seat + 0.1 * s]], [[L, bot - 0.25 * s], [Rr, bot - 0.25 * s]], [[L, bot - 0.25 * s + t], [Rr, bot - 0.25 * s + t]]];
  const gaps = [[[L + t, top + t], [Rr - t, top + t], [Rr - t, top + 0.33 * s], [L + t, top + 0.33 * s]], [[L + t, top + 0.33 * s + t], [Rr - t, top + 0.33 * s + t], [Rr - t, top + 0.66 * s], [L + t, top + 0.66 * s]],
    [[L + t, top + 0.66 * s + t], [Rr - t, top + 0.66 * s + t], [Rr - t, seat], [L + t, seat]], [[L + t, seat + 0.1 * s], [Rr - t, seat + 0.1 * s], [Rr - t, bot - 0.25 * s], [L + t, bot - 0.25 * s]],
    [[L + t, bot - 0.25 * s + t], [Rr - t, bot - 0.25 * s + t], [Rr - t, bot], [L + t, bot]]];
  return { lines, gaps };
}
function stool(cx, cy, s) {                               // three-legged stool, front view
  const seatT = cy - 0.5 * s, seatB = seatT + 0.12 * s, w = 0.45 * s, bot = cy + 0.6 * s, rung = cy + 0.25 * s;
  const legs = [[[cx - 0.33 * s, seatB], [cx - 0.5 * s, bot]], [[cx + 0.33 * s, seatB], [cx + 0.5 * s, bot]], [[cx, seatB], [cx, bot - 0.05 * s]]];
  const lines = [[[cx - w, seatT], [cx + w, seatT]], [[cx - w, seatB], [cx + w, seatB]], [[cx - w, seatT], [cx - w, seatB]], [[cx + w, seatT], [cx + w, seatB]], ...legs,
    [[cx - 0.42 * s, rung], [cx + 0.42 * s, rung]]];
  const gaps = [[[cx - 0.33 * s, seatB], [cx - 0.02 * s, seatB], [cx - 0.02 * s, rung], [cx - 0.4 * s, rung]], [[cx + 0.02 * s, seatB], [cx + 0.33 * s, seatB], [cx + 0.4 * s, rung], [cx + 0.02 * s, rung]],
    [[cx - 0.4 * s, rung], [cx - 0.02 * s, rung], [cx - 0.02 * s, bot - 0.05 * s], [cx - 0.5 * s, bot]], [[cx + 0.02 * s, rung], [cx + 0.4 * s, rung], [cx + 0.5 * s, bot], [cx + 0.02 * s, bot - 0.05 * s]]];
  return { lines, gaps };
}

// ---------- perspective helpers for drills
const toward = (p, vp, k) => [p[0] + (vp[0] - p[0]) * k, p[1] + (vp[1] - p[1]) * k];
function isect(a1, a2, b1, b2) {
  const d = (a1[0] - a2[0]) * (b1[1] - b2[1]) - (a1[1] - a2[1]) * (b1[0] - b2[0]);
  if (Math.abs(d) < 1e-9) return a2;
  const t = ((a1[0] - b1[0]) * (b1[1] - b2[1]) - (a1[1] - b1[1]) * (b1[0] - b2[0])) / d;
  return [a1[0] + t * (a2[0] - a1[0]), a1[1] + t * (a2[1] - a1[1])];
}
function box1(front, vp, k, mode) {                       // one-point box from a front rectangle [x, y, w, h]
  const [x, y, w, h] = front, F = [[x, y], [x + w, y], [x + w, y + h], [x, y + h]], B = F.map(p => toward(p, vp, k));
  const st = mode === 'ghost' ? { c: GHOST, w: 0.55, dash: '1.4 1' } : { w: 0.4 };
  let s = '';
  if (mode !== 'free') s += poly(F, mode === 'ghost' ? st : { w: 0.45 });
  if (mode === 'dots') return s + F.map(p => dot(...p, 0.7)).join('');
  if (mode === 'ghost') {
    F.forEach(p => { s += ln(...p, ...vp, { c: FAINT, w: 0.3, dash: '0.6 0.8' }); });
    for (let i = 0; i < 4; i++) s += ln(...F[i], ...B[i], st) + ln(...B[i], ...B[(i + 1) % 4], st);
  }
  return s;
}
function box2(edge, vpL, vpR, a, b, mode) {               // two-point box from the near upright edge [x, yTop, yBot]
  const [x, yt, yb] = edge, T = [x, yt], Bt = [x, yb];
  const lt = toward(T, vpL, a), lb = toward(Bt, vpL, a), rt = toward(T, vpR, b), rb = toward(Bt, vpR, b);
  const back = isect(lt, vpR, rt, vpL);
  const st = mode === 'ghost' ? { c: GHOST, w: 0.55, dash: '1.4 1' } : { w: 0.45 };
  let s = ln(...T, ...Bt, mode === 'ghost' ? st : { w: 0.5 });
  if (mode === 'dots') return s + [T, Bt].map(p => dot(...p, 0.7)).join('');
  if (mode === 'free') return '';
  [T, Bt].forEach(p => { s += ln(...p, ...vpL, { c: FAINT, w: 0.3, dash: '0.6 0.8' }) + ln(...p, ...vpR, { c: FAINT, w: 0.3, dash: '0.6 0.8' }); });
  s += ln(...T, ...lt, st) + ln(...Bt, ...lb, st) + ln(...T, ...rt, st) + ln(...Bt, ...rb, st) + ln(...lt, ...lb, st) + ln(...rt, ...rb, st);
  s += ln(...lt, ...back, st) + ln(...rt, ...back, st);
  return s;
}

// ---------- practice drills: each returns SVG markup for an area w × h (mm)
const drills = {
  setup(R, w, h) {
    const g = grid(2, 2, 0, 0, w, h, 4); let s = '';
    const labels = [['Slow loops', 'fill the box, slowly'], ['Fast loops', 'fill the box, quickly'], ['Day 1 · a cup from memory', 'date: ________'], ['Day 1 · a cup from life', 'date: ________']];
    labels.forEach(([a, b], i) => { const [x, y] = g.at(i % 2, Math.floor(i / 2)); s += cellBox(x, y, g.cw, g.ch) + txt(x + 2, y + 4.5, a, { c: INK, weight: 700, size: 2.7 }) + txt(x + 2, y + g.ch - 2.5, b, { size: 2.3 }); });
    const [x0, y0] = g.at(0, 0); let lp = [];
    for (let t = 0; t < 30; t += 0.3) lp.push([x0 + 8 + t * 1.2 + Math.cos(t * 2.2) * 3, y0 + 14 + Math.sin(t * 2.2) * 3]);
    return s + pline(lp.filter(p => p[0] < x0 + g.cw - 6), { c: GHOST, w: 0.5 });
  },

  lineDrill(R, w, h) {
    const g = grid(2, 3, 0, 0, w, h, 4); let s = '';
    const plan = [['ghost', 'h'], ['ghost', 'd'], ['dots', 'v'], ['dots', 'h'], ['dots', 'd'], ['free', 'h']];
    plan.forEach(([mode, o], i) => {
      const [x, y] = g.at(i % 2, Math.floor(i / 2)), m = 5, top = 8, W = g.cw - 2 * m, H = g.ch - top - m;
      s += cellBox(x, y, g.cw, g.ch, i + 1);
      const len = max => Math.min(max, between(R, 30, 55));
      let segs = [];
      if (o === 'h') for (let k = 0; k < 3; k++) { const L = len(W), xx = x + m + R() * (W - L), yy = y + top + H * (k + 0.5) / 3; segs.push([xx, yy, xx + L, yy]); }
      if (o === 'v') for (let k = 0; k < 3; k++) { const L = len(H), xx = x + m + W * (k + 0.5) / 3, yy = y + top + R() * (H - L); segs.push([xx, yy, xx, yy + L]); }
      if (o === 'd') { const half = (W - 6) / 2, up = R() < 0.5; for (let k = 0; k < 2; k++) { const d = Math.min(half, H) * between(R, 0.75, 1), x0 = x + m + (half + 6) * k + R() * (half - d), y0 = y + top + R() * (H - d); segs.push(up ? [x0, y0 + d, x0 + d, y0] : [x0, y0, x0 + d, y0 + d]); } }
      if (mode === 'free') { const L = len(W); s += ln(x + m, y + top, x + m + L, y + top, { w: 0.5 }) + ln(x + m, y + top - 1.6, x + m, y + top + 1.6, { w: 0.45 }) + ln(x + m + L, y + top - 1.6, x + m + L, y + top + 1.6, { w: 0.45 }) + txt(x + m + L + 2, y + top + 1, '×3', { size: 2.8, c: INK }); }
      else segs.forEach(([a, b, c2, d]) => { if (mode === 'ghost') s += gl(a, b, c2, d); s += dot(a, b) + odot(c2, d); });
    });
    return s;
  },

  curveDrill(R, w, h) {
    const g = grid(2, 3, 0, 0, w, h, 4); let s = '';
    const modes = ['ghost', 'dots', 'free'];
    for (let r = 0; r < 3; r++) for (let c = 0; c < 2; c++) {
      const [x, y] = g.at(c, r), mode = modes[r], m = 6;
      s += cellBox(x, y, g.cw, g.ch, r * 2 + c + 1);
      for (let k = 0; k < 2; k++) {
        const yy = y + 10 + k * (g.ch - 12) / 2, x0 = x + m, x1 = x + g.cw - m, amp = between(R, 4, 8) * (R() < 0.5 ? -1 : 1);
        if (c === 0) {                                    // arcs through 3 points
          const a = [x0, yy + 4], b = [x1, yy + 4 + between(R, -3, 3)], mid = [lerp(x0, x1, between(R, 0.4, 0.6)), yy + 4 - Math.abs(amp)];
          if (mode === 'free') { if (k === 0) s += path(quadThrough([x0, yy + 2], [lerp(x0, x1, 0.25), yy - 2], [lerp(x0, x1, 0.5), yy + 2]), { w: 0.5 }) + txt(lerp(x0, x1, 0.55), yy + 2, '×4, like this', { size: 2.4 }); continue; }
          if (mode === 'ghost') s += path(quadThrough(a, mid, b), { c: GHOST, w: 0.6, dash: '1.5 1.1' });
          s += dot(...a) + odot(...mid, 0.75) + odot(...b);
        } else {                                          // S-curves through 4 points
          const pts = [[x0, yy + 4], [lerp(x0, x1, 0.33), yy + 4 - amp], [lerp(x0, x1, 0.66), yy + 4 + amp], [x1, yy + 4]];
          if (mode === 'free') { if (k === 0) s += path(smoothD([[x0, yy + 2], [x0 + 8, yy - 2], [x0 + 16, yy + 6], [x0 + 24, yy + 2]]), { w: 0.5 }) + txt(x0 + 27, yy + 3, '×4, like this', { size: 2.4 }); continue; }
          if (mode === 'ghost') s += path(smoothD(pts), { c: GHOST, w: 0.6, dash: '1.5 1.1' });
          s += dot(...pts[0]) + odot(...pts[1], 0.7) + odot(...pts[2], 0.7) + odot(...pts[3]);
        }
      }
    }
    return s;
  },

  angleDrill(R, w, h) {
    const g = grid(2, 3, 0, 0, w, h, 4); let s = '';
    const modes = ['ghost', 'ghost', 'dots', 'dots', 'free', 'free'];
    const angles = [15, 30, 45, 60, 75, 105, 120, 135, 150].sort(() => R() - 0.5);
    for (let i = 0; i < 6; i++) {
      const [x, y] = g.at(i % 2, Math.floor(i / 2)), mode = modes[i], a = angles[i] * Math.PI / 180, L = Math.min(g.ch - 12, g.cw / 2 - 8);
      s += cellBox(x, y, g.cw, g.ch, i + 1);
      const v1 = [x + (a > Math.PI / 2 ? L + 6 : 5), y + g.ch - 5], v2 = [x + g.cw / 2 + (a > Math.PI / 2 ? L + 4 : 4), y + g.ch - 5];
      s += ln(...v1, v1[0] + (a > Math.PI / 2 ? -L : L), v1[1], { w: 0.5 }) + ln(...v1, v1[0] + Math.cos(a) * L * (a > Math.PI / 2 ? 1 : 1), v1[1] - Math.sin(a) * L, { w: 0.5 });
      s += txt(x + 2, y + g.ch - 1.2, 'copy →', { size: 2.2 });
      s += ln(...v2, v2[0] + (a > Math.PI / 2 ? -L : L), v2[1], { w: 0.5 }) + dot(...v2, 0.7);
      if (mode !== 'free') for (let t = 15; t < 180; t += 15) { const tt = t * Math.PI / 180, r1 = L * (t % 45 ? 0.9 : 0.84); s += ln(v2[0] + Math.cos(tt) * r1, v2[1] - Math.sin(tt) * r1, v2[0] + Math.cos(tt) * L, v2[1] - Math.sin(tt) * L, { c: GUIDE, w: 0.25 }); }
      if (mode === 'ghost') s += gl(...v2, v2[0] + Math.cos(a) * L, v2[1] - Math.sin(a) * L);
    }
    return s;
  },

  contourDrill(R, w, h) {
    const g = grid(2, 3, 0, 0, w, h, 4); let s = '';
    const subj = [(cx, cy, sc, o) => path(smoothD(pearPts(cx, cy, sc)), o), (cx, cy, sc, o) => path(mugD(cx, cy, sc), o), (cx, cy, sc, o) => path(smoothD(leafPts(cx, cy, sc * 1.2)), o) + ln(cx - sc * 1.2, cy, cx + sc * 1.2, cy, o)];
    const dotsFor = [(cx, cy, sc) => pearPts(cx, cy, sc).filter((_, i) => i % 2 === 0), (cx, cy, sc) => [[cx - 0.55 * sc, cy - 0.4 * sc], [cx + 0.55 * sc, cy - 0.4 * sc], [cx - 0.55 * sc, cy + 0.4 * sc], [cx + 0.55 * sc, cy + 0.4 * sc], [cx + 0.85 * sc, cy], [cx, cy + 0.52 * sc]], (cx, cy, sc) => leafPts(cx, cy, sc * 1.2).filter((_, i) => i % 2 === 0)];
    const order = [0, 1, 2].sort(() => R() - 0.5);
    for (let r = 0; r < 3; r++) for (let c = 0; c < 2; c++) {
      const [x, y] = g.at(c, r), cx = x + g.cw / 2, cy = y + g.ch / 2 + 1, sc = Math.min(g.ch, g.cw) * 0.38, k = order[r];
      s += cellBox(x, y, g.cw, g.ch, r * 2 + c + 1);
      if (r < 2) s += c === 0 ? subj[k](cx, cy, sc, { c: GHOST, w: 0.6, dash: '1.5 1.1' }) : dotsFor[k](cx, cy, sc).map(p => dot(...p, 0.75)).join('');
      else s += c === 0 ? subj[k](cx, cy, sc, { w: 0.5 }) + txt(x + 2, y + g.ch - 2, 'look here…', { size: 2.3 }) : txt(x + 2, y + g.ch - 2, '…draw here', { size: 2.3 });
    }
    return s;
  },

  timedBoxes(R, w, h, spec) {
    const g = grid(2, 2, 0, 0, w, h, 4); let s = '';
    spec.boxes.forEach(([t, subj], i) => { const [x, y] = g.at(i % 2, Math.floor(i / 2)); s += cellBox(x, y, g.cw, g.ch) + circ(x + 5, y + 5, 2.6, { w: 0.4 }) + ln(x + 5, y + 5, x + 5, y + 3.3, { w: 0.4 }) + ln(x + 5, y + 5, x + 6.3, y + 5.6, { w: 0.4 }) + txt(x + 9.5, y + 6, `${t} · ${subj}`, { size: 2.7, c: INK, weight: 700 }) + txt(x + 2, y + g.ch - 2.5, 'eyes on the subject — don’t look down', { size: 2.2 }); });
    return s;
  },

  shapeDrill(R, w, h) {
    const g = grid(3, 4, 0, 0, w, h, 3); let s = '';
    const modes = ['ghost', 'dots', 'free'], shapes = ['circle', 'square', 'triangle', 'rect'].sort(() => R() - 0.5);
    shapes.forEach((sh, r) => modes.forEach((mode, c) => {
      const [x, y] = g.at(c, r), cx = x + g.cw / 2, cy = y + g.ch / 2 + 1, sz = Math.min(g.cw, g.ch) * between(R, 0.28, 0.36);
      s += cellBox(x, y, g.cw, g.ch);
      const gh = { c: GHOST, w: 0.6, dash: '1.5 1.1' };
      let pts = [];
      if (sh === 'circle') { if (mode === 'ghost') s += circ(cx, cy, sz, gh); if (mode === 'dots') pts = [[cx, cy - sz], [cx + sz, cy], [cx, cy + sz], [cx - sz, cy]]; if (mode === 'free') s += circ(x + 6, y + 6, 3, { w: 0.45 }) + txt(x + 10.5, y + 7, 'any size ×3', { size: 2.2 }); }
      if (sh === 'square') { const q = [[cx - sz, cy - sz], [cx + sz, cy - sz], [cx + sz, cy + sz], [cx - sz, cy + sz]]; if (mode === 'ghost') s += poly(q, gh); if (mode === 'dots') pts = q; if (mode === 'free') s += poly([[x + 3, y + 3], [x + 9, y + 3], [x + 9, y + 9], [x + 3, y + 9]], { w: 0.45 }) + txt(x + 11, y + 7, 'any size ×3', { size: 2.2 }); }
      if (sh === 'triangle') { const q = [[cx, cy - sz * 1.05], [cx + sz * 1.1, cy + sz * 0.8], [cx - sz * 1.1, cy + sz * 0.8]]; if (mode === 'ghost') s += poly(q, gh); if (mode === 'dots') pts = q; if (mode === 'free') s += poly([[x + 6, y + 3], [x + 9.5, y + 9], [x + 2.5, y + 9]], { w: 0.45 }) + txt(x + 11, y + 7, 'any size ×3', { size: 2.2 }); }
      if (sh === 'rect') { const rw = sz * 1.5, rh = sz * 0.75, q = [[cx - rw, cy - rh], [cx + rw, cy - rh], [cx + rw, cy + rh], [cx - rw, cy + rh]]; if (mode === 'ghost') s += poly(q, gh); if (mode === 'dots') pts = q; if (mode === 'free') s += poly([[x + 3, y + 4], [x + 13, y + 4], [x + 13, y + 9], [x + 3, y + 9]], { w: 0.45 }) + txt(x + 15, y + 7.5, 'same shape, bigger', { size: 2.2 }); }
      s += pts.map(p => dot(...p, 0.75)).join('');
    }));
    return s;
  },

  ellipseDrill(R, w, h) {
    let s = ''; const rows = 4, gap = 3, ch = (h - gap * (rows - 1)) / rows, modes = ['ghost', 'dots', 'free'];
    for (let r = 0; r < 3; r++) {
      const y = r * (ch + gap); s += cellBox(0, y, w, ch, r + 1);
      for (let k = 0; k < 5; k++) {
        const cx = w * (k + 0.6) / 5.2, cy = y + ch / 2 + 1.5, rx = Math.min(w / 15, ch * 0.42), ry = rx * [0.18, 0.32, 0.5, 0.7, 0.92][k];
        if (r === 0) s += ell(cx, cy, rx, ry, { c: GHOST, w: 0.6, dash: '1.5 1.1' }) + ln(cx - rx, cy, cx + rx, cy, { c: FAINT, w: 0.3 }) + ln(cx, cy - ry, cx, cy + ry, { c: FAINT, w: 0.3 });
        if (r === 1) s += ln(cx - rx, cy, cx + rx, cy, { c: FAINT, w: 0.3 }) + ln(cx, cy - ry, cx, cy + ry, { c: FAINT, w: 0.3 }) + [[cx - rx, cy], [cx + rx, cy], [cx, cy - ry], [cx, cy + ry]].map(p => dot(...p, 0.6)).join('');
        if (r === 2) s += ln(cx - 1.5, cy, cx + 1.5, cy, { c: GUIDE, w: 0.3 }) + ln(cx, cy - 1.5, cx, cy + 1.5, { c: GUIDE, w: 0.3 });
      }
      s += txt(w - 2, y + ch - 2, ['thin → round, trace', 'through the four dots', 'around each cross'][r], { size: 2.2, anchor: 'end' });
    }
    const y = 3 * (ch + gap); s += cellBox(0, y, w, ch, 4);
    const hz = y + 4.5, cx = w * 0.3; s += ln(4, hz, w - 4, hz, { c: GUIDE, w: 0.3, dash: '2 1.2' }) + txt(w - 4, hz - 1, 'eye level', { size: 2.2, anchor: 'end' });
    [0, 1, 2].forEach(k => { const cy = hz + 6 + k * (ch - 12) / 2.2, ry = 1.2 + k * 2.2; s += ell(cx, cy, 13, ry, { c: GHOST, w: 0.6, dash: '1.5 1.1' }); });
    s += ln(cx, hz + 3, cx, y + ch - 2, { c: FAINT, w: 0.3 }) + txt(w * 0.55, y + ch / 2 + 2, 'lower = rounder: copy the stack →', { size: 2.3 }) + ln(w * 0.86, hz + 3, w * 0.86, y + ch - 2, { c: FAINT, w: 0.3 });
    return s;
  },

  gapDrill(R, w, h) {
    const g = grid(3, 2, 0, 0, w, h, 4); let s = '';
    const subjects = [chair, stool].sort(() => R() - 0.5);
    subjects.forEach((fn, r) => ['ghost', 'dots', 'free'].forEach((mode, c) => {
      const [x, y] = g.at(c, r), sc = Math.min(g.cw, g.ch) * (fn === chair ? 0.5 : 0.62), { lines, gaps } = fn(x + g.cw / 2, y + g.ch * (fn === chair ? 0.55 : 0.52), sc);
      s += cellBox(x, y, g.cw, g.ch, r * 3 + c + 1);
      if (mode === 'ghost') s += gaps.map(q => hatch(q, { gap: 1.2, c: GUIDE, op: 0.6 })).join('') + lines.map(([a, b]) => ln(...a, ...b, { c: GHOST, w: 0.45 })).join('');
      if (mode === 'dots') s += gaps.flat().map(p => dot(...p, 0.55)).join('');
      if (mode === 'free') { const sm = fn(x + 9, y + 12, sc * 0.35); s += sm.lines.map(([a, b]) => ln(...a, ...b, { w: 0.3 })).join('') + txt(x + 2, y + g.ch - 2, 'draw it by its gaps', { size: 2.2 }); }
    }));
    return s;
  },

  depthDrill(R, w, h) {
    let s = ''; const rows = 3, gap = 4, ch = (h - gap * (rows - 1)) / rows;
    ['ghost', 'dots', 'free'].forEach((mode, r) => {
      const y = r * (ch + gap), hz = y + ch * 0.32, vp = [w * between(R, 0.55, 0.75), hz];
      s += cellBox(0, y, w, ch, r + 1) + ln(2, hz, w - 2, hz, { c: GUIDE, w: 0.3, dash: '2 1.2' });
      s += ln(w * 0.1, y + ch, ...vp, { w: 0.4 }) + ln(w * 0.5, y + ch, ...vp, { w: 0.4 });
      const ts = [0.08, 0.35, 0.58, 0.75].map(k => { const b = lerp2([w * 0.06, y + ch - 1.5], vp, k), size = (1 - k) * ch * 0.5; return [b, size]; });
      ts.forEach(([b, sz], i) => {
        const tree = (o) => ln(b[0], b[1], b[0], b[1] - sz * 0.45, o) + ell(b[0], b[1] - sz * 0.7, sz * 0.22, sz * 0.3, o);
        if (mode === 'ghost') s += tree({ c: GHOST, w: 0.55 }) + dot(b[0], b[1], 0.6);
        if (mode === 'dots') s += dot(b[0], b[1], 0.6) + ln(b[0] - 1, b[1] - sz, b[0] + 1, b[1] - sz, { c: GUIDE, w: 0.35 });
        if (mode === 'free' && i === 0) s += tree({ w: 0.45 });
      });
      s += txt(w - 2, y + ch - 2, ['trace: near is big and low, far is small and high', 'dots mark the base and the top', 'draw three more, each further away'][r], { size: 2.2, anchor: 'end' });
    });
    return s;
  },

  perspDrill(R, w, h, spec) {
    const g = grid(2, 3, 0, 0, w, h, 4); let s = '';
    const modes = ['ghost', 'ghost', 'dots', 'dots', 'free', 'free'];
    for (let i = 0; i < 6; i++) {
      const [x, y] = g.at(i % 2, Math.floor(i / 2)), mode = modes[i], hz = y + g.ch * between(R, 0.4, 0.55);
      s += cellBox(x, y, g.cw, g.ch, i + 1) + ln(x + 1.5, hz, x + g.cw - 1.5, hz, { c: GUIDE, w: 0.3, dash: '2 1.2' });
      const place = pick(R, ['above', 'on', 'below']);
      if (spec.vps === 1) {
        const vp = [x + g.cw * between(R, 0.35, 0.65), hz]; s += dot(...vp, 0.8) + txt(vp[0] + 1.5, vp[1] - 1.2, 'VP', { size: 2.1 });
        const bw = between(R, 9, 15), bh = between(R, 7, 12), bx = R() < 0.5 ? x + 4 : x + g.cw - 4 - bw;
        const by = place === 'above' ? hz - bh - between(R, 6, 9) : place === 'on' ? hz - bh * 0.5 : hz + between(R, 5, 8);
        s += box1([bx, Math.max(y + 7, Math.min(by, y + g.ch - bh - 2)), bw, bh], vp, between(R, 0.3, 0.45), mode);
      } else {
        const vpL = [x + 2, hz], vpR = [x + g.cw - 2, hz]; s += dot(...vpL, 0.8) + dot(...vpR, 0.8) + txt(vpL[0] + 1, vpL[1] - 1.2, 'VP', { size: 2.1 }) + txt(vpR[0] - 1, vpR[1] - 1.2, 'VP', { size: 2.1, anchor: 'end' });
        const ex = x + g.cw * between(R, 0.4, 0.6), eh = between(R, 10, 15);
        const yt = place === 'above' ? hz - eh - between(R, 4, 7) : place === 'on' ? hz - eh * 0.55 : hz + between(R, 4, 6);
        s += box2([ex, Math.max(y + 7, yt), Math.min(Math.max(y + 7, yt) + eh, y + g.ch - 2)], vpL, vpR, between(R, 0.3, 0.45), between(R, 0.3, 0.45), mode);
      }
      if (mode === 'free') s += txt(x + g.cw - 2, y + g.ch - 2, `a box ${place} eye level`, { size: 2.2, anchor: 'end' });
    }
    return s;
  },

  cylDrill(R, w, h) {
    let s = ''; const rows = 3, gap = 4, ch = (h - gap * (rows - 1)) / rows;
    ['ghost', 'dots', 'free'].forEach((mode, r) => {
      const y = r * (ch + gap), hz = y + ch * 0.38;
      s += cellBox(0, y, w, ch, r + 1) + ln(2, hz, w - 2, hz, { c: GUIDE, w: 0.3, dash: '2 1.2' }) + txt(w - 2, hz - 1, 'eye level', { size: 2.1, anchor: 'end' });
      [0.1, 0.27, 0.44].forEach(k => {
        const cx = w * k, rx = between(R, 6, 9), top = y + between(R, 4, 8), bot = y + ch - between(R, 3, 6);
        const ry = yy => Math.max(0.6, rx * Math.min(0.85, Math.abs(yy - hz) / ch * 1.1));
        if (mode === 'ghost') { const o = { c: GHOST, w: 0.55, dash: '1.4 1' }; s += ell(cx, top, rx, ry(top), o) + halfEll(cx, bot, rx, ry(bot), true, o) + halfEll(cx, bot, rx, ry(bot), false, { c: FAINT, w: 0.3, dash: '0.6 0.8' }) + ln(cx - rx, top, cx - rx, bot, o) + ln(cx + rx, top, cx + rx, bot, o); }
        if (mode === 'dots') s += ln(cx, top, cx, bot, { c: FAINT, w: 0.3 }) + [[cx - rx, top], [cx + rx, top], [cx, top - ry(top)], [cx, top + ry(top)], [cx - rx, bot], [cx + rx, bot], [cx, bot + ry(bot)]].map(p => dot(...p, 0.55)).join('');
        if (mode === 'free') s += ln(cx, top, cx, bot, { c: GUIDE, w: 0.3, dash: '1 1' });
      });
      s += txt(w - 2, y + ch - 2, ['trace — the ellipse nearest eye level is the thinnest', 'build each cylinder through the dots', 'a cylinder on each centre line'][r], { size: 2.2, anchor: 'end' });
    });
    return s;
  },

  valueDrill(R, w, h) {
    let s = ''; const types = [['straight hatching', false, false], ['cross-hatching', true, false], ['curved hatching', false, true]];
    const bh = (h - 3 * 8 - 2 * 4) / 6;
    types.forEach(([label, cross, curved], t) => {
      const y0 = t * (2 * bh + 8 + 4);
      s += txt(0, y0 + 3, label, { size: 2.6, c: INK, weight: 700 });
      for (const [row, filled] of [[0, true], [1, false]]) {
        const y = y0 + 5 + row * (bh + 2), bw = w / 5;
        for (let k = 0; k < 5; k++) {
          const q = [[k * bw, y], [(k + 1) * bw, y], [(k + 1) * bw, y + bh], [k * bw, y + bh]];
          s += poly(q, { w: 0.35 });
          if (filled && k > 0) {
            const gap = [0, 2.2, 1.3, 1.3, 0.9][k];
            if (curved) { const id = `c${++uid}`; s += `<clipPath id="${id}"><path d="M${q.map(p => `${f(p[0])} ${f(p[1])}`).join(' L')} Z"/></clipPath><g clip-path="url(#${id})">`; for (let xx = k * bw - bh; xx < (k + 1) * bw + bh; xx += gap) s += path(`M${f(xx)} ${f(y)} Q${f(xx + bh * 0.6)} ${f(y + bh / 2)} ${f(xx)} ${f(y + bh)}`, { w: 0.22, op: 0.8 }); if (k >= 3) for (let xx = k * bw - bh; xx < (k + 1) * bw + bh; xx += gap * 1.2) s += path(`M${f(xx)} ${f(y + bh)} Q${f(xx + bh * 0.6)} ${f(y + bh / 2)} ${f(xx + bh * 1.2)} ${f(y)}`, { w: 0.22, op: 0.7 }); s += '</g>'; }
            else s += hatch(q, { gap, cross: (cross && k >= 2) || k >= 3, w: 0.22, op: 0.8, angle: -0.8 }) + (k === 4 ? hatch(q, { gap: 1.0, angle: 0.2, w: 0.22, op: 0.7 }) : '');
          }
        }
        s += txt(w, y - 0.8, filled ? 'sample' : 'match it →', { size: 2.1, anchor: 'end' });
      }
    });
    return s;
  },

  formDrill(R, w, h) {
    const g = grid(3, 3, 0, 0, w, h - 5, 3); let s = '';
    const lights = [[-1, -1], [1, -1], [-1, -0.3]];
    for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) {
      const [x, y] = g.at(c, r), mode = ['ghost', 'zones', 'free'][c], L = lights[(r + c) % 3], cx = x + g.cw / 2, cy = y + g.ch / 2 + 2, sz = Math.min(g.cw, g.ch) * 0.28;
      s += cellBox(x, y, g.cw, g.ch);
      const lx = cx + L[0] * sz * 1.9, ly = cy + L[1] * sz * 1.5;
      s += arrow(lx - L[0] * 3, ly - L[1] * 3, lx, ly, { w: 0.4 }) + `<g transform="rotate(0)"></g>`;
      if (r === 0) {                                      // box
        const fq = [[cx - sz, cy - sz * 0.6], [cx, cy - sz * 0.25], [cx, cy + sz], [cx - sz, cy + sz * 0.62]], sq = [[cx, cy - sz * 0.25], [cx + sz, cy - sz * 0.6], [cx + sz, cy + sz * 0.62], [cx, cy + sz]], tq = [[cx - sz, cy - sz * 0.6], [cx, cy - sz * 0.95], [cx + sz, cy - sz * 0.6], [cx, cy - sz * 0.25]];
        const dark = L[0] < 0 ? sq : fq, mid = L[0] < 0 ? fq : sq;
        if (mode === 'ghost') s += hatch(dark, { gap: 0.8, cross: true, c: GUIDE, op: 0.7 }) + hatch(mid, { gap: 1.4, c: GUIDE, op: 0.6 });
        s += [fq, sq, tq].map(q => poly(q, mode === 'ghost' ? { c: GHOST, w: 0.45 } : { w: 0.45 })).join('');
      }
      if (r === 1) {                                      // cylinder
        const top = cy - sz * 0.9, bot = cy + sz, rx = sz * 0.8, ry = sz * 0.25, side = L[0] < 0 ? 1 : -1;
        const core = [[cx + side * rx * 0.2, top], [cx + side * rx, top], [cx + side * rx, bot], [cx + side * rx * 0.2, bot]];
        if (mode === 'ghost') s += hatch(core, { gap: 0.9, angle: 1.5, c: GUIDE, op: 0.7 });
        if (mode !== 'free') s += ln(cx + side * rx * 0.25, top, cx + side * rx * 0.25, bot, { c: GUIDE, w: 0.3, dash: '1 0.8' }) + ln(cx + side * rx * 0.85, top, cx + side * rx * 0.85, bot, { c: GUIDE, w: 0.3, dash: '1 0.8' });
        const o = mode === 'ghost' ? { c: GHOST, w: 0.45 } : { w: 0.45 };
        s += ell(cx, top, rx, ry, o) + halfEll(cx, bot, rx, ry, true, o) + ln(cx - rx, top, cx - rx, bot, o) + ln(cx + rx, top, cx + rx, bot, o);
      }
      if (r === 2) {                                      // ball
        const rad = sz * 0.95, ang = Math.atan2(L[1], L[0]);
        if (mode !== 'free') { const coreArc = ellPts(cx, cy, rad * 0.78, rad * 0.78, ang + Math.PI * 0.6, ang + Math.PI * 1.4, 24); s += pline(coreArc, { c: GUIDE, w: 0.3, dash: '1 0.8' }) + circ(cx + L[0] * rad * 0.4, cy + L[1] * rad * 0.4, rad * 0.16, { c: GUIDE, w: 0.3, dash: '0.8 0.6' }); }
        if (mode === 'ghost') s += hatch([...ellPts(cx, cy, rad, rad, ang + Math.PI * 0.55, ang + Math.PI * 1.45, 24), ...ellPts(cx, cy, rad * 0.7, rad * 0.7, ang + Math.PI * 1.45, ang + Math.PI * 0.55, 24)], { gap: 0.8, c: GUIDE, op: 0.7 });
        const shadowX = cx - L[0] * rad * 0.9;
        s += circ(cx, cy, rad, mode === 'ghost' ? { c: GHOST, w: 0.45 } : { w: 0.45 }) + ell(shadowX, cy + rad * 0.98, rad * 0.8, rad * 0.18, { c: mode === 'free' ? FAINT : GUIDE, w: 0.3, dash: mode === 'free' ? '' : '1 0.8' });
      }
    }
    return s + txt(0, h - 0.5, 'columns: trace the shading → shade the zones → shade it yourself', { size: 2.2 });
  },

  textureDrill(R, w, h) {
    let s = ''; const names = ['leaves', 'brick', 'glass', 'grass', 'water'], rows = 5, bigH = 34, gap = 3, rh = (h - bigH - gap * rows) / rows, cw = (w - 2 * 3) / 3;
    names.forEach((n, r) => {
      const y = r * (rh + gap);
      [0, 1, 2].forEach(c => { const x = c * (cw + 3); s += poly([[x, y], [x + cw, y], [x + cw, y + rh], [x, y + rh]], { w: 0.35 }); });
      s += txt(cw + 4.5, y + 3.5, 'copy', { size: 2.1 }) + txt(2 * cw + 7.5, y + 3.5, 'your own', { size: 2.1 }) + txt(1.5, y + 3.5, n, { size: 2.3, c: INK, weight: 700 });
      const x0 = 2, y0 = y + 5, ww = cw - 4, hh = rh - 7;
      if (n === 'leaves') { let p = []; for (let t = 0; t < 60; t += 0.35) { const cxp = x0 + 4 + (t / 60) * (ww - 8), cyp = y0 + hh / 2 + Math.sin(t * 0.7) * hh * 0.25; p.push([cxp + Math.cos(t * 1.9) * 2.1, cyp + Math.sin(t * 1.9) * 1.8]); } s += pline(p, { w: 0.3 }); }
      if (n === 'brick') for (let k = 0; k < 4; k++) for (let j = 0; j < 3; j++) { if (R() < 0.35) continue; const bx = x0 + (k % 2) * 2.5 + j * 9 + (R() < 0.5 ? 0 : 1), by = y0 + k * (hh / 4); s += poly([[bx, by], [bx + 7.5, by], [bx + 7.5, by + hh / 4 - 0.8], [bx, by + hh / 4 - 0.8]], { w: 0.3 }); }
      if (n === 'glass') { s += poly([[x0, y0], [x0 + ww, y0], [x0 + ww, y0 + hh], [x0, y0 + hh]], { w: 0.3 }); for (let k = 0; k < 3; k++) { const xx = x0 + 4 + k * 3.5; s += ln(xx, y0 + hh - 1, xx + 6, y0 + 1, { w: 0.3 }); } }
      if (n === 'grass') for (let k = 0; k < 22; k++) { const xx = x0 + R() * ww, hh2 = hh * between(R, 0.3, 0.8); s += ln(xx, y0 + hh, xx + between(R, -1, 1), y0 + hh - hh2, { w: 0.28 }); }
      if (n === 'water') for (let k = 0; k < 14; k++) { const xx = x0 + R() * (ww - 8), yy = y0 + R() * hh, l = between(R, 3, 8); s += ln(xx, yy, xx + l, yy, { w: 0.28 }); }
    });
    const y = rows * (rh + gap);
    s += poly([[0, y], [w, y], [w, y + bigH], [0, y + bigH]], { w: 0.35 }) + txt(2, y + 4, 'a brick wall with a window — suggestion only', { size: 2.4, c: INK, weight: 700 });
    s += poly([[w * 0.38, y + 9], [w * 0.62, y + 9], [w * 0.62, y + bigH - 5], [w * 0.38, y + bigH - 5]], { c: GHOST, w: 0.45 });
    return s;
  },

  thumbRow(R, w, h, spec, refs) {
    const r = refs.img(spec.ref, { width: w * 0.42 });
    let s = `<div class="tr-top">${r}<div class="tr-note"><b>One scene, many pictures.</b> Make each thumbnail different: move the horizon, crop closer, put the subject left or right. Then circle your favourite.</div></div>`;
    const prompts = [['horizon high', 'horizon low', 'close crop'], ['subject left', 'subject right', 'your choice']];
    s += `<div class="tr-grid">${prompts.flat().map(p => `<div class="tr-cell"><span>${p}</span></div>`).join('')}</div>`;
    return { html: s };
  },
};

// ---------- reference images and guide overlays
function makeRefs() {
  const plain = join(opt.out, 'refs', 'plain'), noted = join(opt.out, 'refs', 'noted');
  const need = (dir, seed) => opt.refs || !existsSync(join(dir, `diner-${seed}.png`));
  for (const seed of [21, 22, 23, 24, 25, 26, 27]) if (need(plain, seed)) execFileSync('node', [SKETCH, '--seed', String(seed), '--no-notes', '--out', plain], { stdio: 'inherit' });
  for (const seed of [31, 32]) if (need(noted, seed)) execFileSync('node', [SKETCH, '--seed', String(seed), '--out', noted], { stdio: 'inherit' });
  // three-value versions for S5.3 (blur away the lines, keep the big masses)
  for (const name of ['cityStreet-25', 'buildingFront-24']) {
    const src = join(plain, `${name}.png`), dst = join(plain, `${name}-3v.png`);
    if (opt.refs || !existsSync(dst)) execFileSync('convert', [src, '-blur', '0x22', '-normalize', '-posterize', '3', '-colorspace', 'Gray', dst]);
  }
  const file = (r, suffix = '') => join(r.notes ? noted : plain, `${r.scene}-${r.seed}${suffix}.png`);
  const meta = r => JSON.parse(readFileSync(join(r.notes ? noted : plain, `${r.scene}-${r.seed}.json`), 'utf8'));
  const rel = p => p.slice(opt.out.length + 1);
  return {
    img(r, { width, overlay = r.overlay, cls = '', suffix = '', grid: gridMode = null } = {}) {
      const m = meta(r);
      return `<div class="ref ${cls}" style="width:${f(width)}mm"><img src="${rel(file(r, suffix))}"/>${overlaySvg(m, overlay, gridMode)}</div>`;
    },
    meta,
  };
}

function overlaySvg(m, kind, gridMode) {
  const W = 1860, H = 1395, st = 'stroke="#000" fill="none" stroke-linecap="round"';
  let s = '';
  const dash = (pts, wd = 5, close = true) => `<path d="M${pts.map(p => `${f(p[0])} ${f(p[1])}`).join(' L')}${close ? ' Z' : ''}" ${st} stroke-width="${wd}" stroke-dasharray="22 14"/>`;
  const label = (x, y, t, anchor = 'start') => `<text x="${f(x)}" y="${f(y)}" font-family="JetBrains Mono" font-size="34" font-weight="700" fill="#000" text-anchor="${anchor}" paint-order="stroke" stroke="#fff" stroke-width="10">${esc(t)}</text>`;
  if (kind === 'horizon' || kind === 'vp' || kind === 'bands') s += `<line x1="0" y1="${f(m.horizon)}" x2="${W}" y2="${f(m.horizon)}" stroke="#000" stroke-width="5" stroke-dasharray="30 16"/>` + label(16, m.horizon - 14, 'EYE LEVEL (HORIZON)');
  if (kind === 'vp' && m.vps) {
    m.vps.forEach((v, i) => { const x = Math.max(24, Math.min(W - 24, v[0])); s += `<circle cx="${f(x)}" cy="${f(v[1])}" r="14" fill="#000"/>` + label(x + (v[0] > W - 200 ? -24 : 24), v[1] + 46, v[0] < 0 || v[0] > W ? 'VP (off page) →'.replace('→', v[0] < 0 ? '←' : '→') : 'VP', v[0] > W - 200 ? 'end' : 'start'); });
    (m.rays || []).forEach(([x, y, vi]) => { const v = m.vps[vi]; s += `<line x1="${f(x)}" y1="${f(y)}" x2="${f(v[0])}" y2="${f(v[1])}" stroke="#000" stroke-width="3.5" stroke-dasharray="14 10" opacity="0.85"/>`; });
  }
  if (kind === 'envelope' && m.envelopes) m.envelopes.forEach(([x0, y0, x1, y1]) => { const p = 10; s += dash([[x0 - p, y0 - p], [x1 + p, y0 - p], [x1 + p, y1 + p], [x0 - p, y1 + p]], 6); });
  if (kind === 'shapes' && m.shapes) { m.shapes.forEach(q => { s += dash(q, 7); }); if (m.envelopes) m.envelopes.slice(1).forEach(([x0, y0, x1, y1]) => { s += dash([[x0, y0], [x1, y0], [x1, y1], [x0, y1]], 5); }); }
  if (kind === 'ellipses' && m.ellipses) m.ellipses.forEach(([cx, cy, rx, ry]) => { if (cy < H + 50) s += `<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="${f(rx)}" ry="${f(ry)}" ${st} stroke-width="5" stroke-dasharray="16 10"/>`; });
  if (kind === 'people' && m.people) m.people.forEach(({ head, body }) => { s += `<ellipse cx="${f(head[0])}" cy="${f(head[1])}" rx="${f(head[2])}" ry="${f(head[3])}" ${st} stroke-width="5" stroke-dasharray="14 9"/>` + dash([[body[0], body[1]], [body[2], body[1]], [body[2], body[3]], [body[0], body[3]]], 5); });
  if (kind === 'align') { (m.alignV || []).forEach(x => { s += `<line x1="${f(x)}" y1="0" x2="${f(x)}" y2="${H}" stroke="#000" stroke-width="3" stroke-dasharray="6 10 26 10" opacity="0.8"/>`; }); (m.alignH || []).forEach(y => { s += `<line x1="0" y1="${f(y)}" x2="${W}" y2="${f(y)}" stroke="#000" stroke-width="3" stroke-dasharray="6 10 26 10" opacity="0.8"/>`; }); }
  if (kind === 'unit' && m.unit) {
    const { x, y0, px, count, win } = m.unit, xx = x - 70;
    s += `<rect x="${f(win[0][0] - 8)}" y="${f(win[1][1] - 8)}" width="${f(win[1][0] - win[0][0] + 16)}" height="${f(win[0][1] - win[1][1] + 16)}" ${st} stroke-width="6"/>` + label(win[1][0] + 18, win[1][1] + 30, '= 1 unit');
    s += `<line x1="${f(xx)}" y1="${f(y0)}" x2="${f(xx)}" y2="${f(y0 - px * count)}" stroke="#000" stroke-width="5"/>`;
    for (let k = 0; k <= count; k++) s += `<line x1="${f(xx - 18)}" y1="${f(y0 - px * k)}" x2="${f(xx + 18)}" y2="${f(y0 - px * k)}" stroke="#000" stroke-width="5"/>` + (k ? label(xx - 26, y0 - px * k + 12, String(k), 'end') : '');
  }
  if (kind === 'bands' && m.bands) m.bands.forEach(([name, y0, y1]) => { const ym = (y0 + y1) / 2; s += `<path d="M${W - 70} ${f(y0 + 10)} L${W - 50} ${f(y0 + 10)} L${W - 50} ${f(y1 - 10)} L${W - 70} ${f(y1 - 10)}" ${st} stroke-width="5"/>` + label(W - 80, ym + 12, name.toUpperCase(), 'end'); });
  if (gridMode) { const cols = gridMode === 'half' ? 3 : 6, rows = gridMode === 'half' ? 2 : 4; for (let c = 1; c < cols; c++) s += `<line x1="${f(W * c / cols)}" y1="0" x2="${f(W * c / cols)}" y2="${H}" stroke="#000" stroke-width="4"/>`; for (let r = 1; r < rows; r++) s += `<line x1="0" y1="${f(H * r / rows)}" x2="${W}" y2="${f(H * r / rows)}" stroke="#000" stroke-width="4"/>`; }
  return s ? `<svg class="ov" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">${s}</svg>` : '';
}

// ---------- instruction-page diagrams (w × h mm)
const D = {
  setup(w, h) {
    const sx = w * 0.2, sy = h * 0.3, ex = w * 0.42, ey = h * 0.62, wx = w * 0.62, wy = h * 0.5, px = w * 0.7, py = h * 0.62;
    let s = ln(sx, sy, ex, ey, { w: 1.2 }) + ln(ex, ey, wx, wy, { w: 1.2 }) + ln(wx, wy, px, py, { w: 0.8 }) + ln(px - 2, py - 3, px + 7, py + 9, { w: 0.9 });
    [[sx, sy, 'shoulder — long lines'], [ex, ey, 'elbow — medium'], [wx, wy, 'wrist — small details']].forEach(([x, y, t], i) => { s += circ(x, y, 2.2, { w: 0.5, fill: '#fff' }) + txt(x + (i === 1 ? -3 : 4), y + (i === 1 ? 7 : -4), t, { size: 2.6, c: INK, anchor: i === 1 ? 'middle' : 'start' }); });
    s += path(`M${f(w * 0.08)} ${f(h * 0.9)} Q${f(w * 0.45)} ${f(h * 0.7)} ${f(w * 0.92)} ${f(h * 0.88)}`, { c: GHOST, w: 0.6, dash: '1.5 1.1' }) + txt(w * 0.92, h * 0.97, 'a long line swings from the shoulder', { size: 2.3, anchor: 'end' });
    return s;
  },
  ghost(w, h) {
    const a = [w * 0.12, h * 0.68], b = [w * 0.82, h * 0.42];
    let s = '';
    [10, 6.5, 3].forEach((lift, i) => { s += path(quadThrough([a[0], a[1] - lift], lerp2([a[0], a[1] - lift - 2], [b[0], b[1] - lift - 2], 0.5), [b[0], b[1] - lift]), { c: GHOST, w: 0.5, dash: '1.2 1' }); });
    s += txt(w * 0.47, h * 0.18, '1 · ghost it — 2 or 3 times in the air', { size: 2.6, c: INK, anchor: 'middle' });
    s += ln(...a, ...b, { w: 0.7 }) + dot(...a, 1.3) + odot(...b, 1.2) + txt(a[0], a[1] + 7, 'start', { size: 2.4, anchor: 'middle' });
    s += path(`M${f(b[0] + 3)} ${f(b[1] - 9)} q4 -3 8 0 q-4 3 -8 0`, { w: 0.5 }) + circ(b[0] + 7, b[1] - 9, 1, { fill: INK, w: 0.2 }) + txt(b[0] + 7, b[1] - 13, 'eyes here', { size: 2.4, anchor: 'middle' });
    s += txt(w * 0.47, h * 0.92, '2 · pen down, eyes on the end dot, one smooth stroke', { size: 2.6, c: INK, anchor: 'middle' });
    return s;
  },
  curve(w, h) {
    const a = [w * 0.06, h * 0.7], m = [w * 0.24, h * 0.25], b = [w * 0.42, h * 0.7];
    let s = path(quadThrough(a, m, b), { w: 0.6 }) + dot(...a, 1.1) + odot(...m, 1) + odot(...b, 1.1) + txt(m[0], m[1] - 3, 'middle', { size: 2.4, anchor: 'middle' }) + txt(w * 0.24, h * 0.92, 'arc through 3 points', { size: 2.5, c: INK, anchor: 'middle' });
    const p = [[w * 0.55, h * 0.55], [w * 0.67, h * 0.25], [w * 0.8, h * 0.75], [w * 0.94, h * 0.45]];
    s += path(smoothD(p), { w: 0.6 }) + p.map((q, i) => (i === 0 ? dot(...q, 1.1) : odot(...q, 1))).join('') + txt(w * 0.745, h * 0.92, 'S-curve: the turn switches in the middle', { size: 2.5, c: INK, anchor: 'middle' });
    return s;
  },
  clock(w, h) {
    const cx = w * 0.25, cy = h * 0.55, r = h * 0.38;
    let s = circ(cx, cy, r, { w: 0.5 });
    for (let k = 0; k < 12; k++) { const a = k * Math.PI / 6; s += ln(cx + Math.sin(a) * r * 0.86, cy - Math.cos(a) * r * 0.86, cx + Math.sin(a) * r, cy - Math.cos(a) * r, { w: k % 3 ? 0.3 : 0.6 }); }
    s += txt(cx, cy - r + 6, '12', { size: 2.4, anchor: 'middle', c: INK }) + txt(cx + r - 5, cy + 1, '3', { size: 2.4, anchor: 'middle', c: INK });
    s += ln(cx, cy, cx + Math.sin(Math.PI / 3) * r * 0.8, cy - Math.cos(Math.PI / 3) * r * 0.8, { w: 0.9 }) + ln(cx, cy, cx + r * 0.8, cy, { c: GUIDE, w: 0.4, dash: '1.5 1' });
    s += txt(cx + r + 4, cy - r * 0.6, '“it points to 2 o’clock”', { size: 2.7, c: INK });
    const rx = w * 0.62, ry = h * 0.85;
    s += ln(rx, ry, rx + w * 0.3, ry, { c: GUIDE, w: 0.4, dash: '1.5 1' }) + ln(rx, ry, rx + Math.cos(Math.PI / 6) * w * 0.25, ry - Math.sin(Math.PI / 6) * w * 0.25, { w: 0.9 }) + txt(rx, ry + 5, 'faint level line first, then the edge', { size: 2.4 });
    return s;
  },
  contour(w, h) {
    const pts = pearPts(w * 0.3, h * 0.52, h * 0.42);
    let s = path(smoothD(pts), { w: 0.6 });
    for (let k = 2; k < 8; k += 2) { const p = pts[k], q = pts[k + 1]; s += arrow(p[0] + 3, p[1], q[0] + 3, q[1], { c: GUIDE, w: 0.35 }); }
    s += txt(w * 0.55, h * 0.3, 'eyes crawl along the edge like an ant…', { size: 2.7, c: INK }) + txt(w * 0.55, h * 0.45, '…and the pen moves at the same speed.', { size: 2.7, c: INK }) + txt(w * 0.55, h * 0.65, 'Glance at the page only to change direction.', { size: 2.4 });
    return s;
  },
  blind(w, h) {
    let s = path(smoothD(pearPts(w * 0.78, h * 0.5, h * 0.36)), { w: 0.6 }) + txt(w * 0.78, h * 0.97, 'look here', { size: 2.5, anchor: 'middle', c: INK });
    s += poly([[w * 0.08, h * 0.2], [w * 0.45, h * 0.2], [w * 0.45, h * 0.85], [w * 0.08, h * 0.85]], { w: 0.4 }) + hatch([[w * 0.08, h * 0.2], [w * 0.45, h * 0.2], [w * 0.45, h * 0.85], [w * 0.08, h * 0.85]], { gap: 1.6, c: GUIDE, op: 0.5 });
    s += txt(w * 0.265, h * 0.55, 'page covered', { size: 2.8, anchor: 'middle', c: INK, weight: 700 }) + arrow(w * 0.5, h * 0.5, w * 0.62, h * 0.5, { w: 0.5 });
    return s;
  },
  shapes(w, h) {
    const y = h * 0.5, r = h * 0.28; let s = '';
    s += circ(w * 0.12, y, r, { w: 0.6 });
    const sq = [[w * 0.3, y - r], [w * 0.3 + 2 * r, y - r], [w * 0.3 + 2 * r, y + r], [w * 0.3, y + r]]; s += poly(sq, { w: 0.6 }) + sq.map(p => dot(...p, 0.9)).join('');
    const tr = [[w * 0.6, y - r], [w * 0.6 + r * 1.1, y + r], [w * 0.6 - r * 1.1, y + r]]; s += poly(tr, { w: 0.6 }) + tr.map(p => dot(...p, 0.9)).join('');
    const re = [[w * 0.75, y - r * 0.6], [w * 0.97, y - r * 0.6], [w * 0.97, y + r * 0.6], [w * 0.75, y + r * 0.6]]; s += poly(re, { w: 0.6 }) + re.map(p => dot(...p, 0.9)).join('');
    s += txt(w / 2, h * 0.95, 'corners first as light dots — then connect with straight strokes', { size: 2.5, anchor: 'middle', c: INK });
    return s;
  },
  ellipse(w, h) {
    let s = ln(w * 0.04, h * 0.18, w * 0.96, h * 0.18, { c: GUIDE, w: 0.4, dash: '2 1.2' }) + txt(w * 0.96, h * 0.14, 'eye level', { size: 2.3, anchor: 'end' });
    [0.32, 0.52, 0.72].forEach((k, i) => { const ry = 1.2 + i * 2.3; s += ell(w * 0.2, h * k, w * 0.11, ry, { w: 0.6 }); });
    s += txt(w * 0.2, h * 0.97, 'lower = rounder', { size: 2.4, anchor: 'middle', c: INK });
    const cx = w * 0.62, cy = h * 0.55, rx = w * 0.2, ry = h * 0.22;
    s += ell(cx, cy, rx, ry, { w: 0.7 }) + ln(cx - rx, cy, cx + rx, cy, { c: GUIDE, w: 0.35, dash: '1.5 1' }) + ln(cx, cy - ry, cx, cy + ry, { c: GUIDE, w: 0.35, dash: '1.5 1' });
    s += txt(cx + rx + 2, cy + 1, 'round ends,', { size: 2.4 }) + txt(cx + rx + 2, cy + 4.5, 'never points', { size: 2.4 }) + txt(cx, h * 0.98, 'long axis + short axis, then one loop', { size: 2.4, anchor: 'middle', c: INK });
    return s;
  },
  shapesInThings(w, h) {
    let s = path(mugD(w * 0.13, h * 0.5, h * 0.55), { w: 0.6 }) + arrow(w * 0.25, h * 0.5, w * 0.31, h * 0.5, { w: 0.5 });
    const cx = w * 0.4, t = h * 0.28, b = h * 0.72, rx = h * 0.3; s += ell(cx, t, rx, 2.2, { c: GUIDE, w: 0.5, dash: '1.5 1' }) + halfEll(cx, b, rx, 2.2, true, { c: GUIDE, w: 0.5, dash: '1.5 1' }) + ln(cx - rx, t, cx - rx, b, { c: GUIDE, w: 0.5, dash: '1.5 1' }) + ln(cx + rx, t, cx + rx, b, { c: GUIDE, w: 0.5, dash: '1.5 1' }) + ell(cx + rx + 3, h * 0.5, 3, 7, { c: GUIDE, w: 0.5, dash: '1.5 1' });
    s += txt(w * 0.27, h * 0.97, 'mug = cylinder + loop', { size: 2.4, anchor: 'middle', c: INK });
    const hx = w * 0.63, hy = h * 0.82, hw = w * 0.16, hh = h * 0.36;
    s += poly([[hx, hy], [hx + hw, hy], [hx + hw, hy - hh], [hx, hy - hh]], { c: GUIDE, w: 0.5, dash: '1.5 1' }) + poly([[hx - 2, hy - hh], [hx + hw + 2, hy - hh], [hx + hw / 2, hy - hh - h * 0.3]], { c: GUIDE, w: 0.5, dash: '1.5 1' }) + poly([[hx + hw * 0.7, hy - hh - h * 0.16], [hx + hw * 0.82, hy - hh - h * 0.1], [hx + hw * 0.82, hy - hh - h * 0.3], [hx + hw * 0.7, hy - hh - h * 0.3]], { c: GUIDE, w: 0.5, dash: '1.5 1' });
    s += txt(w * 0.83, h * 0.4, 'box', { size: 2.4 }) + txt(w * 0.83, h * 0.3, '+ triangle', { size: 2.4 }) + txt(w * 0.83, h * 0.2, '+ small box', { size: 2.4 }) + txt(w * 0.71, h * 0.97, 'farmhouse = box + triangle', { size: 2.4, anchor: 'middle', c: INK });
    return s;
  },
  gaps(w, h) {
    const { lines, gaps } = chair(w * 0.25, h * 0.52, h * 0.48);
    let s = gaps.map(q => hatch(q, { gap: 1.1, c: GUIDE, op: 0.7 })).join('') + lines.map(([a, b]) => ln(...a, ...b, { w: 0.4 })).join('');
    s += txt(w * 0.5, h * 0.35, 'Draw the shaded shapes — the gaps.', { size: 2.7, c: INK }) + txt(w * 0.5, h * 0.5, 'Get the gaps right and the chair', { size: 2.5 }) + txt(w * 0.5, h * 0.62, 'appears between them by itself.', { size: 2.5 });
    return s;
  },
  envelope(w, h) {
    const blob = [[0.2, 0.85], [0.12, 0.6], [0.2, 0.35], [0.3, 0.2], [0.42, 0.28], [0.5, 0.15], [0.58, 0.32], [0.55, 0.6], [0.6, 0.85]].map(([x, y]) => [x * w, y * h]);
    let s = path(smoothD([...blob, blob[0]]), { w: 0.6 }) + ln(w * 0.36, h * 0.85, w * 0.38, h * 0.97, { w: 0.6 });
    const env = [[0.1, 0.9], [0.1, 0.33], [0.29, 0.13], [0.5, 0.1], [0.64, 0.3], [0.64, 0.9]].map(([x, y]) => [x * w, y * h]);
    s += poly(env, { c: GUIDE, w: 0.6, dash: '2 1.2' }) + txt(w * 0.7, h * 0.4, 'straight lines that wrap', { size: 2.6, c: INK }) + txt(w * 0.7, h * 0.52, 'the whole subject', { size: 2.6, c: INK }) + txt(w * 0.7, h * 0.68, 'tall or wide? check first', { size: 2.4 });
    return s;
  },
  measure(w, h) {
    const base = h * 0.92, unit = h * 0.2, x = w * 0.18;
    let s = poly([[x, base - unit * 1.9], [x + w * 0.1, base - unit * 1.9], [x + w * 0.1, base - unit * 2.9], [x, base - unit * 2.9]], { w: 0.6 }) + txt(x + w * 0.11, base - unit * 2.4, '1 unit', { size: 2.4, c: INK });
    s += poly([[w * 0.42, base], [w * 0.55, base], [w * 0.55, base - unit * 2], [w * 0.42, base - unit * 2]], { w: 0.6 }) + txt(w * 0.485, base + 4, 'door = 2 units', { size: 2.4, anchor: 'middle', c: INK });
    for (let k = 0; k <= 4; k++) s += ln(w * 0.66, base - unit * k, w * 0.69, base - unit * k, { w: 0.5 });
    s += ln(w * 0.675, base, w * 0.675, base - unit * 4, { w: 0.5 }) + txt(w * 0.71, base - unit * 2, 'ticks first,', { size: 2.4 }) + txt(w * 0.71, base - unit * 2 + 3.6, 'then draw', { size: 2.4 });
    s += ln(w * 0.03, base - unit * 2.9, w * 0.03, base - unit * 1.9, { w: 1.2 }) + ln(w * 0.015, base - unit * 1.9, w * 0.045, base - unit * 1.9, { w: 0.8 }) + txt(w * 0.03, base - unit * 3.1, 'pen + thumb', { size: 2.2, anchor: 'middle' });
    return s;
  },
  plumb(w, h) {
    const x0 = w * 0.1, x1 = w * 0.55, b = h * 0.92, t = h * 0.3;
    let s = poly([[x0, b], [x1, b], [x1, t], [x0, t]], { w: 0.6 }) + poly([[x0 - 2, t], [x1 + 2, t], [(x0 + x1) / 2, h * 0.08]], { w: 0.6 });
    s += poly([[x0 + 6, t + 8], [x0 + 14, t + 8], [x0 + 14, t + 18], [x0 + 6, t + 18]], { w: 0.5 }) + poly([[x1 - 14, t + 8], [x1 - 6, t + 8], [x1 - 6, t + 18], [x1 - 14, t + 18]], { w: 0.5 }) + poly([[x0 + 6, b], [x0 + 14, b], [x0 + 14, b - 16], [x0 + 6, b - 16]], { w: 0.5 });
    s += ln(x0 + 6, h * 0.2, x0 + 6, b + 2, { c: GUIDE, w: 0.4, dash: '1.5 1' }) + ln(x0 - 4, t + 8, x1 + 12, t + 8, { c: GUIDE, w: 0.4, dash: '1.5 1' });
    s += txt(x1 + 6, t + 6, 'window tops are level', { size: 2.5 }) + txt(x1 + 6, h * 0.75, 'window edge sits right', { size: 2.5 }) + txt(x1 + 6, h * 0.75 + 3.6, 'above the door edge', { size: 2.5 });
    return s;
  },
  grid(w, h) {
    const sz = h * 0.8, y = h * 0.1, x1 = w * 0.08, x2 = w * 0.55; let s = '';
    for (const x of [x1, x2]) { s += poly([[x, y], [x + sz * 1.33, y], [x + sz * 1.33, y + sz], [x, y + sz]], { w: 0.5 }); for (let k = 1; k < 4; k++) s += ln(x + sz * 1.33 * k / 4, y, x + sz * 1.33 * k / 4, y + sz, { c: GUIDE, w: 0.3 }); for (let k = 1; k < 3; k++) s += ln(x, y + sz * k / 3, x + sz * 1.33, y + sz * k / 3, { c: GUIDE, w: 0.3 }); }
    s += path(`M${f(x1 + 3)} ${f(y + sz * 0.8)} Q${f(x1 + sz * 0.5)} ${f(y + sz * 0.1)} ${f(x1 + sz * 1.2)} ${f(y + sz * 0.7)}`, { w: 0.6 });
    s += path(`M${f(x2 + sz * 0.333)} ${f(y + sz * 0.42)} Q${f(x2 + sz * 0.45)} ${f(y + sz * 0.22)} ${f(x2 + sz * 0.665)} ${f(y + sz * 0.2)}`, { w: 0.6 }) + hatch([[x2 + sz * 0.333, y + sz * 0.333], [x2 + sz * 0.665, y + sz * 0.333], [x2 + sz * 0.665, y], [x2 + sz * 0.333, y]], { gap: 1.6, c: GUIDE, op: 0.3 });
    return s + txt(w / 2, h * 0.99, 'one square at a time', { size: 2.4, anchor: 'middle', c: INK });
  },
  horizon(w, h) {
    const hz = h * 0.48; let s = ln(w * 0.02, hz, w * 0.98, hz, { c: GUIDE, w: 0.45, dash: '2 1.2' }) + txt(w * 0.98, hz - 1.5, 'eye level', { size: 2.4, anchor: 'end' });
    const vp = [w * 0.5, hz];
    s += box1([w * 0.1, h * 0.08, 16, 10], vp, 0.35, 'ghost').replaceAll(GHOST, INK) + txt(w * 0.1, h * 0.04 + 1, 'above: see the underside', { size: 2.3 });
    s += box1([w * 0.7, hz + 8, 16, 10], vp, 0.35, 'ghost').replaceAll(GHOST, INK) + txt(w * 0.68, h * 0.97, 'below: see the top', { size: 2.3 });
    s += box1([w * 0.38, hz - 6, 14, 12], vp, 0.3, 'ghost').replaceAll(GHOST, INK);
    return s;
  },
  depth(w, h) {
    const hz = h * 0.3, vp = [w * 0.7, hz]; let s = ln(0, hz, w, hz, { c: GUIDE, w: 0.4, dash: '2 1.2' }) + ln(w * 0.05, h, ...vp, { w: 0.45 }) + ln(w * 0.45, h, ...vp, { w: 0.45 });
    [0.05, 0.35, 0.6, 0.78].forEach((k, i) => { const b = lerp2([w * 0.02, h * 0.97], vp, k), sz = (1 - k) * h * 0.7; s += ln(b[0], b[1], b[0], b[1] - sz * 0.45, { w: 0.6 - i * 0.1 }) + ell(b[0], b[1] - sz * 0.7, sz * 0.22, sz * 0.3, { w: 0.6 - i * 0.1, op: 1 - i * 0.2 }); });
    s += txt(w * 0.55, h * 0.75, 'near: big, low, dark', { size: 2.4, c: INK }) + txt(w * 0.55, h * 0.86, 'far: small, high, light', { size: 2.4 });
    return s;
  },
  onePoint(w, h) {
    const hz = h * 0.45, vp = [w * 0.55, hz]; let s = ln(w * 0.02, hz, w * 0.98, hz, { c: GUIDE, w: 0.45, dash: '2 1.2' }) + dot(...vp, 1) + txt(vp[0] + 2, vp[1] - 2, 'VP', { size: 2.4, c: INK });
    s += box1([w * 0.08, h * 0.55, 26, 16], vp, 0.45, 'ghost').replaceAll(GHOST, INK) + box1([w * 0.75, h * 0.08, 18, 12], vp, 0.4, 'ghost').replaceAll(GHOST, INK);
    s += txt(w * 0.3, h * 0.97, 'front faces are plain rectangles; edges going away aim at the VP', { size: 2.4, c: INK });
    return s;
  },
  twoPoint(w, h) {
    const hz = h * 0.35, vpL = [w * 0.02, hz], vpR = [w * 0.98, hz];
    let s = ln(0, hz, w, hz, { c: GUIDE, w: 0.45, dash: '2 1.2' }) + dot(...vpL, 1) + dot(...vpR, 1) + txt(vpL[0] + 2, hz - 2, 'VP', { size: 2.4, c: INK }) + txt(vpR[0] - 2, hz - 2, 'VP', { size: 2.4, c: INK, anchor: 'end' });
    s += box2([w * 0.5, h * 0.45, h * 0.95], vpL, vpR, 0.35, 0.3, 'ghost').replaceAll(GHOST, INK);
    s += txt(w * 0.53, h * 0.6, 'near corner', { size: 2.3 }) + txt(w * 0.53, h * 0.6 + 3.4, 'stays upright', { size: 2.3 });
    return s;
  },
  boxesCyl(w, h) {
    let s = poly([[w * 0.05, h * 0.75], [w * 0.4, h * 0.75], [w * 0.4, h * 0.5], [w * 0.05, h * 0.5]], { c: GUIDE, w: 0.5, dash: '1.5 1' }) + poly([[w * 0.12, h * 0.5], [w * 0.32, h * 0.5], [w * 0.28, h * 0.3], [w * 0.15, h * 0.3]], { c: GUIDE, w: 0.5, dash: '1.5 1' });
    s += ell(w * 0.12, h * 0.77, 4, 4, { w: 0.6 }) + ell(w * 0.33, h * 0.77, 4, 4, { w: 0.6 }) + txt(w * 0.22, h * 0.95, 'car = 2 boxes + wheels', { size: 2.4, anchor: 'middle', c: INK });
    s += ell(w * 0.65, h * 0.3, 9, 2.5, { w: 0.6 }) + ln(w * 0.65, h * 0.32, w * 0.65, h * 0.85, { w: 0.6 }) + halfEll(w * 0.65, h * 0.65, 6, 1.6, true, { w: 0.5 }) + txt(w * 0.65, h * 0.95, 'stool = ellipse + post + ring', { size: 2.4, anchor: 'middle', c: INK });
    s += ell(w * 0.88, h * 0.2, 6, 1.8, { w: 0.6 }) + ln(w * 0.88 - 6, h * 0.2, w * 0.88 - 6, h * 0.85, { w: 0.6 }) + ln(w * 0.88 + 6, h * 0.2, w * 0.88 + 6, h * 0.85, { w: 0.6 }) + halfEll(w * 0.88, h * 0.85, 6, 1.8, true, { w: 0.6 }) + path(`M${f(w * 0.88 - 6)} ${f(h * 0.2)} Q${f(w * 0.88)} ${f(h * 0.02)} ${f(w * 0.88 + 6)} ${f(h * 0.2)}`, { w: 0.6 });
    return s;
  },
  value(w, h) {
    const bw = w * 0.16, y = h * 0.25, bh = h * 0.45; let s = '';
    for (let k = 0; k < 5; k++) { const x = w * 0.08 + k * bw, q = [[x, y], [x + bw, y], [x + bw, y + bh], [x, y + bh]]; s += poly(q, { w: 0.4 }); if (k) s += hatch(q, { gap: [0, 2.2, 1.3, 1.3, 0.9][k], cross: k >= 3, w: 0.25 }) + (k === 4 ? hatch(q, { gap: 1, angle: 0.2, w: 0.25 }) : ''); s += txt(x + bw / 2, y + bh + 5, String(k + 1), { size: 2.6, anchor: 'middle', c: INK }); }
    return s + txt(w / 2, h * 0.14, 'darker = closer lines and more layers — not harder pressing', { size: 2.5, anchor: 'middle', c: INK });
  },
  forms(w, h) {
    let s = arrow(w * 0.02, h * 0.08, w * 0.09, h * 0.2, { w: 0.5 }) + txt(w * 0.1, h * 0.1, 'light', { size: 2.4 });
    const cx = w * 0.22, cy = h * 0.55, sz = h * 0.28, fq = [[cx - sz, cy - sz * 0.6], [cx, cy - sz * 0.25], [cx, cy + sz], [cx - sz, cy + sz * 0.62]], sq = [[cx, cy - sz * 0.25], [cx + sz, cy - sz * 0.6], [cx + sz, cy + sz * 0.62], [cx, cy + sz]], tq = [[cx - sz, cy - sz * 0.6], [cx, cy - sz * 0.95], [cx + sz, cy - sz * 0.6], [cx, cy - sz * 0.25]];
    s += hatch(sq, { gap: 0.8, cross: true, w: 0.22 }) + hatch(fq, { gap: 1.5, w: 0.22 }) + [fq, sq, tq].map(q => poly(q, { w: 0.45 })).join('');
    const c2 = w * 0.5, t2 = h * 0.3, b2 = h * 0.85, rx = sz * 0.8;
    s += hatch([[c2 + rx * 0.2, t2], [c2 + rx, t2], [c2 + rx, b2], [c2 + rx * 0.2, b2]], { gap: 0.9, angle: 1.5, w: 0.22 }) + hatch([[c2 + rx * 0.85, t2], [c2 + rx, t2], [c2 + rx, b2], [c2 + rx * 0.85, b2]], { gap: 0.6, angle: 1.5, w: 0.15, c: '#fff', op: 1 });
    s += ell(c2, t2, rx, 2.4, { w: 0.45, fill: '#fff' }) + halfEll(c2, b2, rx, 2.4, true, { w: 0.45 }) + ln(c2 - rx, t2, c2 - rx, b2, { w: 0.45 }) + ln(c2 + rx, t2, c2 + rx, b2, { w: 0.45 });
    const c3 = w * 0.8, cy3 = h * 0.52, rr = sz * 0.95;
    s += hatch([...ellPts(c3, cy3, rr, rr, -Math.PI * 0.15, Math.PI * 0.85, 24), ...ellPts(c3, cy3, rr * 0.7, rr * 0.7, Math.PI * 0.85, -Math.PI * 0.15, 24)], { gap: 0.8, w: 0.22 }) + circ(c3, cy3, rr, { w: 0.45 }) + ell(c3 + rr * 0.7, cy3 + rr * 0.98, rr * 0.8, rr * 0.18, { w: 0.35 }) + hatch(ellPts(c3 + rr * 0.7, cy3 + rr * 0.98, rr * 0.8, rr * 0.18), { gap: 0.7, w: 0.2 });
    s += txt(c3 - rr * 0.6, cy3 - rr * 0.35, 'highlight', { size: 2, c: '#666' }) + txt(c3 + rr * 1.05, cy3 + rr * 0.1, 'core', { size: 2.2 }) + txt(c3 + rr * 0.3, cy3 + rr * 1.5, 'cast shadow', { size: 2.2 });
    return s;
  },
  squint(w, h) {
    const x1 = w * 0.04, x2 = w * 0.55, y = h * 0.1, ww = w * 0.4, hh = h * 0.8;
    let s = poly([[x1, y], [x1 + ww, y], [x1 + ww, y + hh], [x1, y + hh]], { w: 0.4 });
    for (let k = 0; k < 9; k++) s += poly([[x1 + 3 + k * 4, y + 6 + (k % 3) * 4], [x1 + 5 + k * 4, y + 6 + (k % 3) * 4], [x1 + 5 + k * 4, y + 10 + (k % 3) * 4], [x1 + 3 + k * 4, y + 10 + (k % 3) * 4]], { w: 0.3 });
    s += ln(x1, y + hh * 0.6, x1 + ww, y + hh * 0.6, { w: 0.4 }) + arrow(x1 + ww + 2, y + hh / 2, x2 - 2, y + hh / 2, { w: 0.5 }) + txt((x1 + ww + x2) / 2, y + hh / 2 - 2, 'squint', { size: 2.4, anchor: 'middle', c: INK });
    s += poly([[x2, y], [x2 + ww, y], [x2 + ww, y + hh], [x2, y + hh]], { w: 0.4 }) + hatch([[x2, y], [x2 + ww * 0.45, y], [x2 + ww * 0.45, y + hh * 0.6], [x2, y + hh * 0.6]], { gap: 0.8, cross: true, w: 0.22 }) + hatch([[x2, y + hh * 0.6], [x2 + ww, y + hh * 0.6], [x2 + ww, y + hh], [x2, y + hh]], { gap: 1.6, w: 0.22 });
    return s + txt(x2 + ww / 2, h * 0.99, 'three values: dark, middle, light', { size: 2.4, anchor: 'middle', c: INK });
  },
  texture(w, h) {
    const R = rng(5), names = ['leaves', 'brick', 'glass', 'grass', 'water'], bw = (w - 4 - 4 * 3) / 5, bh = h * 0.68, y0 = h * 0.08;
    let s = '';
    names.forEach((n, i) => {
      const x = 2 + i * (bw + 3), x0 = x + 2, yy = y0 + 2, ww = bw - 4, hh = bh - 4;
      s += poly([[x, y0], [x + bw, y0], [x + bw, y0 + bh], [x, y0 + bh]], { w: 0.35 }) + txt(x + bw / 2, y0 + bh + 5, n, { size: 2.6, anchor: 'middle', c: INK, weight: 700 });
      if (n === 'leaves') { let pts = []; for (let t = 0; t < 70; t += 0.3) { const cx = x0 + 3 + (t / 70) * (ww - 6), cy = yy + hh * 0.35 + Math.sin(t * 0.45) * hh * 0.25; pts.push([cx + Math.cos(t * 1.9) * 2.2, cy + Math.sin(t * 1.9) * 1.9]); } s += pline(pts, { w: 0.3 }); }
      if (n === 'brick') for (let k = 0; k < 7; k++) for (let j = 0; j < 3; j++) { if ((k + j) % 3 === 1 || (k > 1 && k < 5 && j === 1)) continue; const bx = x0 + (k % 2) * 2.4 + j * 7.6, by = yy + k * (hh / 7); s += poly([[bx, by], [bx + 6.4, by], [bx + 6.4, by + hh / 7 - 0.8], [bx, by + hh / 7 - 0.8]], { w: 0.3 }); }
      if (n === 'glass') { s += poly([[x0 + 2, yy + 2], [x0 + ww - 2, yy + 2], [x0 + ww - 2, yy + hh - 2], [x0 + 2, yy + hh - 2]], { w: 0.4 }); for (let k = 0; k < 3; k++) { const xx = x0 + 6 + k * 3.5; s += ln(xx, yy + hh * 0.55, xx + 7, yy + 4, { w: 0.3 }); } }
      if (n === 'grass') for (let k = 0; k < 26; k++) { const xx = x0 + R() * ww, hh2 = hh * between(R, 0.25, 0.6); s += ln(xx, yy + hh, xx + between(R, -1.2, 1.2), yy + hh - hh2, { w: 0.28 }); }
      if (n === 'water') for (let k = 0; k < 16; k++) { const xx = x0 + R() * (ww - 7), yy2 = yy + hh * 0.2 + R() * hh * 0.75, l = between(R, 2.5, 7); s += ln(xx, yy2, xx + l, yy2, { w: 0.28 }); }
    });
    return s;
  },
  thumbs(w, h) {
    const tw = w * 0.28, th = tw * 0.75, y = h * 0.12; let s = '';
    [0.25, 0.7, 0.45].forEach((hz, i) => { const x = w * 0.03 + i * (tw + w * 0.05); s += poly([[x, y], [x + tw, y], [x + tw, y + th], [x, y + th]], { w: 0.45 }) + ln(x, y + th * hz, x + tw, y + th * hz, { w: 0.35 }) + poly([[x + tw * (0.2 + i * 0.25), y + th * hz], [x + tw * (0.32 + i * 0.25), y + th * hz], [x + tw * (0.32 + i * 0.25), y + th * hz - th * 0.18], [x + tw * (0.2 + i * 0.25), y + th * hz - th * 0.18]], { w: 0.35 }) + txt(x + tw / 2, y + th + 4.5, ['horizon high', 'horizon low', 'subject right'][i], { size: 2.3, anchor: 'middle' }); });
    return s + txt(w / 2, h * 0.98, 'stamp-sized, one minute each — then pick the best', { size: 2.5, anchor: 'middle', c: INK });
  },
  fourPass(w, h) {
    const pw = (w - 9) / 4, ph = h * 0.7, y = h * 0.05; let s = '';
    for (let k = 0; k < 4; k++) {
      const x = k * (pw + 3), hx = x + pw * 0.2, hb = y + ph * 0.85, hw = pw * 0.6, hh = ph * 0.35;
      s += poly([[x, y], [x + pw, y], [x + pw, y + ph], [x, y + ph]], { w: 0.35 });
      if (k === 0) s += poly([[hx - 2, hb], [hx + hw + 2, hb], [hx + hw + 2, hb - hh - ph * 0.3], [hx - 2, hb - hh - ph * 0.3]], { c: GUIDE, w: 0.45, dash: '1.5 1' });
      if (k >= 1) s += poly([[hx, hb], [hx + hw, hb], [hx + hw, hb - hh], [hx, hb - hh]], { w: k === 1 ? 0.3 : 0.45, c: k === 1 ? GUIDE : INK }) + poly([[hx - 1.5, hb - hh], [hx + hw + 1.5, hb - hh], [hx + hw / 2, hb - hh - ph * 0.28]], { w: k === 1 ? 0.3 : 0.45, c: k === 1 ? GUIDE : INK });
      if (k >= 2) s += poly([[hx + hw * 0.15, hb - hh * 0.6], [hx + hw * 0.35, hb - hh * 0.6], [hx + hw * 0.35, hb - hh * 0.25], [hx + hw * 0.15, hb - hh * 0.25]], { w: 0.35 }) + poly([[hx + hw * 0.55, hb], [hx + hw * 0.75, hb], [hx + hw * 0.75, hb - hh * 0.55], [hx + hw * 0.55, hb - hh * 0.55]], { w: 0.35 });
      if (k === 3) s += hatch([[hx + hw * 0.6, hb], [hx + hw, hb], [hx + hw, hb - hh], [hx + hw * 0.6, hb - hh]], { gap: 0.9, w: 0.2 }) + hatch([[hx - 1.5, hb - hh], [hx + hw + 1.5, hb - hh], [hx + hw / 2, hb - hh - ph * 0.28]], { gap: 1.2, w: 0.2, angle: -1.3 });
      s += txt(x + pw / 2, y + ph + 5, ['1 envelope', '2 shapes', '3 structure', '4 light + line'][k], { size: 2.4, anchor: 'middle', c: INK, weight: 700 });
    }
    return s;
  },
  figures(w, h) {
    const st = (x, k) => {
      const base = h * 0.92, hip = base - h * 0.38, sh = base - h * 0.62;
      let s = path(`M${f(x)} ${f(hip)} Q${f(x + 2)} ${f((hip + sh) / 2)} ${f(x - 1)} ${f(sh)}`, { c: k === 0 ? INK : GUIDE, w: 0.6 });
      if (k >= 1) s += ell(x - 1, sh - 4, 2.6, 3.3, { w: 0.5 }) + poly([[x - 4, sh], [x + 3, sh], [x + 2.5, hip], [x - 3.5, hip]], { w: 0.5, c: k === 1 ? INK : GUIDE });
      if (k >= 2) s += ln(x - 2, hip, x - 4, base, { w: 0.5 }) + ln(x + 2, hip, x + 4, base, { w: 0.5 }) + ln(x - 4, sh + 1, x - 6, sh + 12, { w: 0.45 }) + ln(x + 3, sh + 1, x + 6, sh + 11, { w: 0.45 });
      return s;
    };
    let s = '';
    ['1 spine curve', '2 head + body', '3 limbs'].forEach((t, k) => { const x = w * (0.12 + k * 0.17); s += st(x, k) + txt(x, h * 0.99, t, { size: 2.2, anchor: 'middle' }); });
    s += txt(w * 0.62, h * 0.3, 'Field note, in block print:', { size: 2.5, c: INK }) + `<text x="${f(w * 0.62)}" y="${f(h * 0.45)}" font-family="Caveat" font-size="4.2" fill="#333">counter — 6:55 am</text>` + `<text x="${f(w * 0.62)}" y="${f(h * 0.58)}" font-family="Caveat" font-size="4.2" fill="#333">cap, coffee, watches the door</text>`;
    return s;
  },
  capstone(w, h) {
    const items = ['3 thumbnails', '4 passes', 'field note', 'redraw the cup'];
    let s = '';
    items.forEach((t, i) => { const x = w * (0.02 + i * 0.25), bw = w * 0.2; s += poly([[x, h * 0.25], [x + bw, h * 0.25], [x + bw, h * 0.7], [x, h * 0.7]], { w: 0.45 }) + txt(x + bw / 2, h * 0.5, t, { size: 2.6, anchor: 'middle', c: INK, weight: 700 }); if (i < 3) s += arrow(x + bw + 1, h * 0.475, x + w * 0.25 - 1, h * 0.475, { w: 0.5 }); });
    return s + txt(w / 2, h * 0.92, 'a real place, everything in this book', { size: 2.5, anchor: 'middle' });
  },
};

// ---------- pages: everything comes in sheets — instructions on the front, practice on the back.
// Printed double-sided as loose leaf, every sheet stands on its own (pull it out, take it along, reprint it).
// On an e-reader the practice is the next page and the instructions one swipe back. No jumping around.
const pageList = [];
const pageOf = {};                                        // anchor id → page number (for contents and tracker)
const partName = n => parts.find(p => p.n === n).name;
const legend = () => `<div class="legend">${svg(42, 6, gl(2, 3, 12, 3) + dot(2, 3) + odot(12, 3) + txt(14.5, 4, '→', { size: 2.6 }) + dot(19, 3) + odot(26, 3) + txt(28.5, 4, '→', { size: 2.6 }) + poly([[32, 0.8], [41, 0.8], [41, 5.2], [32, 5.2]], { c: GUIDE, w: 0.35 }))}<div class="lg-t"><span>trace</span><span>dots</span><span>free</span></div></div>`;
const head = (l, kind, extra = '') => `<header class="head${extra ? ' has-legend' : ''}"><div class="kick">PART ${l.part} · ${esc(partName(l.part).toUpperCase())} <b>${l.id}</b></div><div class="ttl">${esc(l.title)}</div><div class="kind">${kind}</div>${extra}</header>`;
const PH = AH - 14;                                       // practice area height on the back of a sheet
const ex = l => extras[l.id] || {};
const list = (items, cls = '') => `<ul class="${cls}">${items.map(c => `<li>${esc(c)}</li>`).join('')}</ul>`;
const checkBox = l => `<div class="vbox"><b>Check yourself</b>${list(l.check)}</div>`;
const slipBox = l => `<div class="slip"><b>Common slip</b> ${esc(l.slip)}</div>`;
const whyBox = l => `<div class="why"><b>Why it works</b> ${esc(l.why)}</div>`;
const overlayNote = r => esc(overlayNotes[r.notes ? 'notes' : (r.overlay || 'none')]);

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

function buildPages(refs) {
  const coverBody = `<div class="cv-series">${esc(book.series)}</div><div class="cv-title">${esc(book.title)}</div><div class="cv-sub">${esc(book.subtitle)}</div>
    ${refs.img({ scene: 'farmhouse', seed: 31, notes: true }, { width: AW, overlay: null })}
    <div class="cv-meta">27 lessons · lines → shapes → proportion → space → light → scenes</div><div class="cv-dev">For Kindle Scribe, reMarkable, pen tablets and loose-leaf print — write directly on the pages</div>`;
  const howBody = `<div class="h-title">How this book works</div>
    <div class="h-lead">Every lesson comes as a sheet: read the front, draw on the back.</div>
    <div class="spread-demo"><div><b>Front</b><span>the idea, a diagram, the steps, what to check, the common slip and why it works</span></div><div><b>Back</b><span>the prompt and the practice space</span></div></div>
    <div class="h-note">Printed double-sided, every sheet stands on its own — pull it out, take it with you, or print it again for more practice. On an e-reader, the practice is the next page and the instructions are one swipe back.</div>
    <div class="h-lead">One habit runs through every lesson:</div>
    <div class="habit">${book.habit.map((s, i) => `<div><b>${i + 1}</b><span>${s}</span><em>${['longer than feels necessary — at the real thing, not your page', 'by comparing one part with another: taller, wider, steeper', 'lightly — first lines are guesses', 'against the real thing, then go darker'][i]}</em></div>`).join('')}</div>
    <div class="h-lead">Each lesson has up to three sheets:</div>
    <table class="kinds"><tr><td><b>Practice</b></td><td>repetition with help that fades</td></tr><tr><td><b>Repeat</b></td><td>the same drill with fresh targets, for another day</td></tr><tr><td><b>From life</b></td><td>a real subject, with a reference sketch for when nothing is handy</td></tr></table>
    <div class="h-lead">Help fades on every practice page:</div>${legend()}
    <ul class="tips"><li>Use the pen, thin and black, and write straight onto the page — or print double-sided, flipping on the long edge.</li><li>10–20 minutes a day beats an hour once a week. Circle your best attempt on each page.</li><li>For kids: bigger, looser, half the boxes — and praise the looking, not just the drawing.</li></ul>`;
  sheet(['cover', coverBody, {}, 'cover'], ['how', howBody, { id: 'how', label: 'how this book works', hints: false }]);

  const tocCol = ps => ps.map(p => `<div class="toc-part"><span>Part ${p.n} · ${esc(p.name)}</span><em>{{p:part-${p.n}}}</em></div>${lessons.filter(l => l.part === p.n).map(l => `<div class="toc-l"><span>${l.id}</span>${esc(l.title)}<em>{{p:${l.id}}}</em></div>`).join('')}`).join('');
  const tocBody = `<div class="h-title">Contents</div><div class="toc-cols"><div>${tocCol(parts.slice(0, 4))}</div><div>${tocCol(parts.slice(4))}<div class="toc-part"><span>Progress tracker</span><em>{{p:progress}}</em></div><div class="toc-part"><span>About this book</span><em>{{p:about}}</em></div></div></div>`;
  const progressBody = `<div class="h-title">Progress tracker</div><table class="prog"><tr><th>lesson</th><th>page</th><th>practice</th><th>repeat</th><th>from life</th></tr>${lessons.map(l => `<tr><td><b>${l.id}</b> ${esc(l.title)}</td><td>{{p:${l.id}}}</td><td>☐ ____</td><td>${l.practice.repeat ? '☐ ____' : '—'}</td><td>${l.life ? '☐ ____' : '—'}</td></tr>`).join('')}</table>`;
  sheet(['toc', tocBody, { id: 'contents', label: 'contents', hints: false }], ['progress', progressBody, { id: 'progress', label: 'progress tracker', hints: false }]);

  for (const p of parts) {
    const ls = lessons.filter(l => l.part === p.n);
    sheet(['opener', `<div class="op-n">Part ${p.n}</div><div class="op-name">${esc(p.name)}</div><div class="op-intro">${esc(p.intro)}</div>
        <div class="op-list">${ls.map(l => `<div><span>${l.id}</span>${esc(l.title)}<em>{{p:${l.id}}}</em></div>`).join('')}</div>`, { id: `part-${p.n}`, label: `part ${p.n} · ${p.name.toLowerCase()}`, hints: false }],
      ['plate', `<div class="plate-in">${refs.img({ ...p.cover, notes: true }, { width: AW, overlay: null })}<div class="plate-cap">from the sketchbook</div></div>`, { label: `part ${p.n} · ${p.name.toLowerCase()}`, hints: false }]);
    for (const l of ls) lessonSpreads(l, refs);
  }

  sheet(['about', `<div class="h-title">About this book</div><p>Every illustration in this book is an original pencil sketch generated for it; nothing is copied from other books or courses. Typefaces: Inter and JetBrains Mono (SIL Open Font License); handwritten notes in Caveat (SIL Open Font License).</p><p>Pages are sized to the Kindle Scribe screen (157.5 × 210 mm) and the reMarkable 2. Every lesson is one sheet — instructions on the front, practice on the back — so it works as loose leaf printed double-sided, or page by page on an e-reader. Print editions on Letter and A4 keep the same real sizes.</p><p class="small">${esc(book.series)} · ${esc(book.title)} · e-ink edition</p>`, { id: 'about', label: 'about', hints: false }],
    ['backcover', `<div class="bc-in"><div class="cv-series">${esc(book.series)}</div><div class="bc-title">${esc(book.title)}</div>${refs.img({ scene: 'nature', seed: 31, notes: true }, { width: AW, overlay: null })}<div class="bc-note">Want more practice? Print any sheet again — every sheet stands on its own.</div></div>`, { label: '', hints: false }, 'backcover']);
}

function lessonSpreads(l, refs) {
  const R = rng(l.id.split('').reduce((a, c) => a * 31 + c.charCodeAt(0), 7));
  const lbl = s => `${l.id} · ${s}`;

  // 1 · How to (left) + Practice (right)
  const learn = `${head(l, 'HOW TO')}<div class="body">
    <div class="lead"><b>You’ll learn</b> ${esc(l.learn)}</div>
    <div class="idea">${esc(l.idea)}</div>
    <div class="diagram">${svg(AW, 50, D[l.diagram](AW, 50))}</div>
    <div class="steps-h">Do this</div><ol class="steps">${l.steps.map(s => `<li>${esc(s)}</li>`).join('')}</ol>
    <div class="vfill"></div>${checkBox(l)}${slipBox(l)}${whyBox(l)}</div>`;
  sheet(['learn', learn, { id: l.id, label: lbl('how to') }], ['practice', practiceRecto(l, l.practice, 'PRACTICE', R, refs), { label: lbl('practice') }]);

  // 2 · Step 2 (left) + second practice (right)
  if (l.practice2) {
    const s2 = ex(l).step2;
    const v = `${head(l, 'STEP 2')}<div class="body"><div class="lead"><b>${esc(s2.lead)}</b></div><div class="idea">${esc(s2.text)}</div>
      <div class="diagram">${svg(AW, 50, D[l.diagram](AW, 50))}</div><div class="steps-h">Do this</div><ol class="steps">${s2.steps.map(s => `<li>${esc(s)}</li>`).join('')}</ol>
      <div class="vfill"></div>${checkBox(l)}${slipBox(l)}</div>`;
    sheet(['learn', v, { label: lbl('step 2') }], ['practice', practiceRecto(l, l.practice2, 'PRACTICE · STEP 2', rng(99), refs), { label: lbl('practice, step 2') }]);
  }

  // 3 · Again (left) + Repeat (right)
  if (l.practice.repeat) {
    const v = `${head(l, 'AGAIN')}<div class="body"><div class="lead"><b>Same skill, fresh targets.</b> Do this page on a different day from the first one.</div>
      <div class="thistime"><b>This time</b> ${esc(ex(l).again)}</div>
      <div class="diagram">${svg(AW, 46, D[l.diagram](AW, 46))}</div>
      <div class="steps-h">The steps again</div><ol class="steps">${l.steps.map(s => `<li>${esc(s)}</li>`).join('')}</ol>
      <div class="vfill"></div>${checkBox(l)}${slipBox(l)}</div>`;
    sheet(['learn', v, { label: lbl('again') }], ['practice', practiceRecto(l, l.practice, 'REPEAT', rng(R() * 1e9), refs), { label: lbl('repeat') }]);
  }

  // 4 · From life: how to (left) + From life (right)
  if (l.life) {
    const r = l.life.ref;
    const v = `${head(l, 'FROM LIFE · HOW TO')}<div class="body">
      <div class="lead"><b>Your subject</b> ${esc(l.life.prompt)}</div>
      <div class="habit mini">${book.habit.map((s, i) => `<div><b>${i + 1}</b><span>${s}</span></div>`).join('')}</div>
      <div class="steps-h">How to approach it</div>${list(ex(l).lifeHow || [], 'how')}
      <div class="steps-h">The skill, step by step</div><ol class="steps">${l.steps.map(s => `<li>${esc(s)}</li>`).join('')}</ol>
      <div class="vbox"><b>Real things first</b> ${r ? 'Draw from the real subject whenever you can. The reference sketch overleaf is for when nothing is handy — or for practice before you go out.' : 'Draw from the real thing in front of you; there is no reference sketch for this one.'}${r ? `<br><br><b>On the sketch</b> ${overlayNote(r)}` : ''}</div>
      <div class="vfill"></div>${checkBox(l)}${slipBox(l)}</div>`;
    sheet(['learn', v, { label: lbl('from life, how to') }], ['life', lifeRecto(l, refs), { label: lbl('from life') }]);
  }
}

const NO_LEGEND = ['refPractice', 'gridTransfer', 'horizonFind', 'threeValue', 'fourPassStrip', 'fieldPage', 'capstone', 'thumbRow', 'timedBoxes', 'setup', 'valueDrill', 'textureDrill'];
const TASKS = {
  setup: 'Fill the loop boxes, then draw the day-one cups. Date them.', timedBoxes: 'Two minutes each. Eyes on the subject — never on the page.',
  lineDrill: 'Ghost, then one stroke per line, filled dot to open dot.', curveDrill: 'Ghost through every dot, then one smooth stroke.',
  angleDrill: 'Copy each angle on the right, starting at the dot.', contourDrill: 'Trace, then follow the dots, then draw from the sample.',
  shapeDrill: 'Each row: trace → corner dots → free.', ellipseDrill: 'Axes first, ghost the loop, then one smooth stroke.',
  gapDrill: 'Draw the gaps — the shaded shapes — not the object.', depthDrill: 'Near: big, low, dark. Far: small, high, light.',
  perspDrill: 'Aim every line that goes away from you at a vanishing point.', cylDrill: 'Build each cylinder along its centre line.',
  valueDrill: 'Match each sample bar: five even steps, white to near-black.', formDrill: 'Follow the arrow: light side, shadow side, cast shadow.',
  textureDrill: 'Copy each mark, then invent your own. Suggest — don’t list.', gridTransfer: 'Copy square by square — only what is inside each square.',
  horizonFind: 'Draw a level line through eye level in each picture.', threeValue: 'Squint: darks first, then middles. Leave the lights.',
  fourPassStrip: 'One pass per box — light and simple until pass 4.', fieldPage: 'Set a timer. Whole scene first, every time.',
  capstone: 'Thumbnails, four passes, a field note — then the cup again.', thumbRow: 'Six thumbnails, each one different. Circle the best.',
};

function practiceRecto(l, spec, kind, seedR, refs) {
  let inner;
  if (spec.type === 'refPractice') inner = refAndDraw(refs, spec.ref, overlayNote(spec.ref));
  else if (spec.type === 'gridTransfer') inner = gridTransfer(refs, spec, PH);
  else if (spec.type === 'horizonFind') inner = horizonFind(refs, PH);
  else if (spec.type === 'threeValue') inner = threeValue(refs, spec, PH);
  else if (spec.type === 'fourPassStrip') inner = fourPassStrip(refs, spec, PH);
  else if (spec.type === 'fieldPage') inner = fieldPage(PH);
  else if (spec.type === 'capstone') inner = capstonePage(PH);
  else if (spec.type === 'thumbRow') inner = drills.thumbRow(seedR, AW, PH, spec, refs).html;
  else inner = svg(AW, PH, drills[spec.type](seedR, AW, PH, spec));
  const task = spec.task || TASKS[spec.type] || 'Follow the steps overleaf.';
  return `${head(l, kind, NO_LEGEND.includes(spec.type) ? '' : legend())}<div class="body"><div class="task">${esc(task)}</div><div class="drill" style="height:${f(PH)}mm">${inner}</div><div class="repline">date ________ · circle your best attempt<span>reps ☐ ☐ ☐</span></div></div>`;
}

function lifeRecto(l, refs) {
  const r = l.life.ref;
  return `${head(l, 'FROM LIFE')}<div class="body"><div class="task">${esc(l.life.prompt)}</div>${r ? refAndDraw(refs, r, overlayNote(r)) : '<div class="frame grow"></div>'}<div class="repline">date ________ · subject ______________________<span>reps ☐ ☐ ☐</span></div></div>`;
}

function refAndDraw(refs, ref, sideText) {
  const rw = AW * 0.66;
  return `<div class="rad"><div class="rad-top">${refs.img(ref, { width: rw })}<div class="rad-text small">${sideText}</div></div><div class="frame grow"></div></div>`;
}
function gridTransfer(refs, spec, h) {
  const rh = (h - 8) / 2, rw = Math.min(AW, rh / 0.75), rh2 = rw * 0.75;
  const cols = spec.grid === 'half' ? 3 : 6, rows = spec.grid === 'half' ? 2 : 4;
  let g = ''; for (let c = 1; c < cols; c++) g += ln(rw * c / cols, 0, rw * c / cols, rh2, { c: GUIDE, w: 0.3 }); for (let r = 1; r < rows; r++) g += ln(0, rh2 * r / rows, rw, rh2 * r / rows, { c: GUIDE, w: 0.3 });
  return `<div class="gt">${refs.img(spec.ref, { width: rw, overlay: null, grid: spec.grid })}<div class="gt-gap"></div>${svg(rw, rh2, poly([[0, 0], [rw, 0], [rw, rh2], [0, rh2]], { w: 0.45 }) + g)}</div>`;
}
function horizonFind(refs, h) {
  const set = [{ scene: 'cityStreet', seed: 21 }, { scene: 'diner', seed: 22 }, { scene: 'farmhouse', seed: 22 }, { scene: 'nature', seed: 22 }];
  const rw = (AW - 4) / 2;
  return `<div class="hf">${set.map(r => refs.img(r, { width: rw, overlay: null })).join('')}</div><div class="hf-l small">Tip: follow lines that go away from you until they meet. Eye level runs through that point. The From-life sketches of S4.1–S4.4 show it as a dashed line.</div>`;
}
function threeValue(refs, spec, h) {
  const rw = AW * 0.49;
  return `<div class="tv"><div>${refs.img(spec.ref, { width: rw, overlay: null })}<span>the scene</span></div><div>${refs.img(spec.ref, { width: rw, overlay: null, suffix: '-3v' })}<span>squinted: three values</span></div></div>
    <div class="tv"><div>${refs.img(spec.ref2, { width: rw, overlay: null })}<span>your turn: this scene…</span></div><div><div class="frame" style="height:${f(rw * 0.75)}mm"></div><span>…in three values: darks first, then middles</span></div></div>
    <div class="tv"><div><div class="frame" style="height:${f(rw * 0.75 * 0.58)}mm"></div><span>a view from your window, three values</span></div><div><div class="frame" style="height:${f(rw * 0.75 * 0.58)}mm"></div><span>a room lit by one lamp, three values</span></div></div>`;
}
function fourPassStrip(refs, spec, h) {
  const m = refs.meta(spec.ref), pw = (AW - 9) / 4, ph = pw * 0.75, W = 1860, H = 1395;
  const panel = k => {
    const st = 'stroke="#000" fill="none" stroke-width="10"';
    let s = '';
    if (k === 0) s += m.envelopes.map(([x0, y0, x1, y1]) => `<rect x="${f(x0)}" y="${f(y0)}" width="${f(x1 - x0)}" height="${f(y1 - y0)}" ${st} stroke-dasharray="40 24"/>`).join('');
    if (k === 1) s += m.shapes.map(q => `<path d="M${q.map(p => `${f(p[0])} ${f(p[1])}`).join(' L')} Z" ${st}/>`).join('') + m.envelopes.slice(1).map(([x0, y0, x1, y1]) => `<rect x="${f(x0)}" y="${f(y0)}" width="${f(x1 - x0)}" height="${f(y1 - y0)}" ${st}/>`).join('');
    const img = k >= 2 ? `<img src="${refs.img(spec.ref, { width: pw, overlay: null }).match(/src="([^"]+)"/)[1]}" style="opacity:${k === 2 ? 0.45 : 1}"/>` : '';
    return `<div class="fp-p" style="width:${f(pw)}mm;height:${f(ph)}mm">${img}<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">${k === 2 ? m.shapes.map(q => `<path d="M${q.map(p => `${f(p[0])} ${f(p[1])}`).join(' L')} Z" stroke="#000" fill="none" stroke-width="8"/>`).join('') : s}</svg></div>`;
  };
  const labels = ['1 envelope', '2 shapes', '3 structure', '4 light + line'];
  const empty = () => `<div class="fp-row">${labels.map(t => `<div><div class="frame" style="width:${f(pw)}mm;height:${f(ph)}mm"></div><span>${t}</span></div>`).join('')}</div>`;
  return `<div class="fp-l">Example — the farmhouse in four passes:</div><div class="fp-row">${[0, 1, 2, 3].map(k => `<div>${panel(k)}<span>${labels[k]}</span></div>`).join('')}</div>
    <div class="fp-l">Your turn — a mug:</div>${empty()}<div class="fp-l">Your turn — a shoe, a lamp or a kettle:</div>${empty()}<div class="fp-l">Your turn — your choice:</div>${empty()}`;
}
function fieldPage(h) {
  const tw = (AW - 6) / 3;
  const noteLines = `<div class="nl"><i></i><i class="x"></i><i></i></div>`;
  return `<div class="fl"><b>Same scene, three time limits</b></div><div class="fr">${['2 min', '5 min', '10 min'].map(t => `<div><div class="frame" style="width:${f(tw)}mm;height:${f(tw * 0.8)}mm"><span class="tl">${t}</span></div>${noteLines}</div>`).join('')}</div>
    <div class="fl"><b>People in 30 seconds</b> — spine, oval, box, limbs. If they move, start another.</div><div class="fg">${Array.from({ length: 8 }, () => `<div class="frame" style="height:${f((AW - 9) / 4 * 0.8)}mm"></div>`).join('')}</div>
    <div class="fl"><b>Field note</b> — time, place, one thing you noticed (block print)</div>${noteLines}${noteLines}`;
}
function capstonePage(h) {
  const tw = (AW - 6) / 3;
  return `<div class="fl"><b>1 · Three thumbnails</b> — choose one</div><div class="fr">${[1, 2, 3].map(() => `<div class="frame" style="width:${f(tw)}mm;height:${f(tw * 0.75)}mm"></div>`).join('')}</div>
    <div class="fl"><b>2 · The drawing</b> — four passes</div><div class="frame" style="height:${f(h - tw * 0.75 - 58)}mm"></div>
    <div class="cap-b"><div><div class="fl"><b>3 · Field note</b></div><div class="nl"><i></i><i class="x"></i><i></i></div><div class="nl"><i></i><i class="x"></i><i></i></div></div><div><div class="fl"><b>4 · The cup again</b> — date ____</div><div class="frame" style="height:28mm"></div></div></div>`;
}

// ---------- CSS
const css = `@page { size: ${PAGE.w}mm ${PAGE.h}mm; margin: 0; }
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body { background: #fff; color: #000; font-family: Inter, "DejaVu Sans", sans-serif; }
a { color: inherit; text-decoration: none; }
.page { width: ${PAGE.w}mm; height: ${PAGE.h}mm; padding: ${PAGE.pad}mm; position: relative; overflow: hidden; display: flex; flex-direction: column; break-after: page; }
.head { height: ${HEAD}mm; flex: none; position: relative; border-bottom: 0.5mm solid #000; }
.kick { font: 600 2.4mm "JetBrains Mono", monospace; letter-spacing: 0.35mm; color: #444; }
.kick b { color: #000; margin-left: 2mm; }
.ttl { font: 800 6.2mm/1.08 Inter, sans-serif; margin-top: 1.2mm; max-width: 108mm; }
.has-legend .ttl { max-width: 90mm; font-size: 5.6mm; }
.kind { position: absolute; top: 0; right: 0; font: 700 2.4mm "JetBrains Mono", monospace; letter-spacing: 0.4mm; background: #000; color: #fff; padding: 0.8mm 1.8mm; }
.legend { position: absolute; right: 0; bottom: 1.2mm; }
.lg-t { display: flex; justify-content: space-between; width: 42mm; font: 2mm "JetBrains Mono", monospace; color: #555; padding: 0 0.5mm; }
.body { flex: 1; padding-top: 3mm; display: flex; flex-direction: column; min-height: 0; }
.foot { height: ${FOOT}mm; flex: none; border-top: 0.35mm solid #000; display: flex; align-items: center; gap: 3mm; font: 2.3mm "JetBrains Mono", monospace; color: #555; }
.foot { margin-top: auto; }
.foot .pn { font: 700 3mm "JetBrains Mono", monospace; color: #000; }
.foot .fl-mid { flex: 1; }
.foot.odd { flex-direction: row-reverse; }
.foot.odd .fl-mid { text-align: right; }
.backcover { justify-content: center; }
.bc-in { margin: auto 0; }
.bc-title { font: 800 8mm/1.1 Inter, sans-serif; margin: 2mm 0 5mm; }
.bc-note { font: 3.2mm/1.4 Inter, sans-serif; margin-top: 5mm; }
.foot .hint { font-weight: 600; color: #000; }
.lead { font: 3.5mm/1.35 Inter, sans-serif; }
.lead b { font-weight: 800; margin-right: 1mm; }
.idea { font: 3.25mm/1.42 Inter, sans-serif; margin-top: 2mm; color: #111; }
.diagram { margin: 3mm 0 2mm; border: 0.3mm solid #bbb; flex: none; }
.steps-h { font: 700 2.6mm "JetBrains Mono", monospace; letter-spacing: 0.35mm; text-transform: uppercase; margin-top: 1mm; }
.steps { font: 3.15mm/1.38 Inter, sans-serif; padding-left: 5.5mm; margin-top: 1mm; }
.steps li { margin-bottom: 0.6mm; }
.slip { margin-top: auto; border-left: 1mm solid #000; padding: 1.4mm 2.5mm; font: 2.9mm/1.35 Inter, sans-serif; background: #f2f2f2; }
.slip b { margin-right: 1mm; }
.drill { flex: none; overflow: hidden; display: flex; flex-direction: column; }
.grow { flex: 1; min-height: 12mm; }
.rad { flex: 1; display: flex; flex-direction: column; min-height: 0; }
.check { margin-bottom: 0; }
.check { margin-top: 3mm; border-top: 0.35mm solid #000; padding-top: 1.6mm; font: 2.85mm/1.35 Inter, sans-serif; position: relative; }
.check b { font: 700 2.4mm "JetBrains Mono", monospace; letter-spacing: 0.3mm; text-transform: uppercase; }
.check ul { padding-left: 4.5mm; margin-top: 0.6mm; max-width: 112mm; }
.check .reps { position: absolute; right: 0; top: 1.6mm; font: 600 2.6mm "JetBrains Mono", monospace; }
.ref { position: relative; flex: none; }
.ref img { width: 100%; display: block; border: 0.3mm solid #999; }
.ref .ov { position: absolute; inset: 0; width: 100%; height: 100%; }
.rad-top { display: flex; gap: 3mm; }
.rad-text { font: 3.2mm/1.42 Inter, sans-serif; flex: 1; }
.frame { border: 0.35mm solid #000; margin-top: 3mm; position: relative; }
.prompt { font: 3.4mm/1.42 Inter, sans-serif; }
.gt { display: flex; flex-direction: column; align-items: center; }
.gt-l, .hf-l, .fp-l, .fl { font: 2.9mm/1.35 Inter, sans-serif; margin: 1.5mm 0; align-self: flex-start; }
.hf { display: grid; grid-template-columns: 1fr 1fr; gap: 4mm; }
.small { font-size: 2.4mm !important; color: #555; }
.tv { display: flex; gap: 2mm; margin-bottom: 1.5mm; }
.tv > div { flex: 1; display: flex; flex-direction: column; }
.tv span { font: 2.3mm "JetBrains Mono", monospace; color: #555; margin-top: 0.6mm; }
.tv .frame { margin-top: 0; }
.fp-row { display: flex; gap: 3mm; }
.fp-row span { font: 700 2.2mm "JetBrains Mono", monospace; display: block; margin-top: 0.6mm; }
.fp-row .frame { margin-top: 0; }
.fp-p { position: relative; border: 0.3mm solid #999; overflow: hidden; }
.fp-p img { position: absolute; inset: 0; width: 100%; height: 100%; }
.fp-p svg { position: absolute; inset: 0; width: 100%; height: 100%; }
.fr { display: flex; gap: 3mm; }
.fr .frame { margin-top: 0; }
.tl { position: absolute; left: 1.5mm; top: 1mm; font: 700 2.4mm "JetBrains Mono", monospace; }
.fg { display: grid; grid-template-columns: repeat(4, 1fr); gap: 3mm; }
.fg .frame { margin-top: 0; }
.nl { margin-top: 1.5mm; height: 7mm; position: relative; }
.nl i { display: block; height: 0; border-top: 0.25mm solid #999; margin-bottom: 2.1mm; }
.nl i.x { border-top: 0.25mm dashed #bbb; }
.cap-b { display: flex; gap: 4mm; }
.cap-b > div { flex: 1; }
.tr-top { display: flex; gap: 3mm; }
.tr-note { font: 3mm/1.4 Inter, sans-serif; flex: 1; }
.tr-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 3mm; margin-top: 3mm; }
.tr-cell { border: 0.35mm solid #000; aspect-ratio: 4 / 3; position: relative; }
.tr-cell span { position: absolute; left: 1.2mm; bottom: 0.8mm; font: 2.1mm "JetBrains Mono", monospace; color: #555; }
.cover { justify-content: flex-start; }
.cv-series { font: 600 2.8mm "JetBrains Mono", monospace; letter-spacing: 0.6mm; text-transform: uppercase; color: #444; }
.cv-title { font: 800 13mm/1 Inter, sans-serif; margin-top: 4mm; letter-spacing: -0.3mm; }
.cv-sub { font: 4mm/1.3 Inter, sans-serif; margin: 3mm 0 6mm; color: #222; }
.cv-meta { font: 600 2.8mm "JetBrains Mono", monospace; margin-top: 5mm; }
.cv-dev { font: 2.6mm "JetBrains Mono", monospace; margin-top: auto; color: #555; }
.h-title { font: 800 8mm/1.1 Inter, sans-serif; margin-bottom: 4mm; }
.h-lead { font: 700 3.2mm Inter, sans-serif; margin: 3mm 0 2mm; }
.habit { display: grid; grid-template-columns: repeat(4, 1fr); gap: 2mm; }
.habit div { border: 0.4mm solid #000; padding: 2mm; display: flex; flex-direction: column; gap: 1mm; }
.habit b { font: 800 6mm "JetBrains Mono", monospace; }
.habit span { font: 800 3.6mm Inter, sans-serif; }
.habit em { font: 2.5mm/1.3 Inter, sans-serif; font-style: normal; color: #333; }
.kinds { border-collapse: collapse; width: 100%; font: 3mm/1.35 Inter, sans-serif; }
.kinds td { border-bottom: 0.3mm solid #ccc; padding: 1.4mm 1mm; vertical-align: top; }
.kinds td:first-child { width: 22mm; }
.how .legend { position: static; }
.tips { font: 3mm/1.45 Inter, sans-serif; padding-left: 4.5mm; margin-top: 3mm; }
.toc-cols { display: grid; grid-template-columns: 1fr 1fr; gap: 6mm; }
.toc-part { font: 800 3.3mm Inter, sans-serif; margin: 2.6mm 0 1mm; border-bottom: 0.4mm solid #000; padding-bottom: 0.6mm; }
.toc-l { display: block; font: 2.85mm/1.55 Inter, sans-serif; }
.toc-l span { font: 600 2.4mm "JetBrains Mono", monospace; display: inline-block; width: 9mm; color: #444; }
.opener .op-n { font: 700 3mm "JetBrains Mono", monospace; letter-spacing: 0.6mm; text-transform: uppercase; color: #444; }
.opener .op-name { font: 800 12mm/1.05 Inter, sans-serif; margin: 2mm 0 3mm; }
.opener .op-intro { font: 3.6mm/1.45 Inter, sans-serif; margin-bottom: 5mm; max-width: 125mm; }
.op-list { margin-top: 5mm; border-top: 0.5mm solid #000; }
.op-list div { font: 600 3.6mm/1 Inter, sans-serif; padding: 2.6mm 0; border-bottom: 0.3mm solid #ccc; }
.op-list span { font: 700 2.7mm "JetBrains Mono", monospace; display: inline-block; width: 12mm; }
.vfill { flex: 1; min-height: 1mm; }
.vbox { border-top: 0.35mm solid #000; padding-top: 1.4mm; margin-top: 2mm; font: 2.85mm/1.38 Inter, sans-serif; }
.vbox b, .why b, .thistime b { font: 700 2.4mm "JetBrains Mono", monospace; letter-spacing: 0.3mm; text-transform: uppercase; margin-right: 1mm; }
.vbox ul, ul.how { padding-left: 4.5mm; margin-top: 0.6mm; }
ul.how { font: 3.1mm/1.42 Inter, sans-serif; margin: 1mm 0 2mm; }
ul.how li { margin-bottom: 0.8mm; }
.slip { margin-top: 2mm !important; }
.why { margin-top: 2mm; border: 0.35mm solid #000; padding: 1.6mm 2.5mm; font: 2.85mm/1.38 Inter, sans-serif; }
.thistime { margin-top: 2.5mm; border: 0.5mm solid #000; padding: 2mm 2.5mm; font: 3.2mm/1.4 Inter, sans-serif; }
.habit.mini { margin: 2.5mm 0 1mm; }
.habit.mini div { padding: 1.2mm 1.5mm; flex-direction: row; align-items: baseline; gap: 1.5mm; }
.habit.mini b { font-size: 3.6mm; }
.habit.mini span { font-size: 3mm; }
.task { font: 600 3.1mm/1.35 Inter, sans-serif; margin-bottom: 2mm; min-height: 4.2mm; }
.repline { margin-top: auto; padding-top: 1.5mm; font: 2.4mm "JetBrains Mono", monospace; color: #555; display: flex; justify-content: space-between; }
.repline span { font-weight: 700; color: #000; }
.gt-gap { height: 4mm; }
.spread-demo { display: grid; grid-template-columns: 1fr 1fr; gap: 2mm; }
.spread-demo div { border: 0.4mm solid #000; padding: 2mm; display: flex; flex-direction: column; gap: 1mm; font: 2.7mm/1.35 Inter, sans-serif; }
.spread-demo b { font: 800 3.4mm Inter, sans-serif; }
.h-note { font: 2.8mm/1.4 Inter, sans-serif; margin-top: 1.5mm; color: #333; }
.toc-part, .toc-l, .op-list div { display: flex; align-items: baseline; }
.toc-part span { flex: 1; }
.toc-l em, .toc-part em, .op-list em { margin-left: auto; font: 600 2.5mm "JetBrains Mono", monospace; font-style: normal; padding-left: 2mm; }
.plate { justify-content: center; }
.plate-in { margin: auto 0; }
.plate-cap { font: 2.4mm "JetBrains Mono", monospace; color: #555; margin-top: 1.5mm; text-align: right; }
.prog { border-collapse: collapse; width: 100%; font: 2.55mm/1.25 Inter, sans-serif; }
.prog th { font: 700 2.2mm "JetBrains Mono", monospace; text-align: left; border-bottom: 0.4mm solid #000; padding: 0.8mm; }
.prog td { border-bottom: 0.25mm solid #ccc; padding: 1.05mm 0.8mm; white-space: nowrap; }
.prog td:first-child { white-space: normal; }
.about p { font: 3.2mm/1.5 Inter, sans-serif; margin-bottom: 3mm; }
`;

// ---------- render
mkdirSync(opt.out, { recursive: true });
const refs = makeRefs();
buildPages(refs);
const pagesHtml = pageList.join('\n').replace(/\{\{p:([^}]+)\}\}/g, (_, id) => { if (!pageOf[id]) throw new Error(`no page for ${id}`); return String(pageOf[id]); });
const html = `<!doctype html><html><head><meta charset="utf-8"><title>${esc(book.title)}</title><style>
@font-face { font-family: 'Caveat'; src: url('${pathToFileURL(resolve(HERE, '../../sketchArt/fonts/caveat-latin-400-normal.woff2')).href}') format('woff2'); }
${css}</style></head><body>${pagesHtml}</body></html>`;
const htmlPath = join(opt.out, `sketch-what-you-see-${opt.page}.html`);
writeFileSync(htmlPath, html);

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 600, height: 800 }, deviceScaleFactor: 1 });
  await page.goto(pathToFileURL(htmlPath).href, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  const pdf = join(opt.out, `sketch-what-you-see-${opt.page}.pdf`);
  await page.pdf({ path: pdf, width: `${PAGE.w}mm`, height: `${PAGE.h}mm`, printBackground: true });
  // overflow check: flag pages whose content spills past the page
  const spill = await page.$$eval('section.page', ps => ps.map((p, i) => { const b = p.querySelector('.body') || p; return b.scrollHeight > b.clientHeight + 2 ? i + 1 : 0; }).filter(Boolean));
  if (spill.length) console.warn('content overflows on pages:', spill.join(', '));
  const thumbs = join(opt.out, 'thumbs'); rmSync(thumbs, { recursive: true, force: true }); mkdirSync(thumbs, { recursive: true });
  const all = await page.$$('section.page');
  for (let i = 0; i < all.length; i++) await all[i].screenshot({ path: join(thumbs, `p${String(i + 1).padStart(3, '0')}.png`) });
  execFileSync('montage', [join(thumbs, 'p*.png'), '-tile', '10x', '-geometry', '238x317+6+6', '-background', '#ddd', join(opt.out, `contact-${opt.page}.png`)]);
  console.log(`wrote ${pdf} (${all.length} pages) and contact-${opt.page}.png`);
} finally {
  await browser.close();
}
