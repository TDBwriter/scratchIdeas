---
name: vhs-transitions
description: Put a VHS glitch and tape static on the cuts the user picks in a Cyberpunk 2077 clip, the last step of the clip pipeline after menu-cut. Use when the user wants transitions, glitches or static on cuts, gives cut times, a marker file from DaVinci Resolve, or menu cut numbers.
---

# VHS Transitions

Step 4 of the clip pipeline: after the `opening-stats` skill has accepted and populated the clip, the user has trimmed it, and `menu-cut` has taken the menus out. The tool is `tools/skate-short/vhs_transitions.py`; `tools/README.md` has the details. The glitch is the treatment's (`cyberpunk2077ShortsTreatment.md`): the colors split, tape static washes over the picture, and a bright tracking line rolls down the frame, for a moment either side of each cut. The sound isn't touched.

## What you need

- **The clip's location:** usually the menu cut's `<clip> no menus.mp4`.
- **The cuts to glitch,** any of three ways, mixed as the user likes:
  - times in the clip (`--at 1:12`);
  - a marker EDL exported from Resolve (`--markers <file>`; Timelines > Export > Timeline Markers to EDL, from a timeline holding the clip from its start);
  - the menu cut's own cut numbers (`--cut 2,5,7`), from its `cuts.jpg` and report, which the tool finds beside the clip.

If the clip hasn't been through `opening-stats`, say so and run that first; if it rejects the clip, stop.

## Steps

1. **List where the transitions go.** Run:

   ```
   python tools/skate-short/vhs_transitions.py "<clip>" --cut <n,n> --at <t> --markers <file> --check-only
   ```

   Show the user the list: each cut's time and where it came from, and any notes (a pick outside the clip, a menu cut at the very start or end with no join, two picks merged because they overlap).

2. **Render.** The same command without `--check-only`. It writes `<clip> transitions.mp4` beside the clip, and a CSV of the transitions. Report the new file's length against the clip's; they should match.

## Limits

- The glitch length is fixed per run (`--before`, `--after`; 0.12 and 0.18 seconds by default).
- A time the user gives is used as given. A cut a frame or two off still sits inside the glitch.
- The clip itself is never changed.
