import { defineDiagram } from '@/lib/diagram';
import { INK } from '../quantities';

/**
 * One RL step as a loop (§4.1), drawn as the ring it is:
 *
 *   과제 → Rollout → 풀이 16개 → Grader
 *             ↑                    │
 *          새 가중치                 │
 *             │                    ↓
 *          Training ← 점수 16개 ←────┘
 *
 * The three modules sit on the corners and keep the paper's names (rollout,
 * grading and training are the three parts §4.1 splits the computation into);
 * the two values they hand on sit between them as plain nouns. `scores` stands
 * for the reward R, so it wears R's ink. Hand-positioned so the two elbows of
 * the ring can run on waypoints.
 */

/** place a node by its centre */
const at = (cx: number, cy: number, w: number, h: number) => ({
  size: { w, h },
  position: { x: Math.round(cx - w / 2), y: Math.round(cy - h / 2) },
});

const MARGIN = 24;
const GAP = 76;
const W = { q: 150, module: 210, value: 190 };
const H = { q: 66, module: 84, value: 64 };
const NOTE = { w: 150, h: 52 };

/** column centres: the task, then the three columns of the ring */
const X_Q = MARGIN + W.q / 2;
const X_LEFT = MARGIN + W.q + GAP + W.module / 2;
const X_MID = X_LEFT + W.module / 2 + GAP + W.value / 2;
const X_RIGHT = X_MID + W.value / 2 + GAP + W.module / 2;
/** row centres: the way out along the top, the way back along the bottom */
const Y_TOP = MARGIN + H.module / 2;
const Y_BOTTOM = Y_TOP + 210;

const e = (from: string, to: string) => ({ id: `e-${from}-${to}`, from, to });

export const rlStep = defineDiagram({
  id: 'mimo-v26-rl-step',
  direction: 'LR',
  nodes: [
    { id: 'q', kind: 'io', label: '과제', variant: 'io', ...at(X_Q, Y_TOP, W.q, H.q) },
    { id: 'rollout', label: 'Rollout', variant: 'default', ...at(X_LEFT, Y_TOP, W.module, H.module) },
    { id: 'tries', kind: 'op', label: '풀이 16개', variant: 'op', ...at(X_MID, Y_TOP, W.value, H.value) },
    { id: 'grader', label: 'Grader', variant: 'default', ...at(X_RIGHT, Y_TOP, W.module, H.module) },
    { id: 'scores', kind: 'op', label: '점수 16개', variant: INK.R, ...at(X_MID, Y_BOTTOM, W.value, H.value) },
    { id: 'train', label: 'Training', variant: 'default', ...at(X_LEFT, Y_BOTTOM, W.module, H.module) },
    // what travels up the closing edge. An edge label would sit on a vertical line, so it is a node beside it.
    {
      id: 'weights',
      kind: 'annotation',
      label: '새 가중치',
      variant: 'annotation',
      ...at(X_LEFT - NOTE.w / 2 - 14, (Y_TOP + Y_BOTTOM) / 2, NOTE.w, NOTE.h),
    },
  ],
  edges: [
    e('q', 'rollout'),
    e('rollout', 'tries'),
    e('tries', 'grader'),
    // down the right side, then back along the bottom
    { ...e('grader', 'scores'), waypoints: [{ x: X_RIGHT, y: Y_BOTTOM }] },
    e('scores', 'train'),
    // the loop closes: the updated weights go back to the Rollout side for the next step
    { ...e('train', 'rollout'), style: 'dashed' as const },
  ],
});

/** reveal bundles per beat — `q`, `rollout` and their edge are in none of them (the frame-0 anchor) */
export const rlStepIds = {
  rollout: ['e-rollout-tries', 'tries'],
  grade: ['e-tries-grader', 'grader', 'e-grader-scores', 'scores'],
  train: ['e-scores-train', 'train'],
  loop: ['e-train-rollout', 'weights'],
  /** the whole ring, in the order the step runs */
  ring: ['e-rollout-tries', 'e-tries-grader', 'e-grader-scores', 'e-scores-train', 'e-train-rollout'],
};
