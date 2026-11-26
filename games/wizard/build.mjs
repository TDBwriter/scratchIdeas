// Wizard (trick-taking card game) score sheets: write-on PDF templates for Kindle Scribe / reMarkable and print.
//
//   node build.mjs            → out/wizard-score-sheets-{eink,letter,a4}.pdf + out/preview-eink.png
//
// Pages: how to play, how to use the sheets (with a worked example), then one sheet each for 3, 4, 5 and 6 players (rounds = 60 cards ÷ players: 20, 15, 12, 10), a universal
// "any player count" staircase sheet. Each round row has, per player, Bid · Won ·
// Score (running total). Dealer is pre-marked on the per-count sheets (names in seating order, first dealer first);
// the trump column has the four suits printed to circle. Σ bids lets the table see at a glance if the round is
// over- or under-bid. Requires Playwright (Chromium) and poppler (pdftoppm) for the preview.

import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync, readdirSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { resolve, join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const { chromium } = createRequire(import.meta.url)('playwright');
const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(HERE, 'out');
const FORMATS = { eink: { w: 157.5, h: 210, m: 7 }, letter: { w: 215.9, h: 279.4, m: 11 }, a4: { w: 210, h: 297, m: 11 } };
const INK = '#000', MID = '#555', LIGHT = '#9a9a9a', RULE = '#bdbdbd', ZEBRA = '#f1f1f1';

const f = n => (+n).toFixed(2);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const line = (x1, y1, x2, y2, w = 0.3, c = INK, dash = '') => `<line x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}" stroke="${c}" stroke-width="${w}"${dash ? ` stroke-dasharray="${dash}"` : ''}/>`;
const rect = (x, y, w, h, { sw = 0.3, c = INK, fill = 'none' } = {}) => `<rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" stroke="${c}" stroke-width="${sw}" fill="${fill}"/>`;
const text = (x, y, s, { size = 2.6, c = INK, anchor = 'start', weight = 500, font = 'Inter', italic = false } = {}) =>
  `<text x="${f(x)}" y="${f(y)}" font-family="${font}, 'DejaVu Sans', sans-serif" font-size="${f(size)}" font-weight="${weight}" fill="${c}" text-anchor="${anchor}"${italic ? ' font-style="italic"' : ''}>${esc(s)}</text>`;
const SUITS = [['♠', INK], ['♥', INK], ['♦', INK], ['♣', INK]];

// ---------- one score sheet
// n: number of players (3–6) or 0 for the universal staircase sheet
function sheet(F, n) {
  const { w: W, h: H, m } = F, cols = n || 6, rounds = n ? 60 / n : 20, ends = n ? Array(cols).fill(rounds) : [20, 20, 20, 15, 12, 10];
  const big = W > 180, k = big ? 1.25 : 1;                   // print editions get slightly larger type
  let s = '';
  // header
  const hy = m + 7.5 * k;
  s += text(m, hy, 'WIZARD', { size: 8 * k, weight: 800 }) + text(m + 34 * k, hy, n ? `score sheet · ${n} players · ${rounds} rounds` : 'score sheet · any number of players', { size: 3.1 * k, c: MID, weight: 600 });
  s += text(W - m, hy - 3.6 * k, 'date ______________', { size: 2.6 * k, c: MID, anchor: 'end' }) + text(W - m, hy + 0.4 * k, 'game no. ______', { size: 2.6 * k, c: MID, anchor: 'end' });
  s += text(m, hy + 5.2 * k, n ? 'Write the players in seating order, starting with the first dealer. The dealer’s Bid box is marked ◤ each round.' : 'Use one column per player, left to right. Rounds end where your last column ends. Tick ○ for the dealer.', { size: 2.35 * k, c: MID });
  // columns
  const top = hy + 8.5 * k, rc = 7.5 * k, tc = 14.5 * k, sc = 9.5 * k;
  const pw = (W - 2 * m - rc - tc - sc) / cols, bw = Math.min(7 * k, pw * 0.26), sw = pw - 2 * bw;
  const xP = i => m + rc + tc + i * pw, xS = m + rc + tc + cols * pw;
  const nameH = 9 * k, subH = 4.6 * k, finalH = 8 * k, footH = (n ? 12.5 : 15.5) * k;
  const rowH = Math.min((n ? 16 : 9) * k, (H - m - footH - finalH - top - nameH - subH) / 20 * (20 / rounds));
  const y0 = top + nameH + subH, yEnd = y0 + rounds * rowH;
  // name row
  s += rect(m, top, rc + tc, nameH + subH, { sw: 0.4 }) + text(m + (rc + tc) / 2, top + nameH * 0.62, 'players →', { size: 2.4 * k, c: MID, anchor: 'middle' });
  for (let i = 0; i < cols; i++) {
    s += rect(xP(i), top, pw, nameH, { sw: 0.5 });
    if (n && i === 0) s += text(xP(i) + 1.2, top + 2.6 * k, 'deals first', { size: 1.9 * k, c: LIGHT });
    else s += text(xP(i) + 1.2, top + 2.6 * k, `player ${i + 1}`, { size: 1.9 * k, c: LIGHT });
    s += rect(xP(i), top + nameH, pw, subH, { sw: 0.4 });
    s += text(xP(i) + bw / 2, top + nameH + subH * 0.7, 'bid', { size: 2.1 * k, c: MID, anchor: 'middle', weight: 600 }) + text(xP(i) + bw * 1.5, top + nameH + subH * 0.7, 'won', { size: 2.1 * k, c: MID, anchor: 'middle', weight: 600 }) + text(xP(i) + 2 * bw + sw / 2, top + nameH + subH * 0.7, 'score', { size: 2.1 * k, c: MID, anchor: 'middle', weight: 600 });
  }
  s += rect(xS, top, sc, nameH + subH, { sw: 0.4 }) + text(xS + sc / 2, top + nameH * 0.55, 'Σ', { size: 3.4 * k, anchor: 'middle', weight: 700 }) + text(xS + sc / 2, top + nameH + subH * 0.7, 'bids', { size: 2.1 * k, c: MID, anchor: 'middle', weight: 600 });
  // round rows
  for (let r = 1; r <= rounds; r++) {
    const y = y0 + (r - 1) * rowH, live = ends.map(e => r <= e);
    if (r % 2 === 0) s += `<rect x="${f(m)}" y="${f(y)}" width="${f(rc + tc + (live.lastIndexOf(true) + 1) * pw)}" height="${f(rowH)}" fill="${ZEBRA}"/>` + `<rect x="${f(xS)}" y="${f(y)}" width="${f(sc)}" height="${f(rowH)}" fill="${ZEBRA}"/>`;
    s += rect(m, y, rc, rowH, { sw: 0.4 }) + text(m + rc / 2, y + rowH / 2 + 1.3 * k, String(r), { size: 3.6 * k, anchor: 'middle', weight: 800 });
    s += text(m + rc / 2, y + rowH - 0.8, `${r} card${r > 1 ? 's' : ''}`, { size: 1.45 * k, c: LIGHT, anchor: 'middle' }).replace(/<text /, rowH > 9 ? '<text ' : '<text opacity="0" ');
    // trump: last round has no trump (every card is dealt)
    s += rect(m + rc, y, tc, rowH, { sw: 0.3 });
    if (r === rounds && n) s += text(m + rc + tc / 2, y + rowH / 2 + 0.9, 'no trump', { size: 2.2 * k, c: MID, anchor: 'middle', italic: true });
    else {
      const sy = y + rowH / 2 + 1.1 * k, step = (tc - 2) / 5;
      SUITS.forEach(([g], j) => { s += text(m + rc + 1 + step * (j + 0.5), sy, g, { size: 2.9 * k, c: MID, anchor: 'middle', font: 'DejaVu Sans' }); });
      s += text(m + rc + 1 + step * 4.5, sy - 0.2, '–', { size: 2.9 * k, c: MID, anchor: 'middle' });
    }
    for (let i = 0; i < cols; i++) {
      const x = xP(i);
      if (!live[i]) continue;
      s += rect(x, y, bw, rowH, { sw: 0.25, c: MID }) + rect(x + bw, y, bw, rowH, { sw: 0.25, c: MID }) + rect(x + 2 * bw, y, sw, rowH, { sw: 0.25, c: MID });
      if (n && (r - 1) % n === i) s += `<path d="M${f(x)} ${f(y)} L${f(x + 2.6 * k)} ${f(y)} L${f(x)} ${f(y + 2.6 * k)} Z" fill="${INK}"/>`;
      if (!n) s += `<circle cx="${f(x + bw - 1.3 * k)}" cy="${f(y + 1.4 * k)}" r="${f(0.8 * k)}" fill="#fff" stroke="${MID}" stroke-width="0.25"/>`;
    }
    s += rect(xS, y, sc, rowH, { sw: 0.3 }) + text(xS + sc - 0.8, y + rowH - 0.9, `/ ${r}`, { size: 1.9 * k, c: LIGHT, anchor: 'end' });
    // staircase: mark the last round for player counts whose column ends here
    if (!n) ends.forEach((e, i) => { if (e === r && i >= 3) s += text(xP(i) + pw / 2, y + rowH + 2.6 * k, `${i + 1} players: last round`, { size: 1.9 * k, c: MID, anchor: 'middle', italic: true }); });
  }
  // player column outlines (thick) to keep each player's cells together
  for (let i = 0; i < cols; i++) s += rect(xP(i), y0, pw, ends[i] * rowH, { sw: 0.55 });
  s += rect(m, y0, rc + tc, rounds * rowH, { sw: 0.55 }) + rect(xS, y0, sc, rounds * rowH, { sw: 0.55 });
  // final place row
  const fy = n ? yEnd + 1.5 : y0 + 20 * rowH + 1.5;
  s += rect(m, fy, rc + tc, finalH, { sw: 0.5 }) + text(m + (rc + tc) / 2, fy + finalH / 2 + 1, 'place', { size: 2.8 * k, anchor: 'middle', weight: 700 });
  for (let i = 0; i < cols; i++) s += rect(xP(i), fy, pw, finalH, { sw: 0.5 }) + text(xP(i) + 1, fy + 2.4 * k, 'final total / place', { size: 1.7 * k, c: LIGHT });
  // footer legend
  const ly = fy + finalH + 4.2 * k, L = (y, t) => text(m, y, t, { size: 2.3 * k, c: MID });
  s += L(ly, 'Score: made your bid exactly → 20 + 10 per trick won.  Missed it → −10 per trick over or under.  Write the running total.');
  s += L(ly + 3.4 * k, 'Trump: circle the suit turned up. Wizard turned up → dealer picks (circle it, add W). Jester or no cards left → circle –.');
  s += L(ly + 6.8 * k, `Σ bids: add the bids. Bigger than ${n ? 'the round number' : 'the round number'} → overbid; smaller → underbid. Either way, someone misses.`);
  if (!n) s += L(ly + 10.2 * k, 'Rounds: 3 players 20 · 4 players 15 · 5 players 12 · 6 players 10 — the game ends where the last column ends.');
  return s;
}

// ---------- rules and scoring card
function rulesPage(F) {
  const { w: W, m } = F, k = W > 180 ? 1.25 : 1;
  let s = '', y = m + 8 * k;
  s += text(m, y, 'WIZARD', { size: 8 * k, weight: 800 }) + text(m + 34 * k, y, 'how to play', { size: 3.1 * k, c: MID, weight: 600 });
  const H2 = t => { y += 7.6 * k; s += text(m, y, t.toUpperCase(), { size: 2.7 * k, weight: 700, font: 'JetBrains Mono' }) + line(m, y + 1.2, W - m, y + 1.2, 0.35); y += 1.5 * k; };
  const size = 2.75 * k, maxCh = Math.floor((W - 2 * m) / (size * 0.53));
  const P = t => { const words = t.split(' '); let cur = ''; const lines = [];
    for (const w of words) { if ((cur + ' ' + w).trim().length > maxCh) { lines.push(cur); cur = w; } else cur = (cur + ' ' + w).trim(); }
    if (cur) lines.push(cur);
    lines.forEach((l, i) => { y += i ? 3.8 * k : 4.6 * k; s += text(m, y, l, { size }); }); };
  H2('Rounds');
  P('Round 1 deals 1 card each, round 2 deals 2, and so on. The game ends when the deck runs out:');
  y += 3 * k;
  const tw = (W - 2 * m) / 4;
  [['3 players', '20 rounds'], ['4 players', '15 rounds'], ['5 players', '12 rounds'], ['6 players', '10 rounds']].forEach(([a, b], i) => {
    s += rect(m + i * tw, y, tw - 2, 12 * k, { sw: 0.4 }) + text(m + i * tw + (tw - 2) / 2, y + 5 * k, a, { size: 2.8 * k, anchor: 'middle', weight: 700 }) + text(m + i * tw + (tw - 2) / 2, y + 9.5 * k, b, { size: 2.6 * k, anchor: 'middle', c: MID });
  });
  y += 12 * k;
  H2('Trump');
  P('After dealing, turn up the next card: its suit is trump for the round.');
  P('A Wizard turned up: the dealer chooses trump.   A Jester turned up: no trump.');
  P('In the last round every card is dealt, so there is no trump.');
  H2('Bidding');
  P('Starting left of the dealer, each player bids the exact number of tricks they expect to win.');
  P('Add the bids: if the total differs from the number of tricks, at least one player must miss.');
  H2('Scoring each round');
  y += 3 * k;
  const rows = [['Bid made exactly', '20 points + 10 per trick won', 'bid 2, won 2 → 40'], ['Bid of zero made', '20 points', 'bid 0, won 0 → 20'], ['Bid missed', '−10 per trick over or under', 'bid 3, won 1 → −20']];
  const cw = [(W - 2 * m) * 0.28, (W - 2 * m) * 0.4, (W - 2 * m) * 0.32];
  rows.forEach((rw, i) => {
    let x = m; const ry = y + i * 8 * k;
    rw.forEach((c, j) => { s += rect(x, ry, cw[j], 8 * k, { sw: 0.35 }) + text(x + 1.5, ry + 5.2 * k, c, { size: 2.6 * k, weight: j ? 500 : 700, c: j === 2 ? MID : INK }); x += cw[j]; });
  });
  y += rows.length * 8 * k;
  H2('Playing a trick');
  P('The first card led sets the suit; follow suit if you can. Wizards and Jesters can be played at any time.');
  P('A trick is won by the first Wizard played; otherwise the highest trump; otherwise the highest card of the suit led.');
  P('Jesters always lose, unless every card in the trick is a Jester — then the first one played wins.');
  P('If a Wizard is led, anything may follow. If a Jester is led, the next normal card played sets the suit.');
  P('The winner of a trick leads the next one.');
  return s;
}

// ---------- how to fill in a sheet, with a worked example
function howToUsePage(F) {
  const { w: W, m } = F, k = W > 180 ? 1.25 : 1, CW = W - 2 * m;
  let s = '', y = m + 8 * k;
  s += text(m, y, 'WIZARD', { size: 8 * k, weight: 800 }) + text(m + 34 * k, y, 'how to use these sheets', { size: 3.1 * k, c: MID, weight: 600 });
  const H2 = t => { y += 7.6 * k; s += text(m, y, t.toUpperCase(), { size: 2.7 * k, weight: 700, font: 'JetBrains Mono' }) + line(m, y + 1.2, W - m, y + 1.2, 0.35); y += 1.5 * k; };
  const size = 2.75 * k, maxCh = Math.floor((CW - 6 * k) / (size * 0.53));
  const step = (n, t) => { const words = t.split(' '); let cur = ''; const lines = [];
    for (const w of words) { if ((cur + ' ' + w).trim().length > maxCh) { lines.push(cur); cur = w; } else cur = (cur + ' ' + w).trim(); }
    if (cur) lines.push(cur);
    lines.forEach((l, i) => { y += i ? 3.8 * k : 4.8 * k; if (!i) s += text(m, y, String(n), { size: 3 * k, weight: 800 }); s += text(m + 6 * k, y, l, { size }); }); };
  H2('Before you start');
  step(1, 'Pick the sheet for your number of players: 3, 4, 5 or 6. The any-number sheet works for every count; tick ○ for the dealer there.');
  step(2, 'Write the players across the top in seating order, starting with whoever deals first. The ◤ in a bid box then shows who deals each round.');
  step(3, 'On a Kindle Scribe or reMarkable, duplicate the page first so you keep a blank copy.');
  H2('Every round');
  step(1, 'Deal, turn up the next card and circle its suit in the trump column. If it is a Wizard, the dealer picks a suit: circle it and write W. A Jester means no trump: circle –.');
  step(2, 'Everyone bids. Write each bid, then add them up in Σ bids.');
  step(3, 'Play the tricks, then write how many each player won.');
  step(4, 'Score it: made the bid exactly → 20 + 10 per trick; missed it → −10 per trick over or under. Add it to the score above and write the new total.');

  // worked example: three players, rounds 1–3
  H2('Example: Ana, Ben and Cy, rounds 1 to 3');
  const top = y + 13 * k, rc = 8 * k, tc = 15 * k, sc = 10 * k, pw = (CW - rc - tc - sc) / 3, bw = 7 * k, sw = pw - 2 * bw;
  const nameH = 8 * k, subH = 4.6 * k, rowH = 9 * k, y0 = top + nameH + subH;
  const xP = i => m + rc + tc + i * pw, xS = m + rc + tc + 3 * pw, tstep = (tc - 2) / 5, sx = j => m + rc + 1 + tstep * (j + 0.5);
  const hand = (x, yy, t, a = 'middle') => `<text x="${f(x)}" y="${f(yy)}" font-family="Caveat, cursive" font-size="${f(6 * k)}" fill="#1a1a1a" text-anchor="${a}">${esc(t)}</text>`;
  const names = ['Ana', 'Ben', 'Cy'], trump = [1, 0, 2], bids = [[0, 1, 0], [1, 0, 0], [2, 1, 1]], won = [[0, 1, 0], [1, 1, 0], [1, 1, 1]], score = [[20, 30, 20], [50, 20, 40], [40, 50, 70]];
  s += rect(m, top, rc + tc, nameH + subH, { sw: 0.4 }) + text(m + (rc + tc) / 2, top + nameH * 0.62, 'players →', { size: 2.3 * k, c: MID, anchor: 'middle' });
  for (let i = 0; i < 3; i++) {
    s += rect(xP(i), top, pw, nameH, { sw: 0.5 }) + hand(xP(i) + pw / 2, top + nameH - 1.6 * k, names[i]) + rect(xP(i), top + nameH, pw, subH, { sw: 0.4 });
    [['bid', bw / 2], ['won', bw * 1.5], ['score', 2 * bw + sw / 2]].forEach(([t, dx]) => { s += text(xP(i) + dx, top + nameH + subH * 0.7, t, { size: 2.1 * k, c: MID, anchor: 'middle', weight: 600 }); });
  }
  s += rect(xS, top, sc, nameH + subH, { sw: 0.4 }) + text(xS + sc / 2, top + nameH * 0.62, 'Σ', { size: 3.4 * k, anchor: 'middle', weight: 700 }) + text(xS + sc / 2, top + nameH + subH * 0.7, 'bids', { size: 2.1 * k, c: MID, anchor: 'middle', weight: 600 });
  for (let r = 0; r < 3; r++) {
    const yy = y0 + r * rowH, mid = yy + rowH / 2;
    s += rect(m, yy, rc, rowH, { sw: 0.4 }) + text(m + rc / 2, mid + 1.3 * k, String(r + 1), { size: 3.6 * k, anchor: 'middle', weight: 800 }) + rect(m + rc, yy, tc, rowH, { sw: 0.3 });
    SUITS.forEach(([g], j) => { s += text(sx(j), mid + 1.1 * k, g, { size: 2.9 * k, c: MID, anchor: 'middle', font: 'DejaVu Sans' }); });
    s += text(sx(4), mid + 0.9 * k, '–', { size: 2.9 * k, c: MID, anchor: 'middle' });
    s += `<ellipse cx="${f(sx(trump[r]))}" cy="${f(mid)}" rx="${f(1.9 * k)}" ry="${f(2.3 * k)}" fill="none" stroke="#1a1a1a" stroke-width="0.35"/>`;
    if (r === 2) s += hand(sx(trump[r]) + 2.6 * k, yy + 3.4 * k, 'W', 'start').replace(`font-size="${f(6 * k)}"`, `font-size="${f(3.8 * k)}"`);
    for (let i = 0; i < 3; i++) {
      const x = xP(i);
      s += rect(x, yy, bw, rowH, { sw: 0.25, c: MID }) + rect(x + bw, yy, bw, rowH, { sw: 0.25, c: MID }) + rect(x + 2 * bw, yy, sw, rowH, { sw: 0.25, c: MID });
      if (r === i) s += `<path d="M${f(x)} ${f(yy)} L${f(x + 2.6 * k)} ${f(yy)} L${f(x)} ${f(yy + 2.6 * k)} Z" fill="${INK}"/>`;
      s += hand(x + bw / 2, mid + 2 * k, String(bids[r][i])) + hand(x + bw * 1.5, mid + 2 * k, String(won[r][i])) + hand(x + 2 * bw + sw / 2, mid + 2 * k, String(score[r][i]));
    }
    s += rect(xS, yy, sc, rowH, { sw: 0.3 }) + text(xS + sc - 0.8, yy + rowH - 0.9, `/ ${r + 1}`, { size: 1.9 * k, c: LIGHT, anchor: 'end' }) + hand(xS + sc * 0.38, mid + 2 * k, String(bids[r].reduce((a, b) => a + b, 0)));
  }
  for (let i = 0; i < 3; i++) s += rect(xP(i), y0, pw, 3 * rowH, { sw: 0.55 });
  s += rect(m, y0, rc + tc, 3 * rowH, { sw: 0.55 }) + rect(xS, y0, sc, 3 * rowH, { sw: 0.55 });
  // callouts above the table
  const call = (x1, y1, x2, y2, t, a = 'middle') => line(x1, y1, x2, y2, 0.3, MID) + `<circle cx="${f(x2)}" cy="${f(y2)}" r="0.55" fill="${INK}"/>` + text(x1, y1 - 1.2, t, { size: 2.2 * k, anchor: a, weight: 600 });
  const ya = top - 2.5 * k;
  s += call(m + rc + tc / 2, ya - 5 * k, m + rc + tc / 2, top + 1, 'circle trump') + call(xP(0) + bw / 2, ya, xP(0) + bw / 2, top + nameH + 1, 'bid') + call(xP(0) + bw * 1.5 + 3 * k, ya - 5 * k, xP(0) + bw * 1.5, top + nameH + 1, 'tricks won', 'start');
  s += call(xP(1) + 2 * bw + sw / 2, ya, xP(1) + 2 * bw + sw / 2, top + nameH + 1, 'running total') + call(xS + sc / 2, ya - 5 * k, xS + sc / 2, top + 1, 'add the bids', 'end');
  // notes below the table
  const yb = y0 + 3 * rowH;
  const notes = [
    [m - 3.4 * k, y0 + rowH / 2 + 3 * k, 'Round 1: Ana deals — her bid box has the ◤. One card each, so one trick: Ben bids 1 and wins it (+30); Ana and Cy bid 0 and win 0 (+20 each).'],
    [m - 3.4 * k, y0 + 2 * rowH + rowH / 2 + 3 * k, 'Round 3: a Wizard was turned up, so Cy (the dealer) chose ♦ — circled, with W.'],
    [xP(0) + 2 * bw + sw / 2 - 1.9 * k, yb + 5 * k, 'Ana bid 2 but won 1: −10, so her total drops from 50 to 40.'],
    [W - m + 1.5 * k, y0 + 2 * rowH + rowH / 2 + 3 * k, 'Σ 4 / 3: four tricks bid, only three to win — overbid, so someone had to miss. In round 2, 1 / 2 was underbid.'],
  ];
  y = yb + 5 * k;
  const nmax = Math.floor((CW - 8 * k) / (2.55 * k * 0.53));
  notes.forEach(([px, py, t], i) => {
    const words = t.split(' '); let cur = ''; const lines = [];
    for (const w of words) { if ((cur + ' ' + w).trim().length > nmax) { lines.push(cur); cur = w; } else cur = (cur + ' ' + w).trim(); }
    if (cur) lines.push(cur);
    y += 4.4 * k;
    s += `<circle cx="${f(m + 2 * k)}" cy="${f(y - 1 * k)}" r="${f(1.9 * k)}" fill="${INK}"/>` + text(m + 2 * k, y - 0.2 * k, String.fromCharCode(65 + i), { size: 2.4 * k, anchor: 'middle', weight: 800, c: '#fff' });
    s += `<circle cx="${f(px + 1.9 * k)}" cy="${f(py - 3 * k)}" r="${f(1.6 * k)}" fill="${INK}"/>` + text(px + 1.9 * k, py - 2.25 * k, String.fromCharCode(65 + i), { size: 2.1 * k, anchor: 'middle', weight: 800, c: '#fff' });
    lines.forEach((l, j) => { if (j) y += 3.6 * k; s += text(m + 6 * k, y, l, { size: 2.55 * k }); });
  });
  H2('At the end');
  step('✓', 'The score in each player’s last row is their final total. Write places in the bottom row — highest total wins.');
  return s;
}

// ---------- render
mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  for (const [name, F] of Object.entries(FORMATS)) {
    const pages = [rulesPage(F), howToUsePage(F), ...[3, 4, 5, 6, 0].map(n => sheet(F, n))];
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>Wizard score sheets</title><style>@font-face { font-family: 'Caveat'; src: url('${pathToFileURL(resolve(HERE, '../../sketchArt/fonts/caveat-latin-400-normal.woff2')).href}') format('woff2'); } @page { size: ${F.w}mm ${F.h}mm; margin: 0; } * { margin: 0; padding: 0; } body { background: #fff; } svg { display: block; break-after: page; }</style></head><body>${pages.map(p => `<svg xmlns="http://www.w3.org/2000/svg" width="${F.w}mm" height="${F.h}mm" viewBox="0 0 ${F.w} ${F.h}">${p}</svg>`).join('')}</body></html>`;
    const htmlPath = join(OUT, `wizard-${name}.html`), pdf = join(OUT, `wizard-score-sheets-${name}.pdf`);
    writeFileSync(htmlPath, html);
    await page.goto(pathToFileURL(htmlPath).href, { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    await page.pdf({ path: pdf, width: `${F.w}mm`, height: `${F.h}mm`, printBackground: true });
    rmSync(htmlPath);
    console.log(`wrote ${pdf}`);
  }
  const tmp = join(OUT, 'tmp'); rmSync(tmp, { recursive: true, force: true }); mkdirSync(tmp);
  execFileSync('pdftoppm', ['-r', '70', '-png', join(OUT, 'wizard-score-sheets-eink.pdf'), join(tmp, 'p')]);
  const files = readdirSync(tmp).sort().map(x => join(tmp, x));
  execFileSync('montage', [...files, '-tile', '4x', '-geometry', '+6+6', '-background', '#ccc', join(OUT, 'preview-eink.png')]);
  rmSync(tmp, { recursive: true, force: true });
  console.log('wrote out/preview-eink.png');
} finally {
  await browser.close();
}
