/**
 * Scroll-driven frame sequence (the alternative to VideoScrub, same interface).
 *
 *   SCROLL -> PROGRESS 0..1 -> (eased) -> FRAME INDEX -> CANVAS
 *
 * - frames are plain images (public/frames/<set>/0000.webp …), so any step, forward or backward,
 *   is instant: no seeking and no video decoding while scrolling
 * - loading is progressive: every 16th frame first (the preloader waits only for these), then 8th, 4th,
 *   2nd, then the rest in the background; until a frame arrives, the nearest loaded one is drawn
 * - every frame of the 24 fps film is drawn whole; only near the midpoint between two frames a short,
 *   light crossfade softens the step (BLEND)
 * - the canvas covers its box like object-fit: cover and follows resizes
 */
import { ticker } from "./ticker";
import { damp } from "@/lib/math";
export type ScrubState = "idle" | "loading" | "ready" | "failed";

type Opts = {
  /** folder with 0000.webp … */
  path: string;
  /** frames in the folder */
  count: number;
  /** use only the first `use` frames (the finale plays the start of the film) */
  use?: number;
  smoothing?: number;
  /** horizontal point of the picture (0..1) kept in the centre when the sides are cropped */
  focusX?: number;
  /** share of the picture width (around focusX) that must always fit on screen */
  focusWidth?: number;
  /** appended as ?v= so browsers fetch replaced frames */
  version?: number;
  onProgress?: (fraction: number) => void;
  /** share of ALL frames loaded (the first pass is only what the preloader waits for) */
  onTotal?: (fraction: number) => void;
  onState?: (s: ScrubState) => void;
};

const PASSES = [16, 8, 4, 2, 1];
/** share of the step between two frames that is crossfaded (light: the rest shows whole frames) */
const BLEND = 0.4;
const PARALLEL = 6;

export class FrameScrub {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private opts: Opts & { smoothing: number };
  private imgs: (HTMLImageElement | null)[] = [];
  private order: number[] = [];
  private firstPass = 0;
  private loadedFirst = 0;
  private settled = 0;
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
    const done = (k: number) => Math.min(1, k / this.order.length);
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
          if (!this.cancelled) this.opts.onTotal?.(done(++this.settled));
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
    const iw = img.naturalWidth;
    const ih = img.naturalHeight;
    const cover = Math.max(cw / iw, ch / ih);
    // focusWidth: this share of the picture width must stay on screen (the logo on narrow phones)
    const fwid = this.opts.focusWidth ?? 0;
    const s = fwid ? Math.min(cover, cw / (fwid * iw)) : cover;
    const w = iw * s;
    const h = ih * s;
    const fx = this.opts.focusX ?? 0.5;
    this.ctx.imageSmoothingQuality = "high";
    if (s < cover) {
      // the picture no longer fills the height: a dimmed, covering copy fills the strips
      const wc = iw * cover;
      this.ctx.drawImage(img, Math.min(0, Math.max(cw - wc, cw / 2 - fx * wc)), (ch - ih * cover) / 2, wc, ih * cover);
      this.ctx.fillStyle = "rgba(2, 2, 3, 0.72)";
      this.ctx.fillRect(0, 0, cw, ch);
    }
    // keep focusX in the centre, never uncovering an edge when the picture is wider than the screen
    const x = w >= cw ? Math.min(0, Math.max(cw - w, cw / 2 - fx * w)) : cw / 2 - fx * w;
    this.ctx.drawImage(img, x, (ch - h) / 2, w, h);
  }

  private draw() {
    // each frame stays crisp for most of its step; only around the midpoint to the next frame
    // a short, light crossfade (BLEND of the step) softens the change
    const pos = this.shown * (this.n - 1);
    const a = Math.floor(pos);
    const t = pos - a;
    const ia = this.nearest(a);
    if (ia < 0) return;
    const b = Math.min(this.n - 1, a + 1);
    const ib = this.imgs[b] ? b : ia;
    const x = Math.min(1, Math.max(0, (t - (0.5 - BLEND / 2)) / BLEND));
    const k = ib === ia ? 0 : Math.round(x * x * (3 - 2 * x) * 12) / 12;
    const key = `${ia}|${ib}|${k}|${this.canvas.width}x${this.canvas.height}`;
    if (key === this.drawn) return;
    this.drawn = key;
    if (k >= 1) this.cover(this.imgs[ib]!);
    else {
      this.cover(this.imgs[ia]!);
      if (k > 0) {
        this.ctx.globalAlpha = k;
        this.cover(this.imgs[ib]!);
        this.ctx.globalAlpha = 1;
      }
    }
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
