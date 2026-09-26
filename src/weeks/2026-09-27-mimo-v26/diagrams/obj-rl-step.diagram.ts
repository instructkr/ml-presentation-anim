import { defineDiagram } from '@/lib/diagram';

/**
 * One RL step as a loop (§4.1): a prompt leaves the pool, the rollout copy of
 * the policy writes 16 trajectories, the grader turns each into a reward, the
 * trainer updates θ through the loss, and the new θ is copied back to the
 * rollout side for the next step.
 *
 *   프롬프트 풀
 *        ↓
 *   정책 μ (롤아웃용 사본)          학습기보다 늦을 수 있다
 *   ┌────┬────┬────┬────┐
 *   τ₁   τ₂   τ₃   ⋯   τ₁₆          궤적 16개
 *   └─ 채점: 테스트 · 루브릭 · 에이전트 ─┘
 *   R    R    R    ⋯   R            보상 16개
 *   └────┴──┬─┴────┘
 *   학습: 손실(Eq. 1)로 θ 갱신  ──(left rail)──▶ 정책 μ
 *
 * Five columns stand for the group of sixteen; the ellipsis column carries no
 * edges. Labels are concepts only — every number arrives as a Spec chip in the
 * scene, on its beat. Hand-positioned so the fan-out/fan-in rails and the
 * loop-back can run on waypoints.
 */

/** place a node by its centre */
const at = (cx: number, cy: number, w: number, h: number) => ({
  size: { w, h },
  position: { x: Math.round(cx - w / 2), y: Math.round(cy - h / 2) },
});

const CX = 560;
/** the five group columns: τ₁ τ₂ τ₃ ⋯ τ₁₆ (index 3 is the ellipsis) */
const COLS = [260, 410, 560, 710, 860];
const Y = { pool: 40, policy: 168, traj: 288, grader: 404, reward: 516, trainer: 628 };
const H = { policy: 76, traj: 60, grader: 76, reward: 56, trainer: 76 };
/** horizontal rails: policy → chips fan-out, rewards → trainer fan-in */
const BUS_OUT = (Y.policy + H.policy / 2 + Y.traj - H.traj / 2) / 2;
const BUS_IN = (Y.reward + H.reward / 2 + Y.trainer - H.trainer / 2) / 2;
/** loop-back rail, left of every column */
const LOOP_X = 70;
/** row captions, right of the last column */
const NOTE_X = 1010;

const SLOTS = [
  { key: '1', tau: 'τ₁', r: 'R = 1', pass: true },
  { key: '2', tau: 'τ₂', r: 'R = 0', pass: false },
  { key: '3', tau: 'τ₃', r: 'R = 1', pass: true },
  { key: 'dots', tau: '⋯', r: '⋯', pass: true },
  { key: '16', tau: 'τ₁₆', r: 'R = 0', pass: false },
];
const REAL = SLOTS.filter((s) => s.key !== 'dots');
const xOf = (key: string) => COLS[SLOTS.findIndex((s) => s.key === key)]!;

/** straight drop from `from` into `to` at column x (a mid waypoint keeps it vertical off-centre) */
const drop = (id: string, from: string, to: string, x: number, midY: number) => ({
  id,
  from,
  to,
  ...(x === CX ? {} : { waypoints: [{ x, y: midY }] }),
});

export const rlStepDetail = defineDiagram({
  id: 'mimo-v26-rl-step',
  direction: 'TB',
  nodes: [
    // ── frame-0 anchor: where every step starts ─────────────────────────────
    { id: 'pool', kind: 'io', label: '프롬프트 풀', variant: 'io', ...at(CX, Y.pool, 300, 64) },
    {
      id: 'policy',
      label: '정책 μ (롤아웃용 사본)',
      variant: 'attention',
      ...at(CX, Y.policy, 440, H.policy),
    },
    {
      id: 'lag',
      kind: 'annotation',
      label: '학습기보다 늦을 수 있다',
      variant: 'annotation',
      ...at(NOTE_X - 40, Y.policy, 300, 48),
    },

    // ── rollout: one prompt, sixteen attempts ───────────────────────────────
    ...SLOTS.map((s, i) =>
      s.key === 'dots'
        ? { id: 'tau-dots', kind: 'annotation' as const, label: '⋯', variant: 'annotation', ...at(COLS[i]!, Y.traj, 80, H.traj) }
        : { id: `tau-${s.key}`, kind: 'op' as const, label: s.tau, variant: 'op', ...at(COLS[i]!, Y.traj, 112, H.traj) },
    ),
    { id: 'tau-note', kind: 'annotation', label: '궤적 16개', variant: 'annotation', ...at(NOTE_X + 20, Y.traj, 150, 48) },

    // ── grading: one number per trajectory ──────────────────────────────────
    { id: 'grader', label: '채점: 테스트 · 루브릭 · 에이전트', variant: 'norm', ...at(CX, Y.grader, 760, H.grader) },
    ...SLOTS.map((s, i) =>
      s.key === 'dots'
        ? { id: 'r-dots', kind: 'annotation' as const, label: '⋯', variant: 'annotation', ...at(COLS[i]!, Y.reward, 80, H.reward) }
        : {
            id: `r-${s.key}`,
            kind: 'op' as const,
            label: s.r,
            variant: s.pass ? 'ffn' : 'route',
            ...at(COLS[i]!, Y.reward, 112, H.reward),
          },
    ),
    { id: 'r-note', kind: 'annotation', label: '보상 16개', variant: 'annotation', ...at(NOTE_X + 20, Y.reward, 150, 48) },

    // ── training ────────────────────────────────────────────────────────────
    { id: 'trainer', label: '학습: 손실(Eq. 1)로 θ 갱신', variant: 'proj', ...at(CX, Y.trainer, 560, H.trainer) },
  ],
  edges: [
    { id: 'e-pool-policy', from: 'pool', to: 'policy', label: '프롬프트 q' },

    // fan-out: the policy writes every trajectory of the group
    ...REAL.map((s) => ({
      id: `e-policy-tau-${s.key}`,
      from: 'policy',
      to: `tau-${s.key}`,
      ...(xOf(s.key) === CX ? {} : { waypoints: [{ x: CX, y: BUS_OUT }, { x: xOf(s.key), y: BUS_OUT }] }),
    })),
    // each trajectory into the grader, each reward out of it
    ...REAL.map((s) =>
      drop(`e-tau-${s.key}-grader`, `tau-${s.key}`, 'grader', xOf(s.key), (Y.traj + H.traj / 2 + Y.grader - H.grader / 2) / 2),
    ),
    ...REAL.map((s) =>
      drop(`e-grader-r-${s.key}`, 'grader', `r-${s.key}`, xOf(s.key), (Y.grader + H.grader / 2 + Y.reward - H.reward / 2) / 2),
    ),
    // fan-in: every reward reaches the trainer
    ...REAL.map((s) => ({
      id: `e-r-${s.key}-trainer`,
      from: `r-${s.key}`,
      to: 'trainer',
      ...(xOf(s.key) === CX ? {} : { waypoints: [{ x: xOf(s.key), y: BUS_IN }, { x: CX, y: BUS_IN }] }),
    })),

    // the loop: the new θ goes back to the rollout copy for the next step
    {
      id: 'e-trainer-policy',
      from: 'trainer',
      to: 'policy',
      label: '갱신된 θ 복사',
      style: 'dashed',
      waypoints: [
        { x: LOOP_X, y: Y.trainer },
        { x: LOOP_X, y: Y.policy },
      ],
    },
  ],
});

const keys = REAL.map((s) => s.key);

/** reveal bundles per beat — `pool`, `policy` and their edge are in none of them (frame-0 anchor) */
export const rlStepIds = {
  taus: keys.map((k) => `tau-${k}`),
  rewards: keys.map((k) => `r-${k}`),
  fanOut: keys.map((k) => `e-policy-tau-${k}`),
  toGrader: keys.map((k) => `e-tau-${k}-grader`),
  fanIn: keys.map((k) => `e-r-${k}-trainer`),
  rollout: [...keys.map((k) => `tau-${k}`), 'tau-dots', 'tau-note', 'lag', ...keys.map((k) => `e-policy-tau-${k}`)],
  grade: [
    'grader',
    ...keys.map((k) => `e-tau-${k}-grader`),
    ...keys.map((k) => `r-${k}`),
    'r-dots',
    'r-note',
    ...keys.map((k) => `e-grader-r-${k}`),
  ],
  train: ['trainer', ...keys.map((k) => `e-r-${k}-trainer`), 'e-trainer-policy'],
};
