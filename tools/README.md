# Tools

The working tools for the Cyberpunk 2077 narrative playthrough project. They were copied in from a temporary session folder on November 16, 2026 (2026:320), so that they aren't lost with it.

Nothing here is part of the zine or the crew's storyline. The two silos don't depend on it.

## `planning-log/`: the pre-Heist planning log's source

- `planner_data.py`: the 61 entries, with their type, requirements, beats, methods and crew. Their order is a checklist, not the order the game is being played in.
- `build_planner.py`: lays the entries out as the print-and-write PDF.
- `fonts/`: the three Rajdhani weights the layout uses, with their license (SIL Open Font License 1.1).

To rebuild `cyberpunk2077PreHeistPlanningLog.pdf` at the repo root:

```
pip install reportlab
python3 tools/planning-log/build_planner.py cyberpunk2077PreHeistPlanningLog.pdf
```

It prints the page count. The current data gives 141 pages. A rebuild from this copy was checked against the PDF in the repo: same page count, same text on the pages compared.

To change the log, edit `planner_data.py` and rebuild.

## `issue-checker/`: the scripted zine tests

`mdcheck.py` runs the checks marked **[auto]** for groups A and H in `Cheap-Truth-screamsheet/Cheap-Truth-screamsheet-TESTS.md`: the closing brackets (A7), raw HTML (H1), non-ASCII characters (H2), setext headings and trailing-space breaks (H3). It also counts fenced blocks, headings, rules and images.

```
pip install markdown-it-py
python3 tools/issue-checker/mdcheck.py Cheap-Truth-screamsheet/Cheap-Truth-screamsheet-ISSUE-00.md
```

It also writes an HTML preview of each file into the folder it is run from, so run it from a scratch folder, or delete the `.html` file afterward.

It doesn't cover the tests marked **[read]**, or the **[auto]** tests in the other groups.

## `mastheads/`: the masthead shortlist

`masthead-faces.txt` lists the FIGlet faces (from pyfiglet 1.0.2) that draw `CHEAP TRUTH` within 100 columns. Each line is a face name, then the width and height of the result in characters.

Test A2 says no two issues may use the same face. The faces already used are in the register in `Cheap-Truth-screamsheet/Cheap-Truth-screamsheet-ISSUES.md`.

```
pip install pyfiglet
python3 -c "import pyfiglet; print(pyfiglet.figlet_format('CHEAP TRUTH [0]', font='doom', width=200))"
```

## `cheap-truth-original/`: the original zine's text

Machine-read text of the original *Cheap Truth* (1983 to 1986), one file per scanned page. Every quotation from the original in the zine's rules comes from these files.

- The text is OCR, so it has errors. Check a quotation against the scans before printing it.
- The scans themselves are not in the repo.
- The original was published NOT COPYRIGHTED.

## `skate-short/`: skate-style Shorts from raw recordings

`skate_short.py` turns a raw Cyberpunk 2077 recording into a vertical Short in the style of `cyberpunk2077ShortsTreatment.md`, ready to cut in DaVinci Resolve. It never changes the recording; it writes new files into a folder next to it.

**What it makes**

Every clip gets the same kit, with the same names, so it works the same way in Resolve whatever the clip. `<mission>` is the mission's name in lower case with dashes.

- **`<mission>_guide.mp4`, the frame of reference for finishing in Resolve:** the whole recording frame, uncropped, in the Short's order and timing: V's stats, the action less the cuts, V's stats again. The 9:16 window is drawn in red wherever the crop plan puts it, through every cut, pan, tilt and punch-in; on V's stats frames the slices are drawn in yellow. Top left is the phase, in its marker's color. Under it is the crop move in progress and where it lands, and under that each jump cut, with how much was cut and why. Bottom left is the timeline timecode (starting at 01:00:00:00, as the markers do) and the recording time. It keeps the recording's sound, for syncing.
- **`<mission>_cuts.csv`, the cut list:** the Short's pieces in order, each with its timeline in and out and its recording in and out, then every stretch that was cut and why (a menu, or `--cut`).
- **`<mission>_stats-open.jpg` and `_stats-close.jpg`:** a still from V's stats frames with the slices outlined and numbered, beside the 9:16 frame they make.
- **`<mission>_crop-plan.csv`:** the same plan as numbers, one row per keyframe. Each row has its timeline timecode, recording time, the move, the position (across, down and zoom), the window in the recording's pixels, and the Zoom and Position to set in Resolve's Inspector.
- **`<mission>_markers.edl` and `.csv`:** the phase markers, for Resolve's Edit page (Timelines > Import > Timeline Markers from EDL).
- **`<mission>_skate.mp4`, a preview of the Short:** cut and cropped to the plan, opening and closing on V's stats, with the MiniDV grade, tape grain and scanlines, a VHS glitch on each jump cut and each change of phase, the camcorder overlay (`PLAY`, `SP` and the publish date as YYYY:DDD) for a moment at each phase, the fisheye on the phases you name, and the title card over the loading screen. `--no-preview` skips it.
- **`<mission>_titlecard.png`:** the mission's name, the minimap location and V's profile, from images you supply. A missing image leaves a labelled empty box.
- **Contact sheets:** stills every 5 seconds, each labelled with its time in the recording and outlined in red where the 9:16 crop falls, for picking the phases and the crop. A still in a cut is labelled CUT and has no outline.
- **`minidv.cube`:** the grade as a LUT, so it can also be applied in Resolve.

**What it finds on its own, and what it doesn't**

- It finds the near-black loading screen and puts the title card there. The cold open is the start of the range you give it.
- It finds the menus and cuts them, so the Short is the action and nothing else: the inventory, the map, the journal, breach protocol, the pause menu. On an ultrawide recording the game draws every menu at 16:9 with black bars down both sides, while gameplay fills the frame and its HUD reaches the edges; on your recordings the bars measure 2 out of 255 in a menu and 55 or more in gameplay. `--keep-menus` keeps them in. In-world screens, like a terminal V reads, fill the frame and aren't menus; cut those, and any other dead space, with `--cut FROM-TO` in recording time.
- It doesn't choose V's stats. `--stats FROM-TO` names frames of a menu with V in it (the inventory screen, say), anywhere in the recording; they open and close the Short, sliced to fit its frame. `--stats-open` and `--stats-close` take different frames for each end. Since November 21 the opening template (`opening_stats.py`, below) puts V's stats on the loading screen instead, so a Short takes them with `--stats-close` only; how the template sits in the 9:16 frame is still to be decided. The default slices take Level and Street Cred from the inventory screen's top left, then V head to toe; `--stats-slices` sets others, top to bottom, each as x,y,w,h from 0 to 1 across the game's 16:9 menu. Every jump cut, including the ones into and out of V's stats, gets a VHS glitch.
- It can't tell where the run, the skit breaks, the flashbacks, the coup de grace and the close begin. Those come from `--phase`. With Claude Code, the `skate-short` skill reads the contact sheets and proposes the times for you to check.
- It doesn't choose the crop. The window sits in the middle, full height, until `--crop` and `--punch` move it, in recording time:
  - `--crop TIME=X,Y` cuts there at TIME. `--crop FROM-TO=X,Y` pans or tilts there between FROM and TO, easing in and out like a camera. X is `left`, `center`, `right`, or 0 (against the left edge) to 1 (against the right); Y is `top`, `center`, `bottom`, or 0 to 1. Leave either blank to keep it where it is (`--crop 1:05=,top` only tilts).
  - `--punch TIME=ZOOM` cuts to a window ZOOM times tighter (2 is half the height, up to 4). `--punch TIME=out` comes back out.
  - Each holds until the next, and crop moves can't overlap. On wide footage a full-height window can only move sideways, so a tilt needs a punch-in first.

  With Claude Code, the skill proposes the crop from the stills and runs the sheets again, so the red outlines show its suggestions before anything is rendered.

**Setting it up on Windows**

```
winget install Python.Python.3.12
winget install Gyan.FFmpeg
python -m pip install Pillow
```

Open a new terminal after installing so `python`, `ffmpeg` and `ffprobe` are found.

**Running it**

Find the loading screen and make contact sheets first:

```
python tools/skate-short/skate_short.py "D:\Recordings\gig.mp4" --mission "Woman of La Mancha" --detect-only
```

To see where a crop falls, run it again with `--crop`. The new sheets draw each red outline where you put it:

```
python tools/skate-short/skate_short.py "D:\Recordings\gig.mp4" --mission "Woman of La Mancha" --start 12:40 --end 15:30 --detect-only --crop 13:05=0.3 --crop 14:50-14:53=right --punch 14:55=2 --crop 14:56-14:57=,bottom --punch 15:20=out --crop 15:20=center
```

That cuts to 0.3 at 13:05, pans to the right edge between 14:50 and 14:53, punches in to 2x at 14:55, tilts down to the bottom over the next second, and at 15:20 comes back out to the middle. Add `--sheet-every 1` to see a move's outline a second at a time.

Then make the kit, with the phase and crop times in recording time:

```
python tools/skate-short/skate_short.py "D:\Recordings\gig.mp4" --mission "Woman of La Mancha" --start 12:40 --end 15:30 --phase run=13:05 --phase skit=13:40 --phase skit=14:10 --phase coup=14:55 --phase close=15:20 --crop 13:05=0.3 --crop 14:50-14:53=right --punch 14:55=2 --crop 14:56-14:57=,bottom --punch 15:20=out --crop 15:20=center --stats 15:41-15:43.5 --cut 13:20-13:31 --minimap minimap.png --profile profile.png --fisheye coup-de-grace
```

That also opens and closes on V's stats from 15:41 to 15:43.5 and cuts 13:20 to 13:31; the menus in the range are cut without being named.

`--help` lists every option. With Claude Code, give it the video's location and the mission's name and it follows `.claude/skills/skate-short/SKILL.md`.

**Finishing in Resolve**

The guide, the crop plan and the markers share one clock: the timeline starts at 01:00:00:00 on the first frame of the range (`--start`). Resolve can't open a Steam `session.mpd`, so export the recording from Steam as an MP4 for the edit.

1. Make a 1080x1920 timeline. Lay the recording's pieces on it in the cut list's order, each from its recording in to its recording out, so each lands at its timeline in. Then import the markers.
2. Open the guide in the Source viewer, or on a second timeline, and play it alongside. It shows where the window goes, which phase you're in, what move comes next, and where each jump cut falls.
3. Reframe each piece with the Inspector's Zoom and Position, keyframed at the crop plan's rows. Each piece is its own clip, so each starts with a "piece starts" row. A pan or tilt has a row where it starts and a row where it ends: keyframe both and set them to ease in and out. A cut or a punch-in happens on one frame: keyframe it there, or cut the clip with the blade. V's stats pieces are sliced, not cropped: build them from the stats stills' outlines.
4. Finish with the look: the LUT, grain, glitches, the camcorder overlay and the title card. The preview shows how the tool would do it.

The crop plan's Resolve numbers assume a 1080x1920 timeline and Resolve's default for clips of a different size (Image Scaling: "Scale entire image to fit"). Position is in timeline pixels from the middle, with +Y up. They haven't been checked in Resolve yet; the guide and the window's pixel columns are the reference if they're off.

**Things to know**

- **Steam recordings:** export the clip from Steam as an MP4 (Recordings and Screenshots, then Share > Export Video File), or point the tool at the clip's folder. Reading the folder directly needs an ffmpeg build that reads DASH manifests (`session.mpd`); the full build `winget` installs (Gyan.FFmpeg) does.
- **Where Steam keeps them:** background recordings are in `C:\Program Files (x86)\Steam\userdata\<your id>\gamerecordings\video\`, one folder per session, named `bg_1091500_<date>_<time>` in UTC (1091500 is Cyberpunk 2077). Each session also leaves a recording of a few seconds at 1280x768 just before the main one; skip it.
- **Frame rate:** read through `session.mpd`, ffprobe gets a Steam recording's frame rate wrong (about 26 fps, or a nominal 120 or 240, for footage that is really 60). The tool measures it from the frames' timestamps instead and snaps it to the nearest standard rate.
- **Recordings that start at launch:** the game's boot screens (the REDengine logo, the legal text, the seizure warning) count as six near-black stretches in the first 25 seconds. Give `--start` past them, or pick the right stretch with `--loading`.
- **Ultrawide footage:** on a 3440x1440 recording the 9:16 window is 810 pixels wide, scaled up to 1080x1920, so the crop leaves out more than three-quarters of the frame. In the middle it leaves out the HUD at the screen's edges (the minimap, the objective list); pushed hard to one side, it takes in that side's HUD. A 2x punch-in is a 405x720 window scaled up to 1080x1920, so it's soft.
- **Menus on 16:9 footage:** a 16:9 recording has no side bars, so no menus are found. Cut them with `--cut`.
- **Two passes:** the tool first cuts the pieces out of the recording (decoding it once, for both the preview and the guide) into working files, then joins them and adds the look. The working files are deleted at the end. A 70-second range with one menu cut and V's stats at both ends took under two minutes.
- **Speed:** `--detect-only` reads the whole range. On this PC it took about 3 minutes for a 10.5-minute 3440x1440 recording. Give `--start` and `--end` to scan less. A 45-second range from the same recording took about a minute from start to finish, render included.
- **File size:** grain doesn't compress, so the rendered Short is large: about 180 MB for those 45 seconds at the default quality (`--crf 18`). A higher `--crf`, such as 22, makes it smaller.
- **Levels:** Steam records full-range video, and the render keeps it full range and says so in the file. If it looks crushed or washed out in Resolve, set the clip's data levels to Full (Clip Attributes).
- **Loading screen not found:** loosen `--black-share` (default 0.92) or `--black-pixel` (default 0.10). If it picks the wrong dark stretch, `--loading 2` takes the second.
- **Markers:** import them before cutting. Timeline markers don't move with trimmed clips. The EDL's form follows what Resolve exports for timeline markers; it hasn't yet been tested in free Resolve, and the CSV lists the same times if it fails.
- **Tested** on a made-up recording in a Linux container, then on November 19, 2026 (2026:323) on Windows 11 with ffmpeg 9.0.2, Python 3.14 and Pillow 13, on a real Steam background recording read through its `session.mpd`: detection, contact sheets, and a 45-second render with the title card, glitches, camcorder overlay and fisheye, and three more with the crop cutting, panning, punching in and tilting, where the preview matched the red outlines and the guide; then a 70-second range with its menus cut (15 seconds of journal and map) and V's stats from the inventory screen at both ends, which came out at 60 seconds with the guide's recording times matching the cut list. The markers, the cut list and the crop plan's numbers haven't been tried in Resolve yet.

### The clip pipeline

Every clip goes through these steps, in this order (decided November 21, 2026):

1. **The opening template gates the clip and populates its loading screens** (`opening_stats.py`, the `opening-stats` skill). A clip missing a key element is rejected, and nothing after this runs on it. An accepted clip gets a full copy, `<clip> with stats.mp4`, with V's stats on every loading screen.
2. **You trim the populated copy for content,** in DaVinci Resolve or however you like, and export it.
3. **The menu cut** takes every menu and inventory screen out of your trimmed version (`menu_cut.py`, the `menu-cut` skill).
4. **The transitions** put a VHS glitch on the cuts you pick (`vhs_transitions.py`, the `vhs-transitions` skill).

Cutting the individual clips out of a longer recording comes later. The vertical Shorts (`skate_short.py`, the `skate-short` skill) also come after step 1.

### `skate-short/opening_stats.py`: the opening template

Every opening video opens with a game over, which leads to a loading screen with V's stats laid over its black (decided November 21, 2026; the approved edit is `545R-Takedown-000`, 0:11 to 0:20). `opening_stats.py` checks a clip for the template's key elements and builds that overlay from the clip's own menus. A clip missing a key element is rejected: it gets a report and a contact sheet of what was found, and nothing else, and the script exits with status 2. An accepted clip has **every** loading screen populated, not just the opening's, in a full copy of the clip (decided November 21, 2026).

**The key elements** (the only ones that block, decided November 21, 2026)

- **FLATLINE frames:** the game over screen;
- **LOADING BLANK:** the black loading screen straight after it;
- **SPINNING MODEL:** V turning in the inventory preview;
- **INVENTORY GRID:** the inventory screen's equipped items, taken where the cursor is parked off the items so no pop-up covers them;
- **SKILL PROGRESSION:** the skills page's list;
- **LEVEL, STREET CRED, ENCUMBRANCE and GOLD:** read from the top bar of the hub, the inventory or the skills page, whichever has all four.

**Minor details** never block; the report notes them. With no hub screen, the affinity card and the LEVEL UP badge are left out. The LEVEL UP badge (unspent attribute and perk points) shows only while there are points to spend. A game over more than 60 seconds into the clip (`--within`) is noted, as are a turn shorter than 3 seconds and an inventory with no frame clear of pop-ups (the most typical frame is used; check it).

They're found by matching parts of the game's UI that look the same in every clip: the FLATLINED title, the SKILL PROGRESSION label, the inventory's FILTERS and COMPONENTS labels, the hub's CYBERWARE button, the ROTATE prompt under V's preview and the menu cursor, all cut from `545R-Takedown-000`.

**The template is one file,** `cyberpunk2077-opening-template.json`. It holds the key elements and minor details, every coordinate and timing in the layout, the detection settings, those UI references (as embedded PNGs) and the four crops that set the template. A copy is kept with the videos being checked (`C:\Users\<you>\Videos`): the tool reads the copy beside the video it checks, then the one beside the script (this repo's, the versioned record), and `--template` names another. The report says which it used. Change the template by editing that file; copy it back here to keep the change. The keyframes (one every 3 seconds in Steam's footage) locate the loading screen and the menu stretches; the menu stretches are then read four frames a second, and the edges of the game over, the loading screen and V's turn are found to the frame.

**What it makes,** in `<clip> opening` beside the clip, or in `--out`:

- `report.txt` and `report.json`: accepted or rejected, what's missing, where each key frame is, every game over that leads into a loading blank, and every loading screen populated;
- `key frames.jpg`: a still of each key frame it used, or NOT FOUND;
- once accepted: **`<clip> with stats.mp4`, beside the clip** (or `--video-out`): the whole clip with V's stats on every loading screen, blended with Lighten so the black drops out and each loading screen's counter shows through. The clip itself is never changed. Also `loading screens.jpg`, a still from each populated loading screen; `layout guide.png`, with every element boxed and the open slots marked; and `layer_static.png`, everything but V.

**Every loading screen** is found from the keyframes and then read frame by frame for where it starts and ends, game over or not. Each gets the same layout, cut from the same menu visit, for `--length` seconds or until it ends. Loading screens shorter than `--min-loading` (default 1.5 seconds) are left as they are and listed in the report. The copy is encoded in HEVC on an NVIDIA card where one works (it's tried on a few frames first), else in x264, keeping full-range color; the sound is copied untouched. Before November 21's change the tool made a ProRes layer for Resolve and a preview of the opening alone; those are gone.

**The layout** is the approved edit's, made for 3440x1440 footage: V's preview panel, ROTATE prompt and all, at the game's own scale on the left; Skill Progression from the top line (y 300) to the bottom line (y 1310); in the right column, the inventory bar on the bottom line with room above it for two more rows, and the affinity card and a two-column grid of stats above that, with three slots open for what the game adds later. The panels' backgrounds are keyed out by brightness. The stats cover `--length` seconds (default 8.98, as in the approved edit) from the moment the loading screen turns black, never past its end. V's turn is slowed to fill that, by up to 1.25x, and then its last frame is held, on each loading screen.

```
python -m pip install numpy scipy Pillow
python tools/skate-short/opening_stats.py "D:\Recordings\takedown.mp4" --check-only
python tools/skate-short/opening_stats.py "D:\Recordings\takedown.mp4"
```

**Tested** on November 21, 2026 (2026:325) on Windows 11 with ffmpeg 9.0.2, Python 3.14, scipy 1.17 and Pillow 13. On `545R-Takedown-000` it found the game over (0:09.3 to 0:10.9), the loading screen (0:10.96 to 0:23.87), V's turn (9:51.74 to 10:00.25), Skill Progression, a clear inventory frame (10:03.6) and the hub, and its build matched the hand-made edit; it took a minute and a half for the 15-minute clip, render included. Run on all 16 exported clips with the nine-element standard, only that one passed. The nearest misses had the game over and loading blank but no spinning model or Skill Progression (`545R-MarinePlaysVeryHardAndGetTriggered`, `545R-NCPD-Assassination-Ernesto`, `545R-Takedown-001.01`). The rest had no game over, or no menus at all. Checked against contact sheets of the whole clip, none of those rejections was a miss. The Steam session `545R-Takedown-000` was cut from (`bg_1091500_20261116_033455`, read through its folder) also passed, in about 3 minutes for its hour. Every element came from the menu visit that holds the most key elements, the same one the clip used. When an element has to come from another visit, the report says so.

The full copy (every loading screen) was added afterwards and tested only on a made-up 3440x1440 clip in a Linux container, with a stand-in stats layer: it found both loading screens to the frame (5.0 to 9.0 and 15.0 to 18.5 seconds), put the stats on both, left the gameplay around them untouched, and kept the clip's length. It took 91 seconds for 20 seconds of footage there, with x264. Not yet run on real footage.

### `skate-short/menu_cut.py`: cut the menus out of a clip

Cuts every menu and inventory screen out of a clip and writes the result beside it as `<clip> no menus.mp4`; the clip itself is never changed (decided November 21, 2026: "removing all the menus and inventory screens. not the loading screen"). With Claude Code it runs as the `menu-cut` skill, separate from `skate-short`.

- **Cut:** every stretch where both outer 240-pixel strips stay black (brightest pixel 12 or under, read at 344x144) and the frame isn't a loading screen: the hub, inventory and backpack, map, journal, skills and perks, crafting, cyberware, breach protocol and the pause menu. Stretches under 0.4 seconds are flickers, not menus; a tenth of a second goes either side of each cut.
- **Kept:** loading screens (mean brightness under 3, counter and all; the skills and game over screens are dark too, at 8 to 15, so ffmpeg's `blackdetect` won't separate them), and every game over: FLATLINED is looked for four times a second, and its whole stretch is kept, with the loading screen after it, until gameplay comes back. That also keeps a loading screen carrying the opening's stats overlay, which isn't black.
- **Its place in the pipeline:** after the opening template has accepted the clip and populated its loading screens, and after your own trim; the transitions come after it. The overlay is cut from the menus this removes, so the opening template always runs first.
- **Populated loading screens:** one that follows a game over is kept with it. One that doesn't is kept as long as its stats light the outer strips (V's preview starts 50 pixels from the left edge and the inventory column reaches 3347), but that hasn't been checked on real footage. Look at `cuts.jpg`: if a loading screen with stats is marked CUT, run it again with `--keep FROM-TO` around it. `--keep` protects any stretch.

```
python tools/skate-short/menu_cut.py "D:\Recordings\takedown.mp4" --check-only
python tools/skate-short/menu_cut.py "D:\Recordings\takedown.mp4"
```

`--check-only` writes the folder `<clip> menu cut` (`report.txt`, `cuts.csv`, and `cuts.jpg` with a still of each cut and each kept game over) and stops. The render joins the remaining pieces with ffmpeg's concat filter, in HEVC on an NVIDIA card (`hevc_nvenc`, tried on a few frames first, since ffmpeg lists it with no card too; else x264), keeping full-range color, with the sound re-encoded to AAC.

**Tested** on November 21, 2026 on `545R-Takedown-000` (with its opening overlay): it cut the 5 minutes 34 seconds of menus (8:57.8 to 14:32.1) and kept the game over and loading screen, taking the clip from 14:53 to 9:19 (written 9:19.08 against 9:19.06 expected; sound and picture within 43 milliseconds). Reading took 2 minutes and the render 3.

### `skate-short/vhs_transitions.py`: VHS glitches on the cuts you pick

The last step of the pipeline (decided November 21, 2026). It puts the treatment's VHS glitch on each cut you designate: the colors split, tape static washes over the picture, and a bright tracking line rolls down the frame, from 0.12 seconds before the cut to 0.18 after (`--before`, `--after`). The sound isn't touched. The result is written beside the clip as `<clip> transitions.mp4`, with a CSV of where each transition went; the clip itself is never changed.

Pick the cuts any of three ways, and mix them:

- **`--at TIME`:** a time in the clip, as seconds, MM:SS or HH:MM:SS. Repeat it.
- **`--markers FILE.edl`:** markers you put on the cuts in DaVinci Resolve, exported with Timelines > Export > Timeline Markers to EDL, from a timeline holding the clip from its start. `--timeline-start` if the timeline doesn't start at 01:00:00:00.
- **`--cut N`:** a cut the menu cut made, by its number in that cut's report (`<clip> menu cut/report.json`, found beside the clip). Repeat it, or give a list: `--cut 2,5,7`. A menu cut at the very start or end has no join, and is skipped with a note.

Two picks closer together than the glitch is long are merged. `--check-only` lists where the transitions go and stops.

```
python tools/skate-short/vhs_transitions.py "D:\Recordings\takedown no menus.mp4" --cut 2,3 --at 4:12 --check-only
python tools/skate-short/vhs_transitions.py "D:\Recordings\takedown no menus.mp4" --cut 2,3 --at 4:12 --markers trims.edl
```

**Tested** on a made-up 12-second clip in a Linux container: menu cuts, a time and a Resolve marker all landed where expected, the glitch showed on each cut and nowhere else, and the length and sound were unchanged. Not yet run on real footage, or on a marker file exported from Resolve itself.

### `skate-short/blind_test.py`: does the pattern pick what you would?

A blind test of how moments, key frames and framing get picked. You mark the moments you'd put in a Short, and the key frames of two or three of them, from a marking copy of a recording; Claude picks separately and seals its picks with a SHA-256 of each file, so it can be checked afterwards that nothing changed. The scoring is fixed in the script before anyone marks anything:

- **Moments:** recall (how many of yours Claude found) and precision (how many of Claude's you also marked). Two moments match if they overlap or come within a second of it.
- **Where to look:** for each of your moments, whether a still every 5, 2 or 1 seconds lands inside it, against whether a loudness or motion peak does, with what each way costs in stills.
- **Key frames:** how many frames off Claude's are, beat by beat (wind-up, hit, reaction, settle).
- **Framing:** you rate Claude's window on each matched moment as holds, partly or misses, from a sheet the comparison makes.

```
python tools/skate-short/blind_test.py prepare "<recording>" --start 0:36 --end 10:30 --out blind-tests/01
python tools/skate-short/blind_test.py signals blind-tests/01
python tools/skate-short/blind_test.py stills blind-tests/01 --signals --name candidates
python tools/skate-short/blind_test.py closeup blind-tests/01 --at 1:19 --span 6 --rate 6 --name m1
python tools/skate-short/blind_test.py seal blind-tests/01
python tools/skate-short/blind_test.py compare blind-tests/01
```

`prepare` writes the marking copy (the range at 1920 wide with the recording time burnt in), two blank sheets and `HOW-TO-MARK.txt`. The test folders hold large videos, so `blind-tests/` is kept out of git on this machine (`.git/info/exclude`); only the script is in the repo.

Test 01 (November 19, 2026) used the Nov 17 session from 0:36 to 10:30. It ended unmarked on November 20, when that clip was broken down group by group for editing by hand instead; Claude's sealed picks stay in its folder.
