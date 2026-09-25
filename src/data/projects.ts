import type { Project } from "@/types";
import raw from "./projects.json";
import { asset } from "@/lib/asset";

/** Raw portfolio records (collected from the studio's real project folders). */
type RawProject = {
  slug: string;
  title: string;
  category: string;
  city?: string | null;
  year?: number;
  summary: string;
  description: string;
  highlights?: string[];
  stack?: string[];
  liveUrl?: string | null;
  status?: "live" | "concept";
  price?: number | null;
  images: { desktop: string; desktop2?: string | null; mobile?: string | null };
};

const toProject = (p: RawProject): Project => ({
  slug: p.slug,
  title: p.title,
  category: p.category.replace(/\s*·\s*/g, ", "),
  city: p.city ?? null,
  year: p.year ?? 2026,
  summary: p.summary,
  description: p.description,
  highlights: p.highlights ?? [],
  stack: p.stack ?? [],
  liveUrl: p.liveUrl ?? null,
  status: p.status ?? "concept",
  price: p.price ?? null,
  images: {
    desktop: { src: asset(p.images.desktop), alt: `${p.title}: первый экран сайта`, width: 1600, height: 1000 },
    desktop2: p.images.desktop2 ? { src: asset(p.images.desktop2), alt: `${p.title}: экран сайта`, width: 1600, height: 1000 } : null,
    mobile: p.images.mobile ? { src: asset(p.images.mobile), alt: `${p.title}: мобильная версия`, width: 780, height: 1688 } : null,
  },
});

export const projects: Project[] = (raw as RawProject[]).map(toProject);
