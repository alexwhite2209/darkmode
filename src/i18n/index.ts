/**
 * Two languages: Russian at the root (/…), English under /en (/en/…).
 * Everything the visitor reads comes either from this dictionary (interface) or from the data layer,
 * which returns content already in the requested language (services/content.ts).
 */
export type Lang = "ru" | "en";
export const LANGS: Lang[] = ["ru", "en"];

/** "/news" -> "/en/news" for English; hash links too ("/#projects" -> "/en#projects") */
export function localHref(lang: Lang, href: string) {
  if (lang === "ru" || !href.startsWith("/")) return href;
  if (href === "/") return "/en";
  if (href.startsWith("/#")) return "/en" + href.slice(1);
  return "/en" + href;
}

/** language from a path WITHOUT the base path (usePathname already strips it) */
export const langFromPath = (pathname: string | null | undefined): Lang => (pathname === "/en" || pathname?.startsWith("/en/") ? "en" : "ru");

/** the same page in the other language */
export function switchHref(pathname: string, to: Lang) {
  const ru = pathname === "/en" ? "/" : pathname.startsWith("/en/") ? pathname.slice(3) : pathname;
  return localHref(to, ru);
}

const ru = {
  htmlTitle: "DARK MODE | Сайты, которые запоминают",
  description:
    "DARK MODE делает только сайты: скролл-видео, 3D и анимация, которые запоминают. Корпоративные, продуктовые, авто, недвижимость, отели и рестораны.",
  ogAlt: "DARK MODE: логотип и затмение над мокрым камнем",
  skip: "Перейти к содержимому",
  // header / nav
  toHome: "DARK MODE, на главную",
  mainNav: "Основная навигация",
  menu: "Меню",
  openMenu: "Открыть меню",
  closeMenu: "Закрыть меню",
  langSwitch: "Язык сайта",
  nav: { projects: "Проекты", services: "Услуги", process: "Процесс", news: "Новости", articles: "Статьи", guides: "Гайды" },
  sections: { top: "Главная", projects: "Проекты", services: "Услуги", process: "Процесс", media: "Новости", contact: "Связаться" },
  sectionsLabel: "Разделы страницы",
  // buttons
  discuss: "Обсудить проект",
  callTo: "позвонить",
  watchProjects: "Смотреть проекты",
  // hero
  heroTitle: "Мы делаем эволюцию сайтов",
  heroAria: "DARK MODE: путешествие по мирам сайтов",
  scrollDown: "Листайте вниз",
  scrollDownAria: "Прокрутить вниз",
  skipFilm: "Пропустить ролик",
  filmLoading: "Загрузка ролика",
  worldsTitle: "Семь миров, семь типов сайтов",
  // projects
  projectsTitle: "Проекты",
  projectsLead: "Сайты, которые мы собрали для бизнеса: электромонтаж, автосервисы, охрана, стройматериалы, автошкола. У каждого свой мир и свой сценарий.",
  projectsEmpty: "Проекты скоро появятся здесь.",
  price: "Цена",
  openSite: "Открыть сайт",
  linkOnRequest: "Ссылка на сайт по запросу",
  tech: "Технологии",
  cursorOpen: "Открыть",
  cursorView: "Смотреть",
  capsTitle: "Что мы делаем",
  capsLead: "Каждый мир из ролика это отдельный тип сайта. Выберите свой, и мы соберём его под ваш бизнес.",
  examplesLabel: "Например",
  processTitle: "Как мы работаем",
  footerNav: "Разделы",
  // media
  mediaTitle: "Новости, статьи, гайды",
  mediaLead: "Новости студии, статьи о том, как сайты продают, и гайды, которые экономят время на старте.",
  allNews: "Все новости",
  allArticles: "Все статьи",
  allGuides: "Все гайды",
  tabAll: "Всё",
  tabsLabel: "Тип публикаций",
  kindOne: { news: "Новость", article: "Статья", guide: "Гайд" },
  kindMany: { news: "Новости", article: "Статьи", guide: "Гайды" },
  read: "Читать",
  readMin: (m: number) => `Читать, ${m} мин`,
  minRead: (m: number) => `${m} мин чтения`,
  publications: "Публикации",
  soon: "Скоро здесь появятся публикации.",
  tagsLabel: "Теги",
  inShort: "Коротко",
  wantSite: "Хотите такой сайт?",
  kindPage: {
    news: { title: "Новости студии", description: "Новости студии DARK MODE: запуски сайтов, новые проекты и то, что меняется в работе.", lead: "Запуски, новые проекты и то, что меняется в нашей работе." },
    article: { title: "Статьи о сайтах", description: "Статьи DARK MODE о том, как сайты продают: скролл-видео, первый экран, скорость и заявки.", lead: "Как сайты продают: первый экран, скролл-видео, скорость и путь до звонка." },
    guide: { title: "Гайды", description: "Гайды DARK MODE: как подготовиться к запуску сайта, что собрать заранее и как сэкономить время.", lead: "Короткие инструкции, которые экономят время на старте проекта." },
  },
  // contact + finale
  finalPhrase: ["Создаём", "эволюцию", "сайтов."],
  callOrWrite: "Позвоните или напишите",
  call: "Позвонить",
  write: "Написать",
  writeTelegram: "Написать в Telegram",
  // misc
  notFoundTitle: "Такой страницы нет",
  notFoundText: "Возможно, её перенесли. Вернитесь на главную и продолжите путешествие.",
  toMain: "На главную",
  dateLocale: "ru-RU",
};

export type Dict = typeof ru;

const en: Dict = {
  htmlTitle: "DARK MODE | Websites people remember",
  description:
    "DARK MODE builds websites only: scroll-driven film, 3D and motion that people remember. Corporate, product, automotive, real estate, hotels and restaurants.",
  ogAlt: "DARK MODE: the logo and an eclipse over wet stone",
  skip: "Skip to content",
  toHome: "DARK MODE, home",
  mainNav: "Main navigation",
  menu: "Menu",
  openMenu: "Open menu",
  closeMenu: "Close menu",
  langSwitch: "Site language",
  nav: { projects: "Projects", services: "Services", process: "Process", news: "News", articles: "Articles", guides: "Guides" },
  sections: { top: "Home", projects: "Projects", services: "Services", process: "Process", media: "News", contact: "Contact" },
  sectionsLabel: "Page sections",
  discuss: "Discuss a project",
  callTo: "call",
  watchProjects: "See projects",
  heroTitle: "We build the evolution of websites",
  heroAria: "DARK MODE: a journey through the worlds of websites",
  scrollDown: "Scroll down",
  scrollDownAria: "Scroll down",
  skipFilm: "Skip the film",
  filmLoading: "Loading the film",
  worldsTitle: "Seven worlds, seven kinds of websites",
  projectsTitle: "Projects",
  projectsLead: "Websites we have built for businesses: electrical works, car services, security systems, building materials, a driving school. Each has its own world and its own story.",
  projectsEmpty: "Projects will appear here soon.",
  price: "Price",
  openSite: "Open the website",
  linkOnRequest: "Link available on request",
  tech: "Technologies",
  cursorOpen: "Open",
  cursorView: "View",
  capsTitle: "What we build",
  capsLead: "Every world in the film is a separate kind of website. Pick yours and we'll build it for your business.",
  examplesLabel: "For example",
  processTitle: "How we work",
  footerNav: "Sections",
  mediaTitle: "News, articles, guides",
  mediaLead: "Studio news, articles on how websites sell, and guides that save time at the start.",
  allNews: "All news",
  allArticles: "All articles",
  allGuides: "All guides",
  tabAll: "All",
  tabsLabel: "Publication type",
  kindOne: { news: "News", article: "Article", guide: "Guide" },
  kindMany: { news: "News", article: "Articles", guide: "Guides" },
  read: "Read",
  readMin: (m: number) => `Read, ${m} min`,
  minRead: (m: number) => `${m} min read`,
  publications: "Publications",
  soon: "Publications will appear here soon.",
  tagsLabel: "Tags",
  inShort: "In short",
  wantSite: "Want a website like this?",
  kindPage: {
    news: { title: "Studio news", description: "DARK MODE studio news: website launches, new projects and what changes in our work.", lead: "Launches, new projects and what changes in our work." },
    article: { title: "Articles on websites", description: "DARK MODE articles on how websites sell: scroll-driven film, the first screen, speed and leads.", lead: "How websites sell: the first screen, scroll-driven film, speed and the way to a call." },
    guide: { title: "Guides", description: "DARK MODE guides: how to prepare for a website launch, what to gather in advance and how to save time.", lead: "Short instructions that save time at the start of a project." },
  },
  finalPhrase: ["We build", "the evolution", "of websites."],
  callOrWrite: "Call or message us",
  call: "Call",
  write: "Text us",
  writeTelegram: "Message on Telegram",
  notFoundTitle: "This page does not exist",
  notFoundText: "It may have moved. Go back home and continue the journey.",
  toMain: "Home",
  dateLocale: "en-GB",
};

export const dict: Record<Lang, Dict> = { ru, en };
export const t = (lang: Lang) => dict[lang];

export const formatDate = (iso: string, lang: Lang) =>
  new Date(iso + "T12:00:00").toLocaleDateString(dict[lang].dateLocale, { day: "numeric", month: "long", year: "numeric" });
