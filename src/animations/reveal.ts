/**
 * Reveal-on-approach. Elements with data-reveal get `.is-in` once they come near the viewport;
 * CSS does the motion (transform / opacity / clip-path only). Types, set as the attribute value:
 *   fade · up · scale · clip · words (text split into words) · stagger (children, via --i)
 */
let io: IntersectionObserver | null = null;

function observer() {
  if (io) return io;
  io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          const el = e.target as HTMLElement;
          el.classList.add("is-in");
          io?.unobserve(el);
        }
      }
    },
    { rootMargin: "0px 0px -12% 0px", threshold: 0.12 },
  );
  return io;
}

export function scanReveals(root: ParentNode = document) {
  const obs = observer();
  root.querySelectorAll<HTMLElement>("[data-reveal]:not(.is-in)").forEach((el) => {
    // stagger children: give each an index once
    if (el.dataset.reveal === "stagger") {
      Array.from(el.children).forEach((c, i) => (c as HTMLElement).style.setProperty("--i", String(i)));
    }
    obs.observe(el);
  });
}

/** show everything immediately (reduced motion) */
export function revealAll(root: ParentNode = document) {
  root.querySelectorAll<HTMLElement>("[data-reveal]").forEach((el) => el.classList.add("is-in"));
}
