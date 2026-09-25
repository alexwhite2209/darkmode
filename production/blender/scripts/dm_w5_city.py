# W5 — ARCHITECTURE / OFFICE / LOUNGE / OUTRO: through a glass wall into a night city, up a tower facade,
# through a window into an office, into a double-height lounge, out of a round window to the DARK MODE sign.
exec(open("E:\\Сайт\\dark-mode\\production\\blender\\scripts\\dm_common.py", encoding="utf-8").read())

sc = scene()
root = coll("DM_Oner_worlds")
c = fresh_coll("DM_W5_city", root)
o0 = OFF["W5"]
rnd = random.Random(55)

TY0, TY1 = 110.0, 160.0          # main tower y-range (south face at TY0)
TX = 25.0
FL = 87.6                         # office floor level (aligned with the slab bands)
OFF_CEIL = FL + 3.8               # office ceiling
LNG_CEIL = FL + 7.6               # double-height lounge ceiling
DOOR_Y = 136.5                    # glass partition office | lounge
RW_Z, RW_R = OFF_CEIL, 3.2        # round window (north face)
LOGO_O = Vector((0, 275, RW_Z))   # outro sign: O centre
TOP = 200.0

def box(name, sx, sy, sz, center, col, parent_coll=None):
    return to_obj(name, bm_box(sx, sy, sz, center=center), parent_coll or c, color=col, loc=o0)

# ---------------------------------------------------------------- the glass wall the camera enters through
# tone-matched to how the watch dial renders at the S4 switch (Workbench shades the two differently)
box("FX_W5_glass_wall", 40, 0.1, 34, (0, 0.05, 17), (0.69, 0.72, 0.765, 1))

# ---------------------------------------------------------------- ground, bay, skyline
g = bmesh.new(); bmesh.ops.create_grid(g, x_segments=1, y_segments=1, size=1500)
to_obj("ENV_W5_ground", g, c, color=C["street"], loc=o0 + Vector((0, 0, -0.05)))
box("ENV_W5_bay", 1800, 1310, 0.2, (0, 190 + 655, 0.14), (0.06, 0.07, 0.085, 1))
avenue = bmesh.new()
bm_add_box(avenue, 22, 110, 0.08, center=(0, 55, 0.04))
bm_add_box(avenue, 70, 30, 0.08, center=(0, 95, 0.04))
to_obj("ENV_W5_avenue", avenue, c, color=(0.17, 0.17, 0.18, 1), loc=o0)

towers = bmesh.new()
spots = [(-50, 25, 30, 26, 70), (52, 35, 28, 30, 95), (-56, 70, 34, 30, 120), (58, 80, 30, 28, 140),
         (-48, 108, 28, 26, 90), (60, 118, 32, 34, 110), (-95, 45, 40, 40, 60), (100, 60, 40, 36, 75),
         (-72, 165, 40, 40, 150), (80, 172, 44, 40, 165), (-130, 110, 50, 44, 100), (135, 125, 46, 50, 130),
         (-110, 205, 30, 30, 80), (115, 210, 30, 28, 95), (-180, 30, 60, 50, 50), (170, 20, 60, 50, 60)]
for (x, y, sx, sy, h) in spots:
    bm_add_box(towers, sx, sy, h, center=(x, y, h / 2))
to_obj("ENV_W5_towers", towers, c, color=C["building"], loc=o0)
bands = bmesh.new()
for (x, y, sx, sy, h) in spots:
    for z in range(8, int(h), 8):
        bm_add_box(bands, sx + 0.4, sy + 0.4, 0.5, center=(x, y, z))
to_obj("ENV_W5_tower_bands", bands, c, color=(0.42, 0.43, 0.45, 1), loc=o0)
far = bmesh.new()
for i in range(60):
    x = -900 + i * 30 + rnd.uniform(-8, 8)
    h = rnd.uniform(18, 70)
    bm_add_box(far, rnd.uniform(14, 28), rnd.uniform(14, 28), h, center=(x, 1250 + rnd.uniform(0, 150), h / 2))
to_obj("ENV_W5_far_shore", far, c, color=(0.16, 0.16, 0.18, 1), loc=o0)

# ---------------------------------------------------------------- main tower
T = coll("DM_W5_tower", c)
cxy = ((TY0 + TY1) / 2)
box("HERO_W5_tower_lower", 2 * TX, TY1 - TY0, FL - 0.3, (0, cxy, (FL - 0.3) / 2), C["glass"], T)
box("HERO_W5_tower_upper", 2 * TX, TY1 - TY0, TOP - LNG_CEIL - 0.3, (0, cxy, LNG_CEIL + 0.3 + (TOP - LNG_CEIL - 0.3) / 2), C["glass"], T)
box("ENV_W5_floor_slab", 2 * TX, TY1 - TY0, 0.3, (0, cxy, FL - 0.15), C["floor_int"], T)
box("ENV_W5_office_ceiling", 2 * TX, DOOR_Y - TY0, 0.3, (0, (TY0 + DOOR_Y) / 2, OFF_CEIL + 0.15), C["interior"], T)
box("ENV_W5_office_plenum", 2 * TX, DOOR_Y - TY0, LNG_CEIL - OFF_CEIL, (0, (TY0 + DOOR_Y) / 2, (OFF_CEIL + LNG_CEIL) / 2 + 0.15), C["glass"], T)
box("ENV_W5_lounge_ceiling", 2 * TX, TY1 - DOOR_Y, 0.3, (0, (DOOR_Y + TY1) / 2, LNG_CEIL + 0.15), C["interior"], T)
# office-level facade: south with the entry opening, east/west glass
H_OFF = OFF_CEIL - FL
for s in (-1, 1):
    box(f"ENV_W5_south_glass_{s}", TX - 1.5, 0.12, H_OFF, (s * (1.5 + (TX - 1.5) / 2), TY0, FL + H_OFF / 2), C["glass"], T)
    box(f"ENV_W5_side_glass_{s}", 0.12, TY1 - TY0, LNG_CEIL - FL, (s * TX, cxy, (FL + LNG_CEIL) / 2), C["glass"], T)
# north wall with the round window (boolean)
nw = box("ENV_W5_north_wall", 2 * TX, 0.5, LNG_CEIL - FL, (0, TY1 - 0.25, (FL + LNG_CEIL) / 2), C["interior"], T)
cut = to_obj("CUT_W5_round_window", bm_cyl(RW_R, 3.0, seg=96, axis='Y'), T, color=C["black"], loc=o0 + Vector((0, TY1 - 0.25, RW_Z)))
cut.hide_render = True
cut.display_type = 'WIRE'
bmod = add_mod(nw, 'BOOLEAN', operation='DIFFERENCE', solver='EXACT')
bmod.object = cut
ringw = to_obj("FX_W5_round_window_ring", bm_torus(RW_R + 0.05, 0.14, seg=96, rseg=10, axis='Y'), T, color=C["glow"],
               loc=o0 + Vector((0, TY1 - 0.52, RW_Z)))
# facade fins (south face, full height) + slab bands around the tower
fin = box("ENV_W5_fins_south", 0.35, 0.6, TOP, (1.5, TY0 - 0.3, TOP / 2), C["fin"], T)
add_mod(fin, 'ARRAY', count=8, use_relative_offset=False, use_constant_offset=True, constant_offset_displace=(3.0, 0, 0))
add_mod(fin, 'MIRROR', use_axis=(True, False, False))
finb = box("ENV_W5_fins_side", 0.6, 0.35, TOP, (TX + 0.3, TY0 + 1.5, TOP / 2), C["fin"], T)
add_mod(finb, 'ARRAY', count=16, use_relative_offset=False, use_constant_offset=True, constant_offset_displace=(0, 3.0, 0))
add_mod(finb, 'MIRROR', use_axis=(True, False, False))
ring = bmesh.new()
for (sx, sy, cx_, cy_) in ((2 * TX + 1.2, 0.6, 0, TY0 - 0.3),
                          (0.6, TY1 - TY0, -TX - 0.3, cxy), (0.6, TY1 - TY0, TX + 0.3, cxy)):
    bm_add_box(ring, sx, sy, 0.35, center=(cx_, cy_, 0.2))
band = to_obj("ENV_W5_slab_bands", ring, T, color=C["fin"], loc=o0 + Vector((0, 0, 3.8)))
add_mod(band, 'ARRAY', count=52, use_relative_offset=False, use_constant_offset=True, constant_offset_displace=(0, 0, 3.8))
# north face bands skip the lounge level so nothing crosses the round window
for nm, z0, cnt in (("low", 3.8, 23), ("high", LNG_CEIL - 0.2, 27)):
    nb = to_obj(f"ENV_W5_slab_bands_north_{nm}", bm_box(2 * TX + 1.2, 0.6, 0.35, center=(0, TY1 + 0.3, 0.2)), T,
                color=C["fin"], loc=o0 + Vector((0, 0, z0)))
    add_mod(nb, 'ARRAY', count=cnt, use_relative_offset=False, use_constant_offset=True, constant_offset_displace=(0, 0, 3.8))
# lit target window frame (helps the eye find the opening)
wf = bmesh.new()
bm_add_box(wf, 3.4, 0.25, 0.2, center=(0, TY0 - 0.2, FL - 0.1))
bm_add_box(wf, 3.4, 0.25, 0.2, center=(0, TY0 - 0.2, OFF_CEIL + 0.1))
to_obj("FX_W5_entry_frame", wf, T, color=C["glow"], loc=o0)

# ---------------------------------------------------------------- office interior (y TY0..DOOR_Y)
I = coll("DM_W5_interior", c)
desks = bmesh.new(); chairs = bmesh.new(); screens = bmesh.new(); lights = bmesh.new()
for side in (-1, 1):
    for row in range(4):
        for col in range(6):
            x = side * (2.6 + col * 3.4)
            y = TY0 + 4.5 + row * 5.0
            bm_add_box(desks, 1.6, 0.8, 0.06, center=(x, y, FL + 0.74))
            bm_add_box(desks, 1.5, 0.05, 0.7, center=(x, y + 0.38, FL + 0.37))
            bm_add_box(chairs, 0.55, 0.55, 0.45, center=(x, y - 0.75, FL + 0.23))
            bm_add_box(chairs, 0.5, 0.08, 0.55, center=(x, y - 1.02, FL + 0.72))
            bm_add_box(screens, 0.62, 0.04, 0.38, center=(x, y + 0.2, FL + 1.05))
for row in range(6):
    for col in range(5):
        bm_add_box(lights, 0.6, 2.4, 0.04, center=(-12 + col * 6, TY0 + 3 + row * 4.2, OFF_CEIL - 0.03))
to_obj("PRP_W5_desks", desks, I, color=C["wood"], loc=o0)
to_obj("PRP_W5_chairs", chairs, I, color=C["furniture"], loc=o0)
to_obj("PRP_W5_screens", screens, I, color=(0.12, 0.12, 0.13, 1), loc=o0)
to_obj("FX_W5_office_lights", lights, I, color=C["light"], loc=o0)
cols_ = bmesh.new()
for x in (-9.5, 9.5):
    for y in (TY0 + 8, TY0 + 18):
        bm_merge(cols_, bm_cyl(0.45, H_OFF, seg=20, center=(x, y, FL + H_OFF / 2)))
for x in (-9.5, 9.5):
    bm_merge(cols_, bm_cyl(0.55, LNG_CEIL - FL, seg=20, center=(x, DOOR_Y + 10, (FL + LNG_CEIL) / 2)))
to_obj("ENV_W5_columns", cols_, I, color=C["interior"], loc=o0)
part = bmesh.new()
bm_add_box(part, TX - 1.3, 0.1, H_OFF, center=(-(1.3 + (TX - 1.3) / 2), DOOR_Y, FL + H_OFF / 2))
bm_add_box(part, TX - 1.3, 0.1, H_OFF, center=((1.3 + (TX - 1.3) / 2), DOOR_Y, FL + H_OFF / 2))
to_obj("ENV_W5_glass_partition", part, I, color=C["glass"], loc=o0)
meet = bmesh.new()
for y in (TY0 + 3, TY0 + 12):
    bm_add_box(meet, 0.1, 7.5, H_OFF, center=(-19.5, y + 3.75, FL + H_OFF / 2))
    bm_add_box(meet, 5.5, 0.1, H_OFF, center=(-22.2, y, FL + H_OFF / 2))
to_obj("ENV_W5_meeting_rooms", meet, I, color=C["glass"], loc=o0)

# ---------------------------------------------------------------- lounge (y DOOR_Y..TY1, double height)
bar = bmesh.new()
bm_add_box(bar, 1.2, 13.0, 1.1, center=(8.6, DOOR_Y + 10.5, FL + 0.55))
bm_add_box(bar, 1.5, 13.4, 0.08, center=(8.6, DOOR_Y + 10.5, FL + 1.14))
bm_add_box(bar, 0.5, 15.0, 3.2, center=(TX - 0.6, DOOR_Y + 10.5, FL + 1.6))
to_obj("PRP_W5_bar", bar, I, color=C["wood"], loc=o0)
stools = bmesh.new(); bottles = bmesh.new()
for k in range(10):
    y = DOOR_Y + 4.8 + k * 1.25
    bm_merge(stools, bm_cyl(0.22, 0.08, seg=16, center=(7.2, y, FL + 0.78)))
    bm_merge(stools, bm_cyl(0.04, 0.74, seg=8, center=(7.2, y, FL + 0.37)))
for k in range(26):
    bm_merge(bottles, bm_cyl(0.06, 0.32, seg=8, center=(TX - 0.9, DOOR_Y + 3.8 + k * 0.52, FL + 1.8 + (k % 3) * 0.7)))
to_obj("PRP_W5_stools", stools, I, color=C["furniture"], loc=o0)
to_obj("PRP_W5_bottles", bottles, I, color=(0.7, 0.62, 0.45, 1), loc=o0)
sofa = bmesh.new(); tables = bmesh.new()
for (x, y) in ((-9, DOOR_Y + 5.5), (-9, DOOR_Y + 13.5), (-17, DOOR_Y + 9.5)):
    bm_add_box(sofa, 4.2, 1.0, 0.45, center=(x, y - 1.6, FL + 0.23))
    bm_add_box(sofa, 4.2, 0.3, 0.8, center=(x, y - 2.0, FL + 0.55))
    bm_add_box(sofa, 1.0, 3.2, 0.45, center=(x - 2.6, y, FL + 0.23))
    bm_add_box(sofa, 0.3, 3.2, 0.8, center=(x - 3.0, y, FL + 0.55))
    bm_merge(tables, bm_cyl(0.8, 0.42, seg=32, center=(x, y, FL + 0.21)))
to_obj("PRP_W5_sofas", sofa, I, color=C["furniture"], loc=o0)
to_obj("PRP_W5_tables", tables, I, color=C["wood"], loc=o0)
pend = bmesh.new(); wires = bmesh.new()
for (x, y, z) in ((8.6, DOOR_Y + 6, FL + 5.0), (8.6, DOOR_Y + 10, FL + 5.0), (8.6, DOOR_Y + 14, FL + 5.0),
                  (-9, DOOR_Y + 5.5, FL + 4.4), (-9, DOOR_Y + 13.5, FL + 4.4), (-17, DOOR_Y + 9.5, FL + 4.7),
                  (-3.5, DOOR_Y + 18, FL + 5.6), (3.5, DOOR_Y + 18, FL + 5.6)):
    bm_merge(pend, bm_sphere(0.34, center=(x, y, z), u=16, v=8))
    bm_merge(wires, bm_cyl(0.012, LNG_CEIL - z, seg=6, center=(x, y, (z + LNG_CEIL) / 2)))
to_obj("FX_W5_pendants", pend, I, color=C["light"], loc=o0)
to_obj("PRP_W5_wires", wires, I, color=(0.1, 0.1, 0.1, 1), loc=o0)
plants = bmesh.new()
for (x, y) in ((-4.5, DOOR_Y + 2.2), (4.5, DOOR_Y + 2.2), (-22, DOOR_Y + 21), (21, DOOR_Y + 21)):
    bm_merge(plants, bm_cyl(0.45, 0.8, seg=16, center=(x, y, FL + 0.4)))
    bm_merge(plants, bm_ico(0.9, sub=2, center=(x, y, FL + 1.7)))
to_obj("PRP_W5_plants", plants, I, color=C["tree"], loc=o0)
rug = box("PRP_W5_rug", 8, 10, 0.02, (0, DOOR_Y + 12, FL + 0.01), (0.36, 0.33, 0.3, 1), I)

# ---------------------------------------------------------------- outro sign over the bay
S = coll("DM_W5_sign", c)
letters, disk, ringO, geom = build_wordmark(S, "HERO_W5_sign", 8.0, o0 + LOGO_O, depth=1.4)
ringO.color = (1.0, 0.62, 0.22, 1)
_rO = geom["O"]["r"] * 8.0
ringO.data = to_obj("_tmp_ring", bm_torus(_rO * 1.01, 0.30, seg=128, rseg=14, axis='Y', center=(0, 0.05, 0)), S).data
bpy.data.objects.remove(bpy.data.objects["_tmp_ring"], do_unlink=True)

result = {"objects": len(c.all_objects)}
