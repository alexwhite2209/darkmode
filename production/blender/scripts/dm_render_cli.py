# Background render of the greybox oner.
#   blender -b <checkpoint.blend> --python dm_render_cli.py -- desktop|mobile <out_dir>
import bpy, sys, os
argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
variant = argv[0] if argv else "desktop"
out_dir = argv[1] if len(argv) > 1 else os.path.join(os.path.dirname(bpy.data.filepath), "..", "renders", variant)
os.makedirs(out_dir, exist_ok=True)
sc = bpy.data.scenes["DM_Oner"]
bpy.context.window_manager  # noqa
sc.camera = bpy.data.objects["CAM_desktop" if variant == "desktop" else "CAM_mobile"]
sc.render.engine = 'BLENDER_WORKBENCH'
if variant == "desktop":
    sc.render.resolution_x, sc.render.resolution_y = 1280, 720
else:
    sc.render.resolution_x, sc.render.resolution_y = 720, 1280
sc.render.resolution_percentage = 100
sc.render.image_settings.file_format = 'PNG'
sc.render.image_settings.color_mode = 'RGB'
sc.render.filepath = os.path.join(out_dir, "f_")
sc.frame_start, sc.frame_end = 1, 720
print("RENDER", variant, sc.camera.name, sc.render.resolution_x, sc.render.resolution_y, out_dir, flush=True)
bpy.ops.render.render(animation=True, scene=sc.name)
print("DONE", variant, flush=True)
