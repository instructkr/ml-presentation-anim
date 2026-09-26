import { defineDiagram } from '@/lib/diagram';

/**
 * CSA2 sequence compression (V4 report §2.3.1 eq. 9–12, simplified in V4.1 §2.3).
 *
 * Eight tokens, each projected to a KV candidate C and a score Z, cut into
 * non-overlapping blocks of m = 2, one entry per block. The diagram is only
 * the structure; the worked numbers for block 3 live in the scene as two
 * TensorMatrix panels and the formulas as EqSteps, so the picture stays
 * conceptual and the arithmetic arrives on its beat.
 */

const at = (cx: number, cy: number, w: number, h: number) => ({
  size: { w, h },
  position: { x: Math.round(cx - w / 2), y: Math.round(cy - h / 2) },
});

const tokCx = (i: number) => 100 + i * 150;
const TOK_Y = 70;
const CZ_Y = 180;
const ENT_Y = 380;
const blockCx = (k: number) => (tokCx(2 * k) + tokCx(2 * k + 1)) / 2;
const MID_X = (tokCx(0) + tokCx(7)) / 2;

export const csa2CompressDetail = defineDiagram({
  id: 'ds-v41-csa2-compress',
  direction: 'LR',
  groups: [0, 1, 2, 3].map((k) => ({
    id: `blk-${k}`,
    label: `블록 ${k + 1}`,
    rect: { x: tokCx(2 * k) - 68, y: -10, w: 286, h: 232 },
  })),
  nodes: [
    // ── frame-0 앵커: 토큰 여덟 개의 은닉 상태 ───────────────────────────────
    ...Array.from({ length: 8 }, (_, i) => ({
      id: `tok-${i}`,
      label: `h_${i + 1}`,
      title: `토큰 ${i + 1}`,
      math: true,
      kind: 'io' as const,
      variant: 'io',
      ...at(tokCx(i), TOK_Y, 110, 56),
    })),

    // ── 토큰마다 값 C와 점수 Z ────────────────────────────────────────────
    ...Array.from({ length: 8 }, (_, i) => ({
      id: `cz-${i}`,
      label: `C_${i + 1},\\,Z_${i + 1}`,
      title: `토큰 ${i + 1}의 값 C와 점수 Z`,
      math: true,
      variant: 'proj',
      ...at(tokCx(i), CZ_Y, 136, 60),
    })),

    // ── 블록마다 항목 하나 ─────────────────────────────────────────────────
    ...[0, 1, 2, 3].map((k) => ({
      id: `ent-${k}`,
      label: `C^{\\text{comp}}_${k + 1}`,
      title: `압축 항목 ${k + 1}`,
      math: true,
      variant: 'route',
      ...at(blockCx(k), ENT_Y, 170, 64),
    })),
    {
      id: 'count',
      kind: 'annotation',
      label: '토큰 8개 → 항목 4개',
      variant: 'annotation',
      ...at(MID_X, ENT_Y + 84, 320, 50),
    },
    {
      id: 'v4-note',
      kind: 'annotation',
      label: '블록끼리 겹치지 않고, 위치 편향도 없다 (V4와 다른 점)',
      variant: 'annotation',
      ...at(MID_X, 300, 760, 46),
    },
  ],
  edges: [
    ...Array.from({ length: 8 }, (_, i) => ({ id: `e-tok-${i}-cz-${i}`, from: `tok-${i}`, to: `cz-${i}` })),
    ...[0, 1, 2, 3].map((k) => ({ id: `e-blk-${k}-ent-${k}`, from: `blk-${k}`, to: `ent-${k}` })),
  ],
});

const range8 = Array.from({ length: 8 }, (_, i) => i);

/** reveal bundles — 토큰 여덟 개는 어떤 번들에도 없다 (frame-0 앵커) */
export const csa2CompressIds = {
  project: [...range8.map((i) => `cz-${i}`), ...range8.map((i) => `e-tok-${i}-cz-${i}`)],
  group: ['blk-0', 'blk-1', 'blk-2', 'blk-3'],
  entries: ['ent-0', 'ent-1', 'ent-2', 'ent-3', 'e-blk-0-ent-0', 'e-blk-1-ent-1', 'e-blk-2-ent-2', 'e-blk-3-ent-3', 'count', 'v4-note'],
};
