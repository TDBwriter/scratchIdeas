#!/usr/bin/env python3
"""Cut every menu and inventory screen out of a Cyberpunk 2077 clip; keep the loading screens.

On an ultrawide (3440x1440) recording the game draws every menu at 16:9 with
black bars down both sides: the hub, the inventory and backpack, the map, the
journal, skills and perks, crafting, cyberware, breach protocol, the pause
menu. Gameplay fills the frame and its HUD reaches the edges. So a menu is a
stretch where both outer strips stay black and the frame itself isn't black.

What stays:
  * loading screens, black or with the opening's stats overlay on them;
  * game over screens (FLATLINED), with what leads into them and the loading
    screen after them, until gameplay comes back. They open every video
    (the opening template), so they aren't cut as menus. FLATLINED is looked
    for four times a second; a loading screen is a frame whose mean brightness
    stays under LOADING.

The clip itself is never changed. The cut version is written beside it as
"<clip> no menus.mp4", with a folder "<clip> menu cut" holding the report, the
cut list and a contact sheet of every cut. --check-only stops before the
render. It comes after the opening template (opening_stats.py), which gates
the clip and populates its loading screens, and after your own trim for
content; the transitions (vhs_transitions.py) come after it. A populated
loading screen that doesn't follow a game over is kept as long as its stats
reach the outer strips; --keep FROM-TO protects any stretch by hand.

Needs ffmpeg and ffprobe on the PATH (an NVIDIA card's hevc_nvenc encoder,
else libx264), and Python 3 with numpy, scipy and Pillow.
"""
import argparse
import csv
import json
import os
import re
import subprocess
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont

sys.path.insert(0, str(Path(__file__).resolve().parent))
import opening_stats as o  # noqa: E402  (shares the template, the FLATLINED reference and the readers)

BARS = 12          # brightest an outer strip gets (0-255) and still counts as a menu's black bar
LOADING = 3.0      # a loading screen's mean brightness stays under this (about 0.1 to 2, counter and all);
                   # dark menus (skills, game over) sit around 8 to 15, so ffmpeg's blackdetect won't do
BRIDGE = 0.25      # menu frames this close together are one menu
MIN_MENU = 0.4     # shorter dark-edged flickers aren't menus
PAD = 0.1          # cut a little either side, for the menu's own open and close
NVENC = ["-c:v", "hevc_nvenc", "-preset", "p5", "-tune", "hq", "-rc", "vbr", "-cq", "19", "-b:v", "0",
         "-maxrate", "60M", "-bufsize", "120M", "-tag:v", "hvc1"]
X264 = ["-c:v", "libx264", "-preset", "medium", "-crf", "16"]


FLAT_FPS = 4       # how often the game over title is looked for


def frames_info(src, workdir, m):
    """One pass over the clip. Per frame: (time, brightest pixel in the two outer strips,
    mean brightness), at 344x144, where the strips are the outer 240 pixels each side;
    the black stretches; and the times the game over title (FLATLINED) shows, looked for
    four times a second in the part of the frame where it appears."""
    tmpl, (x0, y0, x1, y1) = m.t["flatlined"]                    # half size, search box at half size
    fx, fy, fw, fh = x0 * o.HALF, y0 * o.HALF, (x1 - x0) * o.HALF, (y1 - y0) * o.HALF
    w, h = x1 - x0, y1 - y0
    graph = ("[0:v]split=2[full][s];"
             f"[full]fps={FLAT_FPS},crop={fw}:{fh}:{fx}:{fy},scale={w}:{h}:flags=area,format=gray[fo];"
             "[s]scale=344:144,setsar=1,split=3[a][l][r];"
             "[a]signalstats,metadata=mode=print:key=lavfi.signalstats.YAVG:file=_avg.txt[ao];"
             "[l]crop=24:144:0:0[l2];[r]crop=24:144:320:0[r2];"
             "[l2][r2]hstack,signalstats,metadata=mode=print:key=lavfi.signalstats.YMAX:file=_strips.txt[bo]")
    errlog = workdir / "_ffmpeg.log"
    flats = []
    with open(errlog, "w", encoding="utf-8", errors="replace") as err:
        p = subprocess.Popen(["ffmpeg", "-hide_banner", "-nostats", "-y", "-i", src, "-an", "-filter_complex", graph,
                              "-map", "[fo]", "-f", "rawvideo", "-",
                              "-map", "[ao]", "-f", "null", os.devnull, "-map", "[bo]", "-f", "null", os.devnull],
                             cwd=workdir, stdout=subprocess.PIPE, stderr=err)
        k = 0
        while True:
            buf = p.stdout.read(w * h)
            if len(buf) < w * h:
                break
            if o.ncc_max(np.frombuffer(buf, np.uint8).reshape(h, w), tmpl) > o.MATCH:
                flats.append(k / FLAT_FPS)
            k += 1
        p.wait()
    log = errlog.read_text(errors="replace")
    if p.returncode:
        o.die("reading the clip failed:\n" + "\n".join(log.splitlines()[-8:]))
    strips = re.findall(r"pts_time:([\d.]+)\s+lavfi\.signalstats\.YMAX=([\d.]+)",
                        (workdir / "_strips.txt").read_text(errors="replace"))
    avgs = re.findall(r"pts_time:([\d.]+)\s+lavfi\.signalstats\.YAVG=([\d.]+)",
                      (workdir / "_avg.txt").read_text(errors="replace"))
    for f in ("_strips.txt", "_avg.txt", "_ffmpeg.log"):
        (workdir / f).unlink()
    n = min(len(strips), len(avgs))
    return [(float(strips[i][0]), float(strips[i][1]), float(avgs[i][1])) for i in range(n)], flats


def spans(times, gap):
    out = []
    for t in times:
        if out and t - out[-1][1] <= gap:
            out[-1][1] = t
        else:
            out.append([t, t])
    return out


def parse_time(text):
    parts = text.strip().split(":")
    if not 1 <= len(parts) <= 3 or not all(re.fullmatch(r"\d+(\.\d+)?", p) for p in parts):
        o.die(f"can't read the time '{text}'. Use seconds, MM:SS or HH:MM:SS.")
    secs = 0.0
    for p in parts:
        secs = secs * 60 + float(p)
    return secs


def plan_cuts(frames, flats, duration, keep=()):
    menu_t = [t for t, ymax, avg in frames if ymax <= BARS and avg >= LOADING]
    menus = [s for s in spans(menu_t, BRIDGE) if s[1] - s[0] >= MIN_MENU]
    game_t = [t for t, ymax, _avg in frames if ymax > BARS]
    kept, cuts = list(keep), []
    for a, b in menus:
        over = [t for t in flats if a - 0.5 <= t <= b + 0.5]
        if over:
            # The game over, what leads into it, and the loading screen after it (black, or with
            # the opening's stats on it), until gameplay comes back.
            back = next((t for t in game_t if t > max(over)), duration)
            kept.append((a, back))
        else:
            cuts.append((max(0.0, a - PAD), min(duration, b + PAD)))
    cuts = [c for c in cuts if not any(k0 <= c[0] and c[1] <= k1 for k0, k1 in kept)]
    trimmed = []
    for c0, c1 in cuts:                                   # never cut into a kept stretch
        for k0, k1 in kept:
            if c0 < k1 and c1 > k0:
                c1 = min(c1, k0) if c0 < k0 else c1
                c0 = max(c0, k1) if c1 > k1 else c0
        if c1 - c0 > PAD + 0.05:                          # what's left of a pad alone isn't a menu
            trimmed.append((c0, c1))
    merged = []
    for c in sorted(trimmed):
        if merged and c[0] <= merged[-1][1]:
            merged[-1] = (merged[-1][0], max(merged[-1][1], c[1]))
        else:
            merged.append(c)
    return merged, kept


def keep_segments(cuts, duration):
    segs, t = [], 0.0
    for a, b in cuts:
        if a - t > 0.05:
            segs.append((t, a))
        t = max(t, b)
    if duration - t > 0.05:
        segs.append((t, duration))
    return segs


def contact(src, cuts, kept, out, font_path):
    items = [("CUT", a, b) for a, b in cuts] + [("KEPT game over + loading", a, b) for a, b in kept]
    items.sort(key=lambda x: x[1])
    if not items:
        return
    try:
        fnt = ImageFont.truetype(font_path, 20)
    except OSError:
        fnt = ImageFont.load_default()
    tiles = []
    for label, a, b in items:
        im = Image.fromarray(o.grab(src, (a + b) / 2)).resize((573, 240), Image.LANCZOS)
        d = ImageDraw.Draw(im)
        d.rectangle([0, 212, 573, 240], fill=(0, 0, 0))
        color = (255, 90, 90) if label == "CUT" else (120, 220, 120)
        d.text((6, 216), f"{label} {o.hms(a)}-{o.hms(b)} ({b - a:.1f} s)", fill=color, font=fnt)
        tiles.append(im)
    cols = 3
    sheet = Image.new("RGB", (573 * cols, 240 * ((len(tiles) + cols - 1) // cols)), "black")
    for i, im in enumerate(tiles):
        sheet.paste(im, ((i % cols) * 573, (i // cols) * 240))
    sheet.save(out, quality=86)


def render(src, info, segs, out):
    enc = NVENC if o.encoder()[1] else X264     # tried on a few frames: ffmpeg lists hevc_nvenc with no card too
    inputs, parts = [], []
    for i, (a, b) in enumerate(segs):
        inputs += ["-ss", f"{a:.3f}", "-t", f"{b - a:.3f}", "-i", src]
        parts.append(f"[{i}:v]" + (f"[{i}:a]" if info["audio"] else ""))
    fc = "".join(parts) + f"concat=n={len(segs)}:v=1:a={1 if info['audio'] else 0}[v]" + ("[a]" if info["audio"] else "")
    rng = ["-color_range", "pc"] if info["full_range"] else []
    cmd = (["ffmpeg", "-v", "error", "-stats", "-nostdin", "-y"] + inputs + ["-filter_complex", fc, "-map", "[v]"] +
           (["-map", "[a]", "-c:a", "aac", "-b:a", "192k"] if info["audio"] else []) +
           ["-fps_mode", "passthrough"] + enc + rng +
           ["-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709", str(out)])
    p = subprocess.run(cmd, stderr=subprocess.PIPE, text=True, errors="replace")
    if p.returncode:
        o.die("the render failed:\n" + "\n".join(p.stderr.splitlines()[-10:]))


def main():
    ap = argparse.ArgumentParser(description="Cut every menu and inventory screen out of a clip; keep the "
                                             "loading screens and the game overs that lead into them.")
    ap.add_argument("video", help="an MP4")
    ap.add_argument("--out", help="the cut file (default: '<clip> no menus.mp4' beside the clip)")
    ap.add_argument("--template", help="the opening template, for the FLATLINED reference (default: beside "
                                       "the video, else beside this script)")
    ap.add_argument("--check-only", action="store_true", help="find the menus and report; render nothing")
    ap.add_argument("--keep", action="append", default=[], metavar="FROM-TO",
                    help="a stretch never to cut, such as a loading screen with stats read as a menu (repeat it)")
    args = ap.parse_args()
    keep = []
    for item in args.keep:
        a, sep, b = item.partition("-")
        if not sep:
            o.die(f"--keep needs FROM-TO, got '{item}'")
        keep.append((parse_time(a), parse_time(b)))
    o.need("ffmpeg"), o.need("ffprobe")
    o.load_template(o.find_template(args.video, args.template))
    src = o.resolve_input(args.video)
    if os.path.isdir(args.video):
        o.die("give an MP4: export the clip from Steam first")
    clip = Path(src)
    out = Path(args.out) if args.out else clip.with_name(f"{clip.stem} no menus.mp4")
    work = clip.with_name(f"{clip.stem} menu cut")
    work.mkdir(exist_ok=True)
    font_path = next((p for p in [r"C:\Windows\Fonts\consola.ttf",
                                  "/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf"] if os.path.exists(p)), "")
    info = o.probe(src)
    print(f"{clip.name}: {info['width']}x{info['height']}, {o.hms(info['duration'])}")
    if info["width"] / info["height"] < 2.0:
        o.die("this isn't ultrawide footage, so menus have no black bars to find them by")
    print("reading every frame's edges, and looking for game overs...")
    frames, flats = frames_info(src, work, o.Matcher())
    cuts, kept = plan_cuts(frames, flats, info["duration"], keep)
    segs = keep_segments(cuts, info["duration"])
    cut_total = sum(b - a for a, b in cuts)
    with open(work / "cuts.csv", "w", newline="", encoding="utf-8") as fh:
        w = csv.writer(fh)
        w.writerow(["what", "from", "to", "seconds"])
        for a, b in cuts:
            w.writerow(["cut: menu", o.hms(a), o.hms(b), f"{b - a:.2f}"])
        for a, b in kept:
            why = "kept: by --keep" if (a, b) in keep else "kept: game over and loading screen"
            w.writerow([why, o.hms(a), o.hms(b), f"{b - a:.2f}"])
        for a, b in segs:
            w.writerow(["kept: piece of the cut version", o.hms(a), o.hms(b), f"{b - a:.2f}"])
    contact(src, cuts, kept, work / "cuts.jpg", font_path)
    lines = [f"{clip.name}: {len(cuts)} menus cut, {o.hms(cut_total)} in all; "
             f"{o.hms(info['duration'])} -> {o.hms(info['duration'] - cut_total)}"]
    lines += [f"  cut  {o.hms(a)} to {o.hms(b)} ({b - a:.1f} s)" for a, b in cuts]
    lines += [f"  kept {o.hms(a)} to {o.hms(b)}: " + ("by --keep" if (a, b) in keep else "game over and loading screen")
              for a, b in kept]
    if not args.check_only and cuts:
        print(f"rendering {len(segs)} pieces...")
        render(src, info, segs, out)
        got = o.probe(str(out))["duration"]
        lines.append(f"Written: {out.name}, {o.hms(got)} (expected {o.hms(info['duration'] - cut_total)})")
    elif not cuts:
        lines.append("No menus found; nothing to write.")
    text = "\n".join(lines)
    (work / "report.txt").write_text(text + "\n", encoding="utf-8")
    (work / "report.json").write_text(json.dumps({"clip": src, "cuts": cuts, "kept": kept, "pieces": segs,
                                                  "cut_seconds": cut_total}, indent=1), encoding="utf-8")
    print(text)
    print(f"Cut list and contact sheet: {work}")


if __name__ == "__main__":
    main()
