# Sketch What You See: Book Builder

Builds the complete **Sketch What You See** workbook (release R2) from:

- `theory.mjs`: the theory side of every sheet, and each lesson's practice prompt
- `lessons.mjs`: lesson structure (part, title, diagram, practice type, reference sketches) and the guide-line notes
- the pencil-sketch generator (`../../sketchArt/sketch.mjs`): the reference pictures

**Status: e-ink edition rebuilt as one theory/practice sheet per lesson, waiting for approval.** After approval, the same builder produces the Letter and A4 loose-leaf print editions (`--page letter` / `--page a4`). Those need a review pass.

```sh
cd penPractice/sketch
node build.mjs                 # e-ink edition → ../out/sketch/sketch-what-you-see-eink.pdf
node build.mjs --page letter   # print editions (after approval)
node build.mjs --refs          # regenerate the reference sketches
```

Requires Playwright (Chromium) and ImageMagick.

## Layout: one sheet per lesson — theory on the front, practice on the back

- **Front: theory.** The idea behind the skill, as a short deep dive:
  - how seeing works (the constancies, symbol-drawing)
  - why the technique works (the pivots of the arm, motor rehearsal, the cues the eye reads as depth)
  - how artists have solved the problem (Alberti, Brunelleschi, Leonardo, Ruskin, Nicolaides, Dow…)

  One key sentence, three or four short sections, one figure. The theory pages don't repeat the practice instructions (`theory.mjs`).
- **Back: practice.** A one- or two-sentence prompt, one or two examples, then room to draw.
  - Drill lessons show the technique diagram as a worked example, then a large open frame.
  - Lessons built on a reference sketch (grid copy, three values, four passes, envelope, measuring, alignments, field page, capstone) show the sketch or a guided strip, then room.
- **No repeat pages.** On a tablet you erase and practise again; on paper you print the sheet again. The progress tracker counts sessions.
- **Where the sketches go:**
  - Where a drill lesson has a reference sketch, it sits beside the theory text with its guide lines explained.
  - Otherwise the theory page has its own small figure, or the technique diagram.
- **Loose-leaf print, double-sided**, flipped on the long edge. Every sheet stands on its own.
- **No navigation depends on tapping links.** Footers say "practice overleaf ▸" / "◂ instructions overleaf", and page numbers sit on the outer edge.

## The whole e-ink edition (74 pages = 37 sheets)

| Sheet | Front | Back |
|---|---|---|
| 1 | Cover | How this book works |
| 2 | Contents | Progress tracker |
| 7 part dividers | Part intro and lesson list | Sketchbook illustration |
| 27 lesson sheets | Theory | Practice |
| Last | About this book | Back cover |

Page size: 157.5 × 210 mm, true size on Kindle Scribe 2022/2024 and reMarkable 2.

## Review files

- `../out/sketch/sheets-eink.png`: 6 sheets, front and back side by side.
- `../out/sketch/contact-eink.png`: every page.
