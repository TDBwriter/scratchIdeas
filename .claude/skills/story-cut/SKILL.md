---
name: story-cut
description: Cut a Cyberpunk 2077 clip down to a story under three minutes, beat by beat as the user directs, with a VHS glitch on every cut, in a wide version and a vertical (9:16) version that has the vertical loading screen and the skate look. Use when the user describes the moments to keep (scanner tags, stalks and chokes, distractions, hiding, looting, leaving) and wants a trimmed edit, a story cut, or wide and vertical versions of a clip.
---

# Story Cut

Turns a clip into a short story the way the user directs it, then makes it twice: wide, with the widescreen loading screen, and vertical, with the vertical loading screen and the skate look (decided November 21, 2026, on `545R-Takedown-000`: its story v2 is the wide version, v3 the vertical). The tools are `tools/skate-short/story_cut.py` and `tools/skate-short/vertical_loading.py`; `tools/README.md` has the details. The clips are never changed.

## Where it sits

After `opening-stats` has accepted the clip and `menu-cut` has taken its menus out: the story is cut from `<clip> no menus.mp4`. The vertical loading screen is cut from the clip with its menus still in, the one `opening-stats` checked. If either step hasn't run, run it first; if `opening-stats` rejects the clip, stop.

## The recipe

The user's direction for a takedown clip, November 21, 2026. Follow it for every takedown clip unless the user says otherwise:

- **Nothing before the end of the loading screen is trimmed:** the cold open, the game over and the loading screen stay whole.
- **Every enemy tagged with the scanner,** so the story shows them start glowing red through walls. Read the scanner's DATA panel to tell them apart: two of the same class can be different people (Takedown-000 has two Racketeers with different wanted records).
- **Each stalk:** a couple of beats of the stalk starting, a VHS cut, then a few beats finishing the stalk into the choke and the drop.
- **Each distraction with its payoff:** the quickhack that sets it off and what it does. In Takedown-000, the explosive tank draws an enemy and its overload kills them; the vending machine draws one away, and V vaults the wall into the stalk.
- **Hiding:** climbing into the dark corner, and staying until the alert is over.
- **The quest marker loot,** the crate that completes the job.
- **Backing away from civilians,** like the worker in the hard hat.
- **Running from the scene,** to the end.
- **No longer than three minutes.**

The Takedown-000 picks are in `545R-Takedown-000 story v2 cut/plan.csv` in the user's Videos folder, each piece with what it shows.

## Finding the beats

You can't watch video. Work from stills and measurements, and say so when you report.

- **Stills of the whole clip,** one a second at 480x200, on labelled sheets with each tile's loudest moment (ffmpeg's `ebur128`, momentary): gunfire and explosions stand out.
- **The scanner** tints the frame red: on small frames, mean red over mean green above 1.15 (orange-lit scenes trip it too, so look). At each scan, grab the middle of the frame (x 860 to 2580, y 100 to 1060) to read the target's name and DATA panel.
- **Takedowns:** the Kill / Non-lethal Takedown prompt and the XP pop-up after it; the grab comes a moment before the prompt.
- **Alerts:** the red banner at the top of the screen, and enemies searching with weapons up.
- **Backing away:** measure the zoom between frames (scale each frame 0.94 to 1.06 to match the one before). A run of matches under 1 means the camera is moving back.
- **Before rendering,** check each piece's ends on stills two a second.

## Steps

1. **Read the clip and place the beats.** Make a table of the beats the user asked for, with times in the clip. Where the direction is explicit, go ahead and render; the user reviews the result.

2. **Write the picks** as a CSV, one piece per row, in the clip's time: `from,to,beat` (an empty `to` runs to the end). The first piece runs from 0 through the end of the loading screen. Check the length and the joins:

   ```
   python tools/skate-short/story_cut.py "<clip> no menus.mp4" --picks picks.csv --name "<name>" --check-only
   ```

3. **Make the vertical loading screen** from the clip with its menus:

   ```
   python tools/skate-short/vertical_loading.py "<clip>.mp4"
   ```

   It reads `opening_stats.py`'s `report.json` (`<clip> opening/report.json`; give `--report` for another place). If the clip's loading screen already carries the widescreen stats, its report won't show a loading blank: give `--loading FROM-TO`. The layout and timings are the template's `vertical` section. Show the user the two stills it writes, one from each half.

4. **Cut the story,** both versions, with the glitch on every join:

   ```
   python tools/skate-short/story_cut.py "<clip> no menus.mp4" --picks picks.csv --name "<name>" --vertical-loading "<clip> vertical loading.mkv"
   ```

   The wide version is `<name> wide.mp4` beside the clip. The one for the vertical crop is `<name> cut/<name> for vertical.mp4`: the loading screen sits in the 9:16 window over black, so it looks wrong wide; it's only for step 5.

5. **Make the vertical version** with the `skate-short` skill, on `<name> for vertical.mp4`:
   - `--keep-menus --no-loading`: there are no menus left, and no title card, since the loading screen carries the stats;
   - the crop at the template's window position (0.5) from the start of the loading screen to its end, with no move or punch-in in between;
   - phases: `run` where the gameplay starts after the loading screen, `skit` at the stalks and distractions, `coup` at the last takedown, `close` at the run from the scene;
   - the crop on each piece from stills with a ruler of positions 0 to 1, and a 1.5x punch-in on the grabs;
   - `--out "<name> skate"`, then move its `<mission>_skate.mp4` out as `<name> vertical.mp4`, or the name the user gives.

6. **Report:** both files, the beats as a table in the story's time, what was judged from stills (who's a civilian, when the alert is over, which stretch is backing away), and what isn't verified.

## Limits

- The cuts are hard cuts under the glitch; the sound fades over 15 milliseconds at each join.
- Ultrawide 3440x1440 footage only: the vertical layout is made for its 9:16 window.
- The vertical loading screen takes V's turn and the stats from one menu visit, so on a long clip they show V as they were then.
