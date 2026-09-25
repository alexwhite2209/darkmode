"""Extract still frames of each world from the final films into public/images/worlds (+ og.jpg).

    python production/scripts/extract_stills.py

Sources: the Higgsfield takes with the black after the O shortened to ~0.5 s (8 frames cut at 3.0 s),
so times below are in that timeline, 24 fps).
"""
import os
import cv2
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
TAKES = os.path.join(ROOT, "production", "higgsfield", "takes")
SRC = os.path.join(TAKES, "take03_1080p_desktop_black05.mp4")
SRC_M = os.path.join(TAKES, "take02_1080p_mobile_black05.mp4")
DST = os.path.join(ROOT, "public", "images", "worlds")
os.makedirs(DST, exist_ok=True)

# name -> seconds in the cut film
WORLDS = {
    "hero": 0.0, "portal": 2.5, "fantasy": 4.3, "dino": 7.0, "drift": 9.9, "wheel": 13.0,
    "watch": 14.6, "watch-macro": 15.1, "city": 17.9, "facade": 19.6, "office": 21.5,
    "lounge": 24.2, "final": 29.6,
}


def frames(path):
    cap = cv2.VideoCapture(path)
    fps = cap.get(cv2.CAP_PROP_FPS)
    n = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    out = {}
    for name, t in WORLDS.items():
        cap.set(cv2.CAP_PROP_POS_FRAMES, min(n - 1, round(t * fps)))
        ok, f = cap.read()
        if ok:
            out[name] = Image.fromarray(cv2.cvtColor(f, cv2.COLOR_BGR2RGB))
    return out


desk = frames(SRC)
mob = frames(SRC_M) if os.path.exists(SRC_M) else {}
for name, im in desk.items():
    # the 16:9 take wrote made-up lettering on the watch dial; the 9:16 dial is clean, crop it to 16:9
    if name.startswith("watch") and name in mob:
        m = mob[name]
        ch = int(m.width * 9 / 16)
        top = (m.height - ch) // 2
        im = m.crop((0, top, m.width, top + ch))
    im.resize((1280, 720), Image.LANCZOS).save(os.path.join(DST, f"{name}.webp"), "WEBP", quality=80, method=6)
    im.resize((640, 360), Image.LANCZOS).save(os.path.join(DST, f"{name}-sm.webp"), "WEBP", quality=78, method=6)
    if name in mob:
        mob[name].resize((720, 1280), Image.LANCZOS).save(os.path.join(DST, f"{name}-portrait.webp"), "WEBP", quality=78, method=6)
    print("ok", name)

hero = desk["hero"]
w, h = hero.size
crop_h = int(w / (1200 / 630))
top = max(0, (h - crop_h) // 2 - 20)
hero.crop((0, top, w, top + crop_h)).resize((1200, 630), Image.LANCZOS).save(os.path.join(ROOT, "public", "images", "og.jpg"), "JPEG", quality=86)
print("og ok")
