import { G } from './objective-groups';

/**
 * Worked example for 35-dynamic-sampler (예시): a training batch wants 8 groups.
 * Each number is how many of a task's G = 16 attempts passed, in the order the
 * tasks were attempted. A group whose attempts all passed or all failed has a
 * gap of 0 for every attempt, so it is left out (DAPO §3.2, Eq. 11:
 * 0 < passes < G), and the sampler keeps drawing tasks until the batch is full.
 *
 * The pass counts are made up; G = 16 is the paper's group size (§4.1). Which
 * groups are dropped, how many had to be drawn and the share that survived are
 * all computed below — the scene and its notes type none of them.
 */
export { G };

/** groups a training batch keeps (예시; the paper's is 1,568) */
export const BATCH = 8;

/** passes out of G, task by task (예시) — longer than needed, so the sampler decides where to stop */
const PASSES = [16, 9, 0, 12, 16, 3, 16, 7, 5, 16, 11, 0, 14, 2, 8, 16];

/** DAPO Eq. 11's condition: some attempts passed and some failed */
export const usable = (passes: number): boolean => passes > 0 && passes < G;

/** draw groups in order until `batch` usable ones are in; returns how many were drawn */
export const drawUntilFull = (passes: number[], batch: number): number => {
  let kept = 0;
  let n = 0;
  while (kept < batch && n < passes.length) {
    if (usable(passes[n]!)) kept += 1;
    n += 1;
  }
  return n;
};

/** every group the sampler had to draw */
export const DRAWN = PASSES.slice(0, drawUntilFull(PASSES, BATCH));
/** the first batch-sized draw, and what had to be drawn on top of it */
export const FIRST = DRAWN.slice(0, BATCH);
export const MORE = DRAWN.slice(BATCH);

/** indices (within a list) of the groups that teach nothing */
export const dropped = (passes: number[]): number[] => passes.flatMap((k, i) => (usable(k) ? [] : [i]));
export const count = (passes: number[], k: number): number => passes.filter((v) => v === k).length;

export const KEPT = DRAWN.filter(usable).length;
/** share of the drawn groups that made it into the batch */
export const ACCEPT_RATE = KEPT / DRAWN.length;

/** column labels: tasks numbered in the order they were attempted */
export const taskLabels = (from: number, n: number): string[] => Array.from({ length: n }, (_, i) => `과제 ${from + i + 1}`);
