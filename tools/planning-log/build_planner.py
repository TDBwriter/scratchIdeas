"""Pre-Heist Planning Log — full build (light, print-and-write, in-game journal styling)."""
import math
import os
import sys
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.fonts import addMapping
from reportlab.platypus import Paragraph
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from planner_data import ORDERED  # noqa: E402

F = os.path.join(HERE, "fonts")
pdfmetrics.registerFont(TTFont("RJ", os.path.join(F, "Rajdhani-Medium.ttf")))
pdfmetrics.registerFont(TTFont("RJS", os.path.join(F, "Rajdhani-SemiBold.ttf")))
pdfmetrics.registerFont(TTFont("RJB", os.path.join(F, "Rajdhani-Bold.ttf")))
addMapping("RJ", 0, 0, "RJ"); addMapping("RJ", 1, 0, "RJB"); addMapping("RJ", 0, 1, "RJ"); addMapping("RJ", 1, 1, "RJB")

W, H = letter
M = 0.5 * inch
TOP = H - 0.6 * inch
BOTTOM = 0.75 * inch
PAPER = colors.white
INK = colors.HexColor("#16181d")
PANEL = colors.HexColor("#f6f6f3")
LINE = colors.HexColor("#c4c7cc")
BOX = colors.HexColor("#b9bdc4")
MUTED = colors.HexColor("#5f646d")
RED = colors.HexColor("#d23b35")
TEAL = colors.HexColor("#0b8a96")
YELLOW = colors.HexColor("#fcee0a")
GRAY = colors.HexColor("#4a4f57")
ORANGE = colors.HexColor("#c96a00")
BLUE = colors.HexColor("#2f6fe0")
MAGENTA = colors.HexColor("#c8175a")

THEMES = {
    "MAIN JOB": dict(primary=YELLOW, label=RED, text=INK, on=INK, style="banner", marker="diamond"),
    "LIFEPATH": dict(primary=YELLOW, label=RED, text=INK, on=INK, style="banner", marker="diamond"),
    "SIDE JOB": dict(primary=TEAL, label=TEAL, text=TEAL, on=PAPER, style="outline", marker="hex"),
    "GIG": dict(primary=ORANGE, label=ORANGE, text=ORANGE, on=PAPER, style="outline", marker="hex"),
    "CYBERPSYCHO": dict(primary=MAGENTA, label=MAGENTA, text=MAGENTA, on=PAPER, style="outline", marker="hex"),
    "NCPD": dict(primary=BLUE, label=BLUE, text=BLUE, on=PAPER, style="outline", marker="hex"),
    "EVENT": dict(primary=GRAY, label=GRAY, text=GRAY, on=PAPER, style="outline", marker="circle"),
}
TYPE_LABEL = {"EVENT": "NOTABLE EVENT", "CYBERPSYCHO": "CYBERPSYCHO SIGHTING", "NCPD": "NCPD SCANNER"}
NEUTRAL = dict(primary=RED, label=RED, text=RED, on=PAPER, style="outline", marker="hex")


def style(size=10, color=INK, font="RJ", leading=None):
    return ParagraphStyle("s", fontName=font, fontSize=size, leading=leading or size * 1.2, textColor=color)


BODY = style(10.6)
SMALL = style(8, MUTED)


def esc(t):
    return t.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


# ------------------------------------------------------------------ drawing helpers
def chamfer(c, x, y, w, h, cut=8, fill=None, stroke=None, lw=0.8, cuts=("tr", "bl")):
    p = c.beginPath()
    tl = "tl" in cuts; tr = "tr" in cuts; br = "br" in cuts; bl = "bl" in cuts
    p.moveTo(x + (cut if bl else 0), y)
    p.lineTo(x + w - (cut if br else 0), y)
    if br: p.lineTo(x + w, y + cut)
    p.lineTo(x + w, y + h - (cut if tr else 0))
    if tr: p.lineTo(x + w - cut, y + h)
    p.lineTo(x + (cut if tl else 0), y + h)
    if tl: p.lineTo(x, y + h - cut)
    p.lineTo(x, y + (cut if bl else 0))
    if bl: p.lineTo(x + cut, y)
    p.close()
    if fill is not None: c.setFillColor(fill)
    if stroke is not None:
        c.setStrokeColor(stroke); c.setLineWidth(lw)
    c.drawPath(p, fill=1 if fill is not None else 0, stroke=1 if stroke is not None else 0)


def marker(c, kind, cx, cy, r, color, filled=False):
    c.setStrokeColor(color); c.setFillColor(color); c.setLineWidth(1.3)
    if kind == "diamond":
        p = c.beginPath()
        p.moveTo(cx, cy + r); p.lineTo(cx + r, cy); p.lineTo(cx, cy - r); p.lineTo(cx - r, cy); p.close()
        c.drawPath(p, fill=1, stroke=1)
    elif kind == "circle":
        c.circle(cx, cy, r * 0.85, stroke=1, fill=1 if filled else 0)
    else:
        p = c.beginPath()
        for i in range(6):
            a = math.radians(60 * i + 30)
            (p.moveTo if i == 0 else p.lineTo)(cx + r * math.cos(a), cy + r * math.sin(a))
        p.close()
        c.drawPath(p, fill=1 if filled else 0, stroke=1)


def tickbox(c, x, y, size=10, color=INK):
    c.setStrokeColor(color); c.setLineWidth(0.9); c.setFillColor(PAPER)
    c.rect(x, y, size, size, stroke=1, fill=1)


def writebox(c, x, y, w, h):
    """Blank writing area (y = bottom)."""
    c.setStrokeColor(BOX); c.setLineWidth(0.6); c.setFillColor(PAPER)
    c.rect(x, y, w, h, stroke=1, fill=1)


def fit_font(c, text, font, size, maxw, minsize=12):
    while size > minsize and c.stringWidth(text, font, size) > maxw:
        size -= 0.5
    return size


# ------------------------------------------------------------------ document
class Doc:
    def __init__(self, path):
        self.c = canvas.Canvas(path, pagesize=letter)
        self.c.setTitle("Pre-Heist Planning Log")
        self.c.setAuthor("Cyberpunk 2077 narrative playthrough plan")
        self.page = 0
        self.starts = {}
        self.theme = NEUTRAL
        self.left = self.right = ""
        self.y = TOP
        self.sources = None

    def new_page(self, theme=None, left="", right=""):
        if self.page:
            self._finish_page()
            self.c.showPage()
        self.page += 1
        c = self.c
        t = theme or NEUTRAL
        self.theme, self.left, self.right = t, left, right
        c.setStrokeColor(LINE); c.setLineWidth(0.8)
        c.line(M, H - 0.42 * inch, W - M, H - 0.42 * inch)
        c.setFillColor(t["primary"]); c.rect(M, H - 0.42 * inch - 1.5, 46, 4, stroke=0, fill=1)
        c.setFont("RJB", 9); c.setFillColor(t["text"])
        c.drawString(M, H - 0.34 * inch, left)
        c.setFillColor(MUTED); c.setFont("RJS", 9)
        c.drawRightString(W - M, H - 0.34 * inch, right)
        c.setStrokeColor(LINE); c.setLineWidth(0.6)
        c.line(M, 0.5 * inch, W - M, 0.5 * inch)
        c.setFont("RJB", 8.5); c.setFillColor(t["text"])
        c.drawRightString(W - M, 0.34 * inch, f"PG {self.page:02d}")
        self.y = TOP

    def _finish_page(self):
        if self.sources:
            p = Paragraph("SOURCES // " + esc(self.sources), SMALL)
            _, h = p.wrap(W - 2 * M - 0.7 * inch, 0.3 * inch)
            p.drawOn(self.c, M, 0.46 * inch - h)
            self.sources = None

    def avail(self):
        return self.y - BOTTOM

    def cont_page(self, tag="(CONTINUED)"):
        base = self.right.split("  (")[0]
        self.new_page(self.theme, self.left, f"{base}  {tag}")

    def save(self):
        self._finish_page()
        self.c.save()


SECTION_H = 26
FILL_MIN = 1.1 * inch


def fill_rest(d):
    """Turn leftover space at the bottom of a page into a labelled writing box."""
    avail = d.avail()
    if avail < FILL_MIN:
        return
    c, t = d.c, d.theme
    y = BOTTOM + 2
    h = d.y - 6 - y
    chamfer(c, M, y, W - 2 * M, h, cut=10, fill=PAPER, stroke=BOX, lw=0.8)
    label = "SKETCHES & EXTRA NOTES"
    lw_ = c.stringWidth(label, "RJB", 8.5) + 14
    chamfer(c, M, y + h - 14, lw_, 14, cut=5, fill=PANEL, stroke=BOX, lw=0.6, cuts=("br",))
    c.setFillColor(MUTED); c.setFont("RJB", 8.5)
    c.drawString(M + 7, y + h - 10, label)
    d.y = BOTTOM


def draw_section_header(d, title, sub=None):
    c, t = d.c, d.theme
    y = d.y - 14
    c.setFillColor(t["primary"]); c.rect(M, y - 1, 4, 11, stroke=0, fill=1)
    c.setFillColor(t["label"]); c.setFont("RJB", 11.5)
    c.drawString(M + 10, y, title)
    if sub:
        tw = c.stringWidth(title, "RJB", 11.5)
        c.setFillColor(MUTED); c.setFont("RJ", 8.5)
        c.drawString(M + 18 + tw, y, sub)
    c.setStrokeColor(LINE); c.setLineWidth(0.6)
    c.line(M, y - 5, W - M, y - 5)
    d.y = y - 12


def place_section(d, title, sub, rows, gap=0):
    """rows: list of (height, draw_fn(y_top)). Keeps a section whole when it can fit on a page;
    otherwise splits only between rows and repeats the header."""
    total = SECTION_H + sum(h for h, _ in rows) + gap * len(rows)
    full = TOP - BOTTOM
    if total > d.avail():
        if total <= full or d.avail() < SECTION_H + rows[0][0] + 0.5 * full:
            fill_rest(d)
            d.cont_page()
    draw_section_header(d, title, sub)
    for h, fn in rows:
        if h + gap > d.avail():
            fill_rest(d)
            d.cont_page()
            draw_section_header(d, title + " (CONTINUED)", None)
        fn(d.y)
        d.y -= h + gap
    d.y -= 4


# ------------------------------------------------------------------ entry parts
def title_block(d, e):
    c, t = d.c, d.theme
    y, h, x, w = d.y, 0.95 * inch, M, W - 2 * M
    if t["style"] == "banner":
        chamfer(c, x, y - h, w, h, cut=14, fill=t["primary"])
        chamfer(c, x + w - 120, y - h, 120, 9, cut=6, fill=RED, cuts=("tl",))
        marker(c, t["marker"], x + 22, y - 32, 9, INK)
        num_col, title_col, sub_col = INK, INK, colors.HexColor("#4a4500")
    else:
        chamfer(c, x, y - h, w, h, cut=14, fill=PAPER, stroke=t["primary"], lw=1.6)
        c.setFillColor(t["primary"]); c.rect(x, y - h + 10, 4, h - 24, stroke=0, fill=1)
        marker(c, t["marker"], x + 22, y - 32, 9, t["primary"])
        num_col, title_col, sub_col = t["text"], t["text"], MUTED
    kind = TYPE_LABEL.get(e["type"], e["type"])
    line = f"{kind}  //  " + (f"{e['subtitle']}  //  " if e.get("subtitle") else "") + f"ENTRY {e['num']:02d}"
    c.setFillColor(num_col); c.setFont("RJB", 11)
    c.drawString(x + 40, y - 20, line)
    ttl = e["title"].upper()
    fs = fit_font(c, ttl, "RJB", 28, w - 60, 16)
    c.setFillColor(title_col); c.setFont("RJB", fs)
    c.drawString(x + 40, y - 46, ttl)
    loc = "LOCATION // " + e["area"].upper()
    fs2 = fit_font(c, loc, "RJS", 10.5, w - 60, 8)
    c.setFillColor(sub_col); c.setFont("RJS", fs2)
    c.drawString(x + 40, y - 62, loc)
    if not e["area"]:
        lx = x + 40 + c.stringWidth("LOCATION // ", "RJS", fs2)
        c.setStrokeColor(sub_col); c.setLineWidth(0.6)
        c.line(lx, y - 64, lx + 2.8 * inch, y - 64)
    d.y = y - h - 8


def crew_dots(c, x, y, crew):
    for k in ("V", "Jackie", "T-Bug"):
        v = crew.get(k)
        if v is not None:
            c.setStrokeColor(INK if v else MUTED); c.setLineWidth(0.9)
            c.setFillColor(YELLOW if v else PAPER)
            c.circle(x + 4, y + 3.5, 3.8, stroke=1, fill=1)
        c.setFillColor(INK if v else MUTED); c.setFont("RJS", 9.5)
        c.drawString(x + 11, y, k)
        x += 11 + c.stringWidth(k, "RJS", 9.5) + 12


def meta_strip(d, e):
    c, t = d.c, d.theme
    cells = [("REQUIRES", e["requires"]), ("UNLOCKS", e["unlocks"]), ("WINDOW", e["window"])]
    gap = 6
    cw = (W - 2 * M - 3 * gap) / 4
    paras = [Paragraph(esc(v), style(9.4)) for _, v in cells]
    hs = [p.wrap(cw - 14, 300)[1] for p in paras]
    note = Paragraph(esc(e["crew_note"]), style(8.2, MUTED))
    nh = note.wrap(cw - 14, 300)[1] if e["crew_note"] else 0
    h = max(max(hs), 16 + nh, 34) + 26
    for i, ((k, v), p) in enumerate(zip(cells, paras)):
        x = M + i * (cw + gap)
        chamfer(c, x, d.y - h, cw, h, cut=7, fill=PANEL, stroke=LINE)
        c.setFillColor(t["label"]); c.setFont("RJB", 8.5)
        c.drawString(x + 7, d.y - 13, k)
        if v:
            p.drawOn(c, x + 7, d.y - 18 - p.height)
    x = M + 3 * (cw + gap)
    chamfer(c, x, d.y - h, cw, h, cut=7, fill=PANEL, stroke=LINE)
    c.setFillColor(t["label"]); c.setFont("RJB", 8.5)
    c.drawString(x + 7, d.y - 13, "IN THE GAME")
    crew_dots(c, x + 7, d.y - 30, e["crew"])
    if e["crew_note"]:
        note.drawOn(c, x + 7, d.y - 36 - nh)
    d.y -= h + 8


def summary(d, e):
    if not e["summary"]:
        return
    p = Paragraph(esc(e["summary"]), style(11.4, INK, "RJS", 14))
    _, h = p.wrap(W - 2 * M - 16, 300)
    c = d.c
    c.setFillColor(d.theme["primary"]); c.rect(M, d.y - h - 2, 3, h + 2, stroke=0, fill=1)
    p.drawOn(c, M + 10, d.y - h)
    d.y -= h + 8


BEAT_MIN = 50
TEXT_W = 3.3 * inch


def beats(d, e):
    t = d.theme
    items = e["beats"] or [""] * 5
    fx = M + 0.42 * inch + TEXT_W + 0.42 * inch
    fw = W - M - fx
    rows = []
    for i, b in enumerate(items, 1):
        p = Paragraph(esc(b), BODY) if b else None
        ph = p.wrap(TEXT_W, 400)[1] if p else 0
        rh = max(ph + 14, BEAT_MIN)

        def draw(ytop, i=i, p=p, ph=ph, rh=rh):
            c = d.c
            if t["style"] == "banner":
                chamfer(c, M, ytop - rh + 5, 0.32 * inch, rh - 10, cut=5, fill=t["primary"], cuts=("tr",))
                c.setFillColor(INK)
            else:
                chamfer(c, M, ytop - rh + 5, 0.32 * inch, rh - 10, cut=5, fill=PAPER, stroke=t["primary"], lw=1.1, cuts=("tr",))
                c.setFillColor(t["text"])
            c.setFont("RJB", 11)
            c.drawCentredString(M + 0.16 * inch, ytop - rh / 2 - 3.5, f"{i:02d}")
            if p:
                p.drawOn(c, M + 0.42 * inch, ytop - 7 - ph)
            else:
                writebox(c, M + 0.42 * inch, ytop - rh + 5, TEXT_W, rh - 10)
            cbx = M + 0.42 * inch + TEXT_W + 0.1 * inch
            tickbox(c, cbx, ytop - rh / 2 - 6)
            c.setFillColor(MUTED); c.setFont("RJB", 6.5)
            c.drawString(cbx - 1, ytop - rh / 2 + 7, "SHOT")
            writebox(c, fx, ytop - rh + 5, fw, rh - 10)
        rows.append((rh, draw))
    place_section(d, "BEATS // PHOTO PLAN", "story beats in order · tick SHOT, note the frame", rows)


def methods(d, e):
    t = d.theme
    if e["type"] == "EVENT" and not e["methods"]:
        return
    nw, tw = 1.05 * inch, 2.75 * inch
    fx = M + nw + tw + 0.15 * inch
    fw = W - M - fx - 6
    rows = []
    if not e["methods"]:
        for _ in range(3):
            def draw(ytop):
                writebox(d.c, M, ytop - 56 + 4, W - 2 * M, 56 - 8)
            rows.append((56, draw))
    for name, desc in e["methods"]:
        p = Paragraph(esc(desc), style(10))
        ph = p.wrap(tw, 400)[1]
        rh = max(ph + 16, 60)

        def draw(ytop, name=name, p=p, ph=ph, rh=rh):
            c = d.c
            chamfer(c, M, ytop - rh + 3, W - 2 * M, rh - 4, cut=6, fill=PANEL, stroke=LINE)
            c.setFillColor(t["label"])
            fs = fit_font(c, name.upper(), "RJB", 10.5, nw - 14, 7)
            c.setFont("RJB", fs)
            c.drawString(M + 9, ytop - 16, name.upper())
            p.drawOn(c, M + nw, ytop - 9 - ph)
            writebox(c, fx, ytop - rh + 8, fw, rh - 14)
        rows.append((rh, draw))
    place_section(d, "COMPLETION METHODS", "what the game allows · your notes per approach", rows, gap=2)


def slots(d, e):
    t = d.theme
    lw = 2.4 * inch
    rows = []
    for i in range(1, e["slots"] + 1):
        rh = 54

        def draw(ytop, i=i, rh=rh):
            c = d.c
            chamfer(c, M, ytop - rh + 5, 0.32 * inch, rh - 10, cut=5, fill=PAPER, stroke=t["primary"], lw=1.1, cuts=("tr",))
            c.setFillColor(t["text"]); c.setFont("RJB", 11)
            c.drawCentredString(M + 0.16 * inch, ytop - rh / 2 - 3.5, f"{i:02d}")
            x0 = M + 0.42 * inch
            c.setFillColor(MUTED); c.setFont("RJB", 6.5)
            c.drawString(x0 + 2, ytop - 11, "WHERE")
            writebox(c, x0, ytop - rh + 5, lw, rh - 18)
            cbx = x0 + lw + 0.1 * inch
            tickbox(c, cbx, ytop - rh / 2 - 6)
            c.setFillColor(MUTED); c.setFont("RJB", 6.5)
            c.drawString(cbx - 1, ytop - rh / 2 + 7, "SHOT")
            nx = cbx + 0.32 * inch
            c.drawString(nx + 2, ytop - 11, "NOTES")
            writebox(c, nx, ytop - rh + 5, W - M - nx, rh - 18)
        rows.append((rh, draw))
    place_section(d, "SITES", "one row per site · where it is, what happened", rows)


def intel(d, e):
    t = d.theme
    gap = 8
    cw = (W - 2 * M - gap) / 2
    keys = [("LOCATION", e["Location"]), ("MISSABLES", e["Missables"]),
            ("EASTER EGGS", e["Easter eggs"]), ("POINTS OF INTEREST", e["Points of interest"])]
    rows = []
    for pair in (keys[:2], keys[2:]):
        paras = [Paragraph("<br/>".join("•&nbsp;" + esc(b) for b in items), style(10)) if items else None for _, items in pair]
        hs = [p.wrap(cw - 16, 400)[1] if p else 0 for p in paras]
        h = max(max(hs) + 24 + 28, 78)

        def draw(ytop, pair=pair, paras=paras, h=h):
            c = d.c
            for j, ((k, items), p) in enumerate(zip(pair, paras)):
                x = M + j * (cw + gap)
                warn = k == "MISSABLES"
                chamfer(c, x, ytop - h, cw, h, cut=8, fill=PAPER, stroke=RED if warn else LINE, lw=1.1 if warn else 0.8)
                c.setFillColor(RED if warn else t["label"]); c.setFont("RJB", 9.5)
                c.drawString(x + 8, ytop - 13, ("! " if warn else "") + k)
                if p:
                    p.drawOn(c, x + 8, ytop - 19 - p.height)
        rows.append((h, draw))
    place_section(d, "INTEL", "location · missables · easter eggs · points of interest", rows, gap=6)


NOTES_MIN = 5.6 * inch


def notes_block(d, e):
    t = d.theme
    if d.avail() < NOTES_MIN + SECTION_H:
        fill_rest(d)
        d.cont_page("(NOTES)")
    draw_section_header(d, "PLANNING NOTES")
    c = d.c
    prod_h = 0.32 * inch
    avail = d.y - BOTTOM - prod_h
    gap = 8
    nh = avail * 0.46
    ch = avail - nh - gap
    w = W - 2 * M

    def box(label, x, y, bw, bh):
        chamfer(c, x, y, bw, bh, cut=10, fill=PAPER, stroke=INK if t["style"] == "banner" else t["primary"], lw=1)
        lw_ = c.stringWidth(label, "RJB", 9.5) + 16
        chamfer(c, x, y + bh - 15, lw_, 15, cut=5, fill=t["primary"], cuts=("br",))
        c.setFillColor(t["on"]); c.setFont("RJB", 9.5)
        c.drawString(x + 8, y + bh - 11, label)

    box("OVERALL", M, d.y - nh, w, nh)
    bw = (w - 2 * gap) / 3
    for i, who in enumerate(("V", "JACKIE", "T-BUG")):
        box(who, M + i * (bw + gap), BOTTOM + prod_h, bw, ch)
    x, y = M, BOTTOM + 0.06 * inch
    c.setFillColor(MUTED); c.setFont("RJB", 8.5)
    c.drawString(x, y + 2, "PRODUCTION //")
    x += c.stringWidth("PRODUCTION //", "RJB", 8.5) + 10
    for it in ["PLAYED", "REC: V-MEDIA", "REC: V-JACKIE", "PHOTO MODE", "NARRATION"]:
        tickbox(c, x, y)
        c.setFillColor(INK); c.setFont("RJS", 9)
        c.drawString(x + 14, y + 2, it)
        x += 14 + c.stringWidth(it, "RJS", 9) + 16
    d.y = BOTTOM


def entry(d, e):
    t = THEMES[e["type"]]
    d.new_page(t, f"JOURNAL // {e['part']}", f"ACT 1 · ENTRY {e['num']:02d}")
    d.starts[e["num"]] = d.page
    key = f"e{e['num']}"
    d.c.bookmarkPage(key)
    if getattr(d, "last_part", None) != e["part"]:
        d.last_part = e["part"]
        d.c.addOutlineEntry(e["part"].title(), key, level=0)
    d.c.addOutlineEntry(f"{e['num']:02d}  {e['title']}", key, level=1)
    title_block(d, e)
    meta_strip(d, e)
    summary(d, e)
    if e["slots"]:
        slots(d, e)
    else:
        beats(d, e)
        methods(d, e)
    intel(d, e)
    notes_block(d, e)
    d.sources = e["sources"]


# ------------------------------------------------------------------ front matter
def cover(d, counts):
    d.new_page(None, "PRE-HEIST PLANNING LOG", "ACT 1 · LIFEPATH TO THE HEIST")
    c = d.c
    c.bookmarkPage("cover"); c.addOutlineEntry("Cover", "cover", level=0)
    y = H - 1.5 * inch
    chamfer(c, M, y - 1.2 * inch, 5.6 * inch, 1.55 * inch, cut=18, fill=YELLOW)
    chamfer(c, M + 5.6 * inch - 150, y - 1.2 * inch, 150, 10, cut=7, fill=RED, cuts=("tl",))
    c.setFillColor(INK); c.setFont("RJB", 48)
    c.drawString(M + 18, y - 0.18 * inch, "PRE-HEIST")
    c.drawString(M + 18, y - 0.82 * inch, "PLANNING LOG")
    c.setFillColor(RED); c.setFont("RJB", 14)
    c.drawString(M, y - 1.5 * inch, "CYBERPUNK 2077 // ACT 1 // LIFEPATH TO THE HEIST")
    c.setFillColor(MUTED); c.setFont("RJ", 11)
    c.drawString(M, y - 1.72 * inch, "An ordered planning list. Not a walkthrough. Print it and write on it.")

    y0 = y - 2.15 * inch
    c.setFillColor(RED); c.setFont("RJB", 13)
    c.drawString(M, y0, "ENTRY STYLES")
    y0 -= 10
    samples = [("MAIN JOB", "Yellow banner, diamond marker. Lifepath intros use the same style."),
               ("SIDE JOB", "Teal outline, hex marker."),
               ("GIG", "Orange outline. Regina Jones's Watson gigs."),
               ("CYBERPSYCHO", "Magenta outline. Regina's cyberpsycho sightings."),
               ("NCPD", "Blue outline. Reported crimes, organized crime, assaults in progress."),
               ("EVENT", "Gray outline, circle marker. Notable events and places.")]
    for name, desc in samples:
        t = THEMES[name]
        y0 -= 30
        lab = TYPE_LABEL.get(name, name)
        if t["style"] == "banner":
            chamfer(c, M, y0, 2.2 * inch, 24, cut=7, fill=t["primary"])
            marker(c, "diamond", M + 13, y0 + 12, 5, INK)
            c.setFillColor(INK)
        else:
            chamfer(c, M, y0, 2.2 * inch, 24, cut=7, fill=PAPER, stroke=t["primary"], lw=1.3)
            marker(c, t["marker"], M + 13, y0 + 12, 5.5, t["primary"])
            c.setFillColor(t["text"])
        c.setFont("RJB", 11.5)
        c.drawString(M + 26, y0 + 7.5, lab)
        c.setFillColor(INK); c.setFont("RJ", 10.5)
        c.drawString(M + 2.35 * inch, y0 + 7.5, desc)

    y0 -= 32
    c.setFillColor(RED); c.setFont("RJB", 13)
    c.drawString(M, y0, "EACH ENTRY")
    rows = [("HEADER", "Type, entry number, title, location."),
            ("REQUIRES / UNLOCKS / WINDOW", "What opens it, what it opens, time limits."),
            ("IN THE GAME", "Filled dot = in the game's version; hollow = add in the edit."),
            ("BEATS // PHOTO PLAN", "Story beats in order, each with a SHOT box and space for the frame."),
            ("COMPLETION METHODS", "Each approach the game allows, with space for notes."),
            ("INTEL", "Location, missables (red), easter eggs, points of interest."),
            ("PLANNING NOTES", "Overall, then V, Jackie, T-Bug. Production boxes along the bottom."),
            ("BLANK SPACE", "Not known yet. Write it in as you find it.")]
    y0 -= 4
    for k, v in rows:
        y0 -= 16.5
        c.setFillColor(INK); c.setFont("RJB", 10)
        c.drawString(M, y0, k)
        c.setFillColor(MUTED); c.setFont("RJ", 10.5)
        c.drawString(M + 2.3 * inch, y0, v)
    y0 -= 30
    c.setFillColor(RED); c.setFont("RJB", 13)
    c.drawString(M, y0, "IN THIS LOG")
    y0 -= 18
    c.setFillColor(INK); c.setFont("RJS", 11)
    c.drawString(M, y0, "  ·  ".join(f"{n} {k}" for k, n in counts))


def order_pages(d, entries, starts):
    d.new_page(None, "JOURNAL // ORDER OF PLAY", "")
    c = d.c
    c.bookmarkPage("order"); c.addOutlineEntry("Order of play", "order", level=0)
    c.setFillColor(INK); c.setFont("RJB", 24)
    c.drawString(M, d.y - 22, "ORDER OF PLAY")
    c.setFillColor(MUTED); c.setFont("RJ", 10)
    c.drawString(M, d.y - 38, "Follows what the game unlocks. Within Regina's gigs: Street Cred 1, then Street Cred 4, then by district, then the late ones.")
    d.y -= 52
    cols = [("", 0.0), ("#", 0.24), ("ENTRY", 0.55), ("TYPE", 3.05), ("AREA", 4.15), ("PG", 7.12)]

    def heads():
        c.setFillColor(RED); c.setFont("RJB", 9)
        for h_, xo in cols:
            c.drawString(M + xo * inch, d.y - 10, h_)
        c.setStrokeColor(RED); c.setLineWidth(0.8); c.line(M, d.y - 15, W - M, d.y - 15)
        d.y -= 20

    heads()
    part = None
    for i, e in enumerate(entries):
        need = 22 + (26 if e["part"] != part else 0)
        if need > d.avail():
            d.new_page(None, "JOURNAL // ORDER OF PLAY", "(CONTINUED)")
            heads()
        if e["part"] != part:
            part = e["part"]
            c.setFillColor(INK); c.setFont("RJB", 11)
            c.drawString(M, d.y - 16, part)
            d.y -= 24
        t = THEMES[e["type"]]
        rh = 21
        y = d.y - rh
        chamfer(c, M, y + 2, W - 2 * M, rh - 3, cut=5, fill=PANEL if i % 2 == 0 else PAPER)
        c.setFillColor(t["primary"]); c.rect(M, y + 2, 4, rh - 3, stroke=0, fill=1)
        tickbox(c, M + 9, y + 6.5)
        c.setFillColor(t["text"]); c.setFont("RJB", 10.5)
        c.drawString(M + 0.24 * inch + 6, y + 7.5, f"{e['num']:02d}")
        title = e["title"] + (f"  ({e['subtitle'].title()})" if e.get("subtitle") and e["type"] in ("MAIN JOB", "SIDE JOB") else "")
        c.setFillColor(INK)
        fs = fit_font(c, title, "RJS", 10.5, 2.4 * inch, 8)
        c.setFont("RJS", fs); c.drawString(M + 0.55 * inch, y + 7.5, title)
        typ = {"CYBERPSYCHO": "CYBERPSYCHO"}.get(e["type"], TYPE_LABEL.get(e["type"], e["type"]))
        if e["type"] in ("GIG", "NCPD") and e.get("subtitle"):
            typ = e["subtitle"]
        c.setFillColor(t["text"])
        fs = fit_font(c, typ, "RJB", 8.5, 1.05 * inch, 6.5)
        c.setFont("RJB", fs); c.drawString(M + 3.05 * inch, y + 7.5, typ)
        c.setFillColor(INK)
        fs = fit_font(c, e["area"], "RJ", 9.5, 2.9 * inch, 7)
        c.setFont("RJ", fs); c.drawString(M + 4.15 * inch, y + 7.5, e["area"])
        pg = starts.get(e["num"])
        c.setFillColor(t["text"]); c.setFont("RJB", 10)
        if pg:
            c.drawString(M + 7.12 * inch, y + 7.5, f"{pg:02d}")
            c.linkAbsolute("", f"e{e['num']}", Rect=(M, y + 2, W - M, y + rh - 1))
        d.y = y


def build(path):
    counts = []
    labels = [("prologue entries", lambda e: e["part"] == "PROLOGUE"),
              ("Watson jobs & events", lambda e: e["part"] == "WATSON: FREE ROAM"),
              ("gigs", lambda e: e["type"] == "GIG"),
              ("cyberpsychos", lambda e: e["type"] == "CYBERPSYCHO"),
              ("NCPD", lambda e: e["type"] == "NCPD"),
              ("big-job mains", lambda e: e["part"] == "THE BIG JOB")]
    for k, f in labels:
        counts.append((k, sum(1 for e in ORDERED if f(e))))
    starts = {}
    for _ in range(2):
        d = Doc(path)
        cover(d, counts)
        order_pages(d, ORDERED, starts)
        for e in ORDERED:
            entry(d, e)
        starts = dict(d.starts)
        d.save()
    return d.page


if __name__ == "__main__":
    print("pages:", build(sys.argv[1]))
