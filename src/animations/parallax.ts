/**
 * Parallax: every element moves at its own rate relative to the scroll.
 *   background 0.05 · image 0.15 · object 0.30 · foreground 0.40
 * Declare with data-parallax="0.15" (optional data-parallax-x for horizontal drift).
 * Offset is zero when the element's centre crosses the viewport centre, so layouts stay put.
 */
import { scroll, ranges } from "./scroll";

export const PARALLAX = { background: 0.05, image: 0.15, object: 0.3, foreground: 0.4 } as const;

export function parallax(el: HTMLElement, speed: number, speedX = 0) {
  let lastY = NaN;
  let lastX = NaN;
  return scroll.scene(el, ranges.through, (p, { vh, m }) => {
    const travel = vh + m.height;
    const d = (p - 0.5) * travel;
    const ty = Math.round(-d * speed * 10) / 10;
    const tx = Math.round(-d * speedX * 10) / 10;
    if (ty === lastY && tx === lastX) return;
    lastY = ty;
    lastX = tx;
    el.style.transform = `translate3d(${tx}px, ${ty}px, 0)`;
  });
}

/** scan a root for [data-parallax] elements; returns a cleanup */
export function scanParallax(root: ParentNode, factor = 1) {
  const offs: Array<() => void> = [];
  root.querySelectorAll<HTMLElement>("[data-parallax]").forEach((el) => {
    const s = parseFloat(el.dataset.parallax || "0") * factor;
    const sx = parseFloat(el.dataset.parallaxX || "0") * factor;
    if (s || sx) offs.push(parallax(el, s, sx));
  });
  return () => offs.forEach((f) => f());
}
