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

## Part 6: In the field — sketching as observation

Field sketching as a practical skill: you observe terrain, angles, distances and ways in and out deliberately instead of glancing past them. A sketch keeps what matters and strips the noise. The sketches are made from public places, for navigation, orientation and everyday awareness.

| Lesson | Theory | Practice |
|---|---|---|
| S6.1 The field sketch | Sketch vs photo; orientation first (place, time, facing/north, left and right limits); big lines, then numbered labels; only what you see (FM 3-25.26 definition) | A farm scene with orientation, limits and numbered landmarks, then a frame with a PLACE / DATE / TIME / FACING header and a north arrow |
| S6.2 Drawing from memory | Seeing vs noticing; Kim’s Game (Kipling, 1901); look with a plan; the check is the lesson | Study the diner sketch on the theory page for 60 s, turn over, draw from memory, then check against a list of what is often missed |
| S6.3 Route and area sketches | Plan view from walking; north arrow, rough scale, routes, landmarks, exits; proportion not precision; the 1903 *Manual of Field Sketching and Reconnaissance* (pacing, timing) | Dot-grid map paper with a north arrow and key |
| S6.4 What you can and can’t see | Vantage-point sketches, left and right limits, reference points, dead ground, range arcs | A field-of-view fan template, plus five reference-point lines with ranges |
| S6.5 Panoramic sketches | The view as a strip; horizon, then skylines far to near; numbered reference points with ranges and bearings; the observer’s tradition | Example panorama with a bearing scale and numbered landmarks, then two panorama strips with bearing rulers |
| S6.6 Judging distance | How distance fools you; a unit you know; known sizes (door 2 m, storey 3 m, car 4.5 m); bracket, then check | Sketch and number six landmarks, plus an estimate / method / checked / error log |

**In the field asides:** eight earlier theory pages tie their skill to observation:
- angles → bearings
- blind contour → memory drills
- negative space → routes
- measuring → distance
- alignments → position lines
- eye level → panoramas
- depth cues → range
- squinting → terrain masses

The old “Field sketching” lesson is now **S7.3 Sketching on location**, in Part 7.

## The whole e-ink edition (88 pages = 44 sheets)

| Sheet | Front | Back |
|---|---|---|
| 1 | Cover | How this book works |
| 2 | Contents | Progress tracker |
| 8 part dividers | Part intro and lesson list | Sketchbook illustration |
| 33 lesson sheets | Theory | Practice |
| Last | About this book | Back cover |

Page size: 157.5 × 210 mm, true size on Kindle Scribe 2022/2024 and reMarkable 2.

## Review files

- `../out/sketch/sheets-eink.png`: 6 sheets, front and back side by side.
- `../out/sketch/contact-eink.png`: every page.
