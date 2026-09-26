import { defineDiagram } from '@/lib/diagram';

/**
 * MiMo-V2.6 training pipeline — the week's home screen.
 *
 * One column, top to bottom: pre-training → mid-training → SFT → RL → MOPD2.
 * The RL stage is drawn open as ONE step's loop (rollout → reward → advantage
 * → loss → update, then back to rollout), and the paper's refinements sit in a
 * right-hand column, each wired with a dashed edge into the side of the stage
 * it modifies. Hand-positioned (every node has `position`) so the loop-back can
 * run outside the main column on waypoints.
 *
 * Node ids are the week's contract: the track modules key their `details` on
 * them (see .agents/plan.md "Detail ownership").
 */

/** place a node by its centre */
const at = (cx: number, cy: number, w: number, h: number) => ({
  size: { w, h },
  position: { x: Math.round(cx - w / 2), y: Math.round(cy - h / 2) },
});

// ── geometry ────────────────────────────────────────────────────────────────
/** main column */
const MAIN = { x: 414, w: 440, h: 72 };
const MAIN_RIGHT = MAIN.x + MAIN.w / 2;
/** the loop-back rail: left of the main column, inside the RL box, with room for its label */
const LOOP_X = 84;
/** refinement column, right of the main column */
const SIDE = { x: 904, w: 300, h: 50 };
/** where a paired refinement's dashed edge turns toward its target */
const ELBOW_X = (MAIN_RIGHT + SIDE.x - SIDE.w / 2) / 2;
/** a pair of refinements straddles its target at ±PAIR; their edges meet like a brace and share one arrow */
const PAIR = 34;

const Y = {
  pretrain: 60,
  midtrain: 176,
  sft: 292,
  rollout: 464,
  reward: 628,
  advantage: 792,
  loss: 956,
  update: 1120,
  mopd2: 1270,
};

/** the RL box: 60 units of headroom above rollout keep its label chip off the first row */
const RL_BOX = { x: 24, y: 368, w: 1070, h: 822 };

const main = (id: string, label: string, variant: string, extra: { title?: string; parent?: string } = {}) => ({
  id,
  label,
  variant,
  ...extra,
  ...at(MAIN.x, Y[id as keyof typeof Y], MAIN.w, MAIN.h),
});

const side = (id: string, label: string, variant: string, cy: number) => ({
  id,
  kind: 'op' as const,
  label,
  variant,
  parent: 'rl',
  ...at(SIDE.x, cy, SIDE.w, SIDE.h),
});

/**
 * Dashed refinement edge into the target's right face. A paired edge bends at
 * ELBOW_X onto the target's centre line; both halves of a pair are the same
 * length up to that junction, so their dashes coincide on the shared stretch.
 */
const refine = (from: string, to: string, fromY: number, paired = false) => ({
  id: `e-${from}-${to}`,
  from,
  to,
  style: 'dashed' as const,
  ...(paired
    ? { waypoints: [{ x: ELBOW_X, y: fromY }, { x: ELBOW_X, y: Y[to as keyof typeof Y] }] }
    : {}),
});

export const trainingPipeline = defineDiagram({
  id: 'mimo-v26-training',
  direction: 'TB',
  groups: [{ id: 'rl', label: 'RL 한 스텝 × 30', rect: RL_BOX }],
  nodes: [
    main('pretrain', '사전학습 · AdamW', 'norm'),
    main('midtrain', '중간학습 · Muown 전환', 'proj'),
    main('sft', 'SFT', 'default'),

    main('rollout', '롤아웃: 프롬프트당 16개', 'attention', { title: '롤아웃', parent: 'rl' }),
    main('reward', '보상: 테스트 통과', 'attention', { title: '보상', parent: 'rl' }),
    main('advantage', '그룹 상대 어드밴티지', 'attention', { parent: 'rl' }),
    main('loss', '손실 (Eq. 1)', 'attention', { parent: 'rl' }),
    main('update', '옵티마이저 업데이트', 'proj', { parent: 'rl' }),

    side('grs', 'GRS 루브릭', 'ffn', Y.reward - PAIR),
    side('length', '길이 페널티', 'route', Y.reward + PAIR),
    side('gar', 'GAR 재분배', 'ffn', Y.advantage - PAIR),
    side('segment', '구간 페널티', 'route', Y.advantage + PAIR),
    side('ratio', '비율 r · 마스크 M', 'expertRouted', Y.loss),
    side('router', '라우터 고정', 'proj', Y.update),

    main('mopd2', 'MOPD2 증류', 'expertShared'),
  ],
  edges: [
    { id: 'e-pretrain-midtrain', from: 'pretrain', to: 'midtrain' },
    { id: 'e-midtrain-sft', from: 'midtrain', to: 'sft' },
    { id: 'e-sft-rollout', from: 'sft', to: 'rollout' },

    { id: 'e-rollout-reward', from: 'rollout', to: 'reward', label: '궤적 16개' },
    { id: 'e-reward-advantage', from: 'reward', to: 'advantage', label: '보상 R' },
    { id: 'e-advantage-loss', from: 'advantage', to: 'loss' },
    { id: 'e-loss-update', from: 'loss', to: 'update', label: '기울기' },
    // the loop: back up the left side to the next step's rollout
    {
      id: 'e-update-rollout',
      from: 'update',
      to: 'rollout',
      label: '다음 스텝',
      waypoints: [
        { x: LOOP_X, y: Y.update },
        { x: LOOP_X, y: Y.rollout },
      ],
    },
    { id: 'e-update-mopd2', from: 'update', to: 'mopd2' },

    refine('grs', 'reward', Y.reward - PAIR, true),
    refine('length', 'reward', Y.reward + PAIR, true),
    refine('gar', 'advantage', Y.advantage - PAIR, true),
    refine('segment', 'advantage', Y.advantage + PAIR, true),
    refine('ratio', 'loss', Y.loss),
    refine('router', 'update', Y.update),
  ],
});
