/**
 * Worked example for 34-top-p-replay (예시): the model has written `return a`
 * (the position of scene 05) and gives the next token these probabilities. The
 * fifth entry is the whole rest of the vocabulary lumped together — tens of
 * thousands of tokens, each far below the fourth candidate.
 *
 * `TOP_P` = 0.97 is the paper's "typical top-p" (§6.4; MAI-Thinking-1 uses the
 * same value). The probabilities are examples, chosen so the cut does not sit
 * on a rounding edge: the first three add up to 0.91, the first four to 0.98.
 * Nothing below is typed in as a result — the candidate set, its total and the
 * two ratios all follow from `P_FULL` and `TOP_P`.
 */
export const CANDIDATES = ['+', '−', '*', ')', '나머지 어휘'];

/** what the model assigns over the whole vocabulary (예시); sums to 1 */
export const P_FULL = [0.58, 0.22, 0.11, 0.07, 0.02];

export const TOP_P = 0.97;

/** the token the Rollout engine actually wrote */
export const CHOSEN = 0;

/**
 * top-p: walk the candidates from the most likely down and keep them until the
 * running total reaches `p`. Returns the kept indices (the candidate set).
 * The 1e-9 only absorbs float error in the running total.
 */
export const topPSet = (probs: number[], p: number): number[] => {
  const order = probs.map((_, i) => i).sort((a, b) => probs[b]! - probs[a]! || a - b);
  const kept: number[] = [];
  let total = 0;
  for (const i of order) {
    kept.push(i);
    total += probs[i]!;
    if (total >= p - 1e-9) break;
  }
  return kept.sort((a, b) => a - b);
};

/** probabilities rescaled inside `set` so they sum to 1; everything outside is 0 */
export const renormalise = (probs: number[], set: number[]): number[] => {
  const mass = set.reduce((sum, i) => sum + probs[i]!, 0);
  return probs.map((v, i) => (set.includes(i) ? v / mass : 0));
};

/** the candidate set Rollout sampled from */
export const SET = topPSet(P_FULL, TOP_P);
/** the candidates top-p threw away */
export const CUT = P_FULL.map((_, i) => i).filter((i) => !SET.includes(i));
/** what the kept candidates add up to before rescaling */
export const KEPT_MASS = SET.reduce((sum, i) => sum + P_FULL[i]!, 0);
/** the distribution the sampler drew from, and Training's once it reuses the set */
export const P_SET = renormalise(P_FULL, SET);

/** μ: the probability the sampler gave the token it wrote */
export const MU = P_SET[CHOSEN]!;
/** π over the whole vocabulary: what Training computes without the set */
export const PI_FULL = P_FULL[CHOSEN]!;
/** r with identical weights but no replay — equals the kept mass, not 1 */
export const R_MISMATCH = PI_FULL / MU;
/** r once Training rescales inside the recorded set */
export const R_REPLAY = P_SET[CHOSEN]! / MU;

/** 0.58 → '0.58', 0.5918… → '0.592', 0 → '0' */
export const fmtProb = (v: number): string => String(Number(v.toFixed(3)));
