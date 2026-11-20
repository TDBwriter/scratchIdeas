// Street Hand: the book module the shared builder (../hand/build.mjs) loads.
import { glyph as pg } from '../print/strokes.mjs';
import { hand as printHand } from '../print/hand.mjs';
import { compareSheets, confusionGrid } from '../print/book.mjs';
import { hands, caps, bounce, tag, throwUp } from './hand.mjs';
import { book, parts, lessons, talk } from './lessons.mjs';
import { AW, PH, INK, RULE, f, esc, svg, ln, path, rect, lbl, writeText, textW, wrap, drawGlyph, drawStrokes, rules, row, rows, rowH, fitC, spare, lined, legend, noteSvg, wordRows, withHand } from '../hand/lib.mjs';

export { book, parts, lessons, talk, hands };
export const hand = caps;
export const meta = { out: 'street', base: 'street-hand', seeds: [45, 46], tocSplit: 3, legendChar: 'A', preview: ['G0.1', 'G1.3', 'G2.1', 'G3.2', 'G4.1', 'G4.4'] };

export const WARM = [['lean', 'IIII'], ['kicks', 'LLL'], ['points', 'VVV'], ['zigzag', 'WW'], ['corners', 'OOO'], ['spines', 'SSS'], ['bars', 'EEE'], ['legs', 'KKK']];
export const tasks = {
  warmups: 'Each row: trace, follow the dots, then keep the pattern going — one quick stroke per line.',
  wordRows: 'Trace each word, follow the dots, then write it again on your own — one stroke per line.',
  sentenceRows: 'Trace the sentence, then write it on the line below with the same bounce.',
  sentenceRowsRepeat: 'Follow the dotted sentence, then write it again below — keep the rhythm.',
  timedRows: 'Set a 30-second timer for each trial. Count the letters, then double the count.',
  confusions: 'Trace each pair in street caps, then write it three times. Keep the difference clear.',
};
export const css = `.tframes { display: grid; grid-template-columns: 1fr 1fr; gap: 3mm; flex: 1; }
.tframes div { border: 0.35mm solid #000; position: relative; min-height: 30mm; }
.tframes span { position: absolute; left: 1.5mm; top: 1mm; font: 700 2.4mm "JetBrains Mono", monospace; }
.tframes em { position: absolute; right: 1.5mm; bottom: 1mm; font: 2.2mm "JetBrains Mono", monospace; font-style: normal; color: #555; }`;

// a style sample row: label on the left, the words in that hand
const styleLine = (h, label, text, w, C, style = 'three') => withHand(h, () => svg(w, rowH(C, style), rules(30, w - 30, 1.4 + (h.pad || 0) * C, C, style) + lbl(1, 1.4 + (h.pad || 0) * C + C * 0.8, label, 'start', 2.3) + writeText(text, 33, 1.4 + (h.pad || 0) * C, C, 'ink').s));

// ---------- practice page types special to this book
export const practice = {
  nameSample(sp) {
    const final = sp.final, C = 6;
    const model = withHand(printHand, () => wrap(book.sentence, C, AW - 6).map(t => row(C, 'two', y0 => writeText(t, 2, y0, C, 'ink').s)).join(''));
    const rec = final
      ? `<table class="rec"><tr><th></th><th>day one</th><th>today</th><th>change</th></tr><tr><td>fast minute: letters per minute</td><td></td><td></td><td></td></tr><tr><td>words misread</td><td></td><td></td><td></td></tr><tr><td>styled name read by a stranger?</td><td></td><td></td><td></td></tr></table>`
      : `<table class="rec"><tr><td>fast minute: letters per minute</td><td></td><td>words misread</td><td></td></tr><tr><td>styled name read by a stranger?</td><td></td><td>date</td><td></td></tr></table>`;
    return { legendOn: false, task: 'Your name and one sentence. Date the sheet.', inner: `<div class="sl"><b>1 · Your name</b> — the way you usually sign it</div>${lined(2)}
      <div class="sl"><b>2 · Your name with flair</b> — ${final ? 'in your own style' : 'any flair you like'}</div><div class="frame" style="height:24mm"></div>
      <div class="sl">Copy this sentence:</div>${model}
      <div class="sl"><b>3 · Everyday</b> — the way you normally write</div>${lined(2)}
      <div class="sl"><b>4 · Fast minute</b> — 60-second timer: write it again and again</div>${lined(3)}
      <div class="sl"><b>Record</b></div>${rec}` };
  },
  nameRows(sp, again) {
    if (again) {
      const blocks = [[5, 3, 'Tiny'], [8, 3, 'Normal'], [12, 2, 'Big']];
      return { task: 'Your name at three sizes. Same moves at every size.', inner: blocks.map(([C, n, t]) => `<div class="sl"><b>${t}</b></div>${rows(n, C, 'three')}`).join('') };
    }
    const C = 9;
    const models = sp.names.map(n => row(C, 'three', y0 => { const a = writeText(n, 2, y0, C, 'ghost'); return a.s + writeText(n, a.w + 2 + 1.5 * C, y0, C, 'dots').s; })).join('');
    return { task: 'Trace each name, follow the dots, then design your own — ten times, fast.', inner: `${models}<div class="sl"><b>Your name</b> — ten times, fast. Circle the best one.</div>${rows(spare(sp.names.length, C, 'three', PH - 10), C, 'three')}` };
  },
  throwWords(sp, again) {
    const filled = row(11, 'three', y0 => writeText(again ? 'GOOD' : 'POP', 2, y0, 11, 'fill').s + lbl(AW - 2, y0 + 11 * 0.8, 'outline, overlap, quick fill', 'end', 2.3));
    return { task: 'Trace each word, then draw the bubbles round the dotted skeletons, then on your own. Overlap left to right.', inner: filled + wordRows(again ? sp.words2 : sp.words, { max: 12 }) };
  },
  throwTimed() {
    const words = ['YES', 'WOW', 'POP', 'your name', 'a word you like', 'any 4 letters'];
    return { legendOn: false, task: 'One word per box, 30-second timer each. Outline only, overlapping. Then fill if time is left.', inner: `<div class="tframes">${words.map(t => `<div><span>30 s · ${esc(t)}</span><em>seconds: ____</em></div>`).join('')}</div>` };
  },
  styleRows(sp, again) {
    if (again) return { task: 'Your own combination: two or three moves, repeated. Write it ten times.', inner: `<div class="sl"><b>Your style</b> — name the moves: __________________________</div>${rows(8, 9, 'three')}` };
    const set = [[caps, 'Street caps', sp.words[0], 8, 'three'], [bounce, 'Bounce', sp.words[1], 7, 'four'], [tag, 'Handstyle', sp.words[0], 8, 'three'], [throwUp, 'Throw-up', sp.words[0].slice(0, 5), 10, 'three']];
    return { task: 'The same word in all four styles: trace it, then write it below. Circle the moves you like.', inner: set.map(([h, name, t, C, st]) => withHand(h, () => `<div class="sl"><b>${name}</b></div>${row(C, st, y0 => writeText(t, 2, y0, C, 'ghost').s)}${row(C, st)}`)).join('') };
  },
};

// ---------- instruction-page diagrams (w × h mm)
export const D = {
  moves(w, h) {
    const cells = [['plain', printHand, 'R'], ['squeeze + lean', null, 'sq'], ['corners', null, 'co'], ['kick', caps, 'R'], ['stretch', tag, 'R'], ['bounce', bounce, 'bop'], ['bubble', throwUp, 'R'], ['tight + tails', tag, 'ROX']];
    const cw = w / 4, ch = h / 2, C = Math.min(15, (ch - 9) / 1.15);
    const base = pg('R');
    const sq = { ...base, w: base.w * 0.8, strokes: base.strokes.map(s => s.map(([x, y]) => [x * 0.8 + (1 - y) * 0.2, y])) };
    let s = '';
    cells.forEach(([name, h0, what], i) => {
      const cx = (i % 4) * cw, cy = Math.floor(i / 4) * ch, y0 = cy + 3;
      s += ln(cx + 3, y0 + C, cx + cw - 3, y0 + C, { c: RULE, w: 0.25 });
      if (what === 'sq') s += withHand(printHand, () => drawGlyph(sq, cx + cw / 2 - sq.w * C / 2, y0, C, 'ink'));
      else if (what === 'co') s += withHand(caps, () => { const g = caps.glyph('R'); const gNoKick = { ...g, strokes: g.strokes.map((st, k) => (k === g.strokes.length - 1 ? st.slice(0, -1) : st)) }; return drawGlyph(gNoKick, cx + cw / 2 - g.w * C / 2, y0, C, 'ink'); });
      else if (what === 'ROX') s += withHand(tag, () => writeText('ROX', cx + cw / 2 - textW('ROX', C * 0.85) / 2, y0 + C * 0.1, C * 0.85, 'ink').s);
      else if (h0 === bounce) s += withHand(bounce, () => writeText('bop', cx + cw / 2 - textW('bop', C * 0.9) / 2, y0 - C * 0.05, C * 0.9, 'ink').s);
      else s += withHand(h0, () => drawGlyph(what, cx + cw / 2 - h0.glyph(what).w * C / 2, y0, C, 'ink'));
      s += lbl(cx + cw / 2, cy + ch - 2, name, 'middle', 2.2);
    });
    return s;
  },
  fourStyles(w, h) {
    const C = Math.min(8.5, (h - 4) / 4 / 1.45);
    const lines = [[caps, 'street caps', 'STREET HAND'], [bounce, 'bounce', 'street hand'], [tag, 'handstyle', 'STREET HAND'], [throwUp, 'throw-up', 'STREET']];
    return lines.map(([hh, name, t], i) => `<g transform="translate(0 ${f(1 + i * (h - 2) / 4)})">${withHand(hh, () => rules(30, w - 32, 1 + (hh.pad || 0) * C, C, hh === bounce ? 'two' : 'none') + lbl(2, 1 + (hh.pad || 0) * C + C * 0.8, name, 'start', 2.3) + writeText(t, 33, 1 + (hh.pad || 0) * C, hh === throwUp ? C * 1.1 : C, 'ink').s)}</g>`).join('');
  },
  capsInUse(w, h) {
    const cw = w * 0.55;
    let s = rect(2, 2, cw, h - 4, { w: 0.4 });
    s += withHand(caps, () => writeText('MONDAY - TO DO', 6, 5, 6.5, 'ink').s) + ln(6, 13.5, cw - 2, 13.5, { w: 0.3 });
    ['call the bank', 'pick up paint', 'book the van'].forEach((t, i) => { s += withHand(printHand, () => writeText(t, 7, 17 + i * 9, 4.6, 'ink').s); });
    const bx = cw + 8, bw = w - bx - 3;
    s += rect(bx, 8, bw, h - 18, { w: 0.5 }) + withHand(caps, () => { const C = Math.min(9, (bw - 6) / textW('FRAGILE', 1)); return writeText('FRAGILE', bx + (bw - textW('FRAGILE', C)) / 2, 8 + (h - 18) / 2 - C / 2, C, 'ink').s; });
    return s + lbl(2 + cw / 2, h - 0.5, 'a heading', 'middle', 2.1) + lbl(bx + bw / 2, h - 0.5, 'a label', 'middle', 2.1);
  },
  bounceRule(w, h) {
    const C = Math.min(10, (h - 6) / (2 * 1.7));
    let s = '', y = 2;
    s += rules(30, w - 32, y, C, 'four') + lbl(2, y + C * 0.95, 'flat', 'start', 2.4) + withHand(printHand, () => writeText('good vibes', 34, y, C, 'ink').s);
    y += C * 1.7;
    s += rules(30, w - 32, y, C, 'four') + lbl(2, y + C * 0.95, 'bounce', 'start', 2.4) + withHand(bounce, () => writeText('good vibes', 34, y, C, 'ink').s);
    return s;
  },
  bounceSentence(w, h) {
    const C = 8, lines = withHand(bounce, () => wrap('see you at the park at six', C, w - 8));
    let s = '', y = 3;
    for (const t of lines) { s += rules(2, w - 4, y, C, 'four') + withHand(bounce, () => writeText(t, 4, y, C, 'ink').s); y += C * 1.6; }
    return s + lbl(w - 3, h - 2, 'a steady rhythm: up, down, up', 'end', 2.2);
  },
  bounceCard(w, h) {
    const cw = w * 0.62, x0 = (w - cw) / 2;
    let s = rect(x0, 2, cw, h - 4, { w: 0.45 });
    s += withHand(bounce, () => { const C = Math.min(10, (cw - 8) / textW('happy birthday', 1)); return writeText('happy birthday', x0 + (cw - textW('happy birthday', C)) / 2, 8, C, 'ink').s; });
    s += withHand(printHand, () => writeText('have a great day - love, sam', x0 + 5, h - 16, 3.6, 'ink').s);
    return s + lbl(x0 + cw + 2, h - 3, 'bounce the main words', 'start', 2.1);
  },
  tagName(w, h) {
    const C = Math.min(20, (h - 12) / 1.35);
    let s = '';
    [['NOVA', 0.05], ['MILO', 0.55]].forEach(([n, fx], i) => {
      const x = w * fx + 4, y0 = 3 + tag.pad * C;
      const W = withHand(tag, () => writeText(n, x, y0, C, 'ink'));
      s += W.s;
      if (i === 1) s += path(`M${f(x + W.w + 2)} ${f(y0 + C * 1.1)} Q ${f(x + W.w / 2)} ${f(y0 + C * 1.32)} ${f(x - 2)} ${f(y0 + C * 1.16)}`, { w: 0.6 });
      s += lbl(x + W.w / 2, h - 1.5, i ? 'tail, then an underline' : 'long first stem', 'middle', 2.2);
    });
    return s;
  },
  tagSpeed(w, h) {
    let s = '', y = 2;
    [[11, 'practice size'], [7.5, 'smaller'], [5, 'everyday size']].forEach(([C, name]) => {
      s += withHand(tag, () => writeText('FAST AND CLEAN', 4, y + tag.pad * C, C, 'ink').s) + lbl(w - 3, y + C * 0.95, name, 'end', 2.4);
      y += C * 1.45 + 2.5;
    });
    return s;
  },
  throwSteps(w, h) {
    const cw = w / 3, C = Math.min(16, (h - 10) / 1.25);
    let s = '';
    const g = throwUp.glyph('P'), x = i => i * cw + cw / 2 - g.w * C / 2, y0 = 3;
    s += drawStrokes(g.strokes, x(0), y0, C, 'ink', {}) + lbl(cw / 2, h - 2, '1 see the skeleton', 'middle', 2.2);
    s += withHand(throwUp, () => drawGlyph('P', x(1), y0, C, 'ink')) + drawStrokes(g.strokes, x(1), y0, C, 'dots', {}) + lbl(cw * 1.5, h - 2, '2 one line round it', 'middle', 2.2);
    s += withHand(throwUp, () => { const t = writeText('POP', 0, 0, C * 0.8, 'fill'); return `<g transform="translate(${f(cw * 2 + cw / 2 - t.w / 2)} ${f(y0 + C * 0.1)})">${t.s}</g>`; }) + lbl(cw * 2.5, h - 2, '3 overlap, quick fill', 'middle', 2.2);
    return s;
  },
  throwTimed(w, h) {
    const cw = w / 3, C = Math.min(13, (h - 10) / 1.25);
    let s = '';
    ['YES', 'WOW', 'HEY'].forEach((t, i) => { s += withHand(throwUp, () => { const W = writeText(t, 0, 0, C, i === 1 ? 'fill' : 'ink'); return `<g transform="translate(${f(i * cw + cw / 2 - W.w / 2)} 3)">${W.s}</g>`; }) + lbl(i * cw + cw / 2, h - 2, ['outline only', 'with a quick fill', 'outline only'][i], 'middle', 2.1); });
    return s;
  },
  confusions(w, h) { return withHand(caps, () => confusionGrid([['O 0', '0 is narrower'], ['S 5', '5 has a flat hat'], ['U V', 'U has a flat bottom'], ['D O', 'D has a straight back'], ['B 8', 'B has a straight back'], ['Z 2', '2 is curved on top']], w, h)); },
  compare(w, h) { return withHand(caps, () => compareSheets(w, h, 'NOVA')); },
};

// ---------- front and back matter
export const pages = {
  cover() {
    const C = 21, big = withHand(throwUp, () => ['STREET', 'HAND'].map((t, i) => { const W = writeText(t, 0, 0, C, i ? 'fill' : 'ink'); return `<g transform="translate(${f((AW - W.w) / 2)} ${f(2 + i * C * 1.12)})">${W.s}</g>`; }).join(''));
    const C2 = 6.5;
    const samples = [[caps, 'street caps', 'NOTES AND HEADINGS', C2, 'three'], [bounce, 'bounce', 'cards and notes', C2, 'two'], [tag, 'handstyle', 'YOUR NAME, FAST', C2, 'three']].map(([h, n, t, c, st]) => styleLine(h, n, t, AW, c, st)).join('');
    return `<div class="cv-series">${esc(book.series)}</div><div class="cv-title">${esc(book.title)}</div><div class="cv-sub">${esc(book.subtitle)}</div>
    <div class="cv-ex">${svg(AW, C * 2.25 + 6, big)}</div>
    <div class="cv-model">${samples}</div>
    <div class="cv-meta">24 lessons · street caps → bounce → handstyle → throw-ups</div><div class="cv-dev">For Kindle Scribe, reMarkable, pen tablets and loose-leaf print — write directly on the pages</div>`;
  },
  how() {
    const C = 5.6;
    const styles = [[caps, 'street caps', 'MEET AT THE CORNER'], [bounce, 'bounce', 'see you at six'], [tag, 'handstyle', 'NOVA ONE'], [throwUp, 'throw-up', 'POP']].map(([h, n, t]) => styleLine(h, n, t, AW, h === throwUp ? 6.5 : C, h === bounce ? 'two' : 'none')).join('');
    return `<div class="h-title">How this book works</div>
    <div class="h-lead">Every lesson comes as a sheet: read the front, write on the back.</div>
    <div class="spread-demo"><div><b>Front</b><span>the letters with stroke order and direction, the moves, the steps, what to check, the common slip and why it works</span></div><div><b>Back</b><span>the practice rows, with help that fades</span></div></div>
    <div class="h-note">Printed double-sided, every sheet stands on its own — pull it out, take it with you, or print it again for more practice. On an e-reader, the practice is the next page and the instructions are one swipe back.</div>
    <div class="h-lead">Four rules run through every style:</div>
    <div class="habit">${book.habit.map((s, i) => `<div><b>${i + 1}</b><span>${s}</span><em>${esc(book.habitNotes[i])}</em></div>`).join('')}</div>
    <div class="h-lead">Four styles, all built on the print letters you know:</div>${styles}
    <div class="h-lead">Help fades on every practice row:</div>${legend('A')}
    <ul class="tips"><li>A fineliner or felt pen is ideal; on a tablet use the marker or felt-tip pen.</li><li>Ten minutes a day beats an hour once a week. Circle your best letter in every row.</li><li>Practise on paper, in sketchbooks and on legal walls — never on anyone’s property without permission.</li></ul>`;
  },
  about() {
    return `<div class="h-title">About this book</div><p>The four styles in this book — street caps, bounce, handstyle and throw-ups — are built from one stroke model: the simple print letters of Clear & Quick Print, transformed with a few moves (squeeze, lean, corners, kicks, stretch, bounce, bubble). The stroke numbers, arrows, trace letters and dots all come from the same pen paths, so they always agree.</p><p>These are writing styles, not slow art pieces: every letter is drawn fast, in about as many strokes as print. Nothing is copied from real writers’ tags, names or crews; the names in the practice rows are made up.</p><p>The pencil sketches are original drawings generated for the Pen Practice series. Typefaces: Inter and JetBrains Mono (SIL Open Font License).</p><p>Pages are sized to the Kindle Scribe screen (157.5 × 210 mm) and the reMarkable 2. Every lesson is one sheet — instructions on the front, practice on the back — so it works as loose leaf printed double-sided, or page by page on an e-reader.</p><p class="small">${esc(book.series)} · ${esc(book.title)} · e-ink edition</p>`;
  },
  backcover(img) {
    return `<div class="bc-in"><div class="cv-series">${esc(book.series)}</div><div class="bc-title">${esc(book.title)}</div>${img('diner', 46, AW)}<div class="plate-note">${withHand(caps, () => noteSvg(['WANT MORE PRACTICE?', 'PRINT ANY SHEET AGAIN.'], 6.5, 'three'))}</div><div class="bc-note">Every sheet stands on its own.</div></div>`;
  },
};
