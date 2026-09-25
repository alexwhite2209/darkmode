# Camera rig: RIG_cam (animated) -> CAM_desktop (16:9) + CAM_mobile (9:16, sensor fit horizontal)
exec(open("E:\\Сайт\\dark-mode\\production\\blender\\scripts\\dm_common.py", encoding="utf-8").read())

sc = scene()
c = coll("DM_Oner_camera")

def get_cam(name, lens):
    o = bpy.data.objects.get(name)
    if o is None:
        d = bpy.data.cameras.new(name)
        o = bpy.data.objects.new(name, d)
        c.objects.link(o)
    o.data.lens = lens
    o.data.sensor_width = 36.0
    o.data.sensor_fit = 'HORIZONTAL'
    o.data.clip_start = 0.05
    o.data.clip_end = 6000
    return o

rig = bpy.data.objects.get("RIG_cam")
if rig is None:
    rig = empty("RIG_cam", c, size=2.0)
rig.rotation_mode = 'QUATERNION'
cd = get_cam("CAM_desktop", 35)
cm = get_cam("CAM_mobile", 70)
for cam in (cd, cm):
    cam.parent = rig
    cam.location = (0, 0, 0)
    cam.rotation_euler = (0, 0, 0)
sc.camera = cd
result = {"rig": rig.name, "cams": [cd.name, cm.name]}
