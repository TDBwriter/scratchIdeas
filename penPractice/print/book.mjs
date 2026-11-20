// Clear & Quick Print: the book module the shared builder (../hand/build.mjs) loads.
// Content lives in lessons.mjs, the letters in strokes.mjs; this file adds the diagrams and the front/back matter.
import { glyph, GAP } from './strokes.mjs';
import { hand } from './hand.mjs';
import { book, parts, lessons, talk } from './lessons.mjs';
import { AW, RULE, TRACE, f, esc, svg, ln, rect, txt, arrowHead, lbl, writeText, textW, wrap, drawGlyph, rules, rowH, exSvg, legend, noteSvg } from '../hand/lib.mjs';

export { book, parts, lessons, talk, hand };
export const meta = { out: 'print', base: 'clear-quick-print', seeds: [41, 42], preview: ['P1.1', 'P1.3-again', 'P1.5-use', 'P2.3', 'P3.2', 'P4.1'] };

export const WARM = [
  ['tall pulls', { w: 0.1, strokes: [[[0, 0], [0, 1]]] }], ['short pulls', { w: 0.1, strokes: [[[0, 0.5], [0, 1]]] }],
  ['slants', { w: 0.32, strokes: [[[0.32, 0], [0, 1]]] }], ['slants', { w: 0.32, strokes: [[[0, 0], [0.32, 1]]] }],
  ['points', 'v'], ['rounds', 'c'], ['circles', 'o'], ['humps', 'n'], ['cups', 'u'],
];
export const models = [
  { label: 'A list', note: 'copy it in the right-hand column', lines: ['2 lemons', 'rice', 'dish soap', 'stamps'] },
  { label: 'A message', lines: ['Sam called at 3:15.', 'The car is ready -', 'call 0181 555 0123.'] },
  { label: 'A form', form: [['NAME', 'SAM LEE'], ['DATE', '12/05/2027']] },
];

// ---------- instruction-page diagrams (w × h mm)
export const D = {
  setup(w, h) {
    const C = Math.min(22, (h - 8) / 1.45), y0 = 3, lw = w * 0.6;
    let s = rules(0, lw, y0, C, 'four') + writeText('Hhxg', 3, y0, C, 'ink').s;
    [['top line', 0], ['dashed middle line', 0.5], ['baseline', 1], ['descender line', 1.45]].forEach(([t, v]) => { s += lbl(lw - 1, y0 + v * C - 0.8, t, 'end', 2.2); });
    const rx = lw + (w - lw) / 2;
    return s + tilt(rx - 10, h, -20, 'right hand') + tilt(rx + 11, h, 20, 'left hand');
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
      if (o) for (let i = 1; i < W.items.length; i++) { const a = W.items[i - 1], b = W.items[i]; const gap = b.x - (a.x + a.w * C); if (gap > C * 0.4) s += `<ellipse cx="${f(34 + a.x + a.w * C + gap / 2)}" cy="${f(y + C * 0.75)}" rx="${f(C * 0.2)}" ry="${f(C * 0.22)}" fill="none" stroke="${TRACE}" stroke-width="0.35" stroke-dasharray="0.8 0.6"/>`; }
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
    return confusionGrid(items, w, h);
  },
  compare(w, h) { return compareSheets(w, h, 'The quick'); },
};
// pieces other books reuse
export function tilt(cx, h, deg, name) {
  const pw = 15, ph = 20;
  let g = rect(-pw / 2, -ph / 2, pw, ph, { w: 0.4, fill: '#fff' });
  for (let k = 1; k < 6; k++) g += ln(-pw / 2 + 1.5, -ph / 2 + k * 3.2, pw / 2 - 1.5, -ph / 2 + k * 3.2, { c: RULE, w: 0.2 });
  return `<g transform="translate(${f(cx)} ${f(h * 0.44)}) rotate(${deg})">${g}</g>` + lbl(cx, h - 3, name, 'middle', 2.2);
}
export function confusionGrid(items, w, h, o = {}) {
  const cw = w / 3, C = Math.min(9, (h - 8) / 2 / 1.65);
  let s = '';
  items.forEach(([p, note], i) => {
    const cx = (i % 3) * cw, y = 2 + Math.floor(i / 3) * (h / 2);
    s += rules(cx + 2, cw - 4, y, C, 'four') + writeText(p, cx + 4, y, C, 'ink', { wordGap: 0.6, ...o }).s + lbl(cx + 3, y + C * 1.45 + 3.4, note, 'start', 2.1);
  });
  return s;
}
export function compareSheets(w, h, sample) {
  const pw = 26, ph = 34, y = 4;
  const sheetIcon = (x, name) => {
    let g = rect(x, y, pw, ph, { w: 0.4, fill: '#fff' });
    for (let k = 0; k < 6; k++) g += ln(x + 3, y + 7 + k * 4.4, x + pw - 3, y + 7 + k * 4.4, { c: RULE, w: 0.25 });
    g += writeText(sample, x + 3, y + 2.2, 3.2, 'ink').s;
    return g + lbl(x + pw / 2, y + ph + 4.5, name, 'middle', 2.4);
  };
  const xa = w / 2 - pw - 14, xb = w / 2 + 14;
  let s = sheetIcon(xa, 'day one') + sheetIcon(xb, 'today');
  s += ln(xa + pw + 3, y + ph / 2 - 2, xb - 3, y + ph / 2 - 2, { w: 0.4 }) + arrowHead(xb - 3, y + ph / 2 - 2, 0) + ln(xb - 3, y + ph / 2 + 2, xa + pw + 3, y + ph / 2 + 2, { w: 0.4 }) + arrowHead(xa + pw + 3, y + ph / 2 + 2, Math.PI);
  s += lbl(w / 2, y + ph / 2 + 8, 'side by side', 'middle', 2.2);
  return s;
}

// ---------- front and back matter
export const pages = {
  cover() {
    const fade = svg(AW, rowH(10, 'four') + 4, rules(0, AW, 1.4, 10, 'four') + [0, 1].map(i => drawGlyph('a', 3 + i * 9, 1.4, 10, 'ghost')).join('') + [2, 3].map(i => drawGlyph('a', 3 + i * 9, 1.4, 10, 'dots')).join('') + writeText('a', 3 + 4 * 9, 1.4, 10, 'ink').s + lbl(10.5, rowH(10, 'four') + 2.5, 'trace', 'middle') + lbl(28.5, rowH(10, 'four') + 2.5, 'dots', 'middle') + lbl(41, rowH(10, 'four') + 2.5, 'free →', 'start'));
    return `<div class="cv-series">${esc(book.series)}</div><div class="cv-title">${esc(book.title)}</div><div class="cv-sub">${esc(book.subtitle)}</div>
    <div class="cv-ex">${exSvg('AaGg', AW, 50, 28)}</div>
    <div class="cv-model">${noteSvg(wrap(book.sentence, 8, AW - 6), 8)}</div><div class="cv-fade">${fade}</div>
    <div class="cv-meta">23 lessons · capitals → lowercase → spacing → speed</div><div class="cv-dev">For Kindle Scribe, reMarkable, pen tablets and loose-leaf print — write directly on the pages</div>`;
  },
  how() {
    return `<div class="h-title">How this book works</div>
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
  },
  about() {
    return `<div class="h-title">About this book</div><p>Every letter in this book is drawn from one stroke model made for it: simple, unjoined, school-neutral print with a single-storey a and g. The stroke numbers, arrows, trace letters and start dots all come from the same pen paths, so they always agree.</p><p>The pencil sketches are original drawings generated for the Pen Practice series; nothing is copied from other books or courses. Typefaces: Inter and JetBrains Mono (SIL Open Font License).</p><p>Pages are sized to the Kindle Scribe screen (157.5 × 210 mm) and the reMarkable 2. Every lesson is one sheet — instructions on the front, practice on the back — so it works as loose leaf printed double-sided, or page by page on an e-reader. Print editions on Letter and A4 keep the same real sizes.</p><p class="small">${esc(book.series)} · ${esc(book.title)} · e-ink edition</p>`;
  },
  backcover(img) {
    return `<div class="bc-in"><div class="cv-series">${esc(book.series)}</div><div class="bc-title">${esc(book.title)}</div>${img('diner', 42, AW)}<div class="plate-note">${noteSvg(['Want more practice?', 'Print any sheet again.'])}</div><div class="bc-note">Every sheet stands on its own.</div></div>`;
  },
};
