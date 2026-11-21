#!/usr/bin/env python3
"""Cut a Cyberpunk 2077 clip down to a story: the pieces you pick, joined frame-exact,
with the VHS glitch on every join, in a wide version and one ready for the vertical crop.

The story cut (decided November 21, 2026) follows the user's direction, beat by beat,
and stays under three minutes; nothing before the end of the loading screen is
trimmed. The picks are a CSV, one piece per row: from, to, what happens (times in
the clip as seconds, MM:SS or HH:MM:SS; an empty "to" runs to the end):

    from,to,beat
    0,30,"Game over, the loading screen, sneaking in"
    0:43,0:46.6,"Tag 1: the Racketeer by the dumpster"

Each piece's ends are moved to the nearest frame, and the sound fades in and out over
15 milliseconds at each join, so nothing pops. Then vhs_transitions.py puts its glitch
on every join.

  wide:      the pieces as they are, the widescreen loading screen and all:
             "<name> wide.mp4" beside the clip
  vertical:  the same, with the vertical loading screen (vertical_loading.py) laid over
             black for the loading screen, in the 9:16 window the skate crop uses:
             "<name> cut/<name> for vertical.mp4", for skate_short.py
             (--keep-menus --no-loading, the crop at the template's window position
             through the loading screen)

The folder "<name> cut" beside the clip gets plan.csv (each piece's place in the story
and in the clip), joins.json and transitions.csv, and each version without its
glitches. The clip itself is never changed.

Needs ffmpeg and ffprobe on the PATH (an NVIDIA card's hevc_nvenc encoder, else
x264), and Python 3 with numpy, scipy and Pillow.
"""
import argparse
import csv
import json
import subprocess
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import opening_stats as o  # noqa: E402
import vhs_transitions as vhs  # noqa: E402

NVENC = ["-c:v", "hevc_nvenc", "-preset", "p5", "-tune", "hq", "-rc", "vbr", "-cq", "16", "-b:v", "0",
         "-maxrate", "80M", "-bufsize", "160M", "-tag:v", "hvc1"]
X264 = ["-c:v", "libx264", "-preset", "medium", "-crf", "14"]


def read_picks(path):
    rows = []
    with open(path, newline="", encoding="utf-8-sig") as fh:
        for r in csv.DictReader(fh):
            a = vhs.parse_time(r["from"])
            b = vhs.parse_time(r["to"]) if (r.get("to") or "").strip() else None
            rows.append((a, b, (r.get("beat") or "").strip()))
    if not rows:
        o.die(f"no pieces in {path}")
    return rows


def render(src, segs, out, vload=None, loading=None, window_x=None):
    n = len(segs)
    inputs, parts = [], []
    for i, (a, b, _) in enumerate(segs):
        d = b - a
        inputs += ["-ss", f"{a:.6f}", "-t", f"{d:.6f}", "-i", src]
        parts.append(f"[{i}:a]afade=t=in:d=0.015,afade=t=out:st={max(0.0, d - 0.015):.6f}:d=0.015[a{i}]")
    if vload:
        L0, L1 = loading
        inputs += ["-i", str(vload)]
        # Black over the loading screen, then the vertical layout in the 9:16 window; in RGB, full range both ways.
        parts += [f"[0:v]scale=in_range=pc:out_range=pc,format=gbrp[m0]",
                  f"color=c=black:s={o.FW}x{o.FH}:r=60:d={L1 - L0:.6f},format=gbrp,setpts=PTS-STARTPTS+{L0:.6f}/TB[blk]",
                  f"[{n}:v]format=gbrp,setpts=PTS-STARTPTS+{L0:.6f}/TB[vl]",
                  "[m0][blk]overlay=0:0:eof_action=pass:format=gbrp[m1]",
                  f"[m1][vl]overlay={window_x}:0:eof_action=pass:format=gbrp,"
                  "scale=out_range=pc,format=yuv420p,setparams=range=pc[v0]"]
    else:
        parts.append("[0:v]null[v0]")
    fc = (";".join(parts) + ";[v0][a0]" + "".join(f"[{i}:v][a{i}]" for i in range(1, n)) +
          f"concat=n={n}:v=1:a=1[v][a]")
    enc = NVENC if o.encoder()[1] else X264
    cmd = (["ffmpeg", "-v", "error", "-stats", "-nostdin", "-y"] + inputs +
           ["-filter_complex", fc, "-map", "[v]", "-map", "[a]", "-c:a", "aac", "-b:a", "192k",
            "-fps_mode", "passthrough"] + enc +
           ["-color_range", "pc", "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709",
            "-movflags", "+faststart", str(out)])
    p = subprocess.run(cmd, stderr=subprocess.PIPE, text=True, errors="replace")
    if p.returncode:
        o.die("the render failed:\n" + "\n".join(p.stderr.splitlines()[-10:]))


def glitch(src, out, joins, before=0.12, after=0.18):
    info = o.probe(str(src))
    band = Path(out).with_name("_tracking_band.png")
    vhs.band_png(band, info["width"], info["height"])
    vhs.render(str(src), info, out, joins, before, after, band)
    band.unlink(missing_ok=True)


def main():
    ap = argparse.ArgumentParser(description="Cut a clip down to the picked pieces, with VHS glitches on the joins.")
    ap.add_argument("video", help="the clip, usually the menu cut's '<clip> no menus.mp4'")
    ap.add_argument("--picks", required=True, help="the CSV of pieces: from, to, beat")
    ap.add_argument("--name", help="the story's name (default: '<clip> story'); names the outputs")
    ap.add_argument("--versions", default="wide,vertical", help="wide, vertical, or both (default)")
    ap.add_argument("--vertical-loading", help="the vertical loading screen, from vertical_loading.py "
                                               "(default: '<clip> vertical loading.mkv' beside the clip)")
    ap.add_argument("--loading", metavar="FROM-TO", help="where the loading screen is in the clip (default: "
                                                         "read from the vertical loading screen's .json)")
    ap.add_argument("--template", help="the template file (default: beside the video, else beside this script)")
    ap.add_argument("--max", type=float, default=180.0, help="longest the story may be, seconds (default 180)")
    ap.add_argument("--check-only", action="store_true", help="plan the pieces and joins; render nothing")
    args = ap.parse_args()
    o.need("ffmpeg"), o.need("ffprobe")
    clip = Path(args.video)
    if not clip.is_file():
        o.die(f"can't find {clip}")
    o.load_template(o.find_template(args.video, args.template))
    versions = [v.strip() for v in args.versions.split(",") if v.strip()]
    name = args.name or f"{clip.stem.removesuffix(' no menus')} story"
    work = clip.with_name(f"{name} cut")
    work.mkdir(exist_ok=True)
    src = str(clip)

    pts = sorted(float(x) for x in o.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries",
                                           "packet=pts_time", "-of", "csv=p=0", src]).stdout.decode().split()
                 if x.strip() not in ("", "N/A"))
    dur = o.probe(src)["duration"]

    def snap(t):
        i = min(range(len(pts)), key=lambda k: abs(pts[k] - t))
        return pts[i]
    segs = []
    for a, b, beat in read_picks(args.picks):
        a2 = 0.0 if a <= 0 else snap(a)
        b2 = dur if b is None or b >= dur else snap(b)
        if b2 <= a2:
            o.die(f"the piece from {o.hms(a)} to {o.hms(b if b is not None else dur)} is empty")
        segs.append((a2, b2, beat))
    total = sum(b - a for a, b, _ in segs)
    joins, acc = [], 0.0
    for a, b, _ in segs[:-1]:
        acc += b - a
        joins.append(acc)
    with open(work / "plan.csv", "w", newline="", encoding="utf-8") as fh:
        w = csv.writer(fh)
        w.writerow(["piece", "in the story from", "to", "length", "from the clip", "to", "what happens"])
        acc = 0.0
        for k, (a, b, beat) in enumerate(segs, 1):
            w.writerow([k, o.hms(acc), o.hms(acc + b - a), f"{b - a:.2f}", o.hms(a), o.hms(b), beat])
            acc += b - a
    (work / "joins.json").write_text(json.dumps({"pieces": segs, "joins": joins, "total": total}, indent=1),
                                     encoding="utf-8")
    lines = [f"{name}: {len(segs)} pieces, {o.hms(total)}, {len(joins)} joins"]
    if total > args.max:
        o.die(f"the story is {o.hms(total)}, longer than {o.hms(args.max)}. Trim the picks.")
    if args.check_only:
        print("\n".join(lines + [f"Check only: the plan is in {work / 'plan.csv'}."]))
        return

    if "wide" in versions:
        raw = work / f"{name} wide, no transitions.mp4"
        print("rendering the wide version...")
        render(src, segs, raw)
        final = clip.with_name(f"{name} wide.mp4")
        print("adding the VHS glitches...")
        glitch(raw, final, joins)
        lines.append(f"Wide: {final.name}, {o.hms(o.probe(str(final))['duration'])}")
    if "vertical" in versions:
        vload = Path(args.vertical_loading) if args.vertical_loading else clip.with_name(
            f"{clip.stem.removesuffix(' no menus')} vertical loading.mkv")
        if not vload.exists():
            o.die(f"no vertical loading screen at {vload}. Make it with vertical_loading.py.")
        meta = vload.with_suffix(".json")
        if args.loading:
            a, _, b = args.loading.partition("-")
            loading = (float(a), float(b))
        elif meta.exists():
            loading = tuple(json.loads(meta.read_text(encoding="utf-8"))["loading"])
        else:
            o.die("give --loading FROM-TO: there's no .json beside the vertical loading screen")
        if not any(a <= loading[0] and b >= loading[1] for a, b, _ in segs):
            o.die(f"the loading screen ({o.hms(loading[0])} to {o.hms(loading[1])}) isn't whole in one piece")
        if segs[0][0] > 0 or segs[0][1] < loading[1]:
            o.die("the first piece has to run from the start of the clip through the loading screen")
        cw = o.T["vertical"]["canvas"][0]
        window_x = round(o.T["vertical"]["window"] * (o.FW - cw))
        raw = work / f"{name} for vertical, no transitions.mp4"
        print("rendering the version for the vertical crop...")
        render(src, segs, raw, vload, loading, window_x)
        final = work / f"{name} for vertical.mp4"
        print("adding the VHS glitches...")
        glitch(raw, final, joins)
        lines.append(f"For the vertical crop: {final.name} (in {work.name}), loading screen in the 9:16 window at "
                     f"x {window_x}; give skate_short.py --keep-menus --no-loading and the crop at "
                     f"{o.T['vertical']['window']:g} from {o.hms(loading[0])} to {o.hms(loading[1])}")
    with open(work / "transitions.csv", "w", newline="", encoding="utf-8") as fh:
        w = csv.writer(fh)
        w.writerow(["cut at", "seconds", "glitch from", "glitch to"])
        for t in joins:
            w.writerow([o.hms(t), f"{t:.3f}", o.hms(max(0, t - 0.12)), o.hms(t + 0.18)])
    lines.append(f"The plan, joins and the versions without glitches are in {work.name}. The clip is unchanged.")
    print("\n".join(lines))


if __name__ == "__main__":
    main()
