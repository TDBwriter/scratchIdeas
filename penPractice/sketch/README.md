# Sketch What You See: Book Builder

Builds the complete **Sketch What You See** workbook (release R2) from:

- `lessons.mjs`: the content, plus the facing-page extras (repeat tips, from-life approach, guide-line notes)
- the pencil-sketch generator (`../../sketchArt/sketch.mjs`): the reference pictures

**Status: e-ink edition built in facing spreads, waiting for approval.** After approval, the same builder produces the Letter and A4 print editions (`--page letter` / `--page a4`). Those need a review pass, plus a gutter margin and an even page count for binding.

```sh
cd penPractice/sketch
node build.mjs                 # e-ink edition → ../out/sketch/sketch-what-you-see-eink.pdf
node build.mjs --page letter   # print editions (after approval)
node build.mjs --refs          # regenerate the reference sketches
```

Requires Playwright (Chromium) and ImageMagick.

## Layout: everything comes in facing spreads

Each **left page** (even number) carries the instructions and details. The **right page** (odd number) facing it carries the prompt and the practice space.

- In **print**, both lie open together.
- On an **e-reader**, the instructions are always one swipe back.
- **No jumping around**: there are no "Why?" buttons and no back-of-book section. Everything a reader needs for a practice page is on the page facing it.
- **Page numbers** sit in the outer corners. The contents, part openers and progress tracker list page numbers.
- **Footers** say "practice on the facing page ▸" and "◂ instructions on the facing page". The builder refuses to build if a spread would start on an odd page.

## Spreads per lesson

| Spread | Left page (instructions) | Right page (practice) |
|---|---|---|
| **How to → Practice** | The idea, diagram, steps, check yourself, common slip, why it works | The task line, then the drill with help that fades (trace → dots → free) |
| **Step 2** (S3.4 only) | What changes with half the grid, steps, check | The half-grid transfer |
| **Again → Repeat** (13 drill lessons) | "This time…" tip, the diagram, the steps again, check, slip | The same drill with fresh targets |
| **From life: how to → From life** (24 lessons) | The subject, the Look/Measure/Mark/Check row, how to approach it, the skill step by step, real-things-first, what the guide lines on the sketch show, check, slip | The prompt, the reference sketch with guide lines, the drawing frame |

## The whole e-ink edition (149 pages)

- **Page 1**: the cover, on its own.
- **74 spreads**:
  - how this book works / contents
  - 7 part openers: part intro and lessons on the left, a sketchbook illustration on the right
  - 65 lesson spreads
  - progress tracker / about this book
- **Page size**: 157.5 × 210 mm, true size on Kindle Scribe 2022/2024 and reMarkable 2.

## Review files

- `../out/sketch/spreads-eink.png`: 8 representative spreads, as they'd lie open.
- `../out/sketch/contact-eink.png`: every page.
