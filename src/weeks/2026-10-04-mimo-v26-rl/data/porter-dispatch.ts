/**
 * Worked example for 38-mixer-dispatch (§6.3): Predictive Rollout Dispatch on
 * six GPU ranks, and the one number the paper gives for Sample Replay.
 *
 * The paper states the rule, not its constants: a new rollout is admitted to a
 * rank only when a safety-margin multiple of its estimated KV demand fits the
 * rank's remaining GPU KV capacity, and among the feasible ranks the one with
 * the greatest remaining capacity takes it. The capacities, the estimate and
 * the margin below are examples (예시). The estimate is picked inside the
 * paper's own range for one sequence, 110K–150K tokens (§4.1).
 *
 * The paper counts capacity in sequence units and takes the minimum of free
 * concurrency slots and remaining KV capacity; this example draws the KV side
 * only, in 만 tokens. What a placement takes away is drawn as the estimate —
 * whether the margin is reserved too is not stated.
 *
 * Which ranks are refused and which one is chosen is never typed in: it
 * follows from the numbers through `admitted` and `choose`.
 */

/** remaining KV cache capacity per rank, 만 tokens (예시; picked so that no bar's number lands on either line) */
export const RANK_FREE = [24, 9, 36, 15, 51, 6];
/** a rank is one copy of the rollout model on its group of GPUs; the bars call it a GPU */
export const RANK_LABELS = RANK_FREE.map((_, i) => `GPU ${i + 1}`);

/** the new rollout's estimated total length from its source's prior, 만 tokens (예시) */
export const ESTIMATE = 13;
/** safety margin on the estimate (예시; the paper does not publish it) */
export const MARGIN = 1.5;
/** what a rank must have left to take the rollout */
export const NEED = ESTIMATE * MARGIN;

/** ranks with room for the rollout: margin × estimate ≤ remaining */
export const admitted = (free: number[], need: number): number[] => free.flatMap((v, i) => (v >= need ? [i] : []));
/** ranks that are refused */
export const refused = (free: number[], need: number): number[] => free.flatMap((v, i) => (v >= need ? [] : [i]));

/** the greedy rule: the admitted rank with the most room (undefined when none fits) */
export const choose = (free: number[], need: number): number | undefined =>
  admitted(free, need).reduce<number | undefined>((best, i) => (best === undefined || free[i]! > free[best]! ? i : best), undefined);

/** capacities after the rollout is placed on rank `at` */
export const place = (free: number[], at: number, taken: number): number[] => free.map((v, i) => (i === at ? v - taken : v));

export const REFUSED = refused(RANK_FREE, NEED);
export const CHOSEN = choose(RANK_FREE, NEED)!;
export const RANK_FREE_AFTER = place(RANK_FREE, CHOSEN, ESTIMATE);

// ── Sample Replay ───────────────────────────────────────────────────────────
/** "startup sample collection took approximately 1.8× as long as that of continuous operation" (§6.3) — the paper's number */
export const STARTUP_OVER_STEADY = 1.8;
/** time to collect one training batch, relative to continuous operation */
export const COLLECT = [1, STARTUP_OVER_STEADY];
export const COLLECT_LABELS = ['평소', '시작 직후'];
/** index of the startup bar */
export const STARTUP = 1;

/** 19.5 → '19.5만', 38 → '38만' */
export const man = (v: number): string => `${Number(v.toFixed(1))}만`;
/** 1.8 → '1.8배', 1 → '1배' */
export const times = (v: number): string => `${Number(v.toFixed(1))}배`;
