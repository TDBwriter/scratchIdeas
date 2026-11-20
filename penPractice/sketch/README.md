# Sketch What You See: Book Builder

Builds the complete **Sketch What You See** workbook (release R2) from:

- `lessons.mjs`: the content
- the pencil-sketch generator (`../../sketchArt/sketch.mjs`): the reference pictures

**Status: e-ink edition built, waiting for approval.** After approval, the same builder produces the Letter and A4 print editions (`--page letter` / `--page a4`). Those layouts still need a review pass.

```sh
cd penPractice/sketch
node build.mjs                 # e-ink edition → ../out/sketch/sketch-what-you-see-eink.pdf
node build.mjs --page letter   # print editions (after approval)
node build.mjs --refs          # regenerate the reference sketches
```

Requires Playwright (Chromium) and ImageMagick.

## What's in the e-ink edition (110 pages)

- **Front matter**:
  - cover
  - "How this book works": the Look → Measure → Mark → Check habit, the four page types, and the trace → dots → free legend
  - linked contents
- **7 part openers**, each with a sketchbook illustration and links to its lessons.
- **27 lessons**, each with:

  | Page | What's on it |
  |---|---|
  | **Learn** | The idea, a diagram, numbered steps, the common slip |
  | **Practice** | Help that fades: trace → dots → free |
  | **Repeat** | Same drill, fresh targets, for drill lessons |
  | **From life** | A prompt, a reference sketch (often with construction lines drawn over it), and a drawing frame |

- **Back matter**: "Why it works" (linked from every page's **Why?** button, with links back), a progress tracker, and "About this book".
- **Page size**: 157.5 × 210 mm, true size on Kindle Scribe 2022/2024 and reMarkable 2. 328 internal links.

## Page types

- **Drills**:
  - lines, curves, angles, contours, timed blind contours
  - basic shapes, ellipses, negative space
  - depth clues, one- and two-point perspective boxes, cylinders
  - value scales, light on forms, texture swatches
- **Reference pages**:
  - shapes-in-things, envelope, measuring units, alignments
  - grid transfer (full grid, then half grid, then none)
  - find-the-horizon
  - three-value squint comparison
- **Planning pages**: thumbnails, the four-pass strip, field sketching (timed boxes, people, note lines), capstone.

**Guide overlays** are drawn from data the sketch generator writes next to each picture (`<scene>-<seed>.json`): horizon, vanishing points with lines running to them, envelopes, basic shapes, stool ellipses, people as an oval and a box, alignment lines, a measuring unit with ticks, and near/middle/far bands.

## Review files

- `../out/sketch/contact-eink.png`: every page.
- `../out/sketch/highlights-eink.png`: 12 representative pages.
