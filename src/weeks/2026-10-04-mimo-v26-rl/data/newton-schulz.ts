/**
 * Worked example for 02-adamw-vs-muon: one lopsided 5 × 5 momentum matrix
 * (예시) and what Muon's Newton–Schulz iteration does to its singular values.
 *
 * Nothing below is typed in as a result. The matrix is built as
 * M = U · diag(σ₀) · Vᵀ from two orthonormal bases, so its singular values are
 * exactly σ₀. Newton–Schulz is a matrix polynomial, X ← aX + b(XXᵀ)X + c(XXᵀ)²X,
 * and it acts on every singular value as the scalar map σ ← aσ + bσ³ + cσ⁵, so
 * the bars in the scene are that map iterated. σ₀ is already on the scale that
 * Muon's first step (dividing M by its Frobenius norm) produces, so every σ ≤ 1.
 */

/** Muon's default quintic coefficients (Jordan et al., 2024) */
export const NS_COEFFS = { a: 3.4445, b: -4.775, c: 2.0315 } as const;

/** singular values of the example momentum matrix (예시); largest ÷ smallest = 45 */
export const SIGMA0 = [0.9, 0.35, 0.12, 0.05, 0.02];

/** one Newton–Schulz step on one singular value */
export const nsStep = (s: number): number => {
  const { a, b, c } = NS_COEFFS;
  return a * s + b * s ** 3 + c * s ** 5;
};

/** iterates[k] = singular values after k steps, k = 0..steps */
export const nsIterates = (sigma0: number[], steps: number): number[][] => {
  const out = [sigma0];
  for (let k = 0; k < steps; k += 1) out.push(out[k]!.map(nsStep));
  return out;
};

/** largest ÷ smallest */
export const spread = (s: number[]): number => Math.max(...s) / Math.min(...s);

/** orthonormal DCT-II basis; row k is the k-th basis vector */
const dctBasis = (n: number): number[][] =>
  Array.from({ length: n }, (_, k) =>
    Array.from(
      { length: n },
      (_, j) => (k === 0 ? Math.sqrt(1 / n) : Math.sqrt(2 / n)) * Math.cos((Math.PI * (2 * j + 1) * k) / (2 * n)),
    ),
  );

/** which basis vectors pair up as (uᵣ, vᵣ), and a sign per pair, so M does not look symmetric */
const U_ORDER = [1, 3, 0, 4, 2];
const V_ORDER = [2, 0, 4, 1, 3];
const SIGNS = [1, -1, 1, -1, 1];

/** M = Σᵣ σᵣ · uᵣ vᵣᵀ — a 5 × 5 matrix whose singular values are exactly `sigma` */
export const exampleMomentum = (sigma: number[]): number[][] => {
  const n = sigma.length;
  const basis = dctBasis(n);
  return Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) =>
      sigma.reduce(
        (acc, s, r) => acc + SIGNS[r]! * s * basis[U_ORDER[r]!]![i]! * basis[V_ORDER[r]!]![j]!,
        0,
      ),
    ),
  );
};

export const MOMENTUM = exampleMomentum(SIGMA0);

/** Newton–Schulz iterations per update in MiMo's RL (§5.1); Muon's own default is 5 */
export const NS_MIMO_STEPS = 10;
export const NS_ITERATES = nsIterates(SIGMA0, NS_MIMO_STEPS);
/** what the scene's bars morph to: the singular values after MiMo's 10 iterations */
export const SIGMA_FLAT = NS_ITERATES[NS_MIMO_STEPS]!;
