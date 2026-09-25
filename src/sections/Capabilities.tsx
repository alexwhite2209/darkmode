"use client";

import { useEffect, useRef, useState } from "react";
import type { Capability } from "@/types";
import { scroll } from "@/animations/scroll";
import { ticker } from "@/animations/ticker";
import { pointer } from "@/animations/pointer";
import { Spring2 } from "@/animations/spring";
import { clamp } from "@/lib/math";
import { SplitWords } from "@/components/SplitWords";
import styles from "./Capabilities.module.css";

/** WHAT WE DO: ten directions; the preview shows the world each one belongs to. */
export function Capabilities({ items }: { items: Capability[] }) {
  const [active, setActive] = useState(0);
  const list = useRef<HTMLOListElement>(null);
  const preview = useRef<HTMLDivElement>(null);
  const hovering = useRef(false);

  // the row closest to the viewport centre becomes active while scrolling
  useEffect(() => {
    const rows = Array.from(list.current!.querySelectorAll<HTMLElement>("[data-row]"));
    let centers: number[] = [];
    const measure = () => {
      const y = window.scrollY;
      centers = rows.map((r) => {
        const b = r.getBoundingClientRect();
        return b.top + y + b.height / 2;
      });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(list.current!);
    window.addEventListener("load", measure);
    let last = -1;
    const off = scroll.onScroll((y) => {
      if (hovering.current) return;
      const mid = y + window.innerHeight * 0.5;
      let best = 0;
      let bd = Infinity;
      centers.forEach((c, i) => {
        const d = Math.abs(c - mid);
        if (d < bd) {
          bd = d;
          best = i;
        }
      });
      if (best !== last) {
        last = best;
        setActive(best);
      }
    });
    return () => {
      off();
      ro.disconnect();
      window.removeEventListener("load", measure);
    };
  }, []);

  // pointer: the preview leans toward the cursor and a light spot follows it
  useEffect(() => {
    const el = preview.current!;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    if (document.documentElement.classList.contains("is-reduced")) return;
    const sp = new Spring2(0, 0, { stiffness: 90, damping: 18 });
    let last = "";
    let inView = false;
    const io = new IntersectionObserver(([e]) => {
      inView = e.isIntersecting;
      ticker.wake();
    });
    io.observe(el);
    const off = ticker.add((_t, dt) => {
      if (!inView) return false;
      sp.set(clamp(pointer.nx), clamp(pointer.ny));
      const moving = sp.step(dt);
      const css = `perspective(1600px) rotateY(${(sp.x.value * 5).toFixed(2)}deg) rotateX(${(-sp.y.value * 4).toFixed(2)}deg)`;
      if (css !== last) {
        last = css;
        el.style.transform = css;
        el.style.setProperty("--sx", `${((sp.x.value + 1) * 50).toFixed(1)}%`);
        el.style.setProperty("--sy", `${((sp.y.value + 1) * 50).toFixed(1)}%`);
      }
      return moving;
    });
    return () => {
      off();
      io.disconnect();
    };
  }, []);

  return (
    <section id="services" className={styles.section} aria-labelledby="services-title">
      <div className={`container ${styles.head}`}>
        <p className={styles.num}>03</p>
        <h2 id="services-title" className="t-h2" data-reveal="words">
          <SplitWords text="Что мы делаем" />
        </h2>
        <p className="t-lead" data-reveal="up">
          Каждый мир из ролика это отдельный тип сайта. Выберите свой, и мы соберём его под ваш бизнес.
        </p>
      </div>

      <div className={`container ${styles.grid}`}>
        <div className={styles.previewCol} aria-hidden="true">
          <div ref={preview} className={styles.preview}>
            {items.map((c, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={c.id} src={c.image.src} alt="" loading="lazy" decoding="async" data-on={i === active} width={1280} height={720} />
            ))}
            <span className={styles.spot} />
            <span className={styles.previewLabel}>
              <span className="t-num">{String(active + 1).padStart(2, "0")}</span>
              {items[active]?.title}
            </span>
          </div>
        </div>

        <ol
          ref={list}
          className={styles.list}
          onPointerLeave={() => {
            hovering.current = false;
          }}
        >
          {items.map((c, i) => (
            <li
              key={c.id}
              data-row
              data-active={i === active}
              className={styles.row}
              onPointerEnter={() => {
                hovering.current = true;
                setActive(i);
              }}
            >
              <button type="button" className={styles.rowBtn} onFocus={() => setActive(i)} aria-pressed={i === active}>
                <span className={styles.rowTitle} data-reveal={i % 2 ? "right" : "left"}>
                  {c.title}
                </span>
              </button>
              <div className={styles.rowBody}>
                <p>{c.lead}</p>
                <ul className={styles.examples} aria-label="Например">
                  {c.examples.map((e) => (
                    <li key={e}>{e}</li>
                  ))}
                </ul>
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className={styles.rowImg} src={c.image.src.replace(".webp", "-sm.webp")} alt={c.image.alt} loading="lazy" decoding="async" width={640} height={360} />
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
