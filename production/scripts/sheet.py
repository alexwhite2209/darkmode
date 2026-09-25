"""Contact sheet of QA screenshots.  python sheet.py <dir> <out.png> [cols] [thumb_w] [glob]"""
import sys, glob, os
from PIL import Image, ImageDraw, ImageFont

d, out = sys.argv[1], sys.argv[2]
cols = int(sys.argv[3]) if len(sys.argv) > 3 else 4
tw = int(sys.argv[4]) if len(sys.argv) > 4 else 480
pat = sys.argv[5] if len(sys.argv) > 5 else "*.png"
files = sorted(f for f in glob.glob(os.path.join(d, pat)) if not os.path.basename(f).startswith("sheet"))
ims = []
for f in files:
    im = Image.open(f).convert("RGB")
    th = im.resize((tw, round(im.height * tw / im.width)), Image.LANCZOS)
    ims.append((os.path.basename(f)[:-4], th))
h = max(i[1].height for i in ims)
rows = (len(ims) + cols - 1) // cols
sheet = Image.new("RGB", (cols * (tw + 6) + 6, rows * (h + 22) + 6), (34, 34, 38))
dr = ImageDraw.Draw(sheet)
try:
    font = ImageFont.truetype("arial.ttf", 13)
except Exception:
    font = None
for k, (name, th) in enumerate(ims):
    x = 6 + (k % cols) * (tw + 6)
    y = 6 + (k // cols) * (h + 22)
    sheet.paste(th, (x, y + 18))
    dr.text((x, y + 2), name, fill=(255, 205, 140), font=font)
sheet.save(out)
print(out, sheet.size, len(ims))
