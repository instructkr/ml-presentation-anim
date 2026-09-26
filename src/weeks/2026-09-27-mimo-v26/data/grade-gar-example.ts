import { groupAdvantage, mean } from './grade-grs-example';

/**
 * GAR worked example for 10-gar (예시), §4.3.2 Eq. 3. One mixed group of 8
 * (the paper uses G = 16): τ₁–τ₅ pass, τ₆–τ₈ fail, and τ₅'s pass turns out to
 * rest on a leaked answer. Passing columns sit left and are ranked best-first
 * so the redistribution reads as a staircase.
 *
 * The scene draws only what these functions return; nothing below is typed as
 * a result. Expected: λ = 2.0 / 1.25 = 1.6, A′ = [0.80, 0.64, 0.40, 0.16] on
 * the passes, positive total 2.0 before and after, failures untouched.
 */
export const GAR_G = 8;

/** binary test reward before the grader looks */
export const garTest: number[] = [1, 1, 1, 1, 1, 0, 0, 0];
/** τ₅ passed by leaning on a leaked answer — a confirmed hack */
export const GAR_HACK = 4;
/** quality factor per clean pass from the grader's ranking (1st → 4th), 예시; f ∈ (0, 1] */
export const garQuality: Record<number, number> = { 0: 1.0, 1: 0.8, 2: 0.5, 3: 0.2 };

/** confirmed hack → effective reward 0, treated as a failure before the group statistics are recomputed */
export const correctHacks = (r: number[], hacks: number[]): number[] =>
  r.map((v, i) => (hacks.includes(i) ? 0 : v));

export const sumWhere = (xs: number[], keep: (i: number) => boolean): number =>
  xs.reduce((s, v, i) => (keep(i) ? s + v : s), 0);

export interface Redistribution {
  /** common rescaling factor λ = Σ_P A_j / Σ_P f_j A_j */
  lambda: number;
  /** f_i A_i on the passes — the downweighting step alone */
  downweighted: number[];
  /** A′ (uncapped Eq. 3): λ f_i A_i on the passes, A_i elsewhere */
  redistributed: number[];
}

/**
 * Eq. 3, uncapped. P = {i : R_i = 1} after hack correction. The paper also caps
 * λ in practice but does not give the cap, so none is applied here.
 */
export const redistribute = (r: number[], a: number[], f: Record<number, number>): Redistribution => {
  const inP = (i: number) => r[i] === 1;
  const downweighted = a.map((v, i) => (inP(i) ? (f[i] ?? 1) * v : v));
  const lambda = sumWhere(a, inP) / sumWhere(downweighted, inP);
  const redistributed = a.map((v, i) => (inP(i) ? lambda * (f[i] ?? 1) * v : v));
  return { lambda, downweighted, redistributed };
};

/** the final step: subtract the group mean so the advantages sum to zero */
export const zeroMean = (a: number[]): number[] => {
  const m = mean(a);
  return a.map((v) => v - m);
};

// ── the worked group ────────────────────────────────────────────────────────
/** beat `mixed`: 5 of 8 pass */
export const garMixedMean = mean(garTest);
export const garMixedA = groupAdvantage(garTest);
/** beat `hack`: τ₅ → 0, then 4 of 8 pass */
export const garReward = correctHacks(garTest, [GAR_HACK]);
export const garMean = mean(garReward);
export const garA = groupAdvantage(garReward);
/** beats `rank` and `redistribute` */
export const garRedist = redistribute(garReward, garA, garQuality);
/** beat `finalize` */
export const garFinal = zeroMean(garRedist.redistributed);
