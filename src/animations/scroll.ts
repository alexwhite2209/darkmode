/**
 * Scroll engine: Lenis smooth scroll driven by the shared ticker + a registry of scroll "scenes".
 *
 *   SCROLL -> PROGRESS 0..1 -> ANIMATION
 *
 * Layout (element top/height) is measured only on refresh (resize, fonts, images, body size change),
 * never per frame, so no getBoundingClientRect / layout thrashing while scrolling.
 */
import Lenis from "lenis";
import { ticker } from "./ticker";
import { lenisEasing } from "./easing";
import { clamp } from "@/lib/math";

export type Measure = { top: number; height: number; left: number; width: number };
export type RangeFn = (m: Measure, vh: number, maxY: number) => [number, number];
export type SceneUpdate = (p: number, info: { raw: number; y: number; vh: number; m: Measure }) => void;

type Scene = {
  id: number;
  el: HTMLElement;
  range: RangeFn;
  onUpdate: SceneUpdate;
  m: Measure;
  last: number;
};

/** common ranges */
export const ranges = {
  /** from the element's top entering the bottom of the viewport to its bottom leaving the top */
  through: ((m, vh) => [m.top - vh, m.top + m.height]) as RangeFn,
  /** pinned section: from its top reaching the viewport top to its bottom reaching the viewport bottom */
  pinned: ((m, vh) => [m.top, m.top + m.height - vh]) as RangeFn,
  /** element enters: bottom of viewport -> centre */
  enter: ((m, vh) => [m.top - vh, m.top - vh * 0.35]) as RangeFn,
};

class ScrollEngine {
  lenis: Lenis | null = null;
  y = 0;
  vh = 800;
  vw = 1200;
  maxY = 0;
  velocity = 0;
  private scenes: Scene[] = [];
  private nextId = 1;
  private dirty = true;
  private forceUpdate = true;
  private inited = false;
  private listeners = new Set<(y: number) => void>();
  private locks = 0;

  init(opts: { smooth: boolean }) {
    if (this.inited || typeof window === "undefined") return;
    this.inited = true;
    if (opts.smooth) {
      this.lenis = new Lenis({
        autoRaf: false,
        duration: 1.15,
        easing: lenisEasing,
        smoothWheel: true,
        syncTouch: false,
        wheelMultiplier: 0.9,
      });
    }
    ticker.add(this.tick, -100);
    ticker.start();
    this.readViewport();
    let t: number | undefined;
    const onResize = () => {
      window.clearTimeout(t);
      t = window.setTimeout(() => this.refresh(), 120);
    };
    window.addEventListener("resize", onResize, { passive: true });
    window.addEventListener("orientationchange", onResize, { passive: true });
    window.addEventListener("load", () => this.refresh());
    document.fonts?.ready.then(() => this.refresh()).catch(() => undefined);
    if ("ResizeObserver" in window) {
      new ResizeObserver(() => this.markDirty()).observe(document.body);
    }
  }

  private readViewport() {
    this.vh = window.innerHeight;
    this.vw = window.innerWidth;
    this.maxY = Math.max(0, document.documentElement.scrollHeight - this.vh);
  }

  markDirty = () => {
    this.dirty = true;
    ticker.wake();
  };

  refresh = () => {
    this.readViewport();
    this.lenis?.resize();
    this.markDirty();
  };

  private measure() {
    const y = window.scrollY;
    for (const s of this.scenes) {
      const r = s.el.getBoundingClientRect();
      s.m = { top: r.top + y, height: r.height, left: r.left, width: r.width };
    }
    this.readViewport();
    this.dirty = false;
    this.forceUpdate = true;
  }

  private tick = (t: number) => {
    let busy = false;
    if (this.lenis) {
      this.lenis.raf(t);
      busy = this.lenis.isScrolling === "smooth";
    }
    if (this.dirty) this.measure();
    const y = this.lenis ? this.lenis.animatedScroll : window.scrollY;
    const changed = y !== this.y;
    this.velocity = this.lenis ? this.lenis.velocity : y - this.y;
    this.y = y;
    if (changed || this.forceUpdate) {
      const force = this.forceUpdate;
      this.forceUpdate = false;
      for (const s of this.scenes) this.updateScene(s, force);
      this.listeners.forEach((fn) => fn(y));
    }
    return busy;
  };

  private updateScene(s: Scene, force: boolean) {
    const [a, b] = s.range(s.m, this.vh, this.maxY);
    const raw = (this.y - a) / (b - a || 1);
    const p = clamp(raw);
    if (!force && Math.abs(p - s.last) < 1e-5) return;
    s.last = p;
    s.onUpdate(p, { raw, y: this.y, vh: this.vh, m: s.m });
  }

  /** register a scroll scene; returns an unsubscribe */
  scene(el: HTMLElement, range: RangeFn, onUpdate: SceneUpdate) {
    const r = el.getBoundingClientRect();
    const s: Scene = {
      id: this.nextId++,
      el,
      range,
      onUpdate,
      m: { top: r.top + window.scrollY, height: r.height, left: r.left, width: r.width },
      last: -1,
    };
    this.scenes.push(s);
    this.markDirty();
    return () => {
      this.scenes = this.scenes.filter((x) => x.id !== s.id);
    };
  }

  onScroll(fn: (y: number) => void) {
    this.listeners.add(fn);
    this.forceUpdate = true;
    return () => {
      this.listeners.delete(fn);
    };
  }

  scrollTo(target: number | string | HTMLElement, opts: { offset?: number; immediate?: boolean; duration?: number } = {}) {
    const el = typeof target === "string" ? (document.querySelector(target) as HTMLElement | null) : target;
    if (el === null) return;
    if (this.lenis) {
      this.lenis.scrollTo(el as number | HTMLElement, {
        offset: opts.offset ?? 0,
        immediate: opts.immediate,
        duration: opts.duration ?? 1.6,
        force: true,
      });
      ticker.wake();
      return;
    }
    const top = typeof el === "number" ? el : el.getBoundingClientRect().top + window.scrollY + (opts.offset ?? 0);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top, behavior: opts.immediate || reduce ? "auto" : "smooth" });
  }

  /** stop scrolling (preloader, dialogs); nested locks are counted */
  lock() {
    this.locks++;
    if (this.locks === 1) {
      this.lenis?.stop();
      document.documentElement.classList.add("is-locked");
    }
  }

  unlock() {
    this.locks = Math.max(0, this.locks - 1);
    if (this.locks === 0) {
      this.lenis?.start();
      document.documentElement.classList.remove("is-locked");
      ticker.wake();
    }
  }
}

export const scroll = new ScrollEngine();
