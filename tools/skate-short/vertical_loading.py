#!/usr/bin/env python3
"""Build the vertical (9:16) loading screen for a Cyberpunk 2077 clip.

On the vertical version of a clip, the loading screen after the game over gets its
own layout, the whole loading screen long (decided November 21, 2026): V turns
once, lower left, the whole time, and the loading bar runs top right. First half:
Level and Street Cred, the affinity card under them, LEVEL UP just above Skill
Progression, shown one by one and Skill Progression line by line; they leave the
same way, in reverse, by the midpoint. Second half: the eddies and carry weight,
then every item tile, one by one. The layout and timings are the template's
"vertical" section (cyberpunk2077-opening-template.json).

Everything is cut from the clip's own menus, at the moments the opening template
found them, so run opening_stats.py --check-only on the clip first: this reads its
report.json ("<clip> opening/report.json"). One full turn of V is found inside the
spinning model's stretch and slowed to fill the loading screen exactly.

The result is an 810x1440 clip at 60 fps (lossless FFV1, RGB), the size of the
skate crop's 9:16 window of a 3440x1440 frame: story_cut.py lays it into that
window over black for the loading screen, so the skate pass picks it up with the
crop at the template's window position. Two stills come with it, one from each half.

Needs ffmpeg and ffprobe on the PATH, and Python 3 with numpy, scipy and Pillow.
"""
import argparse
import json
import subprocess
import sys
from pathlib import Path

import numpy as np
from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent))
import opening_stats as o  # noqa: E402  (the template, the readers, the element cutters)


def ramp(t, a, b):
    """0 before a, 1 after b, smooth between."""
    if t <= a:
        return 0.0
    if t >= b:
        return 1.0
    x = (t - a) / (b - a)
    return x * x * (3 - 2 * x)


def scaled(a, scale):
    im = Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))
    if abs(scale - 1) > 1e-3:
        im = im.resize((max(1, round(im.width * scale)), max(1, round(im.height * scale))), Image.LANCZOS)
    return np.asarray(im).astype(np.float32)


def find_turn(src, span, period):
    """The two poses one full turn apart that match best, inside V's turn: (start, end)."""
    x0, y0, x1, y1 = o.V_CROP
    a, b = span
    r = subprocess.run(["ffmpeg", "-v", "error", "-nostdin", "-ss", f"{a:.3f}", "-t", f"{b - a:.3f}", "-i", src,
                        "-an", "-vf", f"fps=30,crop={x1 - x0}:{y1 - y0}:{x0}:{y0},scale=114:164",
                        "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], capture_output=True)
    fr = np.frombuffer(r.stdout, np.uint8).reshape(-1, 164, 114, 3).astype(np.float32)
    t = a + np.arange(len(fr)) / 30
    # Only where V is moving: the stretch can start or end with V standing still, and a
    # turn ending there would hold V still at the end of the loading screen.
    mot = np.abs(np.diff(fr, axis=0)).mean(axis=(1, 2, 3))
    moving = np.where(mot > max(0.35, 0.25 * np.percentile(mot, 90)))[0]
    lo, hi = (moving[0], moving[-1] + 1) if len(moving) else (0, len(t) - 1)
    best = None
    for i in range(lo, hi + 1):
        for j in range(i + 1, hi + 1):
            p = t[j] - t[i]
            if p < period[0]:
                continue
            if p > period[1]:
                break
            d = float(np.abs(fr[i] - fr[j]).mean())
            if best is None or d < best[0]:
                best = (d, float(t[i]), float(t[j]))
    if best is None:
        o.die(f"V's turn ({a:.1f} to {b:.1f} s) is shorter than one full turn ({period[0]:g} s)")
    return best[1], best[2], best[0]


def skill_lines(skills, cfg):
    """Skill Progression cut into its lines (the label, then each skill): [(image, y offset)]."""
    lum = skills.max(axis=2).max(axis=1)
    rows = np.where(lum > cfg["brightness"])[0]
    if not len(rows):
        return []
    bands, s, p = [], rows[0], rows[0]
    for y in rows[1:]:
        if y - p > cfg["gap"]:
            bands.append((s, p))
            s = y
        p = y
    bands.append((s, p))
    pad, h = cfg["pad"], skills.shape[0]
    return [(skills[max(0, a - pad):min(h, b + pad + 1)], max(0, a - pad)) for a, b in bands]


def inventory_tiles(inv, cfg):
    """The inventory grid cut into its tiles, row by row: [(image, wide?)]. The game lays the
    items on a fixed slot pitch; two neighbouring slots are one tile unless the gap between
    them goes dark."""
    lum = inv.max(axis=2)
    x0, pitch, slot = cfg["x0"], cfg["pitch"], cfg["slot"]
    tiles = []
    rows = (inv.shape[0] + 5) // o.INV_PITCH
    for r in range(rows):
        y0 = r * o.INV_PITCH + 5
        y1 = min(inv.shape[0], y0 + o.INV_ROW_H)
        band = lum[y0 + 10:y1 - 10]
        if band.size == 0:
            continue
        colmax = band.max(axis=0)
        n = (inv.shape[1] - x0) // pitch
        occupied = [colmax[x0 + k * pitch:x0 + k * pitch + slot].mean() > cfg["occupied"] for k in range(n)]
        k = 0
        while k < n:
            if not occupied[k]:
                k += 1
                continue
            k1 = k
            while k1 + 1 < n and occupied[k1 + 1]:
                edge = x0 + (k1 + 1) * pitch
                if (colmax[edge - 7:edge] < cfg["gap_dark"]).any():
                    break
                k1 += 1
            xa, xb = max(0, x0 + k * pitch - 4), min(inv.shape[1], x0 + k1 * pitch + slot + 2)
            tiles.append((inv[y0:y1, xa:xb], k1 > k))
            k = k1 + 1
    return tiles


def stream(cmd, w, h):
    p = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL)
    size = w * h * 3
    while True:
        b = p.stdout.read(size)
        if len(b) < size:
            break
        yield np.frombuffer(b, np.uint8).reshape(h, w, 3)
    p.wait()


def main():
    ap = argparse.ArgumentParser(description="Build the vertical (9:16) loading screen from a clip's own menus.")
    ap.add_argument("video", help="the clip with its menus in (the one opening_stats.py checked)")
    ap.add_argument("--report", help="opening_stats.py's report.json (default: '<clip> opening/report.json')")
    ap.add_argument("--loading", metavar="FROM-TO",
                    help="the loading screen to fill, in seconds (default: the first one after a game over, "
                         "from the report)")
    ap.add_argument("--bar-from", help="the clip to take the live loading bar from (default: the same clip); "
                                       "it must have the loading screen at the same time")
    ap.add_argument("--template", help="the template file (default: beside the video, else beside this script)")
    ap.add_argument("--out", help="the result (default: '<clip> vertical loading.mkv' beside the clip)")
    args = ap.parse_args()
    o.need("ffmpeg"), o.need("ffprobe")
    clip = Path(args.video)
    if not clip.is_file():
        o.die(f"can't find {clip}")
    tpath = o.find_template(args.video, args.template)
    o.load_template(tpath)
    if "vertical" not in o.T:
        o.die(f"the template {tpath} has no 'vertical' section")
    V = o.T["vertical"]
    rpath = Path(args.report) if args.report else clip.with_name(f"{clip.stem} opening") / "report.json"
    if not rpath.exists():
        o.die(f"no opening report at {rpath}. Run opening_stats.py --check-only on the clip first.")
    rep = json.loads(rpath.read_text(encoding="utf-8"))
    frames, check = rep.get("frames", {}), rep.get("check", {})
    span = check.get("SPINNING MODEL")
    if not span:
        o.die("the report has no spinning model, so there's no turn to use")
    if args.loading:
        a, _, b = args.loading.partition("-")
        L0, L1 = float(a), float(b)
    elif check.get("LOADING BLANK"):
        L0, L1 = check["LOADING BLANK"]
    else:
        o.die("the report has no loading screen after a game over; give --loading FROM-TO")
    src, bar_src = str(clip), args.bar_from or str(clip)
    CW, CH = V["canvas"]
    FPS = V["fps"]
    T = L1 - L0
    N = round(T * FPS)
    tm = V["timing"]

    # The pieces, cut and keyed as the wide template does.
    elements, notes = {}, []
    if frames.get("skills") is not None:
        elements["skills"] = o.keyed(o.grab(src, frames["skills"]), o.SKILLS_CROP, 1.0, *o.KEYS["skills"])
    inv_frame = o.grab(src, frames["inventory"]) if frames.get("inventory") is not None else None
    hub = o.grab(src, frames["hub"]) if frames.get("hub") is not None else None
    stats = o.grab(src, frames["stats"]) if frames.get("stats") is not None else hub
    if stats is not None:
        for n, b in o.stat_boxes(stats).items():
            if n != "level up":
                elements[n] = o.keyed(stats, b, 1.0, *o.KEYS[n])
    if hub is not None:
        elements["affinity"] = o.keyed(hub, o.AFFINITY_CROP, 1.0, *o.KEYS["affinity"])
        lu = o.stat_boxes(hub).get("level up")
        if lu:
            elements["level up"] = o.keyed(hub, lu, 1.0, *o.KEYS["level up"])
    else:
        notes.append("no hub screen, so no affinity card or LEVEL UP")
    tiles = []
    if inv_frame is not None:
        rows = max(1, o.inventory_rows(inv_frame))
        box = (o.INV_X[0], o.INV_ROW0, o.INV_X[1], o.INV_ROW0 + rows * o.INV_PITCH + 5)
        tiles = inventory_tiles(o.keyed(o.erase_cursor(inv_frame), box, 1.0, *o.KEYS["inventory"]),
                                V["inventory_grid"])

    # Where they go: (name, image, x, y), in the order they come in.
    first = []
    for e in V["first"]:
        name = e["element"]
        if name not in elements:
            notes.append(f"no {name} found; left out")
            continue
        x, y = e["pos"]
        if e.get("by_line"):
            for k, (im, dy) in enumerate(skill_lines(elements[name], V["skills_lines"])):
                first.append((f"{name} line {k}", scaled(im, e["scale"]), x, y + round(dy * e["scale"])))
        else:
            first.append((name, scaled(elements[name], e["scale"]), x, y))
    second = []
    for e in V["second"]:
        name = e["element"]
        if name != "items":
            if name in elements:
                x, y = e["pos"]
                second.append((name, scaled(elements[name], e["scale"]), x, y))
            else:
                notes.append(f"no {name} found; left out")
            continue
        wide = [scaled(im, e["scale"]) for im, w in tiles if w]
        small = [scaled(im, e["scale"]) for im, w in tiles if not w]
        placed = []
        for k, im in enumerate(wide[:len(e["wide"])]):
            placed.append(("wide", im, *e["wide"][k]))
            if small and k < len(e["beside_wide"]):
                placed.append(("item", small.pop(0), *e["beside_wide"][k]))
        if len(wide) > len(e["wide"]):
            notes.append(f"{len(wide) - len(e['wide'])} wide item(s) beyond the layout's {len(e['wide'])}; left out")
        cx, cy, pitch = e["column_x"], e["column_y"], e["column_pitch"]
        for k, im in enumerate(small):
            y = cy + (k // len(cx)) * pitch
            if y + im.shape[0] > e["column_bottom"]:
                notes.append(f"{len(small) - k} item(s) didn't fit the column; left out")
                break
            placed.append(("item", im, cx[k % len(cx)], y))
        second += [(f"{kind} {i + 1}", im, x, y) for i, (kind, im, x, y) in enumerate(placed)]

    t0, t1, miss = find_turn(src, span, V["turn"]["period"])
    k_slow = T / (t1 - t0)
    vs = V["turn"]["scale"]
    VW, VH = round((o.V_CROP[2] - o.V_CROP[0]) * vs), round((o.V_CROP[3] - o.V_CROP[1]) * vs)
    VX, VY = V["turn"]["pos"]
    bs = V["bar"]["scale"]
    BW, BH = round((o.COUNTER[2] - o.COUNTER[0]) * bs), round((o.COUNTER[3] - o.COUNTER[1]) * bs)
    BX, BY = V["bar"]["pos"]
    bl = o.T["layout"]["v"]["black_level"]
    smooth = (f"minterpolate=fps={FPS}:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1,"
              if V["turn"].get("interpolate", True) else f"fps={FPS},")
    vcmd = ["ffmpeg", "-v", "error", "-nostdin", "-ss", f"{t0:.3f}", "-t", f"{t1 - t0:.3f}", "-i", src, "-an", "-vf",
            f"crop={o.V_CROP[2] - o.V_CROP[0]}:{o.V_CROP[3] - o.V_CROP[1]}:{o.V_CROP[0]}:{o.V_CROP[1]},"
            f"scale={VW}:{VH}:flags=lanczos,colorlevels=rimin={bl}:gimin={bl}:bimin={bl},"
            f"setpts=PTS*{k_slow:.6f},{smooth}tpad=stop_mode=clone:stop_duration=1",
            "-frames:v", str(N), "-f", "rawvideo", "-pix_fmt", "rgb24", "-"]
    bcmd = ["ffmpeg", "-v", "error", "-nostdin", "-ss", f"{L0:.6f}", "-t", f"{T:.6f}", "-i", bar_src, "-an", "-vf",
            f"crop={o.COUNTER[2] - o.COUNTER[0]}:{o.COUNTER[3] - o.COUNTER[1]}:{o.COUNTER[0]}:{o.COUNTER[1]},"
            f"scale={BW}:{BH}:flags=lanczos,fps={FPS},tpad=stop_mode=clone:stop_duration=1",
            "-frames:v", str(N), "-f", "rawvideo", "-pix_fmt", "rgb24", "-"]
    out = Path(args.out) if args.out else clip.with_name(f"{clip.stem} vertical loading.mkv")
    enc = subprocess.Popen(["ffmpeg", "-v", "error", "-nostdin", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24",
                            "-s", f"{CW}x{CH}", "-r", str(FPS), "-i", "-", "-c:v", "ffv1", "-pix_fmt", "bgr0",
                            str(out)], stdin=subprocess.PIPE)

    def put(c, img, x, y, a):
        if a <= 0:
            return
        h, w = img.shape[:2]
        cx0, cy0, cx1, cy1 = max(0, x), max(0, y), min(CW, x + w), min(CH, y + h)
        if cx1 > cx0 and cy1 > cy0:
            np.maximum(c[cy0:cy1, cx0:cx1], img[cy0 - y:cy1 - y, cx0 - x:cx1 - x] * a, out=c[cy0:cy1, cx0:cx1])

    half = T / 2
    stills = {round(min(T - 0.5, tm["in_start"] + tm["in_step"] * len(first) + 0.6) * FPS): "first half",
              round(min(T - 0.4, half + tm["second_start"] + tm["second_step"] * len(second) + 0.3) * FPS): "second half"}
    n = 0
    print(f"building {N} frames: V's turn {t0:.2f} to {t1:.2f} s slowed {k_slow:.2f}x, "
          f"{len(first)} pieces in the first half, {len(second)} in the second")
    for vf, bf in zip(stream(vcmd, VW, VH), stream(bcmd, BW, BH)):
        t = n / FPS
        g = ramp(t, 0, V["fade_in"]) * (1 - ramp(t, T - V["fade_out"], T))
        c = np.zeros((CH, CW, 3), np.float32)
        put(c, vf.astype(np.float32), VX, VY, g)
        put(c, bf.astype(np.float32), BX, BY, g)
        for k, (_, im, x, y) in enumerate(first):
            on = tm["in_start"] + tm["in_step"] * k
            off = half - tm["out_end"] - tm["out_step"] * k
            put(c, im, x, y, g * ramp(t, on, on + tm["in_fade"]) * (1 - ramp(t, off, off + tm["out_fade"])))
        for k, (_, im, x, y) in enumerate(second):
            on = half + tm["second_start"] + tm["second_step"] * k
            put(c, im, x, y, g * ramp(t, on, on + tm["second_fade"]))
        frame = np.clip(c, 0, 255).astype(np.uint8)
        if n in stills:
            Image.fromarray(frame).save(out.with_name(f"{out.stem}, {stills[n]}.png"))
        enc.stdin.write(frame.tobytes())
        n += 1
    enc.stdin.close()
    enc.wait()
    if n != N:
        notes.append(f"{n} frames written, {N} expected")
    info = {"clip": str(clip), "loading": [L0, L1], "frames": n, "window": V["window"], "canvas": [CW, CH],
            "turn": [round(t0, 3), round(t1, 3)], "turn_mismatch": round(miss, 2), "slowed": round(k_slow, 3),
            "first": [nm for nm, *_ in first], "second": [nm for nm, *_ in second], "notes": notes}
    out.with_suffix(".json").write_text(json.dumps(info, indent=1), encoding="utf-8")
    print(f"Written: {out.name} ({CW}x{CH}, {n} frames, {T:.2f} s), with a still of each half.")
    for s in notes:
        print(f"Note: {s}")


if __name__ == "__main__":
    main()
