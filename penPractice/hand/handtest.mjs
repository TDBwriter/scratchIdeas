// Renders a hand for checking: every letter as an exemplar (numbered stroke starts, arrows), then sample words.
//   node handtest.mjs <module path> <export name> out.png ["letters"] ["word word …"]
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { setPage, setHand, exemplar, writeText, rules, svg } from './lib.mjs';
const { chromium } = createRequire(import.meta.url)('playwright');

const [mod, name, out, letters = 'abcdefghijklm nopqrstuvwxyz', words = 'minimum bobble overwhelm quickly jazz lifted owl wave Brown fox 2027'] = process.argv.slice(2);
setPage('eink');
const H = (await import(pathToFileURL(resolve(mod)).href))[name];
setHand(H);
const W = 300;
let body = '', y = 0;
for (const chunk of letters.split(' ')) { const e = exemplar(chunk, W, 60, 22); body += `<g transform="translate(0 ${y})">${e.s}</g>`; y += e.h; }
const C = 12;
for (const line of words.split('|')) {
  body += `<g transform="translate(0 ${y})">${rules(4, W - 8, 4 + (H.pad || 0) * C, C, 'four')}${writeText(line, 6, 4 + (H.pad || 0) * C, C, 'ink').s}</g>`; y += C * (1.75 + 2 * (H.pad || 0));
  body += `<g transform="translate(0 ${y})">${rules(4, W - 8, 4 + (H.pad || 0) * C, C, 'four')}${writeText(line, 6, 4 + (H.pad || 0) * C, C, 'ghost').s}</g>`; y += C * (1.75 + 2 * (H.pad || 0));
}
const html = `<html><body style="margin:0;background:#fff">${svg(W, y + 4, body)}</body></html>`;
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1200, height: 1000 }, deviceScaleFactor: 1 });
await p.setContent(html);
await p.screenshot({ path: out, fullPage: true });
await b.close();
