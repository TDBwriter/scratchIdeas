---
name: menu-cut
description: Cut every menu and inventory screen out of a Cyberpunk 2077 clip, keeping the loading screens and the game overs that lead into them. Use when the user wants the menus, inventory, map, journal, skills, crafting or pause screens removed from a clip or recording, for a cleaner video to share.
---

# Menu Cut

Removes the menus from a 3440x1440 Cyberpunk 2077 clip and writes the result as a new file beside it, "`<clip> no menus.mp4`". The clip itself is never changed. The tool is `tools/skate-short/menu_cut.py`. It's separate from the `skate-short` skill (vertical Shorts) and from the opening template (`opening_stats.py`), but shares the template file for the game over reference.

## What it cuts and what it keeps

- **Cut:** every menu. On an ultrawide recording the game draws every menu at 16:9 with black bars down both sides (the hub, the inventory and backpack, the map, the journal, skills and perks, crafting, cyberware, breach protocol, the pause menu). Gameplay fills the frame and its HUD reaches the edges, so a menu is a stretch where both outer strips stay black and the frame isn't black. A tenth of a second goes either side, for the menu's own open and close.
- **Kept:** loading screens, black or with the opening's stats overlay on them, and every game over (FLATLINED) with what leads into it and the loading screen after it, until gameplay comes back. The user's rule: remove "all the menus and inventory screens. not the loading screen." Game overs open every video (the opening template), so they stay.
- In-world screens, like a terminal or laptop V reads, fill the frame and aren't menus. They stay.

## What you need

- **The clip's location:** an MP4 at 3440x1440. A Steam recording folder has to be exported to MP4 first. On 16:9 footage there are no bars to find menus by, and the tool says so and stops.
- **The order:** if the clip still needs its opening, run the opening template first (step 0 of the `skate-short` skill). The opening's stats overlay is cut from the very menus this removes, so the original keeps them.

## Steps

1. **Find the menus.** Run:

   ```
   python tools/skate-short/menu_cut.py "<clip>" --check-only
   ```

   It reads every frame once (about 2 minutes for a 15-minute clip) and writes a folder "`<clip> menu cut`" beside the clip with `report.txt`, `cuts.csv` (each cut, each kept game over, and the pieces that remain) and `cuts.jpg` (a still from the middle of each cut in red, each kept game over in green). If `ffmpeg` isn't found right after a winget install, put `%LOCALAPPDATA%\Microsoft\WinGet\Links` on the PATH for the command.

2. **Show the user the cuts.** Give the count, the total cut, the new length, and `cuts.jpg`. Say plainly that a cut is judged from the frame's edges, not by watching. If a cut looks wrong in the sheet, say which and why before rendering.

3. **Make the cut version.** Run the same command without `--check-only`. It joins the remaining pieces into "`<clip> no menus.mp4`" beside the clip (`--out` names another file): HEVC on the NVIDIA card where there is one, full-range color kept, the sound re-encoded to AAC. Report the new length against the expected one; they should agree to within a frame or two.

## Limits

- The cuts are hard cuts, with no transition. Where V opens a menu and closes it standing in the same spot, the join is close to invisible; elsewhere it jumps.
- Only ultrawide footage. A dark-edged gameplay shot with no HUD at the edges would read as a menu; the HUD normally rules that out, but check `cuts.jpg`.
- It never changes or deletes the clip. Sharing the cut version, or replacing the original with it, is the user's call.
