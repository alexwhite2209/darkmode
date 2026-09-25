"use client";

import { useEffect, useRef } from "react";
import { scroll, ranges } from "@/animations/scroll";
import { smoothstep } from "@/lib/math";
import styles from "./Contact.module.css";

/** Final phrase before the way back out of the O. The three lines converge as the section arrives. */
export function Contact() {
  const section = useRef<HTMLElement>(null);
  const words = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (document.documentElement.classList.contains("is-reduced")) return;
    let last = -1;
    return scroll.scene(section.current!, ranges.through, (p) => {
      const k = smoothstep(p, 0.08, 0.5);
      if (Math.abs(k - last) < 0.002) return;
      last = k;
      words.current!.style.setProperty("--k", k.toFixed(3));
    });
  }, []);

  return (
    <section ref={section} id="contact" className={styles.section} aria-labelledby="contact-title">
      <div className={`container ${styles.inner}`}>
        <p className={styles.num}>06</p>
        <h2 id="contact-title" ref={words} className={`t-display ${styles.title}`} style={{ "--k": 0 } as React.CSSProperties}>
          <span className={styles.l1}>Создаём</span>
          <span className={styles.l2}>эволюцию</span>
          <span className={styles.l3}>сайтов.</span>
        </h2>
      </div>
    </section>
  );
}
