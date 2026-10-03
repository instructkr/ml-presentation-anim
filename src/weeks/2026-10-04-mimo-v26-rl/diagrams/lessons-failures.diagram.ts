import { defineDiagram } from '@/lib/diagram';

/**
 * Where the 30-step RL run stopped (§5.5, Fig. 12). The figure is one RL step
 * as a loop, standing on the hardware it runs on:
 *
 *        ┌───────────────── 새 가중치 ─────────────────┐
 *        ▼                                              │
 *     Rollout ──풀이──▶ Grader ──점수──▶ Packing ──배치──▶ Training
 *        ┊                ┊                ┊                ┊
 *     ───────────────────── GPU · 클러스터 ─────────────────────
 *
 * Nothing is revealed: the whole figure is on screen from frame 0 and the
 * scene only points at the place each kind of failure happened. The modules
 * are names, not quantities, so they stay grey. Hand-positioned so the return
 * rail and the four hardware rails can run on waypoints.
 */

/** place a node by its centre */
const at = (cx: number, cy: number, w: number, h: number) => ({
  size: { w, h },
  position: { x: Math.round(cx - w / 2), y: Math.round(cy - h / 2) },
});

const NODE = { w: 250, h: 110 };
const PITCH = 372;
const LEFT = 40;
const ROW_Y = 235;
/** the return rail runs above the row, with room for its label */
const RAIL_Y = 80;
/** the hardware sits well below the row, so the figure uses the height of the wide cell */
const INFRA = { y: 500, h: 96 };

const MODULES = ['rollout', 'grader', 'packing', 'training'] as const;
const LABEL: Record<(typeof MODULES)[number], string> = {
  rollout: 'Rollout',
  grader: 'Grader',
  packing: 'Packing',
  training: 'Training',
};
const cx = (i: number) => LEFT + NODE.w / 2 + i * PITCH;
const RIGHT = cx(MODULES.length - 1) + NODE.w / 2;

export const failuresLoop = defineDiagram({
  id: 'mimo-v26-rl-failures',
  direction: 'LR',
  nodes: [
    ...MODULES.map((id, i) => ({ id, label: LABEL[id], variant: 'default', ...at(cx(i), ROW_Y, NODE.w, NODE.h) })),
    {
      id: 'infra',
      kind: 'io' as const,
      label: 'GPU · 클러스터',
      variant: 'io',
      ...at((LEFT + RIGHT) / 2, INFRA.y, RIGHT - LEFT, INFRA.h),
    },
  ],
  edges: [
    { id: 'e-rollout-grader', from: 'rollout', to: 'grader', label: '풀이' },
    { id: 'e-grader-packing', from: 'grader', to: 'packing', label: '점수' },
    { id: 'e-packing-training', from: 'packing', to: 'training', label: '배치' },
    // the loop: the updated weights go back to the rollout side for the next step
    {
      id: 'e-training-rollout',
      from: 'training',
      to: 'rollout',
      label: '새 가중치',
      waypoints: [
        { x: cx(3), y: RAIL_Y },
        { x: cx(0), y: RAIL_Y },
      ],
    },
    // every module stands on the same hardware: plain dotted rails, no arrowheads
    ...MODULES.map((id, i) => ({
      id: `e-${id}-infra`,
      from: id,
      to: 'infra',
      style: 'dotted' as const,
      arrow: false,
      waypoints: [{ x: cx(i), y: INFRA.y - INFRA.h / 2 - 12 }],
    })),
  ],
});

/** id bundles, so the scene's effects stay short and cannot drift from the figure */
export const failuresIds = {
  modules: [...MODULES] as string[],
  rails: MODULES.map((id) => `e-${id}-infra`),
  loop: ['e-rollout-grader', 'e-grader-packing', 'e-packing-training', 'e-training-rollout'],
};
