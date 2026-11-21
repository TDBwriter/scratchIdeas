#!/usr/bin/env python3
"""Turn a raw Cyberpunk 2077 recording into a skate-style Short, ready to cut.

What it does, given a video file:
  1. Finds the near-black loading screens (ffmpeg's blackdetect) and the menus
     (on an ultrawide recording, black bars down both sides).
  2. Cuts the dead space: every menu, and anything given with --cut. Frames of
     V's stats (--stats) open and close the Short instead, sliced to fit its
     frame. Writes the cut list.
  3. Writes contact sheets: stills every few seconds, each labelled with its
     time and outlined in red where the 9:16 crop falls (or marked CUT), so the
     phases and the crop can be picked by eye.
  4. Makes the title card from the mission name and the images you give it.
  5. Renders a preview of the Short: vertical 9:16 crop, placed, cut, panned,
     tilted and punched in where --crop and --punch say (the middle by
     default), the MiniDV grade, tape grain and scanlines, VHS glitches on the
     jump cuts and between phases, a camcorder overlay at each phase, the
     fisheye on the phases you name, and the title card over the loading
     screen. The original file is never changed.
  6. Writes the phase markers three ways: an EDL for Resolve's
     "Timeline Markers from EDL", a CSV, and a plain report.
  7. Makes the frame of reference for finishing in Resolve: a guide video of
     the whole frame, uncropped, in the Short's order, with the 9:16 window in
     red where the crop plan puts it, V's stats slices in yellow, the phase in
     its marker color, the crop move in progress, each jump cut flagged, and
     the timeline timecode; and the crop plan as a CSV, one row per keyframe,
     with the numbers to set in Resolve's Inspector.

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
          "flashback": "Pink", "coup-de-grace": "Purple", "close": "Cyan", "stats": "Lavender"}

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


STANDARD_RATES = [23.976, 24.0, 25.0, 29.97, 30.0, 48.0, 50.0, 59.94, 60.0,
                  90.0, 100.0, 119.88, 120.0, 144.0, 240.0]


def measured_fps(path, span=10.0):
    """The frame rate read from the frames' own timestamps, snapped to the
    nearest standard rate. Steam's recordings are read through a DASH manifest,
    and there ffprobe reports their rate wrongly: 60 fps footage comes back with
    an average of about 26 and a nominal rate of 60, 120 or 240. The middle gap
    between frames isn't thrown off by the odd dropped frame."""
    out = run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-read_intervals", f"%+{span}",
               "-show_entries", "packet=pts_time", "-of", "csv=p=0", path]).stdout
    times = sorted(float(x) for x in re.findall(r"\d+(?:\.\d+)?", out))
    gaps = sorted(b - a for a, b in zip(times, times[1:]) if b > a)
    if len(gaps) < 10:
        return None
    rate = 1 / gaps[len(gaps) // 2]
    return min(STANDARD_RATES, key=lambda r: abs(r - rate))


def probe(path):
    out = run(["ffprobe", "-v", "error", "-print_format", "json",
               "-show_format", "-show_streams", path]).stdout
    info = json.loads(out)
    video = next((s for s in info.get("streams", []) if s.get("codec_type") == "video"), None)
    if video is None:
        die(f"no video stream in {path}")
    fps = measured_fps(path)
    if fps is None:
        num, den = (video.get("avg_frame_rate") or video.get("r_frame_rate") or "60/1").split("/")
        fps = float(num) / float(den) if float(den) else 60.0
    duration = float(info.get("format", {}).get("duration") or video.get("duration") or 0)
    has_audio = any(s.get("codec_type") == "audio" for s in info.get("streams", []))
    return {"width": int(video["width"]), "height": int(video["height"]),
            "fps": fps, "duration": duration, "audio": has_audio}


def resolve_input(path):
    """A Steam clip folder holds a session.mpd manifest; ffmpeg can read that."""
    path = os.path.normpath(path)   # ffmpeg's DASH reader can't find the pieces through mixed slashes
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

MENU_BARS = 12  # brightest a side bar gets (0-255) and still counts as black


def detect(src, start, length, min_len, pix_th, pic_th, workdir):
    """One pass over the range for the near-black stretches (loading screens) and
    the menus, in recording time. On an ultrawide recording the game draws its
    menus, breach protocol included, at 16:9 with black bars down both sides,
    while gameplay fills the frame and its HUD reaches the edges. So a menu is
    a stretch where both side strips stay black and the frame isn't near-black.
    On a 16:9 recording there are no bars, and no menus are found."""
    graph = (f"[0:v]scale=344:144,setsar=1,split=3[a][l][r];"
             f"[a]blackdetect=d={min_len}:pix_th={pix_th}:pic_th={pic_th}[ao];"
             "[l]crop=24:144:0:0[l2];[r]crop=24:144:320:0[r2];"
             "[l2][r2]hstack,signalstats,metadata=mode=print:key=lavfi.signalstats.YMAX:file=_bars.txt[bo]")
    proc = run(["ffmpeg", "-hide_banner", "-nostats", "-y", "-ss", f"{start:.3f}", "-t", f"{length:.3f}",
                "-i", src, "-an", "-filter_complex", graph,
                "-map", "[ao]", "-f", "null", os.devnull, "-map", "[bo]", "-f", "null", os.devnull], cwd=workdir)
    blacks = [(start + float(m.group(1)), start + float(m.group(2)))
              for m in re.finditer(r"black_start:([\d.]+)\s+black_end:([\d.]+)", proc.stderr)]
    path = os.path.join(workdir, "_bars.txt")
    with open(path, encoding="utf-8", errors="replace") as fh:
        bars = [(start + float(t), float(v)) for t, v in
                re.findall(r"pts_time:([\d.]+)\s+lavfi\.signalstats\.YMAX=([\d.]+)", fh.read())]
    os.remove(path)
    menus, first, last = [], None, None
    for t, ymax in bars:
        if ymax <= MENU_BARS and not any(a <= t <= b for a, b in blacks):
            if first is not None and t - last > 0.25:
                menus.append((first, last))
                first = None
            if first is None:
                first = t
            last = t
    if first is not None:
        menus.append((first, last))
    # A little either side, for the menu's own open and close.
    menus = [(max(start, a - 0.1), min(start + length, b + 0.1)) for a, b in menus if b - a >= 0.4]
    return blacks, merge(menus)


def contact_sheets(src, start, length, every, outdir, stem, crops, punches, segs, cut_spans,
                   cols=4, rows=4, thumb_w=480):
    """Stills every few seconds, labelled with their recording time, each with a
    red outline where the 9:16 crop falls at that moment. A still in a cut is
    labelled CUT and has no outline."""
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
        # Close each still once it's read: Windows won't delete an open file,
        # so the _frames folder would be left behind.
        with Image.open(os.path.join(frames, chunk[0])) as first:
            tw, th = first.size
        used_rows = math.ceil(len(chunk) / cols)
        sheet = Image.new("RGB", (cols * tw, used_rows * (th + 36)), "black")
        draw = ImageDraw.Draw(sheet)
        for i, name in enumerate(chunk):
            index = page * per + i
            x, y = (i % cols) * tw, (i // cols) * (th + 36)
            with Image.open(os.path.join(frames, name)) as img:
                sheet.paste(img, (x, y + 36))
            rec = start + index * every
            if any(a <= rec <= b for a, b in cut_spans):
                draw.text((x + 8, y + 4), f"{fmt_time(rec)}  CUT", fill=(255, 80, 80), font=label_font)
                continue
            s = to_short(segs, rec)
            px, py = crop_at(crops, s)
            cx, cy, cw, ch = crop_box(tw, th, px, py, zoom_at(punches, s))
            draw.rectangle([x + cx, y + 36 + cy, x + cx + cw - 1, y + 36 + cy + ch - 1],
                           outline=(255, 0, 0), width=3)
            draw.text((x + 8, y + 4), fmt_time(rec), fill="yellow", font=label_font)
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


# ---------------------------------------------------------------- the crop

X_WORDS = {"left": 0.0, "center": 0.5, "centre": 0.5, "middle": 0.5, "right": 1.0}
Y_WORDS = {"top": 0.0, "center": 0.5, "centre": 0.5, "middle": 0.5, "bottom": 1.0}
MAX_ZOOM = 4.0


def parse_span(item, when, start, end, option):
    """'TIME' or 'FROM-TO' in recording time -> (t0, t1) in seconds into the Short."""
    if "-" in when:
        a, b = when.split("-", 1)
        t0, t1 = parse_time(a) - start, parse_time(b) - start
        if t1 <= t0:
            die(f"{option} {item}: a move's end has to come after its start.")
    else:
        t0 = t1 = parse_time(when) - start
    if not (0 <= t0 <= end - start and 0 <= t1 <= end - start):
        die(f"{option} {item} falls outside the range {fmt_time(start)} to {fmt_time(end)}.")
    return t0, t1


def parse_place(text, words, item):
    """One coordinate: a word, a number from 0 to 1, or blank to keep it where it is."""
    text = text.strip().lower()
    if not text:
        return None
    if text in words:
        return words[text]
    try:
        value = float(text)
    except ValueError:
        value = -1.0
    if not 0 <= value <= 1:
        die(f"--crop {item}: across is left, center, right or 0 to 1; up and down is top, "
            "center, bottom or 0 to 1.")
    return value


def parse_crops(items, start, end):
    """--crop TIME=X[,Y] (a cut) or --crop FROM-TO=X[,Y] (a pan or tilt) ->
    [(start, end, x, y)] in seconds into the Short, sorted; a cut has
    start == end. X runs from 0 (the window against the frame's left edge)
    through 0.5 (the middle) to 1 (against the right edge), and Y the same
    from top to bottom. A blank X or Y stays where it was. Y only moves a
    window that's shorter than the frame: on wide footage, a punched-in one.
    Each holds until the next. A pan or tilt eases in and out like a camera."""
    crops = []
    for item in items:
        if "=" not in item:
            die(f"--crop needs TIME=POSITION or FROM-TO=POSITION, got '{item}'")
        when, where = item.split("=", 1)
        across, _, down = where.partition(",")
        x, y = parse_place(across, X_WORDS, item), parse_place(down, Y_WORDS, item)
        if x is None and y is None:
            die(f"--crop {item}: give a position.")
        crops.append(parse_span(item, when, start, end, "--crop") + (x, y))
    crops.sort(key=lambda c: (c[0], c[1]))
    for a, b in zip(crops, crops[1:]):
        if b[0] < a[1]:
            die(f"two crop moves overlap at {fmt_time(start + b[0])}. Start a move after the last one ends.")
    return crops


def crop_moves(crops):
    """[(t0, t1, from (x, y), to (x, y))], with blanks filled in from where the window was."""
    moves, pos = [], (0.5, 0.5)
    for t0, t1, x, y in crops:
        target = (pos[0] if x is None else x, pos[1] if y is None else y)
        moves.append((t0, t1, pos, target))
        pos = target
    return moves


def ease(u):
    """0 to 1, starting and stopping gently."""
    return u * u * (3 - 2 * u)


def crop_at(crops, t):
    """Where the window sits t seconds into the Short, as (x, y). It starts in the middle."""
    pos = (0.5, 0.5)
    for t0, t1, a, b in crop_moves(crops):
        if t >= t1 - 1e-6:
            pos = b
        elif t > t0 + 1e-6:
            s = ease((t - t0) / (t1 - t0))
            return a[0] + (b[0] - a[0]) * s, a[1] + (b[1] - a[1]) * s
        else:
            break
    return pos


def crop_expr(crops, axis, tv="t"):
    """The same positions along one axis (0 across, 1 down) as an ffmpeg expression
    in tv, the Short's time: t, or t plus where a piece starts in the Short."""
    pieces = [(0.0, "0.5000")]
    for t0, t1, a, b in crop_moves(crops):
        if t1 > t0:
            u = f"(({tv}-{t0:.3f})/{t1 - t0:.3f})"
            pieces.append((t0, f"{a[axis]:.4f}+({b[axis] - a[axis]:.4f})*{u}*{u}*(3-2*{u})"))
        pieces.append((t1, f"{b[axis]:.4f}"))
    expr = pieces[-1][1]
    for i in range(len(pieces) - 2, -1, -1):
        expr = f"if(lt({tv},{pieces[i + 1][0]:.3f}),{pieces[i][1]},{expr})"
    return expr


def parse_punches(items, start, end):
    """--punch TIME=ZOOM -> [(seconds after --start, zoom)], sorted. A punch-in
    cuts to a window ZOOM times tighter (2 is half the height); 1 or 'out'
    comes back out to the full window."""
    punches = []
    for item in items:
        if "=" not in item:
            die(f"--punch needs TIME=ZOOM, got '{item}'")
        when, amount = item.split("=", 1)
        word = amount.strip().lower()
        try:
            zoom = 1.0 if word == "out" else float(word)
        except ValueError:
            zoom = 0.0
        if not 1 <= zoom <= MAX_ZOOM:
            die(f"--punch {item}: the zoom is a number from 1 (no punch-in) to {MAX_ZOOM:g}, or out.")
        if "-" in when:
            die(f"--punch {item}: a punch-in is a cut, so it takes one time, not a range.")
        t0, _t1 = parse_span(item, when, start, end, "--punch")
        punches.append((t0, round(zoom, 3)))
    return sorted(punches)


def zoom_at(punches, t):
    zoom = 1.0
    for when, z in punches:
        if when <= t + 1e-6:
            zoom = z
    return zoom


def zoom_spans(punches, length):
    """{zoom: [(from, to)]}: when each zoom is on, in seconds into the Short."""
    spans, edges = {}, [(0.0, 1.0)] + punches
    for i, (t, z) in enumerate(edges):
        stop = edges[i + 1][0] if i + 1 < len(edges) else length + 1
        if stop > t:
            spans.setdefault(z, []).append((t, stop))
    return spans


def crop_box(width, height, x, y, zoom=1.0):
    """The 9:16 window inside a width x height frame: (left, top, w, h)."""
    if width / height > W / H:
        w, h = height * W / H, height
    else:
        w, h = width, width * H / W
    w, h = round(w / zoom), round(h / zoom)
    return round(x * (width - w)), round(y * (height - h)), w, h


def window_chain(info, crops, punches, total, src, out, off, seg_len, tag):
    """Filtergraph text that crops one piece of the action, [src], to the 9:16
    window and scales it to the Short's frame, as [out]. off is where the piece
    starts in the Short. The crop filter's size is fixed once it starts, so each
    zoom in the piece gets its own branch, and a punch-in cuts between them."""
    tv = f"(t+{off:.3f})"
    xs, ys = crop_expr(crops, 0, tv), crop_expr(crops, 1, tv)
    wide = info["width"] / info["height"] > W / H

    def window(zoom):
        size = f"w=ih*9/16/{zoom:g}:h=ih/{zoom:g}" if wide else f"w=iw/{zoom:g}:h=iw*16/9/{zoom:g}"
        return (f"crop={size}:x='({xs})*(iw-ow)':y='({ys})*(ih-oh)',"
                f"scale={W}:{H}:flags=lanczos,setsar=1")

    spans = zoom_spans(punches, total)
    zooms = sorted(z for z, sp in spans.items() if any(a < off + seg_len and b > off for a, b in sp))
    if len(zooms) <= 1:
        return f"[{src}]{window(zooms[0] if zooms else 1.0)}[{out}];"
    graph = f"[{src}]split={len(zooms)}" + "".join(f"[{tag}z{i}]" for i in range(len(zooms))) + ";"
    graph += "".join(f"[{tag}z{i}]{window(z)}[{tag}w{i}];" for i, z in enumerate(zooms))
    below = f"{tag}w0"
    for i in range(1, len(zooms)):
        on = "+".join(f"gte({tv},{a:.3f})*lt({tv},{b:.3f})" for a, b in spans[zooms[i]])
        graph += f"[{below}][{tag}w{i}]overlay=0:0:enable='{on}'[{tag}o{i}];"
        below = f"{tag}o{i}"
    return graph + f"[{below}]null[{out}];"


# ---------------------------------------------------------------- the timeline: cuts and V's stats

# The slices of a V's-stats frame that are stacked into the Short's 9:16 frame,
# as x,y,w,h from 0 to 1 across the game's 16:9 menu. These fit the inventory
# screen: Level and Street Cred from the top left, then V, head to toe.
DEFAULT_SLICES = "0.023,0.007,0.211,0.069;0.320,0.139,0.304,0.861"


def merge(ranges):
    out = []
    for a, b in sorted(ranges):
        if out and a <= out[-1][1]:
            out[-1] = (out[-1][0], max(out[-1][1], b))
        else:
            out.append((a, b))
    return out


def parse_ranges(items, option):
    """FROM-TO items in recording time -> [(from, to)], sorted."""
    out = []
    for item in items:
        if "-" not in item:
            die(f"{option} needs FROM-TO, got '{item}'")
        a, b = item.split("-", 1)
        t0, t1 = parse_time(a), parse_time(b)
        if t1 <= t0:
            die(f"{option} {item}: the end has to come after the start.")
        out.append((t0, t1))
    return sorted(out)


def build_timeline(start, end, cuts, stats_open, stats_close):
    """The Short as pieces in order, [(from, to, kind)] in recording time: kind
    'action' (cropped to the window) or 'stats' (V's stats, sliced). V's stats
    open and close it; the action between is the range less the cuts."""
    segs, t = [], start
    if stats_open:
        segs.append((stats_open[0], stats_open[1], "stats"))
    for a, b in merge([(max(a, start), min(b, end)) for a, b in cuts if b > start and a < end]):
        if a - t > 0.05:
            segs.append((t, a, "action"))
        t = max(t, b)
    if end - t > 0.05:
        segs.append((t, end, "action"))
    if stats_close:
        segs.append((stats_close[0], stats_close[1], "stats"))
    if not any(k == "action" for _a, _b, k in segs):
        die("the cuts leave nothing of the range.")
    return segs


def seg_starts(segs):
    """Where each piece starts in the Short."""
    out, pos = [], 0.0
    for a, b, _k in segs:
        out.append(pos)
        pos += b - a
    return out


def to_short(segs, t):
    """The Short time of recording time t in the action. A time inside a cut
    lands where the cut is."""
    last = 0.0
    for (a, b, kind), pos in zip(segs, seg_starts(segs)):
        if kind != "action":
            continue
        if t < a:
            return pos
        if t <= b:
            return pos + t - a
        last = pos + b - a
    return last


def to_rec(segs, s):
    """The recording time at Short time s. At a join, it's the start of the piece after."""
    for (a, b, _k), pos in zip(segs, seg_starts(segs)):
        if s < pos + (b - a) - 1e-6:
            return a + max(0.0, s - pos)
    return segs[-1][1]


def kind_at(segs, s):
    for (a, b, kind), pos in zip(segs, seg_starts(segs)):
        if s < pos + (b - a):
            return kind
    return segs[-1][2]


def action_spans(segs):
    """The action's pieces in Short time: [(from, to)]."""
    return [(pos, pos + b - a) for (a, b, k), pos in zip(segs, seg_starts(segs)) if k == "action"]


def jump_cuts(segs):
    """The points in the Short where the picture jumps: every join between pieces."""
    return seg_starts(segs)[1:]


def parse_slices(text):
    slices = []
    for part in text.split(";"):
        try:
            x, y, w, h = (float(n) for n in part.split(","))
        except ValueError:
            die(f"--stats-slices: '{part}' isn't x,y,w,h.")
        if min(x, y) < 0 or w <= 0 or h <= 0 or x + w > 1.001 or y + h > 1.001:
            die(f"--stats-slices: '{part}' doesn't fit inside the menu (0 to 1 each way).")
        slices.append((x, y, w, h))
    return slices


def menu_area(width, height):
    """Where the game draws its menus: 16:9, in the middle of a wider frame."""
    mw = min(width, height * 16 / 9)
    return (width - mw) / 2, mw


def slice_boxes(width, height, slices):
    """Each slice as (left, top, w, h) in pixels of a width x height frame, and
    its height once it's scaled to the Short's width."""
    mx, mw = menu_area(width, height)
    out = []
    for x, y, w, h in slices:
        box = (round(mx + x * mw), round(y * height), max(2, round(w * mw)), max(2, round(h * height)))
        out.append((box, max(2, round(W * box[3] / box[2] / 2) * 2)))
    return out


def slices_chain(info, slices, src, out, tag):
    """Filtergraph text that cuts V's stats frames, [src], into the slices and
    stacks them in the Short's 9:16 frame, as [out]. A stack shorter than the
    frame sits in the middle of it; a taller one is cut at the bottom."""
    boxes = slice_boxes(info["width"], info["height"], slices)
    n = len(boxes)
    graph = f"[{src}]split={n}" + "".join(f"[{tag}s{i}]" for i in range(n)) + ";"
    for i, ((left, top, w, h), height) in enumerate(boxes):
        graph += f"[{tag}s{i}]crop={w}:{h}:{left}:{top},scale={W}:{height}:flags=lanczos,setsar=1[{tag}p{i}];"
    stacked = f"{tag}p0"
    if n > 1:
        graph += "".join(f"[{tag}p{i}]" for i in range(n)) + f"vstack=inputs={n}[{tag}st];"
        stacked = f"{tag}st"
    return graph + f"[{stacked}]crop={W}:'min(ih,{H})':0:0,pad={W}:{H}:0:(oh-ih)/2:color=black,setsar=1[{out}];"


def stats_preview(src, span, slices, path):
    """One still from V's stats frames: the slices outlined and numbered on the
    whole frame, and beside it the 9:16 frame they make."""
    tmp = path + ".png"
    run(["ffmpeg", "-hide_banner", "-nostats", "-y", "-ss", f"{(span[0] + span[1]) / 2:.3f}", "-i", src,
         "-frames:v", "1", tmp])
    with Image.open(tmp) as img:
        frame = img.convert("RGB")
    os.remove(tmp)
    boxes = slice_boxes(frame.width, frame.height, slices)
    stack = Image.new("RGB", (W, sum(h for _b, h in boxes)), "black")
    y = 0
    for (left, top, w, h), height in boxes:
        stack.paste(frame.crop((left, top, left + w, top + h)).resize((W, height), Image.LANCZOS), (0, y))
        y += height
    card = Image.new("RGB", (W, H), "black")
    card.paste(stack.crop((0, 0, W, min(H, stack.height))), (0, max(0, (H - stack.height) // 2)))
    ph = 720
    whole = frame.resize((round(frame.width * ph / frame.height), ph), Image.LANCZOS)
    draw = ImageDraw.Draw(whole)
    scale = ph / frame.height
    label = font(28)
    for i, ((left, top, w, h), _height) in enumerate(boxes, 1):
        box = [round(left * scale), round(top * scale), round((left + w) * scale), round((top + h) * scale)]
        draw.rectangle(box, outline=(255, 220, 0), width=3)
        draw.text((box[0] + 6, box[1] + 4), str(i), fill=(255, 220, 0), font=label)
    sheet = Image.new("RGB", (whole.width + 24 + round(W * ph / H), ph), "black")
    sheet.paste(whole, (0, 0))
    sheet.paste(card.resize((round(W * ph / H), ph), Image.LANCZOS), (whole.width + 24, 0))
    sheet.save(path, quality=88)
    return path


# ---------------------------------------------------------------- the guide for Resolve

# Resolve's marker colors, as the guide draws them.
RGB = {"Red": (235, 60, 60), "Yellow": (240, 215, 60), "Blue": (70, 130, 240), "Green": (80, 200, 100),
       "Pink": (240, 130, 195), "Purple": (160, 100, 230), "Cyan": (70, 210, 225), "Lavender": (190, 165, 240)}
GUIDE_RED = (255, 0, 0, 255)
SHOWN = {"stats": "V STATS"}


def crop_events(crops, punches, length, extra=()):
    """Every point where the crop plan does something: [(t, what)], in Short time."""
    events = [(0.0, "start")] + list(extra)
    for t0, t1, _a, _b in crop_moves(crops):
        if t1 > t0:
            events += [(t0, "pan/tilt start"), (t1, "pan/tilt end")]
        else:
            events.append((t0, "cut"))
    for t, z in punches:
        events.append((t, "punch out" if z == 1 else f"punch in {z:g}x"))
    # Events within a millisecond are one keyframe; each keeps its exact time, so
    # one that falls on a join stays on the piece after it.
    merged = {}
    for t, what in sorted(events):
        merged.setdefault(round(t, 3), (t, []))[1].append(what)
    return [(t, " + ".join(w for w in whats if w != "start" or len(whats) == 1))
            for t, whats in merged.values() if t <= length]


def resolve_numbers(info, x, y, zoom):
    """The window in source pixels, and the Inspector values that show it on a
    1080x1920 timeline with Resolve's default 'Scale entire image to fit'.
    Position is in timeline pixels from the middle, with +Y up."""
    sw, sh = info["width"], info["height"]
    left, top, w, h = crop_box(sw, sh, x, y, zoom)
    shown = W / w                      # source pixels to timeline pixels, once filled
    fit = min(W / sw, H / sh)          # what Resolve scales the clip to by default
    cx, cy = left + w / 2, top + h / 2
    return (left, top, w, h, shown / fit, (sw / 2 - cx) * shown, (cy - sh / 2) * shown)


def write_crop_plan(path, info, crops, punches, total, segs):
    """The crop plan, one row per keyframe, for setting the reframe by hand in
    Resolve. After a cut, each piece is its own clip in Resolve, so each piece's
    start gets a row with the window it opens on."""
    pieces = [(s, f"piece {i} starts") for i, (s, _e) in enumerate(action_spans(segs), 1)]
    with open(path, "w", newline="", encoding="utf-8") as fh:
        writer = csv.writer(fh)
        writer.writerow(["timeline timecode", "time in the Short", "recording time", "what",
                         "across (0-1)", "down (0-1)", "zoom",
                         "window left", "window top", "window width", "window height",
                         "Resolve zoom (fit)", "Resolve position X", "Resolve position Y"])
        for t, what in crop_events(crops, punches, total, pieces):
            if kind_at(segs, t) != "action":
                continue
            x, y = crop_at(crops, t)
            z = zoom_at(punches, t)
            left, top, w, h, rz, px, py = resolve_numbers(info, x, y, z)
            writer.writerow([timecode(t, info["fps"]), fmt_time(t), fmt_time(to_rec(segs, t)), what,
                             f"{x:.3f}", f"{y:.3f}", f"{z:g}", left, top, w, h,
                             f"{rz:.3f}", f"{px:.1f}", f"{py:.1f}"])


def write_cut_list(path, segs, removed, fps):
    """The edit, for rebuilding it in Resolve: the pieces in the Short's order,
    then what was cut from the recording and why."""
    with open(path, "w", newline="", encoding="utf-8") as fh:
        writer = csv.writer(fh)
        writer.writerow(["piece", "what", "timeline in", "timeline out", "recording in", "recording out", "seconds"])
        n = 0
        for (a, b, kind), s in zip(segs, seg_starts(segs)):
            if kind == "action":
                n += 1
            what = f"action {n}" if kind == "action" else ("V's stats, opening" if s == 0 else "V's stats, closing")
            writer.writerow([n if kind == "action" else "", what, timecode(s, fps), timecode(s + b - a, fps),
                             fmt_time(a), fmt_time(b), f"{b - a:.2f}"])
        for a, b, why in removed:
            writer.writerow(["", f"cut: {why}", "", "", fmt_time(a), fmt_time(b), f"{b - a:.2f}"])


def label_image(path, text, fnt, color):
    """White-on-dark label, or a colored one, as a PNG with its own size."""
    probe_draw = ImageDraw.Draw(Image.new("RGBA", (1, 1)))
    tw = int(probe_draw.textlength(text, font=fnt))
    size = getattr(fnt, "size", 24)
    img = Image.new("RGBA", (tw + 24, int(size * 1.5)), (0, 0, 0, 170))
    ImageDraw.Draw(img).text((12, int(size * 0.2)), text, fill=color, font=fnt)
    img.save(path)


# ---------------------------------------------------------------- render

def guide_size(info, guide_w=1920):
    gw = min(guide_w, info["width"]) // 2 * 2
    return gw, round(gw * info["height"] / info["width"] / 2) * 2


def work_out(info, path):
    """Encoding for the working files between passes: near-lossless, sound as PCM."""
    return (["-c:v", "libx264", "-preset", "veryfast", "-crf", "12", "-pix_fmt", "yuv420p",
             "-r", f"{info['fps']:.3f}"] + (["-c:a", "pcm_s16le"] if info["audio"] else []) + [path])


def render_parts(src, info, segs, start, length, crops, punches, slices, total, outdir):
    """Pass 1: cut the Short's pieces out of the recording, cropped for the preview
    and whole for the guide, decoding the recording once. Returns the working
    files in the Short's order: [(cropped, whole)] for V's stats opening, the
    action, and V's stats closing."""
    gw, gh = guide_size(info)
    audio = info["audio"]
    starts = seg_starts(segs)
    action = [(a, b, s) for (a, b, k), s in zip(segs, starts) if k == "action"]
    n = len(action)
    g = (f"[0:v]split=2[vc][vf];[vc]split={n}" + "".join(f"[c{i}]" for i in range(n)) + ";"
         f"[vf]scale={gw}:{gh}:flags=bicubic,setsar=1,split={n}" + "".join(f"[f{i}]" for i in range(n)) + ";")
    if audio:
        g += (f"[0:a]asplit=2[xa][ya];[xa]asplit={n}" + "".join(f"[x{i}]" for i in range(n)) + ";"
              f"[ya]asplit={n}" + "".join(f"[y{i}]" for i in range(n)) + ";")
    for i, (a, b, s) in enumerate(action):
        trim = f"trim=start={a - start:.3f}:end={b - start:.3f},setpts=PTS-STARTPTS"
        g += f"[c{i}]{trim}[ct{i}];" + window_chain(info, crops, punches, total, f"ct{i}", f"cv{i}", s, b - a, f"p{i}")
        g += f"[f{i}]{trim}[fv{i}];"
        if audio:
            atrim = f"atrim=start={a - start:.3f}:end={b - start:.3f},asetpts=PTS-STARTPTS"
            g += f"[x{i}]{atrim}[ca{i}];[y{i}]{atrim}[fa{i}];"
    if audio:
        g += "".join(f"[cv{i}][ca{i}]" for i in range(n)) + f"concat=n={n}:v=1:a=1[co][cao];"
        g += "".join(f"[fv{i}][fa{i}]" for i in range(n)) + f"concat=n={n}:v=1:a=1[fo][fao]"
    else:
        g += "".join(f"[cv{i}]" for i in range(n)) + f"concat=n={n}:v=1:a=0[co];"
        g += "".join(f"[fv{i}]" for i in range(n)) + f"concat=n={n}:v=1:a=0[fo]"
    crop_path, full_path = os.path.join(outdir, "_part_action_crop.mkv"), os.path.join(outdir, "_part_action_full.mkv")
    cmd = ["ffmpeg", "-hide_banner", "-nostats", "-y", "-ss", f"{start:.3f}", "-t", f"{length:.3f}",
           "-i", src, "-filter_complex", g, "-map", "[co]"] + (["-map", "[cao]"] if audio else [])
    cmd += work_out(info, crop_path) + ["-map", "[fo]"] + (["-map", "[fao]"] if audio else []) + work_out(info, full_path)
    run(cmd)

    parts, line = [], max(3, gw // 480)
    for k, ((a, b, kind), s) in enumerate(zip(segs, starts)):
        if kind == "action":
            if not parts or parts[-1][0] != crop_path:
                parts.append((crop_path, full_path))
            continue
        cp, fp = os.path.join(outdir, f"_part_stats{k}_crop.mkv"), os.path.join(outdir, f"_part_stats{k}_full.mkv")
        boxes = ",".join(f"drawbox=x={l}:y={t}:w={w}:h={h}:color=yellow@0.9:t={line}"
                         for (l, t, w, h), _h in slice_boxes(gw, gh, slices))
        g = ("[0:v]split=2[sc][sf];" + slices_chain(info, slices, "sc", "so", "q")
             + f"[sf]scale={gw}:{gh}:flags=bicubic,setsar=1,{boxes}[sfo]")
        cmd = ["ffmpeg", "-hide_banner", "-nostats", "-y", "-ss", f"{a:.3f}", "-t", f"{b - a:.3f}", "-i", src,
               "-filter_complex", g, "-map", "[so]"] + (["-map", "0:a:0"] if audio else [])
        cmd += work_out(info, cp) + ["-map", "[sfo]"] + (["-map", "0:a:0"] if audio else []) + work_out(info, fp)
        run(cmd)
        parts.append((cp, fp))
    return parts


def concat_inputs(paths, audio):
    """Input arguments and the filtergraph text joining them, ending in [k] (and [ka])."""
    args = []
    for p in paths:
        args += ["-i", p]
    n = len(paths)
    joined = "".join(f"[{i}:v]" + (f"[{i}:a]" if audio else "") for i in range(n))
    return args, f"{joined}concat=n={n}:v=1:a={1 if audio else 0}[k]" + ("[ka];" if audio else ";")


def render(parts, info, outdir, stem, title_card, scanlines, overlay,
           loading, phase_marks, fisheye_ranges, joins, glitch, crf):
    """Pass 2: join the cropped pieces and give them the look: the grade, grain,
    scanlines, a VHS glitch on every cut and phase change, the camcorder overlay
    at each phase, the fisheye, and the title card over the loading screen."""
    vf = ["lut3d=file=minidv.cube"]
    if fisheye_ranges:
        on = between(fisheye_ranges)
        vf.append(f"lenscorrection=k1=0.18:k2=0.05:i=bilinear:enable='{on}'")
        vf.append(f"vignette=angle=PI/3.5:enable='{on}'")
    vf.append("noise=alls=6:allf=t")
    cuts = sorted({round(t, 2) for t in [t for t, _ in phase_marks] + list(joins) if t > 0.2})
    if glitch and cuts:
        on = between([(t - 0.12, t + 0.18) for t in cuts])
        vf.append(f"rgbashift=rh=8:bh=-8:gv=3:enable='{on}'")
        vf.append(f"noise=alls=45:allf=t:enable='{on}'")
    chain = ",".join(vf)

    n = len(parts)
    args, graph = concat_inputs([p for p, _f in parts], info["audio"])
    card_on = between([loading]) if loading else "0"
    cam_on = between([(t, t + 1.5) for t, name in phase_marks if name not in ("title-card", "stats")])
    graph += (f"[k]{chain}[g];"
              f"[g][{n}:v]overlay=0:0:shortest=1[s];"
              f"[s][{n + 1}:v]overlay=0:0:shortest=1:enable='{card_on}'[c];"
              f"[c][{n + 2}:v]overlay=0:0:shortest=1:enable='{cam_on}'[v]")
    out = os.path.join(outdir, f"{stem}_skate.mp4")
    cmd = (["ffmpeg", "-hide_banner", "-nostats", "-y"] + args +
           ["-loop", "1", "-i", scanlines, "-loop", "1", "-i", title_card, "-loop", "1", "-i", overlay,
            "-filter_complex", graph, "-map", "[v]"])
    if info["audio"]:
        cmd += ["-map", "[ka]", "-c:a", "aac", "-b:a", "192k"]
    cmd += ["-c:v", "libx264", "-preset", "medium", "-crf", str(crf), "-pix_fmt", "yuv420p",
            "-r", f"{info['fps']:.3f}", "-shortest", "-movflags", "+faststart", out]
    # Run from the output folder so the LUT is found by a plain file name. That
    # avoids escaping a Windows drive letter inside the filter graph.
    run(cmd, cwd=outdir)
    return out


def render_guide(parts, info, segs, total, outdir, stem, marks, crops, punches, removed, font_path):
    """The frame of reference for finishing in Resolve: the whole recording frame,
    uncropped, in the Short's order and timing. The 9:16 window is drawn in red
    where the crop plan puts it (cuts, pans, tilts, punch-ins); V's stats frames
    show their slices in yellow; the phase is top left in its marker color, with
    the crop move in progress under it and each jump cut flagged; the timeline
    timecode the markers use and the recording time are bottom left."""
    gw, gh = guide_size(info)
    line = max(3, gw // 480)
    big, small = font(max(24, gw // 48), font_path), font(max(18, gw // 64), font_path)
    paths, layers = [], []
    action = action_spans(segs)

    # The window: one outline per zoom, moved by the same expressions as the crop, in the action only.
    xs, ys = crop_expr(crops, 0), crop_expr(crops, 1)
    for i, (zoom, spans) in enumerate(sorted(zoom_spans(punches, total).items())):
        on = [(max(a, s), min(b, e)) for a, b in spans for s, e in action if min(b, e) > max(a, s)]
        if not on:
            continue
        _l, _t, w, h = crop_box(gw, gh, 0, 0, zoom)
        img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
        ImageDraw.Draw(img).rectangle([0, 0, w - 1, h - 1], outline=GUIDE_RED, width=line)
        path = os.path.join(outdir, f"_guide_window_{i}.png")
        img.save(path)
        paths.append(path)
        layers.append(f"x='({xs})*(W-w)':y='({ys})*(H-h)':enable='"
                      + "+".join(f"gte(t,{a:.3f})*lt(t,{b:.3f})" for a, b in on) + "'")

    # The phase, top left, in its marker color, for as long as the phase runs.
    bounds = [t for t, _ in marks] + [total + 1]
    for i, (t, name) in enumerate(marks):
        path = os.path.join(outdir, f"_guide_phase_{i}.png")
        label_image(path, SHOWN.get(name, name.upper().replace("-", " ")), big, RGB[COLORS[name]])
        paths.append(path)
        layers.append(f"x=16:y=16:enable='gte(t,{t:.3f})*lt(t,{bounds[i + 1]:.3f})'")

    # The crop move, under it: a pan or tilt for as long as it runs, a cut or punch
    # for 1.5 s, never two at once, and where the move ends up.
    pans = [(t0, t1) for t0, t1, _a, _b in crop_moves(crops) if t1 > t0]
    row = 16 + int(getattr(big, "size", 24) * 1.5) + 8
    shown = [(t, what) for t, what in crop_events(crops, punches, total)
             if what not in ("start", "pan/tilt end") and kind_at(segs, t) == "action"]
    for i, (t, what) in enumerate(shown):
        pan_end = next((t1 for t0, t1 in pans if abs(t0 - t) < 0.001), None)
        stop = pan_end if pan_end is not None else t + 1.5
        if i + 1 < len(shown):
            stop = min(stop, shown[i + 1][0])
        x, y = crop_at(crops, pan_end if pan_end is not None else t)
        text = f"{what.upper()}  ->  across {x:.2f}  down {y:.2f}  zoom {zoom_at(punches, t):g}x"
        path = os.path.join(outdir, f"_guide_move_{i}.png")
        label_image(path, text, small, (255, 255, 255))
        paths.append(path)
        layers.append(f"x=16:y={row}:enable='gte(t,{t:.3f})*lt(t,{stop:.3f})'")

    # Each jump cut, flagged for a second under that, with what was cut.
    row2 = row + int(getattr(small, "size", 18) * 1.5) + 8
    cut_rows = {round(b, 2): (b - a, why) for a, b, why in removed}
    for i, s in enumerate(jump_cuts(segs)):
        rec = to_rec(segs, s)
        gone = cut_rows.get(round(rec, 2))
        text = "JUMP CUT" + (f"  ({gone[0]:.1f} s cut: {gone[1]})" if gone and kind_at(segs, s) == "action" else "")
        path = os.path.join(outdir, f"_guide_join_{i}.png")
        label_image(path, text, small, (255, 220, 0))
        paths.append(path)
        layers.append(f"x=16:y={row2}:enable='gte(t,{s:.3f})*lt(t,{s + 1.0:.3f})'")

    args, graph = concat_inputs([f for _p, f in parts], info["audio"])
    n = len(parts)
    graph = graph.replace("[k]", "[l0]", 1)
    for i, layer in enumerate(layers):
        graph += f"[l{i}][{n + i}:v]overlay={layer}:shortest=1[l{i + 1}];"
    last = f"l{len(layers)}"
    fps = round(info["fps"])
    font_file = next((c for c in ([font_path] if font_path else []) + FONT_CANDIDATES
                      if c and os.path.exists(c) and c.lower().endswith(".ttf")), None)
    if font_file:
        shutil.copyfile(font_file, os.path.join(outdir, "_guide_font.ttf"))
        size = max(18, gw // 64)
        box = f"fontfile=_guide_font.ttf:fontsize={size}:fontcolor=white:box=1:boxcolor=black@0.66:boxborderw=8"
        texts = [f"drawtext={box}:timecode='01\\:00\\:00\\:00':rate={fps}:x=16:y=h-{2 * size + 40}"]
        for (a, b, _k), s in zip(segs, seg_starts(segs)):
            texts.append(f"drawtext={box}:text='REC %{{pts\\:hms\\:{a - s:.3f}}}':x=16:y=h-{size + 16}"
                         f":enable='gte(t,{s:.3f})*lt(t,{s + b - a:.3f})'")
        graph += f"[{last}]" + ",".join(texts) + "[v]"
    else:
        graph += f"[{last}]null[v]"

    out = os.path.join(outdir, f"{stem}_guide.mp4")
    cmd = ["ffmpeg", "-hide_banner", "-nostats", "-y"] + args
    for path in paths:
        cmd += ["-loop", "1", "-i", path]
    cmd += ["-filter_complex", graph, "-map", "[v]"]
    if info["audio"]:
        cmd += ["-map", "[ka]", "-c:a", "aac", "-b:a", "160k"]
    cmd += ["-c:v", "libx264", "-preset", "veryfast", "-crf", "23", "-pix_fmt", "yuv420p",
            "-r", f"{info['fps']:.3f}", "-shortest", "-movflags", "+faststart", out]
    run(cmd, cwd=outdir)
    for path in paths + [os.path.join(outdir, "_guide_font.ttf")]:
        try:
            os.remove(path)
        except OSError:
            pass
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
    ap.add_argument("--crop", action="append", default=[], metavar="TIME=X[,Y]",
                    help="where the 9:16 window sits, in recording time. X is left, center, right, or "
                         "0 (left edge) to 1 (right edge); Y is top, center, bottom, or 0 to 1, and "
                         "only moves a punched-in window. Leave either blank to keep it. TIME=X,Y cuts "
                         "there at TIME; FROM-TO=X,Y pans or tilts there between FROM and TO, easing "
                         "in and out. Repeat for each move; each holds until the next. Before the "
                         "first, it's in the middle.")
    ap.add_argument("--punch", action="append", default=[], metavar="TIME=ZOOM",
                    help="a punch-in: at TIME (recording time), cut to a window ZOOM times tighter, "
                         f"1 to {MAX_ZOOM:g} (2 is half the height). TIME=1 or TIME=out comes back out.")
    ap.add_argument("--cut", action="append", default=[], metavar="FROM-TO",
                    help="cut this stretch of the recording out of the Short. Repeat for each.")
    ap.add_argument("--keep-menus", action="store_true",
                    help="keep the menus in. By default every menu (black bars down both sides on an "
                         "ultrawide recording) is cut.")
    ap.add_argument("--stats", metavar="FROM-TO",
                    help="frames of V's stats (a menu screen with V in it), anywhere in the recording, to "
                         "open and close the Short, sliced to fit its frame")
    ap.add_argument("--stats-open", metavar="FROM-TO", help="V's stats frames for the opening only")
    ap.add_argument("--stats-close", metavar="FROM-TO", help="V's stats frames for the closing only")
    ap.add_argument("--stats-slices", default=DEFAULT_SLICES, metavar="X,Y,W,H;...",
                    help="the slices of V's stats frames stacked into the 9:16 frame, top to bottom, "
                         "each x,y,w,h from 0 to 1 across the game's 16:9 menu. The default takes "
                         "Level and Street Cred from the inventory screen, then V head to toe.")
    ap.add_argument("--no-preview", action="store_true",
                    help="make the guide for Resolve but skip the rendered preview of the Short")
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
    crops_in = parse_crops(args.crop, start, end)        # seconds after --start, for now
    punches_in = parse_punches(args.punch, start, end)
    manual_cuts = parse_ranges(args.cut, "--cut")
    spans = {}
    for option, value in (("--stats", args.stats), ("--stats-open", args.stats_open),
                          ("--stats-close", args.stats_close)):
        if value:
            (a, b), = parse_ranges([value], option)
            if info["duration"] and b > info["duration"] + 0.5:
                die(f"{option} {value} runs past the recording's end ({fmt_time(info['duration'])}).")
            spans[option] = (a, b)
    stats_open = spans.get("--stats-open", spans.get("--stats"))
    stats_close = spans.get("--stats-close", spans.get("--stats"))
    slices = parse_slices(args.stats_slices)

    stem = re.sub(r"[^A-Za-z0-9]+", "-", args.mission).strip("-").lower() or "short"
    base = os.path.dirname(os.path.abspath(args.video.rstrip("/\\")))
    outdir = os.path.abspath(args.out or os.path.join(base, f"{stem}_skate-short"))
    os.makedirs(outdir, exist_ok=True)
    report = [f"Short: {args.mission}", f"Recording: {src}",
              f"Range: {fmt_time(start)} to {fmt_time(end)} ({length:.1f} s)",
              f"Source: {info['width']}x{info['height']} at {info['fps']:.2f} fps", ""]

    # 1. Loading screens and menus.
    blacks, menus = detect(src, start, length, args.black_min, args.black_pixel, args.black_share, outdir)
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
    report.append(f"Menus found (black bars down both sides), {'kept' if args.keep_menus else 'cut'}:")
    report += [f"  {fmt_time(a)} to {fmt_time(b)}  ({b - a:.1f} s)" for a, b in menus] or ["  none"]
    report.append("")

    # 2. The edit: V's stats open and close it; the action is the range less the cuts.
    menu_cuts = [] if args.keep_menus else menus
    cut_spans = [(max(a, start), min(b, end)) for a, b in merge(manual_cuts + menu_cuts) if b > start and a < end]
    removed = []
    for a, b in cut_spans:
        why = [w for w, from_spans in (("menu", menu_cuts), ("--cut", manual_cuts))
               if any(c < b and d > a for c, d in from_spans)]
        removed.append((a, b, " and ".join(why)))
    segs = build_timeline(start, end, cut_spans, stats_open, stats_close)
    total = sum(b - a for a, b, _k in segs)
    report.append(f"The Short: {total:.1f} s in {len(segs)} pieces "
                  f"({sum(b - a for a, b, _w in removed):.1f} s cut from the range):")
    for (a, b, kind), s in zip(segs, seg_starts(segs)):
        report.append(f"  {fmt_time(s)}  {'V stats' if kind == 'stats' else 'action '}  "
                      f"recording {fmt_time(a)} to {fmt_time(b)}")
    if total > 180:
        report.append(f"NOTE: the Short runs {total:.0f} s. A Short has to be 3 minutes or less, "
                      "so it needs cutting down further.")
    report.append("")

    # Everything from here on is in Short time.
    crops = [(to_short(segs, start + t0), to_short(segs, start + t1), x, y) for t0, t1, x, y in crops_in]
    punches = [(to_short(segs, start + t), z) for t, z in punches_in]

    # 3. Contact sheets.
    sheets = contact_sheets(src, start, length, args.sheet_every, outdir, stem, crops, punches, segs, cut_spans)
    report.append("Contact sheets, for picking the phases and the crop by eye "
                  "(the red outline is the 9:16 window; CUT marks a still that's cut):")
    report += [f"  {p}" for p in sheets]
    report.append("")
    report.append("Crop plan (recording time; across and down run 0 to 1):")
    for t, what in crop_events(crops, punches, total):
        if kind_at(segs, t) != "action":
            continue
        x, y = crop_at(crops, t)
        report.append(f"  {fmt_time(to_rec(segs, t))}  {what}: across {x:.2f}, down {y:.2f}, "
                      f"zoom {zoom_at(punches, t):g}x")
    report.append("")

    # 4. Phases, in Short time.
    marks = [(to_short(segs, start), "cold-open")]
    if loading_src:
        marks.append((to_short(segs, loading_src[0]), "title-card"))
    for item in args.phase:
        if "=" not in item:
            die(f"--phase needs NAME=TIME, got '{item}'")
        name, when = item.split("=", 1)
        name = ALIASES.get(name.strip().lower(), name.strip().lower())
        if name not in PHASES:
            die(f"unknown phase '{name}'. Use one of: {', '.join(PHASES)}")
        t = parse_time(when)
        if not start <= t <= end:
            die(f"--phase {item} falls outside the range {fmt_time(start)} to {fmt_time(end)}.")
        if name in ("cold-open", "title-card"):
            marks = [m for m in marks if m[1] != name]
        marks.append((to_short(segs, t), name))
    if stats_open:
        marks.append((0.0, "stats"))
    if stats_close:
        marks.append((seg_starts(segs)[-1], "stats"))
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
    plan_path = os.path.join(outdir, f"{stem}_crop-plan.csv")
    write_crop_plan(plan_path, info, crops, punches, total, segs)
    cuts_path = os.path.join(outdir, f"{stem}_cuts.csv")
    write_cut_list(cuts_path, segs, removed, info["fps"])
    report += ["Markers:", f"  {edl}  (Resolve: Timelines > Import > Timeline Markers from EDL)",
               f"  {csv_path}", "",
               f"Crop plan, one row per keyframe with Resolve's numbers: {plan_path}",
               f"Cut list, the pieces in order and what was cut: {cuts_path}", ""]
    for label, span in (("open", stats_open), ("close", stats_close)):
        if span:
            path = stats_preview(src, span, slices, os.path.join(outdir, f"{stem}_stats-{label}.jpg"))
            report.append(f"V's stats, {label + 'ing' if label == 'open' else 'closing'} "
                          f"({fmt_time(span[0])} to {fmt_time(span[1])}), "
                          f"the slices and the frame they make: {path}")
    if stats_open or stats_close:
        report.append("")

    # 5. Title card, overlay, look.
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
        bounds = [t for t, _ in marks] + [total]
        fisheye = [(marks[i][0], bounds[i + 1]) for i in range(len(marks)) if marks[i][1] in names]
        loading = (to_short(segs, loading_src[0]), to_short(segs, loading_src[1])) if loading_src else None
        parts = render_parts(src, info, segs, start, length, crops, punches, slices, total, outdir)
        guide = render_guide(parts, info, segs, total, outdir, stem, marks, crops, punches, removed, args.font)
        report += [f"Guide for Resolve (the whole frame, the red window, phases, cuts, timecode): {guide}"]
        if not args.no_preview:
            out = render(parts, info, outdir, stem, title_card, scanlines, overlay,
                         loading, marks, fisheye, jump_cuts(segs), not args.no_glitch, args.crf)
            report += [f"Preview of the Short, rendered: {out}"]
        for part in {p for pair in parts for p in pair}:
            try:
                os.remove(part)
            except OSError:
                pass
        report += ["The original recording was not changed."]
    else:
        report.append("Detect only: nothing rendered.")

    report_path = os.path.join(outdir, f"{stem}_report.txt")
    with open(report_path, "w", encoding="utf-8") as fh:
        fh.write("\n".join(report) + "\n")
    print("\n".join(report))
    print(f"\nReport: {report_path}")


if __name__ == "__main__":
    main()
