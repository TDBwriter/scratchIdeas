# Join It Up: modern cursive

**Status: e-ink edition built as front/back sheets (96 pages = 48 sheets), waiting for approval.** Built with the shared builder (`../hand/`): `node build.mjs`.

- **The hand** (`hand.mjs`): our own simple modern looped cursive. It follows no trademarked school model.
  - Every small letter has a lead-in from the baseline and an exit that becomes the next letter's lead-in.
  - b, o, v and w finish with a check at the middle line and join high.
  - Ovals (a, c, d, g, o, q) are entered over the top.
  - Dots and crosses are written after the whole word.
  - Capitals and numbers are the print forms, slanted to match, and don't join.
  - The slant is ~10°. `handUpright` is the same hand at 0°, for a future left-handed / upright edition.
- **21 lessons** (`lessons.mjs`):

| Part | Lessons |
|---|---|
| 0 Start here | C0.1 Set up for cursive (slant, page tilt, warm-up strokes) · C0.2 Day-one sample |
| 1 Lowercase | C1.1 i t u w · C1.2 r s j p · C1.3 loops e l h k b f · C1.4 ovals a c d o g q · C1.5 overcurves n m v x y z · C1.6 review + use it |
| 2 Joins | C2.1 low joins · C2.2 high joins b o v w · C2.3 tricky pairs · C2.4 dots and crosses last |
| 3 Capitals and numbers | C3.1 A–I · C3.2 J–R · C3.3 S–Z · C3.4 numbers, names and addresses + use it |
| 4 Flow and speed | C4.1 steady slant and rhythm · C4.2 pangrams · C4.3 easy speed (timed) · C4.4 can someone else read it? + read-back |
| 5 Finish | C5.1 final sample |

- **Practice:**
  - Help fades from trace → dotted → free.
  - Slant guides appear on every ruled row.
  - The join diagrams pick out each join in black with its direction.
- **Review files:** `../out/cursive/sheets-eink.png` and `../out/cursive/contact-eink.png`.
