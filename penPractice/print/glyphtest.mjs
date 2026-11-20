// Renders every glyph with numbered stroke starts and direction arrows, for checking the stroke model.
//   node glyphtest.mjs out.png
import { createRequire } from 'node:module';
import { glyph } from './strokes.mjs';
const { chromium } = createRequire(import.meta.url)('playwright');

const rows = ['ABCDEFGHIJKLM', 'NOPQRSTUVWXYZ', '0123456789', 'abcdefghijklm', 'nopqrstuvwxyz', ".,'?!-/:$"];
const S = 60, padX = 30, rowH = 140;
let svg = '';
rows.forEach((row, r) => {
  const base = 40 + r * rowH + S;
  svg += [0, 0.5, 1, 1.45].map((v, i) => `<line x1="0" x2="1200" y1="${base - S + v * S}" y2="${base - S + v * S}" stroke="${i === 2 ? '#000' : '#bbb'}" stroke-dasharray="${i === 1 ? '6 4' : ''}"/>`).join('');
  let x = padX;
  for (const ch of row) {
    const g = glyph(ch);
    g.strokes.forEach((st, k) => {
      const P = st.map(([u, v]) => [x + u * S, base - S + v * S]);
      if (P.length === 1) svg += `<circle cx="${P[0][0]}" cy="${P[0][1]}" r="3.5" fill="#000"/>`;
      else svg += `<path d="M${P.map(p => p.join(' ')).join(' L')}" stroke="#000" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
      svg += `<circle cx="${P[0][0]}" cy="${P[0][1]}" r="5" fill="#fff" stroke="#c00" stroke-width="2"/><text x="${P[0][0] + 6}" y="${P[0][1] - 5}" font-size="12" fill="#c00">${k + 1}</text>`;
      if (P.length > 2) { const i = Math.floor(P.length / 3), a = P[i], b = P[i + 1]; const ang = Math.atan2(b[1] - a[1], b[0] - a[0]); svg += `<path d="M${b[0] - Math.cos(ang - 0.5) * 9} ${b[1] - Math.sin(ang - 0.5) * 9} L${b[0]} ${b[1]} L${b[0] - Math.cos(ang + 0.5) * 9} ${b[1] - Math.sin(ang + 0.5) * 9}" stroke="#c00" stroke-width="2" fill="none"/>`; }
      else if (P.length === 2) { const [a, b] = P, ang = Math.atan2(b[1] - a[1], b[0] - a[0]), m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]; svg += `<path d="M${m[0] - Math.cos(ang - 0.5) * 9} ${m[1] - Math.sin(ang - 0.5) * 9} L${m[0]} ${m[1]} L${m[0] - Math.cos(ang + 0.5) * 9} ${m[1] - Math.sin(ang + 0.5) * 9}" stroke="#c00" stroke-width="2" fill="none"/>`; }
    });
    x += (g.w + 0.4) * S;
  }
});
const html = `<html><body style="margin:0;background:#fff"><svg xmlns="http://www.w3.org/2000/svg" width="1200" height="${40 + rows.length * rowH}">${svg}</svg></body></html>`;
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1200, height: 40 + rows.length * rowH } });
await p.setContent(html);
await p.screenshot({ path: process.argv[2] || 'glyphs.png' });
await b.close();
