import { defineDiagram } from '@/lib/diagram';

/**
 * Compact Fig. 7(a) for 09-grs: the offline lane builds task-specific rubrics
 * once, before training; the online lane reuses them to score every rollout
 * during training. The reward synthesis itself (Eq. 2) is the equation under
 * the diagram, so the online lane ends at the two scores it feeds.
 *
 * Hand-positioned so the reuse edge can drop from the offline rubrics into the
 * online grader on an elbow between the two lanes.
 */

/** place a node by its centre */
const at = (cx: number, cy: number, w: number, h: number) => ({
  size: { w, h },
  position: { x: Math.round(cx - w / 2), y: Math.round(cy - h / 2) },
});

const H = 64;
/**
 * The manual layout measures its extent from (0, 0), so the lane boxes start
 * at a small margin rather than at a negative offset (which would be clipped).
 */
const LANE = { x: 24, w: 1270, h: 144 };
const LANE_Y = { offline: 24, online: 224 };
/** column centres; wide gaps leave room for the edge labels between columns */
const C = { src: 184, agent: 654, out: 1129 };
const W = { src: 260, agent: 320, out: 270 };
/**
 * lane centre lines; 56 units of headroom keep each lane's label chip clear of
 * the edge label that sits above the lane's first arrow
 */
const Y = { offline: LANE_Y.offline + 88, online: LANE_Y.online + 88 };
/** the reuse edge runs between the two lane boxes */
const REUSE_Y = LANE_Y.offline + LANE.h + (LANE_Y.online - LANE_Y.offline - LANE.h) / 2;

const cell = (col: keyof typeof C, lane: keyof typeof Y) => at(C[col], Y[lane], W[col], H);

/** reveal bundles per lane; the lane boxes themselves stay as the frame-0 scaffold */
export const grsIds = {
  offline: ['off-rollouts', 'builder', 'rubrics', 'e-off-rollouts-builder', 'e-builder-rubrics'],
  online: ['rollout', 'grader', 'scores', 'e-rollout-grader', 'e-grader-scores', 'e-rubrics-grader'],
};

export const grsDiagram = defineDiagram({
  id: 'mimo-v26-grs',
  direction: 'LR',
  groups: [
    { id: 'offline', label: '오프라인: 학습 전에 한 번', rect: { ...LANE, y: LANE_Y.offline } },
    { id: 'online', label: '온라인: 학습 중 롤아웃마다', rect: { ...LANE, y: LANE_Y.online } },
  ],
  nodes: [
    { id: 'off-rollouts', kind: 'io', label: '오프라인 롤아웃', variant: 'io', parent: 'offline', ...cell('src', 'offline') },
    { id: 'builder', label: '루브릭 작성 에이전트', variant: 'ffn', parent: 'offline', ...cell('agent', 'offline') },
    { id: 'rubrics', label: '해결·행동 루브릭', variant: 'default', parent: 'offline', ...cell('out', 'offline') },

    { id: 'rollout', kind: 'io', label: '학습 롤아웃 τᵢ', variant: 'io', parent: 'online', ...cell('src', 'online') },
    { id: 'grader', label: '루브릭 채점 에이전트', variant: 'ffn', parent: 'online', ...cell('agent', 'online') },
    { id: 'scores', label: '해결·행동 점수', variant: 'default', parent: 'online', ...cell('out', 'online') },
  ],
  edges: [
    { id: 'e-off-rollouts-builder', from: 'off-rollouts', to: 'builder', label: '명세·저장소와 비교' },
    { id: 'e-builder-rubrics', from: 'builder', to: 'rubrics' },
    { id: 'e-rollout-grader', from: 'rollout', to: 'grader', label: '코드·실행 결과·궤적' },
    { id: 'e-grader-scores', from: 'grader', to: 'scores' },
    {
      id: 'e-rubrics-grader',
      from: 'rubrics',
      to: 'grader',
      style: 'dashed',
      waypoints: [
        { x: C.out, y: REUSE_Y },
        { x: C.agent, y: REUSE_Y },
      ],
    },
  ],
});
