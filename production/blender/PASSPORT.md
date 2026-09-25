# Scene Passport — DM_Oner (greybox)

```text
SCENE
- intent: серый черновик (greybox) ролика «эволюция сайтов» для сайта DARK MODE; точная камера и тайминг,
  одним непрерывным кадром; дальше — прогон через Higgsfield
- deliverable: 30 с, 720 кадров; MP4 16:9 и 9:16 + PNG-секвенции; для сайта — версии с частым ключевым кадром
- units: metres; axes: right-handed Z-up
- render: Workbench (object colour, studio light, shadows, cavity), 1280x720 / 720x1280, 24 fps, 1–720
- dynamic: yes (камера + голова/челюсть динозавра + машина/колёса/дым + секундная стрелка)

HIERARCHY
- collections: DM_Oner_worlds/{DM_W1_hero, DM_W2_fantasy, DM_W3_auto(+DM_W3_smoke), DM_W4_product,
  DM_W5_city(+tower, interior, sign)}, DM_Oner_camera
- worlds live in separate regions: W1 (0,0,0), W2 (0,20k,0), W3 (0,40k,0), W4 (0,60k,0), W5 (0,80k,0)
- rigs: RIG_cam -> CAM_desktop, CAM_mobile; RIG_W2_dino -> RIG_W2_dino_head -> RIG_W2_dino_jaw;
  RIG_W3_car -> RIG_W3_wheel_*; RIG_W4_watch -> RIG_W4_hand_*
- protected existing objects: сцена "Scene" (Cube, Light, Camera) не тронута; всё новое — в сцене DM_Oner

ASSETS (all [BLOCK], fidelity = blockout/stylized, без генерации и без кредитов)
- A01 wordmark DARK MODE | BLOCK | stylized | ~39x1.4x17.5 m | O centre (0,0,6.24) | буквы выдавлены из
  векторизованного логотипа (production/brand/wordmark-geometry.json)
- A02 eclipse O: чёрный диск r 5.7 m + оранжевое кольцо | BLOCK | portal #1
- A03 planet r 500 m, rocks, ridge, wet ground | BLOCK | blockout
- A04 portal tube r 8 m + 13 колец | BLOCK
- A05 fantasy terrain 6x6 km, 10 floating islands, 24 giant trees, waterfall, river, 10 mountains | BLOCK
- A06 T-rex (skin modifier), 114 m long, head rig + jaw rig, throat (black) | BLOCK | stylized | portal #2
- A07 night track: hairpin r 32 m, kerbs, tyre wall, poles, grandstand, skyline | BLOCK
- A08 sports car 4.6x1.84x1.22 m (lofted body), 4 wheel rigs, head/tail lights, wing | BLOCK | stylized
- A09 tyre smoke puffs (44), dark smoke cloud at the entry | BLOCK
- A10 watch x25 scale (case r 0.53 m), bezel, dial, indices, hands, crown, lugs, strap | BLOCK | stylized
- A11 city: main tower 50x50x200 m (fins, slab bands), 16 towers, bay, far shore | BLOCK
- A12 office floor (48 desks, chairs, screens, columns, lights) + double-height lounge (bar, stools, sofas,
  pendants, plants, round window r 3.2 m) | BLOCK
- A13 outro sign = A01 over the bay, O centre (0,275,91.4) in W5

SHOT
- active camera: CAM_desktop (CAM_mobile for 9:16); one baked path, 720 keys
- lens 22–50 mm по ходу (портал 24, фэнтези 28–30, дрифт 35, часы 50, офис/лаунж 22, финал 35)

LOOK
- greybox: серые тона по ролям (герои светлее, окружение темнее), акценты: оранжевое кольцо O и свет,
  белые фары/лампы, красный стоп-сигнал; фон — цвет мира (чёрный / дневное небо фэнтези / ночь)

MOTION — см. TIMING.md (16 битов, 4 перехода сквозь закрытые кадры)

ACCEPTANCE
- structural: 5 миров, камера 720 кадров, маркеры на таймлайне
- motion: контактные листы 16:9 и 9:16 просмотрены; стыки S1 (f68/69), S2 (f216/217), S3 (f336/337),
  S4 (f423/424) — кадры полностью закрыты, тон совпадает
- visual: blockout-уровень по брифу («простые серые формы»)
```
