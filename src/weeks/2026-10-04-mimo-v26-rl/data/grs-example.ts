/**
 * GRS worked example for 16-grs-reward (예시). One easy task whose eight rollouts all
 * pass the tests. The paper samples G = 16 per prompt (§4.1); the scene uses 8
 * so every column keeps a readable value label. The rubric scores are made up —
 * the paper does not publish a score scale — so they stay in (0, 1] here.
 *
 * Everything the scene draws is computed from the inputs below (Eq. 2):
 * R_i = R_i^test · S_i^sol · S_i^beh, then A_i = R_i − R̄. Expected: rewards
 * 0.9, 0.64, 0.95, 0.76, 0.5, 0.85, 0.6, 0.8 — between 0.5 and 0.95 — with
 * average 0.75, so the gaps are two-decimal numbers (+0.15, −0.11, +0.2, …).
 */
export const GRS_G = 8;

/** binary test reward: every rollout passes */
export const grsTest: number[] = [1, 1, 1, 1, 1, 1, 1, 1];
/** solution-rubric score per rollout (예시) */
export const grsSol: number[] = [0.9, 0.8, 1.0, 0.95, 0.5, 0.85, 0.75, 1.0];
/** behavior-rubric score per rollout (예시) */
export const grsBeh: number[] = [1.0, 0.8, 0.95, 0.8, 1.0, 1.0, 0.8, 0.8];

export const mean = (xs: number[]): number => xs.reduce((a, b) => a + b, 0) / xs.length;

/** group-relative advantage A_i = R_i − R̄ (§4.3.2; no std division) */
export const groupAdvantage = (r: number[]): number[] => {
  const m = mean(r);
  return r.map((v) => v - m);
};

/** Eq. 2 — the test reward gates the product, so a failure stays 0 whatever the rubric says */
export const synthesize = (test: number[], sol: number[], beh: number[]): number[] =>
  test.map((t, i) => t * sol[i]! * beh[i]!);

export const grsReward = synthesize(grsTest, grsSol, grsBeh);
export const grsTestMean = mean(grsTest);
export const grsTestAdvantage = groupAdvantage(grsTest);
export const grsMean = mean(grsReward);
export const grsAdvantage = groupAdvantage(grsReward);

// ── the two products the scene writes out in numbers ────────────────────────
/** the attempt the scene works through: the lowest product of the group */
export const GRS_WORKED = grsReward.indexOf(Math.min(...grsReward));
/**
 * a failed attempt with good rubric scores (예시). It is not one of the eight —
 * this group has no failure — and is there only to show the gate of Eq. 2.
 */
export const grsFailed = { test: 0, sol: 0.9, beh: 1.0 };
export const grsFailedReward = synthesize([grsFailed.test], [grsFailed.sol], [grsFailed.beh])[0]!;
