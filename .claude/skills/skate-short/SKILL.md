---
name: skate-short
description: Make a skate-style YouTube Short from a raw Cyberpunk 2077 recording. Use when the user gives the location of a video file or a Steam clip folder and wants the skate look, the title card over the loading screen, or phase markers for DaVinci Resolve.
---

# Skate Short

Turns a raw recording into a vertical Short with the skate look, the title card over the loading screen, and a marker at the start of each phase. The tool is `tools/skate-short/skate_short.py`. The style it follows is in `cyberpunk2077ShortsTreatment.md`. That file is a guide, not a rulebook: anything it doesn't cover is the user's call in the edit.

## What you need from the prompt

- **The video's location.** An MP4, or a Steam clip folder (it holds `session.mpd`).
- **The mission's name.** If it isn't in the prompt or the file name, ask once.
- **Optional:** a start and end time in the recording; images for the minimap location, V's profile and a photo of V; which phases get the fisheye.

## Steps

1. **Find the loading screen and make contact sheets.** Run:

   ```
   python tools/skate-short/skate_short.py "<video>" --mission "<mission>" --detect-only
   ```

   Add `--start` and `--end` if the user gave them. It writes contact sheets (stills every 5 seconds, each labelled with its time) and a report into a folder next to the video.

2. **Propose the phases.** Read the report and look at the contact sheets. Propose a start time for each phase the tool can't find:
   - `run`: the takedown of the mission begins;
   - `skit`: any cool thing V notices, or a slick takedown (as many as there are);
   - `flashback`: where V approaches an enemy who killed V before;
   - `coup-de-grace`: the ender;
   - `close`: V moving off into the city.

   The cold open is the start of the range (the previous game over) and the title card sits on the loading screen; the tool places both. Say plainly that the times come from stills a few seconds apart, not from watching the video, and let the user correct them.

3. **Render.** With the times settled:

   ```
   python tools/skate-short/skate_short.py "<video>" --mission "<mission>" --phase run=<t> --phase skit=<t> --phase coup=<t> --phase close=<t> [--minimap <png>] [--profile <png>] [--photo <png>] [--fisheye coup-de-grace]
   ```

   Times are in recording time. Put the fisheye only on phases the user names.

4. **Report what was made:** the rendered Short, the title card, the marker EDL and CSV, and the LUT. Tell the user how to bring the markers into Resolve: on the Edit page, Timelines > Import > Timeline Markers from EDL, on a timeline holding the rendered Short from its start. Import the markers before cutting, because timeline markers don't move with trimmed clips.

## Limits

- You can't watch video. Phase times come from stills.
- The original recording is never changed. The tool only writes new files.
- A Short has to be 3 minutes or less. The tool warns when the range is longer; the user cuts it down in the edit.
- The game's music is already in the recording's audio. Added music goes on in Resolve.
