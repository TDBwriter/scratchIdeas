// Procedural pencil sketches: pages from an observer's sketchbook.
//
//   node sketch.mjs [--seed N] [--out DIR] [--size WxH] [--no-notes]
//
// Each seed draws a fresh set of scenes (farmhouse, building front, city street, diner counter,
// nature) the way a patient observer would: perspective worked out, quick overshooting lines,
// hatching for shade, scribbled foliage, graphite grain, and a few handwritten margin notes.
// Writes an SVG (vector, for print) and a 16-gray dithered PNG (e-ink) per scene, plus a contact sheet.
// Requires: playwright (Chromium) and ImageMagick `convert`. Notes use Caveat (SIL OFL, in fonts/).

import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { resolve, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const { chromium } = createRequire(import.meta.url)('playwright');
const HERE = dirname(fileURLToPath(import.meta.url));

const opt = { seed: 1, out: 'out', w: 1860, h: 1395, notes: true, only: null };
const argv = process.argv.slice(2);
for (let i = 0; i < argv.length; i++) {
  if (argv[i] === '--seed') opt.seed = Number(argv[++i]);
  else if (argv[i] === '--out') opt.out = argv[++i];
  else if (argv[i] === '--size') [opt.w, opt.h] = argv[++i].split('x').map(Number);
  else if (argv[i] === '--no-notes') opt.notes = false;
  else if (argv[i] === '--only') opt.only = argv[++i].split(',');
}
const W = opt.w, H = opt.h, U = W / 1860;
const LEAD = '#262626';

// ---------- helpers
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), a | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const f = n => n.toFixed(1);
const lerp = (a, b, t) => a + (b - a) * t;
const lerp2 = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];
const between = (R, a, b) => lerp(a, b, R());
const pick = (R, arr) => arr[Math.floor(R() * arr.length)];
let clipN = 0;

// ---------- pencil primitives
// A pencil path through points: slight hand wobble, sometimes a lighter second pass.
function pencil(R, pts, { w = 1, op = 0.8, wobble = 0.8, passes = 1 } = {}) {
  let s = '';
  for (let p = 0; p < passes; p++) {
    const ox = p ? (R() - 0.5) * 3 * U : 0, oy = p ? (R() - 0.5) * 3 * U : 0;
    const d = pts.map((q, i) => `${i ? 'L' : 'M'}${f(q[0] + ox + (R() - 0.5) * wobble * U)} ${f(q[1] + oy + (R() - 0.5) * wobble * U)}`).join(' ');
    s += `<path d="${d}" fill="none" stroke="${LEAD}" stroke-width="${f(w * 2.2 * U * between(R, 0.85, 1.15))}"`
      + ` stroke-linecap="round" stroke-linejoin="round" opacity="${(op * (p ? between(R, 0.35, 0.6) : between(R, 0.8, 1))).toFixed(2)}"/>`;
  }
  return s;
}

// A ruled-by-eye straight line: overshoots its ends a little, bows slightly, often gets a second pass.
function line(R, a, b, { w = 1, op = 0.8, over = 1, passes } = {}) {
  const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L;
  const o1 = Math.min(0.08 * L, 16 * U) * R() * over, o2 = Math.min(0.08 * L, 16 * U) * R() * over;
  const A = [a[0] - ux * o1, a[1] - uy * o1], B = [b[0] + ux * o2, b[1] + uy * o2];
  const bow = (R() - 0.5) * Math.min(L * 0.012, 5 * U), n = Math.max(2, Math.round(L / (35 * U)));
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n, k = Math.sin(Math.PI * t) * bow;
    pts.push([lerp(A[0], B[0], t) - uy * k, lerp(A[1], B[1], t) + ux * k]);
  }
  return pencil(R, pts, { w, op, wobble: 0.5, passes: passes ?? (R() < 0.3 ? 2 : 1) });
}

const outline = (R, pts, opts) => pts.map((p, i) => line(R, p, pts[(i + 1) % pts.length], opts)).join('');
const openLine = (R, pts, opts) => pts.slice(1).map((p, i) => line(R, pts[i], p, opts)).join('');

// Smooth curve through points (Catmull-Rom), drawn in pencil.
function smooth(ctrl, k = 10) {
  const pts = [];
  for (let i = 0; i < ctrl.length - 1; i++) {
    const p0 = ctrl[Math.max(0, i - 1)], p1 = ctrl[i], p2 = ctrl[i + 1], p3 = ctrl[Math.min(ctrl.length - 1, i + 2)];
    for (let s = 0; s < k; s++) {
      const t = s / k, t2 = t * t, t3 = t2 * t;
      pts.push([0, 1].map(j => 0.5 * (2 * p1[j] + (-p0[j] + p2[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t2 + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * t3)));
    }
  }
  pts.push(ctrl[ctrl.length - 1]);
  return pts;
}
const curve = (R, ctrl, opts = {}) => pencil(R, smooth(ctrl), { wobble: 1, ...opts });

// Parallel hatching clipped to a polygon; cross-hatch for darker values.
function hatch(R, poly, { angle = -0.95, gap = 10, op = 0.45, w = 0.55, cross = false } = {}) {
  const id = `h${++clipN}`;
  const xs = poly.map(p => p[0]), ys = poly.map(p => p[1]);
  const cx = (Math.min(...xs) + Math.max(...xs)) / 2, cy = (Math.min(...ys) + Math.max(...ys)) / 2;
  const D = Math.hypot(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)) / 2 + 4;
  const pass = a => {
    let s = '';
    const ux = Math.cos(a), uy = Math.sin(a), nx = -uy, ny = ux;
    for (let t = -D; t <= D; t += gap * U * between(R, 0.8, 1.2)) {
      const sl = (R() - 0.5) * 0.06;                          // each stroke a touch off-angle
      const p0 = [cx + nx * t - (ux + sl) * D, cy + ny * t - (uy - sl) * D], p1 = [cx + nx * t + (ux - sl) * D, cy + ny * t + (uy + sl) * D];
      s += `<path d="M${f(p0[0])} ${f(p0[1])} L${f(p1[0])} ${f(p1[1])}" stroke="${LEAD}" stroke-width="${f(w * 2.2 * U)}" opacity="${(op * between(R, 0.6, 1)).toFixed(2)}" stroke-linecap="round"/>`;
    }
    return s;
  };
  return `<clipPath id="${id}"><path d="M${poly.map(p => `${f(p[0])} ${f(p[1])}`).join(' L')} Z"/></clipPath>`
    + `<g clip-path="url(#${id})">${pass(angle)}${cross ? pass(angle + 1.15) : ''}</g>`;
}

// Loopy scribble that tours the whole ellipse: foliage, hair, bushes.
function scribble(R, cx, cy, rx, ry, { r = 15, op = 0.6, w = 0.7, density = 1 } = {}) {
  // Enough waypoints that a loop-wide band touring them covers the whole ellipse.
  const rr0 = r * U, nWay = Math.min(900, Math.max(4, Math.round((Math.PI * rx * ry) / (2 * rr0 * rr0) * density)));
  let way = Array.from({ length: nWay }, () => { const a = R() * 6.283, d = Math.sqrt(R()) * 0.88; return [cx + Math.cos(a) * rx * d, cy + Math.sin(a) * ry * d]; });
  const tour = [way.shift()];                                // nearest-neighbour tour, so the scribble flows
  while (way.length) {
    const last = tour[tour.length - 1];
    let bi = 0, bd = Infinity;
    way.forEach((p, i) => { const d = Math.hypot(p[0] - last[0], p[1] - last[1]); if (d < bd) { bd = d; bi = i; } });
    tour.push(way.splice(bi, 1)[0]);
  }
  const pts = [];
  let a = R() * 6.283;
  for (let i = 0; i < tour.length - 1; i++) {
    const n = Math.max(2, Math.round(Math.hypot(tour[i + 1][0] - tour[i][0], tour[i + 1][1] - tour[i][1]) / (rr0 * 0.5)));
    for (let k = 0; k < n; k++) {
      const c = lerp2(tour[i], tour[i + 1], k / n), rr = rr0 * between(R, 0.55, 1.2);
      a += 0.62 + (R() - 0.5) * 0.5;
      pts.push([c[0] + Math.cos(a) * rr, c[1] + Math.sin(a) * rr * 0.85]);
    }
  }
  return pencil(R, pts, { w, op, wobble: 0.3 });
}

function ellipse(R, cx, cy, rx, ry, { from = 0, to = Math.PI * 2, ...o } = {}) {
  const pts = [];
  for (let i = 0; i <= 28; i++) { const t = lerp(from, to, i / 28); pts.push([cx + Math.cos(t) * rx, cy + Math.sin(t) * ry]); }
  return pencil(R, pts, { wobble: 0.6, ...o });
}

const note = (x, y, text, { size = 40, rot = -1.5, op = 0.75 } = {}) => !opt.notes ? '' :
  `<text x="${f(x)}" y="${f(y)}" font-family="Caveat" font-size="${f(size * U)}" fill="${LEAD}" opacity="${op}" transform="rotate(${rot} ${f(x)} ${f(y)})">${text}</text>`;

// Margin notes: a place line with a time, and one observation. Varies with the seed.
const NOTES = {
  farmhouse: [['farmhouse off Rt. 9', 'low sun from the west, barn door shut'], ['the Miller place, from the road', 'smoke from the chimney, truck gone'],
    ['farm on County Rd 12', 'porch light on, dog asleep by the steps'], ['white farmhouse, east field', 'wind in the poplars, hay just cut']],
  buildingFront: [['corner of 5th & Main', 'awning down, lights on in the back'], ['Elm St, across from the bank', 'shutters half up, delivery at 7:15'],
    ['block of shops on Water St', 'third floor window open, radio playing'], ['Main St, north side', 'barber not open yet, line at the bakery']],
  cityStreet: [['3rd Ave looking south', 'grey sedan, same spot as Tuesday'], ['Market St from the bus shelter', 'two in long coats, walked north, didn\u2019t look back'],
    ['8th Ave at the light', 'van double-parked 6 min, engine running'], ['downtown, looking toward the river', 'steam from the grate, wind from the west']],
  diner: [['counter', 'man in the cap: coffee, no food, watches the door'], ['Al\u2019s, end of the counter', 'waitress refills without asking \u2014 regulars'],
    ['the diner on Rt. 1', 'booth by the window: two men, one map'], ['counter, early', 'cook sings along to the radio, eggs over easy']],
  nature: [['north shore, Pine Lake', 'wind from the NE, water choppy past the rocks'], ['the cove below the trail', 'heron on the far bank, gone before I finished'],
    ['east end of the lake', 'clouds building over the ridge'], ['shore path, flat rocks', 'loons calling, water like glass']],
};
function stamp(R, h0, h1) {
  const h = Math.floor(between(R, h0, h1)), m = Math.floor(R() * 60), ampm = h < 12 ? 'am' : 'pm';
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${ampm}`;
}
const notes = (R, scene, x, y, [h0, h1] = [6, 19]) => {
  const [place, obs] = pick(R, NOTES[scene]);
  return note(x, y, `${place} \u2014 ${stamp(R, h0, h1)}`) + note(x + W * 0.01, y + H * 0.05, obs, { size: 34 });
};

function arrow(R, a, b) {
  const ang = Math.atan2(b[1] - a[1], b[0] - a[0]), h = 14 * U;
  return curve(R, [a, [lerp(a[0], b[0], 0.5) + 20 * U, lerp(a[1], b[1], 0.5) - 20 * U], b], { w: 0.6, op: 0.6 })
    + line(R, b, [b[0] - Math.cos(ang - 0.45) * h, b[1] - Math.sin(ang - 0.45) * h], { w: 0.6, op: 0.6, over: 0 })
    + line(R, b, [b[0] - Math.cos(ang + 0.45) * h, b[1] - Math.sin(ang + 0.45) * h], { w: 0.6, op: 0.6, over: 0 });
}

// ---------- simple perspective camera (metres; X right, Y up, Z forward)
function camera(pos, yaw, fpx, horizonY, centerX = W / 2) {
  const c = Math.cos(yaw), s = Math.sin(yaw);
  const P = ([x, y, z]) => {
    const dx = x - pos[0], dy = y - pos[1], dz = z - pos[2];
    const xr = dx * c - dz * s, zr = Math.max(0.15, dx * s + dz * c);
    return [centerX + fpx * xr / zr, horizonY - fpx * dy / zr];
  };
  P.pos = pos;
  P.scale = ([x, , z]) => { const dx = x - pos[0], dz = z - pos[2]; return fpx / Math.max(0.15, dx * s + dz * c); };
  return P;
}
// An object frame: local point → world (rotated about Y, then moved).
const frame = (o, a = 0) => ({ o, a, w: ([x, y, z]) => [o[0] + x * Math.cos(a) + z * Math.sin(a), y, o[2] - x * Math.sin(a) + z * Math.cos(a)],
  n: ([x, y, z]) => [x * Math.cos(a) + z * Math.sin(a), y, -x * Math.sin(a) + z * Math.cos(a)] });
const visible = (cam, T, localPts, n) => {
  const c = localPts.reduce((m, p) => [m[0] + p[0] / localPts.length, m[1] + p[1] / localPts.length, m[2] + p[2] / localPts.length], [0, 0, 0]);
  const wc = T.w(c), wn = T.n(n);
  return wn[0] * (wc[0] - cam.pos[0]) + wn[1] * (wc[1] - cam.pos[1]) + wn[2] * (wc[2] - cam.pos[2]) < 0;
};

// A box: draws visible faces (each edge once); returns face frames for windows and doors.
function box(R, cam, T, [x0, x1, y0, y1, z0, z1], { op = 0.85, w = 1, shade = {}, skip = [] } = {}) {
  const faces = {
    front: { O: [x0, y0, z0], U: [1, 0, 0], V: [0, 1, 0], n: [0, 0, -1], su: x1 - x0, sv: y1 - y0 },
    back: { O: [x1, y0, z1], U: [-1, 0, 0], V: [0, 1, 0], n: [0, 0, 1], su: x1 - x0, sv: y1 - y0 },
    left: { O: [x0, y0, z1], U: [0, 0, -1], V: [0, 1, 0], n: [-1, 0, 0], su: z1 - z0, sv: y1 - y0 },
    right: { O: [x1, y0, z0], U: [0, 0, 1], V: [0, 1, 0], n: [1, 0, 0], su: z1 - z0, sv: y1 - y0 },
    top: { O: [x0, y1, z0], U: [1, 0, 0], V: [0, 0, 1], n: [0, 1, 0], su: x1 - x0, sv: z1 - z0 },
  };
  let s = '';
  const drawn = new Set();
  for (const [name, F] of Object.entries(faces)) {
    const loc = [[0, 0], [F.su, 0], [F.su, F.sv], [0, F.sv]].map(([u, v]) => F.O.map((o, i) => o + F.U[i] * u + F.V[i] * v));
    F.vis = visible(cam, T, loc, F.n);
    F.at = (u, v) => cam(T.w(F.O.map((o, i) => o + F.U[i] * u + F.V[i] * v)));
    if (!F.vis || skip.includes(name)) continue;
    const scr = loc.map(p => cam(T.w(p)));
    if (shade[name]) s += hatch(R, scr, shade[name]);
    for (let i = 0; i < 4; i++) {
      const k = [loc[i], loc[(i + 1) % 4]].map(p => p.map(v => v.toFixed(2)).join(',')).sort().join('|');
      if (drawn.has(k)) continue;
      drawn.add(k);
      s += line(R, scr[i], scr[(i + 1) % 4], { op, w });
    }
  }
  return { s, faces };
}

// A rectangle on a face (window, door, sign) with optional glass hatching and mullions.
function rectOn(R, F, u0, v0, u1, v1, { glass = 0, mullion = false, sill = false, op = 0.75, w = 0.8 } = {}) {
  if (!F.vis) return '';
  const q = [F.at(u0, v0), F.at(u1, v0), F.at(u1, v1), F.at(u0, v1)];
  let s = outline(R, q, { op, w });
  if (glass) s += hatch(R, q, { angle: between(R, -1.2, -0.7), gap: glass > 1 ? 6 : 11, op: 0.38 * Math.min(glass, 1.6), cross: glass > 1.3 });
  if (mullion) s += line(R, F.at((u0 + u1) / 2, v0), F.at((u0 + u1) / 2, v1), { op: op * 0.8, w: 0.6 }) + line(R, F.at(u0, (v0 + v1) / 2), F.at(u1, (v0 + v1) / 2), { op: op * 0.8, w: 0.6 });
  if (sill) s += line(R, F.at(u0 - 0.12, v0 - 0.05), F.at(u1 + 0.12, v0 - 0.05), { op, w: 1 });
  return s;
}

// Gable roof over a box, ridge running along local X.
function gable(R, cam, T, [x0, x1, , y1, z0, z1], yr, ov = 0.45) {
  const zm = (z0 + z1) / 2, P = p => cam(T.w(p));
  const eF = [[x0 - ov, y1 - 0.15, z0 - ov], [x1 + ov, y1 - 0.15, z0 - ov]], eB = [[x0 - ov, y1 - 0.15, z1 + ov], [x1 + ov, y1 - 0.15, z1 + ov]];
  const rg = [[x0 - ov, yr, zm], [x1 + ov, yr, zm]];
  let s = '';
  const front = [eF[0], eF[1], rg[1], rg[0]], back = [eB[1], eB[0], rg[0], rg[1]];
  if (visible(cam, T, front, [0, zm - z0, -(yr - y1)])) {
    const scr = front.map(P);
    s += hatch(R, scr, { angle: between(R, -1.45, -1.25), gap: 9, op: 0.35 }) + outline(R, scr, { op: 0.9, w: 1.1 });
  }
  if (visible(cam, T, back, [0, zm - z0, yr - y1])) s += outline(R, back.map(P), { op: 0.9, w: 1.1 });
  for (const [x, nx] of [[x0, -1], [x1, 1]]) {
    const tri = [[x, y1, z0], [x, y1, z1], [x, yr - 0.1, zm]];
    if (visible(cam, T, tri, [nx, 0, 0])) s += outline(R, tri.map(P), { op: 0.85 });
  }
  return s;
}

// ---------- people, as a quick observer draws them: a few gestural lines
function standing(R, foot, s, { walk = R() < 0.5, coat = R() < 0.6, dir = R() < 0.5 ? -1 : 1 } = {}) {
  const [x, y] = foot, hipY = y - 0.88 * s, shY = y - 1.42 * s, st = (walk ? 0.17 : 0.05) * s;
  let g = '';
  g += curve(R, [[x - st, y], [x - st * 0.4 - 0.04 * s, lerp(y, hipY, 0.5)], [x - 0.07 * s, hipY]], { w: 0.9 });       // legs
  g += curve(R, [[x + st, y], [x + st * 0.4 + 0.04 * s, lerp(y, hipY, 0.5)], [x + 0.07 * s, hipY]], { w: 0.9 });
  g += line(R, [x - st - 0.05 * s, y], [x - st + 0.04 * s * dir, y], { w: 1, over: 0 }) + line(R, [x + st - 0.03 * s, y], [x + st + 0.06 * s * dir, y], { w: 1, over: 0 });
  const hem = coat ? y - 0.55 * s : hipY;
  const left = [[x - 0.19 * s, shY + 0.03 * s], [x - 0.2 * s, lerp(shY, hem, 0.5)], [x - 0.16 * s, hem]];
  const right = [[x + 0.19 * s, shY + 0.03 * s], [x + 0.2 * s, lerp(shY, hem, 0.5)], [x + 0.16 * s, hem]];
  g += curve(R, left, { w: 0.9 }) + curve(R, right, { w: 0.9 }) + curve(R, [left[0], [x, shY - 0.03 * s], right[0]], { w: 0.9 });
  g += line(R, left[2], right[2], { w: 0.7, op: 0.7, over: 0.3 });
  if (coat || R() < 0.4) g += hatch(R, [...left, ...right.slice().reverse()], { angle: between(R, 1.0, 1.3), gap: between(R, 6, 10), op: 0.38 });
  g += ellipse(R, x + 0.02 * s * dir, shY - 0.14 * s, 0.075 * s, 0.095 * s, { w: 0.9 });
  if (R() < 0.4) g += line(R, [x - 0.1 * s, shY - 0.2 * s], [x + 0.12 * s, shY - 0.2 * s], { w: 1.1, over: 0.2 }) + hatch(R, [[x - 0.075 * s, shY - 0.2 * s], [x + 0.075 * s, shY - 0.2 * s], [x + 0.06 * s, shY - 0.25 * s], [x - 0.06 * s, shY - 0.25 * s]], { gap: 3, op: 0.6 });
  const swing = walk ? 0.1 * s : 0;
  g += curve(R, [left[0], [x - 0.24 * s - swing * 0.5, shY + 0.3 * s], [x - 0.21 * s - swing, shY + 0.58 * s]], { w: 0.75, op: 0.75 });
  g += curve(R, [right[0], [x + 0.24 * s + swing * 0.5, shY + 0.3 * s], [x + 0.21 * s + swing, shY + 0.58 * s]], { w: 0.75, op: 0.75 });
  return g;
}

function seatedBack(R, seat, s, floorY, counterY, { cap = false } = {}) {
  const [x, y] = seat, lean = between(R, 0.02, 0.07) * s;
  let g = ellipse(R, x, y, 0.2 * s, 0.055 * s, { w: 0.8, op: 0.8 });
  g += line(R, [x, y + 0.05 * s], [x, floorY], { w: 0.9, op: 0.75 });
  g += ellipse(R, x, lerp(y, floorY, 0.62), 0.14 * s, 0.035 * s, { w: 0.6, op: 0.6, from: 0, to: Math.PI });
  const shY = y - 0.58 * s;
  const L = [[x - 0.17 * s, y - 0.01 * s], [x - 0.215 * s + lean * 0.6, lerp(y, shY, 0.55)], [x - 0.22 * s + lean, shY + 0.06 * s]];
  const Rt = [[x + 0.17 * s, y - 0.01 * s], [x + 0.215 * s + lean * 0.6, lerp(y, shY, 0.55)], [x + 0.22 * s + lean, shY + 0.06 * s]];
  g += curve(R, L, { w: 1 }) + curve(R, Rt, { w: 1 }) + curve(R, [L[2], [x + lean, shY - 0.02 * s], Rt[2]], { w: 1 });
  if (R() < 0.75) g += hatch(R, [...L, ...Rt.slice().reverse()], { angle: between(R, 1.0, 1.35), gap: between(R, 6, 11), op: 0.4, cross: R() < 0.3 });
  g += curve(R, [[x - 0.03 * s + lean, shY - 0.01 * s], [x - 0.035 * s + lean, shY - 0.06 * s]], { w: 0.8 }) + curve(R, [[x + 0.03 * s + lean, shY - 0.01 * s], [x + 0.035 * s + lean, shY - 0.06 * s]], { w: 0.8 });
  const hx = x + lean * 1.2, hy = shY - 0.15 * s;
  g += ellipse(R, hx, hy, 0.085 * s, 0.105 * s, { w: 0.9 });
  if (cap) {
    g += hatch(R, [[hx - 0.09 * s, hy - 0.02 * s], [hx - 0.08 * s, hy - 0.09 * s], [hx, hy - 0.115 * s], [hx + 0.08 * s, hy - 0.09 * s], [hx + 0.09 * s, hy - 0.02 * s]], { gap: 4, op: 0.65, cross: true });
    g += line(R, [hx - 0.1 * s, hy - 0.02 * s], [hx + 0.1 * s, hy - 0.02 * s], { w: 1.1 });
  } else g += scribble(R, hx, hy - 0.035 * s, 0.07 * s, 0.06 * s, { r: Math.max(4, 0.025 * s / U), op: 0.55 });
  for (const sd of [-1, 1]) g += curve(R, [[x + sd * 0.21 * s + lean, shY + 0.1 * s], [x + sd * 0.26 * s + lean, lerp(shY, counterY, 0.55)], [x + sd * 0.17 * s + lean * 2, counterY]], { w: 0.8, op: 0.7 });
  return g;
}

function bust(R, c, s) {                                   // head and shoulders above a booth table
  const [x, y] = c;
  let g = curve(R, [[x - 0.24 * s, y], [x - 0.2 * s, y - 0.14 * s], [x, y - 0.18 * s], [x + 0.2 * s, y - 0.14 * s], [x + 0.24 * s, y]], { w: 0.9 });
  g += ellipse(R, x, y - 0.32 * s, 0.085 * s, 0.105 * s, { w: 0.9 }) + scribble(R, x, y - 0.36 * s, 0.07 * s, 0.05 * s, { r: Math.max(3, 0.02 * s / U), op: 0.5 });
  return g + hatch(R, [[x - 0.24 * s, y], [x - 0.2 * s, y - 0.14 * s], [x + 0.2 * s, y - 0.14 * s], [x + 0.24 * s, y]], { angle: 1.1, gap: 7, op: 0.35 });
}

// ---------- nature
function tree(R, base, h, { op = 0.75 } = {}) {
  const [x, y] = base, tw = Math.max(7 * U, h * 0.026);
  let g = curve(R, [[x - tw * 1.4, y], [x - tw, y - h * 0.2], [x - tw * 0.6, y - h * 0.48]], { w: 1.2, op }) + curve(R, [[x + tw * 1.5, y], [x + tw, y - h * 0.2], [x + tw * 0.6, y - h * 0.48]], { w: 1.2, op });
  g += hatch(R, [[x + tw * 0.1, y], [x + tw * 1.5, y], [x + tw * 0.6, y - h * 0.48], [x, y - h * 0.48]], { angle: 1.5, gap: 4, op: 0.45 });
  for (let k = 0; k < 4; k++) {
    const sy = y - h * between(R, 0.4, 0.55), ex = x + between(R, -1, 1) * h * 0.28, ey = y - h * between(R, 0.62, 0.85);
    g += curve(R, [[x, sy], [lerp(x, ex, 0.5), lerp(sy, ey, 0.6)], [ex, ey]], { w: 0.8, op: op * 0.8 });
  }
  const lobes = Math.round(between(R, 5, 7)), cy = y - h * 0.68, spread = h * 0.28;
  for (let k = 0; k < lobes; k++) {
    const lx = x + between(R, -1, 1) * spread, ly = cy + between(R, -0.55, 0.45) * spread * 0.8, r = spread * between(R, 0.42, 0.62);
    g += scribble(R, lx, ly, r, r * 0.72, { r: between(R, 12, 17), op: op * 0.85 });
    g += hatch(R, Array.from({ length: 12 }, (_, i) => { const a = Math.PI * (0.1 + 0.8 * i / 11); return [lx + Math.cos(a) * r * 0.85, ly + r * 0.2 + Math.sin(a) * r * 0.5]; }), { angle: -0.9, gap: 6, op: 0.32 });
  }
  return g;
}

function grass(R, x0, x1, y, n, h = 18) {
  let g = '';
  for (let k = 0; k < n; k++) { const x = between(R, x0, x1), hh = h * U * between(R, 0.5, 1.4); g += line(R, [x, y], [x + between(R, -0.4, 0.4) * hh, y - hh], { w: 0.6, op: 0.55, over: 0, passes: 1 }); }
  return g;
}

function rock(R, cx, cy, s) {                            // rounded boulder: soft top contour, shaded right side
  const n = 9, pts = [];
  for (let i = 0; i < n; i++) { const a = Math.PI + (Math.PI * i) / (n - 1); pts.push([cx + Math.cos(a) * s * between(R, 0.85, 1.1), cy + Math.sin(a) * s * between(R, 0.5, 0.75)]); }
  let g = curve(R, pts, { w: 1 }) + line(R, pts[n - 1], pts[0], { w: 0.8, op: 0.6 });
  const mid = Math.floor(n / 2);
  g += hatch(R, [...smooth(pts.slice(mid)), [cx + s * 0.15, cy]], { angle: -0.8, gap: 5, op: 0.45, cross: R() < 0.5 });
  g += curve(R, [pts[mid], [cx + s * 0.25, lerp(pts[mid][1], cy, 0.5)], [cx + s * 0.15, cy]], { w: 0.6, op: 0.5 });
  return g + line(R, [cx - s * 1.2, cy + 3 * U], [cx + s * 1.4, cy + 3 * U], { w: 0.7, op: 0.5 });
}

// ---------- scenes
const scenes = {
  farmhouse(R) {
    const hz = H * between(R, 0.5, 0.55), cam = camera([0, 1.6, 0], 0, W * 0.72, hz);
    let g = line(R, [0, hz], [W, hz], { w: 0.5, op: 0.22 });
    g += curve(R, [[-20, hz - 25 * U], [W * 0.3, hz - 60 * U], [W * 0.62, hz - 35 * U], [W + 20, hz - 75 * U]], { w: 0.6, op: 0.35 });
    for (let k = 0; k < 6; k++) g += scribble(R, between(R, 0.35, 1) * W, hz - between(R, 20, 45) * U, between(R, 30, 70) * U, 16 * U, { r: 6, op: 0.4 });
    // barn and silo, set back to the right
    const B = frame([between(R, 6, 9), 0, 50], between(R, 0.4, 0.6));
    const barn = [0, 11, 0, 5.5, 0, 9];
    const bb = box(R, cam, B, barn, { op: 0.7, w: 0.9, shade: { left: { gap: 8, op: 0.3 }, right: { gap: 8, op: 0.3 } } });
    g += bb.s + gable(R, cam, B, barn, 9.5, 0.4) + rectOn(R, bb.faces.front, 3.8, 0, 7.2, 4.2, { op: 0.7 });
    if (bb.faces.front.vis) g += line(R, bb.faces.front.at(3.8, 0), bb.faces.front.at(7.2, 4.2), { w: 0.6, op: 0.6 }) + line(R, bb.faces.front.at(7.2, 0), bb.faces.front.at(3.8, 4.2), { w: 0.6, op: 0.6 });
    const sx = between(R, 24, 28), sz = 56, sr = 2.3, sh = 12, ring = hh => Array.from({ length: 33 }, (_, i) => cam([sx + Math.cos(i / 32 * 6.283) * sr, hh, sz + Math.sin(i / 32 * 6.283) * sr]));
    const base = ring(0), top = ring(sh), xsB = base.map(p => p[0]), iL = xsB.indexOf(Math.min(...xsB)), iR = xsB.indexOf(Math.max(...xsB));
    g += line(R, base[iL], top[iL], { op: 0.7 }) + line(R, base[iR], top[iR], { op: 0.7 }) + pencil(R, top, { op: 0.7 });
    g += curve(R, [top[iL], cam([sx, sh + sr * 0.8, sz]), top[iR]], { op: 0.7 });
    for (const hh of [3, 6, 9]) { const r2 = ring(hh); g += pencil(R, r2.filter((_, i) => i > 8 && i < 24), { w: 0.5, op: 0.45 }); }
    g += hatch(R, [lerp2(base[iL], base[iR], 0.55), lerp2(top[iL], top[iR], 0.55), top[iR], base[iR]], { angle: 1.45, gap: 7, op: 0.35 });
    // the farmhouse
    const T = frame([between(R, -12, -9), 0, 30], between(R, 0.45, 0.65));
    const house = [0, 11, 0, 6, 0, 8];
    const hb = box(R, cam, T, house, { shade: { left: { gap: 7, op: 0.35 }, right: { gap: 7, op: 0.35 } } });
    g += hb.s + gable(R, cam, T, house, 9.2) + box(R, cam, T, [8.2, 9, 7.6, 10.2, 3, 3.8], { op: 0.8 }).s;
    for (const F of [hb.faces.front, hb.faces.left, hb.faces.right]) {
      if (!F.vis) continue;
      const cols = Math.max(1, Math.floor(F.su / 2.6));
      for (let c = 0; c < cols; c++) {
        const u = (F.su / cols) * (c + 0.5);
        g += rectOn(R, F, u - 0.55, 3.6, u + 0.55, 5.1, { glass: R() < 0.5 ? 1 : 0.6, mullion: true, sill: true });
        if (F !== hb.faces.front || Math.abs(u - F.su / 2) > 1.2) g += rectOn(R, F, u - 0.55, 1.0, u + 0.55, 2.5, { glass: 0.8, mullion: true, sill: true });
      }
    }
    if (hb.faces.front.vis) {                                // porch: roof, posts, rail, step, door
      const F = hb.faces.front, P = p => cam(T.w(p));
      g += rectOn(R, F, 5, 0, 6, 2.2, { glass: 0.5 });
      const roof = [[0.4, 3.1, 0], [10.6, 3.1, 0], [10.6, 2.75, -2.4], [0.4, 2.75, -2.4]].map(P);
      g += hatch(R, roof, { angle: -0.3, gap: 6, op: 0.35 }) + outline(R, roof, { w: 1 });
      for (let k = 0; k <= 4; k++) { const x = lerp(0.6, 10.4, k / 4); g += line(R, P([x, 0.4, -2.3]), P([x, 2.75, -2.3]), { w: 0.9 }); }
      g += line(R, P([0.4, 0.4, -2.4]), P([10.6, 0.4, -2.4]), { w: 1 }) + line(R, P([0.6, 1.0, -2.3]), P([4.6, 1.0, -2.3]), { w: 0.7 }) + line(R, P([6.4, 1.0, -2.3]), P([10.4, 1.0, -2.3]), { w: 0.7 });
      g += line(R, P([4.7, 0.2, -2.7]), P([6.3, 0.2, -2.7]), { w: 0.8 });
      g += hatch(R, [P([0.4, 2.75, -2.4]), P([10.6, 2.75, -2.4]), P([10.6, 0.4, 0]), P([0.4, 0.4, 0])], { angle: 1.2, gap: 5, op: 0.22 });
      g += line(R, P([5.5, 0, -2.8]), [W * 0.42, H * 1.02], { w: 0.6, op: 0.45 }) + line(R, P([6.3, 0, -2.8]), [W * 0.58, H * 1.02], { w: 0.6, op: 0.45 });
    }
    const fz = between(R, 15, 18);                          // fence along the lane
    for (let k = 0; k <= 10; k++) { const x = lerp(-22, -4, k / 10), z = fz + k * 0.4; g += line(R, cam([x, 0, z]), cam([x, 1.2, z]), { w: 0.8, op: 0.75 }); }
    g += line(R, cam([-22, 1.05, fz]), cam([-4, 1.05, fz + 4]), { w: 0.7 }) + line(R, cam([-22, 0.6, fz]), cam([-4, 0.6, fz + 4]), { w: 0.7 });
    g += tree(R, [W * between(R, 0.84, 0.92), H * 0.97], H * between(R, 0.72, 0.82));
    const mb = cam([-2.2, 0, 6.5]), ms = cam.scale([-2.2, 0, 6.5]);   // mailbox at the end of the lane
    g += line(R, mb, [mb[0], mb[1] - 1.05 * ms], { w: 1.1 }) + outline(R, [[mb[0] - 0.24 * ms, mb[1] - 1.05 * ms], [mb[0] + 0.26 * ms, mb[1] - 1.05 * ms], [mb[0] + 0.26 * ms, mb[1] - 1.3 * ms], [mb[0] - 0.24 * ms, mb[1] - 1.3 * ms]], { w: 0.9 });
    g += hatch(R, [[mb[0] + 0.05 * ms, mb[1] - 1.05 * ms], [mb[0] + 0.26 * ms, mb[1] - 1.05 * ms], [mb[0] + 0.26 * ms, mb[1] - 1.3 * ms], [mb[0] + 0.05 * ms, mb[1] - 1.3 * ms]], { angle: 1.2, gap: 5, op: 0.4 });
    g += grass(R, 0, W, H * 0.985, 80, 26) + grass(R, 0, W * 0.7, lerp(hz, H, 0.25), 50, 12) + grass(R, mb[0] - 60 * U, mb[0] + 60 * U, mb[1] + 2 * U, 14, 22);
    g += notes(R, 'farmhouse', W * 0.04, H * 0.08, [7, 19]);
    return g;
  },

  buildingFront(R) {
    const hz = H * 0.74, cam = camera([between(R, -0.6, 0.6), 1.6, 0], 0, W * 0.72, hz);
    let g = '';
    const z = 22, P = (x, y, zz = z) => cam([x, y, zz]);
    const hs = [between(R, 13, 16), between(R, 10, 12.5), between(R, 7, 9)];
    const blocks = [{ x0: -15, x1: -6.5, h: hs[0] }, { x0: -6.5, x1: 4, h: hs[1] }, { x0: 4, x1: 15, h: hs[2] }];
    for (const [bi, b] of blocks.entries()) {
      const F = { vis: true, su: b.x1 - b.x0, at: (u, v) => P(b.x0 + u, v) };
      g += outline(R, [P(b.x0, 0), P(b.x1, 0), P(b.x1, b.h), P(b.x0, b.h)], { w: 1 });
      const cor = [P(b.x0 - 0.2, b.h - 0.6, z - 0.4), P(b.x1 + 0.2, b.h - 0.6, z - 0.4), P(b.x1 + 0.2, b.h, z - 0.4), P(b.x0 - 0.2, b.h, z - 0.4)];
      g += outline(R, cor, { w: 0.9 }) + hatch(R, [cor[0], cor[1], P(b.x1, b.h - 0.6), P(b.x0, b.h - 0.6)], { angle: 0.15, gap: 5, op: 0.4 });
      const floors = Math.floor((b.h - 4.6) / 3.2), cols = Math.max(2, Math.floor(F.su / 2.4));
      for (let fl = 0; fl < floors; fl++) for (let c = 0; c < cols; c++) {
        const u = (F.su / cols) * (c + 0.5), v = 4.8 + fl * 3.2;
        g += rectOn(R, F, u - 0.6, v, u + 0.6, v + 1.8, { glass: pick(R, [0.6, 1, 1.5]), mullion: R() < 0.6, sill: true, op: 0.7 });
      }
      g += line(R, P(b.x0, 4.1), P(b.x1, 4.1), { w: 1 });
      const sign = [P(b.x0 + 0.6, 3.35), P(b.x1 - 0.6, 3.35), P(b.x1 - 0.6, 3.95), P(b.x0 + 0.6, 3.95)];
      g += outline(R, sign, { w: 0.8, op: 0.75 });
      const letters = Math.floor(F.su / 1.1);                 // illegible sign lettering, as seen from across the street
      for (let k = 0; k < letters; k++) g += scribble(R, lerp(sign[0][0], sign[1][0], (k + 0.75) / (letters + 0.5)), (sign[0][1] + sign[2][1]) / 2, 11 * U, 9 * U, { r: 5, op: 0.55 });
      g += rectOn(R, F, 0.6, 0.45, F.su * 0.62, 3.0, { glass: 1.1, op: 0.85 });
      g += rectOn(R, F, F.su * 0.68, 0, F.su * 0.68 + 1.1, 2.6, { glass: 0.5 });
      if (bi === 1) {                                         // striped awning on the middle shop
        const a = [P(b.x0 + 0.4, 3.25), P(b.x1 - 0.4, 3.25), P(b.x1 - 0.4, 2.55, z - 1.6), P(b.x0 + 0.4, 2.55, z - 1.6)];
        g += outline(R, a, { w: 1 });
        const n = 9;
        for (let k = 0; k < n; k += 2) g += hatch(R, [lerp2(a[0], a[1], k / n), lerp2(a[0], a[1], (k + 1) / n), lerp2(a[3], a[2], (k + 1) / n), lerp2(a[3], a[2], k / n)], { angle: 1.3, gap: 5, op: 0.5 });
        g += pencil(R, Array.from({ length: n * 2 + 1 }, (_, k) => { const p = lerp2(a[3], a[2], k / (n * 2)); return [p[0], p[1] + (k % 2 ? 9 * U : 0)]; }), { w: 0.8 });
      }
      for (let k = 0; k < 6; k++) {                           // patches of brick
        const bx = between(R, b.x0 + 0.3, b.x1 - 1.5), by = between(R, 4.6, b.h - 1.5);
        for (let r = 0; r < 4; r++) g += line(R, P(bx + (r % 2) * 0.12, by + r * 0.16), P(bx + 0.5 + (r % 2) * 0.12, by + r * 0.16), { w: 0.5, op: 0.4, over: 0 });
      }
    }
    g += line(R, cam([-30, 0, 15]), cam([30, 0, 15]), { w: 1 }) + line(R, cam([-30, -0.15, 14.8]), cam([30, -0.15, 14.8]), { w: 0.7, op: 0.6 });  // curb
    for (let x = -14; x < 15; x += 3) g += line(R, cam([x, 0, 15.2]), cam([x + 0.6, 0, 21.8]), { w: 0.5, op: 0.3 });                              // paving joints
    const lx = between(R, -5, 1);
    g += line(R, cam([lx, 0, 16]), cam([lx, 5.2, 16]), { w: 1.2 }) + ellipse(R, ...cam([lx, 5.35, 16]), 15 * U, 21 * U, { w: 0.8 });
    const hx = between(R, 5, 9), hyd = cam([hx, 0, 16]), hs2 = cam.scale([hx, 0, 16]);
    g += outline(R, [[hyd[0] - 0.12 * hs2, hyd[1]], [hyd[0] - 0.1 * hs2, hyd[1] - 0.6 * hs2], [hyd[0] + 0.1 * hs2, hyd[1] - 0.6 * hs2], [hyd[0] + 0.12 * hs2, hyd[1]]], { w: 0.8 })
      + ellipse(R, hyd[0], hyd[1] - 0.66 * hs2, 0.09 * hs2, 0.07 * hs2, { w: 0.8 });
    for (let k = 0; k < 3; k++) { const fx = between(R, -12, 12), fz = between(R, 16.5, 20.5); g += standing(R, cam([fx, 0, fz]), cam.scale([fx, 0, fz])); }
    g += notes(R, 'buildingFront', W * 0.03, H * 0.06, [6, 10]);
    return g;
  },

  cityStreet(R) {
    const hz = H * between(R, 0.42, 0.48), cam = camera([between(R, -1, 1), 1.6, 0], between(R, -0.05, 0.05), W * 0.6, hz);
    let g = line(R, [0, hz], [W, hz], { w: 0.5, op: 0.22 });
    for (const side of [-1, 1]) {
      let z = 5, prevH = 0;
      const xF = side < 0 ? -6.5 : 6.5, xB = side < 0 ? -24 : 24;
      while (z < 170) {
        const depth = between(R, 9, 18), h = between(R, 9, 34), z2 = z + depth, far = z > 70;
        const o = { op: far ? 0.45 : 0.8, w: far ? 0.6 : 1 };
        const face = [cam([xF, 0, z]), cam([xF, 0, z2]), cam([xF, h, z2]), cam([xF, h, z])];
        if (side < 0) g += hatch(R, face, { gap: 9, op: 0.25 });
        g += line(R, face[0], face[3], o) + line(R, face[3], face[2], o) + line(R, face[1], face[2], o);
        if (h > prevH) g += line(R, cam([xF, h, z]), cam([xB, h, z]), o) + line(R, cam([xF, Math.max(prevH, 0), z]), cam([xF, h, z]), o);
        if (!far) {                                           // windows and shopfront on the street face
          const F = { vis: true, at: (u, v) => cam([xF, v, side < 0 ? z2 - u : z + u]) }, cols = Math.floor(depth / 2.6), floors = Math.floor((h - 4) / 3.3);
          for (let fl = 0; fl < floors; fl++) for (let c = 0; c < cols; c++) {
            if (R() < 0.12) continue;
            const u = (depth / cols) * (c + 0.5), v = 4.4 + fl * 3.3;
            g += rectOn(R, F, u - 0.55, v, u + 0.55, v + 1.7, { glass: R() < 0.4 ? 1.2 : 0, op: z > 40 ? 0.5 : 0.7, w: 0.6 });
          }
          g += rectOn(R, F, 0.8, 0.4, depth * 0.6, 3.2, { glass: 0.9, op: 0.7 });
        }
        prevH = h;
        z = z2 + (R() < 0.2 ? between(R, 6, 10) : 0);
      }
    }
    for (let k = 0; k < 7; k++) {                             // distant skyline
      const x = lerp(-60, 60, (k + R()) / 7), h = between(R, 30, 90);
      g += openLine(R, [cam([x, 0, 260]), cam([x, h, 260]), cam([x + 14, h, 260]), cam([x + 14, 0, 260])], { w: 0.5, op: 0.3 });
    }
    for (const x of [-6.5, -4, 4, 6.5]) g += line(R, cam([x, 0, 2]), cam([x, 0, 170]), { w: Math.abs(x) > 5 ? 0.8 : 1, op: 0.7 });
    for (let z = 4; z < 120; z += 9) g += line(R, cam([0, 0, z]), cam([0, 0, z + 4]), { w: 0.8, op: 0.6, over: 0 });
    for (let k = -3; k <= 3; k++) g += line(R, cam([k * 1.1, 0, 7]), cam([k * 1.1, 0, 10]), { w: 1.6, op: 0.5, over: 0 });
    for (let z = 12; z < 90; z += 18) for (const x of [-5, 5]) g += line(R, cam([x, 0, z]), cam([x, 6, z]), { w: 0.9, op: 0.75 }) + line(R, cam([x, 6, z]), cam([x - Math.sign(x) * 1.2, 6.1, z]), { w: 0.8, op: 0.7 });
    g += curve(R, [cam([-6.5, 9, 30]), cam([0, 7.6, 30]), cam([6.5, 9, 30])], { w: 0.5, op: 0.45 });
    for (let k = 0; k < 2; k++) {                             // parked cars
      const cz = between(R, 11, 26), T = frame([k ? 2.6 : -5.4, 0, cz]);
      g += box(R, cam, T, [0, 1.8, 0.3, 1.05, 0, 4.4], { w: 0.8, shade: { right: { gap: 6, op: 0.3 }, left: { gap: 6, op: 0.3 } } }).s;
      g += box(R, cam, T, [0.15, 1.65, 1.05, 1.5, 1.1, 3.2], { w: 0.8 }).s;
    }
    for (let k = 0; k < 5; k++) { const fx = pick(R, [-5.6, 5.6]) + between(R, -0.5, 0.5), fz = between(R, 7, 30); g += standing(R, cam([fx, 0, fz]), cam.scale([fx, 0, fz])); }
    g += notes(R, 'cityStreet', W * 0.03, H * 0.07, [7, 22]);
    return g;
  },

  diner(R) {
    const hz = H * 0.5, cam = camera([-0.25, 1.45, 0], between(R, 0.08, 0.14), W * 0.55, hz);
    let g = '';
    const T = frame([0, 0, 0]), Z1 = 16;
    // room: ceiling, walls, floor tiles in the aisle
    for (const [x, y] of [[-3.1, 3.0], [4, 3.0], [-3.1, 0], [4, 0]]) g += line(R, cam([x, y, 0.6]), cam([x, y, Z1]), { w: 0.7, op: 0.55 });
    g += outline(R, [cam([-3.1, 0, Z1]), cam([4, 0, Z1]), cam([4, 3, Z1]), cam([-3.1, 3, Z1])], { w: 0.7, op: 0.5 });
    for (let i = -3; i < 2; i++) for (let j = 2; j < 14; j++) {
      if ((i + j) % 2) continue;
      g += hatch(R, [cam([i * 0.5, 0, j * 0.5]), cam([i * 0.5 + 0.5, 0, j * 0.5]), cam([i * 0.5 + 0.5, 0, j * 0.5 + 0.5]), cam([i * 0.5, 0, j * 0.5 + 0.5])], { angle: 0.9, gap: 6, op: 0.18 });
    }
    // left: windows over a row of booths
    for (let z = 1.5; z < 14; z += 2.5) {
      const win = [cam([-3.1, 1.25, z]), cam([-3.1, 1.25, z + 2.2]), cam([-3.1, 2.5, z + 2.2]), cam([-3.1, 2.5, z])];
      g += outline(R, win, { w: 0.8, op: 0.7 });
      for (let k = 1; k < 6; k++) g += line(R, lerp2(win[0], win[3], k / 6), lerp2(win[1], win[2], k / 6), { w: 0.45, op: 0.35, over: 0 });
    }
    const booths = [];
    for (let c = 2.4; c < 14; c += 2.5) {
      g += box(R, cam, T, [-3.0, -1.9, 0.72, 0.78, c - 0.45, c + 0.45], { w: 0.8, op: 0.75 }).s;
      g += line(R, cam([-2.45, 0, c]), cam([-2.45, 0.72, c]), { w: 0.8, op: 0.6 });
      for (const dz of [-1.0, 1.0]) g += box(R, cam, T, [-3.0, -1.75, 0, 1.15, c + dz - 0.12, c + dz + 0.12], { w: 0.8, op: 0.7, shade: { right: { angle: 1.4, gap: 6, op: 0.3 } } }).s;
      booths.push(c);
    }
    const bc = pick(R, booths.slice(1, 4)), bp = cam([-2.4, 0.78, bc + 0.55]);
    g += bust(R, bp, cam.scale([-2.4, 0.78, bc + 0.55]));
    // right: back wall shelves and menu, back counter, the counter itself
    for (const y of [1.9, 2.4]) g += line(R, cam([4, y, 3]), cam([4, y, 13]), { w: 0.7, op: 0.6 });
    for (let k = 0; k < 16; k++) { const zz = between(R, 3.2, 12.8), y = pick(R, [1.9, 2.4]); g += line(R, cam([4, y, zz]), cam([4, y + between(R, 0.12, 0.3), zz]), { w: 1.4, op: 0.55, over: 0 }); }
    const menu = [cam([4, 2.55, 6]), cam([4, 2.55, 9.5]), cam([4, 2.95, 9.5]), cam([4, 2.95, 6])];
    g += outline(R, menu, { w: 0.9 });
    for (let r = 0; r < 3; r++) g += line(R, lerp2(menu[3], menu[0], (r + 0.6) / 3.4), lerp2(lerp2(menu[2], menu[1], (r + 0.6) / 3.4), lerp2(menu[3], menu[0], (r + 0.6) / 3.4), 0.25), { w: 0.5, op: 0.45, over: 0 });
    g += box(R, cam, T, [3.3, 4, 0, 0.95, 2, 14], { w: 0.8, op: 0.7 }).s;
    g += box(R, cam, T, [3.4, 3.9, 0.95, 1.55, 3, 3.9], { w: 0.9, shade: { left: { gap: 6, op: 0.35 } } }).s;
    const pie = box(R, cam, T, [3.4, 3.95, 0.95, 1.45, 5, 6.4], { w: 0.8 });
    g += pie.s + (pie.faces.left.vis ? hatch(R, [pie.faces.left.at(0, 0), pie.faces.left.at(1.4, 0), pie.faces.left.at(1.4, 0.5), pie.faces.left.at(0, 0.5)], { angle: -0.6, gap: 14, op: 0.3 }) : '');
    g += box(R, cam, T, [1.15, 1.9, 0, 1.05, 1.0, 14.5], { w: 1.1, shade: { left: { angle: 1.45, gap: 6, op: 0.32 } } }).s;
    g += line(R, cam([1.08, 1.08, 1.0]), cam([1.08, 1.08, 14.5]), { w: 1.2 });
    for (let z = 3; z < 14; z += 3) {                         // pendant lamps
      const top = cam([1.5, 3.0, z]), b = cam([1.5, 2.35, z]), s = cam.scale([1.5, 2.3, z]);
      g += line(R, top, b, { w: 0.6, op: 0.6 }) + outline(R, [b, [b[0] - 0.2 * s, b[1] + 0.18 * s], [b[0] + 0.2 * s, b[1] + 0.18 * s]], { w: 0.8 });
    }
    // cook behind the counter, then stools and the regulars (nearest drawn last)
    const cz = between(R, 7, 10);
    g += standing(R, cam([2.7, 0, cz]), cam.scale([2.7, 0, cz]), { walk: false, coat: true });
    const occupied = [1, 3, 4, 6].filter(() => R() < 0.85), capOn = pick(R, occupied.length ? occupied : [3]);
    for (let k = 9; k >= 0; k--) {
      const z = 1.9 + k * 1.2, seat = cam([0.72, 0.78, z]), s = cam.scale([0.72, 0.78, z]), floorY = cam([0.72, 0, z])[1];
      if (occupied.includes(k)) g += seatedBack(R, seat, s, floorY, cam([1.15, 1.05, z])[1], { cap: k === capOn });
      else g += ellipse(R, ...seat, 0.2 * s, 0.055 * s, { w: 0.8 }) + line(R, [seat[0], seat[1] + 0.05 * s], [seat[0], floorY], { w: 0.9, op: 0.7 });
    }
    g += notes(R, 'diner', W * 0.03, H * 0.07, [5, 10]);
    return g;
  },

  nature(R) {
    const hz = H * between(R, 0.48, 0.53);
    let g = curve(R, [[-20, hz - 90 * U], [W * 0.18, hz - 250 * U], [W * 0.33, hz - 140 * U], [W * 0.5, hz - 290 * U], [W * 0.7, hz - 160 * U], [W + 20, hz - 220 * U]], { w: 0.6, op: 0.32 });
    g += curve(R, [[-20, hz - 25 * U], [W * 0.3, hz - 85 * U], [W * 0.55, hz - 45 * U], [W + 20, hz - 65 * U]], { w: 0.8, op: 0.5 });
    for (let x = -40; x < W; x += between(R, 60, 110) * U) g += scribble(R, x, hz - between(R, 25, 55) * U, between(R, 45, 80) * U, 20 * U, { r: 7, op: 0.42 });   // far tree line
    g += line(R, [0, hz + 8 * U], [W, hz + 5 * U], { w: 0.8, op: 0.6 });
    for (let k = 0; k < 70; k++) { const y = hz + between(R, 16, 240) * U, x = between(R, -50, W), l = between(R, 30, 170) * U * (1 - (y - hz) / (500 * U)); g += line(R, [x, y], [x + l, y], { w: 0.5, op: 0.32, over: 0 }); }
    for (let k = 0; k < 18; k++) { const x = between(R, 0, W), y = hz + between(R, 12, 60) * U; g += line(R, [x, y], [x + between(R, 15, 50) * U, y], { w: 0.6, op: 0.4, over: 0 }); }   // tree line reflection
    const shoreY = hz + between(R, 250, 280) * U;
    g += curve(R, [[-20, shoreY], [W * 0.35, shoreY - 20 * U], [W * 0.7, shoreY + 15 * U], [W + 20, shoreY - 5 * U]], { w: 0.9, op: 0.7 });
    for (let k = 0; k < 4; k++) g += rock(R, between(R, 0.06, 0.58) * W, shoreY + between(R, 50, 120) * U, between(R, 50, 110) * U);
    const reedX = W * between(R, 0.02, 0.15);                // reeds at the water's edge
    for (let k = 0; k < 12; k++) { const x = reedX + between(R, 0, 140) * U, h = between(R, 120, 260) * U; g += curve(R, [[x, shoreY + 8 * U], [x + between(R, -10, 10) * U, shoreY - h * 0.5], [x + between(R, -25, 25) * U, shoreY - h]], { w: 0.6, op: 0.6 }); }
    g += tree(R, [W * between(R, 0.72, 0.82), H * 0.98], H * between(R, 0.82, 0.92));
    g += tree(R, [W * between(R, 0.12, 0.22), shoreY + 10 * U], H * between(R, 0.3, 0.36), { op: 0.55 });
    g += grass(R, 0, W, H * 0.99, 100, 30);
    for (let k = 0; k < 3; k++) { const bx = between(R, 0.3, 0.6) * W, by = H * between(R, 0.12, 0.25), s = between(R, 12, 20) * U; g += curve(R, [[bx - s, by], [bx - s * 0.4, by - s * 0.5], [bx, by]], { w: 0.6 }) + curve(R, [[bx, by], [bx + s * 0.5, by - s * 0.5], [bx + s, by - 2]], { w: 0.6 }); }
    g += notes(R, 'nature', W * 0.03, H * 0.07, [7, 18]);
    return g;
  },
};

// ---------- render
const fontB64 = readFileSync(join(HERE, 'fonts', 'caveat-latin-400-normal.woff2')).toString('base64');
const svg = body => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
<defs>
  <style>@font-face { font-family: 'Caveat'; src: url(data:font/woff2;base64,${fontB64}) format('woff2'); }</style>
  <filter id="graphite" x="-2%" y="-2%" width="104%" height="104%">
    <feTurbulence type="fractalNoise" baseFrequency="${(0.85 / U).toFixed(3)}" numOctaves="1" seed="${opt.seed}" result="n"/>
    <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -1.7 0 0 0 1.45" result="grain"/>
    <feComposite in="SourceGraphic" in2="grain" operator="in" result="g"/>
    <feTurbulence type="fractalNoise" baseFrequency="${(0.02 / U).toFixed(4)}" numOctaves="2" seed="${opt.seed + 3}" result="w"/>
    <feDisplacementMap in="g" in2="w" scale="${f(2.5 * U)}" xChannelSelector="R" yChannelSelector="G"/>
  </filter>
</defs>
<rect width="100%" height="100%" fill="#fff"/>
<g filter="url(#graphite)">${body}</g>
</svg>`;

const out = resolve(opt.out);
mkdirSync(out, { recursive: true });
const palette = join(out, '.palette16.png');
execFileSync('convert', ['-size', '16x1', 'gradient:black-white', '-colorspace', 'Gray', palette]);
const browser = await chromium.launch();
const pngs = [];
try {
  const page = await browser.newPage({ viewport: { width: W, height: H } });
  for (const [name, scene] of Object.entries(scenes)) {
    if (opt.only && !opt.only.includes(name)) continue;
    clipN = 0;
    const R = rng(opt.seed * 7919 + name.length * 131 + name.charCodeAt(0));
    const doc = svg(scene(R));
    const base = join(out, `${name}-${opt.seed}`);
    writeFileSync(`${base}.svg`, doc);
    await page.setContent(`<html><body style="margin:0">${doc}</body></html>`);
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: `${base}.png`, clip: { x: 0, y: 0, width: W, height: H } });
    execFileSync('convert', [`${base}.png`, '-colorspace', 'Gray', '-dither', 'FloydSteinberg', '-remap', palette, '-type', 'Grayscale', '-depth', '8', `${base}.png`]);
    pngs.push(`${base}.png`);
  }
} finally {
  await browser.close();
}
if (pngs.length > 1) execFileSync('convert', [...pngs, '-resize', '620x', '-bordercolor', '#ddd', '-border', '2', '+append', join(out, `contact-${opt.seed}.png`)]);
console.log(`wrote ${pngs.length} scenes to ${out}`);
