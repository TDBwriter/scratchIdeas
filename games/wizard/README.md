# Wizard score sheets

Write-on score sheets for the trick-taking card game Wizard. There are three editions: Kindle Scribe / reMarkable (157.5 × 210 mm), Letter and A4.

```sh
node build.mjs   # → out/wizard-score-sheets-{eink,letter,a4}.pdf, out/preview-eink.png
```

| Page | What it is |
|---|---|
| 1–4 | One sheet each for 3, 4, 5 and 6 players (20, 15, 12 and 10 rounds: the 60 cards divided among the players) |
| 5 | An "any number of players" sheet. Columns 4–6 stop at 15, 12 and 10 rounds; tick ○ for the dealer |
| 6 | Quick reference: rounds, trump, bidding, scoring, how a trick is won |

**Each round row has:**
- the round number, which is also the number of cards dealt
- a trump cell with ♠ ♥ ♦ ♣ – to circle, which reads "no trump" in the last round
- per player: **bid · won · score**, where the score is the running total
- **Σ bids**, to compare against the round number and see whether the round is over- or underbid

**Dealer is pre-marked:** on the per-count sheets, write the players in seating order, starting with the first dealer. The dealer's bid box is then marked ◤ every round.

**Scoring:**
- Made your bid exactly → 20 + 10 per trick won.
- Missed it → −10 per trick over or under.

This is an original layout made for personal use. Wizard is a trademark of its publisher, and these sheets are not affiliated with it.

Requires Playwright (Chromium), poppler (`pdftoppm`) and ImageMagick (`montage`) for the preview.
