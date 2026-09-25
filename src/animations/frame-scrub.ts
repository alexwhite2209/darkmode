/**
 * Scroll-driven frame sequence (the alternative to VideoScrub, same interface).
 *
 *   SCROLL -> PROGRESS 0..1 -> (eased) -> FRAME INDEX -> CANVAS
 *
 * - frames are plain images (public/frames/<set>/0000.webp …), so any step, forward or backward,
 *   is instant: no seeking and no video decoding while scrolling
 * - loading is progressive: every 16th frame first (the preloader waits only for these), then 8th, 4th,
 *   2nd, then the rest in the background; until a frame arrives, the nearest loaded one is drawn
 * - every frame of the 24 fps film is drawn whole, as shot (no blending between frames)
 * - the canvas covers its box like object-fit: cover and follows resizes
 */
import { ticker } from "./ticker";
import { damp } from "@/lib/math";
import type { ScrubState } from "./video-scrub";

type Opts = {
  /** folder with 0000.webp … */
  path: string;
  /** frames in the folder */
  count: number;
  /** use only the first `use` frames (the finale plays the start of the film) */
  use?: number;
  smoothing?: number;
  /** appended as ?v= so browsers fetch replaced frames */
  version?: number;
  onProgress?: (fraction: number) => void;
  onState?: (s: ScrubState) => void;
};

const PASSES = [16, 8, 4, 2, 1];
const PARALLEL = 6;

export class FrameScrub {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private opts: Opts & { smoothing: number };
  private imgs: (HTMLImageElement | null)[] = [];
  private order: number[] = [];
  private firstPass = 0;
  private loadedFirst = 0;
  private cancelled = false;
  private unsub: (() => void) | null = null;
  private ro: ResizeObserver | null = null;
  private drawn = "";
  private n: number;
  target = 0;
  shown = 0;
  state: ScrubState = "idle";

  constructor(canvas: HTMLCanvasElement, opts: Opts) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d", { alpha: false })!;
    this.opts = { smoothing: 0.14, ...opts };
    this.n = Math.min(opts.count, opts.use ?? opts.count);
    this.imgs = new Array(this.n).fill(null);
    // progressive order: 0, 8, 16 … then 4, 12 … then 2, 6 … then the odd ones; always the last frame
    const seen = new Set<number>();
    for (const step of PASSES) {
      for (let i = 0; i < this.n; i += step) if (!seen.has(i)) (seen.add(i), this.order.push(i));
      if (step === PASSES[0]) {
        if (!seen.has(this.n - 1)) (seen.add(this.n - 1), this.order.push(this.n - 1));
        this.firstPass = this.order.length;
      }
    }
    this.resize();
    if ("ResizeObserver" in window) {
      this.ro = new ResizeObserver(() => this.resize());
      this.ro.observe(canvas);
    }
    this.unsub = ticker.add(this.tick, 10);
  }

  private setState(s: ScrubState) {
    this.state = s;
    this.opts.onState?.(s);
  }

  private src(i: number) {
    return `${this.opts.path}/${String(i).padStart(4, "0")}.webp${this.opts.version ? `?v=${this.opts.version}` : ""}`;
  }

  load() {
    this.setState("loading");
    let next = 0;
    let failed = 0;
    const one = (): Promise<void> | void => {
      if (this.cancelled || next >= this.order.length) return;
      const i = this.order[next++];
      const first = next <= this.firstPass;
      const img = new Image();
      img.decoding = "async";
      if (first) img.fetchPriority = "high";
      img.src = this.src(i);
      return img
        .decode()
        .then(() => {
          if (this.cancelled) return;
          this.imgs[i] = img;
          this.drawn = "";
          ticker.wake();
        })
        .catch(() => {
          failed++;
        })
        .finally(() => {
          if (first) {
            this.loadedFirst++;
            this.opts.onProgress?.(this.loadedFirst / this.firstPass);
            if (this.loadedFirst === this.firstPass && !this.cancelled) {
              if (failed > this.firstPass / 2) this.setState("failed");
              else {
                this.setState("ready");
                ticker.wake();
              }
            }
          }
          return one();
        });
    };
    for (let k = 0; k < PARALLEL; k++) one();
  }

  setTarget(p: number) {
    if (p === this.target) return;
    this.target = p;
    ticker.wake();
  }

  private resize = () => {
    const r = this.canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.max(1, Math.round(r.width * dpr));
    const h = Math.max(1, Math.round(r.height * dpr));
    if (w !== this.canvas.width || h !== this.canvas.height) {
      this.canvas.width = w;
      this.canvas.height = h;
      this.drawn = "";
      ticker.wake();
    }
  };

  /** nearest loaded frame to i, searching outward */
  private nearest(i: number) {
    if (this.imgs[i]) return i;
    for (let d = 1; d < this.n; d++) {
      if (i - d >= 0 && this.imgs[i - d]) return i - d;
      if (i + d < this.n && this.imgs[i + d]) return i + d;
    }
    return -1;
  }

  private cover(img: HTMLImageElement) {
    const cw = this.canvas.width;
    const ch = this.canvas.height;
    const s = Math.max(cw / img.naturalWidth, ch / img.naturalHeight);
    const w = img.naturalWidth * s;
    const h = img.naturalHeight * s;
    this.ctx.imageSmoothingQuality = "high";
    this.ctx.drawImage(img, (cw - w) / 2, (ch - h) / 2, w, h);
  }

  private draw() {
    // one whole frame at a time, as shot
    const i = this.nearest(Math.round(this.shown * (this.n - 1)));
    if (i < 0) return;
    const key = `${i}|${this.canvas.width}x${this.canvas.height}`;
    if (key === this.drawn) return;
    this.drawn = key;
    this.cover(this.imgs[i]!);
  }

  private tick = (_t: number, dt: number) => {
    if (this.state !== "ready") return false;
    const d = this.target - this.shown;
    let busy = false;
    if (Math.abs(d) < 0.0002) this.shown = this.target;
    else {
      this.shown = damp(this.shown, this.target, this.opts.smoothing, dt);
      busy = true;
    }
    this.draw();
    return busy;
  };

  destroy() {
    this.cancelled = true;
    this.unsub?.();
    this.ro?.disconnect();
    this.imgs = [];
  }
}
