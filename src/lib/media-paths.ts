import type { MediaKind, Publication } from "@/types";

/** each kind of publication lives on its own page: /news, /articles, /guides */
export const mediaKindPath: Record<MediaKind, string> = {
  news: "news",
  article: "articles",
  guide: "guides",
};

export const mediaKinds = Object.keys(mediaKindPath) as MediaKind[];

export const kindFromPath = (path: string): MediaKind | null => mediaKinds.find((k) => mediaKindPath[k] === path) ?? null;

export const publicationHref = (p: Pick<Publication, "kind" | "slug">) => `/${mediaKindPath[p.kind]}/${p.slug}`;
