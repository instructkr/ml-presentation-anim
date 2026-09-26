import { defineDiagram } from '@/lib/diagram';

/**
 * The expectation of Eq. 1 read left to right, the way §4.1 (p8) reads it:
 * a prompt q is drawn from the union of the task datasets ⋃_d D_d, and the
 * rollout copy μ_θold (the sampler) writes a group of G = 16 trajectories
 * {o_i} for it. The bracket of Eq. 1 is averaged over all of them.
 *
 *   ┌ 과제 데이터셋 전체 ┐
 *   │ 코딩              │                      롤아웃을 쓴 사본        ┌▶ o₁
 *   │ 도구 사용          │                                              ├▶ o₂
 *   │ 디자인            │ ──▶ 프롬프트 q ──▶ 샘플러 μ ─────────────┤   ⋯     궤적 G = 16개
 *   │ 문맥 따르기        │                                              └▶ o₁₆
 *   │ 보안              │
 *   └───────────────────┘
 *
 * The dataset names are 05's task mix (§5.1); their shares stay in 05's chip.
 * A wide, short strip for the chart cell under 07's equation.
 */

const at = (cx: number, cy: number, w: number, h: number) => ({
  size: { w, h },
  position: { x: Math.round(cx - w / 2), y: Math.round(cy - h / 2) },
});

const MID = 200;
const X = { ds: 140, q: 410, sampler: 700, bus: 900, traj: 1000, note: 1160 };
const DATASETS = ['코딩', '도구 사용', '디자인', '문맥 따르기', '보안'];
const DS_STEP = 60;
/** four slots for the group: o₁ o₂ ⋯ o₁₆ (index 2 is the ellipsis) */
const TRAJ = [
  { id: 'o1', label: 'o₁' },
  { id: 'o2', label: 'o₂' },
  { id: 'odots', label: '⋯' },
  { id: 'o16', label: 'o₁₆' },
];
const TRAJ_STEP = 64;
const trajY = (k: number) => MID + (k - 1.5) * TRAJ_STEP;

export const expectationDetail = defineDiagram({
  id: 'mimo-v26-expectation',
  direction: 'LR',
  // ~44 units of headroom above the first dataset for the group's label chip
  groups: [{ id: 'datasets', label: '과제 데이터셋 전체', rect: { x: 20, y: 14, w: 240, h: 372 } }],
  nodes: [
    // ── frame-0 anchor: the task datasets whose union q is drawn from ─────────
    ...DATASETS.map((label, i) => ({
      id: `ds-${i}`,
      kind: 'io' as const,
      label,
      variant: 'io',
      parent: 'datasets',
      ...at(X.ds, MID + (i - 2) * DS_STEP, 200, 46),
    })),

    // ── one prompt, the sampler, its group of attempts ──────────────────────
    { id: 'q', kind: 'op', label: '프롬프트 q', variant: 'op', ...at(X.q, MID, 180, 64) },
    {
      id: 'sampler-sub',
      kind: 'annotation',
      label: '롤아웃을 쓴 사본',
      variant: 'annotation',
      ...at(X.sampler, MID - 70, 260, 40),
    },
    { id: 'sampler', label: '샘플러 μ', variant: 'attention', ...at(X.sampler, MID, 300, 76) },
    ...TRAJ.map((s, k) =>
      s.id === 'odots'
        ? { id: s.id, kind: 'annotation' as const, label: s.label, variant: 'annotation', ...at(X.traj, trajY(k), 80, 48) }
        : { id: s.id, kind: 'op' as const, label: s.label, variant: 'op', ...at(X.traj, trajY(k), 110, 48) },
    ),
    { id: 'o-note', kind: 'annotation', label: '궤적 G = 16개', variant: 'annotation', ...at(X.note, MID, 170, 44) },
  ],
  edges: [
    { id: 'e-datasets-q', from: 'datasets', to: 'q' },
    { id: 'e-q-sampler', from: 'q', to: 'sampler' },
    // fan-out on a shared rail right of the sampler
    ...TRAJ.filter((s) => s.id !== 'odots').map((s) => ({
      id: `e-sampler-${s.id}`,
      from: 'sampler',
      to: s.id,
      waypoints: [
        { x: X.bus, y: MID },
        { x: X.bus, y: trajY(TRAJ.indexOf(s)) },
      ],
    })),
  ],
});

/** the shell reveal, left to right — the datasets are in none (frame-0 anchor) */
export const expectationIds = {
  shell: [
    'e-datasets-q',
    'q',
    'e-q-sampler',
    'sampler',
    'sampler-sub',
    'e-sampler-o1',
    'e-sampler-o2',
    'e-sampler-o16',
    'o1',
    'o2',
    'odots',
    'o16',
    'o-note',
  ],
};
