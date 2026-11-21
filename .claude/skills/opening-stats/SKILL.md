---
name: opening-stats
description: The first step for every Cyberpunk 2077 clip. Check the clip for the opening template (a game over, then a loading screen) and reject it if any key frame is missing; if it passes, populate every loading screen with V's stats in a full copy of the clip. Use when the user gives a clip to check, to gate, or to put the stats on its loading screens, and before menu-cut, vhs-transitions or skate-short run on any clip.
---

# Opening Stats

The gate for every clip, and the step that populates its loading screens. Nothing else runs on a clip until this has accepted it. The tool is `tools/skate-short/opening_stats.py`; `tools/README.md` has the details.

## The pipeline this starts

1. **This skill:** gate the clip; if it passes, populate every loading screen in a full copy, `<clip> with stats.mp4`.
2. **The user** trims that copy for content and exports it.
3. **menu-cut** takes the menus out of the trimmed version.
4. **vhs-transitions** puts a VHS glitch on the cuts the user picks.

The `skate-short` skill (vertical Shorts) and the `story-cut` skill (a story cut to the user's beats, wide and vertical) also run only on an accepted clip. The report's `frames` record the menu frames each element came from; `vertical_loading.py` reads them to build the vertical loading screen from the template's `vertical` section.

## What you need

- **The clip's location:** an MP4 at 3440x1440, or a Steam clip folder (it holds `session.mpd`; give `--out` with a folder of the user's choosing, so nothing lands among Steam's own recordings).
- **The template** `cyberpunk2077-opening-template.json`: the tool reads the copy beside the video first (the user's Videos folder), then the one in `tools/skate-short/`, and prints which it used.

## Steps

1. **Gate the clip.** Run:

   ```
   python tools/skate-short/opening_stats.py "<clip>" --check-only
   ```

   Only the key elements block (the user's standard, November 21): FLATLINE frames, the LOADING BLANK after them, the SPINNING MODEL (V turning in the inventory preview), the INVENTORY GRID, SKILL PROGRESSION, and LEVEL, STREET CRED, ENCUMBRANCE and GOLD. Minor details never block; the report notes them.

   If it prints **REJECTED**, stop. Tell the user which key elements are missing, show them `key frames.jpg` from the output folder (`<clip> opening`), and run nothing else on that clip: not this skill's next step, and not menu-cut, vhs-transitions or skate-short.

2. **Populate the loading screens.** If it's accepted, run the same command without `--check-only`. It finds every loading screen in the clip, game over or not, and writes `<clip> with stats.mp4` beside the clip: the whole clip with V's stats on each loading screen, the same layout on all of them, cut from the clip's own menus. The clip itself is never changed. Keep `--length` at the template's default unless the user asks.

3. **Report.** Give the populated copy's name and length, the loading screens it populated (from the report), and anything the report notes: loading screens too short to populate, V's turn slowed or held, elements from another menu visit. Show `loading screens.jpg`, a still from each populated loading screen. Then say what comes next: the user trims the copy for content, then menu-cut.

## Limits

- Ultrawide 3440x1440 footage only: the key frames are matched, and the layout made, at that size.
- Every loading screen gets the stats from one menu visit, so a loading screen late in a long clip shows V as they were at that visit.
- You can't watch video. The gate works from matched UI elements; say so if a result looks odd in the stills.
