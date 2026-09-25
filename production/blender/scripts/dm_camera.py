# ONE continuous camera move, 30 s @ 24 fps (720 frames). Baked per frame onto RIG_cam (+ lens/shift/clip).
# Worlds join only through fully covered frames (black O, black throat -> dark smoke, wheel cap, watch dial),
# so the move reads as a single take.
exec(open("E:\\Сайт\\dark-mode\\production\\blender\\scripts\\dm_common.py", encoding="utf-8").read())
exec(open("E:\\Сайт\\dark-mode\\production\\blender\\scripts\\dm_carpath.py", encoding="utf-8").read())
exec(open("E:\\Сайт\\dark-mode\\production\\blender\\scripts\\dm_camrig.py", encoding="utf-8").read())

sc = scene()
rig = bpy.data.objects["RIG_cam"]
cd = bpy.data.objects["CAM_desktop"]
cm = bpy.data.objects["CAM_mobile"]
V = Vector

def anchor_local(name, world, t):
    sc.frame_set(int(round(fr(t))))
    return bpy.data.objects[name].matrix_world.translation - OFF[world]

# ================================================================ W1 hero -> into the O   (0 .. S1)
O1 = V((0, 0, 6.24))
W1 = dict(
    pos=Track([(0.0, V((0, -88, 0.35))), (0.8, V((0, -86.6, 0.42))), (1.5, V((0, -74, 1.6))),
               (2.0, V((0, -52, 3.9))), (2.45, V((0, -24, 5.9))), (S1, V((0, -1.5, 6.24)))], v1=V((0, 60, 0))),
    tgt=Track([(0.0, O1), (1.8, O1), (S1, V((0, 40, 6.24)))]),
    lens=Track([(0.0, 35.0), (S1, 35.0)]),
    roll=Track([(0.0, 0.0), (S1, 0.0)]),
)

# ================================================================ W2 portal -> fantasy -> dinosaur mouth   (S1 .. S2)
M = anchor_local("ANC_W2_mouth", "W2", 8.0)
TI = anchor_local("ANC_W2_throat_in", "W2", 8.0)
DP = anchor_local("ANC_W2_throat_deep", "W2", 8.0)
d = (TI - M).normalized()
A0 = M - d * 45 + V((0, 0, 6))
W2 = dict(
    pos=Track([(S1, V((0, -1.5, 120))), (3.3, V((0, 45, 120))), (3.8, V((0, 98, 118))),
               (4.6, V((-8, 140, 104))), (5.4, V((-5, 180, 88))), (6.2, V((3, 215, 72))),
               (6.9, A0), (7.6, M - d * 21.4 + V((0, 0, 2))), (8.24, M), (8.82, TI), (S2, DP)],
              v0=V((0, 60, 0)), v1=(DP - TI) / (S2 - 8.82)),
    tgt=Track([(S1, V((0, 60, 120))), (3.4, V((0, 160, 116))), (3.8, V((0, 240, 80))), (4.6, V((-4, 300, 55))),
               (5.4, V((0, 330, 45))), (6.2, TI), (8.24, TI), (8.82, DP + d * 10), (S2, DP + d * 20)]),
    lens=Track([(S1, 24.0), (3.8, 24.0), (4.8, 28.0), (6.5, 30.0), (8.1, 30.0), (8.6, 28.0), (S2, 28.0)]),
    roll=Track([(S1, 0.0), (3.8, 0.0), (4.6, -6.0), (5.4, 4.0), (6.2, 0.0), (S2, 0.0)]),
)

# ================================================================ W3 out of the smoke, mid-drift -> wheel cap   (S2 .. S3)
def fwd(a):
    return V((math.cos(a), math.sin(a), 0))
def side_cam(t):
    st = car_state(t); p = st["pos"]
    out = p - ARC_C; out.z = 0; out.normalize()
    return p + out * 9.5 - fwd(st["heading"]) * 3.5 + V((0, 0, 2.6)), p + V((0, 0, 0.6))
Mstop = car_matrix(T_STOP)
WC = Mstop @ V((-1.35, -0.88, 0.35))                 # rear-right wheel centre
N = (Mstop.to_3x3() @ V((0, -1, 0))).normalized()   # wheel axis, pointing out of the car
CAP = WC + N * 0.181
CAM0 = side_cam(S2)[0] - fwd(car_state(S2)["heading"]) * 6.0
T3 = []
times = [S2 + 0.1 * k for k in range(int(round((S3 - S2) / 0.1)) + 1)]
for t in times:
    if t < S2 + 0.6:
        b = smooth01((t - S2) / 0.6)
        p2, g2 = side_cam(t)
        lag = CAM0 + (p2 - side_cam(S2)[0])            # travel with the car while catching up
        p, g = lag.lerp(p2, b), g2
    elif t < T_SLIDE:
        p, g = side_cam(t)
    elif t < T_STOP:
        b = smooth01((t - T_SLIDE) / (T_STOP - T_SLIDE))
        p2, g2 = side_cam(t)
        p, g = p2.lerp(CAP + N * 4.2 + V((0, 0, 0.55)), b), g2.lerp(CAP, b)
    else:
        u = smoother01((t - T_STOP) / (S3 - T_STOP))
        dist = 0.075 + (4.2 - 0.075) * (1 - u)
        p = CAP + N * dist + V((0, 0, 0.55)) * (1 - smooth01((t - T_STOP) / 0.9))
        g = CAP - N * 1.0
    T3.append((round(t, 3), p, g))
st0 = car_state(S2)
W3 = dict(
    pos=Track([(a, b) for a, b, _ in T3], v0=fwd(st0["heading"]) * st0["v"], v1=-N * 0.05),
    tgt=Track([(a, c) for a, _, c in T3]),
    lens=Track([(S2, 30.0), (S2 + 0.5, 35.0), (T_STOP, 35.0), (S3, 40.0)]),
    roll=Track([(S2, 0.0), (S2 + 0.6, -4.0), (10.8, 3.0), (T_SLIDE, 0.0), (S3, 0.0)]),
)

# ================================================================ W4 portal plane -> watch -> dial   (S3 .. S4)
WW = V((0, 3.2, 1.2))
D = anchor_local("ANC_W4_dive", "W4", 15.0)
W4 = dict(
    pos=Track([(S3, V((0, -0.075, 1.2))), (14.35, V((0.05, 0.9, 1.22))), (14.9, V((0.8, 1.85, 1.3))),
               (15.5, V((1.5, 3.0, 1.25))), (16.1, V((0.95, 2.3, 1.95))), (16.75, V((D.x, 2.45, D.z))),
               (S4, V((D.x, D.y - 0.05, D.z)))], v0=V((0, 1.3, 0)), v1=V((0, 0.35, 0))),
    tgt=Track([(S3, V((0, 5, 1.2))), (14.6, WW), (15.5, V((0.58, 3.2, 1.2))), (16.1, WW),
               (16.75, D + V((0, 1, 0))), (S4, D + V((0, 1, 0)))]),
    lens=Track([(S3, 40.0), (14.6, 50.0), (S4, 50.0)]),
    roll=Track([(S3, 0.0), (14.9, -5.0), (15.5, 0.0), (16.1, 6.0), (16.75, 0.0), (S4, 0.0)]),
)

# ================================================================ W5 glass -> city -> window -> office -> lounge -> sign   (S4 .. 30)
Z = 89.3                     # eye height on the office floor (FL 87.6 + 1.7)
ZR = 91.4                    # round window / sign centre height
LOGO_O = V((0, 275, ZR))
W5 = dict(
    pos=Track([(S4, V((0, -0.05, 30.0))), (18.1, V((0, 8, 31.2))), (18.9, V((4, 40, 42))), (19.7, V((-2, 70, 60))),
               (20.3, V((0, 90, 78))), (20.75, V((0, 103.5, 88.4))), (21.05, V((0, 110, Z))), (21.5, V((0, 114.5, Z))),
               (22.4, V((0.3, 125, Z - 0.05))), (23.2, V((0, 136.5, Z))), (24.0, V((-0.6, 143, Z + 0.5))),
               (24.8, V((0.5, 149.5, Z + 1.3))), (25.3, V((0, 154.5, ZR - 0.05))), (25.7, V((0, 160, ZR))),
               (26.3, V((0, 172, ZR))), (27.2, V((0, 190, ZR))), (28.2, V((0, 203, ZR))), (29.0, V((0, 209.5, ZR))),
               (T_END, V((0, 209.5, ZR)))], v0=V((0, 1.0, 0)), v1=V((0, 0, 0))),
    tgt=Track([(S4, V((0, 50, 30))), (18.1, V((0, 80, 48))), (18.9, V((0, 110, 72))), (19.7, V((0, 110, 86))),
               (20.3, V((0, 112, Z))), (20.75, V((0, 125, Z))), (21.5, V((0, 140, Z - 0.1))), (23.2, V((0, 155, Z + 0.7))),
               (24.8, V((0, 165, ZR))), (25.7, V((0, 220, ZR))), (26.8, LOGO_O), (T_END, LOGO_O)]),
    lens=Track([(S4, 40.0), (18.2, 28.0), (20.6, 26.0), (21.5, 22.0), (25.7, 22.0), (27.5, 35.0), (T_END, 35.0)]),
    roll=Track([(S4, 0.0), (18.9, 5.0), (19.7, -4.0), (20.3, 0.0), (T_END, 0.0)]),
)

SEG = [("W1", 0.0, S1, W1, (0.05, 6000)), ("W2", S1, S2, W2, (0.05, 7000)), ("W3", S2, S3, W3, (0.01, 3000)),
       ("W4", S3, S4, W4, (0.004, 200)), ("W5", S4, T_END + 1, W5, (0.02, 5000))]
def seg_at(t):
    for s in SEG:
        if s[1] <= t < s[2]:
            return s
    return SEG[-1]

def mobile_mult(t):
    return lerp(2.0, 1.3333, smooth01((t - 0.8) / 1.4))
def desk_shift(t):
    return lerp(-0.05, 0.0, smooth01((t - 0.8) / 1.4))

# ---------------------------------------------------------------- bake
for o in (rig, cd, cm):
    if o.animation_data:
        o.animation_data_clear()
for cam in (cd, cm):
    if cam.data.animation_data:
        cam.data.animation_data_clear()
prevq = None
report = []
speeds = []
prevp = None
with linear_keys():
    for f in range(F_START, F_END + 1):
        t = (f - 1) / FPS
        w, t0, t1, P, clip = seg_at(t)
        pos = OFF[w] + P["pos"](t)
        tgt = OFF[w] + P["tgt"](t)
        q = look_quat(pos, tgt, roll_deg=P["roll"](t))
        if prevq is not None and q.dot(prevq) < 0:
            q.negate()
        prevq = q
        rig.location = pos
        rig.rotation_quaternion = q
        rig.keyframe_insert("location", frame=f)
        rig.keyframe_insert("rotation_quaternion", frame=f)
        L = P["lens"](t)
        cd.data.lens = L
        cd.data.shift_x = desk_shift(t)
        cm.data.lens = L * mobile_mult(t)
        cd.data.keyframe_insert("lens", frame=f)
        cd.data.keyframe_insert("shift_x", frame=f)
        cm.data.keyframe_insert("lens", frame=f)
        if f in (1, int(fr(S1)), int(fr(S2)), int(fr(S3)), int(fr(S4)), F_END):
            report.append((f, w, [round(x, 2) for x in (pos - OFF[w])]))
with const_keys():
    for w, t0, t1, P, clip in SEG:
        f = max(F_START, int(round(fr(t0))))
        for cam in (cd, cm):
            cam.data.clip_start, cam.data.clip_end = clip
            cam.data.keyframe_insert("clip_start", frame=f)
            cam.data.keyframe_insert("clip_end", frame=f)

# ---------------------------------------------------------------- world colour ("sky") per world
wo = sc.world
if wo.animation_data:
    wo.animation_data_clear()
SKY2 = (0.42, 0.45, 0.50)
NIGHT3 = (0.035, 0.04, 0.05)
NIGHT5 = (0.02, 0.025, 0.035)
with linear_keys():
    for t, col in ((0.0, (0, 0, 0)), (S1 + 0.45, (0, 0, 0)), (S1 + 0.95, SKY2), (S2 - 0.05, SKY2)):
        wo.color = col; wo.keyframe_insert("color", frame=int(round(fr(t))))
with const_keys():
    for t, col in ((S2, NIGHT3), (S3, (0, 0, 0)), (S4, NIGHT5)):
        wo.color = col; wo.keyframe_insert("color", frame=int(round(fr(t))))

# ---------------------------------------------------------------- beat markers
sc.timeline_markers.clear()
for t, name in ((0.0, "00 HERO — DARK MODE"), (0.8, "01 PUSH INTO THE O"), (S1, "02 PORTAL (through the O)"),
                (3.8, "03 FANTASY WORLD"), (5.6, "04 DINOSAUR TURNS"), (7.3, "05 ROAR — INTO THE MOUTH"),
                (S2, "06 OUT OF THE SMOKE — DRIFT"), (T_SLIDE, "07 DRIFT STOP"), (T_STOP, "08 WHEEL — DETAIL — SURFACE"),
                (S3, "09 PRODUCT — WATCH"), (16.75, "10 INTO THE GLASS"), (S4, "11 ARCHITECTURE — CITY"),
                (20.75, "12 WINDOW — OFFICE"), (23.2, "13 INTERIOR — LOUNGE"), (25.7, "14 ROUND WINDOW — DARK MODE"),
                (29.0, "15 FINAL LOGO HOLD")):
    sc.timeline_markers.new(name, frame=int(round(fr(t))))

sc.frame_start, sc.frame_end = F_START, F_END
sc.camera = cd
sc.frame_set(1)
result = {"frames": F_END, "report": report, "cap": [round(x, 3) for x in CAP], "cam0": [round(x, 2) for x in CAM0]}
