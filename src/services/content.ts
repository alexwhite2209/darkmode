/**
 * Content service. Pages and API routes read content only through these functions,
 * already in the requested language (ru: the source data, en: translations merged on top).
 *
 * English sources:
 *  - publications from News Engine: `item.en` inside feed.json (written by the engine on publish),
 *    or feed-en.json (translations of older items), falling back to Russian when neither exists
 *  - static media, projects, capabilities, process: *-en.json next to the Russian data
 */
import { articles, guides, news } from "@/data/media";
import { projects } from "@/data/projects";
import { capabilities } from "@/data/capabilities";
import { processSteps } from "@/data/process";
import { getChapters } from "@/data/chapters";
import { site } from "@/data/site";
import feedEn from "@/data/feed-en.json";
import mediaEn from "@/data/media-en.json";
import projectsEn from "@/data/projects-en.json";
import capabilitiesEn from "@/data/capabilities-en.json";
import processEn from "@/data/process-en.json";
import type { Lang } from "@/i18n";
import type { Capability, ContentBlock, Guide, MediaKind, ProcessStep, Project, Publication } from "@/types";

type PubEn = { title: string; description: string; category?: string; tags?: string[]; imageAlt?: string; content: ContentBlock[]; steps?: string[] };
type WithEn = Publication & { en?: PubEn; hidden?: boolean };

const byDateDesc = (a: Publication, b: Publication) => b.publishedAt.localeCompare(a.publishedAt);

function localizePublication(p: WithEn, lang: Lang): Publication {
  const { en: inline, hidden: _h, ...base } = p;
  if (lang === "ru") return base;
  const en = inline ?? (feedEn as Record<string, PubEn>)[p.slug] ?? (mediaEn as Record<string, PubEn>)[p.slug];
  if (!en) return base;
  const out: Publication = {
    ...base,
    title: en.title,
    description: en.description,
    category: en.category ?? base.category,
    tags: en.tags ?? base.tags,
    content: en.content ?? base.content,
    image: { ...base.image, alt: en.imageAlt ?? base.image.alt },
  };
  if (base.kind === "guide" && en.steps) (out as Guide).steps = en.steps;
  return out;
}

export async function getProjects(lang: Lang = "ru"): Promise<Project[]> {
  if (lang === "ru") return projects;
  return projects.map((p) => {
    const en = (projectsEn as Record<string, Partial<Project> & { highlights?: string[] }>)[p.slug];
    if (!en) return p;
    const title = en.title ?? p.title;
    return {
      ...p,
      title,
      category: (en.category ?? p.category).replace(/\s*·\s*/g, ", "),
      city: en.city ?? p.city,
      summary: en.summary ?? p.summary,
      description: en.description ?? p.description,
      highlights: en.highlights ?? p.highlights,
      images: {
        desktop: { ...p.images.desktop, alt: `${title}: the first screen of the website` },
        desktop2: p.images.desktop2 ? { ...p.images.desktop2, alt: `${title}: a website screen` } : null,
        mobile: p.images.mobile ? { ...p.images.mobile, alt: `${title}: mobile version` } : null,
      },
    };
  });
}

export async function getProject(slug: string, lang: Lang = "ru") {
  return (await getProjects(lang)).find((p) => p.slug === slug) ?? null;
}

function getCapabilities(lang: Lang): Capability[] {
  if (lang === "ru") return capabilities;
  return capabilities.map((c) => {
    const en = (capabilitiesEn as Record<string, { title: string; lead: string; examples: string[]; imageAlt?: string }>)[c.id];
    return en ? { ...c, title: en.title, lead: en.lead, examples: en.examples, image: { ...c.image, alt: en.imageAlt ?? c.image.alt } } : c;
  });
}

function getProcess(lang: Lang): ProcessStep[] {
  if (lang === "ru") return processSteps;
  return processSteps.map((s) => {
    const en = (processEn as Record<string, { title: string; text: string; deliverables: string[] }>)[s.id];
    return en ? { ...s, title: en.title, text: en.text, deliverables: en.deliverables } : s;
  });
}

export async function getAllPublications(kind?: MediaKind, lang: Lang = "ru"): Promise<Publication[]> {
  const all = ([...news, ...articles, ...guides] as WithEn[])
    .filter((p) => !p.hidden)
    .map((p) => localizePublication(p, lang))
    .sort(byDateDesc);
  return kind ? all.filter((p) => p.kind === kind) : all;
}

export async function getNews(lang: Lang = "ru") {
  return getAllPublications("news", lang);
}

export async function getArticles(lang: Lang = "ru") {
  return getAllPublications("article", lang);
}

export async function getGuides(lang: Lang = "ru") {
  return getAllPublications("guide", lang);
}

export async function getPublication(slug: string, lang: Lang = "ru"): Promise<Publication | null> {
  const all = await getAllPublications(undefined, lang);
  return all.find((p) => p.slug === slug) ?? null;
}

export async function getContent(lang: Lang = "ru") {
  return {
    site: { name: site.name, tagline: site.tagline, url: site.url, contacts: site.contacts, nav: site.nav },
    chapters: getChapters(lang),
    capabilities: getCapabilities(lang),
    process: getProcess(lang),
  };
}

export const mediaKindLabel: Record<MediaKind, string> = {
  news: "Новости",
  article: "Статьи",
  guide: "Гайды",
};

export { mediaKindPath, kindFromPath, publicationHref } from "@/lib/media-paths";
