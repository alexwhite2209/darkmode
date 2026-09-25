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

## Сайт для хостинга

```bash
npm run build:static
```

Получаются папка `out/` и архив `darkmode-site.zip`. **Содержимое** `out/` (или распакованный архив) загрузить
в корень сайта на хостинге (обычно `public_html`). Сервер не нужен, это обычные файлы; `.htaccess` для Apache
уже внутри. Домен для SEO задаётся перед сборкой: `$env:NEXT_PUBLIC_SITE_URL="https://домен.ru"; npm run build:static`.
Если сайт будет не в корне домена, а в папке, ещё `$env:NEXT_PUBLIC_BASE_PATH="/папка"`.

## Ролик = кадры

Ролик по скроллу — последовательность кадров на canvas (`src/animations/frame-scrub.ts`):
`public/frames/desktop` (1600×900) и `public/frames/mobile` (720×1280), 24 кадра в секунду, каждый кадр целиком.
Нарезает `python production/scripts/make_frames.py` из роликов в `production/higgsfield/takes`.
После замены кадров поднять `frames.version` в `src/data/site.ts`.

## Замена ролика (после Higgsfield)

1. Положить ролики 16:9 и 9:16 в `production/higgsfield/takes`, прописать их в `production/scripts/make_frames.py`
   и нарезать кадры: `python production/scripts/make_frames.py`; поднять `frames.version` в `src/data/site.ts`.
   Финал страницы (выход из буквы O) берёт первые 2,8 с тех же кадров. Фон после ролика —
   `public/video/ambient.mp4`: космос вперёд + назад одним файлом, чтобы петля шла без скачка.
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
