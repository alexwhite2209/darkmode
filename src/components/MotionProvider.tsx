"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { scroll } from "@/animations/scroll";
import { pointer } from "@/animations/pointer";
import { ticker } from "@/animations/ticker";
import { scanReveals, revealAll } from "@/animations/reveal";
import { scanParallax } from "@/animations/parallax";
import { loading } from "@/lib/store";
import { useIsoLayoutEffect } from "@/hooks";

/** Boots the single animation loop, smooth scroll, pointer, reveals and parallax. */
export function MotionProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  useIsoLayoutEffect(() => {
    const html = document.documentElement;
    html.classList.add("has-js");
    const mqReduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    html.classList.toggle("is-reduced", mqReduce.matches);
    html.classList.toggle("is-touch", coarse);
    // smooth wheel scrolling on desktop only; touch keeps native momentum
    scroll.init({ smooth: !mqReduce.matches && !coarse });
    pointer.init();
    ticker.start();

    const fontsDone = () => loading.set({ fonts: true });
    if (document.fonts?.ready) document.fonts.ready.then(fontsDone, fontsDone);
    else fontsDone();

    const onReduce = (e: MediaQueryListEvent) => {
      html.classList.toggle("is-reduced", e.matches);
      if (e.matches) revealAll();
    };
    mqReduce.addEventListener("change", onReduce);

    const onVis = () => document.body.classList.toggle("paused", document.hidden);
    document.addEventListener("visibilitychange", onVis);

    // in-page anchors go through the smooth scroller
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement | null)?.closest?.("a") as HTMLAnchorElement | null;
      if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || a.target === "_blank") return;
      const url = new URL(a.href, window.location.href);
      if (url.pathname !== window.location.pathname || !url.hash) return;
      const el = document.getElementById(decodeURIComponent(url.hash.slice(1)));
      if (!el) return;
      e.preventDefault();
      scroll.scrollTo(el, { offset: 0 });
      history.replaceState(null, "", url.hash);
      el.setAttribute("tabindex", "-1");
      window.setTimeout(() => el.focus({ preventScroll: true }), 900);
    };
    document.addEventListener("click", onClick);
    return () => {
      mqReduce.removeEventListener("change", onReduce);
      document.removeEventListener("visibilitychange", onVis);
      document.removeEventListener("click", onClick);
    };
  }, []);

  useEffect(() => {
    const reduced = document.documentElement.classList.contains("is-reduced");
    if (reduced) revealAll();
    else scanReveals();
    const off = reduced ? () => undefined : scanParallax(document, window.innerWidth < 768 ? 0.5 : 1);
    scroll.refresh();
    return off;
  }, [pathname]);

  return <>{children}</>;
}
