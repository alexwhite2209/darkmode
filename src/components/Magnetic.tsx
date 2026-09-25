"use client";

import { useEffect, useRef, type ReactElement, cloneElement, type Ref } from "react";
import { Spring2 } from "@/animations/spring";
import { ticker } from "@/animations/ticker";
import { pointer } from "@/animations/pointer";

/**
 * Magnetic hover: the child drifts toward the pointer inside a radius (spring interpolated).
 * Desktop only; on touch the child is untouched.
 */
export function Magnetic({ children, strength = 0.32, radius = 110 }: { children: ReactElement<{ ref?: Ref<HTMLElement> }>; strength?: number; radius?: number }) {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    if (document.documentElement.classList.contains("is-reduced")) return;
    const s = new Spring2(0, 0, { stiffness: 180, damping: 18 });
    let rect = el.getBoundingClientRect();
    let near = false;
    let lastX = 0, lastY = 0;
    const measure = () => (rect = el.getBoundingClientRect());
    const enter = () => measure();
    el.addEventListener("pointerenter", enter);
    window.addEventListener("scroll", measure, { passive: true });
    window.addEventListener("resize", measure, { passive: true });
    const off = ticker.add((_t, dt) => {
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = pointer.x - cx;
      const dy = pointer.y - cy;
      const dist = Math.hypot(dx, dy);
      const reach = radius + Math.max(rect.width, rect.height) / 2;
      near = dist < reach;
      s.set(near ? dx * strength : 0, near ? dy * strength : 0);
      const moving = s.step(dt);
      const x = Math.round(s.x.value * 10) / 10;
      const y = Math.round(s.y.value * 10) / 10;
      if (x !== lastX || y !== lastY) {
        lastX = x;
        lastY = y;
        el.style.transform = x || y ? `translate3d(${x}px, ${y}px, 0)` : "";
      }
      return moving;
    });
    return () => {
      off();
      el.removeEventListener("pointerenter", enter);
      window.removeEventListener("scroll", measure);
      window.removeEventListener("resize", measure);
      el.style.transform = "";
    };
  }, [strength, radius]);

  return cloneElement(children, { ref: (node: HTMLElement | null) => (ref.current = node) } as never);
}
