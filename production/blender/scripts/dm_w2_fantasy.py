# W2 — PORTAL tunnel + FANTASY valley + giant DINOSAUR.  (world offset OFF["W2"])
exec(open("E:\\Сайт\\dark-mode\\production\\blender\\scripts\\dm_common.py", encoding="utf-8").read())

sc = scene()
root = coll("DM_Oner_worlds")
c = fresh_coll("DM_W2_fantasy", root)
o0 = OFF["W2"]
rnd = random.Random(21)

PORTAL_Z = 120.0
PORTAL_L = 100.0
DINO_POS = Vector((12, 330, 0))
DINO_YAW = math.radians(-125)          # body faces -Y, turned 35 deg towards -X
REVEAL_T0, REVEAL_T1 = S1 + 0.45, S1 + 0.95   # world "lights on" while the camera nears the tunnel exit

fantasy = []                            # objects that fade in at the reveal

# ---------------------------------------------------------------- portal tunnel (black) + rings
tube = to_obj("ENV_W2_portal_tube", bm_cyl(8.0, PORTAL_L, seg=64, axis='Y', caps=False, center=(0, PORTAL_L / 2, 0)),
              c, color=C["black"], loc=o0 + Vector((0, 0, PORTAL_Z)))
rings = []
for i in range(13):
    y = 8 + i * 7.0
    rg = to_obj(f"FX_W2_portal_ring_{i:02d}", bm_torus(6.6, 0.16, seg=96, rseg=10, axis='Y'), c,
                color=C["ring"] if i % 3 else C["light"], loc=o0 + Vector((0, y, PORTAL_Z)))
    t_on = S1 + 0.06 + i * 0.035
    with linear_keys():
        tgt = tuple(rg.color)
        key_color(rg, fr(t_on) - 2, C["black"])
        key_color(rg, fr(t_on), tgt)
    rings.append(rg)

# ---------------------------------------------------------------- terrain
DINO_SCALE = 1.6

def terrain_h(x, y):
    d = math.hypot(x - DINO_POS.x, y - DINO_POS.y)
    flat = smooth01((d - 120) / 200)
    valley = 0.00009 * x * x
    hills = 14 * noise.noise((x / 220, y / 220, 0.3)) + 5 * noise.noise((x / 70, y / 70, 1.7))
    rise = max(0.0, y - 1500) * 0.10
    return valley + flat * hills + rise + (1 - flat) * 0.4

gbm = bmesh.new()
bmesh.ops.create_grid(gbm, x_segments=150, y_segments=150, size=3000)
for v in gbm.verts:
    x, y = v.co.x, v.co.y + 2000
    v.co = Vector((x, y, terrain_h(x, y)))
fantasy.append(to_obj("ENV_W2_terrain", gbm, c, color=C["terrain"], loc=o0))

# river ribbon along the valley floor
rbm = bmesh.new()
prev = None
for i in range(0, 90):
    y = 180 + i * 25
    cx = -34 + 16 * math.sin(y / 170)
    a = rbm.verts.new((cx - 9, y, terrain_h(cx - 9, y) + 0.35))
    b = rbm.verts.new((cx + 9, y, terrain_h(cx + 9, y) + 0.35))
    if prev:
        rbm.faces.new((prev[0], prev[1], b, a))
    prev = (a, b)
fantasy.append(to_obj("ENV_W2_river", rbm, c, color=C["water"], loc=o0))

# far mountains
MNT = [(-1500, 2600, 900), (-700, 3300, 1250), (300, 3700, 1000), (1200, 2900, 850), (1900, 1700, 700),
       (-1900, 1200, 650), (2200, 3400, 1100), (-2500, 2500, 900), (850, 4300, 1300), (-300, 2400, 520)]
for i, (x, y, H) in enumerate(MNT):
    bm = bm_cyl(H * 0.72, H, seg=28, r2=H * 0.06, center=(0, 0, H / 2))
    bmesh.ops.subdivide_edges(bm, edges=bm.edges[:], cuts=2, use_grid_fill=True)
    off = Vector((i * 3.1, 7.7, 1.3))
    for v in bm.verts:
        n = noise.noise(v.co / (H * 0.35) + off)
        k = 1 + 0.22 * n
        v.co = Vector((v.co.x * k, v.co.y * k, max(0.0, v.co.z * (1 + 0.15 * n))))
    fantasy.append(to_obj(f"ENV_W2_mountain_{i:02d}", bm, c, color=C["mountain"],
                          loc=o0 + Vector((x, y, terrain_h(x, y) - 10))))

# floating islands (inverted rocky cones with small trees on top)
ISL = [(-110, 150, 140, 38, 55), (95, 120, 95, 28, 40), (-75, 230, 160, 55, 70), (150, 210, 125, 34, 45),
       (-190, 320, 115, 42, 60), (85, 430, 180, 60, 80), (-40, 580, 240, 70, 95), (230, 340, 85, 26, 34),
       (-40, 165, 148, 24, 38), (44, 205, 124, 20, 32)]
for i, (x, y, z, R, H) in enumerate(ISL):
    bm = bm_cyl(R * 0.12, H, seg=20, r2=R, center=(0, 0, -H / 2))
    bmesh.ops.subdivide_edges(bm, edges=bm.edges[:], cuts=2, use_grid_fill=True)
    off = Vector((i * 5.3, 1.1, 9.9))
    for v in bm.verts:
        if v.co.z < -0.5:
            n = noise.noise(v.co / (R * 0.4) + off)
            v.co.x *= 1 + 0.25 * n
            v.co.y *= 1 + 0.25 * n
            v.co.z *= 1 + 0.12 * n
    isl = to_obj(f"ENV_W2_island_{i:02d}", bm, c, color=C["island"], loc=o0 + Vector((x, y, z)))
    fantasy.append(isl)
    tb = bmesh.new()
    for j in range(int(R / 7) + 2):
        a = rnd.uniform(0, 6.28); rr = rnd.uniform(0, R * 0.7)
        hh = rnd.uniform(6, 14)
        bm_merge(tb, bm_cyl(hh * 0.22, hh, seg=8, r2=0.05, center=(math.cos(a) * rr, math.sin(a) * rr, hh / 2)))
    fantasy.append(to_obj(f"ENV_W2_island_trees_{i:02d}", tb, c, color=C["tree"], loc=o0 + Vector((x, y, z))))

# waterfall from the big island
_wx, _wy, _wz = -75 - 32, 230 - 22, 160 - 16
_wh = _wz - terrain_h(_wx, _wy)
wfb = bmesh.new()
_top = [Vector((-11, 0, 0)), Vector((11, 0, 0))]
_sec = []
for k in range(9):
    zz = -_wh * k / 8
    ww = 11 + 7 * (k / 8) ** 1.5
    _sec.append([Vector((-ww, -0.6, zz)), Vector((ww, -0.6, zz)), Vector((ww, 0.6, zz)), Vector((-ww, 0.6, zz))])
wf = to_obj("ENV_W2_waterfall", bm_loft(_sec), c, color=(0.80, 0.82, 0.84, 1), loc=o0 + Vector((_wx, _wy, _wz)),
            rot=(0, 0, math.radians(20)))
fantasy.append(wf)
fantasy.append(to_obj("ENV_W2_waterfall_pool", bm_cyl(34, 1.0, seg=40, center=(0, 0, 0.2)), c,
                      color=(0.74, 0.76, 0.78, 1), loc=o0 + Vector((_wx, _wy, terrain_h(_wx, _wy)))))
fantasy.append(wf)

# giant trees along the valley sides (keep the camera lane x -40..40, y 300..680 clear)
k = 0
for side in (-1, 1):
    for j in range(12):
        x = side * rnd.uniform(75, 280)
        y = rnd.uniform(140, 1100)
        H = rnd.uniform(24, 44)
        r = H * rnd.uniform(0.045, 0.06)
        z0 = terrain_h(x, y)
        tbm = bm_cyl(r, H, seg=12, r2=r * 0.7, center=(0, 0, H / 2))
        fantasy.append(to_obj(f"ENV_W2_trunk_{k:02d}", tbm, c, color=C["trunk"], loc=o0 + Vector((x, y, z0))))
        cbm = bmesh.new()
        for q in range(3):
            cr = H * rnd.uniform(0.18, 0.28)
            bm_merge(cbm, bm_ico(cr, sub=2, center=(rnd.uniform(-cr, cr) * 0.5, rnd.uniform(-cr, cr) * 0.5,
                                                   H * rnd.uniform(0.85, 1.0))))
        for v in cbm.verts:
            v.co.z = H * 0.9 + (v.co.z - H * 0.9) * 0.62
        fantasy.append(to_obj(f"ENV_W2_canopy_{k:02d}", cbm, c, color=C["tree"], loc=o0 + Vector((x, y, z0))))
        k += 1

# ---------------------------------------------------------------- DINOSAUR (giant T-rex, skin-modifier body)
dino_root = empty("RIG_W2_dino", c, loc=o0 + DINO_POS + Vector((0, 0, terrain_h(DINO_POS.x, DINO_POS.y))),
                  rot=(0, 0, DINO_YAW), size=6)
dino_root.scale = (DINO_SCALE,) * 3

def skin_mesh(name, nodes, edges, root_idx, parent, color, offset=Vector((0, 0, 0)), levels=2):
    bm = bmesh.new()
    sk = bm.verts.layers.skin.verify()
    vs = []
    for (p, r) in nodes:
        v = bm.verts.new(Vector(p) - offset)
        rr = r if isinstance(r, tuple) else (r, r)
        v[sk].radius = rr
        vs.append(v)
    for a, b in edges:
        bm.edges.new((vs[a], vs[b]))
    vs[root_idx][sk].use_root = True
    o = to_obj(name, bm, c, color=color, parent=parent)
    m = add_mod(o, 'SKIN')
    m.use_smooth_shade = True
    add_mod(o, 'SUBSURF', levels=levels, render_levels=levels)
    return o

# body: spine + legs + arms (dino-local: +X forward, Z up)
N = []; E = []
def node(p, r):
    N.append((p, r)); return len(N) - 1
spine = [((-40, 0, 11), 0.4), ((-33, 0, 13.5), 1.6), ((-25, 0, 16.5), 3.0), ((-16, 0, 19.5), 4.4),
         ((-7, 0, 21.6), 6.0), ((0, 0, 22.5), 7.2), ((6.5, 0, 23.0), 7.6), ((12, 0, 23.6), 6.6),
         ((15.8, 0, 24.6), 4.8)]
sidx = [node(p, r) for p, r in spine]
for a, b in zip(sidx[:-1], sidx[1:]):
    E.append((a, b))
hip = sidx[5]; chest = sidx[7]
for s in (1, -1):
    legs = [((1.0, 4.4 * s, 19.0), 5.2), ((6.4, 4.8 * s, 11.5), 3.3), ((1.8, 4.8 * s, 4.6), 1.8),
            ((5.2, 4.8 * s, 1.3), 1.35), ((9.0, 4.8 * s, 0.7), 0.75)]
    li = [node(p, r) for p, r in legs]
    E.append((hip, li[0]))
    for a, b in zip(li[:-1], li[1:]):
        E.append((a, b))
    arms = [((13.8, 2.9 * s, 20.6), 0.95), ((15.9, 3.1 * s, 17.6), 0.62), ((17.8, 2.8 * s, 18.1), 0.42)]
    ai = [node(p, r) for p, r in arms]
    E.append((chest, ai[0]))
    for a, b in zip(ai[:-1], ai[1:]):
        E.append((a, b))
body = skin_mesh("HERO_W2_dino_body", N, E, hip, dino_root, C["dino"])
fantasy.append(body)

# head rig (pivot at the neck base) -> neck, skull, jaw rig, teeth, throat
NECK_PIVOT = Vector((15.5, 0, 24.5))
HINGE = Vector((21.0, 0, 27.3))
head_rig = empty("RIG_W2_dino_head", c, loc=NECK_PIVOT, parent=dino_root, size=3)
jaw_rig = empty("RIG_W2_dino_jaw", c, loc=HINGE - NECK_PIVOT, parent=head_rig, size=2)

neck = skin_mesh("HERO_W2_dino_neck", [((15.5, 0, 24.5), 4.4), ((18.2, 0, 26.8), 3.6), ((20.6, 0, 28.8), 3.0)],
                 [(0, 1), (1, 2)], 0, head_rig, C["dino"], offset=NECK_PIVOT)
fantasy.append(neck)

def rsec(x, hw, zb, zt, n=12, p=3.2):
    zc, hh = (zb + zt) / 2, (zt - zb) / 2
    pts = []
    for i in range(n):
        a = 2 * math.pi * i / n
        ca, sa = math.cos(a), math.sin(a)
        y = hw * math.copysign(abs(ca) ** (2 / p), ca)
        z = zc + hh * math.copysign(abs(sa) ** (2 / p), sa)
        pts.append(Vector((x, y, z)))
    return pts

SKULL = [(19.6, 3.15, 27.5, 32.6), (22.8, 3.0, 27.5, 32.3), (26.3, 2.35, 27.6, 31.1),
         (29.4, 1.7, 27.7, 30.1), (31.5, 1.15, 27.8, 29.3)]
JAW = [(20.0, 2.75, 25.1, 27.35), (23.4, 2.45, 25.6, 27.35), (27.0, 1.85, 26.2, 27.4), (30.8, 1.15, 26.8, 27.45)]

sk_bm = bm_loft([[p - NECK_PIVOT for p in rsec(*s)] for s in SKULL])
skull = to_obj("HERO_W2_dino_skull", sk_bm, c, color=C["dino"], parent=head_rig)
add_mod(skull, 'SUBSURF', levels=2, render_levels=2)
fantasy.append(skull)
jw_bm = bm_loft([[p - HINGE for p in rsec(*s)] for s in JAW])
jaw = to_obj("HERO_W2_dino_jaw", jw_bm, c, color=C["dino"], parent=jaw_rig)
add_mod(jaw, 'SUBSURF', levels=2, render_levels=2)
fantasy.append(jaw)

def hw_at(tab, x):
    for (x0, h0, _, _), (x1, h1, _, _) in zip(tab[:-1], tab[1:]):
        if x0 <= x <= x1:
            return lerp(h0, h1, (x - x0) / (x1 - x0))
    return tab[-1][1]

tu = bmesh.new(); tl = bmesh.new()
x = 22.4
while x < 31.0:
    for s in (1, -1):
        y = s * (hw_at(SKULL, x) - 0.32)
        bm_merge(tu, bm_cyl(0.24, 0.9, seg=8, r2=0.02, center=(x, y, 27.1), axis='Z'))
        # flip upper tooth to point down
    x += 0.95
for v in tu.verts:
    v.co.z = 27.55 - (v.co.z - 26.65)          # mirror so the tip points down
    v.co -= NECK_PIVOT
teeth_u = to_obj("HERO_W2_dino_teeth_upper", tu, c, color=(0.9, 0.9, 0.86, 1), parent=head_rig)
x = 22.0
while x < 30.4:
    for s in (1, -1):
        y = s * (hw_at(JAW, x) - 0.3)
        bm_merge(tl, bm_cyl(0.2, 0.75, seg=8, r2=0.02, center=(x, y, 27.35 + 0.37), axis='Z'))
    x += 1.0
for v in tl.verts:
    v.co -= HINGE
teeth_l = to_obj("HERO_W2_dino_teeth_lower", tl, c, color=(0.9, 0.9, 0.86, 1), parent=jaw_rig)
fantasy += [teeth_u, teeth_l]

def plate(tab, x0, x1, z, th, inset, origin):
    secs = []
    for x in (x0, (x0 + x1) / 2, x1):
        hw = max(0.2, hw_at(tab, x) - inset)
        secs.append([Vector((x, -hw, z - th / 2)) - origin, Vector((x, hw, z - th / 2)) - origin,
                     Vector((x, hw, z + th / 2)) - origin, Vector((x, -hw, z + th / 2)) - origin])
    return bm_loft(secs)

pal = to_obj("HERO_W2_dino_palate", plate(SKULL, 20.6, 31.0, 27.46, 0.12, 0.45, NECK_PIVOT), c,
             color=C["mouth"], parent=head_rig)
tng = to_obj("HERO_W2_dino_tongue", plate(JAW, 20.8, 29.0, 27.2, 0.3, 0.7, HINGE), c,
             color=C["mouth"], parent=jaw_rig)
throat = to_obj("HERO_W2_dino_throat", bm_cyl(1.55, 5.3, seg=32, axis='X', center=(19.25, 0, 27.15), caps=True),
                c, color=C["black"], parent=head_rig)
for v in throat.data.vertices:
    v.co -= NECK_PIVOT
eyes = bmesh.new()
for s in (1, -1):
    bm_merge(eyes, bm_sphere(0.42, center=(24.0, s * 2.42, 30.8), u=16, v=8))
for v in eyes.verts:
    v.co -= NECK_PIVOT
eye = to_obj("HERO_W2_dino_eyes", eyes, c, color=(0.05, 0.05, 0.05, 1), parent=head_rig)
fantasy += [pal, tng, eye]

# anchors used by the camera path (children of the head so they follow the turn)
anc_mouth = empty("ANC_W2_mouth", c, loc=Vector((33.5, 0, 25.4)) - NECK_PIVOT, parent=head_rig, size=1)
anc_in = empty("ANC_W2_throat_in", c, loc=Vector((21.4, 0, 27.15)) - NECK_PIVOT, parent=head_rig, size=1)
anc_deep = empty("ANC_W2_throat_deep", c, loc=Vector((17.5, 0, 27.15)) - NECK_PIVOT, parent=head_rig, size=1)

# head turn + roar, jaw open
head_rig.rotation_mode = 'XYZ'
with bezier_keys():
    head_rig.rotation_euler = (0, 0, 0); head_rig.keyframe_insert("rotation_euler", frame=fr(5.6))
    head_rig.rotation_euler = (0, math.radians(-4), math.radians(35)); head_rig.keyframe_insert("rotation_euler", frame=fr(7.0))
    head_rig.rotation_euler = (0, math.radians(-9), math.radians(35)); head_rig.keyframe_insert("rotation_euler", frame=fr(7.5))
    head_rig.rotation_euler = (0, math.radians(-9), math.radians(35)); head_rig.keyframe_insert("rotation_euler", frame=fr(S2 + 0.2))
    jaw_rig.rotation_euler = (0, 0, 0); jaw_rig.keyframe_insert("rotation_euler", frame=fr(6.8))
    jaw_rig.rotation_euler = (0, math.radians(40), 0); jaw_rig.keyframe_insert("rotation_euler", frame=fr(7.6))
    jaw_rig.rotation_euler = (0, math.radians(40), 0); jaw_rig.keyframe_insert("rotation_euler", frame=fr(S2 + 0.2))

# world reveal: fantasy geometry black until the camera nears the tunnel exit
fade_in(fantasy, REVEAL_T0, REVEAL_T1)

result = {"objects": len(c.objects), "dino_ground": terrain_h(DINO_POS.x, DINO_POS.y)}
