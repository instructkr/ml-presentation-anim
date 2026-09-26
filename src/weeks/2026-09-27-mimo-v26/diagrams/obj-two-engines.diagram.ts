import { defineDiagram } from '@/lib/diagram';

/**
 * Why the sampler μ and the trainer π differ (§4.1, §5.1, §6.4): two copies
 * of the same model on two engines, joined by a forward path (tokens and
 * their sampling probabilities, with the rollout's expert choices replayed on
 * the training side, R3) and a loop-back that delivers the new θ late. The
 * top-p candidate-set replay is the same idea; it lives in the notes, where
 * top-p can be defined.
 *
 *   SGLang · 전문가 MXFP4                                   Megatron-LM
 *   롤아웃 엔진 μ ── 토큰 · 확률 μ ──▶ 재현 ──────────▶ 학습 엔진 π
 *        ▲                                                   │
 *        └────────────── 새 θ (늦게 도착) ◀──────────────────┘
 *
 * A short, wide strip for the top of the 08 visual column; labels are
 * concepts, the staleness bound is a Spec chip in the scene.
 */

const at = (cx: number, cy: number, w: number, h: number) => ({
  size: { w, h },
  position: { x: Math.round(cx - w / 2), y: Math.round(cy - h / 2) },
});

const X = { sampler: 190, replay: 700, trainer: 1210 };
const Y = { sub: 22, row: 82, loop: 172 };

export const twoEnginesDetail = defineDiagram({
  id: 'mimo-v26-two-engines',
  direction: 'LR',
  nodes: [
    // ── frame-0 anchor: the two copies and their engines ────────────────────
    {
      id: 'sampler-sub',
      kind: 'annotation',
      label: 'SGLang · 전문가 MXFP4',
      variant: 'annotation',
      ...at(X.sampler, Y.sub, 340, 40),
    },
    { id: 'sampler', label: '롤아웃 엔진 μ', variant: 'attention', ...at(X.sampler, Y.row, 340, 72) },
    { id: 'trainer-sub', kind: 'annotation', label: 'Megatron-LM', variant: 'annotation', ...at(X.trainer, Y.sub, 300, 40) },
    { id: 'trainer', label: '학습 엔진 π', variant: 'proj', ...at(X.trainer, Y.row, 340, 72) },

    // ── what makes them agree again ─────────────────────────────────────────
    {
      id: 'replay',
      kind: 'op',
      label: '재현: 롤아웃이 고른 전문가',
      variant: 'route',
      ...at(X.replay, Y.row, 380, 64),
    },
  ],
  edges: [
    { id: 'e-sampler-replay', from: 'sampler', to: 'replay', label: '토큰 · 확률 μ' },
    { id: 'e-replay-trainer', from: 'replay', to: 'trainer' },
    {
      id: 'e-trainer-sampler',
      from: 'trainer',
      to: 'sampler',
      label: '새 θ (늦게 도착)',
      style: 'dashed',
      waypoints: [
        { x: X.trainer, y: Y.loop },
        { x: X.sampler, y: Y.loop },
      ],
    },
  ],
});

/** reveal bundles — the two engine boxes and their captions are in none (frame-0 anchor) */
export const twoEnginesIds = {
  why: ['replay', 'e-sampler-replay', 'e-replay-trainer', 'e-trainer-sampler'],
};
