# DARK MODE — сайт студии

Next.js 16 (App Router, TypeScript), Lenis, свой движок анимаций на одном requestAnimationFrame.
Главный экран — 30-секундный ролик «одним кадром», которым управляет скролл.

## Запуск

```bash
npm install
npm run dev        # http://localhost:3100
npm run build && npm start
```

## Где что менять

| Что | Файл |
|---|---|
| Контакты, домен, пути к видео | `src/data/site.ts` (домен также через `NEXT_PUBLIC_SITE_URL`) |
| Подписи миров в ролике и их тайминг | `src/data/chapters.ts` (секунды ролика) |
| Проекты портфолио | `src/data/projects.json` (+ скриншоты в `public/images/projects/<slug>/`) |
| Направления «Что мы делаем» | `src/data/capabilities.ts` |
| Этапы «Процесс» | `src/data/process.ts` |
| Новости, статьи, гайды | `src/data/media.ts` |
| Телефон, «Написать», Telegram | `src/data/site.ts` → `contacts` (форм на сайте нет: «Обсудить проект» звонит, на компьютере ведёт к финалу с контактами) |
| Меню: Новости / Статьи / Гайды | отдельные страницы `/news`, `/articles`, `/guides` (`src/app/[kind]`) |

Контент отделён от интерфейса: страницы читают данные только через `src/services/content.ts`.
Для CMS достаточно заменить тела функций на запросы — UI не меняется. API уже есть:
`/api/news`, `/api/articles`, `/api/guides`, `/api/projects`, `/api/content`.

## Кадры вместо видео

Ролик по скроллу показывается последовательностью кадров на canvas (`src/animations/frame-scrub.ts`):
`public/frames/desktop` (1600×900) и `public/frames/mobile` (720×1280), все 24 кадра в секунду, каждый кадр целиком,
делает `python production/scripts/make_frames.py`. После замены кадров поднять `frames.version` в `src/data/site.ts`.
Вернуть прежний способ (mp4) — в `src/data/site.ts` написать `scrub: "video"`.
Копия сайта до перехода на кадры: `production/backup/site_video_2026-09-25`.

## Замена ролика (после Higgsfield)

1. Положить финальные ролики: `public/video/hero-desktop.mp4` (16:9) и `public/video/hero-mobile.mp4` (9:16).
   Кодировать с частым ключевым кадром, иначе скролл будет дёргаться:
   ```bash
   ffmpeg -i final-16x9.mp4 -c:v libx264 -preset slow -crf 20 -g 8 -keyint_min 8 -sc_threshold 0 -bf 0 -pix_fmt yuv420p -movflags +faststart -an public/video/hero-desktop.mp4
   ```
   Финал страницы — первые 2,8 с ролика, их сайт проигрывает задом наперёд (выход из буквы O):
   ```bash
   ffmpeg -i public/video/hero-desktop.mp4 -t 2.8 -c:v libx264 -crf 21 -g 8 -keyint_min 8 -sc_threshold 0 -bf 0 -pix_fmt yuv420p -movflags +faststart -an public/video/outro-desktop.mp4
   ```
   (то же для `outro-mobile.mp4`). Фон после ролика — `public/video/ambient.mp4`: космос вперёд + назад одним файлом, чтобы петля шла без скачка.
2. Постеры (первый кадр): `public/images/hero-poster-desktop.jpg`, `hero-poster-mobile.jpg`.
3. Кадры миров для превью: `python production/scripts/extract_stills.py` (берёт кадры из рендера).
4. Если длина ролика изменится — поправить `video.duration` в `src/data/site.ts` и секунды в `chapters.ts`.

## Структура

```
src/
  app/          страницы, SEO (robots, sitemap, metadata), API
  sections/     CinematicHero, Projects, Capabilities, Process, Media, Contact
  components/   Header, Rail, Preloader, Cursor, ContactDialog, Magnetic, Logo…
  animations/   ticker (один RAF), scroll (Lenis + сцены), spring, parallax, reveal, pointer, video-scrub
  hooks/        useTicker, useScrollScene, useParallax, useMediaQuery…
  lib/          math, store
  data/         весь контент
  types/        Project, Article, NewsItem, Guide, Capability, Chapter…
  services/     слой доступа к контенту
public/  images/  video/  fonts/
production/
  blender/      сцена-черновик: скрипты, паспорт, таймшит, рендеры
  higgsfield/   нарезка черновика на 6 кусков с первым/последним кадром
  brand/        логотип: исходники, векторная геометрия, SVG
  scripts/      проверки (shoot.mjs, probe.mjs, flows.mjs), извлечение кадров
  qa/           скриншоты проверок
```

## Проверки

```bash
node production/scripts/shoot.mjs http://localhost:3100 desktop mobile reduced novideo
node production/scripts/flows.mjs http://localhost:3100
```
