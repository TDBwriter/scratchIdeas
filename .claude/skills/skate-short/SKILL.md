---
name: skate-short
description: Make a skate-style YouTube Short from a Cyberpunk 2077 recording that the opening-stats skill has accepted. Use when the user gives the location of a video file or a Steam clip folder and wants the skate look, the 9:16 crop plan, the title card over the loading screen, or phase markers for DaVinci Resolve.
---

# Skate Short

Turns a raw recording into the kit for finishing a vertical Short in DaVinci Resolve: a guide video of the whole frame with the planned 9:16 crop drawn on it, the crop plan with Resolve's numbers, a marker at the start of each phase, and a preview with the skate look and the title card over the loading screen. The tool is `tools/skate-short/skate_short.py`. The style it follows is in `cyberpunk2077ShortsTreatment.md`. That file is a guide, not a rulebook: anything it doesn't cover is the user's call in the edit.

## What you need from the prompt

- **The video's location.** An MP4, or a Steam clip folder (it holds `session.mpd`).
- **The mission's name.** If it isn't in the prompt or the file name, ask once.
- **Optional:** a start and end time in the recording; images for the minimap location, V's profile and a photo of V; which phases get the fisheye.

## Steps

0. **Only on an accepted clip.** The `opening-stats` skill gates every clip first (decided November 21). If it hasn't accepted this clip, run that skill before anything here, and stop if it rejects the clip. Its populated copy, `<clip> with stats.mp4`, already has V's stats on every loading screen.

   **The vertical version of a story cut** (the `story-cut` skill) comes in as `<name> for vertical.mp4`, with the vertical loading screen already in the 9:16 window (decided November 21). For it: give `--keep-menus --no-loading`, so nothing is cut and there's no title card (the loading screen carries the stats); keep the crop at the template's window position (0.5) from the start of the loading screen to its end, with no move or punch-in in between; and move the rendered `<mission>_skate.mp4` out under the story's vertical name.

1. **Find the loading screen and make contact sheets.** Run:

   ```
   python tools/skate-short/skate_short.py "<video>" --mission "<mission>" --detect-only
   ```

   Add `--start` and `--end` if the user gave them. It writes contact sheets (stills every 5 seconds, each labelled with its time, with a red outline where the 9:16 crop falls) and a report into a folder next to the video. For a Steam recording folder, pass `--out` with a folder of the user's choosing, so nothing new lands among Steam's own recordings. If `ffmpeg` isn't found right after it was installed with winget, put `%LOCALAPPDATA%\Microsoft\WinGet\Links` on the PATH for the command.

2. **Propose the phases.** Read the report and look at the contact sheets. Propose a start time for each phase the tool can't find:
   - `run`: the takedown of the mission begins;
   - `skit`: any cool thing V notices, or a slick takedown (as many as there are);
   - `flashback`: where V approaches an enemy who killed V before;
   - `coup-de-grace`: the ender;
   - `close`: V moving off into the city.

   The cold open is the start of the range (the previous game over) and the title card sits on the loading screen; the tool places both. On the populated copy the opening's stats are already on that loading screen; how they sit in the 9:16 frame hasn't been decided, so ask before combining them with the title card. Say plainly that the times come from stills a few seconds apart, not from watching the video, and let the user correct them.

3. **Cut the dead space and pick V's stats.** The Short is a short, snappy action reel, like an old skateboard video. Menus are cut on their own (the report lists them, and their stills are marked CUT). Propose `--cut FROM-TO` for any other stretch with no action between V and an NPC that the sequence doesn't need: walking between fights, terminals V reads, hacking boxes. Then pick 2-3 seconds of a menu with V in it (the inventory screen, with V standing clear of any pop-up) for `--stats-close FROM-TO`; it closes the Short. (The opening's stats are on the loading screen, from the `opening-stats` skill, so don't use `--stats` or `--stats-open`.) Run step 1 again with it and look at the `_stats-close.jpg` still: if the default slices (Level and Street Cred, then V head to toe) miss, propose `--stats-slices`.

4. **Suggest the crop.** The crop tells the story in these Shorts: the 9:16 window keeps about a third of a 16:9 frame and less of an ultrawide one, so what it holds and what it leaves out is a choice. On the first sheets the red outline sits in the middle.

   **The only focus is the action between V and the NPCs:** whatever is telling the dramatic story, such as a cool kill, a bad death or a funny moment. Frame the NPC V is dealing with and what happens between them. Don't frame the HUD, the minimap or scenery for their own sake. Where nothing is happening between V and an NPC, leave the window where it is.

   For each stretch, propose where the window should sit (`left`, `center`, `right`, or a number from 0 at the left edge to 1 at the right) and say which moment between V and an NPC it frames. Move it only where that action moves, in one of two ways:
   - **Pan** (`--crop FROM-TO=POSITION`): the window glides there between FROM and TO, easing in and out like a camera. Use it to carry the eye from one subject to the next.
   - **Cut** (`--crop TIME=POSITION`): the window jumps there at TIME. Use it for a slam or a hard reframe.
   - **Punch-in** (`--punch TIME=ZOOM`, back out with `TIME=out`): a cut to a tighter window, 2 for half the height, to close in on a kill, a death or a reaction. It's soft, so use it where the moment is worth it.
   - **Tilt:** once punched in, the window can also move up and down. A position is `X,Y`: X is `left`, `center`, `right` or 0 to 1; Y is `top`, `center`, `bottom` or 0 to 1. Leave one blank to keep it (`=,top` only tilts). A pan and a tilt can run together.

   Crop moves can't overlap; start one after the last one ends.

   Then run step 1 again with the proposed `--crop` and `--phase` values, so the new sheets show the red outline where each suggested crop falls:

   ```
   python tools/skate-short/skate_short.py "<video>" --mission "<mission>" --detect-only --crop <t>=<position> --crop <t>=<position> ...
   ```

   Give `--start` and `--end` so the scan is short. Show the user the sheets and let them move the outlines before anything is rendered.

5. **Make the kit.** With the cuts, V's stats, the times and the crop settled:

   ```
   python tools/skate-short/skate_short.py "<video>" --mission "<mission>" --start <t> --end <t> --stats-close <from>-<to> --cut <from>-<to> ... --phase run=<t> --phase skit=<t> --phase coup=<t> --phase close=<t> --crop <t>=<position> --punch <t>=<zoom> ... [--minimap <png>] [--profile <png>] [--photo <png>] [--fisheye coup-de-grace]
   ```

   Times are in recording time. Put the fisheye only on phases the user names. Add `--no-preview` if the user only wants the guide.

6. **Report the kit**, the same way for every clip. The user finishes the Short in DaVinci Resolve, so lead with what guides the edit:
   - `<mission>_guide.mp4`: the whole frame in the Short's order, with the red window through every move, V's stats slices, the phase, the move in progress, each jump cut and the timeline timecode;
   - `<mission>_cuts.csv`: the pieces in order with their recording in and out, and what was cut;
   - `<mission>_crop-plan.csv`: one row per keyframe, with the Zoom and Position for Resolve's Inspector;
   - `<mission>_markers.edl`: the phase markers (Edit page: Timelines > Import > Timeline Markers from EDL; import them before cutting, because timeline markers don't move with trimmed clips);
   - then the preview, the title card and the LUT.

   Point to "Finishing in Resolve" in `tools/README.md` for how they fit together, and say that the Resolve numbers haven't been checked in Resolve yet.

## Limits

- You can't watch video. Phase times and crop suggestions come from stills, so a crop can miss action that moves between them.
- The original recording is never changed. The tool only writes new files.
- A Short has to be 3 minutes or less. The tool warns when the range is longer; the user cuts it down in the edit.
- The game's music is already in the recording's audio. Added music goes on in Resolve.
