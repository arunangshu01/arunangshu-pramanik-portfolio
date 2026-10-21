# Generates public/og-image.png (1200x630 social link preview). Requires Pillow and
# Orbitron + JetBrains Mono TTFs in $OG_FONTS_DIR (default /tmp/ogfonts) from Google Fonts.
import math
import os

from PIL import Image, ImageDraw, ImageFilter, ImageFont

W, H = 1200, 630
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "public")
FONTS = os.environ.get("OG_FONTS_DIR", "/tmp/ogfonts")
GOLD, AMBER, RED, INK = (245, 184, 61), (252, 211, 77), (224, 52, 43), (10, 8, 5)


def font(path, size, weight=None):
    f = ImageFont.truetype(path, size)
    if weight:
        f.set_variation_by_axes([weight])
    return f


orb = lambda s, w: font(f"{FONTS}/Orbitron.ttf", s, w)
mono = lambda s: font(f"{FONTS}/JetBrainsMono.ttf", s)

img = Image.new("RGB", (W, H), INK)

# glows
glow = Image.new("RGB", (W, H), (0, 0, 0))
g = ImageDraw.Draw(glow)
g.ellipse((780, 40, 1180, 440), fill=(120, 80, 20))
g.ellipse((-150, 380, 350, 800), fill=(110, 25, 18))
img = Image.blend(img, glow.filter(ImageFilter.GaussianBlur(120)), 0.55)

d = ImageDraw.Draw(img, "RGBA")
for x in range(0, W, 48):
    d.line([(x, 0), (x, H)], fill=(*GOLD, 12))
for y in range(0, H, 48):
    d.line([(0, y), (W, y)], fill=(*GOLD, 12))

# HUD corner brackets
for (x, y, dx, dy) in [(28, 28, 1, 1), (W - 28, 28, -1, 1), (28, H - 28, 1, -1), (W - 28, H - 28, -1, -1)]:
    d.line([(x, y), (x + 40 * dx, y)], fill=(*GOLD, 150), width=2)
    d.line([(x, y), (x, y + 40 * dy)], fill=(*GOLD, 150), width=2)

# portrait in reactor rings
S, cx, cy = 330, 945, 315
photo = Image.open(f"{ROOT}/profile.jpg").convert("RGB").crop((64, 100, 704, 740)).resize((S, S), Image.LANCZOS)
mask = Image.new("L", (S, S), 0)
ImageDraw.Draw(mask).ellipse((0, 0, S, S), fill=255)
img.paste(photo, (cx - S // 2, cy - S // 2), mask)
d = ImageDraw.Draw(img, "RGBA")
r = S // 2
d.ellipse((cx - r - 4, cy - r - 4, cx + r + 4, cy + r + 4), outline=(*GOLD, 220), width=4)
d.arc((cx - r - 20, cy - r - 20, cx + r + 20, cy + r + 20), 200, 340, fill=(*GOLD, 170), width=6)
d.arc((cx - r - 20, cy - r - 20, cx + r + 20, cy + r + 20), 20, 120, fill=(*RED, 170), width=6)
for a in range(0, 360, 10):

    rad = math.radians(a)
    r1, r2 = r + 34, r + (44 if a % 30 == 0 else 39)
    d.line([(cx + r1 * math.cos(rad), cy + r1 * math.sin(rad)), (cx + r2 * math.cos(rad), cy + r2 * math.sin(rad))], fill=(*GOLD, 110), width=2)

# text
x0 = 80
d.text((x0, 112), "[ SYSTEM ONLINE ]  ·  J.A.R.V.I.S.", font=mono(20), fill=(*GOLD, 230))
d.text((x0, 160), "ARUNANGSHU", font=orb(78, 900), fill=AMBER)
d.text((x0, 252), "PRAMANIK", font=orb(78, 900), fill=(240, 110, 60))
d.text((x0, 362), "SENIOR SOFTWARE ENGINEER", font=orb(28, 700), fill=(240, 236, 228))
d.text((x0, 408), "Data & Cloud Architecture · Azure · GCP · 7+ yrs", font=mono(20), fill=(190, 182, 168))
d.line([(x0, 470), (x0 + 560, 470)], fill=(*GOLD, 90), width=1)
d.text((x0, 488), "UNIT // AP.MK-VII   |   STATUS: DEPLOYED", font=mono(16), fill=(*GOLD, 160))

img.save(f"{ROOT}/og-image.png", optimize=True)
print("ok")
