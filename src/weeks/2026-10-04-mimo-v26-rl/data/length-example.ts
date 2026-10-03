/**
 * Group-relative length penalty (§4.3.3, Eq. 4) worked on one prompt's group
 * of 8 (예시; the paper's G is 16) for 20-length-reference (where ℓ* comes
 * from) and 21-length-penalty (the deduction curve and the adjusted rewards).
 *
 * The paper publishes no value for X, δ, s, γ, A or B, so every parameter
 * below is an example. The scene draws only what these functions return;
 * nothing is typed as a result. Expected: ℓ* = 100K (median of the five
 * passing lengths), deductions 0.154 on attempt 4 (1.6 ℓ*) and the full
 * X = 0.5 on attempt 5 (2.5 ℓ*), failures untouched, A from R̃ = +0.457 /
 * +0.302 / −0.043 / −0.543. The scenes number the attempts 1–8.
 */
export interface LengthPenaltyParams {
  /** maximum reward deduction, X ≥ 0 */
  X: number;
  /** tolerated relative excess above ℓ*, δ ≥ 0 */
  delta: number;
  /** relative excess at which the penalty saturates, s > δ */
  s: number;
  /** ramp exponent, γ ≥ 1 */
  gamma: number;
  /** percentile parameter, B ∈ (0, 100) */
  B: number;
  /** minimum group pass rate, A ∈ [0, 1] (the paper reuses the letter A; it is not an advantage) */
  A: number;
}

/** 예시 — the paper gives none of these */
export const lenParams: LengthPenaltyParams = { X: 0.5, delta: 0.1, s: 1.0, gamma: 2, B: 50, A: 0.5 };

export const clip = (x: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, x));

export const mean = (xs: number[]): number => xs.reduce((a, b) => a + b, 0) / xs.length;

/** A_i = R_i − R̄ (§4.3.2, no std division) */
export const groupAdvantage = (r: number[]): number[] => {
  const m = mean(r);
  return r.map((v) => v - m);
};

/** Quantile_q with linear interpolation between order statistics, q ∈ [0, 1] */
export const quantile = (xs: number[], q: number): number => {
  if (xs.length === 0) return Number.NaN;
  const s = [...xs].sort((a, b) => a - b);
  const pos = (s.length - 1) * q;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  return s[lo]! + (s[hi]! - s[lo]!) * (pos - lo);
};

/** the deduction term of Eq. 4 as a function of ℓ/ℓ*: X · clip((ℓ/ℓ* − 1 − δ) / (s − δ), 0, 1)^γ */
export const lengthDeduction = (ratio: number, p: LengthPenaltyParams = lenParams): number =>
  p.X * clip((ratio - 1 - p.delta) / (p.s - p.delta), 0, 1) ** p.gamma;

export interface LengthPenaltyResult {
  /** P_q: indices of the successful rollouts */
  passIdx: number[];
  /** |P_q| / G */
  passRate: number;
  /** the pass-rate gate |P_q| / G > A — closed groups keep their original rewards */
  gated: boolean;
  /** ℓ*_q = Quantile_{B/100}{ℓ_j : j ∈ P_q} */
  reference: number;
  /** ℓ_i / ℓ*_q */
  ratio: number[];
  /** what Eq. 4 subtracts from each R_i */
  deduction: number[];
  /** R̃_i */
  adjusted: number[];
}

/** Eq. 4 on one group: rewards R_i ∈ {0, 1} and generated-token counts ℓ_i */
export const lengthPenalty = (
  reward: number[],
  lengths: number[],
  p: LengthPenaltyParams = lenParams,
): LengthPenaltyResult => {
  const passIdx = reward.flatMap((r, i) => (r === 1 ? [i] : []));
  const passRate = passIdx.length / reward.length;
  const gated = passRate > p.A;
  const reference = quantile(
    passIdx.map((i) => lengths[i]!),
    p.B / 100,
  );
  const ratio = lengths.map((l) => l / reference);
  const deduction = reward.map((_, i) => (gated && passIdx.includes(i) ? lengthDeduction(ratio[i]!, p) : 0));
  const adjusted = reward.map((r, i) => r - deduction[i]!);
  return { passIdx, passRate, gated, reference, ratio, deduction, adjusted };
};

/** the Eq. 4 penalty as a curve over ℓ/ℓ*, for the LineChart */
export const deductionCurve = (x0: number, x1: number, n: number, p: LengthPenaltyParams = lenParams) =>
  Array.from({ length: n + 1 }, (_, k) => {
    const x = x0 + ((x1 - x0) * k) / n;
    return { x, y: lengthDeduction(x, p) };
  });

// ── the worked group ────────────────────────────────────────────────────────
export const LEN_G = 8;
/** test reward: τ₁–τ₅ pass, τ₆–τ₈ fail; passes sit left, shortest first */
export const lenReward: number[] = [1, 1, 1, 1, 1, 0, 0, 0];
/** generated tokens per rollout, K (예시); τ₈ is a long failure */
export const lenTokensK: number[] = [60, 75, 100, 160, 250, 50, 130, 210];
export const lenResult = lengthPenalty(lenReward, lenTokensK);
/** advantages without and with the penalty */
export const lenAdvantagePlain = groupAdvantage(lenReward);
export const lenAdvantage = groupAdvantage(lenResult.adjusted);

/** a harder prompt for the gate beat (예시): 2 of 8 pass, so the gate stays closed */
export const lenHardReward: number[] = [1, 1, 0, 0, 0, 0, 0, 0];
export const lenHardPassRate = lenHardReward.filter((r) => r === 1).length / lenHardReward.length;
export const lenHardGated = lenHardPassRate > lenParams.A;
