#!/usr/bin/env python3
"""Check a Cyberpunk 2077 clip for the opening template, and build its stats overlay.

The opening template (decided November 21, 2026; the approved edit is
545R-Takedown-000, 0:11 to 0:20): the video opens with a game over, which
leads to a loading screen. On the black of that loading screen, with its
counter left in place, V's stats are laid out, all cut from the same clip:

  * V turning in the inventory preview (video), on the left;
  * Skill Progression, to its right;
  * the inventory bar along the bottom right, with Level, Street Cred, carry
    weight, money, unspent attribute and perk points (LEVEL UP) and the
    affinity card above it, spaced so what the game adds later fits.

A clip is rejected only for a missing key element (decided November 21, 2026):
FLATLINE frames, the LOADING BLANK after them, the SPINNING MODEL (V turning
in the inventory preview), the INVENTORY GRID, SKILL PROGRESSION, and LEVEL,
STREET CRED, ENCUMBRANCE and GOLD (read from the top bar of the hub, the
inventory or the skills page). Minor details don't block, and are noted in
the report: the hub screen, its affinity card and LEVEL UP badge, where in
the clip the game over falls, a short turn, and a pop-up over the inventory.

Rejected: writes the report and a contact sheet of what it found, and exits
with status 2. Nothing else is made, and the later steps don't run on it.
Accepted: populates every loading screen in the clip (decided November 21,
2026). It writes a full copy of the clip, "<clip> with stats.mp4" beside it,
with V's stats on the black of every loading screen, the same layout on each;
a sheet with a still from each loading screen; and a layout guide. The clip
itself is never changed. After this come the user's own trim, then the menu
cut (menu_cut.py), then the transitions (vhs_transitions.py).

Everything the template is lives in one file, cyberpunk2077-opening-template.json:
the key elements, the layout, the parts of the game's UI the key frames are
matched by (cut from 545R-Takedown-000), and the user's own crops that set it.
The tool reads the copy beside the video it checks, so the template travels
with the videos; failing that, the copy beside this script. --template names
another.

Needs ffmpeg and ffprobe on the PATH, and Python 3 with numpy, scipy and
Pillow. The layout is made for 3440x1440 footage.
"""
import argparse
import base64
import io
import json
import math
import os
import re
import shutil
import subprocess
import sys
from pathlib import Path

try:
    import numpy as np
    from PIL import Image, ImageDraw, ImageFont
    from scipy.signal import fftconvolve
except ImportError as e:
    sys.exit(f"opening_stats: {e.name} is missing. Install it with:  python -m pip install numpy scipy Pillow")

HERE = Path(__file__).resolve().parent
TEMPLATE_NAME = "cyberpunk2077-opening-template.json"
T = {}                # the template, once loaded


def load_template(path):
    """Read the template file and set the names the rest of the tool uses."""
    global T, FW, FH, MATCH, HALF, BLACK, LIT, COUNTER, TOP, BOTTOM, V_CROP, V_POS, SKILLS_CROP, SKILLS_POS
    global COL_C, INV_X, INV_ROW0, INV_PITCH, INV_ROW_H, INV_MAX_ROWS, AFFINITY_CROP, AFFINITY_POS, STAT_SCALE
    global SLOT_W, SLOT_H, ROW_PITCH, GRID_X, SLOTS, STAT_ORDER, KEYS, DEFAULT_LENGTH, V_STRETCH_MAX
    try:
        T = json.loads(Path(path).read_text(encoding="utf-8"))
    except (OSError, ValueError) as e:
        die(f"can't read the template {path}: {e}")
    d, L = T["detection"], T["layout"]
    FW, FH = T["frame"]
    MATCH, HALF, BLACK, LIT = d["match"], d["half_size"], d["black"], d["lit"]
    COUNTER = tuple(L["counter"])
    TOP, BOTTOM = L["top"], L["bottom"]
    V_CROP, V_POS, V_STRETCH_MAX = tuple(L["v"]["crop"]), tuple(L["v"]["pos"]), L["v"]["stretch_max"]
    SKILLS_CROP, SKILLS_POS = tuple(L["skills"]["crop"]), tuple(L["skills"]["pos"])
    COL_C = tuple(L["right_column"])
    inv = L["inventory"]
    INV_X, INV_ROW0, INV_PITCH, INV_ROW_H = tuple(inv["x"]), inv["row0"], inv["pitch"], inv["row_height"]
    INV_MAX_ROWS = inv["max_rows"]
    AFFINITY_CROP, AFFINITY_POS = tuple(L["affinity"]["crop"]), tuple(L["affinity"]["pos"])
    s = L["stats"]
    STAT_SCALE, (SLOT_W, SLOT_H), ROW_PITCH, GRID_X = s["scale"], s["slot"], s["row_pitch"], tuple(s["columns_x"])
    SLOTS = [(GRID_X[i % 2], TOP + ROW_PITCH * (i // 2)) for i in range(2 * s["rows"])]
    STAT_ORDER = s["order"]
    KEYS = {"skills": tuple(L["skills"]["key"]), "inventory": tuple(inv["key"]),
            "affinity": tuple(L["affinity"]["key"]), **{k: tuple(v) for k, v in s["keys"].items()}}
    DEFAULT_LENGTH = L["length"]


def template_image(entry):
    """A reference image stored in the template, as a grayscale float array."""
    return Image.open(io.BytesIO(base64.b64decode(entry["png"]))).convert("L")


def find_template(video, given):
    if given:
        return Path(given)
    for folder in (Path(video).parent if not os.path.isdir(video) else Path(video), HERE):
        if (folder / TEMPLATE_NAME).exists():
            return folder / TEMPLATE_NAME
    die(f"no {TEMPLATE_NAME} beside the video or in {HERE}")


# ---------------------------------------------------------------- helpers

def die(msg, code=1):
    print("opening_stats: " + msg, file=sys.stderr)
    sys.exit(code)


def need(tool):
    if shutil.which(tool) is None:
        die(f"{tool} isn't on the PATH. Install ffmpeg (it includes ffprobe); after a winget install, "
            r"add %LOCALAPPDATA%\Microsoft\WinGet\Links to the PATH.")


def hms(t):
    t = max(0.0, t)
    m, s = divmod(t, 60)
    h, m = divmod(int(m), 60)
    return f"{h}:{m:02d}:{s:05.2f}" if h else f"{m}:{s:05.2f}"


def run(cmd):
    p = subprocess.run(cmd, capture_output=True)
    if p.returncode:
        die("this command failed:\n  " + " ".join(map(str, cmd)) + "\n" +
            "\n".join(p.stderr.decode("utf-8", "replace").strip().splitlines()[-12:]))
    return p


def resolve_input(path):
    path = os.path.normpath(path)   # ffmpeg's DASH reader can't find the pieces through mixed slashes
    if os.path.isdir(path):
        for root, _d, files in os.walk(path):
            if "session.mpd" in files:
                return os.path.join(root, "session.mpd")
        die(f"{path} is a folder with no session.mpd in it")
    if not os.path.exists(path):
        die(f"can't find {path}")
    return path


def probe(src):
    info = json.loads(run(["ffprobe", "-v", "error", "-print_format", "json",
                           "-show_format", "-show_streams", src]).stdout)
    v = next((s for s in info["streams"] if s.get("codec_type") == "video"), None)
    if v is None:
        die(f"no video in {src}")
    return {"width": int(v["width"]), "height": int(v["height"]),
            "duration": float(info["format"].get("duration") or v.get("duration") or 0),
            "audio": any(s.get("codec_type") == "audio" for s in info["streams"]),
            "full_range": v.get("color_range") == "pc" or v.get("pix_fmt", "").startswith("yuvj")}


def scan(src, start, dur, fps, w, h, keyframes=False):
    """Yield (time, gray frame) from src, w x h. fps=None keeps every frame."""
    cmd = ["ffmpeg", "-v", "error" if fps else "info", "-nostdin"]   # showinfo's timestamps log at info
    if keyframes:
        cmd += ["-skip_frame", "nokey"]
    if start:
        cmd += ["-ss", f"{start:.3f}"]
    if not fps:
        cmd += ["-copyts"]          # every frame: keep the clip's own timestamps, exact to the frame
    if dur:
        cmd += ["-t", f"{dur:.3f}"]
    vf = (f"fps={fps}," if fps else "") + f"scale={w}:{h}:flags=area,format=gray"
    if not fps:
        vf += ",showinfo"
    cmd += ["-i", src, "-map", "0:v:0", "-vf", vf, "-fps_mode", "passthrough", "-f", "rawvideo", "-"]
    if fps:
        p = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL)
        size, k = w * h, 0
        while True:
            buf = p.stdout.read(size)
            if len(buf) < size:
                break
            yield (start or 0) + k / fps, np.frombuffer(buf, np.uint8).reshape(h, w)
            k += 1
        p.wait()
    else:
        p = subprocess.run(cmd, capture_output=True)
        times = [float(x) for x in re.findall(rb"pts_time:\s*([-\d.]+)", p.stderr)]
        frames = np.frombuffer(p.stdout, np.uint8).reshape(-1, h, w)
        for t, f in zip(times, frames):
            yield t, f


def grab(src, t):
    """One full-size RGB frame at time t."""
    p = run(["ffmpeg", "-v", "error", "-nostdin", "-ss", f"{t:.3f}", "-i", src, "-frames:v", "1",
             "-f", "image2pipe", "-vcodec", "png", "-"])
    return np.asarray(Image.open(io.BytesIO(p.stdout)).convert("RGB"))


def luma(a):
    a = a.astype(np.float32)
    return 0.2126 * a[..., 0] + 0.7152 * a[..., 1] + 0.0722 * a[..., 2]


def ncc_max(img, tmpl):
    img = img.astype(np.float32)
    t = tmpl - tmpl.mean()
    tn = math.sqrt(float((t * t).sum())) or 1.0
    ones = np.ones_like(tmpl)
    num = fftconvolve(img, t[::-1, ::-1], mode="valid")
    s = fftconvolve(img, ones, mode="valid")
    s2 = fftconvolve(img * img, ones, mode="valid")
    var = np.maximum(s2 - s * s / tmpl.size, 0)
    ok = var > tmpl.size * 4.0                      # flat areas can't match
    out = np.where(ok, num / (np.sqrt(np.where(ok, var, 1)) * tn), 0)
    return float(out.max()) if out.size else 0.0


class Matcher:
    def __init__(self):
        self.t = {}
        for name, ref in T["references"].items():
            search = ref["search"]
            im = template_image(ref)
            im = im.resize((im.width // HALF, im.height // HALF), Image.LANCZOS)
            self.t[name] = (np.asarray(im, np.float32), [v // HALF for v in search])
        cur = template_image(T["cursor"])
        self.cursor = np.asarray(cur.resize((cur.width // HALF, cur.height // HALF), Image.LANCZOS), np.float32)

    def cursor_parked(self, frame):
        """The menu cursor shows as a small square only when it's on empty space, so
        nothing is hovered and no pop-up covers the inventory bar."""
        y0, y1 = INV_ROW0 // HALF, (INV_ROW0 + 4 * INV_PITCH) // HALF
        return ncc_max(frame[y0:y1, INV_X[0] // HALF:INV_X[1] // HALF], self.cursor) > T["detection"]["cursor_parked"]

    def score(self, frame, name):
        tmpl, (x0, y0, x1, y1) = self.t[name]
        return ncc_max(frame[y0:y1, x0:x1], tmpl)

    def tall_figure(self, frame):
        """V stands head to toe in the preview; an item preview is wide and short."""
        tf = T["detection"]["tall_figure"]
        x0, y0, x1, y1 = (v // HALF for v in tf["region"])
        rows = (frame[y0:y1, x0:x1] > tf["brightness"]).sum(axis=1) >= 3
        return int(rows.sum()) * HALF >= tf["min_height"]

    def classify(self, frame):
        if self.score(frame, "cyberware") > MATCH:
            return "hub"
        if self.score(frame, "skills") > MATCH:
            return "skills"
        if self.score(frame, "filters") > MATCH and self.score(frame, "components") > MATCH:
            return "inventory"
        if self.score(frame, "rotate") > MATCH and self.tall_figure(frame):
            return "v"
        if self.score(frame, "flatlined") > MATCH:
            return "flatlined"
        return None


# ---------------------------------------------------------------- finding the key frames

def coarse(src, workdir):
    """Every keyframe (about one every 3 s in Steam's footage), quarter size:
    (time, mean brightness, brightest pixel in the strips outside the 16:9 middle).
    Read one at a time, so a two-hour session doesn't fill the memory."""
    w, h = FW // 4, FH // 4
    log = workdir / "_keyframes.log"
    with open(log, "wb") as err:
        p = subprocess.Popen(["ffmpeg", "-v", "info", "-nostdin", "-skip_frame", "nokey", "-i", src,
                              "-map", "0:v:0", "-vf", f"scale={w}:{h}:flags=area,format=gray,showinfo",
                              "-fps_mode", "passthrough", "-f", "rawvideo", "-"],
                             stdout=subprocess.PIPE, stderr=err)
        feats = []
        while True:
            buf = p.stdout.read(w * h)
            if len(buf) < w * h:
                break
            f = np.frombuffer(buf, np.uint8).reshape(h, w)
            feats.append((float(f.mean()), max(int(f[:, :110].max()), int(f[:, 750:].max()))))
        p.wait()
    times = [float(x) for x in re.findall(rb"pts_time:\s*([-\d.]+)", log.read_bytes())]
    log.unlink()
    return [(t, m, s) for t, (m, s) in zip(times, feats)]


def runs(flags, times, gap):
    spans, cur = [], None
    for t, on in zip(times, flags):
        if on:
            if cur and t - cur[1] <= gap:
                cur[1] = t
            else:
                cur = [t, t]
                spans.append(cur)
    return [tuple(s) for s in spans]


def find_openings(src, kf, duration, m):
    """Every game over (FLATLINED) that leads into a black loading screen, in
    order. Where each falls is reported, not judged."""
    times = [k[0] for k in kf]
    blacks = runs([k[1] < BLACK for k in kf], times, 3.5)
    found = []
    for b0, b1 in blacks:
        if found and b0 <= found[-1]["loading"][1]:
            continue                      # more of a loading screen already found
        hit = opening_at(src, kf, duration, m, b0)
        if hit:
            found.append(hit)
    return found


def opening_at(src, kf, duration, m, b0):
    """The game over leading into the black stretch whose first keyframe is at b0, if any."""
    a = max(0.0, b0 - 15)
    flat = [t for t, f in scan(src, a, b0 + 3 - a, 10, FW // HALF, FH // HALF)
            if m.score(f, "flatlined") > MATCH]
    if not flat:
        return None
    last = max(flat)
    onset = next((t for t, f in scan(src, last, 6.0, None, 430, 180) if f.mean() < BLACK), None)
    if onset is None:
        return None
    after = [k for k in kf if k[0] > onset]
    end_kf = next((k[0] for k in after if k[1] >= LIT), duration)
    prev = max([k[0] for k in after if k[0] < end_kf and k[1] < BLACK], default=onset)
    end = next((t for t, f in scan(src, prev, end_kf - prev + 0.2, None, 430, 180)
                if f.mean() >= LIT), end_kf)
    if end - onset < 3:
        return None
    return {"game_over": [min(flat), last], "loading": [onset, end]}


def find_loadings(src, kf, duration, min_len):
    """Every black loading screen in the clip, game over or not: [(onset, end)],
    exact to the frame. Keyframes find the black stretches; a frame-by-frame read
    finds where each starts and ends."""
    times = [k[0] for k in kf]
    found = []
    for b0, _b1 in runs([k[1] < BLACK for k in kf], times, 3.5):
        if found and b0 <= found[-1][1]:
            continue                      # more of a loading screen already found
        prev_lit = max([k[0] for k in kf if k[0] < b0 and k[1] >= BLACK], default=max(0.0, b0 - 4))
        onset = None
        for t, f in scan(src, prev_lit, b0 - prev_lit + 0.2, None, 430, 180):
            if f.mean() < BLACK:
                onset = t if onset is None else onset
            else:
                onset = None
        if onset is None:
            continue
        after = [k for k in kf if k[0] > onset]
        end_kf = next((k[0] for k in after if k[1] >= LIT), duration)
        prev = max([k[0] for k in after if k[0] < end_kf and k[1] < BLACK], default=onset)
        end = next((t for t, f in scan(src, prev, end_kf - prev + 0.2, None, 430, 180)
                    if f.mean() >= LIT), end_kf)
        if end - onset >= min_len:
            found.append((onset, end))
    return found


def scan_menus(src, kf, m, fps=4):
    """Classify every frame of the menu stretches (black bars down both sides)."""
    times = [k[0] for k in kf]
    sessions = runs([k[2] < 12 and k[1] >= BLACK for k in kf], times, 7.0)
    hits = []          # (time, class, session index)
    for si, (s0, s1) in enumerate(sessions):
        a = max(0.0, s0 - 3)
        for t, f in scan(src, a, s1 + 3 - a, fps, FW // HALF, FH // HALF):
            c = m.classify(f)
            if c == "inventory" and m.cursor_parked(f):
                c = "inventory clear"
            if c:
                hits.append((t, c, si))
    return sessions, hits


def best_session(hits):
    """The menu visit holding the most key elements, so V's turn, the skills, the
    inventory and the stats all show V at one moment. Ties go to the longer turn."""
    score = {}
    for _t, c, si in hits:
        kinds, vframes = score.setdefault(si, (set(), [0]))
        kinds.add({"inventory clear": "inventory"}.get(c, c) if c != "flatlined" else "flat")
        if c == "v":
            vframes[0] += 1
    if not score:
        return -1
    return max(score, key=lambda si: (len(score[si][0] & {"v", "skills", "inventory", "hub"}), score[si][1][0]))


def v_span(src, hits, m, session=-1):
    vs = [(t, si) for t, c, si in hits if c == "v" and si == session] or \
         [(t, si) for t, c, si in hits if c == "v"]
    best = None
    for s0, s1 in runs([True] * len(vs), [t for t, _ in vs], 0.6):
        if best is None or s1 - s0 > best[1] - best[0]:
            best = (s0, s1)
    if best is None:
        return None
    s0, s1 = best
    pre = [t for t, f in scan(src, max(0, s0 - 0.4), 0.4, None, FW // HALF, FH // HALF)
           if m.score(f, "rotate") > MATCH and m.tall_figure(f)]
    if pre:
        s0 = min(pre)
    post = []
    for t, f in scan(src, s1, 0.4, None, FW // HALF, FH // HALF):
        if m.score(f, "rotate") > MATCH and m.tall_figure(f):
            post.append(t)
        else:
            break
    if post:
        s1 = max(post)
    session = next(si for t, si in vs if t >= best[0])
    return {"start": s0, "end": s1, "session": session}


def medoid(src, times, box):
    """The most typical frame among times for the region box: pop-ups and the
    cursor move about, the screen underneath doesn't."""
    if len(times) == 1:
        return times[0]
    x0, y0, x1, y1 = box
    feats = []
    for t in times:
        f = grab(src, t)[y0:y1, x0:x1]
        g = luma(f)[::8, ::8]
        feats.append(g.ravel())
    F = np.array(feats)
    d = np.abs(F[:, None, :] - F[None, :, :]).mean(axis=2)
    return times[int(np.argmin(np.median(d, axis=1)))]


def pick(hits, cls, near, session, k, latest=False):
    """Up to k frames of a class: from V's menu stretch if it has any, nearest
    to V's turn (or the latest ones), at least half a second apart."""
    cls = set([cls] if isinstance(cls, str) else cls)
    cand = [t for t, c, si in hits if c in cls and si == session] or [t for t, c, si in hits if c in cls]
    if not cand:
        return []
    cand.sort(key=(lambda t: -t) if latest else (lambda t: abs(t - near)))
    out = []
    for t in cand:
        if all(abs(t - u) >= 0.5 for u in out):
            out.append(t)
        if len(out) == k:
            break
    return sorted(out)


# ---------------------------------------------------------------- cutting the elements

def clusters(frame, x0, x1, y0, y1, gap, thresh=70):
    cols = luma(frame[y0:y1, x0:x1]).max(axis=0) > thresh
    xs = np.where(cols)[0]
    if not len(xs):
        return []
    out, start, prev = [], xs[0], xs[0]
    for x in xs[1:]:
        if x - prev > gap:
            out.append((x0 + start - 6, y0, x0 + prev + 7, y1))
            start = x
        prev = x
    out.append((x0 + start - 6, y0, x0 + prev + 7, y1))
    return out


def erase_cursor(frame):
    """Paint out the menu cursor (a small hollow square) where it sits on empty space."""
    f = frame.copy()
    x0, x1 = INV_X
    y0, y1 = INV_ROW0, INV_ROW0 + 4 * INV_PITCH
    tmpl = np.asarray(template_image(T["cursor"]), np.float32)
    g = luma(f[y0:y1, x0:x1])
    t = tmpl - tmpl.mean()
    ones = np.ones_like(tmpl)
    num = fftconvolve(g, t[::-1, ::-1], mode="valid")
    s = fftconvolve(g, ones, mode="valid")
    s2 = fftconvolve(g * g, ones, mode="valid")
    var = np.maximum(s2 - s * s / tmpl.size, 1e-6)
    score = num / (np.sqrt(var) * math.sqrt(float((t * t).sum())))
    for _ in range(3):
        y, x = np.unravel_index(int(np.argmax(score)), score.shape)
        if score[y, x] < T["detection"]["cursor_erase"]:
            break
        f[y0 + y:y0 + y + tmpl.shape[0], x0 + x:x0 + x + tmpl.shape[1]] = 0
        score[max(0, y - 20):y + 20, max(0, x - 20):x + 20] = 0
    return f


def stat_boxes(hub):
    # Split the top-left stats on their text line: the dots under LEVEL nearly reach "10".
    tb = T["detection"]["top_bar"]
    lx0, lx1, ly0, ly_text, ly1 = tb["left"]
    text = clusters(hub, lx0, lx1, ly0, ly_text, gap=tb["left_gap"])
    left = []
    for i, (a, _y0, b, _y1) in enumerate(text):
        nxt = text[i + 1][0] - 12 if i + 1 < len(text) else lx1
        under = clusters(hub, a, nxt, ly_text, ly1, gap=nxt - a)
        right_edge = max([b] + [u[2] for u in under])
        left.append((a, ly0, right_edge, ly1))
    right = clusters(hub, *tb["right"], gap=tb["right_gap"])
    lvlup = clusters(hub, *tb["level_up"], gap=200, thresh=tb["level_up_brightness"])   # skip the button's red trim
    boxes = {}
    if len(left) >= 2:
        boxes["level"], boxes["street cred"] = left[0], left[1]
    if len(right) >= 2:
        boxes["carry weight"], boxes["money"] = right[-2], right[-1]
    if lvlup:
        boxes["level up"] = (lvlup[0][0], lvlup[0][1], lvlup[-1][2], lvlup[-1][3])
    return boxes


def inventory_rows(inv):
    x0, x1 = INV_X
    rows = 0
    for k in range(INV_MAX_ROWS):
        y0 = INV_ROW0 + k * INV_PITCH
        band = luma(inv[y0:y0 + INV_ROW_H, x0:x1]).max(axis=0) > 80
        if band.mean() < 0.03:
            break
        rows += 1
    return rows


def keyed(frame, box, scale, lo, hi):
    x0, y0, x1, y1 = box
    img = Image.fromarray(frame[y0:y1, x0:x1])
    if abs(scale - 1) > 1e-3:
        img = img.resize((round(img.width * scale), round(img.height * scale)), Image.LANCZOS)
    a = np.asarray(img).astype(np.float32)
    t = np.clip((luma(a) - lo) / (hi - lo), 0, 1)
    alpha = t * t * (3 - 2 * t)
    h, w = alpha.shape
    ry = np.minimum(np.arange(h), np.arange(h)[::-1]) / 10
    rx = np.minimum(np.arange(w), np.arange(w)[::-1]) / 10
    alpha *= np.clip(np.minimum.outer(ry, rx), 0, 1)
    return a * alpha[..., None]


def build_layer(skills, inv, stats, hub, out_dir, font_path):
    """stats: the menu frame the top-bar stats are read from. hub: the hub frame,
    or None; only the affinity card and LEVEL UP need it, and both are optional."""
    canvas = np.zeros((FH, FW, 3), np.float32)
    placed = []

    def put(name, e, x, y):
        h, w = e.shape[:2]
        canvas[y:y + h, x:x + w] = np.maximum(canvas[y:y + h, x:x + w], e)
        placed.append({"name": name, "x": x, "y": y, "w": w, "h": h})

    put("skill progression", keyed(skills, SKILLS_CROP, (BOTTOM - TOP) / (SKILLS_CROP[3] - SKILLS_CROP[1]),
                                   *KEYS["skills"]), *SKILLS_POS)
    rows = max(1, inventory_rows(inv))
    inv_box = (INV_X[0], INV_ROW0, INV_X[1], INV_ROW0 + rows * INV_PITCH + 5)
    e = keyed(erase_cursor(inv), inv_box, (COL_C[1] - COL_C[0]) / (INV_X[1] - INV_X[0]), *KEYS["inventory"])
    put("inventory", e, COL_C[0], BOTTOM - e.shape[0])
    if hub is not None:
        put("affinity", keyed(hub, AFFINITY_CROP, STAT_SCALE, *KEYS["affinity"]), *AFFINITY_POS)
    sources = {n: (stats, b) for n, b in stat_boxes(stats).items() if n != "level up"}
    if hub is not None and "level up" in stat_boxes(hub):
        sources["level up"] = (hub, stat_boxes(hub)["level up"])
    for i, name in enumerate(STAT_ORDER):
        if name in sources:
            frame, box = sources[name]
            e = keyed(frame, box, STAT_SCALE, *KEYS[name])
            x, y = SLOTS[i]
            put(name, e, x, y + max(0, (SLOT_H - e.shape[0]) // 2))
    boxes = sources
    open_slots = [SLOTS[i] for i in range(len(SLOTS)) if i >= len(STAT_ORDER) or STAT_ORDER[i] not in boxes]
    Image.fromarray(canvas.clip(0, 255).astype(np.uint8)).save(out_dir / "layer_static.png")

    guide = Image.fromarray(canvas.clip(0, 255).astype(np.uint8))
    d = ImageDraw.Draw(guide)
    try:
        fnt = ImageFont.truetype(font_path, 26)
    except OSError:
        fnt = ImageFont.load_default()
    vbox = {"name": "V turning", "x": V_POS[0], "y": V_POS[1],
            "w": V_CROP[2] - V_CROP[0], "h": V_CROP[3] - V_CROP[1]}
    for p in [vbox] + placed:
        d.rectangle([p["x"], p["y"], p["x"] + p["w"], p["y"] + p["h"]], outline=(255, 210, 0), width=3)
        d.text((p["x"] + 6, p["y"] - 32), p["name"], fill=(255, 210, 0), font=fnt)
    for x, y in open_slots:
        for i in range(x, x + SLOT_W, 24):
            d.line([i, y, min(i + 12, x + SLOT_W), y], fill=(120, 200, 255), width=2)
            d.line([i, y + SLOT_H, min(i + 12, x + SLOT_W), y + SLOT_H], fill=(120, 200, 255), width=2)
        d.text((x + 10, y + SLOT_H // 2 - 14), "open slot", fill=(120, 200, 255), font=fnt)
    inv_p = next(p for p in placed if p["name"] == "inventory")
    room = (inv_p["y"] - (TOP + 4 * ROW_PITCH)) // round(INV_PITCH * (COL_C[1] - COL_C[0]) / (INV_X[1] - INV_X[0]))
    d.text((inv_p["x"] + 10, inv_p["y"] - 40), f"room for {max(0, room)} more inventory rows",
           fill=(120, 200, 255), font=fnt)
    d.rectangle(COUNTER, outline=(255, 80, 80), width=3)
    d.text((COUNTER[0], COUNTER[3] + 6), "loading counter (kept clear)", fill=(255, 80, 80), font=fnt)
    if hub is None:
        x, y = AFFINITY_POS
        d.rectangle([x, y, x + 363, y + 585], outline=(120, 200, 255), width=2)
        d.text((x + 10, y + 280), "affinity card (no hub)", fill=(120, 200, 255), font=fnt)
    guide.save(out_dir / "layout guide.png")
    return placed, [n for n in STAT_ORDER if n not in boxes], rows


# ---------------------------------------------------------------- rendering

def v_timing(length, vdur):
    """How V's turn fills a window: (speed factor, seconds of last frame held)."""
    if vdur >= length:
        return 1.0, 0.0
    k = min(length / vdur, V_STRETCH_MAX)
    return k, max(0.0, length - vdur * k)


_ENCODER = None


def encoder():
    """HEVC on an NVIDIA card where there is one; else x264. ffmpeg lists hevc_nvenc
    whether or not there's a card to run it, so it's tried on a few frames first."""
    global _ENCODER
    if _ENCODER is None:
        p = subprocess.run(["ffmpeg", "-v", "error", "-nostdin", "-f", "lavfi", "-i", "color=s=256x256:d=0.2",
                            "-c:v", "hevc_nvenc", "-f", "null", "-"], capture_output=True)
        _ENCODER = p.returncode == 0
    if _ENCODER:
        return ["-c:v", "hevc_nvenc", "-preset", "p5", "-tune", "hq", "-rc", "vbr", "-cq", "19", "-b:v", "0",
                "-maxrate", "60M", "-bufsize", "120M", "-tag:v", "hvc1"], True
    return ["-c:v", "libx264", "-preset", "medium", "-crf", "16"], False


def render_full(src, info, out_video, windows, vspan, layer_png):
    """A full copy of the clip with the stats laid over every loading screen in
    windows [(start, end)]: the static layer and V's turn, faded in and out, blended
    with Lighten so the black drops out and the counter shows through."""
    vdur = vspan["end"] - vspan["start"]
    longest = max(b - a for a, b in windows)
    vlen = min(vdur, longest)
    vx, vy = V_POS
    cw, ch = V_CROP[2] - V_CROP[0], V_CROP[3] - V_CROP[1]
    bl = T["layout"]["v"]["black_level"]
    fin, fout = T["layout"]["fade_in"], T["layout"]["fade_out"]
    n = len(windows)
    parts = [
        "[0:v]fps=60,format=gbrp[base]",
        f"[1:v]crop={cw}:{ch}:{V_CROP[0]}:{V_CROP[1]},format=gbrp,"
        f"colorlevels=rimin={bl}:gimin={bl}:bimin={bl},split={n}" + "".join(f"[v{i}]" for i in range(n)),
        f"[2:v]format=gbrp,split={n}" + "".join(f"[s{i}]" for i in range(n)),
        f"color=c=black:s={FW}x{FH}:r=60:d={info['duration'] + 1:.3f},format=gbrp[c0]",
    ]
    timing = []
    for i, (a, b) in enumerate(windows):
        length = b - a
        k, hold = v_timing(length, min(vdur, length))
        timing.append((round(1 / k, 3), round(hold, 2)))
        vchain = f"[v{i}]trim=duration={min(vdur, length):.3f},setpts=(PTS-STARTPTS)*{k:.5f}"
        if hold > 0.01:
            vchain += f",tpad=stop_mode=clone:stop_duration={hold:.3f}"
        parts.append(vchain + f"[vv{i}]")
        parts.append(f"[s{i}]trim=duration={length:.3f},setpts=PTS-STARTPTS[ss{i}]")
        parts.append(f"[ss{i}][vv{i}]overlay={vx}:{vy}:eof_action=pass:format=gbrp,"
                     f"fade=t=in:st=0:d={fin},fade=t=out:st={max(0.0, length - fout):.3f}:d={fout},"
                     f"setpts=PTS+{a:.3f}/TB[l{i}]")
        parts.append(f"[c{i}][l{i}]overlay=0:0:eof_action=pass:enable='between(t,{a:.3f},{b:.3f})'[c{i + 1}]")
    on = "+".join(f"between(t,{a:.3f},{b:.3f})" for a, b in windows)
    full = info["full_range"]
    enc, nvenc = encoder()
    out_fmt = "yuv420p" if nvenc or not full else "yuvj420p"
    parts.append(f"[base][c{n}]blend=all_mode=lighten:shortest=1:enable='{on}',format={out_fmt}[out]")
    rng = ["-color_range", "pc"] if full else []
    tags = ["-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709"]
    cmd = (["ffmpeg", "-v", "error", "-stats", "-nostdin", "-y", "-i", src,
            "-ss", f"{vspan['start']:.3f}", "-t", f"{vlen:.3f}", "-i", src,
            "-loop", "1", "-framerate", "60", "-i", str(layer_png),
            "-filter_complex", ";".join(parts), "-map", "[out]"] +
           (["-map", "0:a?", "-c:a", "copy"] if info["audio"] else []) +
           enc + rng + tags + ["-movflags", "+faststart", str(out_video)])
    p = subprocess.run(cmd, stderr=subprocess.PIPE, text=True, errors="replace")
    if p.returncode:
        die("the render failed:\n" + "\n".join(p.stderr.splitlines()[-10:]))
    return timing


def window_sheet(video, windows, out, font_path):
    """A still from the middle of each populated loading screen, from the new copy."""
    tiles = []
    try:
        fnt = ImageFont.truetype(font_path, 22)
    except OSError:
        fnt = ImageFont.load_default()
    for i, (a, b) in enumerate(windows, 1):
        im = Image.fromarray(grab(str(video), (a + b) / 2)).resize((860, 360), Image.LANCZOS)
        d = ImageDraw.Draw(im)
        d.rectangle([0, 328, 860, 360], fill=(0, 0, 0))
        d.text((8, 332), f"loading screen {i}: {hms(a)} to {hms(b)}", fill=(255, 210, 0), font=fnt)
        tiles.append(im)
    sheet = Image.new("RGB", (860 * 2, 360 * ((len(tiles) + 1) // 2)), "black")
    for i, im in enumerate(tiles):
        sheet.paste(im, ((i % 2) * 860, (i // 2) * 360))
    sheet.save(out, quality=88)


def contact(src, found, out_dir, font_path):
    tiles = []
    for label, t in found:
        if t is None:
            im = Image.new("RGB", (860, 360), (40, 0, 0))
            txt = f"{label}: NOT FOUND"
        else:
            im = Image.fromarray(grab(src, t)).resize((860, 360), Image.LANCZOS)
            txt = f"{label} at {hms(t)}"
        d = ImageDraw.Draw(im)
        try:
            fnt = ImageFont.truetype(font_path, 22)
        except OSError:
            fnt = ImageFont.load_default()
        d.rectangle([0, 328, 860, 360], fill=(0, 0, 0))          # at the bottom: the stats bar is on top
        d.text((8, 332), txt, fill=(255, 210, 0) if t is not None else (255, 90, 90), font=fnt)
        tiles.append(im)
    sheet = Image.new("RGB", (860 * 2, 360 * ((len(tiles) + 1) // 2)), "black")
    for i, im in enumerate(tiles):
        sheet.paste(im, ((i % 2) * 860, (i // 2) * 360))
    sheet.save(out_dir / "key frames.jpg", quality=88)


# ---------------------------------------------------------------- main

def main():
    ap = argparse.ArgumentParser(description="Check a clip for the opening template (game over, then V's "
                                             "stats on the loading screen) and build the overlay.")
    ap.add_argument("video", help="an MP4, or a Steam clip folder (holds session.mpd)")
    ap.add_argument("--out", help="folder for the results (default: '<clip> opening' beside the clip)")
    ap.add_argument("--template", help=f"the template file (default: {TEMPLATE_NAME} beside the video, "
                                       "or else beside this script)")
    ap.add_argument("--within", type=float,
                    help="a game over starting later than this many seconds into the clip is noted in the "
                         "report; it doesn't block (default: the template's, 60)")
    ap.add_argument("--length", type=float,
                    help="seconds of each loading screen the stats cover, from when it turns black, never past "
                         "its end (default: the template's, 8.98, as in the approved edit)")
    ap.add_argument("--min-loading", type=float, default=1.5,
                    help="shortest loading screen to populate, in seconds (default 1.5); shorter ones are listed")
    ap.add_argument("--video-out", help="the populated copy (default: '<clip> with stats.mp4' beside the clip)")
    ap.add_argument("--check-only", action="store_true", help="find the key frames and report; render nothing")
    args = ap.parse_args()
    need("ffmpeg"), need("ffprobe")
    template_path = find_template(args.video, args.template)
    load_template(template_path)
    if args.within is None:
        args.within = T["detection"]["within"]
    if args.length is None:
        args.length = DEFAULT_LENGTH
    src = resolve_input(args.video)
    stem = Path(args.video.rstrip("/\\")).stem
    if args.out:
        out_dir = Path(args.out)
    elif os.path.isdir(args.video):
        die("for a Steam clip folder, give --out with a folder of your choosing")
    else:
        out_dir = Path(args.video).parent / f"{stem} opening"
    out_dir.mkdir(parents=True, exist_ok=True)
    font_path = str(next((p for p in [r"C:\Windows\Fonts\consola.ttf", HERE / "consola.ttf",
                                      "/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf"]
                          if os.path.exists(p)), ""))

    info = probe(src)
    report = {"clip": args.video, "template": str(template_path), "missing": [], "warnings": []}
    print(f"{stem}: {info['width']}x{info['height']}, {hms(info['duration'])}")
    print(f"template: {template_path}")
    if (info["width"], info["height"]) != (FW, FH):
        report["missing"].append(f"{FW}x{FH} footage (this is {info['width']}x{info['height']}; the key "
                                 f"elements are matched, and the layout made, at {FW}x{FH})")
        return finish(report, out_dir, None, src, font_path)

    m = Matcher()
    print("reading keyframes...")
    kf = coarse(src, out_dir)
    print("looking for the game over and the loading screen...")
    openings = find_openings(src, kf, info["duration"], m)
    opening = openings[0] if openings else None
    report["occurrences"] = [{"game_over": [round(x, 2) for x in o["game_over"]],
                              "loading": [round(x, 2) for x in o["loading"]]} for o in openings]
    print("reading the menus...")
    sessions, hits = scan_menus(src, kf, m)
    main_visit = best_session(hits)
    vspan = v_span(src, hits, m, main_visit)
    report["menus"] = [[round(a, 2), round(b, 2)] for a, b in sessions]
    report["found"] = {c: len([1 for _t, cc, _s in hits if cc == c])
                       for c in ("flatlined", "v", "skills", "inventory", "inventory clear", "hub")}
    check = {}                      # key element -> where it was found, or None

    # FLATLINE frames and LOADING BLANK: a game over leading into a black loading screen.
    flat_hits = sorted(t for t, c, _s in hits if c == "flatlined")
    if opening:
        check["FLATLINE frames"] = opening["game_over"]
        check["LOADING BLANK"] = opening["loading"]
        if opening["game_over"][0] > args.within:
            report["warnings"].append(f"the game over starts at {hms(opening['game_over'][0])}, not in the "
                                      f"first {args.within:g} s")
    else:
        check["FLATLINE frames"] = [flat_hits[0], flat_hits[-1]] if flat_hits else None
        check["LOADING BLANK"] = None
    # SPINNING MODEL: V turning in the inventory preview.
    if vspan and vspan["end"] - vspan["start"] >= T["detection"]["v_min_seconds"]:
        check["SPINNING MODEL"] = [vspan["start"], vspan["end"]]
        if vspan["end"] - vspan["start"] < T["detection"]["v_note_seconds"]:
            report["warnings"].append(f"V's turn is only {vspan['end'] - vspan['start']:.1f} s")
    else:
        vspan = None
        check["SPINNING MODEL"] = None
    near = (vspan["start"] + vspan["end"]) / 2 if vspan else 0
    sess = main_visit
    picks = {
        "skills": pick(hits, "skills", near, sess, 8),
        "inventory": pick(hits, "inventory clear", near, sess, 8),
        "hub": pick(hits, "hub", near, sess, 6, latest=True),
    }
    if not picks["inventory"]:
        picks["inventory"] = pick(hits, ("inventory", "inventory clear"), near, sess, 12)
        if picks["inventory"]:
            report["warnings"].append("no inventory frame with the cursor off the items, so a pop-up may "
                                      "cover part of the inventory bar: check it")
    chosen = {}
    for cls, box in (("skills", SKILLS_CROP), ("inventory", (INV_X[0], INV_ROW0, INV_X[1], INV_ROW0 + 2 * INV_PITCH)),
                     ("hub", (520, 20, 2925, 700))):
        if picks[cls]:
            chosen[cls] = medoid(src, picks[cls], box)
    check["INVENTORY GRID"] = chosen.get("inventory")
    check["SKILL PROGRESSION"] = chosen.get("skills")
    if 0 <= sess < len(sessions):
        a, b = sessions[sess][0] - 3, sessions[sess][1] + 3
        report["menu_visit"] = [round(a, 2), round(b, 2)]
        moments = {"SPINNING MODEL": near if vspan else None, "INVENTORY GRID": chosen.get("inventory"),
                   "SKILL PROGRESSION": chosen.get("skills"), "hub": chosen.get("hub")}
        for name, t in moments.items():
            if t is not None and not a <= t <= b:
                report["warnings"].append(f"{name} comes from another menu visit ({hms(t)}) than the rest "
                                          f"({hms(a)} to {hms(b)}), so V may have changed in between")
    # LEVEL, STREET CRED, ENCUMBRANCE, GOLD: the top bar, on the hub, the inventory or the skills page.
    stats_t, stats_page, best = None, None, {}
    for page in ("hub", "inventory", "skills"):
        if page in chosen:
            boxes = stat_boxes(grab(src, chosen[page]))
            got = {n: b for n, b in boxes.items() if n in ("level", "street cred", "carry weight", "money")}
            if len(got) > len(best):
                best, stats_t, stats_page = got, chosen[page], page
            if len(got) == 4:
                break
    for key, name in (("LEVEL", "level"), ("STREET CRED", "street cred"),
                      ("ENCUMBRANCE", "carry weight"), ("GOLD", "money")):
        check[key] = stats_t if name in best else None
    report["stats_from"] = stats_page
    # The menu frames each element is cut from; vertical_loading.py reads these too.
    report["frames"] = {k: (None if v is None else round(v, 2)) for k, v in
                        {"skills": chosen.get("skills"), "inventory": chosen.get("inventory"),
                         "hub": chosen.get("hub"), "stats": stats_t}.items()}
    # Optional: the hub's affinity card and LEVEL UP badge.
    if "hub" not in chosen:
        report["warnings"].append("no hub screen, so the affinity card and LEVEL UP are left out (optional)")
    report["check"] = {k: (None if v is None else [round(x, 2) for x in v] if isinstance(v, list) else round(v, 2))
                       for k, v in check.items()}
    report["missing"] = [k for k, v in check.items() if v is None]
    if check["FLATLINE frames"] and not check["LOADING BLANK"]:
        report["warnings"].append(f"the game over at {hms(check['FLATLINE frames'][0])} isn't followed by "
                                  "a black loading screen")
    found = [("FLATLINE frames", check["FLATLINE frames"][1] - 0.3 if check["FLATLINE frames"] else None),
             ("LOADING BLANK", check["LOADING BLANK"][0] + 2 if check["LOADING BLANK"] else None),
             ("SPINNING MODEL", (vspan["start"] + vspan["end"]) / 2 if vspan else None),
             ("SKILL PROGRESSION", chosen.get("skills")),
             ("INVENTORY GRID", chosen.get("inventory")),
             (f"LEVEL, STREET CRED, ENCUMBRANCE, GOLD ({stats_page or 'none'})", stats_t)]
    if "hub" in chosen and stats_page != "hub":
        found.append(("hub (optional)", chosen["hub"]))
    contact(src, found, out_dir, font_path)
    if report["missing"] or args.check_only:
        return finish(report, out_dir, None, src, font_path)

    print("finding every loading screen...")
    loadings = find_loadings(src, kf, info["duration"], 0.3)
    if not any(a <= opening["loading"][0] + 0.2 and b >= opening["loading"][0] for a, b in loadings):
        loadings.append(tuple(opening["loading"]))
        loadings.sort()
    windows, short = [], []
    for a, b in loadings:
        (windows if b - a >= args.min_loading else short).append((a, min(b, a + args.length)))
    report["loading_screens"] = [[round(a, 2), round(b, 2)] for a, b in loadings]
    if short:
        report["warnings"].append("loading screens shorter than " f"{args.min_loading:g} s, left as they are: "
                                  + ", ".join(f"{hms(a)} to {hms(b)}" for a, b in short))
    hub = grab(src, chosen["hub"]) if "hub" in chosen else None
    placed, absent, rows = build_layer(grab(src, chosen["skills"]), grab(src, chosen["inventory"]),
                                       grab(src, stats_t), hub, out_dir, font_path)
    if "level up" in absent and hub is not None:
        report["warnings"].append("no LEVEL UP badge on the hub (it only shows while points are unspent); "
                                  "its slot stays empty")
    report["inventory_rows"] = rows
    report["windows"] = [[round(a, 2), round(b, 2)] for a, b in windows]
    report["layout"] = placed
    if os.path.isdir(args.video) and not args.video_out:
        video_out = out_dir / f"{stem} with stats.mp4"
    else:
        video_out = Path(args.video_out) if args.video_out else Path(args.video).parent / f"{stem} with stats.mp4"
    print(f"rendering the full copy, stats on {len(windows)} loading screen(s)...")
    timing = render_full(src, info, video_out, windows, vspan, out_dir / "layer_static.png")
    slow = [(w, s, h) for w, (s, h) in zip(windows, timing) if h]
    if slow:
        report["warnings"].append(f"V's turn is {vspan['end'] - vspan['start']:.1f} s, so on the longer loading "
                                  "screens it's slowed and its last frame held: " + "; ".join(
                                      f"{hms(w[0])} at {s:.0%}, held {h:.1f} s" for w, s, h in slow))
    window_sheet(video_out, windows, out_dir / "loading screens.jpg", font_path)
    got = probe(str(video_out))["duration"]
    report["files"] = {"video": str(video_out), "sheet": "loading screens.jpg", "guide": "layout guide.png",
                       "length": round(got, 2)}
    return finish(report, out_dir, windows, src, font_path)


def finish(report, out_dir, window, src, font_path):
    ok = not report["missing"]
    lines = [("ACCEPTED" if ok else "REJECTED") + f": {report['clip']}"]
    if not ok:
        lines.append("Missing key elements: " + ", ".join(report["missing"]))
    for key, v in report.get("check", {}).items():
        where = "MISSING" if v is None else (f"{hms(v[0])} to {hms(v[1])}" if isinstance(v, list) else hms(v))
        if v is not None and key in ("LEVEL", "STREET CRED", "ENCUMBRANCE", "GOLD"):
            where += f" ({report.get('stats_from')})"
        lines.append(f"  {key:18s} {where}")
    occ = report.get("occurrences", [])
    if occ:
        lines.append(f"Game over into a loading blank, {len(occ)} in all: " + "; ".join(
            f"{hms(o['game_over'][0])} (blank {hms(o['loading'][0])} to {hms(o['loading'][1])})" for o in occ))
    if "windows" in report:
        lines.append(f"Stats on {len(report['windows'])} loading screen(s): " + "; ".join(
            f"{hms(a)} to {hms(b)}" for a, b in report["windows"]))
    lines += [f"Note (doesn't block): {w}" for w in report["warnings"]]
    if "files" in report:
        f = report["files"]
        lines.append(f"Populated copy: {f['video']} ({hms(f['length'])}); the clip itself is unchanged.")
        lines.append(f"Check: {f['sheet']} (a still from each loading screen) and {f['guide']}.")
        lines.append("Next: trim the copy for content, then run the menu cut on your trimmed version.")
    text = "\n".join(lines)
    (out_dir / "report.txt").write_text(text + "\n", encoding="utf-8")
    (out_dir / "report.json").write_text(json.dumps(report, indent=1, default=str), encoding="utf-8")
    print(text)
    print(f"Report and key frames: {out_dir}")
    sys.exit(0 if ok else 2)


if __name__ == "__main__":
    main()
