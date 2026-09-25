import { site } from "@/data/site";

export type ScrubKind = "frames" | "video";

/**
 * Which player the film uses: the setting in src/data/site.ts, or ?scrub=video / ?scrub=frames
 * in the address (to compare both on a phone without rebuilding). Client only.
 */
export function readScrubKind(): ScrubKind {
  try {
    const q = new URLSearchParams(window.location.search).get("scrub");
    if (q === "video" || q === "frames") {
      sessionStorage.setItem("dm-scrub", q);
      return q;
    }
    const s = sessionStorage.getItem("dm-scrub");
    if (s === "video" || s === "frames") return s;
  } catch {
    /* storage may be unavailable */
  }
  return site.video.scrub;
}
