# Render a list of frames (FRAMES, set by the caller) at low res into renders/contact/<cam>/NNNN.png
exec(open("E:\\Сайт\\dark-mode\\production\\blender\\scripts\\dm_common.py", encoding="utf-8").read())
import os
sc = scene()
cam_name = globals().get("CAM", "CAM_desktop")
res = globals().get("RES", (480, 270))
outdir = BASE + "\\blender\\renders\\contact\\" + cam_name
os.makedirs(outdir, exist_ok=True)
old = (sc.camera, sc.render.resolution_x, sc.render.resolution_y, sc.render.filepath, sc.frame_current)
sc.camera = bpy.data.objects[cam_name]
sc.render.resolution_x, sc.render.resolution_y = res
sc.render.image_settings.file_format = 'PNG'
done = []
for f in FRAMES:
    sc.frame_set(f)
    sc.render.filepath = os.path.join(outdir, f"{f:04d}.png")
    bpy.ops.render.render(write_still=True, scene=sc.name)
    done.append(f)
sc.camera, sc.render.resolution_x, sc.render.resolution_y, sc.render.filepath, _f = old
sc.frame_set(old[4])
result = {"rendered": len(done), "dir": outdir}
