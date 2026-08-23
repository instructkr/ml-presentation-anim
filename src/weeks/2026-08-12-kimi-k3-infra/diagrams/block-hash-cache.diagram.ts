import { defineDiagram } from '@/lib/diagram';

/**
 * The baseline every prefix-cache discussion assumes and nobody states:
 * block-hash prefix caching, drawn once, end to end.
 *
 * Request A is prefilled and its KV lands in fixed-size blocks. Only the
 * blocks that filled up get a hash, and each hash folds in the previous one,
 * so one matching hash certifies the entire token prefix behind it. Request B
 * therefore reuses a prefix only at a multiple of the block size — everything
 * after the last complete block is recomputed.
 *
 * §5.4.1 of the K3 report is entirely about what happens to this picture when
 * the block gets big, so this figure is the one to have on screen first.
 */

/** place a node by its centre */
const at = (cx: number, cy: number, w: number, h: number) => ({
  size: { w, h },
  position: { x: Math.round(cx - w / 2), y: Math.round(cy - h / 2) },
});

/** five blocks of the request: four filled, one still filling */
const FIRST_CX = 380;
const PITCH = 280;
const cx = (i: number) => FIRST_CX + i * PITCH;

const BLOCK_CY = 104;
const HASH_CY = 232;
const ROW_CY = 468;

export const blockHashCacheDetail = defineDiagram({
  id: 'block-hash-cache',
  direction: 'LR',
  groups: [
    {
      id: 'reqa',
      label: '요청 A (프리필 완료)',
      rect: { x: 40, y: 44, w: 1620, h: 120 },
    },
  ],
  nodes: [
    // ── 요청 A의 블록들 (frame-0 앵커) ──────────────────────────────────────
    {
      id: 'blk-0',
      label: '블록 0',
      title: '블록 0 · 토큰 0–511',
      variant: 'attention',
      parent: 'reqa',
      tex: '0\\!-\\!511',
      ...at(cx(0), BLOCK_CY, 258, 72),
    },
    {
      id: 'blk-1',
      label: '블록 1',
      title: '블록 1 · 토큰 512–1023',
      variant: 'attention',
      parent: 'reqa',
      tex: '512\\!-\\!1023',
      ...at(cx(1), BLOCK_CY, 258, 72),
    },
    {
      id: 'blk-2',
      label: '블록 2',
      title: '블록 2 · 토큰 1024–1535',
      variant: 'attention',
      parent: 'reqa',
      tex: '1024\\!-\\!1535',
      ...at(cx(2), BLOCK_CY, 258, 72),
    },
    {
      id: 'blk-3',
      label: '블록 3',
      title: '블록 3 · 토큰 1536–2047',
      variant: 'attention',
      parent: 'reqa',
      tex: '1536\\!-\\!2047',
      ...at(cx(3), BLOCK_CY, 258, 72),
    },
    {
      id: 'blk-part',
      label: '아직 채우는 중',
      title: '부분 블록 · 토큰 2048–2199',
      variant: 'default',
      muted: true,
      parent: 'reqa',
      tex: '2048\\!-\\!2199',
      ...at(cx(4), BLOCK_CY, 258, 72),
    },

    // ── 블록이 가득 차면 해시가 하나 생긴다 ────────────────────────────────
    { id: 'h-0', kind: 'op', label: '해시 0', variant: 'norm', shape: 'pill', ...at(cx(0), HASH_CY, 210, 56) },
    { id: 'h-1', kind: 'op', label: '해시 1', variant: 'norm', shape: 'pill', ...at(cx(1), HASH_CY, 210, 56) },
    { id: 'h-2', kind: 'op', label: '해시 2', variant: 'norm', shape: 'pill', ...at(cx(2), HASH_CY, 210, 56) },
    { id: 'h-3', kind: 'op', label: '해시 3', variant: 'norm', shape: 'pill', ...at(cx(3), HASH_CY, 210, 56) },
    {
      id: 'nohash',
      kind: 'annotation',
      label: '가득 차지 않았으므로 해시를 만들지 않는다',
      variant: 'annotation',
      muted: true,
      ...at(cx(4), HASH_CY, 300, 80),
    },

    // ── 인덱스 ─────────────────────────────────────────────────────────────
    {
      id: 'index',
      kind: 'io',
      label: '프리픽스 캐시 인덱스 — 해시 하나가 KV 블록들의 위치를 가리킨다',
      variant: 'io',
      ...at(850, 352, 700, 80),
    },

    // ── 요청 B의 조회 ───────────────────────────────────────────────────────
    {
      id: 'reqb',
      label: '요청 B — 앞 2200 토큰이 A와 똑같다',
      variant: 'embed',
      ...at(480, ROW_CY, 420, 84),
    },
    {
      id: 'lookup',
      label: '앞에서부터 블록 해시를 다시 계산해 인덱스를 조회',
      variant: 'route',
      ...at(950, ROW_CY, 400, 84),
    },
    {
      id: 'hit',
      kind: 'io',
      label: '히트 경계',
      variant: 'route',
      tex: '2048 = 512 \\times 4',
      ...at(1380, ROW_CY, 320, 84),
    },
    {
      id: 'tail',
      kind: 'annotation',
      label: '남은 152 토큰은 그냥 다시 계산한다',
      variant: 'annotation',
      ...at(1380, 578, 320, 62),
    },
    {
      id: 'rule',
      kind: 'annotation',
      label: '가득 찬 블록만 해싱된다 → 재사용은 블록 크기의 배수 지점에서만 일어난다',
      variant: 'annotation',
      ...at(740, 578, 780, 62),
    },
  ],
  edges: [
    { id: 'e-blk-0-h-0', from: 'blk-0', to: 'h-0' },
    { id: 'e-blk-1-h-1', from: 'blk-1', to: 'h-1' },
    { id: 'e-blk-2-h-2', from: 'blk-2', to: 'h-2' },
    { id: 'e-blk-3-h-3', from: 'blk-3', to: 'h-3' },
    { id: 'e-h-0-h-1', from: 'h-0', to: 'h-1' },
    { id: 'e-h-1-h-2', from: 'h-1', to: 'h-2' },
    { id: 'e-h-2-h-3', from: 'h-2', to: 'h-3' },
    {
      id: 'e-h-3-index',
      from: 'h-3',
      to: 'index',
      label: '등록',
      waypoints: [
        { x: cx(3), y: 292 },
        { x: 850, y: 292 },
      ],
    },
    { id: 'e-reqb-lookup', from: 'reqb', to: 'lookup' },
    {
      id: 'e-index-lookup',
      from: 'index',
      to: 'lookup',
      style: 'dashed',
      waypoints: [
        { x: 850, y: 414 },
        { x: 950, y: 414 },
      ],
    },
    { id: 'e-lookup-hit', from: 'lookup', to: 'hit' },
    { id: 'e-hit-tail', from: 'hit', to: 'tail', style: 'dotted', arrow: false },
  ],
});

/** reveal bundles — 요청 A의 블록들은 어떤 번들에도 없다 (frame-0 앵커) */
export const blockHashIds = {
  hashes: ['h-0', 'h-1', 'h-2', 'h-3', 'e-blk-0-h-0', 'e-blk-1-h-1', 'e-blk-2-h-2', 'e-blk-3-h-3'],
  chain: ['e-h-0-h-1', 'e-h-1-h-2', 'e-h-2-h-3'],
  index: ['index', 'e-h-3-index'],
  lookup: ['reqb', 'lookup', 'hit', 'e-reqb-lookup', 'e-index-lookup', 'e-lookup-hit'],
  aligned: ['nohash', 'tail', 'rule', 'e-hit-tail'],
};
