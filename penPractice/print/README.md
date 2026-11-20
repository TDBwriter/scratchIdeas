# Clear & Quick Print: Book Builder

Builds the complete **Clear & Quick Print** handwriting workbook (release R1) from:

- `strokes.mjs`: the book's own hand. Every capital, lowercase letter, number and the punctuation used in practice text is stored as ordered pen strokes. Simple, unjoined, school-neutral print with a single-storey a and g.
- `lessons.mjs`: the content (23 lessons in 6 parts), the "say it as you write" stroke talk, and the part plates.
- the pencil-sketch generator (`../../sketchArt/sketch.mjs`): the part plates and back cover.

**Status: e-ink edition built as front/back sheets, waiting for approval.** After approval, the same builder makes the Letter and A4 loose-leaf print editions (`--page letter` / `--page a4`). Those need a review pass.

```sh
cd penPractice/print
node build.mjs                 # e-ink edition → ../out/print/clear-quick-print-eink.pdf
node build.mjs --page letter   # print editions (after approval)
node build.mjs --refs          # regenerate the sketches
node glyphtest.mjs glyphs.png  # check every letter's stroke order and direction
```

Requires Playwright (Chromium) and ImageMagick.

## One stroke model, everything agrees

Every letter on every page is drawn from the same pen paths. Units: cap height = 1, top line 0, dashed middle line 0.5, baseline 1, descender line 1.45. Each stroke is an ordered list of points: the order is the stroke order, and the point order is the direction. Because of this:

- **Exemplars** on the fronts show big letters with numbered stroke starts and direction arrows.
- **Trace letters** are the same strokes in gray, with a black dot where each stroke starts.
- **Dotted letters** are the same strokes as a dotted path.
- **Model text** (sentences, notes, captions) is written in the same hand.
- The R3 iPad app and R4 can replay and score against the same data later.

The guide lines and help fade the same way through the book:

- Letters: trace → dotted → free.
- Ruling: four lines (top, dashed middle, baseline, descender) → two lines → one line → blank paper.

## Layout: every lesson unit is one sheet, front and back

The format is the same as Sketch What You See:

- **Front** (odd page): instructions. **Back** (even page): practice.
- **Loose-leaf print, double-sided**, flipped on the long edge. Every sheet stands on its own, so you can reprint it for more practice.
- **No navigation depends on tapping links.**
  - Footers say "practice overleaf ▸" and "◂ instructions overleaf".
  - Page numbers sit on the outer edge.
  - The contents, part openers and progress tracker list page numbers.
- **The builder refuses to build if a sheet would start on an even page.** It also warns if any page or practice area overflows.

## Sheets per lesson

| Sheet | Front (instructions) | Back (practice) |
|---|---|---|
| **How to / Practice** | The idea, the letters with stroke order and direction, "say it as you write", steps, check yourself, common slip, why it works | One row per letter (trace two → dotted two → free), then practice words |
| **Again / Repeat** (letters + 7 drills) | "This time…" tip, the letters again, the steps, check, slip | The same letters with less help (trace one → dotted one → free) and new words |
| **Use it** (P1.5, P1.6, P3.4, P4.3, P4.4) | The real task, the four rules, how to approach it, check, slip | Real writing: phone numbers and dates, labels, forms with letter boxes, an envelope, sticky notes, a card, a list, a message, a read-back test |

The non-letter lessons have their own practice pages:

- warm-up patterns
- day-one and final samples, with letters-per-minute records
- letter-spacing and word-spacing rows (word gaps marked with a faint o)
- guide lines that fade away
- blank boxes
- 30-second timed trials
- pangrams
- copy-the-model lists, messages and forms
- commonly confused letters (a/d, u/v, n/h, 1/l/I, 0/O, 5/S, g/q/9, cl/d, rn/m…)

## The whole e-ink edition (108 pages = 54 sheets)

| Sheet | Front | Back |
|---|---|---|
| 1 | Cover | How this book works |
| 2 | Contents | Progress tracker |
| 6 part dividers | Part intro and lesson list | Sketchbook plate with a field note in the book's hand |
| 44 lesson sheets | Instructions | Practice |
| Last | About this book | Back cover |

The 23 lessons:

| Part | Lessons |
|---|---|
| 0 Start here | P0.1 Set up to write · P0.2 Day-one sample |
| 1 Capitals | P1.1 E F H I L T · P1.2 A K M N V W X Y Z · P1.3 C G O Q S · P1.4 B D J P R U · P1.5 Numbers 0–9 · P1.6 Capitals review |
| 2 Lowercase | P2.1 l i t j · P2.2 n m r h · P2.3 a c d e g o q · P2.4 k v w x y z · P2.5 b p u f s · P2.6 Descenders g j p q y |
| 3 Spacing | P3.1 Letter spacing · P3.2 Word spacing · P3.3 On the line · P3.4 Without lines |
| 4 Speed | P4.1 Easy speed · P4.2 Pangrams · P4.3 Notes, lists and forms · P4.4 Can someone else read it? |
| 5 Finish | P5.1 Final sample, compared with day one |

Page size: 157.5 × 210 mm, true size on Kindle Scribe 2022/2024 and reMarkable 2.

## Review files

- `../out/print/sheets-eink.png`: 6 sheets, front and back side by side.
- `../out/print/contact-eink.png`: every page.
