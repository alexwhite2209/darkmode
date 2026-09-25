/**
 * Critically-damped-ish spring. TARGET -> SPRING -> CURRENT VALUE.
 * Used for the pointer, hover, rotation, translation and scale of interactive elements.
 */
export type SpringOptions = { stiffness?: number; damping?: number; mass?: number; precision?: number };

export class Spring {
  value: number;
  target: number;
  velocity = 0;
  stiffness: number;
  damping: number;
  mass: number;
  precision: number;

  constructor(initial = 0, o: SpringOptions = {}) {
    this.value = initial;
    this.target = initial;
    this.stiffness = o.stiffness ?? 170;
    this.damping = o.damping ?? 24;
    this.mass = o.mass ?? 1;
    this.precision = o.precision ?? 0.001;
  }

  set(target: number) {
    this.target = target;
  }

  jump(v: number) {
    this.value = this.target = v;
    this.velocity = 0;
  }

  /** advance by dt milliseconds; returns true while moving */
  step(dtMs: number) {
    // sub-step for stability at low frame rates
    let remaining = Math.min(dtMs, 64) / 1000;
    while (remaining > 0) {
      const h = Math.min(remaining, 1 / 120);
      const force = -this.stiffness * (this.value - this.target) - this.damping * this.velocity;
      this.velocity += (force / this.mass) * h;
      this.value += this.velocity * h;
      remaining -= h;
    }
    const settled = Math.abs(this.velocity) < this.precision && Math.abs(this.value - this.target) < this.precision;
    if (settled) {
      this.value = this.target;
      this.velocity = 0;
    }
    return !settled;
  }
}

/** 2D convenience */
export class Spring2 {
  x: Spring;
  y: Spring;
  constructor(x = 0, y = 0, o: SpringOptions = {}) {
    this.x = new Spring(x, o);
    this.y = new Spring(y, o);
  }
  set(x: number, y: number) {
    this.x.set(x);
    this.y.set(y);
  }
  step(dt: number) {
    const a = this.x.step(dt);
    const b = this.y.step(dt);
    return a || b;
  }
}
