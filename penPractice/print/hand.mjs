// The Clear & Quick Print hand: unjoined ball-and-stick print from strokes.mjs, spaced by letter shape.
import { glyph, GAP } from './strokes.mjs';

// letter gap by shape: two straight sides need the most room, two rounds the least
const LEFT_ROUND = 'acdegoqsCGOQS0', RIGHT_ROUND = 'bcopesBDOPQS0';
export const pairGap = (a, b) => GAP.letter * [1.15, 0.85, 0.6][(RIGHT_ROUND.includes(a) ? 1 : 0) + (LEFT_ROUND.includes(b) ? 1 : 0)];

export const hand = {
  name: 'print',
  glyph,
  layout(text, C, { gapScale = 1, wordGap = GAP.word } = {}) {   // → items [{ ch, x (mm from 0), w, strokes }], width (mm)
    const items = []; let x = 0, prev = null;
    for (const ch of text) {
      if (ch === ' ') { if (prev) x += wordGap * C; prev = null; continue; }
      if (prev) x += pairGap(prev, ch) * gapScale * C;
      const g = glyph(ch);
      items.push({ ch, x, w: g.w, strokes: g.strokes }); x += g.w * C; prev = ch;
    }
    return { items, w: x };
  },
};
