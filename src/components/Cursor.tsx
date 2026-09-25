"use client";

import { useEffect, useRef } from "react";
import { Spring2, Spring } from "@/animations/spring";
import { ticker } from "@/animations/ticker";
import { pointer } from "@/animations/pointer";
import styles from "./Cursor.module.css";

/**
 * The O as a cursor companion (desktop only). The native cursor stays; the ring trails it on a spring,
 * grows over [data-cursor] targets and shows their label ("Смотреть", "Открыть").
 */
export function Cursor() {
  const wrap = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLSpanElement>(null);
  const label = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = wrap.current!;
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!fine || reduced) return;
    el.dataset.on = "true";
    const pos = new Spring2(pointer.x, pointer.y, { stiffness: 320, damping: 30 });
    const size = new Spring(1, { stiffness: 260, damping: 24 });
    let visible = false;
    let lastPos = "";
    let lastSize = "";

    const over = (e: PointerEvent) => {
      const t = e.target as HTMLElement;
      const target = t.closest<HTMLElement>("[data-cursor]");
      const interactive = t.closest("a, button, [role='tab'], input, textarea, label, summary");
      let mode = "";
      if (target) {
        mode = "label";
        if (label.current) label.current.textContent = target.dataset.cursor || "";
        size.set(2.6);
      } else if (interactive) {
        mode = "link";
        size.set(0.5);
      } else {
        size.set(1);
      }
      el.dataset.mode = mode;
      ticker.wake();
    };
    const leave = () => {
      visible = false;
      el.dataset.visible = "false";
    };
    document.addEventListener("pointerover", over, { passive: true });
    document.documentElement.addEventListener("pointerleave", leave);

    const off = ticker.add((_t, dt) => {
      if (!pointer.moved) return false;
      if (!visible) {
        visible = true;
        el.dataset.visible = "true";
        pos.x.jump(pointer.x);
        pos.y.jump(pointer.y);
      }
      pos.set(pointer.x, pointer.y);
      const a = pos.step(dt);
      const b = size.step(dt);
      const p = `translate3d(${pos.x.value.toFixed(1)}px, ${pos.y.value.toFixed(1)}px, 0)`;
      if (p !== lastPos) {
        lastPos = p;
        el.style.transform = p;
      }
      const s = `scale(${size.value.toFixed(3)})`;
      if (s !== lastSize && ring.current) {
        lastSize = s;
        ring.current.style.transform = s;
      }
      return a || b;
    }, 5);

    return () => {
      off();
      document.removeEventListener("pointerover", over);
      document.documentElement.removeEventListener("pointerleave", leave);
    };
  }, []);

  return (
    <div ref={wrap} className={styles.cursor} aria-hidden="true">
      <span ref={ring} className={styles.ring} />
      <span ref={label} className={styles.label} />
    </div>
  );
}
