import { defineDiagram } from '@/lib/diagram';

/**
 * §5.4.1 — the KDA-aware prefix cache, a reconstruction of Figure 12.
 *
 * A hybrid block keeps two caches with nothing in common: MLA's KV grows with
 * the sequence and is paged per token, while KDA's recurrent state is a single
 * fixed-size blob per request. A cached prefix is reusable only if BOTH can be
 * restored at the same boundary, so K3 packs them into one paged pool and then
 * decouples the two granularities that block-hash caching normally fuses:
 *
 *   · physical block (6144 tokens) stays the allocation unit
 *   · prefix hashing runs on 512-token hash blocks inside MLA pages
 *   · KDA checkpoints are written only at a sparse subset of hash endpoints
 *
 * The figure below is the m = 6144 / 512 = 12 case of the paper's Fig. 12:
 * five cached MLA hash blocks, checkpoints at 1024 and 2560, and a hit at
 * B = 2560 — deep inside a physical block that is nowhere near full.
 */

/** place a node by its centre, like the published figure's geometry */
const at = (cx: number, cy: number, w: number, h: number) => ({
  size: { w, h },
  position: { x: Math.round(cx - w / 2), y: Math.round(cy - h / 2) },
});

/** twelve 512-token hash blocks inside one 6144-token physical block */
const HASH_BLOCKS = 12;
const CELL_W = 92;
const CELL_H = 52;
const PITCH = 98;
const FIRST_CX = 190;
const CELL_CY = 300;
const MARK_CY = 374;
/** hash blocks [0, 5) carry cached MLA KV; the rest of the page is still empty */
const CACHED = 5;
/** hash endpoints that hold a persisted KDA checkpoint (turn boundaries) */
const CHECKPOINTS = new Set([1, 4]);
/** the checkpoint the lookup lands on — endpoint of hash block 4 = token 2560 */
const HIT_INDEX = 4;

const cellCx = (i: number) => FIRST_CX + i * PITCH;
/** a hash boundary sits on the right face of its block */
const boundaryCx = (i: number) => cellCx(i) + CELL_W / 2;

const hashCells = Array.from({ length: HASH_BLOCKS }, (_, i) => ({
  id: `hb-${i}`,
  label: '',
  title: `해시 블록 ${i} · 토큰 ${i * 512}–${(i + 1) * 512}`,
  variant: i < CACHED ? 'attention' : 'default',
  muted: i >= CACHED,
  ...at(cellCx(i), CELL_CY, CELL_W, CELL_H),
}));

const checkpointMarks = Array.from({ length: HASH_BLOCKS }, (_, i) => {
  const hit = i === HIT_INDEX;
  const stored = CHECKPOINTS.has(i);
  return {
    id: `ck-${i}`,
    kind: 'op' as const,
    label: '',
    title: hit
      ? `KDA 체크포인트 ${(i + 1) * 512} (히트)`
      : stored
        ? `KDA 체크포인트 ${(i + 1) * 512}`
        : `체크포인트 없음 · ${(i + 1) * 512}`,
    variant: hit ? 'route' : stored ? 'norm' : 'op',
    shape: 'circle' as const,
    muted: !stored,
    ...at(boundaryCx(i), MARK_CY, 22, 22),
  };
});

export const kdaPrefixCacheDetail = defineDiagram({
  id: 'kda-prefix-cache',
  direction: 'LR',
  groups: [
    {
      id: 'pool',
      label: '통합 페이지 풀 — 두 캐시가 같은 바이트 크기의 페이지를 쓴다',
      rect: { x: 60, y: 40, w: 1320, h: 132 },
    },
    {
      id: 'phys',
      label: '물리 캐시 블록 6144 토큰 = 해시 블록 512 × 12',
      rect: { x: 138, y: 258, w: 1180, h: 84 },
    },
  ],
  nodes: [
    // ── 통합 페이지 풀 ────────────────────────────────────────────────────────
    { id: 'pg-kv-1', label: 'MLA KV page', variant: 'attention', parent: 'pool', ...at(230, 120, 170, 54) },
    { id: 'pg-kv-2', label: 'MLA KV page', variant: 'attention', parent: 'pool', ...at(410, 120, 170, 54) },
    { id: 'pg-kv-3', label: 'MLA KV page', variant: 'attention', parent: 'pool', ...at(590, 120, 170, 54) },
    { id: 'pg-kda-1', label: 'KDA state page', variant: 'ffn', parent: 'pool', ...at(790, 120, 190, 54) },
    { id: 'pg-kda-2', label: 'KDA state page', variant: 'ffn', parent: 'pool', ...at(990, 120, 190, 54) },
    {
      id: 'pool-note',
      kind: 'annotation',
      label: 'alloc · refcount · evict 구현 하나',
      variant: 'annotation',
      parent: 'pool',
      ...at(1215, 120, 290, 56),
    },

    // ── Fig. 12 ─────────────────────────────────────────────────────────────
    { id: 'lbl-mla', kind: 'annotation', label: 'MLA KV', variant: 'annotation', ...at(92, CELL_CY, 108, 40) },
    { id: 'lbl-ckpt', kind: 'annotation', label: 'KDA ckpt', variant: 'annotation', ...at(92, MARK_CY, 108, 40) },
    ...hashCells,
    ...checkpointMarks,
    {
      id: 'coarse',
      kind: 'annotation',
      label: '기존: 해시 단위 = 물리 블록 → 짧은 요청은 재사용 불가',
      variant: 'annotation',
      muted: true,
      ...at(560, 214, 760, 34),
    },
    {
      id: 'hit',
      kind: 'io',
      label: '두 단계를 모두 만족하는 가장 긴 경계',
      variant: 'route',
      tex: 'B = 5 \\times 512 = 2560',
      ...at(boundaryCx(HIT_INDEX) + 60, 448, 460, 74),
    },

    // ── 2단계 조회 ───────────────────────────────────────────────────────────
    {
      id: 'stage-mla',
      label: 'MLA 단계: 물리 블록을 chained hash로 맞추고, 첫 미스 블록 안에서는 해시 끝점으로 폴백',
      variant: 'attention',
      ...at(360, 566, 560, 92),
    },
    {
      id: 'stage-kda',
      label: 'KDA 단계: 모든 KDA 캐시 그룹에 그 경계의 체크포인트가 존재해야 함',
      variant: 'ffn',
      ...at(1000, 566, 560, 92),
    },
    {
      id: 'pin',
      kind: 'op',
      label: '히트 블록을 전 그룹에서 pin → private 블록으로 GPU copy',
      variant: 'norm',
      ...at(360, 690, 560, 74),
    },
    {
      id: 'resume',
      kind: 'io',
      label: 'B부터 prefill 재개 · 구간 [0, B) 재계산 없음',
      variant: 'io',
      ...at(1000, 690, 560, 74),
    },
  ],
  edges: [
    {
      id: 'e-ck-4-hit',
      from: `ck-${HIT_INDEX}`,
      to: 'hit',
      color: 'accent',
      waypoints: [{ x: boundaryCx(HIT_INDEX), y: 420 }],
    },
    {
      id: 'e-hit-stage-mla',
      from: 'hit',
      to: 'stage-mla',
      style: 'dashed',
      arrow: false,
      waypoints: [
        { x: boundaryCx(HIT_INDEX) + 60, y: 512 },
        { x: 360, y: 512 },
      ],
    },
    {
      id: 'e-hit-stage-kda',
      from: 'hit',
      to: 'stage-kda',
      style: 'dashed',
      arrow: false,
      waypoints: [
        { x: boundaryCx(HIT_INDEX) + 60, y: 512 },
        { x: 1000, y: 512 },
      ],
    },
    { id: 'e-stage-mla-pin', from: 'stage-mla', to: 'pin' },
    { id: 'e-stage-kda-resume', from: 'stage-kda', to: 'resume' },
    { id: 'e-pin-resume', from: 'pin', to: 'resume', label: '복사 후' },
  ],
});

/**
 * Reveal bundles, so scenes never hand-list the twelve cells.
 * The pool group and its pages appear in NO bundle — they are the frame-0
 * anchor (hard rule 6).
 */
export const cacheIds = {
  /** the one line that explains what the pool buys */
  poolNote: ['pool-note'],
  /** the physical block and its twelve hash blocks */
  strip: ['phys', 'lbl-mla', 'coarse', ...hashCells.map((c) => c.id)],
  /** hash blocks that already hold cached MLA KV */
  cachedCells: hashCells.slice(0, CACHED).map((c) => c.id),
  /** checkpoint markers, minus the one the lookup lands on */
  marks: ['lbl-ckpt', ...checkpointMarks.filter((_, i) => i !== HIT_INDEX).map((m) => m.id)],
  /** the hit itself */
  hit: [`ck-${HIT_INDEX}`, 'e-ck-4-hit', 'hit'],
  /** the two lookup stages */
  stages: ['stage-mla', 'stage-kda', 'e-hit-stage-mla', 'e-hit-stage-kda'],
  /** what the hit buys */
  result: ['pin', 'resume', 'e-stage-mla-pin', 'e-stage-kda-resume', 'e-pin-resume'],
};
