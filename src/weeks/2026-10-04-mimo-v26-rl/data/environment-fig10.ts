/**
 * Fig. 10 (§5.3): Pass@1 on DeepSWE v1.1 during multi-harness training —
 * the two thick "Mean" curves only. (a) the mean over the four training
 * mini-harnesses, (b) the mean over the three held-out harnesses (codex,
 * claude code, mini-swe-agent).
 *
 * 그래프에서 읽은 근사값: page 23 was rendered at 6× and the centre of the
 * orange Mean line was located by pixel colour at each marker, then mapped
 * through the axis ticks. Good to about ±0.3 points. x = RL training step;
 * the figure has no point at step 1, and the early checkpoints are sparse
 * (every second step, and nothing between 8 and 12 for the held-out runs).
 */
export interface PassPoint {
  x: number;
  y: number;
}

const pts = (xs: [step: number, pass: number][]): PassPoint[] => xs.map(([x, y]) => ({ x, y }));

/** (a) mean Pass@1 (%) over the four training mini-harnesses */
export const fig10Training: PassPoint[] = pts([
  [2, 59.4], [4, 57.6], [6, 58.9], [8, 57.8], [10, 60.7], [12, 61.8], [14, 61.9], [15, 65.1], [16, 63.2],
  [17, 62.9], [18, 64.2], [19, 63.9], [20, 62.9], [21, 64.0], [22, 66.1], [23, 65.3], [24, 66.4], [25, 64.1],
  [26, 66.7], [27, 64.1], [28, 65.7], [29, 65.5], [30, 67.2],
]);

/** (b) mean Pass@1 (%) over the three held-out harnesses */
export const fig10HeldOut: PassPoint[] = pts([
  [2, 50.1], [4, 52.2], [6, 55.4], [8, 57.7], [12, 58.2], [14, 60.7], [15, 60.8], [16, 59.3], [17, 59.1],
  [18, 62.5], [19, 61.2], [20, 62.3], [21, 61.6], [22, 62.9], [23, 63.6], [24, 64.5], [25, 64.8], [26, 65.5],
  [27, 63.4], [28, 62.3], [29, 64.6], [30, 65.7],
]);

/** how many harnesses each mean is taken over (§5.3) */
export const TRAINING_HARNESSES = 4;
export const HELD_OUT_HARNESSES = ['codex', 'claude code', 'mini-swe-agent'];

const first = (p: PassPoint[]) => p[0]!;
const last = (p: PassPoint[]) => p[p.length - 1]!;

/** the numbers the scene and the notes read out, all derived from the points above */
export const fig10Summary = {
  heldOutStart: first(fig10HeldOut).y,
  heldOutEnd: last(fig10HeldOut).y,
  trainingStart: first(fig10Training).y,
  trainingEnd: last(fig10Training).y,
  /** training mean − held-out mean at the first and the last checkpoint, in points */
  gapStart: first(fig10Training).y - first(fig10HeldOut).y,
  gapEnd: last(fig10Training).y - last(fig10HeldOut).y,
};
