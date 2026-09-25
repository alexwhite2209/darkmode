"use client";

import { useEffect, useRef, useState } from "react";
import { loading } from "@/lib/store";
import { scroll } from "@/animations/scroll";
import { ticker } from "@/animations/ticker";
import { ease } from "@/animations/easing";
import styles from "./Preloader.module.css";

/**
 * PAGE LOAD -> LOCK SCROLL -> fonts, poster, video -> PRELOADER -> HERO REVEAL (through the O) -> START SCROLL
 */
export function Preloader() {
  const root = useRef<HTMLDivElement>(null);
  const arc = useRef<SVGCircleElement>(null);
  const num = useRef<HTMLSpanElement>(null);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    const el = root.current!;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const quick = sessionStorage.getItem("dm-visited") === "1";
    scroll.lock();
    let shown = 0;
    let finished = false;
    let raf: (() => void) | null = null;
    const start = performance.now();
    const MAX_WAIT = quick ? 3500 : 9000;
    const C = 2 * Math.PI * 70;

    const target = () => {
      const s = loading.get();
      if (!s.hasHero) return s.fonts ? 1 : 0.4;
      return (s.fonts ? 0.15 : 0) + (s.poster ? 0.2 : 0) + s.video * 0.65;
    };

    const open = () => {
      if (finished) return;
      finished = true;
      sessionStorage.setItem("dm-visited", "1");
      el.dataset.state = "opening";
      const t0 = performance.now();
      const dur = reduced ? 300 : 1400;
      const off = ticker.add((t) => {
        const k = Math.min(1, (t - t0) / dur);
        if (reduced) {
          el.style.opacity = String(1 - k);
        } else {
          // the page is revealed through a growing hole in the centre of the ring (the O)
          const e = ease.inOutExpo(k);
          const r = 70 + e * Math.hypot(window.innerWidth, window.innerHeight);
          el.style.setProperty("--hole", `${r}px`);
        }
        if (k >= 1) {
          off();
          loading.set({ done: true });
          scroll.unlock();
          setGone(true);
          return false;
        }
        return true;
      }, 50);
      window.setTimeout(() => loading.set({ done: true }), reduced ? 0 : 450);
    };

    raf = ticker.add((t, dt) => {
      if (finished) return false;
      const tg = Math.max(target(), Math.min(0.92, (t - start) / MAX_WAIT));
      shown += (tg - shown) * (1 - Math.pow(0.9, dt / 16.667));
      if (tg >= 0.999 && shown > 0.985) shown = 1;
      arc.current?.style.setProperty("stroke-dashoffset", String(C * (1 - shown)));
      if (num.current) num.current.textContent = String(Math.round(shown * 100)).padStart(2, "0");
      if (shown >= 1 || t - start > MAX_WAIT) {
        window.setTimeout(open, reduced ? 0 : 220);
        return false;
      }
      return true;
    }, 40);
    const unsub = loading.subscribe(() => ticker.wake());
    return () => {
      raf?.();
      unsub();
      if (!finished) scroll.unlock();
    };
  }, []);

  if (gone) return null;
  return (
    <div ref={root} className={styles.pre} data-state="loading" data-preloader aria-hidden="true">
      <div className={styles.center}>
        <svg className={styles.ring} viewBox="0 0 160 160">
          <defs>
            <linearGradient id="pre-ring" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#b8410e" />
              <stop offset="0.6" stopColor="#ff7a1a" />
              <stop offset="1" stopColor="#ffd6a0" />
            </linearGradient>
          </defs>
          <circle cx="80" cy="80" r="70" className={styles.track} />
          <circle ref={arc} cx="80" cy="80" r="70" className={styles.arc} stroke="url(#pre-ring)" strokeDasharray={`${2 * Math.PI * 70}`} strokeDashoffset={`${2 * Math.PI * 70}`} />
        </svg>
        <span ref={num} className={`${styles.num} t-num`}>00</span>
      </div>
      <p className={styles.caption}>DARK MODE</p>
    </div>
  );
}
