// Builds a Pen Practice handwriting workbook (front/back loose-leaf sheets) from a book module.
//
//   node build.mjs <print|cursive|street> [--page eink|letter|a4] [--out DIR] [--refs]
//
// The book module (../<book>/book.mjs) supplies the content (book, parts, lessons, talk), the hand (stroke model),
// instruction diagrams (D), any extra practice page types, and the cover / how / about / back cover pages.
// --page eink (default): 157.5 × 210 mm, true size on Kindle Scribe 2022/2024 and reMarkable 2.
// Every lesson unit is one sheet: instructions on the front (odd page), practice on the back (even page),
// so it prints double-sided as loose leaf and reads front → back on an e-reader. No link navigation.
// Part plates use the pencil-sketch generator (../../sketchArt/sketch.mjs), generated once into DIR/refs.
// Writes DIR/<base>-<page>.pdf, a contact sheet of every page and a front/back preview of six sheets.
// Requires: playwright (Chromium), ImageMagick (montage).

import { createRequire } from 'node:module';
import { existsSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { resolve, join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import * as L from './lib.mjs';
import { f, esc, svg, setPage, setHand, withHand, HEAD, FOOT, exSvg, sayGrid, legend, noteSvg, letterRows, warmups, sample, wordRows, spaceRows, sentenceRows, fadingLines, blankRows, timedRows, pangramRows, copyModels, confusions, useBlocks } from './lib.mjs';

const { chromium } = createRequire(import.meta.url)('playwright');
const HERE = dirname(fileURLToPath(import.meta.url));
const SKETCH = resolve(HERE, '../../sketchArt/sketch.mjs');

const opt = { book: null, page: 'eink', out: null, refs: false };
const argv = process.argv.slice(2);
for (let i = 0; i < argv.length; i++) {
  if (argv[i] === '--page') opt.page = argv[++i];
  else if (argv[i] === '--out') opt.out = resolve(argv[++i]);
  else if (argv[i] === '--refs') opt.refs = true;
  else if (!argv[i].startsWith('--')) opt.book = argv[i];
}
if (!opt.book) { console.error('usage: node build.mjs <print|cursive|street> [--page eink|letter|a4] [--out DIR] [--refs]'); process.exit(1); }
setPage(opt.page);
const B = await import(pathToFileURL(resolve(HERE, '..', opt.book, 'book.mjs')).href);
const { book, parts, lessons, talk } = B;
opt.out ||= resolve(HERE, '../out', B.meta.out);
const handOf = name => (name ? B.hands[name] : B.hand);
setHand(B.hand);

// ---------- pages: sheets, instructions on the front and practice on the back
const pageList = [];
const pageOf = {};
const partName = n => parts.find(p => p.n === n).name;
const lg = () => legend(B.meta.legendChar || 'a', B.meta.legendC || 7);
const head = (l, kind, extra = '') => `<header class="head${extra ? ' has-legend' : ''}"><div class="kick">PART ${l.part} · ${esc(partName(l.part).toUpperCase())} <b>${l.id}</b></div><div class="ttl">${esc(l.title)}</div><div class="kind">${kind}</div>${extra}</header>`;
const list = (items, cls = '') => `<ul class="${cls}">${items.map(c => `<li>${esc(c)}</li>`).join('')}</ul>`;
const checkBox = items => `<div class="vbox"><b>Check yourself</b>${list(items)}</div>`;
const slipBox = s => `<div class="slip"><b>Common slip</b> ${esc(s)}</div>`;
const whyBox = s => `<div class="why"><b>Why it works</b> ${esc(s)}</div>`;
const steps = (items, h = 'Do this') => `<div class="steps-h">${h}</div><ol class="steps">${items.map(s => `<li>${esc(s)}</li>`).join('')}</ol>`;
const habitFull = () => `<div class="habit use">${book.habit.map((s, i) => `<div><b>${i + 1}</b><span>${s}</span><em>${esc(book.habitNotes[i])}</em></div>`).join('')}</div>`;

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

function makeRefs() {
  const dir = join(opt.out, 'refs');
  for (const seed of B.meta.seeds) if (opt.refs || !existsSync(join(dir, `diner-${seed}.png`))) execFileSync('node', [SKETCH, '--seed', String(seed), '--no-notes', '--out', dir], { stdio: 'inherit' });
  return (scene, seed, width) => `<div class="ref" style="width:${f(width)}mm"><img src="refs/${scene}-${seed}.png"/></div>`;
}

function buildPages(img) {
  sheet(['cover', B.pages.cover(img), {}, 'cover'], ['how', B.pages.how(img), { id: 'how', label: 'how this book works', hints: false }]);

  const split = B.meta.tocSplit ?? Math.ceil(parts.length / 2);
  const tocCol = ps => ps.map(p => `<div class="toc-part"><span>Part ${p.n} · ${esc(p.name)}</span><em>{{p:part-${p.n}}}</em></div>${lessons.filter(l => l.part === p.n).map(l => `<div class="toc-l"><span>${l.id}</span>${esc(l.title)}<em>{{p:${l.id}}}</em></div>`).join('')}`).join('');
  const tocBody = `<div class="h-title">Contents</div><div class="toc-cols"><div>${tocCol(parts.slice(0, split))}</div><div>${tocCol(parts.slice(split))}<div class="toc-part"><span>Progress tracker</span><em>{{p:progress}}</em></div><div class="toc-part"><span>About this book</span><em>{{p:about}}</em></div></div></div>`;
  const hasRepeat = l => l.kind === 'letters' || l.repeat;
  const progressBody = `<div class="h-title">Progress tracker</div><table class="prog"><tr><th>lesson</th><th>page</th><th>practice</th><th>repeat</th><th>use it</th></tr>${lessons.map(l => `<tr><td><b>${l.id}</b> ${esc(l.title)}</td><td>{{p:${l.id}}}</td><td>☐ ____</td><td>${hasRepeat(l) ? '☐ ____' : '—'}</td><td>${l.use ? '☐ ____' : '—'}</td></tr>`).join('')}</table>`;
  sheet(['toc', tocBody, { id: 'contents', label: 'contents', hints: false }], ['progress', progressBody, { id: 'progress', label: 'progress tracker', hints: false }]);

  for (const p of parts) {
    const ls = lessons.filter(l => l.part === p.n);
    const note = withHand(handOf(p.plate.hand), () => noteSvg(p.plate.note, p.plate.C || 6, p.plate.style || 'two'));
    sheet(['opener', `<div class="op-n">Part ${p.n}</div><div class="op-name">${esc(p.name)}</div><div class="op-intro">${esc(p.intro)}</div>
        <div class="op-list">${ls.map(l => `<div><span>${l.id}</span>${esc(l.title)}<em>{{p:${l.id}}}</em></div>`).join('')}</div>`, { id: `part-${p.n}`, label: `part ${p.n} · ${p.name.toLowerCase()}`, hints: false }],
      ['plate', `<div class="plate-in">${img(p.plate.scene, p.plate.seed, L.AW)}<div class="plate-note">${note}</div><div class="plate-cap">from the sketchbook</div></div>`, { label: `part ${p.n} · ${p.name.toLowerCase()}`, hints: false }]);
    for (const l of ls) withHand(handOf(l.hand), () => lessonSheets(l));
  }

  sheet(['about', B.pages.about(img), { id: 'about', label: 'about', hints: false }], ['backcover', B.pages.backcover(img), { label: '', hints: false }, 'backcover']);
}

const TASKS = {
  letters: 'Each row: trace two, follow the dots for two, then fill the line on your own.',
  lettersRepeat: 'Each row: trace one, follow the dots for one, then on your own.',
  warmups: 'Each row: trace, follow the dots, then keep the rhythm going to the end.',
  wordRows: 'Trace each word, follow the dots, then write it again on your own.',
  spaceRows: 'Trace the word, follow the dotted one, then write it on your own. Watch the gaps, not the letters.',
  spaceRowsRepeat: 'Follow the dotted word, then write it twice. Watch the gaps, not the letters.',
  sentenceRows: 'Trace the sentence — the faint o shows each word gap — then write it on the line below.',
  sentenceRowsRepeat: 'Follow the dotted sentence, judging the word gaps by eye, then write it again below.',
  fadingLines: 'The same sentence while the guide lines disappear. Keep the sizes the same.',
  blankRows: 'Write each sentence in the box below it. No lines — make two tiny marks if you need them.',
  timedRows: 'Set a 30-second timer for each trial. Count the letters, then double the count.',
  pangramRows: 'Trace each pangram, then copy it on the lines below.',
  copyModels: 'Copy each model at your everyday speed.',
  confusions: 'Trace each pair, then write it three times on your own. Exaggerate the difference.',
  sample: 'Three ways, one sentence. Date the sheet.',
  ...(B.tasks || {}),
};

function practiceBack(l, again) {
  const sp = l.practice || {};
  let inner, task, legendOn = true;
  const custom = l.kind !== 'letters' && B.practice && B.practice[sp.type];
  if (custom) ({ inner, task, legendOn = true } = custom(sp, again, l));
  else if (l.kind === 'letters') { inner = letterRows(l.letters, again ? l.words2 : l.words, again ? { ghost: 1, dots: 1, words: ['ghost'] } : { ghost: 2, dots: 2, words: ['ghost', 'dots'] }); task = TASKS[again ? 'lettersRepeat' : 'letters']; }
  else if (sp.type === 'warmups') { inner = warmups(sp.warm || B.WARM, again ? { ghost: 1, dots: 2 } : { ghost: 3, dots: 3 }, sp.style); task = TASKS.warmups; }
  else if (sp.type === 'sample') { inner = sample(book.sentence, sp.final); task = TASKS.sample; legendOn = false; }
  else if (sp.type === 'wordRows') { inner = wordRows(again && sp.words2 ? sp.words2 : sp.words); task = TASKS.wordRows; }
  else if (sp.type === 'spaceRows') { inner = spaceRows(again ? sp.words2 : sp.words, again); task = TASKS[again ? 'spaceRowsRepeat' : 'spaceRows']; }
  else if (sp.type === 'sentenceRows') { inner = sentenceRows(again ? sp.sentences2 : sp.sentences, again, sp.opts); task = TASKS[again ? 'sentenceRowsRepeat' : 'sentenceRows']; }
  else if (sp.type === 'fadingLines') { inner = fadingLines(again ? (sp.text2 || 'Jackdaws love my big sphinx of quartz.') : sp.text, again); task = TASKS.fadingLines; }
  else if (sp.type === 'blankRows') { inner = blankRows(sp.sentences); task = TASKS.blankRows; legendOn = false; }
  else if (sp.type === 'timedRows') { inner = timedRows(again ? sp.text2 : sp.text, again, sp.opts); task = TASKS.timedRows; legendOn = false; }
  else if (sp.type === 'pangramRows') { inner = pangramRows(again ? sp.texts2 : sp.texts); task = TASKS.pangramRows; }
  else if (sp.type === 'copyModels') { inner = copyModels(sp.models || B.models); task = TASKS.copyModels; legendOn = false; }
  else if (sp.type === 'confusions') { inner = confusions(sp.pairs, sp.opts); task = TASKS.confusions; }
  else throw new Error(`unknown practice ${sp.type}`);
  task = (again && sp.task2) || sp.task || task;
  const kind = l.kind === 'test' ? (sp.final ? 'FINAL SAMPLE' : 'DAY ONE') : again ? 'REPEAT' : 'PRACTICE';
  return `${head(l, kind, legendOn ? lg() : '')}<div class="body"><div class="task">${esc(task)}</div><div class="drill">${inner}</div><div class="repline">date ________ · circle your best${l.kind === 'letters' ? ' letter in each row' : ''}<span>${l.kind === 'test' ? '' : 'reps ☐ ☐ ☐'}</span></div></div>`;
}

function lessonSheets(l) {
  const lb = s => `${l.id} · ${s}`;
  const diagram = h => (l.kind === 'letters' ? exSvg(l.letters, L.AW, h) : svg(L.AW, h, B.D[l.diagram](L.AW, h)));
  const dh = l.dh || (l.kind === 'letters' ? ([...l.letters].length > 7 ? 54 : 46) : 54);

  // 1 · How to (front) + Practice (back)
  const learn = `${head(l, l.kind === 'test' ? 'HOW TO' : 'HOW TO')}<div class="body">
    <div class="lead"><b>You’ll learn</b> ${esc(l.learn)}</div>
    <div class="idea">${esc(l.idea)}</div>
    <div class="diagram">${diagram(dh)}</div>
    ${l.kind === 'letters' ? sayGrid(l.letters, talk) : ''}
    ${steps(l.steps)}
    <div class="vfill"></div>${checkBox(l.check)}${slipBox(l.slip)}${whyBox(l.why)}</div>`;
  sheet(['learn', learn, { id: l.id, label: lb('how to') }], ['practice', practiceBack(l, false), { label: lb(l.kind === 'test' ? 'sample' : 'practice') }]);

  // 2 · Again (front) + Repeat (back)
  if (l.kind === 'letters' || l.repeat) {
    const v = `${head(l, 'AGAIN')}<div class="body"><div class="lead"><b>Same skill, less help.</b> Do this sheet on a different day from the first one.</div>
      <div class="thistime"><b>This time</b> ${esc(l.again)}</div>
      <div class="diagram">${diagram(l.kind === 'letters' ? Math.min(dh, 46) : 42)}</div>
      ${l.kind === 'letters' ? sayGrid(l.letters, talk) : ''}
      ${steps(l.steps, 'The steps again')}
      <div class="vfill"></div>${checkBox(l.check)}${slipBox(l.slip)}${l.kind === 'letters' ? '' : whyBox(l.why)}</div>`;
    sheet(['learn', v, { id: `${l.id}-again`, label: lb('again') }], ['practice', practiceBack(l, true), { label: lb('repeat') }]);
  }

  // 3 · Use it: how to (front) + Use it (back)
  if (l.use) {
    const u = l.use;
    const front = `${head(l, 'USE IT · HOW TO')}<div class="body">
      <div class="lead"><b>Your task</b> ${esc(u.prompt)}</div>${habitFull()}
      ${steps(u.how, 'How to approach it')}
      <div class="vbox"><b>Real writing</b> ${esc(u.real || 'Use your everyday pen and speed. This is the writing the lessons were for — it doesn’t have to be perfect, it has to be read.')}</div>
      <div class="vfill"></div>${checkBox(u.check)}${slipBox(u.slip)}</div>`;
    const back = `${head(l, 'USE IT')}<div class="body"><div class="task">${esc(u.prompt)}</div><div class="drill">${useBlocks(u.blocks)}</div><div class="repline">date ________<span>reps ☐ ☐ ☐</span></div></div>`;
    sheet(['learn', front, { id: `${l.id}-use`, label: lb('use it, how to') }], ['practice', back, { label: lb('use it') }]);
  }
}

// ---------- CSS
const css = () => { const PAGE = L.PAGE; return `@page { size: ${PAGE.w}mm ${PAGE.h}mm; margin: 0; }
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body { background: #fff; color: #000; font-family: Inter, "DejaVu Sans", sans-serif; }
svg { display: block; }
.page { width: ${PAGE.w}mm; height: ${PAGE.h}mm; padding: ${PAGE.pad}mm; position: relative; overflow: hidden; display: flex; flex-direction: column; break-after: page; }
.head { height: ${HEAD}mm; flex: none; position: relative; border-bottom: 0.5mm solid #000; }
.kick { font: 600 2.4mm "JetBrains Mono", monospace; letter-spacing: 0.35mm; color: #444; }
.kick b { color: #000; margin-left: 2mm; }
.ttl { font: 800 6.2mm/1.08 Inter, sans-serif; margin-top: 1.2mm; max-width: 108mm; }
.has-legend .ttl { max-width: 90mm; font-size: 5.6mm; }
.kind { position: absolute; top: 0; right: 0; font: 700 2.4mm "JetBrains Mono", monospace; letter-spacing: 0.4mm; background: #000; color: #fff; padding: 0.8mm 1.8mm; }
.legend { position: absolute; right: 0; bottom: 1mm; }
.lg-t { display: flex; justify-content: space-between; width: 42mm; font: 2mm "JetBrains Mono", monospace; color: #555; padding: 0 0.5mm; }
.body { flex: 1; padding-top: 3mm; display: flex; flex-direction: column; min-height: 0; }
.foot { height: ${FOOT}mm; flex: none; border-top: 0.35mm solid #000; display: flex; align-items: center; gap: 3mm; font: 2.3mm "JetBrains Mono", monospace; color: #555; margin-top: auto; }
.foot .pn { font: 700 3mm "JetBrains Mono", monospace; color: #000; }
.foot .fl-mid { flex: 1; }
.foot.odd { flex-direction: row-reverse; }
.foot.odd .fl-mid { text-align: right; }
.foot .hint { font-weight: 600; color: #000; }
.lead { font: 3.5mm/1.35 Inter, sans-serif; }
.lead b { font-weight: 800; margin-right: 1mm; }
.idea { font: 3.2mm/1.42 Inter, sans-serif; margin-top: 2mm; color: #111; }
.diagram { margin: 2.5mm 0 1.5mm; border: 0.3mm solid #bbb; flex: none; }
.say-h, .steps-h { font: 700 2.6mm "JetBrains Mono", monospace; letter-spacing: 0.35mm; text-transform: uppercase; margin-top: 1mm; }
.say { display: grid; grid-template-columns: 1fr 1fr; column-gap: 4mm; font: 2.7mm/1.25 Inter, sans-serif; margin: 0.6mm 0 1mm; }
.say div { display: flex; gap: 1.8mm; padding: 0.25mm 0; border-bottom: 0.2mm solid #ddd; }
.say b { font: 800 3.2mm Inter, sans-serif; width: 3.2mm; flex: none; }
.steps { font: 3.1mm/1.36 Inter, sans-serif; padding-left: 5.5mm; margin-top: 1mm; }
.steps li { margin-bottom: 0.5mm; }
.vfill { flex: 1; min-height: 1mm; }
.vbox { border-top: 0.35mm solid #000; padding-top: 1.4mm; margin-top: 2mm; font: 2.85mm/1.38 Inter, sans-serif; }
.vbox b, .why b, .thistime b { font: 700 2.4mm "JetBrains Mono", monospace; letter-spacing: 0.3mm; text-transform: uppercase; margin-right: 1mm; }
.vbox ul { padding-left: 4.5mm; margin-top: 0.6mm; }
.slip { margin-top: 2mm; border-left: 1mm solid #000; padding: 1.4mm 2.5mm; font: 2.9mm/1.35 Inter, sans-serif; background: #f2f2f2; }
.slip b { margin-right: 1mm; }
.why { margin-top: 2mm; border: 0.35mm solid #000; padding: 1.6mm 2.5mm; font: 2.85mm/1.38 Inter, sans-serif; }
.thistime { margin-top: 2.5mm; border: 0.5mm solid #000; padding: 2mm 2.5mm; font: 3.2mm/1.4 Inter, sans-serif; }
.habit { display: grid; grid-template-columns: repeat(4, 1fr); gap: 2mm; }
.habit div { border: 0.4mm solid #000; padding: 2mm; display: flex; flex-direction: column; gap: 1mm; }
.habit b { font: 800 6mm "JetBrains Mono", monospace; }
.habit span { font: 800 3.6mm Inter, sans-serif; }
.habit em { font: 2.5mm/1.3 Inter, sans-serif; font-style: normal; color: #333; }
.habit.use { margin: 2.5mm 0 1.5mm; }
.habit.mini { margin: 2.5mm 0 1mm; }
.habit.mini div { padding: 1.2mm 1.5mm; flex-direction: row; align-items: baseline; gap: 1.5mm; }
.habit.mini b { font-size: 3.6mm; }
.habit.mini span { font-size: 3mm; }
.task { font: 600 3.1mm/1.35 Inter, sans-serif; margin-bottom: 2mm; min-height: 4.2mm; }
.drill { flex: 1; min-height: 0; overflow: hidden; display: flex; flex-direction: column; }
.repline { margin-top: auto; padding-top: 1.5mm; font: 2.4mm "JetBrains Mono", monospace; color: #555; display: flex; justify-content: space-between; }
.repline span { font-weight: 700; color: #000; }
.sl { font: 2.9mm/1.35 Inter, sans-serif; margin: 1.6mm 0 0.6mm; }
.sl b { font-weight: 800; }
.sl .tally { float: right; font: 2.5mm "JetBrains Mono", monospace; }
.lined { margin-top: -2mm; }
.rec { border-collapse: collapse; width: 100%; font: 2.7mm Inter, sans-serif; margin-top: 1mm; }
.rec td, .rec th { border: 0.3mm solid #000; padding: 1.6mm 1.5mm; height: 8mm; }
.rec th { font: 700 2.3mm "JetBrains Mono", monospace; text-align: left; }
.rec td:nth-child(odd) { width: 32%; }
.frame { border: 0.35mm solid #000; margin-top: 1mm; position: relative; flex: none; }
.frame.grow { flex: 1; min-height: 12mm; }
.notes { display: flex; gap: 4mm; }
.notes div { width: 38mm; height: 38mm; border: 0.35mm solid #000; background: #f4f4f4; }
.recl { display: flex; align-items: flex-end; gap: 2mm; height: 9mm; font: 2.8mm Inter, sans-serif; }
.recl i { flex: 1; border-bottom: 0.3mm solid #000; }
.cm, .cf { display: flex; gap: 6mm; }
.cm > div, .cf > div { flex: 1; }
.cover { justify-content: flex-start; }
.cv-series { font: 600 2.8mm "JetBrains Mono", monospace; letter-spacing: 0.6mm; text-transform: uppercase; color: #444; }
.cv-title { font: 800 12.5mm/1 Inter, sans-serif; margin-top: 4mm; letter-spacing: -0.3mm; }
.cv-sub { font: 4mm/1.3 Inter, sans-serif; margin: 3mm 0 4mm; color: #222; }
.cv-ex { border: 0.3mm solid #bbb; }
.cv-model { margin-top: 4mm; }
.cv-fade { margin-top: 3mm; }
.cv-meta { font: 600 2.8mm "JetBrains Mono", monospace; margin-top: 4mm; }
.cv-dev { font: 2.6mm "JetBrains Mono", monospace; margin-top: auto; color: #555; }
.h-title { font: 800 8mm/1.1 Inter, sans-serif; margin-bottom: 3mm; }
.h-lead { font: 700 3.2mm Inter, sans-serif; margin: 2.6mm 0 1.6mm; }
.h-note { font: 2.8mm/1.4 Inter, sans-serif; margin-top: 1.5mm; color: #333; }
.spread-demo { display: grid; grid-template-columns: 1fr 1fr; gap: 2mm; }
.spread-demo div { border: 0.4mm solid #000; padding: 2mm; display: flex; flex-direction: column; gap: 1mm; font: 2.7mm/1.35 Inter, sans-serif; }
.spread-demo b { font: 800 3.4mm Inter, sans-serif; }
.kinds { border-collapse: collapse; width: 100%; font: 3mm/1.35 Inter, sans-serif; }
.kinds td { border-bottom: 0.3mm solid #ccc; padding: 1.2mm 1mm; vertical-align: top; }
.kinds td:first-child { width: 22mm; }
.how .legend { position: static; }
.tips { font: 2.9mm/1.42 Inter, sans-serif; padding-left: 4.5mm; margin-top: 2mm; }
.toc-cols { display: grid; grid-template-columns: 1fr 1fr; gap: 6mm; }
.toc-part { font: 800 3.3mm Inter, sans-serif; margin: 2.6mm 0 1mm; border-bottom: 0.4mm solid #000; padding-bottom: 0.6mm; }
.toc-l { font: 2.85mm/1.55 Inter, sans-serif; }
.toc-l span { font: 600 2.4mm "JetBrains Mono", monospace; display: inline-block; width: 9mm; flex: none; color: #444; }
.toc-part, .toc-l, .op-list div { display: flex; align-items: baseline; }
.toc-part span { flex: 1; }
.toc-l em, .toc-part em, .op-list em { margin-left: auto; font: 600 2.5mm "JetBrains Mono", monospace; font-style: normal; padding-left: 2mm; }
.opener .op-n { font: 700 3mm "JetBrains Mono", monospace; letter-spacing: 0.6mm; text-transform: uppercase; color: #444; }
.opener .op-name { font: 800 12mm/1.05 Inter, sans-serif; margin: 2mm 0 3mm; }
.opener .op-intro { font: 3.6mm/1.45 Inter, sans-serif; margin-bottom: 5mm; max-width: 125mm; }
.op-list { margin-top: 5mm; border-top: 0.5mm solid #000; }
.op-list div { font: 600 3.6mm/1 Inter, sans-serif; padding: 2.6mm 0; border-bottom: 0.3mm solid #ccc; }
.op-list span { font: 700 2.7mm "JetBrains Mono", monospace; display: inline-block; width: 12mm; flex: none; }
.plate, .backcover { justify-content: center; }
.plate-in, .bc-in { margin: auto 0; }
.ref img { width: 100%; display: block; border: 0.3mm solid #999; }
.plate-note { margin-top: 3mm; }
.plate-cap { font: 2.4mm "JetBrains Mono", monospace; color: #555; margin-top: 1.5mm; text-align: right; }
.bc-title { font: 800 8mm/1.1 Inter, sans-serif; margin: 2mm 0 5mm; }
.bc-note { font: 3.2mm/1.4 Inter, sans-serif; margin-top: 3mm; }
.prog { border-collapse: collapse; width: 100%; font: 2.55mm/1.25 Inter, sans-serif; }
.prog th { font: 700 2.2mm "JetBrains Mono", monospace; text-align: left; border-bottom: 0.4mm solid #000; padding: 0.8mm; }
.prog td { border-bottom: 0.25mm solid #ccc; padding: 1.2mm 0.8mm; white-space: nowrap; }
.prog td:first-child { white-space: normal; }
.about p { font: 3.2mm/1.5 Inter, sans-serif; margin-bottom: 3mm; }
.small { font-size: 2.4mm !important; color: #555; }
${B.css || ''}`; };

// ---------- render
mkdirSync(opt.out, { recursive: true });
const img = makeRefs();
buildPages(img);
const pagesHtml = pageList.join('\n').replace(/\{\{p:([^}]+)\}\}/g, (_, id) => { if (!pageOf[id]) throw new Error(`no page for ${id}`); return String(pageOf[id]); });
const html = `<!doctype html><html><head><meta charset="utf-8"><title>${esc(book.title)}</title><style>${css()}</style></head><body>${pagesHtml}</body></html>`;
const base = `${B.meta.base}-${opt.page}`;
const htmlPath = join(opt.out, `${base}.html`);
writeFileSync(htmlPath, html);

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 600, height: 800 }, deviceScaleFactor: 1 });
  await page.goto(pathToFileURL(htmlPath).href, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  const pdf = join(opt.out, `${base}.pdf`);
  await page.pdf({ path: pdf, width: `${L.PAGE.w}mm`, height: `${L.PAGE.h}mm`, printBackground: true });
  // overflow check: flag pages whose content spills past the page or whose practice area clips its rows
  const spill = await page.$$eval('section.page', ps => ps.map((p, i) => {
    const b = p.querySelector('.body') || p, d = p.querySelector('.drill');
    return b.scrollHeight > b.clientHeight + 2 || (d && d.scrollHeight > d.clientHeight + 2) ? i + 1 : 0;
  }).filter(Boolean));
  if (spill.length) console.warn('content overflows on pages:', spill.join(', '));
  const thumbs = join(opt.out, 'thumbs'); rmSync(thumbs, { recursive: true, force: true }); mkdirSync(thumbs, { recursive: true });
  const all = await page.$$('section.page');
  for (let i = 0; i < all.length; i++) await all[i].screenshot({ path: join(thumbs, `p${String(i + 1).padStart(3, '0')}.png`) });
  execFileSync('montage', [join(thumbs, 'p*.png'), '-tile', '10x', '-geometry', '238x317+6+6', '-background', '#ddd', join(opt.out, `contact-${opt.page}.png`)]);
  const pick = B.meta.preview.map(id => pageOf[id]);
  const files = pick.flatMap(n => [n, n + 1].map(k => join(thumbs, `p${String(k).padStart(3, '0')}.png`)));
  execFileSync('montage', [...files, '-tile', '2x', '-geometry', '+8+8', '-background', '#ddd', join(opt.out, `sheets-${opt.page}.png`)]);
  console.log(`wrote ${pdf} (${all.length} pages), contact-${opt.page}.png and sheets-${opt.page}.png`);
} finally {
  await browser.close();
}
