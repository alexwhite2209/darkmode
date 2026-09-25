"""Cut the hero films into frame sequences for the scroll player (src/animations/frame-scrub.ts).

    python production/scripts/make_frames.py

public/frames/desktop/0000.webp … (1600x900) and public/frames/mobile/0000.webp … (720x1280),
every frame of the 24 fps film. Prints the counts for src/data/site.ts.
The finale (way back out of the O) reuses the first frames of the same sequence.
"""
import os, shutil
import cv2
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
TAKES = os.path.join(ROOT, "production", "higgsfield", "takes")
JOBS = [
    ("desktop", os.path.join(TAKES, "take03_1080p_desktop_black05.mp4"), (1600, 900), 72),
    ("mobile", os.path.join(TAKES, "take02_1080p_mobile_black05.mp4"), (720, 1280), 68),
]
STEP = 1  # every frame: 24 per second

for name, src, size, q in JOBS:
    dst = os.path.join(ROOT, "public", "frames", name)
    shutil.rmtree(dst, ignore_errors=True)
    os.makedirs(dst)
    cap = cv2.VideoCapture(src)
    i = n = total = 0
    while True:
        ok, f = cap.read()
        if not ok:
            break
        if i % STEP == 0:
            im = Image.fromarray(cv2.cvtColor(f, cv2.COLOR_BGR2RGB)).resize(size, Image.LANCZOS)
            p = os.path.join(dst, f"{n:04d}.webp")
            im.save(p, "WEBP", quality=q, method=5)
            total += os.path.getsize(p)
            n += 1
        i += 1
    print(f"{name}: {n} frames, {total / 1e6:.1f} MB, avg {total / n / 1e3:.0f} KB")
