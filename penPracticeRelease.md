# Pen Practice: Release Plan

Four releases, one shared foundation. This builds on `penPracticeSeries.md` (concept and research) and the generator in `penPractice/`.

| # | Release | Format | Runs on |
|---|---|---|---|
| R1 | **Clear & Quick Print**: English block printing for legibility and speed | PDF workbook | Kindle Scribe, reMarkable, iPad note apps, print (Letter / A4) |
| R2 | **Sketch What You See**: freehand observational drawing | PDF workbook | Same as R1 |
| R3 | **Walkthrough**: guided player for both workbooks | iPad app (Apple Pencil) | iPad |
| R4 | **Cursive Coach**: cursive training with your finger | Phone app | iPhone first, Android later |
| R5 | **Join It Up**: modern cursive workbook | PDF workbook | Same as R1 |
| R6 | **Street Hand**: graffiti-style writing (street caps, bounce, handstyle, throw-ups) | PDF workbook | Same as R1 |

Titles are working names. Plus **R0: the free sampler** (already built), used for device testing and as a giveaway that brings people to the paid books.

**Order: print book first, then sketch book.** Print reuses the drill types that already work and needs no photo rights. The sketch book needs new page types and licensed reference photos.

---

## Shared foundation (build once, use in all four)

| Piece | What it is | Status |
|---|---|---|
| **Lesson format v1** | JSON per lesson: real-mm sizes, guide levels (trace / dots / free), self-check, the "why", audience, handedness | Draft in `penPractice/lessons/` |
| **Generator** | Lesson JSON → PDF editions (+ PNG previews). Random seeds give fresh targets; `--left` gives left-handed | **Built** (`penPractice/build.mjs`): e-ink, Letter and A4 editions |
| **Geometry sidecar** | For each page: where every target, dot and cell is. The apps use it as an answer key for scoring | To build (same data the generator already computes) |
| **Stroke library** | Pen paths for each letter and shape: stroke order, direction, timing. Feeds stroke-order arrows in the PDFs, animations in both apps, and scoring in Cursive Coach | **Started**: block print (capitals, lowercase, numbers) as drawn strokes in `penPractice/print/strokes.mjs`, used by R1. Still to do: timing, cursive, and hand-recorded paths from an authoring mode inside R3 |
| **Scoring library** (Swift) | Line straightness, endpoint error, ellipse fit, shape match against an exemplar, stroke order and direction | To build with R3; reused by R4 |
| **Look and feel** | Inter + JetBrains Mono (open licences), trace/dots/free icons, black-and-white first | Started (sampler) |

---

## PDF editions (R1, R2)

| Edition | Page size | Covers | Notes |
|---|---|---|---|
| **E-ink 3:4** | 157.5 × 210 mm | **Kindle Scribe 2022/2024 and reMarkable 2 at true size** (reMarkable 2's screen is 157.8 × 210.4 mm). Scales to the 11" Scribe (2025, ~1.06×), reMarkable Paper Pro (~1.14×) and iPad note apps (all 3:4) | Grayscale-first. Internal links (reMarkable supports them since 2.6) |
| **Letter** | 8.5 × 11 in | US print, and an optional print-on-demand paperback | Same lessons laid out again with more rows. Real sizes kept |
| **A4** | 210 × 297 mm | International print | Same |
| *Later* | 16:9 | reMarkable Paper Pro Move (7.3") | Skip in v1 |

**Device check before every release:**

- Scribe (sent with Send to Kindle):
  - the page fills the screen
  - you can write on it with the pen
  - the links work
- reMarkable (imported): writing and links work.
- iPad (GoodNotes / Notability): the PDF opens and you can write on it.
- One printed Letter page and one A4 page: check that sizes are true and the grays print.

---

## R1: Clear & Quick Print (PDF)

**Promise:** handwriting anyone can read, at a speed you can actually use.

**Status:** the e-ink edition is built as **front/back sheets** and is waiting for final approval.
- 108 pages = 54 sheets: `penPractice/out/print/clear-quick-print-eink.pdf`.
- The builder is in `penPractice/print/`.
- It uses the same format rule as R2 (below).
- Print editions come next.

**Scope:** unjoined print, block **capitals** first (most legible), then **lowercase print**, then speed. Letterforms are simple and school-neutral: single-story a and g, no tails.

| Part | Lessons | Content |
|---|---|---|
| 0 | Start here | Grip and posture, pen on glass, how the guide lines work. **Day-1 baseline**: copy a sentence and time it |
| 1 | Capitals by stroke family (6) | Straight lines EFHILT · diagonals AKMNVWXYZ · rounds CGOQS · mixed BDJPRU · numerals 0–9 · review |
| 2 | Lowercase by stroke family (6) | Stems i l t j · arches n m r h · rounds a c d e g o q · diagonals k v w x y z · combos b p u f s · descenders |
| 3 | Spacing and alignment (4) | Letter spacing · word spacing · steady baseline and x-height · writing without lines |
| 4 | Speed (4) | Timed rows (30 s / 60 s) · pangrams · copy notes, lists and forms · "can someone else read it?" check |
| 5 | Finish | **Final test**: repeat the day-1 sentence and compare legibility and letters per minute |

- **23 lessons**, as built:
  - Every lesson has a how-to / practice sheet.
  - Letter lessons and 7 drills add an again / repeat sheet with less help.
  - 5 lessons add a **use it** sheet for real writing: numbers, labels, forms, an envelope, a card, a list, a message, a read-back test.
- **No font for the letters.** Every letter is drawn from our own **stroke model** (`penPractice/print/strokes.mjs`): ordered pen strokes for capitals, lowercase, numbers and punctuation. Exemplars (numbered stroke starts + arrows), trace letters, dotted letters and model sentences all come from it. This is the first piece of the shared **stroke library**. The apps can replay and score against it, and hand-recorded paths can replace it later.
- **Help fades**:
  - Letters go trace → dotted → free.
  - Guide lines go four lines → two → one → blank paper.
- **Page types built**:
  - letter rows and word rows
  - warm-ups
  - day-one and final samples with letters-per-minute records
  - spacing rows
  - sentence rows with word-gap markers
  - fading guide lines
  - blank boxes
  - 30-second timed trials
  - pangrams
  - copy-the-model
  - confused-letter pairs
  - form boxes
  - progress tracker
- **Kids edition later**: bigger guide lines, fewer rows, playful words.

## R2: Sketch What You See (PDF)

**Promise:** learn to draw what's in front of you, not what you think it looks like.

**Status:** the e-ink edition is rebuilt as **one sheet per lesson — theory on the front, practice on the back** (92 pages = 46 sheets, 35 lessons in 8 parts — including **Part 6, In the field**, built on the public-domain 1903 *Manual of Field Sketching and Reconnaissance*: field sketches, drawing from memory, finding north, route logs, mapping by eye, what you can and can’t see, panoramas, judging distance; `penPractice/out/sketch/sketch-what-you-see-eink.pdf`, builder in `penPractice/sketch/`) and is waiting for final approval. The handwriting books follow once it is approved. Print editions come next.

**Format rule for every edition:**
- Print is **loose leaf, double-sided**, not bound.
- Every lesson is **one sheet**: **theory** on the front (a real explanation of the idea, not a repeat of the steps), and on the back a one-line **prompt, one or two examples and room to practise**.
- **No repeat pages**: on a tablet you erase and practise again; on paper you reprint the sheet. Each sheet stands on its own. On an e-reader, front and back are one swipe apart.
- No navigation that depends on tapping links.
- Page numbers sit on the outer edge.

**Full lesson text: `sketchWhatYouSee.md`.** It builds lines → shapes → proportion → space → light → scenes, with one habit throughout: **Look → Measure → Mark → Check**.

| Part | Lessons | Content |
|---|---|---|
| 0 | Start here (1) | Set up to see: posture, grip, moving from the shoulder; day-1 "before" drawing |
| 1 | Lines (5) | Straight lines · curves and arcs · seeing angles · contour line · blind contour |
| 2 | Shapes (4) | The four basic shapes · ellipses · seeing shapes in things · negative space |
| 3 | Proportion and placement (4) | The envelope · measuring with your pen · plumb lines and levels · the grid as training wheels |
| 4 | Space and perspective (5) | Eye level and horizon · depth clues · 1-point · 2-point · everything is boxes and cylinders |
| 5 | Light and value (4) | 5-step value scale · light on simple forms · squint and group shadow shapes · texture and edges |
| 6 | Putting it together (4) | Thumbnails · the four-pass drawing · field sketching (people, time limits, notes) · capstone + day-1 comparison |

- **Page types needed**:
  - `reference-and-draw`: photo on top, drawing area below
  - `grid-transfer`
  - `blind-contour`: reference plus a "don't look at the page" cue
  - `value-scale`
  - `timed-boxes`
  - `object-prompt`: "draw something near you"
- **Illustrations and art direction**: **pencil sketches from an observer's sketchbook**, generated by `sketchArt/sketch.mjs` (see `sketchArt/README.md`).
  - Subjects: farmhouse, building fronts, city streets, diner counter, nature.
  - Handwritten margin notes (a place and a time, plus one observation) give the stakeout/sketchbook mood. Turn them off for clean reference pages.
  - **Public-domain master copies** (Musashi, Bairei, Hokusai, Audubon) for copy-the-master plates.
  - The sumi-e ink generator (`inkArt/`) stays as an alternative.
- **Reference images**: my own photos, or **CC0** collections (e.g. the Met and Smithsonian open-access libraries). **Log the source and licence of every image** in `inkArt/licences.csv`.
  - Convert to grayscale and check them on e-ink.
  - The reMarkable Paper Pro and Scribe Colorsoft show colour, but design for grayscale.

---

## R5 and R6: Join It Up (cursive) and Street Hand (graffiti styles), PDF

**Status:** both e-ink editions are built as front/back sheets and are waiting for approval:
- Join It Up: 96 pages, `penPractice/out/cursive/join-it-up-eink.pdf`
- Street Hand: 108 pages, `penPractice/out/street/street-hand-eink.pdf`

Both use the same shared builder as R1 (`penPractice/hand/`) and the same format rule as R2. Details are in `penPractice/cursive/README.md` and `penPractice/street/README.md`.

- **Join It Up** (21 lessons):
  - **Hand:** our own looped modern cursive (`penPractice/cursive/hand.mjs`), joined and slanted ~10°. It has high joins after b, o, v and w, and dots and crosses go on after the word. Capitals and numbers are slanted print.
  - **Curriculum:** the same as R4's (strokes → letter families → joins → capitals → flow and speed), so the PDF and the phone app teach one hand.
- **Street Hand** (24 lessons): writing styles, not slow art pieces. There are four fast styles:
  - street caps
  - bounce
  - handstyle (tag-style script)
  - throw-ups (one-line bubble letters)

  All four are built from the print stroke model with a few repeatable moves. A day-one and final sample uses your name.
  - Content rule: made-up names only, no real writers' tags or crews, and the book tells readers to practise on paper and legal walls only.
  - Adults' edition only. A kids' version would be renamed **Bubble & Block Letters** (see `penPracticeSeries.md`).

## R3: Walkthrough (iPad + Apple Pencil)

**Promise:** the workbook, with a coach.

- **How it works**:
  - The app shows the **same lesson pages** as the PDFs, rendered from the lesson files (or the PDF page, with the geometry sidecar on top).
  - Apple Pencil writes straight onto the page.
- **First version (MVP)**:
  - Guided steps: watch the stroke animation → trace → dots → free
  - **Peek**: show the ideal guide on top of your own ink
  - Gentle per-cell feedback, all optional: straightness, endpoint error, ellipse evenness
  - Fresh targets on every repeat
  - Progress timeline and before/after comparison
  - Export finished pages to PDF
  - Left-handed mode
- **Later (v1.1)**: stroke replay, letters-per-minute timer for the print book, practice reminders, and the stroke authoring mode (internal at first).
- **Technology**:
  - Swift / SwiftUI with **PencilKit**, which records location, time, pressure and pen angle for every point, plus PDFKit.
  - On-device only: no accounts and no analytics in v1.
- **Content**: start with Clear & Quick Print, then add Sketch What You See.
- **Selling it**: free download with the first lessons, then unlock each book **with in-app purchase**.
  - Apple doesn't allow unlocking content with your own licence keys (App Store guideline 3.1.1).
  - Giving PDF buyers app access would need an account system, with the same content also sold in-app (3.1.3(b)).
  - Check the current guidelines before deciding.

## R4: Cursive Coach (phone, finger)

**Promise:** learn and keep cursive in a few minutes a day.

- **Why a phone and a finger work here**:
  - Finger practice is good for learning shapes, stroke order, direction and rhythm (see the research in `penPracticeSeries.md`).
  - It is **not** pen control, so the app says so.
  - It links to the PDFs and the iPad app for practice with a real pen.
- **Curriculum**:
  1. Basic strokes: undercurve, overcurve, downcurve, slant, loops
  2. Lowercase families:
     - undercurve: i t u w r s
     - loops: e l h k b f
     - ovals: a d g q o c
     - overcurve: n m v x y z
  3. Joins: baseline joins, high joins (b o v w), tricky pairs
  4. Words and rhythm: everyday words, your name, sentences, speed
  5. *Later*: capitals
- **Session (3–5 min)**:
  - stroke-order animation → trace → dots → from memory → a short "look away and recall"
  - spaced repetition decides which letters come back
- **Scoring**:
  - stroke order and direction
  - shape match against the recorded exemplar
  - proportions and rhythm
  - feedback is an overlay showing the difference, never a harsh grade
- **The cursive model is our own design**, a simple modern cursive with no trademarked school-model names. There's a left-handed / less-slanted option.
- **Technology**:
  - iOS first, sharing the Swift lesson, stroke and scoring code with R3
  - Android later (native port or cross-platform; decide after iOS)
- **Kids**: if it's ever marketed to children, follow Apple's Kids Category rules and children's privacy law (COPPA): no tracking, no accounts. Simplest is to collect nothing.

---

## Roadmap

Effort figures are rough estimates for one person part-time, with me writing the generator and app code.

| Phase | Work | Rough effort | Exit criteria |
|---|---|---|---|
| **0 Foundation** | Series name. Lesson format v1. Device-test the sampler on Scribe, reMarkable and print. Recruit 5–10 testers (adults and kids, at least one left-handed) | ~2 weeks | Sampler passes the device checks. Testers lined up |
| **1 → R1** | New page types. Write ~22 lessons. Pick the example font. 3 editions. Store pages and preview images | ~4–6 weeks | Testers finish part 1 and the final test. Device checks pass |
| **2 → R2** | Drawing page types (listed at the end of `sketchWhatYouSee.md`). Generated sketch references with construction overlays. 27 lessons. 3 editions | ~6–8 weeks | Same as above, plus every outside image licence checked |
| **3 → R3** | iPad MVP with Print content first. TestFlight beta for PDF buyers. Then add the sketch book | ~10–14 weeks (can overlap phase 2) | Beta testers complete 5+ lessons. Scoring feels fair. App Review passes |
| **4 → R4** | Stroke library (record letters in R3's authoring mode). Cursive curriculum. iOS app | ~10–14 weeks | Testers' cursive from memory improves over 2 weeks. Retention looks healthy |

## Where to sell

- **PDFs**: own site / Gumroad / Payhip / Etsy, where Scribe templates already sell. Optional print-on-demand paperback for the Letter edition.
- **Free sampler**: gets people onto an email list. Post before/after samples in the Scribe and reMarkable communities, following each community's self-promotion rules.
- **Apps**: App Store, free to download plus in-app purchase.
- **Device names**: say "for Kindle Scribe and reMarkable" only as compatibility, with no logos or anything that suggests endorsement.

## What to measure

- Sampler → purchase conversion
- Lesson completion
- **Before/after**:
  - print book: letters per minute, and whether someone else can read it
  - sketch book: day-1 vs final drawing of the same object
- App 7-day retention

## Risks

| Risk | Mitigation |
|---|---|
| Firmware updates change how PDFs or writing behave | Run the device checks before every release, and list the tested firmware versions |
| Photo licensing | CC0 or my own photos only, with a licence log |
| App review (purchase rules) | In-app purchase only for unlocks in v1 |
| Scoring feels unfair on a phone | Score shape, order and direction, not line quality. Make feedback an overlay, not a grade |
| Scope creep | Ship R1 small (~22 lessons). Kids editions come later |
| Left-handers left out | `--left` in the generator, plus left-handed testers in every phase |

## Decisions needed

1. **Series name.**
2. **Does R1 include lowercase**, or is it capitals only? The plan assumes both, with capitals first.
3. **Example font for print**: Andika, Inter, or a custom set of traced letters?
4. **R3**: should the app also open PDFs people bought elsewhere (needs accounts), or sell its content only in-app?
5. **R4**: iOS only at launch, or iOS and Android together?
6. **Pricing**: look at comparable Scribe/reMarkable workbooks and handwriting apps first.

## Next steps

1. Send `penPractice/out/pen-practice-sampler.pdf` to the Scribe and print one page of `pen-practice-sampler-letter.pdf`. Report what works.
2. Pick a working series name.
3. I add `word-rows`, `sentence-copy` and `timed-row` to the generator and draft Clear & Quick Print part 0 and part 1.
4. Start a reference-photo shot list for Sketch What You See.

## Sources

- reMarkable 2 and Paper Pro display specs: https://remarkable.com/products/remarkable-paper/pro/details/compare
- reMarkable Paper Pro Move display: https://liliputing.com/remarkable-paper-pro-move-is-a-smaller-color-e-ink-writing-tablet-with-a-7-3-inch-display/
- reMarkable internal PDF links (2.6): https://remarkable.com/blog/software-update-2-6-pinch-to-zoom
- reMarkable internal and external links (3.3): https://remarkable.com/blog/software-updates-3-0-3-3-typed-text-comes-to-remarkable
- Kindle Scribe 2025 (11", 300 ppi): https://www.techradar.com/tablets/ereaders/amazon-kindle-scribe-2025-with-frontlight-review
- Writing on PDFs on the Scribe (5.19.3.0.1): https://www.techwalla.com/13779365/kindle-update-519301-fixes-battery-drain-and-adds-pdf-tools
- Finger vs stylus vs pencil for preschool letter learning (Patchan & Puranik): https://researchconnections.org/childcare/resources/32955
- App Store Review Guidelines (3.1.1, 3.1.3(b), Kids Category): https://developer.apple.com/app-store/review/guidelines/
