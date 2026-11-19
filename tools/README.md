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

- **The Short, rendered:** cropped to 9:16, with the MiniDV grade, tape grain and scanlines, a VHS glitch on each cut between phases, the camcorder overlay (`PLAY`, `SP` and the publish date as YYYY:DDD) for a moment at each phase, the fisheye on the phases you name, and the title card over the loading screen.
- **The title card** as an image: the mission's name, the minimap location and V's profile, from images you supply. A missing image leaves a labelled empty box.
- **Phase markers** as an EDL for Resolve (Edit page: Timelines > Import > Timeline Markers from EDL) and as a CSV.
- **Contact sheets:** stills every 5 seconds, each labelled with its time in the recording, for picking the phases.
- **`minidv.cube`:** the grade as a LUT, so it can also be applied in Resolve.

**What it finds on its own, and what it doesn't**

- It finds the near-black loading screen and puts the title card there. The cold open is the start of the range you give it.
- It can't tell where the run, the skit breaks, the flashbacks, the coup de grace and the close begin. Those come from `--phase`. With Claude Code, the `skate-short` skill reads the contact sheets and proposes the times for you to check.

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

Then render, with the phase times in recording time:

```
python tools/skate-short/skate_short.py "D:\Recordings\gig.mp4" --mission "Woman of La Mancha" --start 12:40 --end 15:30 --phase run=13:05 --phase skit=13:40 --phase skit=14:10 --phase coup=14:55 --phase close=15:20 --minimap minimap.png --profile profile.png --fisheye coup-de-grace
```

`--help` lists every option. With Claude Code, give it the video's location and the mission's name and it follows `.claude/skills/skate-short/SKILL.md`.

**Things to know**

- **Steam recordings:** export the clip from Steam as an MP4 (Recordings and Screenshots, then Share > Export Video File), or point the tool at the clip's folder. Reading the folder directly needs an ffmpeg build that reads DASH manifests (`session.mpd`); not every build does.
- **Speed:** a test in a cloud container took about 4 minutes for 40 seconds of 60 fps footage. A desktop PC should be faster. `--detect-only` takes seconds.
- **File size:** grain doesn't compress, so the rendered Short is large: about 280 MB for those 40 seconds at the default quality (`--crf 18`). A higher `--crf`, such as 22, makes it smaller.
- **Loading screen not found:** loosen `--black-share` (default 0.92) or `--black-pixel` (default 0.10). If it picks the wrong dark stretch, `--loading 2` takes the second.
- **Markers:** import them before cutting. Timeline markers don't move with trimmed clips. The EDL's form follows what Resolve exports for timeline markers; it hasn't yet been tested in free Resolve, and the CSV lists the same times if it fails.
- **Tested** on a made-up recording in a Linux container. Not yet tested on Windows or on real Steam footage.
