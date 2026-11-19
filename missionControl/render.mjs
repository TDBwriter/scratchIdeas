// Render an HTML panel to an e-ink-ready PNG plus a hotspot map.
//
//   node render.mjs <panel.html> [outBase] [width] [height]
//
// Produces:
//   <outBase>.png           8-bit grayscale, posterized to 16 levels (e-ink friendly)
//   <outBase>.hotspots.json [{action, x, y, w, h}] for every [data-action] element
//
// The Kindle app shows the PNG full-screen and maps taps to hotspot actions.
// Requires: playwright (Chromium), and ImageMagick `convert` for the grayscale step.

import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { writeFileSync, renameSync } from 'node:fs';
import { resolve, basename } from 'node:path';
import { pathToFileURL } from 'node:url';

// CommonJS resolution so a local or global (NODE_PATH) playwright install both work.
const { chromium } = createRequire(import.meta.url)('playwright');

const [htmlArg, outArg, wArg, hArg] = process.argv.slice(2);
if (!htmlArg) {
  console.error('usage: node render.mjs <panel.html> [outBase] [width] [height]');
  process.exit(1);
}
const html = resolve(htmlArg);
const outBase = resolve(outArg ?? html.replace(/\.html?$/, ''));
const width = Number(wArg ?? 1860);   // Kindle Scribe 2022/2024, portrait
const height = Number(hArg ?? 2480);

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
  await page.goto(pathToFileURL(html).href);
  await page.evaluate(() => document.fonts.ready);

  const hotspots = await page.$$eval('[data-action]', els =>
    els.map(el => {
      const r = el.getBoundingClientRect();
      return { action: el.dataset.action, x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) };
    })
  );

  const rawPng = `${outBase}.raw.png`;
  await page.screenshot({ path: rawPng, fullPage: false });

  // Grayscale and 16 gray levels: crisp text, no colour, predictable on e-ink.
  try {
    execFileSync('convert', [rawPng, '-colorspace', 'Gray', '-posterize', '16', '-type', 'Grayscale', '-depth', '8', `${outBase}.png`]);
    execFileSync('rm', ['-f', rawPng]);
  } catch {
    console.warn('ImageMagick not found; keeping the colour screenshot as-is.');
    renameSync(rawPng, `${outBase}.png`);
  }

  const panel = basename(outBase);
  writeFileSync(`${outBase}.hotspots.json`, JSON.stringify({ panel, width, height, hotspots }, null, 2) + '\n');
  console.log(`wrote ${outBase}.png and ${outBase}.hotspots.json (${hotspots.length} hotspots)`);
} finally {
  await browser.close();
}
