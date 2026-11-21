#!/usr/bin/env python3
"""Put a VHS glitch and tape static on the cuts you pick in a Cyberpunk 2077 clip.

The last step of the clip pipeline: the opening template (opening_stats.py)
gates the clip and populates its loading screens; you trim the populated copy
for content; the menu cut (menu_cut.py) takes out the menus; then this puts the
treatment's VHS glitch on the cuts you designate (decided November 21, 2026).

Pick the cuts any of three ways, and mix them:
  --at TIME          a time in the clip, as seconds, MM:SS or HH:MM:SS (repeat it)
  --markers FILE     timeline markers exported from DaVinci Resolve as an EDL
                     (Timelines > Export > Timeline Markers to EDL), from a
                     timeline holding this clip from its start
  --cut N            a cut the menu cut made, by its number in that cut's report
                     ("<clip> menu cut/report.json" beside the clip it cut);
                     repeat it or give a list, 2,5,7

The glitch runs from a little before each cut to a little after it: the colors
split, tape static washes over the picture, and a bright tracking line rolls
down the frame. The sound isn't touched. The clip itself is never changed: the
result is written beside it as "<clip> transitions.mp4", with a CSV of where
each transition went.

Needs ffmpeg and ffprobe on the PATH, and Python 3 with numpy, scipy and Pillow
(through opening_stats, whose readers it shares).
"""
import argparse
import csv
import json
import os
import re
import subprocess
import sys
from pathlib import Path

from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent))
import opening_stats as o  # noqa: E402  (shares probe, hms, the encoder choice)


def parse_time(text):
    parts = text.strip().split(":")
    if not 1 <= len(parts) <= 3 or not all(re.fullmatch(r"\d+(\.\d+)?", p) for p in parts):
        o.die(f"can't read the time '{text}'. Use seconds, MM:SS or HH:MM:SS.")
    secs = 0.0
    for p in parts:
        secs = secs * 60 + float(p)
    return secs


def tc_frames(tc, nominal):
    h, m, s, f = (int(x) for x in re.split(r"[:;]", tc))
    return (h * 3600 + m * 60 + s) * nominal + f


def read_markers(path, fps, timeline_start):
    """(seconds into the clip, marker name) for every marker in a Resolve marker EDL."""
    nominal = round(fps)
    start = tc_frames(timeline_start, nominal)
    out, last = [], None
    tc = r"(\d\d[:;]\d\d[:;]\d\d[:;]\d\d)"
    for line in Path(path).read_text(encoding="utf-8", errors="replace").splitlines():
        m = re.match(rf"^\s*\d+\s+\S+\s+\S+\s+\S+\s+{tc}\s+{tc}\s+{tc}\s+{tc}", line)
        if m:
            last = (tc_frames(m.group(3), nominal) - start) / fps
            out.append([last, ""])
            continue
        name = re.search(r"\|M:(.*?)(?:\s+\|D:|$)", line)
        if name and out:
            out[-1][1] = name.group(1).strip()
    return [(t, n) for t, n in out]


def menu_cut_joins(clip, report_path=None):
    """Where each menu cut landed in the cut version: {cut number: seconds}."""
    if report_path is None:
        stem = clip.stem[:-len(" no menus")] if clip.stem.endswith(" no menus") else clip.stem
        report_path = clip.with_name(f"{stem} menu cut") / "report.json"
    if not Path(report_path).exists():
        o.die(f"--cut needs the menu cut's report, and there's none at {report_path}. "
              "Give it with --menu-report.")
    r = json.loads(Path(report_path).read_text(encoding="utf-8"))
    pieces = sorted(r["pieces"])
    joins = {}
    for k, (c0, _c1) in enumerate(sorted(r["cuts"]), 1):
        before = [(a, b) for a, b in pieces if b <= c0 + 0.05]
        after = [(a, b) for a, b in pieces if a >= c0 - 0.05]
        if before and after:
            joins[k] = sum(b - a for a, b in before)
        else:
            joins[k] = None                       # at the very start or end: no join to glitch
    return joins, report_path


def band_png(path, width, height):
    """The tracking line: a soft bright band the width of the frame."""
    h = max(6, height // 40)
    img = Image.new("RGBA", (width, h), (0, 0, 0, 0))
    px = img.load()
    for y in range(h):
        a = int(90 * (1 - abs(y - h / 2) / (h / 2)))
        for x in range(width):
            px[x, y] = (235, 235, 235, a)
    img.save(path)


def render(src, info, out, cuts, before, after, band):
    windows = [(max(0.0, t - before), min(info["duration"], t + after)) for t in cuts]
    on = "+".join(f"between(t,{a:.3f},{b:.3f})" for a, b in windows)
    shift = max(4, round(info["width"] / 280))
    speed = info["height"] * 6                           # the line crosses the frame in about a sixth of a second
    graph = (f"[0:v]rgbashift=rh={shift}:bh=-{shift}:gv={max(2, shift // 3)}:enable='{on}',"
             f"noise=alls=55:allf=t:enable='{on}',"
             f"eq=brightness=0.04:contrast=1.12:enable='{on}'[g];"
             f"[g][1:v]overlay=x=0:y='mod(t*{speed},H)':shortest=1:enable='{on}'[v]")
    enc, nvenc = o.encoder()
    full = info["full_range"]
    fmt = ["-pix_fmt", "yuv420p" if nvenc or not full else "yuvj420p"]
    rng = ["-color_range", "pc"] if full else []
    tags = ["-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709"]
    cmd = (["ffmpeg", "-v", "error", "-stats", "-nostdin", "-y", "-i", src, "-loop", "1", "-i", str(band),
            "-filter_complex", graph, "-map", "[v]"] +
           (["-map", "0:a?", "-c:a", "copy"] if info["audio"] else []) +
           ["-fps_mode", "passthrough"] + enc + fmt + rng + tags + ["-movflags", "+faststart", str(out)])
    p = subprocess.run(cmd, stderr=subprocess.PIPE, text=True, errors="replace")
    if p.returncode:
        o.die("the render failed:\n" + "\n".join(p.stderr.splitlines()[-10:]))
    return windows


def main():
    ap = argparse.ArgumentParser(description="Put a VHS glitch and tape static on the cuts you pick.")
    ap.add_argument("video", help="the clip, usually the menu cut's '<clip> no menus.mp4'")
    ap.add_argument("--at", action="append", default=[], metavar="TIME", help="a cut's time in the clip")
    ap.add_argument("--markers", help="a marker EDL exported from Resolve")
    ap.add_argument("--timeline-start", default="01:00:00:00",
                    help="the Resolve timeline's start timecode (default 01:00:00:00)")
    ap.add_argument("--cut", action="append", default=[], metavar="N", help="a menu cut's number; 2,5,7 for several")
    ap.add_argument("--menu-report", help="the menu cut's report.json (default: found beside the clip)")
    ap.add_argument("--before", type=float, default=0.12, help="glitch seconds before each cut (default 0.12)")
    ap.add_argument("--after", type=float, default=0.18, help="glitch seconds after each cut (default 0.18)")
    ap.add_argument("--check-only", action="store_true", help="list where the transitions go; render nothing")
    ap.add_argument("--out", help="the result (default: '<clip> transitions.mp4' beside the clip)")
    args = ap.parse_args()
    o.need("ffmpeg"), o.need("ffprobe")
    clip = Path(args.video)
    if not clip.is_file():
        o.die(f"can't find {clip}")
    src = str(clip)
    info = o.probe(src)
    fps_txt = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries",
                              "stream=avg_frame_rate", "-of", "csv=p=0", src], capture_output=True, text=True).stdout
    num, _, den = fps_txt.strip().partition("/")
    fps = float(num) / float(den or 1) if num else 60.0

    picks = []                                        # (seconds, where it came from)
    for item in args.at:
        picks.append((parse_time(item), f"--at {item}"))
    if args.markers:
        for t, name in read_markers(args.markers, fps, args.timeline_start):
            picks.append((t, f"marker {name or '(unnamed)'}"))
    notes = []
    if args.cut:
        joins, rpath = menu_cut_joins(clip, args.menu_report)
        for item in args.cut:
            for n in (x.strip() for x in item.split(",") if x.strip()):
                if not n.isdigit() or int(n) not in joins:
                    o.die(f"--cut {n}: the menu cut's report has cuts 1 to {len(joins)}")
                if joins[int(n)] is None:
                    notes.append(f"menu cut {n} is at the very start or end, so there's no join to glitch")
                else:
                    picks.append((joins[int(n)], f"menu cut {n}"))
    if not picks:
        o.die("no cuts picked. Use --at, --markers or --cut.")
    kept = []
    for t, why in sorted(picks):
        if not 0 <= t <= info["duration"]:
            notes.append(f"{why} at {o.hms(t)} is outside the clip ({o.hms(info['duration'])}); skipped")
        elif kept and t - kept[-1][0] < args.before + args.after:
            notes.append(f"{why} at {o.hms(t)} is on top of the one at {o.hms(kept[-1][0])}; merged")
        else:
            kept.append((t, why))

    out = Path(args.out) if args.out else clip.with_name(f"{clip.stem} transitions.mp4")
    lines = [f"{clip.name}: {len(kept)} transition(s)"]
    lines += [f"  {o.hms(t)}  {why}" for t, why in kept]
    lines += [f"Note: {n}" for n in notes]
    with open(out.with_suffix(".csv"), "w", newline="", encoding="utf-8") as fh:
        w = csv.writer(fh)
        w.writerow(["cut at", "seconds", "from", "glitch from", "glitch to"])
        for t, why in kept:
            w.writerow([o.hms(t), f"{t:.3f}", why, o.hms(max(0, t - args.before)), o.hms(t + args.after)])
    if args.check_only:
        lines.append(f"Check only: nothing rendered. The list is in {out.with_suffix('.csv').name}.")
    else:
        band = out.with_name("_tracking_band.png")
        band_png(band, info["width"], info["height"])
        print(f"rendering {len(kept)} transition(s)...")
        render(src, info, out, [t for t, _ in kept], args.before, args.after, band)
        band.unlink(missing_ok=True)
        got = o.probe(str(out))["duration"]
        lines.append(f"Written: {out.name}, {o.hms(got)} (the clip is {o.hms(info['duration'])}); "
                     "the clip itself is unchanged.")
    print("\n".join(lines))


if __name__ == "__main__":
    main()
