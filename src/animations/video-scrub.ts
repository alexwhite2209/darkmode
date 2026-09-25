/**
 * Scroll-driven video.
 *
 *   SCROLL POSITION -> NORMALIZED PROGRESS -> (eased) -> VIDEO.currentTime
 *
 * - the file is fetched whole as a Blob (works on hosts without HTTP Range; progress is reported)
 * - displayed time eases toward the target inside the shared ticker and rests when converged
 * - seeks are gated: never a new currentTime while one is in flight; only the newest target survives
 * - redundant updates (less than half a frame away from what is shown) are skipped
 * - any failure leaves the poster in place; the page stays complete without the video
 */
import { ticker } from "./ticker";
import { damp } from "@/lib/math";

import type { ScrubState } from "./frame-scrub";

type Opts = {
  fps: number;
  /** fraction of the remaining distance covered per 60 fps frame */
  smoothing?: number;
  onProgress?: (fraction: number) => void;
  onState?: (s: ScrubState) => void;
};

export class VideoScrub {
  private video: HTMLVideoElement;
  private opts: Required<Omit<Opts, "onProgress" | "onState">> & Opts;
  private objectUrl: string | null = null;
  private abort: AbortController | null = null;
  private seekBusy = false;
  private pending: number | null = null;
  private lastSeek = -1;
  private unsub: (() => void) | null = null;
  target = 0;
  shown = 0;
  state: ScrubState = "idle";
  duration = 0;

  constructor(video: HTMLVideoElement, opts: Opts) {
    this.video = video;
    this.opts = { smoothing: 0.14, ...opts };
    video.muted = true;
    video.playsInline = true;
    video.preload = "auto";
    video.addEventListener("seeked", this.onSeeked);
    video.addEventListener("error", this.onError);
    this.unsub = ticker.add(this.tick, 10);
  }

  private setState(s: ScrubState) {
    this.state = s;
    this.opts.onState?.(s);
  }

  private loadToken = 0;

  async load(url: string, bytesHint = 0) {
    this.cancel();
    const token = ++this.loadToken;
    this.setState("loading");
    const ctrl = new AbortController();
    this.abort = ctrl;
    let watchdog = window.setTimeout(() => ctrl.abort(), 20000);
    try {
      const res = await fetch(url, { signal: ctrl.signal, priority: "low" } as RequestInit);
      if (!res.ok || !res.body) throw new Error(`video ${res.status}`);
      const total = Number(res.headers.get("Content-Length")) || bytesHint;
      const reader = res.body.getReader();
      const chunks: BlobPart[] = [];
      let got = 0;
      let lastReport = 0;
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        window.clearTimeout(watchdog);
        watchdog = window.setTimeout(() => ctrl.abort(), 20000);
        chunks.push(value as BlobPart);
        got += value.length;
        const now = performance.now();
        if (total && (now - lastReport > 80)) {
          lastReport = now;
          this.opts.onProgress?.(Math.min(1, got / total));
        }
      }
      window.clearTimeout(watchdog);
      this.opts.onProgress?.(1);
      if (ctrl.signal.aborted) return;
      this.objectUrl = URL.createObjectURL(new Blob(chunks, { type: "video/mp4" }));
      this.video.src = this.objectUrl;
      this.video.load();
      await new Promise<void>((resolve, reject) => {
        const ok = () => {
          cleanup();
          resolve();
        };
        const bad = () => {
          cleanup();
          reject(new Error("video decode"));
        };
        const cleanup = () => {
          this.video.removeEventListener("loadeddata", ok);
          this.video.removeEventListener("error", bad);
        };
        this.video.addEventListener("loadeddata", ok, { once: true });
        this.video.addEventListener("error", bad, { once: true });
      });
      this.duration = this.video.duration || 0;
      this.shown = this.target;
      this.lastSeek = -1;
      this.seekBusy = false;
      this.requestSeek(this.shown * this.duration);
      this.setState("ready");
    } catch {
      window.clearTimeout(watchdog);
      if (token === this.loadToken) this.setState("failed");
    }
  }

  setTarget(p: number) {
    if (p === this.target) return;
    this.target = p;
    ticker.wake();
  }

  private tick = (_t: number, dt: number) => {
    if (this.state !== "ready" || !this.duration) return false;
    const d = this.target - this.shown;
    if (Math.abs(d) < 0.00025) {
      if (d !== 0) {
        this.shown = this.target;
        this.requestSeek(this.shown * this.duration);
      }
      return false;
    }
    this.shown = damp(this.shown, this.target, this.opts.smoothing!, dt);
    this.requestSeek(this.shown * this.duration);
    return true;
  };

  private requestSeek(t: number) {
    const time = Math.min(Math.max(0, t), Math.max(0, this.duration - 0.001));
    // protection from redundant currentTime writes: skip anything closer than half a frame
    if (Math.abs(time - this.lastSeek) < 0.5 / this.opts.fps) return;
    if (this.seekBusy) {
      this.pending = time;
      return;
    }
    this.seekBusy = true;
    this.lastSeek = time;
    try {
      this.video.currentTime = time;
    } catch {
      this.seekBusy = false;
    }
  }

  private onSeeked = () => {
    this.seekBusy = false;
    if (this.pending !== null) {
      const t = this.pending;
      this.pending = null;
      this.requestSeek(t);
    }
  };

  private onError = () => {
    // deadlock escape
    this.seekBusy = false;
    this.pending = null;
    if (this.state === "ready") this.setState("failed");
  };

  cancel() {
    this.loadToken++;
    this.abort?.abort();
    this.abort = null;
    if (this.objectUrl) {
      URL.revokeObjectURL(this.objectUrl);
      this.objectUrl = null;
    }
  }

  destroy() {
    this.cancel();
    this.unsub?.();
    this.video.removeEventListener("seeked", this.onSeeked);
    this.video.removeEventListener("error", this.onError);
    this.video.removeAttribute("src");
  }
}
