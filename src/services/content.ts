/**
 * Content service. Pages and API routes read content only through these functions.
 * Today they return static data from src/data; to plug in a CMS, replace the bodies with fetch calls
 * (e.g. to /api/* of the CMS) and keep the signatures — the UI does not change.
 */
import { articles, guides, news } from "@/data/media";
import { projects } from "@/data/projects";
import { capabilities } from "@/data/capabilities";
import { processSteps } from "@/data/process";
import { chapters } from "@/data/chapters";
import { site } from "@/data/site";
import type { MediaKind, Publication } from "@/types";

const byDateDesc = (a: Publication, b: Publication) => b.publishedAt.localeCompare(a.publishedAt);

export async function getProjects() {
  return projects;
}

export async function getProject(slug: string) {
  return projects.find((p) => p.slug === slug) ?? null;
}

export async function getNews() {
  return [...news].sort(byDateDesc);
}

export async function getArticles() {
  return [...articles].sort(byDateDesc);
}

export async function getGuides() {
  return [...guides].sort(byDateDesc);
}

export async function getAllPublications(kind?: MediaKind): Promise<Publication[]> {
  const all: Publication[] = [...news, ...articles, ...guides].sort(byDateDesc);
  return kind ? all.filter((p) => p.kind === kind) : all;
}

export async function getPublication(slug: string): Promise<Publication | null> {
  const all = await getAllPublications();
  return all.find((p) => p.slug === slug) ?? null;
}

export async function getContent() {
  return {
    site: { name: site.name, tagline: site.tagline, url: site.url, contacts: site.contacts, nav: site.nav },
    chapters,
    capabilities,
    process: processSteps,
  };
}

export const mediaKindLabel: Record<MediaKind, string> = {
  news: "Новости",
  article: "Статьи",
  guide: "Гайды",
};

export { mediaKindPath, kindFromPath, publicationHref } from "@/lib/media-paths";
