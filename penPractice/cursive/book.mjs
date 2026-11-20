// Join It Up (cursive): the book module the shared builder (../hand/build.mjs) loads.
import { hand } from './hand.mjs';
import { book, parts, lessons, talk } from './lessons.mjs';
import { D as printD, tilt, confusionGrid } from '../print/book.mjs';
import { AW, BODY, INK, f, esc, svg, ln, pd, path, dotc, lbl, arrowHead, writeText, drawStrokes, textW, wrap, drawGlyph, rules, rowH, legend, noteSvg, trimPath, plen, HAND } from '../hand/lib.mjs';

export { book, parts, lessons, talk, hand };
export const meta = { out: 'cursive', base: 'join-it-up', seeds: [43, 44], tocSplit: 3, preview: ['C1.1', 'C1.4', 'C2.2', 'C3.1-again', 'C4.1', 'C1.6-use'] };

export const WARM = [['undercurves', 'uuuu'], ['overcurves', 'nnnn'], ['loops', 'llll'], ['small loops', 'eeee'], ['ovals', 'aaaa'], ['high joins', 'oooo'], ['humps', 'mmm'], ['slants', 'iiii']];
export const tasks = {
  letters: 'Each row: trace two, follow the dots for two, then on your own. Dots and crosses last.',
  warmups: 'Each row: trace, follow the dots, then keep the pattern going — pen down the whole way.',
  wordRows: 'Trace each word, follow the dotted one, then write it again — one movement per word.',
  sentenceRows: 'Trace the sentence, then write it on the line below. Keep the slant steady.',
  sentenceRowsRepeat: 'Follow the dotted sentence, then write it again below at the same steady beat.',
};

// big words in the light exemplar style, with the joins (or any part) picked out in black with an arrow
function demoWords(words, w, h, { highlight = 'join', maxC = 17 } = {}) {
  const cw = w / words.length;
  let C = Math.min(maxC, (h - 9) / 1.5);
  for (const t of words) C = Math.min(C, (cw - 8) / (textW(t, 1)));
  let s = '';
  words.forEach((t, k) => {
    const L = HAND.layout(t, C), x0 = k * cw + (cw - L.w) / 2, y0 = Math.max(3, (h - C * 1.45) / 2);
    s += rules(k * cw + 2, cw - 4, y0, C, 'four');
    for (const it of L.items) for (const st of it.strokes) {
      const P = st.map(([u, v]) => [x0 + it.x + u * C, y0 + v * C]);
      s += P.length === 1 ? dotc(P[0][0], P[0][1], C * 0.07, BODY) : path(pd(P), { c: BODY, w: Math.max(0.9, C * 0.11) });
    }
    for (const it of L.items) {
      const P = it.strokes[0].map(([u, v]) => [x0 + it.x + u * C, y0 + v * C]);
      let Q = null;
      if (highlight === 'join' && it.join) Q = P.slice(0, it.join + 1);
      if (highlight === 'all') Q = P;
      if (Q && Q.length > 1) { const a = Q.at(-2), b = Q.at(-1); s += path(pd(Q), { w: 0.75 }) + arrowHead(b[0], b[1], Math.atan2(b[1] - a[1], b[0] - a[0]), 1.6, INK, 0.5); }
    }
  });
  return s;
}

export const D = {
  setup(w, h) {
    const lw = w * 0.62, C = Math.min(17, (h - 8) / 1.5, (lw - 8) / textW('loop', 1)), y0 = 3;
    let s = rules(0, lw, y0, C, 'four') + writeText('loop', 4, y0, C, 'ink').s + lbl(lw - 1, y0 + 1.45 * C - 1, 'slant guides', 'end', 2.2);
    const rx = lw + (w - lw) / 2;
    return s + tilt(rx - 10, h, -30, 'right hand') + tilt(rx + 11, h, 30, 'left hand');
  },
  lpm: printD.lpm,
  review(w, h) {
    const rs = ['a b c d e f g h i j k l m', 'n o p q r s t u v w x y z'];
    const C = Math.min(10, (h - 6) / (rs.length * 1.55), ...rs.map(t => (w - 10) / textW(t, 1, { wordGap: 0.22 })));
    let s = '', y = 2;
    for (const t of rs) { s += rules(2, w - 4, y, C, 'four') + writeText(t, 5, y, C, 'ink', { wordGap: 0.22 }).s; y += C * 1.55; }
    return s;
  },
  joinsLow(w, h) { return demoWords(['an', 'it', 'ad', 'up'], w, h - 6) + lbl(w / 2, h - 2, 'the join is the next letter’s lead-in', 'middle', 2.2); },
  joinsHigh(w, h) { return demoWords(['on', 'br', 'vi', 'wa'], w, h - 6) + lbl(w / 2, h - 2, 'after b, o, v and w the join leaves high', 'middle', 2.2); },
  tricky(w, h) { return demoWords(['oa', 'br', 'ss', 'os'], w, h - 6) + lbl(w / 2, h - 2, 'keep both letters visible', 'middle', 2.2); },
  dotsLast(w, h) {
    const C = Math.min(17, (h - 10) / 1.5, (w - 20) / textW('little', 1)), L = HAND.layout('little', C), x0 = (w - L.w) / 2, y0 = 5;
    let s = rules(4, w - 8, y0, C, 'four'), n = 1;
    for (const it of L.items) it.strokes.forEach((st, k) => {
      const P = st.map(([u, v]) => [x0 + it.x + u * C, y0 + v * C]);
      s += path(pd(P), { c: k ? INK : BODY, w: k ? 0.7 : Math.max(0.9, C * 0.11) });
    });
    const first = L.items[0].strokes[0].map(([u, v]) => [x0 + u * C, y0 + v * C]);
    s += lbl(first[0][0] - 3, first[0][1] + 1, '1', 'end', 3);
    for (const it of L.items) it.strokes.slice(1).forEach(st => { n++; const [u, v] = st[0]; s += lbl(x0 + it.x + u * C - 1.2, y0 + v * C - 1.2, String(n), 'end', 3); });
    return s + lbl(w / 2, h - 2, '1 the whole word · then 2, 3, 4: crosses left to right', 'middle', 2.2);
  },
  slant(w, h) {
    const C = Math.min(9, (h - 6) / (2 * 1.7)), t = 'running late';
    let s = '', y = 2;
    const wob = (x, y0) => { const L = HAND.layout(t, C); return L.items.map((it, i) => { const k = [0.12, -0.1, 0.18, -0.04, 0.1, -0.14, 0.06][i % 7]; return drawStrokes(it.strokes.map(st => st.map(([u, v]) => [u + (1 - v) * k, v])), x + it.x, y0, C, 'ink'); }).join(''); };
    s += rules(34, w - 36, y, C, 'four') + lbl(2, y + C * 0.95, 'wobbly slant', 'start', 2.4) + wob(38, y);
    y += C * 1.7;
    s += rules(34, w - 36, y, C, 'four') + lbl(2, y + C * 0.95, 'steady slant', 'start', 2.4) + writeText(t, 38, y, C, 'ink').s;
    return s;
  },
  pangram: printD.pangram,
  speed: printD.speed,
  confusions(w, h) { return confusionGrid([['e l', 'l is a tall loop'], ['a o', 'a has a stem'], ['n u', 'n humps, u cups'], ['r s', 'r has a shoulder'], ['v r', 'v has a point'], ['cl d', 'close the d']], w, h); },
  compare: printD.compare,
};

export const pages = {
  cover() {
    const C = Math.min(20, (AW - 10) / textW('Join it up', 1));
    const big = svg(AW, C * 1.5 + 6, rules(2, AW - 4, 3, C, 'four') + writeText('Join it up', (AW - textW('Join it up', C)) / 2, 3, C, 'ink').s);
    const fade = svg(AW, rowH(10, 'four') + 4, rules(0, AW, 1.4, 10, 'four') + [0, 1].map(i => drawGlyph('a', 3 + i * 9, 1.4, 10, 'ghost')).join('') + [2, 3].map(i => drawGlyph('a', 3 + i * 9, 1.4, 10, 'dots')).join('') + writeText('a', 3 + 4 * 9, 1.4, 10, 'ink').s + lbl(10.5, rowH(10, 'four') + 2.5, 'trace', 'middle') + lbl(28.5, rowH(10, 'four') + 2.5, 'dots', 'middle') + lbl(41, rowH(10, 'four') + 2.5, 'free →', 'start'));
    return `<div class="cv-series">${esc(book.series)}</div><div class="cv-title">${esc(book.title)}</div><div class="cv-sub">${esc(book.subtitle)}</div>
    <div class="cv-ex">${big}</div>
    <div class="cv-model">${noteSvg(wrap(book.sentence, 8, AW - 6), 8, 'four')}</div><div class="cv-fade">${fade}</div>
    <div class="cv-meta">21 lessons · strokes → letters → joins → capitals → flow and speed</div><div class="cv-dev">For Kindle Scribe, reMarkable, pen tablets and loose-leaf print — write directly on the pages</div>`;
  },
  how() {
    return `<div class="h-title">How this book works</div>
    <div class="h-lead">Every lesson comes as a sheet: read the front, write on the back.</div>
    <div class="spread-demo"><div><b>Front</b><span>the letters with stroke order and direction, the joins, the steps, what to check, the common slip and why it works</span></div><div><b>Back</b><span>the practice rows, with help that fades</span></div></div>
    <div class="h-note">Printed double-sided, every sheet stands on its own — pull it out, take it with you, or print it again for more practice. On an e-reader, the practice is the next page and the instructions are one swipe back.</div>
    <div class="h-lead">Four rules run through every word:</div>
    <div class="habit">${book.habit.map((s, i) => `<div><b>${i + 1}</b><span>${s}</span><em>${esc(book.habitNotes[i])}</em></div>`).join('')}</div>
    <div class="h-lead">The guide lines — with slant guides:</div>${svg(AW, 18.5, rules(0, AW * 0.62, 2, 10, 'four') + writeText('loop', 2, 2, 10, 'ink').s + [['top line', 0], ['dashed middle', 0.5], ['baseline', 1], ['descender', 1.45]].map(([t, v]) => lbl(AW * 0.62 + 2, 2 + v * 10 + 0.9, t, 'start', 2.3)).join(''))}
    <div class="h-lead">Each lesson has up to three sheets:</div>
    <table class="kinds"><tr><td><b>Practice</b></td><td>row by row, with help that fades</td></tr><tr><td><b>Repeat</b></td><td>the same skill with less help, for another day</td></tr><tr><td><b>Use it</b></td><td>real writing: lists, notes, addresses, a read-back test</td></tr></table>
    <div class="h-lead">Help fades on every practice row:</div>${legend('a')}
    <ul class="tips"><li>Use the pen, thin and black, and write straight onto the page — or print double-sided, flipping on the long edge.</li><li>Ten minutes a day beats an hour once a week. Circle your best word in every row.</li><li>Left-handers: turn the page to the right and keep your hand below the line. If the slant fights you, write upright — the joins matter more than the angle.</li></ul>`;
  },
  about() {
    return `<div class="h-title">About this book</div><p>Every letter in this book is drawn from one stroke model made for it: a simple modern looped cursive, slanted about 10°, with print-style capitals and numbers. It is our own design and follows no trademarked school model. The stroke numbers, arrows, joins, trace letters and dots all come from the same pen paths, so they always agree.</p><p>Every small letter starts with a lead-in from the baseline and ends ready to join. After b, o, v and w the join leaves from the middle line. Dots and crosses are written after each word.</p><p>The pencil sketches are original drawings generated for the Pen Practice series. Typefaces: Inter and JetBrains Mono (SIL Open Font License).</p><p>Pages are sized to the Kindle Scribe screen (157.5 × 210 mm) and the reMarkable 2. Every lesson is one sheet — instructions on the front, practice on the back — so it works as loose leaf printed double-sided, or page by page on an e-reader.</p><p class="small">${esc(book.series)} · ${esc(book.title)} · e-ink edition</p>`;
  },
  backcover(img) {
    return `<div class="bc-in"><div class="cv-series">${esc(book.series)}</div><div class="bc-title">${esc(book.title)}</div>${img('diner', 44, AW)}<div class="plate-note">${noteSvg(['Want more practice?', 'Print any sheet again.'])}</div><div class="bc-note">Every sheet stands on its own.</div></div>`;
  },
};
