/** Global pointer store (desktop, fine pointers only). Read inside ticker callbacks. */
import { ticker } from "./ticker";

export const pointer = {
  x: 0,
  y: 0,
  /** -1..1 from the viewport centre */
  nx: 0,
  ny: 0,
  /** true on devices with a mouse / trackpad */
  fine: false,
  /** a real pointer move has happened */
  moved: false,
  inited: false,
  init() {
    if (this.inited || typeof window === "undefined") return;
    this.inited = true;
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    this.fine = mq.matches;
    mq.addEventListener("change", (e) => (this.fine = e.matches));
    this.x = window.innerWidth / 2;
    this.y = window.innerHeight / 2;
    window.addEventListener(
      "pointermove",
      (e) => {
        if (e.pointerType !== "mouse" && e.pointerType !== "pen") return;
        this.moved = true;
        this.x = e.clientX;
        this.y = e.clientY;
        this.nx = (e.clientX / window.innerWidth) * 2 - 1;
        this.ny = (e.clientY / window.innerHeight) * 2 - 1;
        ticker.wake();
      },
      { passive: true },
    );
  },
};
