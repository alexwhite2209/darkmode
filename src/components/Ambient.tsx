"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { site } from "@/data/site";
import { ambient, loading } from "@/lib/store";
import styles from "./Ambient.module.css";

const MAX_OPACITY = 0.42;

/**
 * Space behind the rest of the home page after the film: a semi-transparent video that plays forward
 * and then backward (the file itself is a ping-pong, so the loop has no jump) right to the finale.
 * It loads only after the preloader, so it never competes with the hero film, and pauses when unseen.
 */
export function Ambient() {
  const pathname = usePathname();
  const video = useRef<HTMLVideoElement>(null);
  const home = pathname === "/";

  useEffect(() => {
    const v = video.current;
    if (!home || !v) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let started = false;
    let visible = false;
    let timer = 0;
    const start = () => {
      if (started) return;
      started = true;
      v.src = site.video.ambient;
      v.load();
    };
    const offLoad = loading.subscribe((s) => {
      if (s.done && !started) timer = window.setTimeout(start, 2500);
    });
    if (loading.get().done) timer = window.setTimeout(start, 2500);

    let last = -1;
    const offAmb = ambient.subscribe(({ after, finale }) => {
      const op = after * (1 - finale) * MAX_OPACITY;
      if (Math.abs(op - last) < 0.004) return;
      last = op;
      v.style.opacity = op.toFixed(3);
      const vis = op > 0.01;
      if (vis !== visible) {
        visible = vis;
        if (vis) {
          start();
          v.play().catch(() => undefined);
        } else v.pause();
      }
    });
    return () => {
      offLoad();
      offAmb();
      window.clearTimeout(timer);
      v.pause();
      v.removeAttribute("src");
      ambient.set({ after: 0, finale: 0 });
    };
  }, [home]);

  if (!home) return null;
  return <video ref={video} className={styles.video} muted loop playsInline preload="none" aria-hidden="true" tabIndex={-1} />;
}
