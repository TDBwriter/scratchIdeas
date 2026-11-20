// Procedural sumi-e (ink-brush) illustrations for the Pen Practice books.
//
//   node ink.mjs [--seed N] [--out DIR] [--size WxH]
//
// Every seed gives a new "generic" image in a naturalist, ink-and-brush style: dry-brush strokes
// built from bristles that run out of ink ("flying white"), soft washes, ragged ink-bleed edges and
// lots of empty paper. Pure black-and-white SVG, so it suits e-ink and print.
// Writes one SVG + one grayscale PNG per scene, plus a contact sheet.
// Requires: playwright (Chromium) and ImageMagick `convert`.

import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { resolve, join } from 'node:path';

const { chromium } = createRequire(import.meta.url)('playwright');

const opt = { seed: 1, out: 'out', w: 1860, h: 2480 };
const argv = process.argv.slice(2);
for (let i = 0; i < argv.length; i++) {
  if (argv[i] === '--seed') opt.seed = Number(argv[++i]);
  else if (argv[i] === '--out') opt.out = argv[++i];
  else if (argv[i] === '--size') [opt.w, opt.h] = argv[++i].split('x').map(Number);
}
const W = opt.w, H = opt.h, U = W / 1860;               // U scales every size to the canvas

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
const between = (R, a, b) => lerp(a, b, R());

function bezier([p0, p1, p2, p3], n = 40) {
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n, u = 1 - t;
    pts.push([u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0],
              u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1]]);
  }
  return pts;
}

// Even spacing along a polyline, with unit normals.
function resample(pts, n) {
  const d = [0];
  for (let i = 1; i < pts.length; i++) d.push(d[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const L = d[d.length - 1] || 1, out = [];
  let j = 0;
  for (let i = 0; i < n; i++) {
    const s = (L * i) / (n - 1);
    while (j < d.length - 2 && d[j + 1] < s) j++;
    const t = (s - d[j]) / (d[j + 1] - d[j] || 1);
    out.push([lerp(pts[j][0], pts[j + 1][0], t), lerp(pts[j][1], pts[j + 1][1], t)]);
  }
  return out.map((p, i) => {
    const a = out[Math.max(0, i - 1)], b = out[Math.min(n - 1, i + 1)];
    const dx = b[0] - a[0], dy = b[1] - a[1], m = Math.hypot(dx, dy) || 1;
    return { x: p[0], y: p[1], nx: -dy / m, ny: dx / m };
  });
}

// Brush pressure along a stroke: quick press, hold, lift (taper).
const profile = (t, attack, taper) =>
  (0.45 + 0.55 * Math.min(1, t / attack)) * Math.max(0.03, 1 - Math.pow(Math.max(0, (t - (1 - taper)) / taper), 1.4));

// One brush stroke: a wet core plus bristles that run dry toward the end.
function stroke(R, pts, { w = 20, ink = 1, dry = 0.4, bristles = 16, attack = 0.08, taper = 0.55, wobble = 1.2 } = {}) {
  w *= U;
  const n = 70, P = resample(pts, n);
  let s = '';
  const coreEnd = 1 - dry * 0.8, L = [], Rt = [];
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    if (t > coreEnd) break;
    const hw = 0.5 * w * profile(t, attack, taper) * (0.94 + 0.12 * R());
    L.push(`${f(P[i].x + P[i].nx * hw)} ${f(P[i].y + P[i].ny * hw)}`);
    Rt.push(`${f(P[i].x - P[i].nx * hw)} ${f(P[i].y - P[i].ny * hw)}`);
  }
  if (L.length > 2) s += `<path d="M${L.join(' L')} L${Rt.reverse().join(' L')} Z" fill="#000" opacity="${(ink * 0.82).toFixed(2)}"/>`;
  for (let b = 0; b < bristles; b++) {
    const o = b / (bristles - 1) - 0.5;
    const end = 1 - dry * Math.pow(R(), 1.3) * (0.5 + Math.abs(o) * 1.4);
    const start = R() * 0.04, pts2 = [];
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1);
      if (t < start || t > end) continue;
      const off = o * w * profile(t, attack, taper);
      pts2.push(`${f(P[i].x + P[i].nx * off + (R() - 0.5) * wobble * U)} ${f(P[i].y + P[i].ny * off + (R() - 0.5) * wobble * U)}`);
    }
    if (pts2.length > 1) {
      const bw = Math.max(0.8 * U, (w / bristles) * between(R, 1.1, 2.0));
      s += `<polyline points="${pts2.join(' ')}" fill="none" stroke="#000" stroke-width="${f(bw)}" stroke-linecap="round" stroke-linejoin="round" opacity="${(ink * between(R, 0.45, 0.95)).toFixed(2)}"/>`;
    }
  }
  return s;
}

// A soft wash: any closed shape, blurred and light.
const wash = (d, gray, blur = 'b2') => `<path d="${d}" fill="#000" opacity="${gray}" filter="url(#${blur})"/>`;
const dot = (x, y, r, op = 0.9) => `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r * U)}" fill="#000" opacity="${op}"/>`;

// A wandering line from a to b (for branches, stalks, reeds).
function wander(R, a, b, bend = 0.15, n = 4) {
  const ctrl = [a];
  for (let i = 1; i < n; i++) {
    const t = i / n, len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    ctrl.push([lerp(a[0], b[0], t) + (R() - 0.5) * len * bend, lerp(a[1], b[1], t) + (R() - 0.5) * len * bend * 0.3]);
  }
  ctrl.push(b);
  const pts = [];                                         // smooth through the control points
  for (let i = 0; i < ctrl.length - 1; i++) {
    const p0 = ctrl[Math.max(0, i - 1)], p1 = ctrl[i], p2 = ctrl[i + 1], p3 = ctrl[Math.min(ctrl.length - 1, i + 2)];
    for (let k = 0; k < 12; k++) {
      const t = k / 12, t2 = t * t, t3 = t2 * t;
      pts.push([0.5 * (2 * p1[0] + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),
                0.5 * (2 * p1[1] + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3)]);
    }
  }
  pts.push(b);
  return pts;
}

// ---------- motifs
function grassBlade(R, x, y, len, lean, w = 13) {
  const tip = [x + lean * len, y - len * between(R, 0.75, 1)];
  const mid = [x + lean * len * 0.25 + (R() - 0.5) * 30 * U, y - len * 0.55];
  return stroke(R, bezier([[x, y], mid, [lerp(mid[0], tip[0], 0.6), lerp(mid[1], tip[1], 0.4)], tip]),
    { w, ink: between(R, 0.6, 1), dry: between(R, 0.3, 0.7), bristles: 9, taper: 0.8, attack: 0.04 });
}

function bird(R, bx, by, s = 1) {                         // a perched shrike-like bird facing left
  const S = s * U, P = (dx, dy) => [bx + dx * S, by + dy * S];
  let g = '';
  g += wash(`M${P(-70, -95).join(' ')} Q${P(-10, -150).join(' ')} ${P(70, -70).join(' ')} Q${P(40, -15).join(' ')} ${P(-20, -30).join(' ')} Q${P(-70, -45).join(' ')} ${P(-70, -95).join(' ')} Z`, 0.22, 'b1');
  g += stroke(R, bezier([P(-55, -115), P(-10, -140), P(40, -110), P(85, -60)]), { w: 44 * s, dry: 0.45, bristles: 18, taper: 0.5 });  // back
  g += stroke(R, bezier([P(-15, -95), P(15, -90), P(45, -75), P(75, -52)]), { w: 30 * s, dry: 0.6, bristles: 14, taper: 0.6 });    // wing
  g += stroke(R, bezier([P(70, -60), P(105, -25), P(140, 25), P(165, 85)]), { w: 26 * s, dry: 0.5, bristles: 12, taper: 0.75 });    // tail
  g += stroke(R, [P(-62, -120), P(-48, -122), P(-36, -116)], { w: 62 * s, dry: 0.15, bristles: 14, taper: 0.4, attack: 0.3 });     // head
  g += `<path d="M${P(-86, -122).join(' ')} L${P(-106, -114).join(' ')} Q${P(-104, -106).join(' ')} ${P(-98, -104).join(' ')} L${P(-84, -110).join(' ')} Z" fill="#000"/>`; // beak
  g += `<circle cx="${f(P(-70, -124)[0])}" cy="${f(P(-70, -124)[1])}" r="${f(5.5 * S)}" fill="#fff"/>`;                               // eye
  g += stroke(R, bezier([P(-60, -80), P(-45, -50), P(-15, -35), P(25, -40)]), { w: 10 * s, ink: 0.55, dry: 0.7, bristles: 6, taper: 0.7 }); // belly line
  for (const dx of [-8, 14]) g += stroke(R, [P(dx, -36), P(dx - 4, -14), P(dx - 10, 0)], { w: 5 * s, dry: 0.2, bristles: 4, taper: 0.3 });  // feet
  return g;
}

function bambooStalk(R, x, yTop, yBot, lean, w, ink) {
  let g = '', y = yBot, nodes = [];
  const segs = Math.round(between(R, 4, 6)), segH = (yBot - yTop) / segs;
  for (let i = 0; i < segs; i++) {
    const y0 = y - 6 * U, y1 = y - segH + 6 * U;
    const x0 = x + lean * (yBot - y0), x1 = x + lean * (yBot - y1);
    g += stroke(R, [[x0, y0], [lerp(x0, x1, 0.5) + (R() - 0.5) * 4 * U, lerp(y0, y1, 0.5)], [x1, y1]],
      { w, ink, dry: between(R, 0.25, 0.6), bristles: 16, attack: 0.15, taper: 0.12 });
    nodes.push([x1, y - segH]);
    g += stroke(R, [[x1 - w * 0.55 * U, y - segH + 2 * U], [x1, y - segH - 3 * U], [x1 + w * 0.55 * U, y - segH + 1 * U]],
      { w: 6, ink, dry: 0.3, bristles: 5, taper: 0.4, attack: 0.3 });
    y -= segH;
  }
  return { g, nodes };
}

function leaf(R, x, y, ang, len, w, ink) {
  const dx = Math.cos(ang), dy = Math.sin(ang);
  const tip = [x + dx * len, y + dy * len];
  const mid = [x + dx * len * 0.45 - dy * len * 0.06, y + dy * len * 0.45 + dx * len * 0.06];
  return stroke(R, bezier([[x, y], mid, [lerp(mid[0], tip[0], 0.5), lerp(mid[1], tip[1], 0.5)], tip]),
    { w, ink, dry: between(R, 0.15, 0.45), bristles: 12, attack: 0.25, taper: 0.7 });
}

// ---------- scenes
const scenes = {
  shrike(R) {                                             // homage composition: lone bird on a bare branch
    let g = '';
    const x0 = W * between(R, 0.52, 0.6), top = [W * between(R, 0.46, 0.56), H * between(R, 0.22, 0.28)];
    const trunk = wander(R, [x0, H * 1.02], top, 0.08, 5);
    g += stroke(R, trunk, { w: 30, dry: 0.55, bristles: 22, taper: 0.35, attack: 0.02 });
    g += stroke(R, wander(R, [x0 + 8 * U, H * 0.98], [lerp(x0, top[0], 0.55) + 6 * U, H * 0.58], 0.05, 3), { w: 14, ink: 0.7, dry: 0.75, bristles: 10, taper: 0.6 });
    for (let k = 0; k < 3; k++) {                           // a few bare twigs
      const t = between(R, 0.35, 0.8), p = trunk[Math.floor(t * (trunk.length - 1))], dir = R() < 0.5 ? -1 : 1;
      g += stroke(R, wander(R, p, [p[0] + dir * between(R, 90, 200) * U, p[1] - between(R, 60, 180) * U], 0.2, 2), { w: 9, dry: 0.5, bristles: 7, taper: 0.8 });
    }
    g += bird(R, top[0] + 6 * U, top[1] + 4 * U, between(R, 1.15, 1.35));
    const gx = W * between(R, 0.12, 0.3);                    // grasses at the foot
    for (let k = 0; k < 7; k++) g += grassBlade(R, gx + between(R, -40, 120) * U, H * 1.01, between(R, 260, 620) * U, between(R, -0.25, 0.6));
    return g;
  },

  bamboo(R) {
    let g = '';
    const stalks = [
      { x: W * between(R, 0.36, 0.44), w: 34, ink: 1, lean: between(R, -0.04, 0.04) },
      { x: W * between(R, 0.58, 0.66), w: 26, ink: 0.55, lean: between(R, -0.06, 0.02) },
    ];
    for (const s of stalks) {
      const { g: sg, nodes } = bambooStalk(R, s.x, H * between(R, 0.05, 0.15), H * 1.02, s.lean, s.w, s.ink);
      g += sg;
      const crown = nodes[nodes.length - 1];
      for (const [nx, ny] of [...nodes.slice(1), crown]) {   // leaf clusters off most nodes, plus the crown
        if (R() < 0.25) continue;
        const side = R() < 0.5 ? -1 : 1, twigEnd = [nx + side * between(R, 50, 110) * U, ny - between(R, 20, 60) * U];
        g += stroke(R, [[nx, ny], twigEnd], { w: 6, ink: s.ink, dry: 0.3, bristles: 4, taper: 0.5 });
        const base = side < 0 ? Math.PI : 0;
        for (let k = 0; k < Math.round(between(R, 4, 6)); k++)
          g += leaf(R, ...twigEnd, base + side * between(R, -0.3, 1.2) + (side < 0 ? 0.25 : -0.25), between(R, 200, 330) * U, between(R, 28, 40), s.ink * between(R, 0.75, 1));
      }
    }
    return g;
  },

  reedsMoon(R) {
    let g = '';
    const mx = W * between(R, 0.62, 0.75), my = H * between(R, 0.16, 0.24), mr = between(R, 150, 210) * U;
    g += `<circle cx="${f(mx)}" cy="${f(my)}" r="${f(mr)}" fill="#000" opacity="0.07" filter="url(#b2)"/>`;
    g += `<circle cx="${f(mx)}" cy="${f(my)}" r="${f(mr)}" fill="none" stroke="#000" stroke-width="${f(2 * U)}" opacity="0.18" filter="url(#b1)"/>`;
    for (let k = 0; k < 14; k++) {                          // reeds with seed heads
      const x = W * between(R, 0.08, 0.6), len = between(R, 900, 1500) * U, lean = between(R, -0.1, 0.3);
      const tipX = x + lean * len, tipY = H * 1.01 - len;
      const ink = R() < 0.35 ? 0.45 : 1;
      g += stroke(R, bezier([[x, H * 1.01], [x + lean * len * 0.1, H - len * 0.4], [tipX - lean * 40 * U, tipY + len * 0.2], [tipX, tipY]]),
        { w: between(R, 7, 11), ink, dry: between(R, 0.3, 0.6), bristles: 6, taper: 0.35 });
      if (R() < 0.6) g += stroke(R, wander(R, [tipX, tipY + 10 * U], [tipX + between(R, 30, 70) * U, tipY + between(R, 90, 150) * U], 0.3, 2),
        { w: 20, ink: ink * 0.8, dry: 0.75, bristles: 12, taper: 0.7 });
    }
    for (let k = 0; k < 3; k++) {                           // distant birds: two flicks each
      const bx = W * between(R, 0.25, 0.55), by = H * between(R, 0.25, 0.42), s = between(R, 22, 36) * U;
      g += stroke(R, [[bx - s, by - s * 0.3], [bx - s * 0.4, by - s * 0.45], [bx, by]], { w: 5, dry: 0.2, bristles: 3, taper: 0.5 });
      g += stroke(R, [[bx, by], [bx + s * 0.5, by - s * 0.5], [bx + s * 1.1, by - s * 0.4]], { w: 5, dry: 0.2, bristles: 3, taper: 0.6 });
    }
    return g;
  },

  mountains(R) {
    let g = '';
    const layers = [{ y: 0.40, gray: 0.16, amp: 0.17 }, { y: 0.53, gray: 0.26, amp: 0.13 }, { y: 0.67, gray: 0.42, amp: 0.09 }];
    for (const [i, L] of layers.entries()) {
      const ph = [R() * 6.28, R() * 6.28, R() * 6.28], fr = [between(R, 1.2, 2.2), between(R, 3, 5), between(R, 7, 11)];
      const ridgeAt = x => H * L.y - H * L.amp * (0.55 * Math.max(0, Math.sin(x / W * fr[0] * 3.14 + ph[0])) ** 1.5
        + 0.3 * (0.5 + 0.5 * Math.sin(x / W * fr[1] * 3.14 + ph[1])) + 0.15 * (0.5 + 0.5 * Math.sin(x / W * fr[2] * 3.14 + ph[2])));
      const ridge = [];
      for (let x = -40 * U; x <= W + 40 * U; x += 12 * U) ridge.push([x, ridgeAt(x)]);
      const d = `M${ridge.map(p => `${f(p[0])} ${f(p[1])}`).join(' L')} L${f(W + 40 * U)} ${f(H * (L.y + 0.13))} L${f(-40 * U)} ${f(H * (L.y + 0.13))} Z`;
      g += `<path d="${d}" fill="url(#fade)" opacity="${(L.gray * 2).toFixed(2)}" filter="url(#b2)"/>`;
      if (i === layers.length - 1) g += stroke(R, ridge.filter((_, k) => k % 3 === 0), { w: 8, ink: 0.65, dry: 0.75, bristles: 7, taper: 0.15, attack: 0.02 });
    }
    const shoreY = H * between(R, 0.86, 0.9);                  // near shore with grass flicks
    g += stroke(R, wander(R, [-20 * U, shoreY], [W * between(R, 0.4, 0.55), shoreY + between(R, -20, 30) * U], 0.04, 4), { w: 12, ink: 0.8, dry: 0.6, bristles: 9, taper: 0.5 });
    for (let k = 0; k < 9; k++) g += grassBlade(R, W * between(R, 0.02, 0.4), shoreY + 6 * U, between(R, 80, 220) * U, between(R, -0.2, 0.5), 8);
    const bx = W * between(R, 0.58, 0.72), by = H * 0.8;     // a boat on the water
    g += stroke(R, [[bx - 60 * U, by], [bx, by + 10 * U], [bx + 70 * U, by - 4 * U]], { w: 12, dry: 0.3, bristles: 8, taper: 0.4 });
    g += stroke(R, [[bx + 5 * U, by - 2 * U], [bx + 8 * U, by - 50 * U]], { w: 5, dry: 0.2, bristles: 3, taper: 0.4 });
    return g;
  },

  plum(R) {
    let g = '';
    const pts = [[W * -0.02, H * between(R, 0.78, 0.88)]];   // zig-zag old branch, entering from the left
    let [x, y] = pts[0];
    for (let k = 0; k < 4; k++) { x += between(R, 260, 420) * U; y -= between(R, 120, 300) * U * (k % 2 ? 0.4 : 1.4); pts.push([x, y]); }
    const limb = [];
    for (let k = 0; k < pts.length - 1; k++) limb.push(...wander(R, pts[k], pts[k + 1], 0.1, 2).slice(k ? 1 : 0));
    g += stroke(R, limb, { w: 54, dry: 0.55, bristles: 26, taper: 0.75, attack: 0.02 });
    g += stroke(R, limb.slice(0, Math.floor(limb.length * 0.6)).map(([x, y]) => [x + 10 * U, y + 8 * U]), { w: 22, ink: 0.6, dry: 0.85, bristles: 12, taper: 0.6 });
    const blossoms = [];
    for (let k = 1; k < pts.length; k++) {                  // thin new shoots with blossoms and buds
      const p = pts[k], end = [p[0] + between(R, -80, 220) * U, p[1] - between(R, 180, 420) * U];
      const shoot = wander(R, p, end, 0.08, 2);
      g += stroke(R, shoot, { w: 7, dry: 0.3, bristles: 5, taper: 0.7 });
      for (let j = 0; j < 3; j++) blossoms.push(shoot[Math.floor(between(R, 0.2, 0.95) * (shoot.length - 1))]);
      blossoms.push(p);
    }
    for (const [bx, by] of blossoms) {
      if (R() < 0.3) { g += dot(bx, by, between(R, 7, 11)); continue; }  // bud
      const r = between(R, 34, 46) * U;
      for (let k = 0; k < 5; k++) {
        const a = (k / 5) * Math.PI * 2 + R();
        g += `<circle cx="${f(bx + Math.cos(a) * r * 0.62)}" cy="${f(by + Math.sin(a) * r * 0.62)}" r="${f(r * 0.48)}" fill="#fff" stroke="#000" stroke-width="${f(2.2 * U)}" opacity="0.8"/>`;
      }
      for (let k = 0; k < 5; k++) { const a = R() * 6.28; g += dot(bx + Math.cos(a) * r * 0.3, by + Math.sin(a) * r * 0.3, 3); }
    }
    return g;
  },
};

// ---------- render
const svg = body => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
<defs>
  <filter id="bleed" x="-5%" y="-5%" width="110%" height="110%">
    <feTurbulence type="fractalNoise" baseFrequency="${(0.035 / U).toFixed(4)}" numOctaves="2" seed="${opt.seed}" result="n"/>
    <feDisplacementMap in="SourceGraphic" in2="n" scale="${f(5 * U)}" xChannelSelector="R" yChannelSelector="G"/>
  </filter>
  <filter id="b1"><feGaussianBlur stdDeviation="${f(3 * U)}"/></filter>
  <filter id="b2"><feGaussianBlur stdDeviation="${f(10 * U)}"/></filter>
  <filter id="b3"><feGaussianBlur stdDeviation="${f(28 * U)}"/></filter>
  <linearGradient id="fade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000"/><stop offset="1" stop-color="#000" stop-opacity="0"/></linearGradient>
</defs>
<rect width="100%" height="100%" fill="#fff"/>
<g filter="url(#bleed)">${body}</g>
</svg>`;

const out = resolve(opt.out);
mkdirSync(out, { recursive: true });
// 16 evenly spaced grays (the e-ink panel's levels) for dithering.
const palette = join(out, '.palette16.png');
execFileSync('convert', ['-size', '16x1', 'gradient:black-white', '-colorspace', 'Gray', palette]);
const browser = await chromium.launch();
const pngs = [];
try {
  const page = await browser.newPage({ viewport: { width: W, height: H } });
  for (const [name, scene] of Object.entries(scenes)) {
    const R = rng(opt.seed * 1000 + name.length * 17 + name.charCodeAt(0));
    const doc = svg(scene(R));
    const base = join(out, `${name}-${opt.seed}`);
    writeFileSync(`${base}.svg`, doc);
    await page.setContent(`<html><body style="margin:0">${doc}</body></html>`);
    await page.screenshot({ path: `${base}.png`, clip: { x: 0, y: 0, width: W, height: H } });
    execFileSync('convert', [`${base}.png`, '-colorspace', 'Gray', '-dither', 'FloydSteinberg', '-remap', palette, '-type', 'Grayscale', '-depth', '8', `${base}.png`]);
    pngs.push(`${base}.png`);
  }
} finally {
  await browser.close();
}
execFileSync('convert', [...pngs, '-resize', '465x620', '-bordercolor', '#ddd', '-border', '2', '+append', join(out, `contact-${opt.seed}.png`)]);
console.log(`wrote ${pngs.length} scenes and contact-${opt.seed}.png to ${out}`);
