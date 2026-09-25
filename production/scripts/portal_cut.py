"""
Portal cut: the dinosaur world is already visible inside the black disk of the O, and the black
stretch between the O and the valley is removed.

    python portal_cut.py <in.mp4> <out.mp4> [--debug dir]

How it works
- mean brightness finds tc (the O disk has filled the frame, black begins) and tv (the valley is fully lit)
- for every frame before tc, the black disk of the O is found as the dark connected region around the
  O centre (the corona ring closes it), and the lit valley frame tv is shown through it
- output = [0, tc) composited + [tv, end); the film becomes (tv - tc) seconds shorter
"""
import sys, os, subprocess
import numpy as np
import cv2

src, dst = sys.argv[1], sys.argv[2]
debug = sys.argv[sys.argv.index("--debug") + 1] if "--debug" in sys.argv else None
if debug:
    os.makedirs(debug, exist_ok=True)

cap = cv2.VideoCapture(src)
fps = cap.get(cv2.CAP_PROP_FPS)
frames = []
while True:
    ok, f = cap.read()
    if not ok:
        break
    frames.append(f)
n = len(frames)
h, w = frames[0].shape[:2]
luma = np.array([cv2.cvtColor(f, cv2.COLOR_BGR2GRAY).mean() for f in frames])

# tc: first frame after 1.5 s that is almost black; tv: first frame after tc that reaches the valley plateau
i0 = int(1.5 * fps)
black = luma[i0 : int(6 * fps)].min()
tc = next(i for i in range(i0, n) if luma[i] < black + 4)
plateau = np.median(luma[tc + int(1.2 * fps) : tc + int(2.2 * fps)])
tv = next(i for i in range(tc, n) if luma[i] >= black + 0.93 * (plateau - black))
# --cut N forces the removed length in frames (so the 16:9 and 9:16 films keep the same timeline)
if "--cut" in sys.argv:
    tv = tc + int(sys.argv[sys.argv.index("--cut") + 1])
print(f"fps {fps:.2f} frames {n} tc {tc} ({tc / fps:.2f}s) tv {tv} ({tv / fps:.2f}s) cut {(tv - tc) / fps:.2f}s")

valley = frames[tv]

# seed: centre of the biggest enclosed dark blob a few frames before tc (the O fills most of the view)
def dark_mask(f, thr):
    g = cv2.GaussianBlur(cv2.cvtColor(f, cv2.COLOR_BGR2GRAY), (5, 5), 0)
    return (g < thr).astype(np.uint8)

ref = frames[tc - 3]
m = dark_mask(ref, 28)
num, lab, stats, cents = cv2.connectedComponentsWithStats(m, 8)
best = max(range(1, num), key=lambda k: stats[k, cv2.CC_STAT_AREA])
seed = tuple(int(v) for v in cents[best])
print("seed", seed)

def disk(f):
    m = dark_mask(f, 28)
    num, lab, stats, _ = cv2.connectedComponentsWithStats(m, 8)
    k = lab[seed[1], seed[0]]
    if k == 0:
        return None
    x, y, bw, bh, area = stats[k]
    # the disk must be enclosed (not leaking into a dark sky) until it is really big
    touches = x == 0 or y == 0 or x + bw >= w or y + bh >= h
    if touches and area < 0.5 * w * h:
        return None
    reg = (lab == k).astype(np.uint8) * 255
    # fill holes (reflections inside the disk)
    cnts, _ = cv2.findContours(reg, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    reg = np.zeros_like(reg)
    cv2.drawContours(reg, cnts, -1, 255, -1)
    return reg

out = []
last_ok = None
for i in range(tc):
    f = frames[i]
    reg = disk(f)
    if reg is None:
        out.append(f)
        continue
    # grow slightly under the inner edge of the corona, then feather
    reg = cv2.dilate(reg, np.ones((5, 5), np.uint8))
    a = cv2.GaussianBlur(reg, (0, 0), max(1.5, w / 900)).astype(np.float32)[..., None] / 255.0
    comp = (valley.astype(np.float32) * a + f.astype(np.float32) * (1 - a)).astype(np.uint8)
    out.append(comp)
    last_ok = i
    if debug and i % 6 == 0:
        cv2.imwrite(os.path.join(debug, f"c_{i:04d}.jpg"), comp)
print("composited up to frame", last_ok)
out.extend(frames[tv:])

p = subprocess.Popen(
    ["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "bgr24", "-s", f"{w}x{h}", "-r", str(fps), "-i", "-",
     "-c:v", "libx264", "-crf", "14", "-preset", "slow", "-pix_fmt", "yuv420p", "-an", dst],
    stdin=subprocess.PIPE,
)
for f in out:
    p.stdin.write(f.tobytes())
p.stdin.close()
p.wait()
print("written", dst, len(out), "frames", f"{len(out) / fps:.2f}s")
