/**
 * Reward-hacking numbers for 13-reward-hacking (§4.2.6, Fig. 6).
 *
 * `HACK_SHARE_CEILING` is the paper's own statement: with the grader's
 * correction in place, the logged confirmed-hack share "remains below 2%
 * throughout the whole training process" for both models.
 *
 * The rest is Fig. 6(b), read off the page-16 figure at 6× — 그래프에서 읽은
 * 근사값, used by the notes only.
 */

/** percent — the logged confirmed-hack share stayed below this for Flash and Pro (§4.2.6) */
export const HACK_SHARE_CEILING = 2;

/**
 * Fig. 6(b), top: the share of environments the Hack Agent could still exploit,
 * per cleanup round, for four code datasets (%). Three datasets needed two
 * rounds; one needed four.
 */
export const hackableByRound: Record<string, number[]> = {
  'code/dataset-zg6q': [100, 8],
  'code/dataset-x7wh': [100, 13],
  'code/dataset-m1dt': [100, 19],
  'code/dataset-obg8': [93, 49, 33, 22],
};

/** Fig. 6(b), bottom: the range the detected-hack rate moves in over the 30 RL steps, both models (%) */
export const detectedHackRange = { lo: 0.4, hi: 1.8 };

const lastOf = (xs: number[]) => xs[xs.length - 1]!;
/** the datasets that were done after two rounds, and what was left hackable (min–max, %) */
const twoRound = Object.values(hackableByRound).filter((r) => r.length === 2).map(lastOf);
export const hackSummary = {
  twoRoundDatasets: twoRound.length,
  twoRoundLo: Math.min(...twoRound),
  twoRoundHi: Math.max(...twoRound),
  slowRounds: Math.max(...Object.values(hackableByRound).map((r) => r.length)),
  slowLeft: lastOf(Object.values(hackableByRound).find((r) => r.length > 2)!),
};
