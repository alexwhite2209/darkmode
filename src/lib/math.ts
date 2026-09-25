export const clamp = (v: number, lo = 0, hi = 1) => (v < lo ? lo : v > hi ? hi : v);

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** frame-rate independent exponential smoothing: k is the fraction covered per 60 fps frame */
export const damp = (current: number, target: number, k: number, dtMs: number) =>
  current + (target - current) * (1 - Math.pow(1 - k, dtMs / 16.667));

export const mapRange = (v: number, inMin: number, inMax: number, outMin = 0, outMax = 1) =>
  outMin + ((v - inMin) / (inMax - inMin || 1)) * (outMax - outMin);

/** 0..1 progress of v inside [a, b] */
export const progress = (v: number, a: number, b: number) => clamp((v - a) / (b - a || 1));

export const smoothstep = (v: number, e0: number, e1: number) => {
  const t = clamp((v - e0) / (e1 - e0 || 1));
  return t * t * (3 - 2 * t);
};

/** fade in at the start of [a, b] and out at its end; ramp in the same units as v */
export const band = (v: number, a: number, b: number, ramp: number, open = { start: true, end: true }) => {
  const i = open.start ? smoothstep(v, a, a + ramp) : v >= a ? 1 : 0;
  const o = open.end ? 1 - smoothstep(v, b - ramp, b) : v <= b ? 1 : 0;
  return Math.min(i, o);
};

export const round = (v: number, p = 3) => {
  const m = 10 ** p;
  return Math.round(v * m) / m;
};
