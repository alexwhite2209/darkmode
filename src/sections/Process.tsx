"use client";

import { useEffect, useRef, useState } from "react";
import type { ProcessStep } from "@/types";
import { scroll, ranges } from "@/animations/scroll";
import { SplitWords } from "@/components/SplitWords";
import styles from "./Process.module.css";

const R = 44;
const C = 2 * Math.PI * R;

/** IDEA -> SYSTEM -> DESIGN -> DEVELOPMENT -> LAUNCH. The O fills as the steps go by. */
export function Process({ steps }: { steps: ProcessStep[] }) {
  const section = useRef<HTMLElement>(null);
  const arc = useRef<SVGCircleElement>(null);
  const line = useRef<HTMLSpanElement>(null);
  const [active, setActive] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const el = section.current!;
    const mobile = window.matchMedia("(max-width: 900px)").matches;
    let lastA = -1;
    let lastDone = false;
    let lastOff = -1;
    return scroll.scene(el, mobile ? ranges.through : ranges.pinned, (p) => {
      const q = mobile ? Math.min(1, Math.max(0, (p - 0.15) / 0.6)) : p;
      const a = Math.min(steps.length - 1, Math.floor(q * steps.length * 0.999));
      if (a !== lastA) {
        lastA = a;
        setActive(a);
      }
      const d = q > 0.96;
      if (d !== lastDone) {
        lastDone = d;
        setDone(d);
      }
      const off = Math.round(C * (1 - q) * 10) / 10;
      if (off !== lastOff) {
        lastOff = off;
        arc.current?.style.setProperty("stroke-dashoffset", String(off));
        line.current?.style.setProperty("transform", `scaleY(${q.toFixed(4)})`);
      }
    });
  }, [steps.length]);

  const step = steps[active];

  return (
    <section ref={section} id="process" className={styles.section} data-done={done} aria-labelledby="process-title">
      <div className={styles.sticky}>
        <div className={`container ${styles.inner}`}>
          <div className={styles.head}>
            <p className={styles.num}>04</p>
            <h2 id="process-title" className="t-h2" data-reveal="words">
              <SplitWords text="Как мы работаем" />
            </h2>
          </div>

          <div className={styles.orbit} aria-hidden="true">
            <svg viewBox="0 0 100 100" className={styles.ring}>
              <defs>
                <linearGradient id="proc-arc" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor="#ffd6a0" />
                  <stop offset="0.5" stopColor="#ff7a1a" />
                  <stop offset="1" stopColor="#b8410e" />
                </linearGradient>
              </defs>
              <circle cx="50" cy="50" r={R} className={styles.track} />
              <circle ref={arc} cx="50" cy="50" r={R} className={styles.arc} strokeDasharray={C} strokeDashoffset={C} />
              {steps.map((s, i) => {
                const ang = (-90 + (i * 360) / steps.length) * (Math.PI / 180);
                return (
                  <circle
                    key={s.id}
                    cx={50 + R * Math.cos(ang)}
                    cy={50 + R * Math.sin(ang)}
                    r={2.1}
                    className={styles.node}
                    data-on={i <= active}
                  />
                );
              })}
            </svg>
            <div className={styles.center}>
              <span className={`${styles.big} t-num`}>{String(step.index).padStart(2, "0")}</span>
              <span className={styles.en}>{step.titleEn}</span>
            </div>
          </div>

          <ol className={styles.steps}>
            <span className={styles.lineTrack} aria-hidden="true">
              <span ref={line} className={styles.line} />
            </span>
            {steps.map((s, i) => (
              <li key={s.id} className={styles.step} data-state={i < active ? "past" : i === active ? "now" : "next"} aria-current={i === active ? "step" : undefined}>
                <span className={`${styles.stepIndex} t-num`}>{String(s.index).padStart(2, "0")}</span>
                <div>
                  <h3 className={styles.stepTitle}>{s.title}</h3>
                  <p className={styles.stepText}>{s.text}</p>
                  <ul className={styles.deliverables}>
                    {s.deliverables.map((d) => (
                      <li key={d}>{d}</li>
                    ))}
                  </ul>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
