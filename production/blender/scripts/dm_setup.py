# Scene + render setup for the greybox oner (Workbench, object colours).
exec(open("E:\\Сайт\\dark-mode\\production\\blender\\scripts\\dm_common.py", encoding="utf-8").read())

sc = scene()
bpy.context.window.scene = sc
sc.render.fps = FPS
sc.render.fps_base = 1.0
sc.frame_start, sc.frame_end = F_START, F_END
sc.unit_settings.system = 'METRIC'
sc.unit_settings.scale_length = 1.0

r = sc.render
r.engine = 'BLENDER_WORKBENCH'
r.resolution_x, r.resolution_y, r.resolution_percentage = 1280, 720, 100
r.film_transparent = False
try:
    sc.view_settings.view_transform = 'Standard'
    sc.view_settings.look = 'None'
except Exception:
    pass

sh = sc.display.shading
sh.light = 'STUDIO'
sh.color_type = 'OBJECT'
sh.show_shadows = True
sh.shadow_intensity = 0.45
sh.show_cavity = True
sh.cavity_type = 'BOTH'
sh.cavity_ridge_factor = 0.6
sh.cavity_valley_factor = 1.0
sh.curvature_ridge_factor = 0.5
sh.curvature_valley_factor = 0.7
sh.show_specular_highlight = False
sh.show_object_outline = False
sh.use_world_space_lighting = True
sh.studiolight_rotate_z = math.radians(-35)
sc.display.light_direction = (0.45, -0.35, 0.82)
sc.display.shadow_shift = 0.05
sc.display.shadow_focus = 0.0
sc.display.render_aa = '8'

w = bpy.data.worlds.get("DM_World") or bpy.data.worlds.new("DM_World")
w.color = (0, 0, 0)
sc.world = w

root = coll("DM_Oner_worlds")
result = {"scene": sc.name, "engine": r.engine, "window_scene": bpy.context.window.scene.name}
