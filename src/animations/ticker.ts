/**
 * ONE requestAnimationFrame loop for the whole site.
 *
 *   ONE RAF ─┬─ Lenis (smooth scroll)        priority -100
 *            ├─ scroll scenes / parallax      -50
 *            ├─ springs, pointer, cursor       0
 *            ├─ video scrub                    10
 *            └─ anything else                  ...
 *
 * Subscribers return `true` while they still need frames. When every subscriber is idle for a
 * few frames the loop rests (no rAF at all) and wakes up again on input, scroll or resize.
 */
export type TickFn = (time: number, dtMs: number) => boolean | void;

type Sub = { id: number; fn: TickFn; priority: number };

const IDLE_FRAMES_BEFORE_REST = 45;

class Ticker {
  private subs: Sub[] = [];
  private nextId = 1;
  private rafId: number | null = null;
  private last = 0;
  private idle = 0;
  private started = false;
  frame = 0;

  add(fn: TickFn, priority = 0) {
    const sub = { id: this.nextId++, fn, priority };
    this.subs.push(sub);
    this.subs.sort((a, b) => a.priority - b.priority);
    this.wake();
    return () => {
      this.subs = this.subs.filter((s) => s.id !== sub.id);
    };
  }

  /** request frames (called by input listeners and by code that just changed a target) */
  wake = () => {
    this.idle = 0;
    if (this.rafId === null && typeof window !== "undefined") {
      this.last = 0;
      this.rafId = window.requestAnimationFrame(this.loop);
    }
  };

  private loop = (t: number) => {
    const dt = this.last ? Math.min(100, t - this.last) : 16.667;
    this.last = t;
    this.frame++;
    let busy = false;
    for (let i = 0; i < this.subs.length; i++) {
      if (this.subs[i].fn(t, dt)) busy = true;
    }
    this.idle = busy ? 0 : this.idle + 1;
    if (this.idle > IDLE_FRAMES_BEFORE_REST || document.hidden) {
      this.rafId = null;
      this.last = 0;
      return;
    }
    this.rafId = window.requestAnimationFrame(this.loop);
  };

  /** wire the global wake-up sources once */
  start() {
    if (this.started || typeof window === "undefined") return;
    this.started = true;
    const opts: AddEventListenerOptions = { passive: true };
    for (const ev of ["wheel", "touchstart", "touchmove", "pointermove", "pointerdown", "keydown", "scroll", "resize"]) {
      window.addEventListener(ev, this.wake, opts);
    }
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) this.wake();
    });
    this.wake();
  }
}

export const ticker = new Ticker();
