/**
 * Worked example for 09-ratio and 10-mask (§5.1): the per-token ratio
 * r = π_θ / μ_θold of two attempts, six tokens each, and the range a token's r
 * must sit in to stay in the loss.
 *
 * Every ratio is an example (예시). The starting range [0.2, 5.0] is the
 * paper's; how far the range moves when entropy is too low is an example — the
 * paper gives the directions only. Which tokens are left out is never typed:
 * it follows from the ratios and the current range (`outside`).
 */
/** column labels — spelled out, because bare numbers under bars mean attempts elsewhere in this talk */
export const TOKENS = [1, 2, 3, 4, 5, 6].map((n) => `토큰 ${n}`);

/** tokens of an attempt with A ≥ 0 (예시); token 4 starts outside [0.2, 5] */
export const R_POS = [1.1, 0.8, 1.4, 6.5, 0.9, 1.2];
/** tokens of an attempt with A < 0 (예시); token 2 starts outside, token 5 falls outside once the range narrows */
export const R_NEG = [1.2, 0.15, 0.9, 1.3, 2.6, 0.7];

export type Bounds = [lo: number, hi: number];

/** both signs start here (§5.1) */
export const INITIAL: Bounds = [0.2, 5.0];
/** entropy too low → the positive range widens … (amount is 예시) */
export const LOW_ENTROPY_POS: Bounds = [0.14, 8.0];
/** … and the negative range narrows (amount is 예시) */
export const LOW_ENTROPY_NEG: Bounds = [0.3, 2.2];

/** indices whose ratio is outside the range — the tokens with M = 0 */
export const outside = (r: number[], [lo, hi]: Bounds): number[] => r.flatMap((v, i) => (v < lo || v > hi ? [i] : []));

/** a range moving from `a` to `b`, interpolated in log space — the axis the charts are drawn on */
export const lerpBounds = (a: Bounds, b: Bounds, p: number): Bounds => [
  Math.exp(Math.log(a[0]) + (Math.log(b[0]) - Math.log(a[0])) * p),
  Math.exp(Math.log(a[1]) + (Math.log(b[1]) - Math.log(a[1])) * p),
];

/** 6.5 → '6.5', 1 → '1.0', 0.15 → '0.15' */
export const fmtRatio = (v: number): string => (v >= 1 ? v.toFixed(1) : String(Number(v.toFixed(2))));

// ── what the scenes point at ────────────────────────────────────────────────
/** the largest ratio of the first attempt: the current model likes this token far more than the copy did */
export const POS_HIGH = R_POS.indexOf(Math.max(...R_POS));
/** its smallest ratio: the current model likes this token a little less */
export const POS_LOW = R_POS.indexOf(Math.min(...R_POS));
/** tokens left out under the starting range */
export const POS_OUT_INITIAL = outside(R_POS, INITIAL);
export const NEG_OUT_INITIAL = outside(R_NEG, INITIAL);
/** tokens left out once the range has moved */
export const POS_OUT_MOVED = outside(R_POS, LOW_ENTROPY_POS);
export const NEG_OUT_MOVED = outside(R_NEG, LOW_ENTROPY_NEG);
