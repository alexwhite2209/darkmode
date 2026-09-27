import type { MediaKind, Publication } from "@/types";
import { localHref, type Lang } from "@/i18n";

/** each kind of publication lives on its own page: /news, /articles, /guides (and /en/… in English) */
export const mediaKindPath: Record<MediaKind, string> = {
  news: "news",
  article: "articles",
  guide: "guides",
};

export const mediaKinds = Object.keys(mediaKindPath) as MediaKind[];

export const kindFromPath = (path: string): MediaKind | null => mediaKinds.find((k) => mediaKindPath[k] === path) ?? null;

export const kindHref = (k: MediaKind, lang: Lang = "ru") => localHref(lang, `/${mediaKindPath[k]}`);

export const publicationHref = (p: Pick<Publication, "kind" | "slug">, lang: Lang = "ru") => localHref(lang, `/${mediaKindPath[p.kind]}/${p.slug}`);
