"""
Renders the library background illustration used in the hero section.

The image is an original, procedurally drawn illustration (no third-party
artwork): a two-tier wooden library with a gallery rail, an arched window,
amber pendant lamps and a rolling ladder. It is generated once and committed
to client/public/images/, so the website never loads a remote background.

Usage (optional, only needed to regenerate the image):
    python3 scripts/assets/generate-library-background.py
Requires: Python 3, Pillow (with WebP support) and numpy.
"""
import random
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[2]
OUT_DIR = ROOT / "client" / "public" / "images"

W, H = 2400, 1350  # rendered large, then downscaled for smooth edges
rng = random.Random(1859)

SPINES = [
    (92, 30, 28), (118, 42, 34), (40, 62, 46), (30, 50, 40), (34, 46, 72),
    (26, 36, 58), (120, 84, 44), (150, 108, 58), (88, 56, 30), (70, 40, 66),
    (52, 36, 26), (176, 150, 108), (64, 70, 74), (110, 70, 36), (140, 60, 40),
]
GOLD = (196, 160, 92)


def vertical_gradient(draw, box, top, bottom):
    x0, y0, x1, y1 = box
    h = max(1, y1 - y0)
    for i in range(h):
        t = i / h
        c = tuple(int(top[k] + (bottom[k] - top[k]) * t) for k in range(3))
        draw.line([(x0, y0 + i), (x1, y0 + i)], fill=c)


def wood_panel(draw, box, base=(58, 38, 24), grain=True):
    x0, y0, x1, y1 = box
    vertical_gradient(draw, box, tuple(int(c * 1.15) for c in base), tuple(int(c * 0.7) for c in base))
    if grain:
        for _ in range(int((x1 - x0) * (y1 - y0) / 900)):
            gx = rng.randint(x0, max(x0, x1 - 1))
            gy = rng.randint(y0, max(y0, y1 - 1))
            length = rng.randint(10, 40)
            shade = rng.randint(-14, 10)
            c = tuple(max(0, min(255, base[k] + shade)) for k in range(3))
            draw.line([(gx, gy), (gx, min(y1, gy + length))], fill=c)


def draw_book_row(draw, x0, x1, base_y, max_h):
    """Fills one shelf with book spines standing on base_y."""
    x = x0 + rng.randint(0, 6)
    while x < x1 - 10:
        if rng.random() < 0.05:  # occasional gap or small stack
            x += rng.randint(12, 30)
            continue
        w = rng.randint(13, 30)
        if x + w > x1:
            break
        h = int(max_h * rng.uniform(0.68, 0.96))
        color = rng.choice(SPINES)
        top = base_y - h
        # cylindrical shading across the spine
        for i in range(w):
            t = i / max(1, w - 1)
            shade = 0.62 + 0.5 * (1 - abs(t - 0.38) * 1.9)
            c = tuple(max(0, min(255, int(color[k] * shade))) for k in range(3))
            draw.line([(x + i, top), (x + i, base_y)], fill=c)
        # gilt bands and a title block on some spines
        if rng.random() < 0.7:
            for band in (0.1, 0.86):
                by = top + int(h * band)
                draw.line([(x + 2, by), (x + w - 3, by)], fill=GOLD, width=2)
        if rng.random() < 0.45:
            ty = top + int(h * rng.uniform(0.25, 0.4))
            draw.rectangle([x + 3, ty, x + w - 4, ty + rng.randint(10, 22)], fill=tuple(int(c * 0.55) for c in color))
        x += w + rng.choice((0, 0, 1, 2))


def bookcase(draw, box, shelves):
    x0, y0, x1, y1 = box
    wood_panel(draw, box, base=(34, 22, 14), grain=False)  # dark back panel
    shelf_h = (y1 - y0) / shelves
    for s in range(shelves):
        sy0 = int(y0 + s * shelf_h)
        sy1 = int(y0 + (s + 1) * shelf_h)
        draw_book_row(draw, x0 + 8, x1 - 8, sy1 - 12, sy1 - sy0 - 26)
        # shelf board with highlight edge
        draw.rectangle([x0, sy1 - 12, x1, sy1], fill=(78, 52, 32))
        draw.line([(x0, sy1 - 12), (x1, sy1 - 12)], fill=(120, 86, 54), width=2)
        draw.line([(x0, sy1), (x1, sy1)], fill=(24, 15, 9), width=3)


def pilaster(draw, x, y0, y1, w=46):
    wood_panel(draw, (x, y0, x + w, y1), base=(72, 48, 30))
    draw.line([(x + 6, y0), (x + 6, y1)], fill=(110, 78, 48), width=2)
    draw.line([(x + w - 6, y0), (x + w - 6, y1)], fill=(36, 23, 14), width=3)


def main():
    img = Image.new("RGB", (W, H), (20, 14, 10))
    d = ImageDraw.Draw(img)

    gallery_y = int(H * 0.47)   # top of the gallery rail
    floor_y = int(H * 0.9)

    # ── Upper tier ────────────────────────────────────────────────
    win_w, win_x = 360, W // 2 - 180
    upper_top = int(H * 0.05)
    bays = [(70, 520), (566, win_x - 46), (win_x + win_w + 46, W - 566), (W - 520, W - 70)]
    for bx0, bx1 in bays:
        bookcase(d, (bx0, upper_top, bx1, gallery_y), shelves=4)
    for px in (24, 520, win_x - 46, win_x + win_w, W - 566, W - 70):
        pilaster(d, px, 0, gallery_y)

    # Arched window with warm daylight
    wy0, wy1 = upper_top + 40, gallery_y - 20
    glow = Image.new("RGB", (win_w, wy1 - wy0))
    gd = ImageDraw.Draw(glow)
    vertical_gradient(gd, (0, 0, win_w, wy1 - wy0), (255, 226, 168), (214, 150, 80))
    mask = Image.new("L", glow.size, 0)
    md = ImageDraw.Draw(mask)
    md.rectangle([0, win_w // 2, win_w, glow.size[1]], fill=255)
    md.ellipse([0, 0, win_w, win_w], fill=255)
    img.paste(glow, (win_x, wy0), mask)
    for i in range(1, 4):  # mullions
        mx = win_x + i * win_w // 4
        d.line([(mx, wy0 + 30), (mx, wy1)], fill=(60, 40, 26), width=8)
    for j in range(1, 5):
        my = wy0 + win_w // 2 + j * (wy1 - wy0 - win_w // 2) // 5
        d.line([(win_x, my), (win_x + win_w, my)], fill=(60, 40, 26), width=6)
    d.arc([win_x - 14, wy0 - 14, win_x + win_w + 14, wy0 + win_w + 14], 180, 360, fill=(88, 60, 38), width=22)

    # Crown molding
    d.rectangle([0, 0, W, upper_top], fill=(52, 34, 21))
    d.line([(0, upper_top), (W, upper_top)], fill=(130, 94, 58), width=4)

    # ── Gallery rail with balusters ───────────────────────────────
    wood_panel(d, (0, gallery_y, W, gallery_y + 40), base=(86, 58, 36))
    d.line([(0, gallery_y), (W, gallery_y)], fill=(150, 110, 68), width=3)
    for bx in range(10, W, 34):
        d.rectangle([bx, gallery_y + 40, bx + 10, gallery_y + 100], fill=(70, 46, 28))
        d.line([(bx + 2, gallery_y + 40), (bx + 2, gallery_y + 100)], fill=(112, 80, 50), width=2)
    wood_panel(d, (0, gallery_y + 100, W, gallery_y + 128), base=(80, 54, 33))

    # ── Lower tier ────────────────────────────────────────────────
    lower_top = gallery_y + 128
    lower_bays = [(40, 470), (516, 1130), (1176, 1790), (1836, W - 40)]
    for bx0, bx1 in lower_bays:
        bookcase(d, (bx0, lower_top, bx1, floor_y), shelves=3)
    for px in (0, 470, 1130, 1790, W - 46):
        pilaster(d, px, lower_top, floor_y)

    # Rolling ladder
    lx = 1880
    for rail_x in (lx, lx + 120):
        d.line([(rail_x, gallery_y + 30), (rail_x - 150, floor_y + 40)], fill=(96, 66, 40), width=12)
    for k in range(1, 9):
        t = k / 9
        ry = int(gallery_y + 30 + t * (floor_y + 10 - gallery_y - 30))
        rx = int(lx - 150 * t)
        d.line([(rx, ry), (rx + 120, ry)], fill=(110, 76, 46), width=8)

    # Floor
    vertical_gradient(d, (0, floor_y, W, H), (58, 38, 24), (22, 14, 9))
    for fx in range(0, W, 140):
        d.line([(fx, floor_y), (fx - 60, H)], fill=(40, 26, 16), width=2)

    # ── Lighting (numpy): amber pools from lamps + window, vignette ──
    arr = np.asarray(img).astype(np.float32) / 255.0
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)

    def pool(cx, cy, radius, strength, color=(1.0, 0.72, 0.38)):
        dist = np.sqrt((xx - cx) ** 2 + (yy - cy) ** 2) / radius
        falloff = np.clip(1.0 - dist, 0, 1) ** 2 * strength
        return falloff[..., None] * np.array(color, dtype=np.float32)

    light = np.zeros_like(arr)
    light += pool(W / 2, H * 0.28, 900, 0.55, (1.0, 0.8, 0.5))      # window
    lamps = [(420, H * 0.62), (1050, H * 0.6), (1540, H * 0.62), (2080, H * 0.6)]
    for cx, cy in lamps:
        light += pool(cx, cy, 520, 0.6)

    ambient = 0.42
    arr = arr * (ambient + light * 1.25) + light * 0.08

    # vignette
    v = np.sqrt(((xx - W / 2) / (W * 0.62)) ** 2 + ((yy - H * 0.45) / (H * 0.75)) ** 2)
    arr *= np.clip(1.15 - v * 0.75, 0.25, 1.0)[..., None]
    arr = np.clip(arr, 0, 1)
    img = Image.fromarray((arr * 255).astype(np.uint8))

    # Pendant lamps drawn on top so they glow
    d = ImageDraw.Draw(img)
    for cx, cy in lamps:
        d.line([(cx, 0), (cx, cy - 34)], fill=(30, 20, 12), width=4)
        d.pieslice([cx - 58, cy - 60, cx + 58, cy + 10], 180, 360, fill=(54, 40, 22))
        d.ellipse([cx - 22, cy - 18, cx + 22, cy + 16], fill=(255, 214, 140))
    glow_layer = Image.new("RGB", (W, H), (0, 0, 0))
    gl = ImageDraw.Draw(glow_layer)
    for cx, cy in lamps:
        gl.ellipse([cx - 70, cy - 60, cx + 70, cy + 70], fill=(255, 170, 70))
    glow_layer = glow_layer.filter(ImageFilter.GaussianBlur(60))
    img = Image.fromarray(np.clip(np.asarray(img).astype(np.int16) + (np.asarray(glow_layer) * 0.55).astype(np.int16), 0, 255).astype(np.uint8))

    # Soft focus + fine grain so it reads as an atmospheric backdrop
    img = img.filter(ImageFilter.GaussianBlur(1.6))
    grain = np.random.default_rng(7).normal(0, 4.0, (H, W, 1))
    img = Image.fromarray(np.clip(np.asarray(img).astype(np.float32) + grain, 0, 255).astype(np.uint8))

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    desktop = img.resize((1920, 1080), Image.LANCZOS)
    desktop.save(OUT_DIR / "library-bg.webp", "WEBP", quality=74, method=6)

    # Portrait crop for phones (centred on the window)
    crop_w = int(H * 0.68)
    left = W // 2 - crop_w // 2
    mobile = img.crop((left, 0, left + crop_w, H)).resize((828, int(828 * H / crop_w)), Image.LANCZOS)
    mobile.save(OUT_DIR / "library-bg-mobile.webp", "WEBP", quality=72, method=6)

    for name in ("library-bg.webp", "library-bg-mobile.webp"):
        print(f"wrote {OUT_DIR / name} ({(OUT_DIR / name).stat().st_size // 1024} KB)")


if __name__ == "__main__":
    main()
