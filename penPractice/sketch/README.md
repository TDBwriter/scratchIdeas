# Sketch What You See: Book Builder

Builds the complete **Sketch What You See** workbook (release R2) from:

- `lessons.mjs`: the content, plus the extras for each sheet (repeat tips, from-life approach, guide-line notes)
- the pencil-sketch generator (`../../sketchArt/sketch.mjs`): the reference pictures

**Status: e-ink edition built as front/back sheets, waiting for approval.** After approval, the same builder produces the Letter and A4 loose-leaf print editions (`--page letter` / `--page a4`). Those need a review pass.

```sh
cd penPractice/sketch
node build.mjs                 # e-ink edition → ../out/sketch/sketch-what-you-see-eink.pdf
node build.mjs --page letter   # print editions (after approval)
node build.mjs --refs          # regenerate the reference sketches
```

Requires Playwright (Chromium) and ImageMagick.

## Layout: every lesson unit is one sheet, front and back

- **Front** (odd page): the instructions and details. **Back** (even page): the prompt and the practice space.
- **Loose-leaf print, double-sided** (flip on the long edge): every sheet stands on its own. You can pull it out, take it along, or reprint it for more practice.
- **E-reader**: the practice is the next page, and the instructions are one swipe back.
- **No navigation depends on tapping links.**
  - Each lesson's "why" sits on its own front.
  - Footers say "practice overleaf ▸" and "◂ instructions overleaf".
  - Page numbers sit on the outer edge: right on fronts, left on backs.
  - The contents, part openers and progress tracker list page numbers.
- **The builder refuses to build if a sheet would start on an even page.**

## Sheets per lesson

| Sheet | Front (instructions) | Back (practice) |
|---|---|---|
| **How to / Practice** | The idea, diagram, steps, check yourself, common slip, why it works | The task line, then the drill with help that fades (trace → dots → free) |
| **Step 2** (S3.4 only) | What changes with half the grid, steps, check | The half-grid transfer |
| **Again / Repeat** (13 drill lessons) | "This time…" tip, the diagram, the steps again, check, slip | The same drill with fresh targets |
| **From life** (24 lessons) | The subject, the Look/Measure/Mark/Check row, how to approach it, the skill step by step, real-things-first, what the guide lines on the sketch show, check, slip | The prompt, the reference sketch with guide lines, the drawing frame |

## The whole e-ink edition (150 pages = 75 sheets)

| Sheet | Front | Back |
|---|---|---|
| 1 | Cover | How this book works |
| 2 | Contents | Progress tracker |
| 7 part dividers | Part intro and lesson list | Sketchbook illustration |
| 65 lesson sheets | Instructions | Practice |
| Last | About this book | Back cover |

Page size: 157.5 × 210 mm, true size on Kindle Scribe 2022/2024 and reMarkable 2.

## Review files

- `../out/sketch/sheets-eink.png`: 6 sheets, front and back side by side.
- `../out/sketch/contact-eink.png`: every page.
