/**
 * Segment-level behavioral penalty (§4.3.3, Eq. 5) worked on one successful
 * and one failed trajectory of 10 tokens each (예시) for 13-segment-penalty.
 *
 * Eq. 5's sums run over every loss-masked token of the whole training batch;
 * here the batch is just these two trajectories, one per sign. κ = 3 is an
 * example (the paper only requires κ > 1), and α_max / β_min, which the paper
 * does not publish, are left out: neither would bind here. The scene draws
 * only what these functions return. Expected: α = 1 + 1.0 / 4.0 = 1.25 →
 * unflagged +0.625; β = 1 − 2 · 1.0 / 4.0 = 0.5 → unflagged −0.25, flagged
 * −1.5; each sign's total stays 5.0.
 */
export interface SegTrajectory {
  /** the trajectory's outcome advantage A_i, shared by all of its tokens */
  A: number;
  /** h_{i,t}: 1 where a rule flagged the token (malformed markup, invalid tool name, malformed arguments) */
  h: number[];
}

export interface SegCaps {
  /** α_max ≥ 1 */
  alphaMax?: number;
  /** 0 < β_min ≤ 1 */
  betaMin?: number;
}

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);

/** Σ over the batch's tokens of |A_i| where the token's sign and flag match (H± flagged, C± unflagged) */
const mass = (batch: SegTrajectory[], sign: 1 | -1, flagged: boolean) =>
  sum(batch.flatMap((tr) => (Math.sign(tr.A) === sign ? tr.h.filter((h) => (h === 1) === flagged).map(() => Math.abs(tr.A)) : [])));

export interface SegScales {
  alpha: number;
  beta: number;
  /** Σ_{H+} A, Σ_{C+} A, Σ_{H−} |A|, Σ_{C−} |A| */
  hPos: number;
  cPos: number;
  hNeg: number;
  cNeg: number;
}

/** α and β of Eq. 5; a zero denominator sets its scale to one */
export const segmentScales = (batch: SegTrajectory[], kappa: number, caps: SegCaps = {}): SegScales => {
  const hPos = mass(batch, 1, true);
  const cPos = mass(batch, 1, false);
  const hNeg = mass(batch, -1, true);
  const cNeg = mass(batch, -1, false);
  const alphaRaw = cPos === 0 ? 1 : 1 + hPos / cPos;
  const betaRaw = cNeg === 0 ? 1 : 1 - ((kappa - 1) * hNeg) / cNeg;
  const alpha = caps.alphaMax === undefined ? alphaRaw : Math.min(caps.alphaMax, alphaRaw);
  const beta = caps.betaMin === undefined ? betaRaw : Math.max(caps.betaMin, betaRaw);
  return { alpha, beta, hPos, cPos, hNeg, cNeg };
};

/** Ã_{i,t} of Eq. 5 for every token of one trajectory */
export const segmentAdvantage = (tr: SegTrajectory, alpha: number, beta: number, kappa: number): number[] =>
  tr.h.map((h) => (tr.A > 0 ? alpha * (1 - h) * tr.A : tr.A < 0 ? (beta * (1 - h) + kappa * h) * tr.A : 0));

// ── the worked example ──────────────────────────────────────────────────────
export const SEG_T = 10;
/** κ > 1 (예시) */
export const segKappa = 3;
/** successful trajectory, A = +0.5 (예시): t₆–t₇ are one broken tool call */
export const segPos: SegTrajectory = { A: 0.5, h: [0, 0, 0, 0, 0, 1, 1, 0, 0, 0] };
/** failed trajectory, A = −0.5 (예시): t₃–t₄ are one broken tool call */
export const segNeg: SegTrajectory = { A: -0.5, h: [0, 0, 1, 1, 0, 0, 0, 0, 0, 0] };
export const segScales = segmentScales([segPos, segNeg], segKappa);

/** every token carries its trajectory's A before shaping */
export const segPosBefore = segPos.h.map(() => segPos.A);
export const segNegBefore = segNeg.h.map(() => segNeg.A);
/** halfway, for the animation only: flagged tokens shaped, the others not yet rescaled (α = β = 1) */
export const segPosMasked = segmentAdvantage(segPos, 1, 1, segKappa);
export const segNegAmplified = segmentAdvantage(segNeg, 1, 1, segKappa);
/** Eq. 5 */
export const segPosAfter = segmentAdvantage(segPos, segScales.alpha, segScales.beta, segKappa);
export const segNegAfter = segmentAdvantage(segNeg, segScales.alpha, segScales.beta, segKappa);

export const segSum = sum;
