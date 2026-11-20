# Handwriting books: shared builder

One builder makes all three Pen Practice handwriting books in the same front/back loose-leaf sheet format:

| Book | Folder | Hand (stroke model) | E-ink PDF |
|---|---|---|---|
| **Clear & Quick Print** (R1) | `../print/` | unjoined ball-and-stick print (`strokes.mjs`) | `../out/print/clear-quick-print-eink.pdf` (108 pages) |
| **Join It Up** (cursive) | `../cursive/` | looped modern cursive, joined, slanted ~10° (`hand.mjs`) | `../out/cursive/join-it-up-eink.pdf` (96 pages) |
| **Street Hand** (graffiti styles) | `../street/` | four styles built from the print model (`hand.mjs`) | `../out/street/street-hand-eink.pdf` (108 pages) |

```sh
node build.mjs print|cursive|street [--page eink|letter|a4] [--refs]
# or, in a book folder:  node build.mjs
node handtest.mjs ../cursive/hand.mjs hand out.png "abc def" "word word|second line"   # check a hand
```

- `lib.mjs`: drawing in the current hand (ink / trace / dotted / bubble), guide lines with optional slant guides, exemplars with numbered stroke starts and arrows, and the practice page types.
- `build.mjs`: sheets (front = odd page, back = even page), contents, progress tracker, part openers with sketch plates, the overflow check, contact sheet and front/back preview.
- A book folder has `book.mjs` (content, hand(s), diagrams, extra practice types, cover/how/about pages), its lessons and its hand.

A **hand** is `{ glyph(ch) → { w, strokes }, layout(text, C) → { items, w } }`. Units: cap height 1, top line 0, middle line 0.5, baseline 1, descender 1.45. Strokes are ordered point lists: the order is the stroke order and the point order is the direction. Optional fields:
- `render: 'bubble'` for throw-ups
- `slantGuide` for slanted hands
- `pad` for styles that run past the lines
- `exGap` / `rowGap` for letter spacing in exemplars and practice rows
- `ink` for pen weight

The refactor kept Clear & Quick Print's output byte-identical.
