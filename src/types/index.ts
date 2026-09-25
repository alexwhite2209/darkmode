/** Content types. UI components only consume these shapes, so the data source
 *  (static files today, /api/* or a CMS tomorrow) can change without touching the UI. */

export type ImageRef = {
  src: string;
  alt: string;
  width?: number;
  height?: number;
};

export type Project = {
  slug: string;
  title: string;
  category: string;
  city?: string | null;
  year: number;
  summary: string;
  description: string;
  highlights: string[];
  stack: string[];
  liveUrl?: string | null;
  status: "live" | "concept";
  /** price of the site in roubles */
  price?: number | null;
  images: {
    desktop: ImageRef;
    desktop2?: ImageRef | null;
    mobile?: ImageRef | null;
  };
};

export type Capability = {
  id: string;
  title: string;
  lead: string;
  examples: string[];
  image: ImageRef;
};

export type ProcessStep = {
  id: "idea" | "system" | "design" | "development" | "launch";
  index: number;
  title: string;
  titleEn: string;
  text: string;
  deliverables: string[];
};

export type MediaKind = "news" | "article" | "guide";

/** Base shape shared by every publication. */
export type Publication = {
  kind: MediaKind;
  title: string;
  slug: string;
  description: string;
  /** Body as an ordered list of blocks, so a CMS or markdown source can map onto it later. */
  content: ContentBlock[];
  image: ImageRef;
  category: string;
  tags: string[];
  /** ISO date, e.g. "2026-09-12" */
  publishedAt: string;
  readingMinutes: number;
};

export type NewsItem = Publication & { kind: "news" };
export type Article = Publication & { kind: "article" };
export type Guide = Publication & { kind: "guide"; steps?: string[] };

export type ContentBlock =
  | { type: "p"; text: string }
  | { type: "h2"; text: string }
  | { type: "list"; items: string[] }
  | { type: "quote"; text: string };

/** One chapter of the cinematic journey: a band of the hero video, in video seconds. */
export type Chapter = {
  id: string;
  /** what kind of website this world stands for */
  kind: string;
  title: string;
  text: string;
  start: number;
  end: number;
  /** where the caption sits so the action lane of the footage stays clear */
  placement: "left" | "right" | "center" | "bottom-left";
  /** still used for the reduced-motion version and for previews */
  still: ImageRef;
};

export type NavItem = { id: string; label: string; href: string; index: string };

export type SiteConfig = {
  name: string;
  tagline: string;
  url: string;
  description: string;
  locale: string;
  contacts: {
    phone: { label: string; href: string };
    sms: { label: string; href: string };
    telegram: { label: string; href: string };
    city: string;
  };
  nav: NavItem[];
  sections: NavItem[];
  video: {
    posterDesktop: string;
    posterMobile: string;
    duration: number;
    fps: number;
    frames: {
      desktop: { path: string; count: number };
      mobile: { path: string; count: number };
      fps: number;
      version: number;
    };
    ambient: string;
  };
};
