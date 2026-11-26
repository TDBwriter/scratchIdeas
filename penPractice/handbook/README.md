# Sketch What You See: the handbook (techniques and history)

This is a reading book that mirrors the workbook in `../sketch/` unit for unit. Both books have the same 8 parts and the same 35 units, with the same IDs, titles, order and key sentences.

| | Workbook (`../sketch/`) | Handbook (this folder) |
|---|---|---|
| Purpose | Learn by doing | Understand in depth |
| Per unit | One loose-leaf sheet: concise theory on the front; prompt, example and room to draw on the back | One section: the technique in full, refinements, common errors, history, quotations, plates |
| History, quotations, historical plates | None | Throughout |
| Format | Fixed front/back sheets | Flowing chapters with running page numbers, contents, glossary, sources, picture credits |
| E-ink edition | 92 pages | 106 pages |

**The two books never cite each other.**
- Neither book names, describes or points to the other: no "see the workbook", "overleaf" or "practice sheet" in the handbook, and no history or "further reading" in the workbook.
- Shared material is shared in the code, not in the text:
  - Titles, parts and key sentences come from `../sketch/lessons.mjs` and `../sketch/theory.mjs`.
  - Diagrams and pencil sketches are exported by `../sketch/build.mjs --figs`, so the figures always match.

```sh
cd penPractice/handbook
node build.mjs            # e-ink edition → ../out/handbook/sketch-what-you-see-handbook-eink.pdf
node build.mjs --figs     # re-export the diagrams and sketches from the workbook builder first
node build.mjs --page letter   # print editions (after approval)
```

Requires Playwright (Chromium), poppler (`pdftotext`, `pdftoppm`, `pdfinfo`) and ImageMagick.

**How the pages are made**
- Chromium paginates the flowing HTML.
- A first pass reads the PDF back with `pdftotext` to find the page of every part and unit, which fills in the contents and the part lists. The second pass confirms that the pagination has settled.

## Files

- `text-a.mjs`: introduction, part intros, Parts 0–3
- `text-b.mjs`: Parts 4, 5 and 7
- `text-c.mjs`: Part 6 (the field), glossary, sources, picture credits
- `plates/`: public-domain plates, cleaned to grayscale and credited in `../../inkArt/licences.csv`:
  - from *Manual of Field Sketching and Reconnaissance* (War Office, 1903; Internet Archive `manualoffieldske00grea`)
  - from J. J. Fulmer, *Military Panoramic Sketching* (1917; Internet Archive `militarypanorami00fulmrich`)

  Fulmer's plates that carry combat annotations (snipers, machine guns, trenches) are not used.

**Markup in the text files**
- A plain string is a paragraph.
- `## ` is a heading.
- `> text — source` is a quotation.
- `- ` is a list item; `1. ` is a numbered step.
- `fig:diagram|tf|ref|plate|plates:name|caption` is a figure.

## Sources and quotations

All quotations from the 1903 manual and from Fulmer were checked against the scanned text.

TC 3-25.26 *Map Reading and Land Navigation* (2013) is marked **distribution restricted** (US government agencies and contractors). It was used only as a reference for the facts of current practice, described in the book's own words:
- pace count and its adjustments
- factors that make distances look nearer or further
- the 100-metre unit and flash-to-bang methods
- shadow-tip, watch and star methods
- intersection, resection and modified resection

No figure, table or wording from it is reproduced.
