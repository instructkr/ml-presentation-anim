/**
 * Worked example for 02-muown: a 3 × 3 weight matrix W (예시) split the way
 * Muown stores it, W = Diag(g / ‖R‖_row) · R. Each row of W is its length gᵢ
 * times a unit-length direction. Every derived number (row lengths, directions,
 * the spectral norm and its bounds, R's cached row norms) is computed here, not
 * typed.
 *
 * The rows are picked so their lengths come out whole (3-4-5 and 6-8-10
 * triangles): ‖w₁‖ = 5, ‖w₂‖ = 1, ‖w₃‖ = 3.
 *
 * Muown's direction variable R is not kept at unit row length: Muon and weight
 * decay both move it, which is why Muown caches its row norms. The example R
 * points along W's rows with lengths of its own (R_ROW_SCALE, 예시).
 */

export const W_EXAMPLE = [
  [3, -4, 0],
  [0.6, 0, 0.8],
  [-2, 1, 2],
];

const norm = (v: number[]) => Math.hypot(...v);

/** gᵢ = ‖wᵢ‖ — what Muown keeps as the row-length vector g */
export const rowLengths = (w: number[][]): number[] => w.map(norm);

/** wᵢ / ‖wᵢ‖ — the unit-length direction of each row (what R/‖R‖_row is in the forward pass) */
export const rowDirections = (w: number[][]): number[][] => w.map((r) => r.map((x) => x / norm(r)));

/** Diag(g / ‖R‖_row) · R — the forward pass rebuilds W from the two variables */
export const recompose = (g: number[], r: number[][]): number[][] => r.map((row, i) => row.map((x) => (g[i]! * x) / norm(row)));

/** σ_max by power iteration on WᵀW from a fixed start (deterministic) */
export const spectralNorm = (w: number[][]): number => {
  const n = w[0]!.length;
  const wtw = Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => w.reduce((acc, row) => acc + row[i]! * row[j]!, 0)),
  );
  let v = Array.from({ length: n }, () => 1 / Math.sqrt(n));
  for (let it = 0; it < 200; it += 1) {
    const u = wtw.map((row) => row.reduce((acc, x, k) => acc + x * v[k]!, 0));
    const len = norm(u);
    v = u.map((x) => x / len);
  }
  return norm(w.map((row) => row.reduce((acc, x, k) => acc + x * v[k]!, 0)));
};

/** Diag(s) · w — every row rescaled, direction unchanged */
export const scaleRows = (w: number[][], s: number[]): number[][] => w.map((row, i) => row.map((x) => x * s[i]!));

export const G = rowLengths(W_EXAMPLE);
export const DIRECTIONS = rowDirections(W_EXAMPLE);
/** how long each row of the example R is relative to W's row (예시) */
export const R_ROW_SCALE = [0.4, 0.5, 0.5];
/** the direction variable Muown stores: along W's rows, with lengths of its own */
export const R_EXAMPLE = scaleRows(W_EXAMPLE, R_ROW_SCALE);
/** ‖rᵢ‖ — the row norms Muown caches next to R */
export const R_NORMS = rowLengths(R_EXAMPLE);
export const SPECTRAL = spectralNorm(W_EXAMPLE);
/** max row length ≤ ‖W‖₂ ≤ √m · max row length */
export const BOUND = { lo: Math.max(...G), hi: Math.sqrt(W_EXAMPLE.length) * Math.max(...G) };
/** index of the longest row */
export const LONGEST = G.indexOf(Math.max(...G));
