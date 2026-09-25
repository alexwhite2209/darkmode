"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { scroll } from "@/animations/scroll";
import { site } from "@/data/site";
import styles from "./Rail.module.css";

/** Section index on the right edge (desktop): 01 Главная … 06 Связаться, with the active one open. */
export function Rail() {
  const [active, setActive] = useState(0);
  const bar = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    let tops: number[] = [];
    const measure = () => {
      tops = site.sections.map((n) => {
        const el = document.getElementById(n.id);
        return el ? el.getBoundingClientRect().top + window.scrollY : Infinity;
      });
    };
    measure();
    const onResize = () => window.setTimeout(measure, 150);
    window.addEventListener("resize", onResize, { passive: true });
    window.addEventListener("load", measure);
    const ro = new ResizeObserver(() => measure());
    ro.observe(document.body);
    let last = -1;
    let lastBar = "";
    const off = scroll.onScroll((y) => {
      const probe = y + window.innerHeight * 0.4;
      let idx = 0;
      for (let i = 0; i < tops.length; i++) if (tops[i] <= probe) idx = i;
      if (idx !== last) {
        last = idx;
        setActive(idx);
      }
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? Math.min(1, y / max) : 0;
      const t = `scaleY(${p.toFixed(4)})`;
      if (t !== lastBar && bar.current) {
        lastBar = t;
        bar.current.style.transform = t;
      }
    });
    return () => {
      off();
      ro.disconnect();
      window.removeEventListener("resize", onResize);
      window.removeEventListener("load", measure);
    };
  }, []);

  return (
    <nav className={styles.rail} aria-label="Разделы страницы">
      <span className={styles.track} aria-hidden="true">
        <span ref={bar} className={styles.bar} />
      </span>
      <ol>
        {site.sections.map((n, i) => (
          <li key={n.id} data-active={i === active}>
            <Link href={n.href} aria-current={i === active ? "true" : undefined}>
              <span className={`${styles.index} t-num`}>{n.index}</span>
              <span className={styles.label}>{n.label}</span>
            </Link>
          </li>
        ))}
      </ol>
    </nav>
  );
}
