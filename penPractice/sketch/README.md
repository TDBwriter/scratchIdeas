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

The part draws on the **Manual of Field Sketching and Reconnaissance** (War Office, London, 1903; public domain). It quotes the manual's rules, uses four of its plates (in `plates/`, credited in `../../inkArt/licences.csv`), and builds its conventions into the practice pages: the "Sketch of ___ from ___ facing ___" heading, the field-book column read from the bottom up, and the base line with intersecting rays.

| Lesson | Theory | Practice |
|---|---|---|
| S6.1 The field sketch | Sketch vs photo; orientation first; big lines, then numbered labels; “nothing but what has been seen” (1903) and the FM 3-25.26 definition | An annotated farm scene, then a frame with a SKETCH OF / FROM / FACING / DATE / SIGNED header and a north arrow |
| S6.2 Drawing from memory | Seeing vs noticing; Kim’s Game (Kipling, 1901); look with a plan; the check is the lesson | Study the diner sketch on the theory page for 60 s, turn over, draw from memory, then check against a list of what is often missed |
| S6.3 Finding north | Sun at solar noon, the shadow stick, the watch method (“very rough”, 1903), the Pole Star and Southern Cross, magnetic vs true north | Shadow-stick frame, a log comparing five methods against the phone, then add north to a sketch |
| S6.4 The route log | Traverses; the field-book column (bottom up); distance by time (~80 m a minute); “small errors in bearings neutralise one another”. Plate XIV beside the text | Field-book column and plotting frame side by side |
| S6.5 Area sketches: mapping by eye | Eye-sketching: pace a base line, draw rays from each end, fix landmarks where rays cross; long base; words beat symbols. Plate IV beside the text | Example of intersection, then dot-grid paper with a ready base line A–B |
| S6.6 What you can and can’t see | Vantage-point sketches, limits, reference points, dead ground, range arcs | Field-of-view fan template plus reference-point lines with ranges |
| S6.7 Panoramic sketches | Outline, unshaded; exaggerate what matters; heading and names on leader lines. The 1899 Tugela sketch (Plate XVIII) beside the text | Example panorama with a bearing scale, then two strips with heading lines and bearing rulers |
| S6.8 Judging distance | How distance fools you; a unit you know; known sizes; bracket, then check | Six numbered landmarks plus an estimate / method / checked / error log |

The Part 6 opener shows the manual’s Fig. 21.

**In the field asides:** eight earlier theory pages tie their skill to observation:
- angles → bearings
- blind contour → memory drills
- negative space → routes
- measuring → distance
- alignments → resection
- eye level → panoramas
- depth cues → range
- squinting → terrain masses

The old “Field sketching” lesson is now **S7.3 Sketching on location**, in Part 7.

## The whole e-ink edition (92 pages = 46 sheets)

| Sheet | Front | Back |
|---|---|---|
| 1 | Cover | How this book works |
| 2 | Contents | Progress tracker |
| 8 part dividers | Part intro and lesson list | Sketchbook illustration |
| 35 lesson sheets | Theory | Practice |
| Last | About this book | Back cover |

Page size: 157.5 × 210 mm, true size on Kindle Scribe 2022/2024 and reMarkable 2.

## Review files

- `../out/sketch/sheets-eink.png`: 6 sheets, front and back side by side.
- `../out/sketch/contact-eink.png`: every page.
