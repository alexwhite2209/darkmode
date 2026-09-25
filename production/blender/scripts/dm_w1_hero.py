# W1 — HERO: DARK MODE wordmark, eclipse O, planet, rocks, wet ground.  (world offset OFF["W1"])
exec(open("E:\\Сайт\\dark-mode\\production\\blender\\scripts\\dm_common.py", encoding="utf-8").read())

sc = scene()
root = coll("DM_Oner_worlds")
c = fresh_coll("DM_W1_hero", root)
o0 = OFF["W1"]
LOGO_S = 8.0          # metres per cap height
O_Z = 6.24            # O centre height (horizon line sits 0.78 cap below it)
O_CENTER = Vector((0, 0, O_Z)) + o0

# ground (wet dark plane)
g = bmesh.new(); bmesh.ops.create_grid(g, x_segments=1, y_segments=1, size=3000)
to_obj("ENV_W1_ground", g, c, color=C["ground"], loc=o0 + Vector((0, 1500, 0)))

# wordmark
letters, disk, ring, geom = build_wordmark(c, "HERO_W1", LOGO_S, O_CENTER, depth=1.4)

# horizon light line under the eclipse
to_obj("ENV_W1_horizon_line", bm_box(1600, 0.5, 4.0, center=(0, 900, 2.0)), c, color=C["glow"], loc=o0)
ring.color = (1.0, 0.62, 0.22, 1)
# thicker ring for readability in the greybox
_rO = geom["O"]["r"] * LOGO_S
ring.data = to_obj("_tmp_ring", bm_torus(_rO * 1.01, 0.30, seg=128, rseg=14, axis='Y', center=(0, 0.05, 0)), c).data
bpy.data.objects.remove(bpy.data.objects["_tmp_ring"], do_unlink=True)

# planet (top-right of the hero frame)
to_obj("ENV_W1_planet", bm_sphere(500, u=96, v=48), c, color=(0.72, 0.72, 0.74, 1),
       loc=o0 + Vector((846, 1380, 616)), smooth=True)

rnd = random.Random(7)
def spire(name, x, y, r, h, seed, col=C["rock"]):
    bm = rock_bm(seed, r=r, sx=1.0, sy=1.0, sz=h / r, jag=0.42, sub=2)
    return to_obj(name, bm, c, color=col, loc=o0 + Vector((x, y, 0)), rot=(0, 0, rnd.uniform(0, 6.28)))

# near rock clusters left / right (frame the logo like the reference)
L = [(-78, 30, 7, 20), (-64, 12, 5, 14), (-55, 38, 6, 17), (-47, -8, 3.5, 8), (-40, 22, 4.5, 11),
     (-33, -22, 2.5, 5), (-90, -5, 6, 12), (-70, 55, 8, 22), (-28, 48, 3, 7), (-52, -30, 2.2, 4)]
R = [(88, 26, 7, 17), (72, 8, 5, 12), (60, 40, 5.5, 14), (50, -12, 3.2, 7), (98, -8, 6, 11),
     (45, 18, 3.8, 9), (80, 58, 8, 20), (36, -26, 2.2, 4.5), (110, 40, 7, 15)]
for i, (x, y, r, h) in enumerate(L):
    spire(f"ENV_W1_rockL_{i:02d}", x, y, r, h, 100 + i)
for i, (x, y, r, h) in enumerate(R):
    spire(f"ENV_W1_rockR_{i:02d}", x, y, r, h, 200 + i)

# distant ridge along the horizon, clear gap behind the logo
k = 0
for side in (-1, 1):
    for j in range(12):
        x = side * (70 + j * 55 + rnd.uniform(-15, 15))
        y = 380 + rnd.uniform(0, 320)
        r = rnd.uniform(18, 34)
        h = rnd.uniform(18, 55)
        spire(f"ENV_W1_ridge_{k:02d}", x, y, r, h, 300 + k, col=C["rock_far"]); k += 1

# small stones in the water (foreground parallax)
for i in range(14):
    side = -1 if i % 2 == 0 else 1
    x = side * rnd.uniform(5, 42)
    y = rnd.uniform(-72, -14)
    r = rnd.uniform(0.35, 1.6)
    bm = rock_bm(400 + i, r=r, sx=1.3, sy=1.0, sz=0.7, jag=0.3, sub=1)
    to_obj(f"ENV_W1_stone_{i:02d}", bm, c, color=C["rock"], loc=o0 + Vector((x, y, 0)),
           rot=(0, 0, rnd.uniform(0, 6.28)))

anc = empty("ANC_W1_O_center", c, loc=O_CENTER, size=2)
result = {"objects": len(c.objects), "O_center": list(O_CENTER)}
