import type { SiteConfig } from "@/types";
import { asset } from "@/lib/asset";

/**
 * Global site settings: contacts, menu, video paths. Change them here and they update everywhere
 * (header, buttons, finale, SEO, sitemap). The domain comes from NEXT_PUBLIC_SITE_URL.
 */
const PHONE = "+79101459965";
const MEDIA_VERSION = 5;

export const site: SiteConfig = {
  name: "DARK MODE",
  tagline: "Websites · Scroll video · 3D",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://darkmode.studio",
  description:
    "DARK MODE делает только сайты: скролл-видео, 3D и анимация, которые запоминают. Корпоративные, продуктовые, авто, недвижимость, отели и рестораны.",
  locale: "ru_RU",
  contacts: {
    phone: { label: "+7 910 145-99-65", href: `tel:${PHONE}` },
    sms: { label: "Написать", href: `sms:${PHONE}` },
    telegram: { label: "Telegram", href: "https://t.me/alexxxwhite007" },
    city: "Нижний Новгород, работаем по всей России",
  },
  /** header menu: sections of the home page and the separate publication pages */
  nav: [
    { id: "projects", label: "Проекты", href: "/#projects", index: "02" },
    { id: "services", label: "Услуги", href: "/#services", index: "03" },
    { id: "process", label: "Процесс", href: "/#process", index: "04" },
    { id: "news", label: "Новости", href: "/news", index: "05" },
    { id: "articles", label: "Статьи", href: "/articles", index: "06" },
    { id: "guides", label: "Гайды", href: "/guides", index: "07" },
  ],
  /** section index on the right edge of the home page */
  sections: [
    { id: "top", label: "Главная", href: "/#top", index: "01" },
    { id: "projects", label: "Проекты", href: "/#projects", index: "02" },
    { id: "services", label: "Услуги", href: "/#services", index: "03" },
    { id: "process", label: "Процесс", href: "/#process", index: "04" },
    { id: "media", label: "Новости", href: "/#media", index: "05" },
    { id: "contact", label: "Связаться", href: "/#contact", index: "06" },
  ],
  /**
   * The film. Browsers may keep media files for a long time, so every time a file is replaced
   * bump MEDIA_VERSION (posters, space video) or frames.version — the new address forces a download.
   */
  video: {
    posterDesktop: asset(`/images/hero-poster-desktop.jpg?v=${MEDIA_VERSION}`),
    posterMobile: asset(`/images/hero-poster-mobile.jpg?v=${MEDIA_VERSION}`),
    duration: 29.71,
    fps: 24,
    /** the film follows the scroll as a picture sequence (public/frames, production/scripts/make_frames.py) */
    frames: {
      desktop: { path: asset("/frames/desktop"), count: 713 },
      mobile: { path: asset("/frames/mobile"), count: 713 },
      /** frames per second of film in the sequence: every frame of the 24 fps film */
      fps: 24,
      /** bump when the frames are replaced, so browsers download the new ones */
      version: 3,
    },
    /** space behind the rest of the page, forward then backward in a seamless loop */
    ambient: asset(`/video/ambient.mp4?v=${MEDIA_VERSION}`),
  },
};
