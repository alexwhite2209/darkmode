# DARK MODE — greybox oner, shared helpers and constants.
# Loaded by every build script:  exec(open(COMMON, encoding="utf-8").read())
import bpy, bmesh, math, random, json
from mathutils import Vector, Matrix, Euler, Quaternion, noise

SCENE_NAME = "DM_Oner"
FPS = 24
F_START, F_END = 1, 720                       # 30 s
BASE = "E:\\Сайт\\dark-mode\\production"
SCRIPTS = BASE + "\\blender\\scripts"
GEOM_JSON = BASE + "\\brand\\wordmark-geometry.json"

# every world lives in its own region; the camera crosses between them only
# through fully-covered frames (black O, black throat, hub cap, crystal)
OFF = {
    "W1": Vector((0, 0, 0)),        # hero: DARK MODE, eclipse O, planet, rocks
    "W2": Vector((0, 20000, 0)),    # portal tunnel + fantasy valley + dinosaur
    "W3": Vector((0, 40000, 0)),    # car tunnel + drift track
    "W4": Vector((0, 60000, 0)),    # product studio (watch)
    "W5": Vector((0, 80000, 0)),    # city, office, lounge, outro logo
}

# switch times (seconds). frame = 1 + t*FPS
# S1 through the black O, S2 out of the throat into the drift smoke, S3 wheel cap -> studio, S4 dial -> glass wall
S1, S2, S3, S4 = 2.8, 9.0, 14.0, 17.6
T_END = 30.0

def fr(t):
    return 1 + t * FPS

# ---------------------------------------------------------------- colours (Workbench OBJECT colour)
C = {
    "black":      (0.0, 0.0, 0.0, 1),
    "hero":       (0.80, 0.80, 0.82, 1),    # chrome letters / hero subjects
    "ring":       (1.00, 0.46, 0.10, 1),    # eclipse ring / portal light
    "glow":       (1.00, 0.62, 0.25, 1),
    "light":      (1.00, 0.97, 0.90, 1),    # practical lights, lit windows
    "ground":     (0.075, 0.075, 0.08, 1),
    "rock":       (0.20, 0.20, 0.21, 1),
    "rock_far":   (0.13, 0.13, 0.14, 1),
    "planet":     (0.30, 0.30, 0.32, 1),
    "terrain":    (0.36, 0.37, 0.36, 1),
    "mountain":   (0.28, 0.29, 0.30, 1),
    "island":     (0.42, 0.42, 0.41, 1),
    "tree":       (0.30, 0.32, 0.30, 1),
    "trunk":      (0.25, 0.24, 0.23, 1),
    "water":      (0.20, 0.23, 0.26, 1),
    "dino":       (0.62, 0.62, 0.60, 1),
    "mouth":      (0.05, 0.03, 0.03, 1),
    "car":        (0.66, 0.67, 0.70, 1),
    "glass_car":  (0.16, 0.17, 0.19, 1),
    "tyre":       (0.05, 0.05, 0.05, 1),
    "rim":        (0.55, 0.56, 0.58, 1),
    "cap":        (0.58, 0.58, 0.60, 1),    # wheel centre cap == W4 portal plane
    "tunnel":     (0.14, 0.14, 0.15, 1),
    "asphalt":    (0.10, 0.10, 0.11, 1),
    "barrier":    (0.45, 0.45, 0.46, 1),
    "smoke":      (0.72, 0.72, 0.74, 1),
    "head_on":    (1.00, 1.00, 0.93, 1),
    "tail_on":    (0.95, 0.12, 0.08, 1),
    "off":        (0.10, 0.10, 0.10, 1),
    "watch":      (0.70, 0.71, 0.73, 1),
    "dial":       (0.22, 0.23, 0.25, 1),
    "crystal":    (0.30, 0.33, 0.37, 1),    # watch crystal == W5 glass wall
    "strap":      (0.12, 0.12, 0.13, 1),
    "studio":     (0.06, 0.06, 0.065, 1),
    "building":   (0.32, 0.33, 0.35, 1),
    "glass":      (0.24, 0.26, 0.30, 1),
    "fin":        (0.55, 0.56, 0.58, 1),
    "street":     (0.12, 0.12, 0.13, 1),
    "interior":   (0.52, 0.51, 0.49, 1),
    "furniture":  (0.40, 0.39, 0.38, 1),
    "wood":       (0.46, 0.40, 0.34, 1),
    "floor_int":  (0.30, 0.29, 0.28, 1),
}

# ---------------------------------------------------------------- scene / collections
def scene():
    sc = bpy.data.scenes.get(SCENE_NAME)
    if sc is None:
        sc = bpy.data.scenes.new(SCENE_NAME)
    return sc

def coll(name, parent=None):
    sc = scene()
    c = bpy.data.collections.get(name)
    if c is None:
        c = bpy.data.collections.new(name)
    par = parent if parent is not None else sc.collection
    if c.name not in par.children.keys():
        par.children.link(c)
    return c

def _remove_data(data):
    try:
        if data is None or data.users > 0:
            return
        if isinstance(data, bpy.types.Mesh):
            bpy.data.meshes.remove(data)
        elif isinstance(data, bpy.types.Curve):
            bpy.data.curves.remove(data)
        elif isinstance(data, bpy.types.Camera):
            bpy.data.cameras.remove(data)
        elif isinstance(data, bpy.types.Light):
            bpy.data.lights.remove(data)
    except Exception:
        pass

def clear_coll(c):
    """Delete every object that lives in collection c (and its children). Only DM_* collections are passed here."""
    for ch in list(c.children):
        clear_coll(ch)
        bpy.data.collections.remove(ch)
    for o in list(c.objects):
        d = o.data
        if o.animation_data:
            o.animation_data_clear()
        bpy.data.objects.remove(o, do_unlink=True)
        _remove_data(d)

def fresh_coll(name, parent=None):
    c = coll(name, parent)
    clear_coll(c)
    return c

# ---------------------------------------------------------------- keyframes
class linear_keys:
    """New keys use LINEAR interpolation inside this block (restores the user preference after)."""
    def __enter__(self):
        self.p = bpy.context.preferences.edit
        self.old = self.p.keyframe_new_interpolation_type
        self.p.keyframe_new_interpolation_type = 'LINEAR'
    def __exit__(self, *a):
        self.p.keyframe_new_interpolation_type = self.old

class const_keys(linear_keys):
    def __enter__(self):
        self.p = bpy.context.preferences.edit
        self.old = self.p.keyframe_new_interpolation_type
        self.p.keyframe_new_interpolation_type = 'CONSTANT'

class bezier_keys(linear_keys):
    def __enter__(self):
        self.p = bpy.context.preferences.edit
        self.old = self.p.keyframe_new_interpolation_type
        self.p.keyframe_new_interpolation_type = 'BEZIER'

def key_color(o, frame, rgba):
    o.color = rgba
    o.keyframe_insert("color", frame=int(round(frame)))

def fade_in(objs, t0, t1, start=(0, 0, 0, 1)):
    """Object colour black until t0, target colour at t1 ("lights on")."""
    with linear_keys():
        for o in objs:
            tgt = tuple(o.color)
            key_color(o, fr(t0), start)
            key_color(o, fr(t1), tgt)

def fade_out(objs, t0, t1, end=(0, 0, 0, 1)):
    with linear_keys():
        for o in objs:
            src = tuple(o.color)
            key_color(o, fr(t0), src)
            key_color(o, fr(t1), end)

def key_scale_pop(o, t_on, s=1.0):
    """invisible (scale 0) before t_on"""
    with const_keys():
        o.scale = (0, 0, 0); o.keyframe_insert("scale", frame=fr(t_on) - 1)
        o.scale = (s, s, s); o.keyframe_insert("scale", frame=fr(t_on))

# ---------------------------------------------------------------- mesh builders (bmesh)
def to_obj(name, bm, c, color=(0.5, 0.5, 0.5, 1), loc=(0, 0, 0), rot=(0, 0, 0), scale=(1, 1, 1),
           parent=None, smooth=False):
    me = bpy.data.meshes.new(name)
    bm.normal_update()
    bm.to_mesh(me)
    bm.free()
    if smooth:
        for p in me.polygons:
            p.use_smooth = True
    o = bpy.data.objects.new(name, me)
    c.objects.link(o)
    if parent is not None:
        o.parent = parent
    o.location = loc
    o.rotation_euler = rot
    o.scale = scale
    o.color = color
    return o

def empty(name, c, loc=(0, 0, 0), rot=(0, 0, 0), parent=None, size=1.0):
    o = bpy.data.objects.new(name, None)
    c.objects.link(o)
    o.empty_display_size = size
    if parent is not None:
        o.parent = parent
    o.location = loc
    o.rotation_euler = rot
    return o

def bm_box(sx, sy, sz, center=(0, 0, 0)):
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    for v in bm.verts:
        v.co = Vector((v.co.x * sx + center[0], v.co.y * sy + center[1], v.co.z * sz + center[2]))
    return bm

def bm_add_box(bm, sx, sy, sz, center=(0, 0, 0), rotz=0.0):
    """append a box into an existing bmesh"""
    tmp = bm_box(sx, sy, sz)
    if rotz:
        bmesh.ops.rotate(tmp, verts=tmp.verts, cent=(0, 0, 0), matrix=Matrix.Rotation(rotz, 3, 'Z'))
    bmesh.ops.translate(tmp, verts=tmp.verts, vec=Vector(center))
    me = bpy.data.meshes.new("_tmp")
    tmp.to_mesh(me); tmp.free()
    bm.from_mesh(me)
    bpy.data.meshes.remove(me)

def bm_merge(bm, other):
    me = bpy.data.meshes.new("_tmp")
    other.to_mesh(me); other.free()
    bm.from_mesh(me)
    bpy.data.meshes.remove(me)

def _axis(bm, axis):
    if axis == 'Y':
        bmesh.ops.rotate(bm, verts=bm.verts, cent=(0, 0, 0), matrix=Matrix.Rotation(math.radians(90), 3, 'X'))
    elif axis == 'X':
        bmesh.ops.rotate(bm, verts=bm.verts, cent=(0, 0, 0), matrix=Matrix.Rotation(math.radians(90), 3, 'Y'))

def bm_cyl(r, depth, seg=32, r2=None, center=(0, 0, 0), axis='Z', caps=True):
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=caps, cap_tris=False, segments=seg, radius1=r,
                          radius2=(r if r2 is None else r2), depth=depth)
    _axis(bm, axis)
    bmesh.ops.translate(bm, verts=bm.verts, vec=Vector(center))
    return bm

def bm_sphere(r, center=(0, 0, 0), u=32, v=16, scale=(1, 1, 1)):
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=u, v_segments=v, radius=r)
    for vt in bm.verts:
        vt.co = Vector((vt.co.x * scale[0], vt.co.y * scale[1], vt.co.z * scale[2])) + Vector(center)
    return bm

def bm_ico(r, sub=2, center=(0, 0, 0)):
    bm = bmesh.new()
    bmesh.ops.create_icosphere(bm, subdivisions=sub, radius=r)
    bmesh.ops.translate(bm, verts=bm.verts, vec=Vector(center))
    return bm

def bm_torus(R, r, seg=64, rseg=12, axis='Z', center=(0, 0, 0)):
    bm = bmesh.new()
    rings = []
    for i in range(seg):
        a = 2 * math.pi * i / seg
        ring = []
        for j in range(rseg):
            b = 2 * math.pi * j / rseg
            ring.append(bm.verts.new(((R + r * math.cos(b)) * math.cos(a),
                                      (R + r * math.cos(b)) * math.sin(a),
                                      r * math.sin(b))))
        rings.append(ring)
    for i in range(seg):
        for j in range(rseg):
            bm.faces.new((rings[i][j], rings[(i + 1) % seg][j],
                          rings[(i + 1) % seg][(j + 1) % rseg], rings[i][(j + 1) % rseg]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    _axis(bm, axis)
    bmesh.ops.translate(bm, verts=bm.verts, vec=Vector(center))
    return bm

def bm_tube(R_out, R_in, depth, seg=64, axis='Z', center=(0, 0, 0)):
    """flat ring (washer) with thickness"""
    bm = bmesh.new()
    h = depth / 2
    outer_b, outer_t, inner_b, inner_t = [], [], [], []
    for i in range(seg):
        a = 2 * math.pi * i / seg
        ca, sa = math.cos(a), math.sin(a)
        outer_b.append(bm.verts.new((R_out * ca, R_out * sa, -h)))
        outer_t.append(bm.verts.new((R_out * ca, R_out * sa, h)))
        inner_b.append(bm.verts.new((R_in * ca, R_in * sa, -h)))
        inner_t.append(bm.verts.new((R_in * ca, R_in * sa, h)))
    for i in range(seg):
        j = (i + 1) % seg
        bm.faces.new((outer_b[i], outer_b[j], outer_t[j], outer_t[i]))
        bm.faces.new((inner_t[i], inner_t[j], inner_b[j], inner_b[i]))
        bm.faces.new((outer_t[i], outer_t[j], inner_t[j], inner_t[i]))
        bm.faces.new((inner_b[i], inner_b[j], outer_b[j], outer_b[i]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    _axis(bm, axis)
    bmesh.ops.translate(bm, verts=bm.verts, vec=Vector(center))
    return bm

def bm_extrude_poly(pts, depth, scale=1.0, xoff=0.0, zoff=0.0, y0=0.0):
    """2D polygon (x, y-up) placed in the XZ plane facing -Y, extruded towards +Y."""
    bm = bmesh.new()
    vs = [bm.verts.new((xoff + x * scale, y0, zoff + y * scale)) for (x, y) in pts]
    f = bm.faces.new(vs)
    ret = bmesh.ops.extrude_face_region(bm, geom=[f])
    ev = [e for e in ret["geom"] if isinstance(e, bmesh.types.BMVert)]
    bmesh.ops.translate(bm, verts=ev, vec=(0, depth, 0))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return bm

def bm_loft(sections, cap=True):
    """sections: list of lists of Vector (same count), lofted in order"""
    bm = bmesh.new()
    rings = [[bm.verts.new(p) for p in sec] for sec in sections]
    n = len(sections[0])
    for a, b in zip(rings[:-1], rings[1:]):
        for i in range(n):
            j = (i + 1) % n
            bm.faces.new((a[i], a[j], b[j], b[i]))
    if cap:
        bm.faces.new(list(reversed(rings[0])))
        bm.faces.new(rings[-1])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return bm

def rock_bm(seed, r=1.0, sx=1.0, sy=1.0, sz=1.0, jag=0.35, sub=2):
    rnd = random.Random(seed)
    bm = bmesh.new()
    bmesh.ops.create_icosphere(bm, subdivisions=sub, radius=r)
    off = Vector((rnd.uniform(0, 100), rnd.uniform(0, 100), rnd.uniform(0, 100)))
    for v in bm.verts:
        n = noise.noise(v.co * 1.7 / r + off)
        k = 1.0 + jag * n + rnd.uniform(-jag, jag) * 0.35
        v.co = Vector((v.co.x * k * sx, v.co.y * k * sy, v.co.z * k * sz))
    # flatten the base so rocks sit on the ground
    for v in bm.verts:
        if v.co.z < -0.15 * r * sz:
            v.co.z = -0.15 * r * sz
    return bm

def add_mod(o, kind, **kw):
    m = o.modifiers.new(kind.lower(), kind)
    for k, v in kw.items():
        setattr(m, k, v)
    return m

def load_wordmark():
    with open(GEOM_JSON, encoding="utf-8") as f:
        return json.load(f)

def build_wordmark(c, prefix, scale, origin, depth, parent=None, ring_color=None, letter_color=None):
    """DARK MODE letters + eclipse O. origin = world position of the O centre.
    Letters face -Y (front plane at origin.y), extruded towards +Y."""
    g = load_wordmark()
    ox, oy, oz = origin
    objs = []
    for key, pts in g["letters"].items():
        bm = bm_extrude_poly(pts, depth, scale=scale, xoff=0, zoff=0, y0=0)
        o = to_obj(f"{prefix}_letter_{key}", bm, c, color=letter_color or C["hero"],
                   loc=(ox, oy, oz), parent=parent)
        objs.append(o)
    rO = g["O"]["r"] * scale
    disk = to_obj(f"{prefix}_O_disk", bm_cyl(rO * 0.985, 0.30 * scale / 8, seg=96, axis='Y',
                  center=(0, 0.25 * scale / 8, 0)), c, color=C["black"], loc=(ox, oy, oz), parent=parent)
    ring = to_obj(f"{prefix}_O_ring", bm_torus(rO * 1.01, 0.022 * scale, seg=128, rseg=12, axis='Y',
                  center=(0, 0.05 * scale / 8, 0)), c, color=ring_color or C["ring"], loc=(ox, oy, oz), parent=parent)
    return objs, disk, ring, g

def look_quat(pos, target, up=Vector((0, 0, 1)), roll_deg=0.0):
    f = (Vector(target) - Vector(pos)).normalized()
    upv = Vector(up)
    if abs(f.dot(upv.normalized())) > 0.995:
        upv = Vector((0, 1, 0)) if abs(f.z) > 0.9 else Vector((0, 0, 1))
    r = f.cross(upv).normalized()
    u = r.cross(f).normalized()
    m = Matrix((r, u, -f)).transposed()      # columns: X=right, Y=up, Z=-forward
    q = m.to_quaternion()
    if roll_deg:
        q = Quaternion(f, math.radians(-roll_deg)) @ q
    return q

# ---------------------------------------------------------------- spline (time-parametrised Catmull-Rom / Hermite)
class Track:
    """keys: list of (t, value) where value is Vector or float. Optional start/end velocity."""
    def __init__(self, keys, v0=None, v1=None):
        self.k = sorted(keys, key=lambda kv: kv[0])
        self.v0, self.v1 = v0, v1
        n = len(self.k)
        self.m = []
        for i in range(n):
            t, p = self.k[i]
            if i == 0:
                m = self.v0 if self.v0 is not None else (self._sub(self.k[1][1], p) / (self.k[1][0] - t) if n > 1 else p * 0)
            elif i == n - 1:
                m = self.v1 if self.v1 is not None else self._sub(p, self.k[i - 1][1]) / (t - self.k[i - 1][0])
            else:
                m = self._sub(self.k[i + 1][1], self.k[i - 1][1]) / (self.k[i + 1][0] - self.k[i - 1][0])
            self.m.append(m)
    @staticmethod
    def _sub(a, b):
        return a - b
    def __call__(self, t):
        k = self.k
        if t <= k[0][0]:
            return k[0][1] + self.m[0] * (t - k[0][0]) if isinstance(k[0][1], Vector) and self.v0 is not None else k[0][1]
        if t >= k[-1][0]:
            return k[-1][1]
        for i in range(len(k) - 1):
            t0, p0 = k[i]
            t1, p1 = k[i + 1]
            if t0 <= t <= t1:
                h = t1 - t0
                s = (t - t0) / h
                h00 = 2 * s ** 3 - 3 * s ** 2 + 1
                h10 = s ** 3 - 2 * s ** 2 + s
                h01 = -2 * s ** 3 + 3 * s ** 2
                h11 = s ** 3 - s ** 2
                return p0 * h00 + self.m[i] * (h10 * h) + p1 * h01 + self.m[i + 1] * (h11 * h)
        return k[-1][1]

def smooth01(x):
    x = max(0.0, min(1.0, x))
    return x * x * (3 - 2 * x)

def smoother01(x):
    x = max(0.0, min(1.0, x))
    return x * x * x * (x * (x * 6 - 15) + 10)

def lerp(a, b, s):
    return a + (b - a) * s
