# W4 — PRODUCT: dark studio, luxury watch (modelled at 25x scale so the camera moves read as macro).
exec(open("E:\\Сайт\\dark-mode\\production\\blender\\scripts\\dm_common.py", encoding="utf-8").read())

sc = scene()
root = coll("DM_Oner_worlds")
c = fresh_coll("DM_W4_product", root)
o0 = OFF["W4"]
W = Vector((0, 3.2, 1.2))           # watch centre (dial faces -Y)
T_PASS = S3 + 0.12                  # camera crosses the portal plane

# portal plane: same tone as the wheel cap, disappears once passed
plane = to_obj("FX_W4_portal_plane", bm_box(8, 0.02, 8, center=(0, 0, 1.2)), c, color=C["cap"], loc=o0)
with linear_keys():
    key_color(plane, fr(T_PASS) + 1, C["cap"]); key_color(plane, fr(T_PASS) + 2, C["black"])

studio = []
fl = bmesh.new(); bmesh.ops.create_grid(fl, x_segments=1, y_segments=1, size=40)
studio.append(to_obj("ENV_W4_floor", fl, c, color=C["studio"], loc=o0 + Vector((0, 20, 0))))
studio.append(to_obj("ENV_W4_stand_base", bm_cyl(0.7, 0.08, seg=64, center=(0, 0, 0.04)), c, color=(0.18, 0.18, 0.19, 1), loc=o0 + Vector((W.x, W.y + 0.1, 0))))
studio.append(to_obj("ENV_W4_stand_post", bm_cyl(0.03, W.z - 0.62, seg=16, center=(0, 0, (W.z - 0.62) / 2 + 0.08)), c, color=(0.4, 0.4, 0.42, 1), loc=o0 + Vector((W.x, W.y + 0.1, 0))))
softboxes = []
for name, size, pos in (("L", (0.14, 0.7, 2.8), (-2.6, 3.6, 1.6)), ("R", (0.14, 0.7, 2.8), (2.6, 3.9, 1.6)),
                        ("top", (2.6, 0.6, 0.1), (0, 3.3, 3.4)), ("back", (4.0, 0.1, 0.12), (0, 6.5, 0.9))):
    softboxes.append(to_obj(f"FX_W4_softbox_{name}", bm_box(*size, center=pos), c, color=C["light"], loc=o0))

# ---------------------------------------------------------------- watch (local: centre at origin, dial faces -Y)
rigw = empty("RIG_W4_watch", c, loc=o0 + W, size=0.8)
parts = []
def part(name, bm, col):
    o = to_obj(name, bm, c, color=col, parent=rigw); parts.append(o); return o
part("HERO_W4_case", bm_cyl(0.53, 0.28, seg=96, axis='Y'), C["watch"])
part("HERO_W4_caseback", bm_cyl(0.47, 0.06, seg=96, axis='Y', center=(0, 0.16, 0)), C["watch"])
bez = bm_tube(0.555, 0.445, 0.07, seg=120, axis='Y', center=(0, -0.155, 0))
for i in range(60):
    a = 2 * math.pi * i / 60
    L = 0.045 if i % 5 == 0 else 0.022
    tick = bm_box(0.012 if i % 5 else 0.02, 0.012, L, center=(0, 0, 0.5))
    bmesh.ops.rotate(tick, verts=tick.verts, cent=(0, 0, 0), matrix=Matrix.Rotation(a, 3, 'Y'))
    bmesh.ops.translate(tick, verts=tick.verts, vec=(0, -0.195, 0))
    bm_merge(bez, tick)
part("HERO_W4_bezel", bez, (0.24, 0.25, 0.27, 1))
part("HERO_W4_dial", bm_cyl(0.445, 0.02, seg=120, axis='Y', center=(0, -0.13, 0)), C["crystal"])
idx = bmesh.new()
for i in range(12):
    a = 2 * math.pi * i / 12
    ln = 0.11 if i % 3 == 0 else 0.08
    b = bm_box(0.035 if i % 3 == 0 else 0.026, 0.02, ln, center=(0, 0, 0.34))
    bmesh.ops.rotate(b, verts=b.verts, cent=(0, 0, 0), matrix=Matrix.Rotation(a, 3, 'Y'))
    bmesh.ops.translate(b, verts=b.verts, vec=(0, -0.15, 0))
    bm_merge(idx, b)
part("HERO_W4_indices", idx, (0.85, 0.85, 0.86, 1))
def hand(name, length, width, y, col, tail=0.0):
    righ = empty(f"RIG_W4_{name}", c, loc=(0, y, 0), parent=rigw, size=0.1)
    righ.rotation_mode = 'XYZ'
    b = bm_box(width, 0.012, length + tail, center=(0, 0, (length - tail) / 2))
    o = to_obj(f"HERO_W4_{name}", b, c, color=col, parent=righ)
    parts.append(o)
    return righ
h_hour = hand("hand_hour", 0.22, 0.032, -0.152, (0.88, 0.88, 0.9, 1))
h_min = hand("hand_minute", 0.33, 0.024, -0.158, (0.88, 0.88, 0.9, 1))
h_sec = hand("hand_second", 0.39, 0.008, -0.164, C["ring"], tail=0.09)
part("HERO_W4_pin", bm_cyl(0.022, 0.03, seg=24, axis='Y', center=(0, -0.168, 0)), (0.9, 0.9, 0.9, 1))
part("HERO_W4_crown", bm_cyl(0.065, 0.11, seg=32, axis='X', center=(0.585, 0, 0)), C["watch"])
lug = bmesh.new()
for sx in (-1, 1):
    for sz in (-1, 1):
        bm_add_box(lug, 0.09, 0.2, 0.22, center=(sx * 0.3, 0.0, sz * 0.54))
part("HERO_W4_lugs", lug, C["watch"])
strap = bmesh.new()
for sz in (-1, 1):
    secs = []
    for k in range(7):
        a = math.radians(k * 14)
        zc = sz * (0.62 + 0.55 * math.sin(a))
        yc = 0.0 + 0.55 * (1 - math.cos(a))
        secs.append([Vector((-0.23, yc - 0.03, zc)), Vector((0.23, yc - 0.03, zc)),
                     Vector((0.23, yc + 0.03, zc)), Vector((-0.23, yc + 0.03, zc))])
    bm_merge(strap, bm_loft(secs))
part("HERO_W4_strap", strap, C["strap"])

# 10:10, second hand sweeping through the upper-left so the lower-right of the dial stays clear
# rotation about +Y: positive = clockwise as seen from the front (-Y)
h_hour.rotation_euler = (0, math.radians(-60), 0)
h_min.rotation_euler = (0, math.radians(60), 0)
with linear_keys():
    h_sec.rotation_euler = (0, math.radians(-90), 0); h_sec.keyframe_insert("rotation_euler", frame=fr(S3))
    h_sec.rotation_euler = (0, math.radians(-90 + 6 * 7), 0); h_sec.keyframe_insert("rotation_euler", frame=fr(S4))
# dial surface point at 4:30 (clear of hands and indices) — the camera dives here
anc = empty("ANC_W4_dive", c, loc=(0.16, -0.14, -0.16), parent=rigw, size=0.05)

# studio is already lit behind the plane, so crossing it reveals the watch without a black flash
fade_in(softboxes, S3 - 0.1, S3)
fade_in(studio + parts, S3 - 0.1, S3)
result = {"objects": len(c.objects)}
