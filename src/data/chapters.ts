import type { Chapter } from "@/types";
import type { Lang } from "@/i18n";
import { asset } from "@/lib/asset";
// Captions of the film worlds in both languages (edited from the admin tab of News Engine).
import raw from "./chapters.json";

type RawChapter = {
  id: string;
  start: number;
  end: number;
  placement: Chapter["placement"];
  still: string;
  ru: { kind: string; title: string; text: string; alt: string };
  en: { kind: string; title: string; text: string; alt: string };
};

/**
 * Part of the black between the O and the valley (3.0 s → 3.33 s of the render) was cut out,
 * so the pass through black is about half a second. Times in chapters.json are in the uncut 30 s timeline.
 */
const CUT_AT = 3.0;
const CUT = 0.33;
const shift = (t: number) => (t > CUT_AT ? Math.round((t - CUT) * 100) / 100 : t);

export function getChapters(lang: Lang): Chapter[] {
  return (raw as RawChapter[]).map((c) => {
    const tx = c[lang] ?? c.ru;
    return {
      id: c.id,
      kind: tx.kind,
      title: tx.title,
      text: tx.text,
      start: shift(c.start),
      end: shift(c.end),
      placement: c.placement,
      still: { src: asset(c.still), alt: tx.alt },
    };
  });
}

export const chapters = getChapters("ru");
