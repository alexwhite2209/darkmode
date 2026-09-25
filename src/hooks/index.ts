"use client";

import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from "react";
import { ticker, type TickFn } from "@/animations/ticker";
import { scroll, type RangeFn, type SceneUpdate } from "@/animations/scroll";
import { parallax } from "@/animations/parallax";

export const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

export function useMediaQuery(query: string, initial = false) {
  const [match, setMatch] = useState(initial);
  useIsoLayoutEffect(() => {
    const mq = window.matchMedia(query);
    setMatch(mq.matches);
    const on = (e: MediaQueryListEvent) => setMatch(e.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, [query]);
  return match;
}

export const useReducedMotion = () => useMediaQuery("(prefers-reduced-motion: reduce)");
export const useFinePointer = () => useMediaQuery("(hover: hover) and (pointer: fine)");
export const useIsMobile = () => useMediaQuery("(max-width: 767px)");

/** subscribe to the shared animation loop */
export function useTicker(fn: TickFn, enabled = true, priority = 0) {
  const ref = useRef(fn);
  ref.current = fn;
  useEffect(() => {
    if (!enabled) return;
    return ticker.add((t, dt) => ref.current(t, dt), priority);
  }, [enabled, priority]);
}

/** register a scroll scene for an element */
export function useScrollScene<T extends HTMLElement>(
  ref: RefObject<T | null>,
  range: RangeFn,
  onUpdate: SceneUpdate,
  enabled = true,
) {
  const cb = useRef(onUpdate);
  cb.current = onUpdate;
  useEffect(() => {
    const el = ref.current;
    if (!el || !enabled) return;
    return scroll.scene(el, range, (p, info) => cb.current(p, info));
  }, [ref, range, enabled]);
}

export function useParallax<T extends HTMLElement>(ref: RefObject<T | null>, speed: number, enabled = true) {
  useEffect(() => {
    const el = ref.current;
    if (!el || !enabled || !speed) return;
    const off = parallax(el, speed);
    return () => {
      off();
      el.style.transform = "";
    };
  }, [ref, speed, enabled]);
}
