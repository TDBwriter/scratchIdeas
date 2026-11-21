#!/usr/bin/env python3
"""A blind test of how the skate-short pattern picks moments, key frames and framing.

You mark the moments you'd put in a Short, and the key frames of two or three
of them, from a marking copy of the recording, without seeing Claude's picks.
Claude makes its picks separately and seals them: `seal` prints a SHA-256 of
every sealed file, so it can be checked later that nothing changed. Then
`compare` scores the picks against your marks.

  prepare   the marking copy, the blank sheets and the instructions
  signals   loudness and motion peaks in the range: candidate places to look
  stills    a labelled sheet of single stills, for a fixed grid or the signals
  closeup   a close, fast run of stills around one moment, for key frames
  seal      record and print the SHA-256 of the sealed picks
  compare   score the sealed picks against your marks

The scoring is fixed here, before anyone marks anything:
  - Moments: one of yours and one of Claude's match if they overlap, or come
    within 1 second of it. Recall is the share of yours that Claude found;
    precision is the share of Claude's that you also marked.
  - Where to look: for each of your moments, whether a still on a fixed grid
    (every 5, 2 or 1 seconds) falls inside it, and whether a loudness or motion
    peak falls inside it or within half a second, against how many stills each
    way costs.
  - Key frames: for each key frame you gave, how many frames Claude's key frame
    for the same beat of the matching moment is off.
  - Framing: you rate Claude's window on each matched moment as holds, partly
    or misses, on a sheet `compare` makes.
"""
import argparse
import csv
import hashlib
import math
import os
import re
import shutil
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import skate_short as ss  # noqa: E402
from PIL import Image, ImageDraw  # noqa: E402

SEALED = "sealed-claude-picks"
BEATS = ["wind-up", "hit", "reaction", "settle"]
KINDS = ["kill", "death", "funny", "other"]


# ---------------------------------------------------------------- helpers

def secs(text, where=""):
    """'83.4', '1:23.4', '0:01:23.450' -> seconds."""
    parts = text.strip().split(":")
    if not 1 <= len(parts) <= 3 or not all(re.fullmatch(r"\d+(\.\d+)?", p) for p in parts):
        ss.die(f"can't read the time '{text}'{where}. Use the REC counter's form, like 0:01:23.450.")
    value = 0.0
    for p in parts:
        value = value * 60 + float(p)
    return value


def read_test(folder):
    test = {}
    with open(os.path.join(folder, "test.txt"), encoding="utf-8") as fh:
        for line in fh:
            if "=" in line:
                key, value = line.rstrip("\n").split("=", 1)
                test[key] = value
    test["start"], test["end"], test["fps"] = float(test["start"]), float(test["end"]), float(test["fps"])
    return test


def read_rows(path):
    """A CSV (or a .txt holding CSV) -> list of dicts; '#' lines and blank lines skipped."""
    if not os.path.exists(path):
        return []
    with open(path, encoding="utf-8-sig", newline="") as fh:
        rows = [r for r in csv.reader(fh) if r and any(c.strip() for c in r)
                and not r[0].strip().startswith("#")]
    if not rows:
        return []
    head = [h.strip().lower() for h in rows[0]]
    return [dict(zip(head, [c.strip() for c in r])) for r in rows[1:]]


def grab(src, t, path, vf="scale=480:-2"):
    ss.run(["ffmpeg", "-hide_banner", "-nostats", "-y", "-ss", f"{t:.3f}", "-i", src,
            "-frames:v", "1", "-an", "-vf", vf, "-q:v", "3", path])


def tile(items, prefix, cols=4, rows=4):
    """items: [(image path, label)] -> sheets prefix_01.jpg, ...; returns their paths."""
    label_font = ss.font(26)
    per, sheets = cols * rows, []
    for page in range(math.ceil(len(items) / per)):
        chunk = items[page * per:(page + 1) * per]
        with Image.open(chunk[0][0]) as first:
            tw, th = first.size
        sheet = Image.new("RGB", (cols * tw, math.ceil(len(chunk) / cols) * (th + 36)), "black")
        draw = ImageDraw.Draw(sheet)
        for i, (path, label) in enumerate(chunk):
            x, y = (i % cols) * tw, (i // cols) * (th + 36)
            with Image.open(path) as img:
                sheet.paste(img, (x, y + 36))
            draw.text((x + 8, y + 4), label, fill="yellow", font=label_font)
        out = f"{prefix}_{page + 1:02d}.jpg"
        sheet.save(out, quality=85)
        sheets.append(out)
    return sheets


# ---------------------------------------------------------------- prepare

MOMENTS_HEAD = "id,start,end,kind,use,note\n"
KEYFRAMES_HEAD = "moment,beat,time\n"


def prepare(args):
    src = ss.resolve_input(args.video)
    info = ss.probe(src)
    start, end = secs(args.start), secs(args.end)
    out = os.path.abspath(args.out)
    os.makedirs(os.path.join(out, SEALED), exist_ok=True)
    with open(os.path.join(out, "test.txt"), "w", encoding="utf-8") as fh:
        fh.write(f"recording={src}\nstart={start}\nend={end}\nfps={info['fps']}\n")
    for name, head in (("your-moments.txt", MOMENTS_HEAD), ("your-keyframes.txt", KEYFRAMES_HEAD)):
        path = os.path.join(out, name)
        if not os.path.exists(path):
            with open(path, "w", encoding="utf-8") as fh:
                fh.write(head)
    # The marking copy: the range, 1920 wide, with the recording time burnt in.
    font_file = next(c for c in ss.FONT_CANDIDATES if os.path.exists(c) and c.lower().endswith(".ttf"))
    shutil.copyfile(font_file, os.path.join(out, "_font.ttf"))
    counter = (f"drawtext=fontfile=_font.ttf:fontsize=44:fontcolor=white:box=1:boxcolor=black@0.75:"
               f"boxborderw=12:text='REC %{{pts\\:hms\\:{start:.3f}}}':x=24:y=h-th-28")
    ss.run(["ffmpeg", "-hide_banner", "-nostats", "-y", "-ss", f"{start:.3f}", "-t", f"{end - start:.3f}",
            "-i", src, "-vf", f"scale=1920:-2,{counter}", "-c:v", "libx264", "-preset", "veryfast",
            "-crf", "22", "-pix_fmt", "yuv420p", "-r", f"{info['fps']:.3f}", "-c:a", "aac", "-b:a", "160k",
            "-movflags", "+faststart", "marking-copy.mp4"], cwd=out)
    os.remove(os.path.join(out, "_font.ttf"))
    print(f"Marking copy: {os.path.join(out, 'marking-copy.mp4')}")


# ---------------------------------------------------------------- signals

def metadata_series(path, key):
    with open(path, encoding="utf-8", errors="replace") as fh:
        text = fh.read()
    series = []
    for m in re.finditer(r"pts_time:([-\d.]+)\s+" + re.escape(key) + r"=(-?inf|-?[\d.]+)", text):
        value = m.group(2)
        series.append((float(m.group(1)), -70.0 if "inf" in value else float(value)))
    return series


def peaks(series, min_gap, top):
    """The highest points of [(t, score)], best first, at least min_gap seconds apart."""
    picked = []
    for t, v in sorted(series, key=lambda p: -p[1]):
        if all(abs(t - u) >= min_gap for u, _ in picked):
            picked.append((t, v))
        if len(picked) >= top:
            break
    return picked


def signals(args):
    test = read_test(args.folder)
    src, start, end = test["recording"], test["start"], test["end"]
    length = end - start
    work = os.path.join(args.folder, SEALED)
    # Loudness every 100 ms; a sharp rise over the last second marks a shot, a hit, a blast.
    ss.run(["ffmpeg", "-hide_banner", "-nostats", "-y", "-ss", f"{start:.3f}", "-t", f"{length:.3f}",
            "-i", src, "-vn", "-af", "ebur128=metadata=1,ametadata=mode=print:key=lavfi.r128.M:file=_loud.txt",
            "-f", "null", "-"], cwd=work)
    loud = [(start + t, v) for t, v in metadata_series(os.path.join(work, "_loud.txt"), "lavfi.r128.M")]
    rises = []
    for i, (t, v) in enumerate(loud):
        before = [w for u, w in loud[max(0, i - 10):i]]
        rises.append((t, v - min(before) if before else 0.0))
    # Motion: how much each frame differs from the one before (camera turns count too).
    ss.run(["ffmpeg", "-hide_banner", "-nostats", "-y", "-ss", f"{start:.3f}", "-t", f"{length:.3f}",
            "-i", src, "-an", "-vf", "scale=320:-2,select='gte(scene,0)',"
            "metadata=mode=print:key=lavfi.scene_score:file=_scene.txt", "-f", "null", "-"], cwd=work)
    motion = [(start + t, v) for t, v in metadata_series(os.path.join(work, "_scene.txt"), "lavfi.scene_score")]
    # The same budget as a still every 5 seconds, half from each signal.
    budget = int(length // 5) + 1
    picked = [(t, "loud", v) for t, v in peaks(rises, 1.0, budget // 2)]
    picked += [(t, "motion", v) for t, v in peaks(motion, 1.0, budget - budget // 2)]
    picked.sort()
    path = os.path.join(work, "signals.csv")
    with open(path, "w", newline="", encoding="utf-8") as fh:
        writer = csv.writer(fh)
        writer.writerow(["time", "signal", "score"])
        for t, kind, v in picked:
            writer.writerow([ss.fmt_time(t), kind, f"{v:.3f}"])
    for name in ("_loud.txt", "_scene.txt"):
        os.remove(os.path.join(work, name))
    print(f"{len(picked)} candidate places to look ({budget} is the 5-second grid's count): {path}")


# ---------------------------------------------------------------- stills and closeups

def stills(args):
    test = read_test(args.folder)
    src, start, end = test["recording"], test["start"], test["end"]
    work = os.path.join(args.folder, SEALED)
    frames = os.path.join(work, "_frames")
    os.makedirs(frames, exist_ok=True)
    if args.signals:
        rows = read_rows(os.path.join(work, "signals.csv"))
        times = [(secs(r["time"]), r["signal"]) for r in rows]
    else:
        n = int((end - start) // args.every) + 1
        times = [(start + i * args.every, "") for i in range(n)]
    items = []
    for i, (t, note) in enumerate(times):
        path = os.path.join(frames, f"s_{i:04d}.jpg")
        grab(src, t, path)
        items.append((path, f"{ss.fmt_time(t)} {note}".strip()))
    sheets = tile(items, os.path.join(work, args.name))
    shutil.rmtree(frames, ignore_errors=True)
    print(f"{len(items)} stills on {len(sheets)} sheets:")
    print("\n".join(sheets))


def closeup(args):
    """Stills around one moment, close together, from a region of the frame at
    higher resolution than a whole-frame still: for picking key frames."""
    test = read_test(args.folder)
    src = test["recording"]
    work = os.path.join(args.folder, SEALED)
    frames = os.path.join(work, "_frames")
    os.makedirs(frames, exist_ok=True)
    t0 = secs(args.at) - args.span / 2
    region = f"crop=w=iw*{args.width}:h=ih:x=(iw-ow)*{args.across}:y=0"
    ss.run(["ffmpeg", "-hide_banner", "-nostats", "-y", "-ss", f"{t0:.3f}", "-t", f"{args.span:.3f}",
            "-i", src, "-an", "-vf", f"fps={args.rate},{region},scale=480:-2", "-q:v", "3",
            os.path.join(frames, "c_%04d.jpg")])
    files = sorted(f for f in os.listdir(frames) if f.startswith("c_"))
    items = [(os.path.join(frames, f), ss.fmt_time(t0 + i / args.rate)) for i, f in enumerate(files)]
    sheets = tile(items, os.path.join(work, f"closeup_{args.name}"))
    shutil.rmtree(frames, ignore_errors=True)
    print(f"{len(items)} stills at {args.rate} a second, {ss.fmt_time(t0)} on:")
    print("\n".join(sheets))


# ---------------------------------------------------------------- seal

def digests(folder):
    sealed = os.path.join(folder, SEALED)
    out = {}
    for name in sorted(os.listdir(sealed)):
        path = os.path.join(sealed, name)
        if os.path.isfile(path):
            with open(path, "rb") as fh:
                out[name] = hashlib.sha256(fh.read()).hexdigest()
    return out


def seal(args):
    found = digests(args.folder)
    with open(os.path.join(args.folder, "sealed.sha256"), "w", encoding="utf-8") as fh:
        for name, digest in found.items():
            fh.write(f"{digest}  {name}\n")
    for name, digest in found.items():
        print(f"{digest}  {name}")


# ---------------------------------------------------------------- compare

def moments(rows, who):
    out = []
    for i, r in enumerate(rows, 2):
        where = f" ({who}, line {i})"
        out.append({"id": r.get("id", "").strip() or f"line{i}", "start": secs(r["start"], where),
                    "end": secs(r["end"], where), "kind": r.get("kind", "").lower(),
                    "use": r.get("use", "").lower(), "note": r.get("note", "")})
    return out


def keyframes(rows, who):
    out = {}
    for i, r in enumerate(rows, 2):
        out[(r["moment"].strip(), r["beat"].strip().lower())] = secs(r["time"], f" ({who}, line {i})")
    return out


def match(users, mine, slack=1.0):
    """Pair your moments with Claude's, one to one, biggest overlap first."""
    pairs = []
    for u in users:
        for c in mine:
            overlap = min(u["end"], c["end"]) - max(u["start"], c["start"])
            if overlap >= -slack:
                pairs.append((overlap, u["id"], c["id"]))
    pairs.sort(reverse=True)
    paired, used = {}, set()
    for _overlap, ui, ci in pairs:
        if ui not in paired and ci not in used:
            paired[ui] = ci
            used.add(ci)
    return paired


def compare(args):
    folder = args.folder
    test = read_test(folder)
    src, start, end, fps = test["recording"], test["start"], test["end"], test["fps"]
    sealed = os.path.join(folder, SEALED)
    report = []

    # Were the sealed picks changed after sealing?
    recorded = {}
    if os.path.exists(os.path.join(folder, "sealed.sha256")):
        with open(os.path.join(folder, "sealed.sha256"), encoding="utf-8") as fh:
            for line in fh:
                digest, name = line.split(None, 1)
                recorded[name.strip()] = digest
    now = digests(folder)
    changed = [n for n, d in recorded.items() if now.get(n) != d]
    report.append("Seal: " + ("not sealed" if not recorded else
                              "intact" if not changed else "CHANGED: " + ", ".join(changed)))

    users = moments(read_rows(os.path.join(folder, "your-moments.txt")), "your-moments.txt")
    mine = moments(read_rows(os.path.join(sealed, "claude-moments.csv")), "claude-moments.csv")
    if not users:
        ss.die("your-moments.txt has no moments in it yet.")
    paired = match(users, mine)
    yes = [u for u in users if u["use"] == "yes"]
    report += ["", f"MOMENTS: you marked {len(users)} ({len(yes)} yes), Claude picked {len(mine)}.",
               f"  Recall: Claude found {len(paired)} of your {len(users)}"
               + (f" ({sum(1 for u in yes if u['id'] in paired)} of your {len(yes)} yes)" if yes else "") + ".",
               f"  Precision: {len(paired)} of Claude's {len(mine)} are moments you marked.", ""]
    for u in users:
        mark = f"found as {paired[u['id']]}" if u["id"] in paired else "MISSED"
        report.append(f"  {u['id']:>4}  {ss.fmt_time(u['start'])}-{ss.fmt_time(u['end'])}  "
                      f"{u['kind']:<6} {u['use']:<5} {mark}  {u['note']}")
    extra = [c for c in mine if c["id"] not in paired.values()]
    for c in extra:
        report.append(f"  {c['id']:>4}  {ss.fmt_time(c['start'])}-{ss.fmt_time(c['end'])}  "
                      f"{c['kind']:<6} Claude only  {c['note']}")

    # Where to look: fixed grids against the signals, scored on your moments.
    rows = read_rows(os.path.join(sealed, "signals.csv"))
    cands = [secs(r["time"]) for r in rows]
    report += ["", "WHERE TO LOOK (does a still land inside each of your moments?):"]
    for every in (5, 2, 1):
        grid = [start + i * every for i in range(int((end - start) // every) + 1)]
        seen = sum(1 for u in users if any(u["start"] <= g <= u["end"] for g in grid))
        report.append(f"  a still every {every} s: {seen} of {len(users)} moments, {len(grid)} stills")
    if cands:
        seen = sum(1 for u in users if any(u["start"] - 0.5 <= c <= u["end"] + 0.5 for c in cands))
        report.append(f"  loudness and motion peaks: {seen} of {len(users)} moments, {len(cands)} stills")

    # Key frames.
    yours = keyframes(read_rows(os.path.join(folder, "your-keyframes.txt")), "your-keyframes.txt")
    claude = keyframes(read_rows(os.path.join(sealed, "claude-keyframes.csv")), "claude-keyframes.csv")
    errors = []
    report += ["", f"KEY FRAMES ({len(yours)} of yours; frames at {fps:g} fps; + means Claude's is later):"]
    for (moment, beat), t in sorted(yours.items(), key=lambda kv: kv[1]):
        other = claude.get((paired.get(moment, ""), beat))
        if other is None:
            report.append(f"  {moment} {beat}: {ss.fmt_time(t)}; Claude has none"
                          + ("" if moment in paired else " (moment missed)"))
        else:
            off = round((other - t) * fps)
            errors.append(abs(off))
            report.append(f"  {moment} {beat}: yours {ss.fmt_time(t)}, Claude's {ss.fmt_time(other)}: {off:+d} frames")
    if errors:
        report.append(f"  Middle error {sorted(errors)[len(errors) // 2]} frames; "
                      f"within 6 frames (0.1 s): {sum(1 for e in errors if e <= 6)} of {len(errors)}")

    # Framing: a sheet of Claude's window on each matched moment, for you to rate.
    framing = {r["moment"]: r for r in read_rows(os.path.join(sealed, "claude-framing.csv"))}
    rate_path = os.path.join(folder, "framing-to-rate.txt")
    ratings = {r["your moment"]: r.get("rating", "").lower() for r in read_rows(rate_path)}
    items, lines = [], []
    frames = os.path.join(folder, "_frames")
    os.makedirs(frames, exist_ok=True)
    info = ss.probe(src)
    for u in users:
        f = framing.get(paired.get(u["id"], ""))
        if not f:
            continue
        t = yours.get((u["id"], "hit"), secs(f["time"]))
        x, y, z = float(f["across"]), float(f["down"]), float(f["zoom"])
        path = os.path.join(frames, f"f_{u['id']}.jpg")
        grab(src, t, path, vf="scale=960:-2")
        with Image.open(path) as img:
            img = img.convert("RGB")
            left, top, w, h = ss.crop_box(img.width, img.height, x, y, z)
            ImageDraw.Draw(img).rectangle([left, top, left + w - 1, top + h - 1], outline=(255, 0, 0), width=4)
            img.save(path)
        items.append((path, f"{u['id']} {ss.fmt_time(t)}"))
        lines.append([u["id"], paired[u["id"]], ss.fmt_time(t), f"{x:.2f}", f"{y:.2f}", f"{z:g}",
                      ratings.get(u["id"], "")])
    if items:
        sheets = tile(items, os.path.join(folder, "framing-to-rate"), cols=2, rows=3)
        with open(rate_path, "w", newline="", encoding="utf-8") as fh:
            writer = csv.writer(fh)
            writer.writerow(["your moment", "claude moment", "time", "across", "down", "zoom", "rating"])
            writer.writerows(lines)
        scored = [l[6] for l in lines if l[6] in ("holds", "partly", "misses")]
        report += ["", f"FRAMING: {len(items)} of Claude's windows to rate (holds, partly or misses) in "
                   f"framing-to-rate.txt, against the sheets: " + ", ".join(os.path.basename(s) for s in sheets)]
        if scored:
            report.append("  " + ", ".join(f"{k} {scored.count(k)}" for k in ("holds", "partly", "misses")))
    shutil.rmtree(frames, ignore_errors=True)

    # What Claude's picks cost.
    cost = read_rows(os.path.join(sealed, "claude-cost.csv"))
    if cost:
        report += ["", "STILLS CLAUDE LOOKED AT:"]
        report += [f"  {r['stage']}: {r['stills']}" for r in cost]
        report.append(f"  total: {sum(int(r['stills']) for r in cost)}")

    text = "\n".join(report) + "\n"
    with open(os.path.join(folder, "compare-report.txt"), "w", encoding="utf-8") as fh:
        fh.write(text)
    print(text)


# ---------------------------------------------------------------- main

def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest="command", required=True)
    p = sub.add_parser("prepare", help="the marking copy, blank sheets and instructions")
    p.add_argument("video")
    p.add_argument("--start", required=True)
    p.add_argument("--end", required=True)
    p.add_argument("--out", required=True)
    p.set_defaults(run=prepare)
    p = sub.add_parser("signals", help="loudness and motion peaks: candidate places to look")
    p.add_argument("folder")
    p.set_defaults(run=signals)
    p = sub.add_parser("stills", help="a labelled sheet of single stills")
    p.add_argument("folder")
    p.add_argument("--every", type=float, default=5.0, help="a fixed grid, seconds apart")
    p.add_argument("--signals", action="store_true", help="one still per signal peak instead")
    p.add_argument("--name", default="coarse")
    p.set_defaults(run=stills)
    p = sub.add_parser("closeup", help="close, fast stills around one moment")
    p.add_argument("folder")
    p.add_argument("--at", required=True, help="the middle, in recording time")
    p.add_argument("--span", type=float, default=3.0, help="seconds covered")
    p.add_argument("--rate", type=float, default=10.0, help="stills a second")
    p.add_argument("--across", type=float, default=0.5, help="where the region sits, 0-1")
    p.add_argument("--width", type=float, default=0.5, help="the region's share of the frame's width")
    p.add_argument("--name", required=True)
    p.set_defaults(run=closeup)
    p = sub.add_parser("seal", help="record and print the SHA-256 of the sealed picks")
    p.add_argument("folder")
    p.set_defaults(run=seal)
    p = sub.add_parser("compare", help="score the sealed picks against your marks")
    p.add_argument("folder")
    p.set_defaults(run=compare)
    args = ap.parse_args()
    if args.command != "seal":
        ss.need("ffmpeg")
    args.run(args)


if __name__ == "__main__":
    main()
