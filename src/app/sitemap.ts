import type { MetadataRoute } from "next";
import { site } from "@/data/site";
import { getAllPublications, publicationHref } from "@/services/content";
import { kindHref, mediaKinds } from "@/lib/media-paths";
import { LANGS, localHref } from "@/i18n";

export const dynamic = "force-static";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pubs = await getAllPublications();
  return LANGS.flatMap((lang) => [
    { url: `${site.url}${localHref(lang, "/")}`, changeFrequency: "weekly" as const, priority: 1 },
    ...mediaKinds.map((k) => ({ url: `${site.url}${kindHref(k, lang)}`, changeFrequency: "weekly" as const, priority: 0.7 })),
    ...pubs.map((p) => ({
      url: `${site.url}${publicationHref(p, lang)}`,
      lastModified: new Date(p.publishedAt),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ]);
}
