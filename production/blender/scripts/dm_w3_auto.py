# W3 — AUTOMOTIVE: the scene opens mid-drift. The camera bursts out of the dark smoke (continuing the
# darkness of the throat), tracks the car through the hairpin, the car drift-stops, the camera dives to the wheel.
exec(open("E:\\Сайт\\dark-mode\\production\\blender\\scripts\\dm_common.py", encoding="utf-8").read())
exec(open("E:\\Сайт\\dark-mode\\production\\blender\\scripts\\dm_carpath.py", encoding="utf-8").read())

sc = scene()
root = coll("DM_Oner_worlds")
c = fresh_coll("DM_W3_auto", root)
o0 = OFF["W3"]
rnd = random.Random(33)

def fwd(a):
    return Vector((math.cos(a), math.sin(a), 0))

def side_cam(t):
    st = car_state(t); p = st["pos"]
    out = p - ARC_C; out.z = 0; out.normalize()
    return p + out * 9.5 - fwd(st["heading"]) * 3.5 + Vector((0, 0, 2.6)), p + Vector((0, 0, 0.6))

CAM0 = side_cam(S2)[0] - fwd(car_state(S2)["heading"]) * 6.0     # camera position at the switch

# ---------------------------------------------------------------- track
g = bmesh.new(); bmesh.ops.create_grid(g, x_segments=1, y_segments=1, size=1200)
to_obj("ENV_W3_ground", g, c, color=(0.085, 0.085, 0.09, 1), loc=o0 + Vector((0, -100, -0.05)))
RW = 7.5
rbm = bmesh.new()
pts = []
for i in range(0, 30):
    pts.append((Vector((0, Y_ARC + 90 - i * 3.0, 0)), -math.pi / 2))
for i in range(0, 91):
    th = math.pi + math.radians(i * 2.0)
    pts.append((ARC_C + Vector((math.cos(th), math.sin(th), 0)) * ARC_R, th + math.pi / 2))
for i in range(1, 30):
    pts.append((ARC_C + Vector((ARC_R, 0, 0)) + Vector((0, i * 3.0, 0)), math.pi / 2))
prev = None
for p, h in pts:
    nrm = Vector((-math.sin(h), math.cos(h), 0))
    a = rbm.verts.new(p - nrm * RW + Vector((0, 0, 0.01)))
    b = rbm.verts.new(p + nrm * RW + Vector((0, 0, 0.01)))
    if prev:
        rbm.faces.new((prev[0], prev[1], b, a))
    prev = (a, b)
to_obj("ENV_W3_road", rbm, c, color=C["asphalt"], loc=o0)
# kerbs, tyre wall, light poles on the outside of the hairpin; kerbs on the apex
kb = bmesh.new(); tb = bmesh.new(); pb = bmesh.new(); lamps = bmesh.new()
for i in range(0, 46):
    th = math.pi + math.radians(i * 4.0)
    d = Vector((math.cos(th), math.sin(th), 0))
    p = ARC_C + d * (ARC_R + RW + 0.6)
    bm_add_box(kb, 1.2, 0.9, 0.12, center=tuple(p + Vector((0, 0, 0.06))), rotz=th + math.pi / 2)
    q = ARC_C + d * (ARC_R + RW + 5.5)
    for lvl in range(3):
        bm_merge(tb, bm_cyl(0.45, 0.35, seg=12, center=tuple(q + Vector((0, 0, 0.18 + lvl * 0.36)))))
    if i % 6 == 0:
        pp = ARC_C + d * (ARC_R + RW + 9.0)
        bm_merge(pb, bm_cyl(0.18, 12, seg=8, center=tuple(pp + Vector((0, 0, 6)))))
        bm_add_box(pb, 0.6, 1.8, 0.3, center=tuple(pp + Vector((0, 0, 12.1)) - d * 0.6), rotz=th)
        bm_add_box(lamps, 0.5, 1.6, 0.06, center=tuple(pp + Vector((0, 0, 11.93)) - d * 0.6), rotz=th)
for i in range(0, 23):
    th = math.pi + math.radians(i * 8.0)
    d = Vector((math.cos(th), math.sin(th), 0))
    p = ARC_C + d * (ARC_R - RW - 0.6)
    bm_add_box(kb, 1.2, 0.9, 0.12, center=tuple(p + Vector((0, 0, 0.06))), rotz=th + math.pi / 2)
to_obj("ENV_W3_kerbs", kb, c, color=(0.62, 0.62, 0.62, 1), loc=o0)
to_obj("ENV_W3_tyre_wall", tb, c, color=C["tyre"], loc=o0)
to_obj("ENV_W3_poles", pb, c, color=C["barrier"], loc=o0)
to_obj("FX_W3_pole_lamps", lamps, c, color=C["light"], loc=o0)
# grandstand outside the hairpin + distant skyline
gs = bmesh.new()
for i in range(0, 13):
    th = math.pi + math.radians(20 + i * 8.5)
    d = Vector((math.cos(th), math.sin(th), 0))
    for step in range(5):
        p = ARC_C + d * (ARC_R + RW + 22 + step * 2.2)
        bm_add_box(gs, 2.4, 9.0, 1.2 + step * 1.3, center=tuple(p + Vector((0, 0, (1.2 + step * 1.3) / 2))), rotz=th)
to_obj("ENV_W3_grandstand", gs, c, color=(0.24, 0.24, 0.25, 1), loc=o0)
sk = bmesh.new()
for i in range(40):
    a = math.radians(-170 + i * 8.5)
    rr = rnd.uniform(420, 620)
    p = ARC_C + Vector((math.cos(a), math.sin(a), 0)) * rr
    h = rnd.uniform(25, 110)
    bm_add_box(sk, rnd.uniform(18, 40), rnd.uniform(18, 40), h, center=(p.x, p.y, h / 2), rotz=a)
to_obj("ENV_W3_skyline", sk, c, color=(0.12, 0.12, 0.13, 1), loc=o0)

# the dark smoke the camera bursts out of (continues the black of the throat)
cloud = to_obj("FX_W3_dark_smoke", bm_ico(2.6, sub=3), c, color=C["black"], loc=o0 + CAM0)
with const_keys():
    cloud.scale = (1, 1, 1); cloud.keyframe_insert("scale", frame=fr(S2 + 0.4))
    cloud.scale = (0, 0, 0); cloud.keyframe_insert("scale", frame=fr(S2 + 0.4) + 1)

# ---------------------------------------------------------------- car (car-local +X forward, +Y left)
car = empty("RIG_W3_car", c, size=2.5)
car.rotation_mode = 'XYZ'
BODY = [(2.30, 0.78, 0.30, 0.56), (2.05, 0.88, 0.26, 0.66), (1.60, 0.92, 0.24, 0.74), (0.90, 0.92, 0.24, 0.80),
        (0.0, 0.92, 0.24, 0.82), (-0.80, 0.92, 0.24, 0.84), (-1.50, 0.92, 0.26, 0.88), (-2.05, 0.88, 0.28, 0.90),
        (-2.32, 0.80, 0.32, 0.84)]
def csec(x, hw, zb, zt, n=16, p=4.0):
    zc, hh = (zb + zt) / 2, (zt - zb) / 2
    out = []
    for i in range(n):
        a = 2 * math.pi * i / n
        ca, sa = math.cos(a), math.sin(a)
        out.append(Vector((x, hw * math.copysign(abs(ca) ** (2 / p), ca), zc + hh * math.copysign(abs(sa) ** (2 / p), sa))))
    return out
body = to_obj("HERO_W3_car_body", bm_loft([csec(*s) for s in BODY]), c, color=C["car"], parent=car)
add_mod(body, 'SUBSURF', levels=1, render_levels=1)
CAB = [(1.10, 0.84, 0.70, 0.76, 0.79), (0.45, 0.82, 0.66, 0.78, 1.16), (-0.25, 0.80, 0.64, 0.80, 1.20),
       (-0.95, 0.80, 0.60, 0.82, 1.12), (-1.62, 0.82, 0.50, 0.84, 0.90)]
to_obj("HERO_W3_car_cabin", bm_loft([[Vector((x, -hb, zb)), Vector((x, hb, zb)), Vector((x, ht, zt)), Vector((x, -ht, zt))]
                                     for (x, hb, ht, zb, zt) in CAB]), c, color=C["glass_car"], parent=car)
wing = bm_box(0.28, 1.7, 0.05, center=(-2.08, 0, 1.02))
bm_add_box(wing, 0.1, 0.06, 0.14, center=(-2.05, 0.55, 0.93))
bm_add_box(wing, 0.1, 0.06, 0.14, center=(-2.05, -0.55, 0.93))
to_obj("HERO_W3_car_wing", wing, c, color=C["car"], parent=car)
hb_ = bm_box(0.12, 0.34, 0.07, center=(2.2, 0.56, 0.58))
bm_add_box(hb_, 0.12, 0.34, 0.07, center=(2.2, -0.56, 0.58))
to_obj("FX_W3_headlights", hb_, c, color=C["head_on"], parent=car)
to_obj("FX_W3_taillight", bm_box(0.05, 1.5, 0.05, center=(-2.32, 0, 0.76)), c, color=C["tail_on"], parent=car)

WHEELS = {"FL": (1.40, 0.88), "FR": (1.40, -0.88), "RL": (-1.35, 0.88), "RR": (-1.35, -0.88)}
RAD = 0.35
wheel_rigs = {}
for key, (wx, wy) in WHEELS.items():
    wr = empty(f"RIG_W3_wheel_{key}", c, loc=(wx, wy, RAD), parent=car, size=0.4)
    wr.rotation_mode = 'XYZ'
    side = 1 if wy > 0 else -1
    to_obj(f"HERO_W3_tyre_{key}", bm_cyl(RAD, 0.26, seg=32, axis='Y'), c, color=C["tyre"], parent=wr)
    rim = bm_cyl(0.255, 0.03, seg=32, axis='Y', center=(0, side * 0.125, 0))
    for sp in range(5):
        a = sp * 2 * math.pi / 5
        spoke = bm_box(0.2, 0.03, 0.05, center=(0.13, 0, 0))
        bmesh.ops.rotate(spoke, verts=spoke.verts, cent=(0, 0, 0), matrix=Matrix.Rotation(a, 3, 'Y'))
        bmesh.ops.translate(spoke, verts=spoke.verts, vec=(0, side * 0.145, 0))
        bm_merge(rim, spoke)
    to_obj(f"HERO_W3_rim_{key}", rim, c, color=C["rim"], parent=wr)
    to_obj(f"HERO_W3_cap_{key}", bm_cyl(0.10, 0.03, seg=48, axis='Y', center=(0, side * 0.165, 0)), c, color=C["cap"], parent=wr)
    wheel_rigs[key] = wr
empty("ANC_W3_cap_RR", c, loc=(0, -0.181, 0), parent=wheel_rigs["RR"], size=0.1)

# bake car + wheels per frame
spin = {k: 0.0 for k in WHEELS}
f0, f1 = int(fr(S2 - 0.5)), int(fr(S3)) + 2
prev_t = None
with linear_keys():
    for f in range(f0, f1 + 1):
        t = (f - 1) / FPS
        st = car_state(t)
        car.location = o0 + st["pos"]
        car.rotation_euler = (0, 0, st["yaw"])
        car.keyframe_insert("location", frame=f)
        car.keyframe_insert("rotation_euler", frame=f)
        dt = 0 if prev_t is None else t - prev_t
        vlong = st["v"] * math.cos(st["beta"])
        for k in WHEELS:
            if k.startswith("F"):
                w = vlong / RAD
            elif t < T_STOP:
                w = 1.45 * st["v"] / RAD + 18.0
            else:
                w = 22.0 * math.exp(-(t - T_STOP) * 1.6) + 3.0
            spin[k] += w * dt
            wheel_rigs[k].rotation_euler = (0, spin[k], st["steer"] if k.startswith("F") else 0.0)
            wheel_rigs[k].keyframe_insert("rotation_euler", frame=f)
        prev_t = t

# tyre smoke: a trail already exists when the camera arrives, all gone before the wheel dive
puff_c = coll("DM_W3_smoke", c)
n = 0
t = T_ARC - 0.5
while t < T_SLIDE + 0.4:
    M = car_matrix(t)
    for k in ("RL", "RR"):
        wx, wy = WHEELS[k]
        p = M @ Vector((wx - 0.3, wy * 1.05, 0.25))
        o = to_obj(f"FX_W3_smoke_{n:03d}", bm_ico(1.0, sub=2), puff_c, color=(0.55, 0.55, 0.57, 1), loc=o0 + p)
        life = min(2.0, T_STOP + 0.15 - t)
        grow = min(1.0, life / 2.0)
        s1 = (1.9 * grow + 0.35, 1.9 * grow + 0.35, 1.2 * grow + 0.3)
        with linear_keys():
            o.scale = (0, 0, 0); o.keyframe_insert("scale", frame=fr(t) - 1)
            o.scale = (0.35, 0.35, 0.3); o.keyframe_insert("scale", frame=fr(t))
            o.scale = s1; o.keyframe_insert("scale", frame=fr(t + life * 0.9))
            o.location = o0 + p; o.keyframe_insert("location", frame=fr(t))
            o.location = o0 + p + Vector((0, 0, 1.0 * grow)); o.keyframe_insert("location", frame=fr(t + life * 0.9))
            key_color(o, fr(t + life * 0.2), (0.55, 0.55, 0.57, 1)); key_color(o, fr(t + life * 0.95), (0.05, 0.05, 0.055, 1))
            o.scale = s1; o.keyframe_insert("scale", frame=fr(t + life))
            o.scale = (0, 0, 0); o.keyframe_insert("scale", frame=fr(t + life) + 1)
        n += 1
    t += 0.18

result = {"objects": len(c.all_objects), "puffs": n, "cam0": [round(x, 2) for x in CAM0]}
