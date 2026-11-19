#!/usr/bin/env python3
"""Turn a raw Cyberpunk 2077 recording into a skate-style Short, ready to cut.

What it does, given a video file:
  1. Finds the near-black loading screens (ffmpeg's blackdetect).
  2. Writes contact sheets: stills every few seconds, each labelled with its
     time, so the phases can be picked by eye.
  3. Makes the title card from the mission name and the images you give it.
  4. Renders a new copy: vertical 9:16 crop, the MiniDV grade, tape grain and
     scanlines, VHS glitches on the cuts between phases, a camcorder overlay at
     each phase, the fisheye on the phases you name, and the title card over
     the loading screen. The original file is never changed.
  5. Writes the phase markers three ways: an EDL for Resolve's
     "Timeline Markers from EDL", a CSV, and a plain report.

It needs ffmpeg and ffprobe on the PATH, and Python 3 with Pillow.
Run with --help for the options. tools/README.md has examples.
"""
import argparse
import csv
import datetime as dt
import json
import math
import os
import re
import shutil
import subprocess
import sys
import tempfile

try:
    from PIL import Image, ImageDraw, ImageFont
except ImportError:
    sys.exit("Pillow is missing. Install it with:  python -m pip install Pillow")

W, H = 1080, 1920  # the Short's frame

# The phases of a Short, in the order they run. Names are what --phase takes.
PHASES = ["cold-open", "title-card", "run", "skit", "flashback", "coup-de-grace", "close"]
ALIASES = {"coup": "coup-de-grace", "title": "title-card", "cold": "cold-open", "slam": "flashback"}
# Resolve's marker colors, by phase.
COLORS = {"cold-open": "Red", "title-card": "Yellow", "run": "Blue", "skit": "Green",
          "flashback": "Pink", "coup-de-grace": "Purple", "close": "Cyan"}

FONT_CANDIDATES = [
    r"C:\Windows\Fonts\consolab.ttf", r"C:\Windows\Fonts\consola.ttf",
    r"C:\Windows\Fonts\courbd.ttf", r"C:\Windows\Fonts\cour.ttf", r"C:\Windows\Fonts\lucon.ttf",
    "/System/Library/Fonts/Menlo.ttc", "/Library/Fonts/Courier New Bold.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf",
]


# ---------------------------------------------------------------- helpers

def die(msg):
    sys.exit("skate_short: " + msg)


def need(tool):
    if shutil.which(tool) is None:
        die(f"{tool} isn't on the PATH. Install ffmpeg (it includes ffprobe) and try again.")


def parse_time(text):
    """'75', '1:15', '0:01:15.5' -> seconds."""
    parts = text.strip().split(":")
    if not 1 <= len(parts) <= 3 or not all(re.fullmatch(r"\d+(\.\d+)?", p) for p in parts):
        die(f"can't read the time '{text}'. Use seconds, MM:SS or HH:MM:SS.")
    secs = 0.0
    for p in parts:
        secs = secs * 60 + float(p)
    return secs


def fmt_time(t):
    t = max(0.0, t)
    h, rem = divmod(t, 3600)
    m, s = divmod(rem, 60)
    return f"{int(h)}:{int(m):02d}:{s:05.2f}"


def run(cmd, cwd=None, quiet=True):
    proc = subprocess.run(cmd, cwd=cwd, capture_output=True, text=True,
                          encoding="utf-8", errors="replace")
    if proc.returncode != 0:
        tail = "\n".join(proc.stderr.strip().splitlines()[-15:])
        die("this command failed:\n  " + " ".join(cmd) + "\n" + tail)
    return proc


def font(size, path=None):
    for cand in ([path] if path else []) + FONT_CANDIDATES:
        if cand and os.path.exists(cand):
            try:
                return ImageFont.truetype(cand, size)
            except OSError:
                continue
    try:
        return ImageFont.load_default(size=size)
    except TypeError:
        return ImageFont.load_default()


def probe(path):
    out = run(["ffprobe", "-v", "error", "-print_format", "json",
               "-show_format", "-show_streams", path]).stdout
    info = json.loads(out)
    video = next((s for s in info.get("streams", []) if s.get("codec_type") == "video"), None)
    if video is None:
        die(f"no video stream in {path}")
    num, den = (video.get("avg_frame_rate") or video.get("r_frame_rate") or "60/1").split("/")
    fps = float(num) / float(den) if float(den) else 60.0
    duration = float(info.get("format", {}).get("duration") or video.get("duration") or 0)
    has_audio = any(s.get("codec_type") == "audio" for s in info.get("streams", []))
    return {"width": int(video["width"]), "height": int(video["height"]),
            "fps": fps, "duration": duration, "audio": has_audio}


def resolve_input(path):
    """A Steam clip folder holds a session.mpd manifest; ffmpeg can read that."""
    if os.path.isdir(path):
        for root, _dirs, files in os.walk(path):
            if "session.mpd" in files:
                return os.path.join(root, "session.mpd")
        die(f"{path} is a folder with no session.mpd in it. Export the clip from Steam "
            "as an MP4 (Share > Export Video File), or point at the clip's folder.")
    if not os.path.exists(path):
        die(f"can't find {path}")
    return path


# ---------------------------------------------------------------- detection

def detect_black(src, start, length, min_len, pix_th, pic_th):
    """Near-black stretches, in source time."""
    proc = run(["ffmpeg", "-hide_banner", "-nostats", "-ss", f"{start:.3f}", "-t", f"{length:.3f}",
                "-i", src, "-an", "-vf",
                f"scale=320:-2,blackdetect=d={min_len}:pix_th={pix_th}:pic_th={pic_th}",
                "-f", "null", "-"])
    found = []
    for m in re.finditer(r"black_start:([\d.]+)\s+black_end:([\d.]+)", proc.stderr):
        found.append((start + float(m.group(1)), start + float(m.group(2))))
    return found


def contact_sheets(src, start, length, every, outdir, stem, cols=4, rows=4, thumb_w=480):
    frames = os.path.join(outdir, "_frames")
    os.makedirs(frames, exist_ok=True)
    run(["ffmpeg", "-hide_banner", "-nostats", "-y", "-ss", f"{start:.3f}", "-t", f"{length:.3f}",
         "-i", src, "-an", "-vf", f"fps=1/{every},scale={thumb_w}:-2", "-q:v", "4",
         os.path.join(frames, "f_%05d.jpg")])
    files = sorted(f for f in os.listdir(frames) if f.endswith(".jpg"))
    label_font = font(26)
    sheets = []
    per = cols * rows
    for page in range(math.ceil(len(files) / per)):
        chunk = files[page * per:(page + 1) * per]
        first = Image.open(os.path.join(frames, chunk[0]))
        tw, th = first.size
        used_rows = math.ceil(len(chunk) / cols)
        sheet = Image.new("RGB", (cols * tw, used_rows * (th + 36)), "black")
        draw = ImageDraw.Draw(sheet)
        for i, name in enumerate(chunk):
            index = page * per + i
            img = Image.open(os.path.join(frames, name))
            x, y = (i % cols) * tw, (i // cols) * (th + 36)
            sheet.paste(img, (x, y + 36))
            draw.text((x + 8, y + 4), fmt_time(start + index * every), fill="yellow", font=label_font)
        path = os.path.join(outdir, f"{stem}_contact_{page + 1:02d}.jpg")
        sheet.save(path, quality=85)
        sheets.append(path)
    shutil.rmtree(frames, ignore_errors=True)
    return sheets


# ---------------------------------------------------------------- the look

def write_minidv_lut(path, size=33):
    """The MiniDV grade as a 3D LUT: slightly crushed blacks, warm midtones and
    highlights, a little more saturation, and highlights that clip early."""
    def grade(r, g, b):
        out = []
        for c in (r, g, b):
            c = max(0.0, (c - 0.03) / 0.97)   # crush blacks
            c = min(1.0, c / 0.94)            # clip highlights a little early
            out.append(c)
        r, g, b = out
        luma = 0.2126 * r + 0.7152 * g + 0.0722 * b
        x = min(1.0, max(0.0, (luma - 0.25) / 0.6))
        warm = 0.02 + 0.06 * x * x * (3 - 2 * x)  # more warmth in mids and highs
        r, g, b = r + warm, g + warm * 0.25, b - warm * 0.9
        luma = 0.2126 * r + 0.7152 * g + 0.0722 * b
        sat = 1.15
        return [min(1.0, max(0.0, luma + (c - luma) * sat)) for c in (r, g, b)]

    with open(path, "w", encoding="ascii", newline="\n") as fh:
        fh.write('TITLE "Cheap Truth MiniDV"\n')
        fh.write(f"LUT_3D_SIZE {size}\n")
        for bi in range(size):
            for gi in range(size):
                for ri in range(size):
                    r, g, b = grade(ri / (size - 1), gi / (size - 1), bi / (size - 1))
                    fh.write(f"{r:.6f} {g:.6f} {b:.6f}\n")


def write_scanlines(path):
    """480 lines over a 1920-high frame: darken two rows in every four."""
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    for y in range(0, H, 4):
        draw.rectangle([0, y + 2, W, y + 3], fill=(0, 0, 0, 34))
    img.save(path)


def has_glyph(fnt, ch):
    """A font with no glyph for ch draws the same box it draws for an unused code point."""
    try:
        return fnt.getmask(ch).getbbox() != fnt.getmask("\ue000").getbbox()
    except Exception:
        return False


def camcorder_text(draw, date_text, big, small):
    play = "PLAY \u25ba" if has_glyph(big, "\u25ba") else "PLAY >"
    draw.text((60, 70), play, fill="white", font=big)
    draw.text((W - 60 - draw.textlength("SP", font=big), 70), "SP", fill="white", font=big)
    draw.text((W - 60 - draw.textlength(date_text, font=small), H - 120), date_text,
              fill="white", font=small)


def write_camcorder_overlay(path, date_text, font_path):
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    camcorder_text(draw, date_text, font(64, font_path), font(48, font_path))
    img.save(path)


def fit_into(img, box_w, box_h):
    img = img.convert("RGB")
    scale = min(box_w / img.width, box_h / img.height)
    return img.resize((max(1, int(img.width * scale)), max(1, int(img.height * scale))), Image.LANCZOS)


def slot(card, draw, image_path, box, label, label_font):
    x, y, bw, bh = box
    if image_path:
        img = fit_into(Image.open(image_path), bw, bh)
        card.paste(img, (x + (bw - img.width) // 2, y + (bh - img.height) // 2))
    else:
        draw.rectangle([x, y, x + bw, y + bh], outline=(90, 90, 90), width=3)
        tw = draw.textlength(f"[{label}]", font=label_font)
        draw.text((x + (bw - tw) / 2, y + bh / 2 - 20), f"[{label}]", fill=(140, 140, 140), font=label_font)


def wrap(draw, text, fnt, width):
    words, lines, line = text.split(), [], ""
    for word in words:
        test = (line + " " + word).strip()
        if draw.textlength(test, font=fnt) <= width or not line:
            line = test
        else:
            lines.append(line)
            line = word
    if line:
        lines.append(line)
    return lines


def write_title_card(path, mission, minimap, profile, photo, date_text, font_path):
    card = Image.new("RGB", (W, H), "black")
    draw = ImageDraw.Draw(card)
    title_font, label_font = font(84, font_path), font(40, font_path)
    camcorder_text(draw, date_text, font(64, font_path), font(48, font_path))

    y = 250
    for line in wrap(draw, mission.upper(), title_font, W - 120)[:3]:
        draw.text(((W - draw.textlength(line, font=title_font)) / 2, y), line, fill="white", font=title_font)
        y += 100
    y += 30
    draw.text((90, y), "LOCATION", fill="yellow", font=label_font)
    slot(card, draw, minimap, (90, y + 60, W - 180, 520), "minimap", label_font)
    y += 640
    draw.text((90, y), "V", fill="yellow", font=label_font)
    if photo:
        slot(card, draw, profile, (90, y + 60, 560, 620), "profile", label_font)
        slot(card, draw, photo, (680, y + 60, 310, 620), "photo of V", label_font)
    else:
        slot(card, draw, profile, (90, y + 60, W - 180, 620), "profile", label_font)
    card.save(path)


# ---------------------------------------------------------------- markers

def timecode(seconds, fps, base_hours=1):
    nominal = round(fps)
    frames = round(seconds * fps) + base_hours * 3600 * nominal
    f = frames % nominal
    s = frames // nominal
    return f"{s // 3600:02d}:{(s // 60) % 60:02d}:{s % 60:02d}:{f:02d}"


def write_markers(edl_path, csv_path, title, markers, fps):
    """markers: list of (seconds into the Short, name). The EDL follows the form
    Resolve exports for timeline markers; the timeline starts at 01:00:00:00."""
    with open(edl_path, "w", encoding="ascii", errors="replace", newline="\r\n") as fh:
        fh.write(f"TITLE: {title}\nFCM: NON-DROP FRAME\n\n")
        for i, (t, name) in enumerate(markers, 1):
            a, b = timecode(t, fps), timecode(t + 1 / fps, fps)
            fh.write(f"{i:03d}  001      V     C        {a} {b} {a} {b}  \n")
            fh.write(f" |C:ResolveColor{COLORS[name]} |M:{name} |D:1\n\n")
    with open(csv_path, "w", newline="", encoding="utf-8") as fh:
        writer = csv.writer(fh)
        writer.writerow(["phase", "time in the Short", "timeline timecode", "color"])
        for t, name in markers:
            writer.writerow([name, fmt_time(t), timecode(t, fps), COLORS[name]])


# ---------------------------------------------------------------- render

def between(ranges):
    return "+".join(f"between(t,{a:.3f},{b:.3f})" for a, b in ranges) or "0"


def render(src, start, length, info, outdir, stem, title_card, scanlines, overlay,
           loading, phase_marks, fisheye_ranges, glitch, crf):
    vf = []
    # Centre crop to 9:16, whatever the source size.
    if info["width"] / info["height"] > W / H:
        vf.append("crop=w=ih*9/16:h=ih")
    else:
        vf.append("crop=w=iw:h=iw*16/9")
    vf.append(f"scale={W}:{H}:flags=lanczos,setsar=1")
    vf.append("lut3d=file=minidv.cube")
    if fisheye_ranges:
        on = between(fisheye_ranges)
        vf.append(f"lenscorrection=k1=0.18:k2=0.05:i=bilinear:enable='{on}'")
        vf.append(f"vignette=angle=PI/3.5:enable='{on}'")
    vf.append("noise=alls=6:allf=t")
    cuts = [t for t, _ in phase_marks if t > 0.2]
    if glitch and cuts:
        on = between([(t - 0.12, t + 0.18) for t in cuts])
        vf.append(f"rgbashift=rh=8:bh=-8:gv=3:enable='{on}'")
        vf.append(f"noise=alls=45:allf=t:enable='{on}'")
    chain = ",".join(vf)

    card_on = between([loading]) if loading else "0"
    cam_on = between([(t, t + 1.5) for t, name in phase_marks if name != "title-card"])
    graph = (f"[0:v]{chain}[g];"
             f"[g][1:v]overlay=0:0:shortest=1[s];"
             f"[s][2:v]overlay=0:0:shortest=1:enable='{card_on}'[c];"
             f"[c][3:v]overlay=0:0:shortest=1:enable='{cam_on}'[v]")
    out = os.path.join(outdir, f"{stem}_skate.mp4")
    cmd = ["ffmpeg", "-hide_banner", "-nostats", "-y",
           "-ss", f"{start:.3f}", "-t", f"{length:.3f}", "-i", src,
           "-loop", "1", "-i", scanlines, "-loop", "1", "-i", title_card,
           "-loop", "1", "-i", overlay,
           "-filter_complex", graph, "-map", "[v]"]
    if info["audio"]:
        cmd += ["-map", "0:a:0", "-c:a", "aac", "-b:a", "192k"]
    cmd += ["-c:v", "libx264", "-preset", "medium", "-crf", str(crf), "-pix_fmt", "yuv420p",
            "-r", f"{info['fps']:.3f}", "-shortest", "-movflags", "+faststart", out]
    # Run from the output folder so the LUT is found by a plain file name. That
    # avoids escaping a Windows drive letter inside the filter graph.
    run(cmd, cwd=outdir)
    return out


# ---------------------------------------------------------------- main

def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("video", help="the recording: an MP4, or a Steam clip folder (it holds session.mpd)")
    ap.add_argument("--mission", required=True, help="the mission's name, for the title card")
    ap.add_argument("--start", help="where the Short starts in the recording (default: its start)")
    ap.add_argument("--end", help="where it ends (default: the recording's end)")
    ap.add_argument("--phase", action="append", default=[], metavar="NAME=TIME",
                    help="a phase and where it starts, in recording time. Names: " + ", ".join(PHASES)
                    + ". Repeat for each; skit and flashback can repeat.")
    ap.add_argument("--loading", type=int, default=1,
                    help="which black stretch is the loading screen, counting from 1 (default 1)")
    ap.add_argument("--no-loading", action="store_true", help="there's no loading screen to cover")
    ap.add_argument("--minimap", help="an image of the mission's minimap location")
    ap.add_argument("--profile", help="an image of V's profile")
    ap.add_argument("--photo", help="a picture of V (optional)")
    ap.add_argument("--publish-date", help="the day the Short goes up, YYYY-MM-DD (default: today)")
    ap.add_argument("--fisheye", default="", help="phases to put the fisheye on, comma-separated")
    ap.add_argument("--no-glitch", action="store_true", help="no VHS glitches on the cuts between phases")
    ap.add_argument("--detect-only", action="store_true",
                    help="find the loading screens and make contact sheets; don't render")
    ap.add_argument("--sheet-every", type=float, default=5.0, help="seconds between contact-sheet stills")
    ap.add_argument("--black-min", type=float, default=0.8, help="shortest black stretch to count, seconds")
    ap.add_argument("--black-pixel", type=float, default=0.10, help="how dark a pixel must be, 0-1")
    ap.add_argument("--black-share", type=float, default=0.92, help="share of the frame that must be dark, 0-1")
    ap.add_argument("--crf", type=int, default=18, help="video quality, lower is better (default 18)")
    ap.add_argument("--font", help="a .ttf font file for the title card and overlay")
    ap.add_argument("--out", help="output folder (default: a folder next to the video)")
    args = ap.parse_args()

    need("ffmpeg")
    need("ffprobe")
    src = resolve_input(args.video)
    info = probe(src)
    start = parse_time(args.start) if args.start else 0.0
    end = parse_time(args.end) if args.end else info["duration"]
    if info["duration"] and end > info["duration"] + 0.5:
        die(f"--end {fmt_time(end)} is past the recording's end ({fmt_time(info['duration'])}).")
    if end <= start:
        die("--end has to come after --start.")
    length = end - start

    stem = re.sub(r"[^A-Za-z0-9]+", "-", args.mission).strip("-").lower() or "short"
    base = os.path.dirname(os.path.abspath(args.video.rstrip("/\\")))
    outdir = os.path.abspath(args.out or os.path.join(base, f"{stem}_skate-short"))
    os.makedirs(outdir, exist_ok=True)
    report = [f"Short: {args.mission}", f"Recording: {src}",
              f"Range: {fmt_time(start)} to {fmt_time(end)} ({length:.1f} s)",
              f"Source: {info['width']}x{info['height']} at {info['fps']:.2f} fps", ""]
    if length > 180:
        report.append(f"NOTE: the range runs {length:.0f} s. A Short has to be 3 minutes or less, "
                      "so it needs cutting down in the edit.\n")

    # 1. Loading screens.
    blacks = detect_black(src, start, length, args.black_min, args.black_pixel, args.black_share)
    report.append("Near-black stretches found (recording time):")
    report += [f"  {i}. {fmt_time(a)} to {fmt_time(b)}" for i, (a, b) in enumerate(blacks, 1)] or ["  none"]
    loading_src = None
    if not args.no_loading:
        if len(blacks) >= args.loading:
            loading_src = blacks[args.loading - 1]
            report.append(f"Loading screen (title card goes here): stretch {args.loading}.")
        else:
            report.append("No loading screen found, so no title card is placed. Loosen --black-share "
                          "or --black-pixel, or pass --no-loading.")
    report.append("")

    # 2. Contact sheets.
    sheets = contact_sheets(src, start, length, args.sheet_every, outdir, stem)
    report.append("Contact sheets, for picking the phases by eye:")
    report += [f"  {p}" for p in sheets]
    report.append("")

    # 3. Phases, in Short time (seconds from the Short's start).
    marks = [(0.0, "cold-open")]
    if loading_src:
        marks.append((loading_src[0] - start, "title-card"))
    for item in args.phase:
        if "=" not in item:
            die(f"--phase needs NAME=TIME, got '{item}'")
        name, when = item.split("=", 1)
        name = ALIASES.get(name.strip().lower(), name.strip().lower())
        if name not in PHASES:
            die(f"unknown phase '{name}'. Use one of: {', '.join(PHASES)}")
        t = parse_time(when) - start
        if not 0 <= t <= length:
            die(f"--phase {item} falls outside the range {fmt_time(start)} to {fmt_time(end)}.")
        if name in ("cold-open", "title-card"):
            marks = [m for m in marks if m[1] != name]
        marks.append((t, name))
    marks.sort()
    placed = {n for _, n in marks}
    report.append("Phase markers (time in the Short):")
    report += [f"  {fmt_time(t)}  {n}" for t, n in marks]
    missing = [p for p in PHASES if p not in placed and p not in ("flashback",)]
    if missing:
        report.append("Not placed yet: " + ", ".join(missing))
    report.append("")

    edl = os.path.join(outdir, f"{stem}_markers.edl")
    csv_path = os.path.join(outdir, f"{stem}_markers.csv")
    write_markers(edl, csv_path, args.mission, marks, info["fps"])
    report += ["Markers:", f"  {edl}  (Resolve: Timelines > Import > Timeline Markers from EDL)",
               f"  {csv_path}", ""]

    # 4. Title card, overlay, look.
    when = dt.date.fromisoformat(args.publish_date) if args.publish_date else dt.date.today()
    date_text = f"{when.year}:{when.timetuple().tm_yday:03d}"
    title_card = os.path.join(outdir, f"{stem}_titlecard.png")
    write_title_card(title_card, args.mission, args.minimap, args.profile, args.photo, date_text, args.font)
    overlay = os.path.join(outdir, "_camcorder.png")
    write_camcorder_overlay(overlay, date_text, args.font)
    scanlines = os.path.join(outdir, "_scanlines.png")
    write_scanlines(scanlines)
    write_minidv_lut(os.path.join(outdir, "minidv.cube"))
    report += [f"Title card: {title_card}", f"Camcorder date: {date_text}",
               f"MiniDV grade as a LUT, for Resolve too: {os.path.join(outdir, 'minidv.cube')}", ""]

    if not args.detect_only:
        names = {ALIASES.get(n.strip().lower(), n.strip().lower()) for n in args.fisheye.split(",") if n.strip()}
        unknown = names - set(PHASES)
        if unknown:
            die("unknown --fisheye phase: " + ", ".join(sorted(unknown)))
        bounds = [t for t, _ in marks] + [length]
        fisheye = [(marks[i][0], bounds[i + 1]) for i in range(len(marks)) if marks[i][1] in names]
        loading = (loading_src[0] - start, loading_src[1] - start) if loading_src else None
        out = render(src, start, length, info, outdir, stem, title_card, scanlines, overlay,
                     loading, marks, fisheye, not args.no_glitch, args.crf)
        report += [f"Rendered: {out}", "The original recording was not changed."]
    else:
        report.append("Detect only: nothing rendered.")

    report_path = os.path.join(outdir, f"{stem}_report.txt")
    with open(report_path, "w", encoding="utf-8") as fh:
        fh.write("\n".join(report) + "\n")
    print("\n".join(report))
    print(f"\nReport: {report_path}")


if __name__ == "__main__":
    main()
