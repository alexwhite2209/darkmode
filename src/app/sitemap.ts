import type { MetadataRoute } from "next";

export const dynamic = "force-static";
import { site } from "@/data/site";
import { getAllPublications, mediaKindPath, publicationHref } from "@/services/content";
import { mediaKinds } from "@/lib/media-paths";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pubs = await getAllPublications();
  return [
    { url: `${site.url}/`, changeFrequency: "weekly", priority: 1 },
    ...mediaKinds.map((k) => ({ url: `${site.url}/${mediaKindPath[k]}`, changeFrequency: "weekly" as const, priority: 0.7 })),
    ...pubs.map((p) => ({
      url: `${site.url}${publicationHref(p)}`,
      lastModified: new Date(p.publishedAt),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];
}
