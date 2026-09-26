import { defineDiagram } from '@/lib/diagram';

/**
 * Hierarchical Sparse Indexer (V4.1 §2.3.2, Figure 5), shrunk to countable size.
 *
 * Eight blocks of eight positions. The decoder's Full layer (21) scores every
 * position; each block takes its maximum score; the top three blocks become
 * the candidate pool (3 × 8 = 24 positions). Reindex layers 25 and 29 score
 * only that pool and pick their own Top-512 from it.
 * Real setting (a Spec chip in the scene): 2,048 blocks × 8 = 16,384 candidates.
 */

const at = (cx: number, cy: number, w: number, h: number) => ({
  size: { w, h },
  position: { x: Math.round(cx - w / 2), y: Math.round(cy - h / 2) },
});

const BLOCK_MAX = [0.2, 0.9, 0.1, 0.4, 0.8, 0.3, 0.7, 0.1];
const PICKED = [1, 4, 6];
const bx = (k: number) => 150 + k * 190;
const BLOCK_Y = 110;
const MAX_Y = 220;
const POOL_Y = 400;
const REINDEX_Y = 590;
const poolX = (i: number) => 520 + i * 300;

export const csa2PoolDetail = defineDiagram({
  id: 'ds-v41-csa2-pool',
  direction: 'LR',
  groups: [
    { id: 'full', label: '21층 Full: 모든 위치를 채점한다', rect: { x: 40, y: 20, w: 1550, h: 250 } },
    { id: 'pool', label: '후보 풀: 뽑힌 블록의 위치 전부', rect: { x: 330, y: 320, w: 980, h: 130 } },
  ],
  nodes: [
    // ── frame-0 앵커: 위치 8칸씩 묶인 블록 여덟 개 ──────────────────────────
    ...BLOCK_MAX.map((_, k) => ({
      id: `b-${k}`,
      label: `블록 ${k + 1} (8칸)`,
      title: `블록 ${k + 1} (위치 8개)`,
      variant: 'embed',
      parent: 'full',
      ...at(bx(k), BLOCK_Y, 170, 72),
    })),
    // ── 블록 점수 = 최고점 ─────────────────────────────────────────────────
    ...BLOCK_MAX.map((v, k) => ({
      id: `m-${k}`,
      kind: 'op' as const,
      label: `최고점 ${v.toFixed(1)}`,
      title: `블록 ${k + 1} 최고점`,
      variant: PICKED.includes(k) ? 'route' : 'default',
      muted: !PICKED.includes(k),
      shape: 'pill' as const,
      parent: 'full',
      ...at(bx(k), MAX_Y, 160, 50),
    })),
    // ── 후보 풀 ────────────────────────────────────────────────────────────
    ...PICKED.map((k, i) => ({
      id: `p-${i}`,
      label: `블록 ${k + 1}의 8칸`,
      variant: 'route',
      parent: 'pool',
      ...at(poolX(i), POOL_Y, 250, 64),
    })),
    {
      id: 'pool-size',
      kind: 'annotation',
      label: '3블록 × 8칸 = 24',
      variant: 'annotation',
      ...at(1480, POOL_Y, 260, 50),
    },
    // ── 뒤쪽 Reindex 층 ────────────────────────────────────────────────────
    { id: 'r25', label: '25층 Reindex', title: '25층 Reindex: 풀 안에서 Top-512', variant: 'route', ...at(560, REINDEX_Y, 360, 76) },
    { id: 'r29', label: '29층 Reindex', title: '29층 Reindex: 풀 안에서 Top-512', variant: 'route', ...at(1080, REINDEX_Y, 360, 76) },
    {
      id: 'cost',
      kind: 'annotation',
      label: '문맥이 길어져도 뒤쪽 층의 채점 수는 그대로다',
      variant: 'annotation',
      ...at(820, 700, 900, 56),
    },
  ],
  edges: [
    ...BLOCK_MAX.map((_, k) => ({ id: `e-b-${k}-m-${k}`, from: `b-${k}`, to: `m-${k}` })),
    ...PICKED.map((k, i) => ({ id: `e-m-${k}-p-${i}`, from: `m-${k}`, to: `p-${i}`, style: 'dashed' as const })),
    { id: 'e-pool-r25', from: 'pool', to: 'r25', label: '풀 안에서만 채점', waypoints: [{ x: 560, y: 500 }] },
    { id: 'e-pool-r29', from: 'pool', to: 'r29', label: '풀 안에서만 채점', waypoints: [{ x: 1080, y: 500 }] },
  ],
});

const all8 = BLOCK_MAX.map((_, k) => k);

/** reveal bundles — Full 그룹과 블록 여덟 개는 어떤 번들에도 없다 (frame-0 앵커) */
export const csa2PoolIds = {
  blocks: [...all8.map((k) => `m-${k}`), ...all8.map((k) => `e-b-${k}-m-${k}`)],
  pool: ['pool', 'p-0', 'p-1', 'p-2', 'pool-size', ...PICKED.map((k, i) => `e-m-${k}-p-${i}`)],
  reindex: ['r25', 'r29', 'e-pool-r25', 'e-pool-r29'],
  cost: ['cost'],
  picked: PICKED.map((k) => `b-${k}`),
};
