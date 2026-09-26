import { defineDiagram } from '@/lib/diagram';

/**
 * The indexing pipeline of scene 04, run on three decoder layers side by side.
 *
 * Each row is a layer; each column a stage of that pipeline
 *   h → c^Q → indexer Q → 채점 → Top-512 → Core Attention
 * and the tall node on the right is the one global-KV cache (entries +
 * indexer keys) that layer 21 writes.
 *
 *   21 Full     every stage runs; writes the cache
 *   22 Reuse    indexer Q and scoring skipped; Top-512 handed down from 21
 *   25 Reindex  own indexer Q rescores 21's indexer keys; fresh Top-512
 *
 * Every row computes its own c^Q → main query and reads entries from the
 * shared cache (the lane under each row).
 */

const at = (cx: number, cy: number, w: number, h: number) => ({
  size: { w, h },
  position: { x: Math.round(cx - w / 2), y: Math.round(cy - h / 2) },
});

const X = { label: 110, h: 320, cq: 510, qi: 730, score: 970, topk: 1210, attn: 1450, cache: 1790 } as const;
const ROWS = [150, 350, 550] as const;
const H = 64;
const LANE = 62; // 행 아래 본 쿼리 레인까지의 거리
const TOP_LANE = 36;

type Mode = 'full' | 'reuse' | 'reindex';
const MODES: { layer: number; mode: Mode; label: string }[] = [
  { layer: 21, mode: 'full', label: '21층 Full' },
  { layer: 22, mode: 'reuse', label: '22층 Reuse' },
  { layer: 25, mode: 'reindex', label: '25층 Reindex' },
];

const row = (r: 0 | 1 | 2) => {
  const y = ROWS[r];
  const { layer, mode, label } = MODES[r]!;
  const skipped = mode === 'reuse';
  return [
    {
      id: `lab-${r}`,
      label,
      variant: mode === 'full' ? 'proj' : mode === 'reindex' ? 'route' : 'embed',
      ...at(X.label, y, 230, H),
    },
    { id: `h-${r}`, kind: 'io' as const, label: `h_{${layer}}`, title: `${layer}층 입력`, math: true, variant: 'io', ...at(X.h, y, 120, H) },
    { id: `cq-${r}`, kind: 'op' as const, label: 'c^Q', title: `${layer}층 잠재 쿼리`, math: true, variant: 'op', ...at(X.cq, y, 120, H) },
    skipped
      ? { id: `qi-${r}`, label: '건너뜀', title: `${layer}층 indexer 쿼리 (건너뜀)`, variant: 'default', muted: true, ...at(X.qi, y, 220, H) }
      : { id: `qi-${r}`, label: 'indexer 쿼리', title: `${layer}층 indexer 쿼리`, variant: 'route', ...at(X.qi, y, 220, H) },
    skipped
      ? { id: `sc-${r}`, label: '건너뜀', title: `${layer}층 채점 (건너뜀)`, variant: 'default', muted: true, ...at(X.score, y, 210, H) }
      : { id: `sc-${r}`, label: '채점', title: `${layer}층 채점`, variant: 'route', ...at(X.score, y, 210, H) },
    skipped
      ? { id: `tk-${r}`, label: '21층이 고른 512개', title: `${layer}층 Top-512 (물려받음)`, variant: 'default', muted: true, shape: 'pill' as const, ...at(X.topk, y, 210, H) }
      : { id: `tk-${r}`, label: 'Top-512', title: `${layer}층 Top-512`, variant: 'route', shape: 'pill' as const, ...at(X.topk, y, 190, H) },
    { id: `at-${r}`, label: 'Core Attention', title: `${layer}층 어텐션`, variant: 'attention', ...at(X.attn, y, 230, H) },
  ];
};

const rowEdges = (r: 0 | 1 | 2) => {
  const y = ROWS[r];
  const skipped = MODES[r]!.mode === 'reuse';
  const own = skipped
    ? []
    : [
        { id: `e-cq-${r}-qi-${r}`, from: `cq-${r}`, to: `qi-${r}` },
        { id: `e-qi-${r}-sc-${r}`, from: `qi-${r}`, to: `sc-${r}` },
        { id: `e-sc-${r}-tk-${r}`, from: `sc-${r}`, to: `tk-${r}` },
      ];
  return [
    { id: `e-h-${r}-cq-${r}`, from: `h-${r}`, to: `cq-${r}` },
    ...own,
    { id: `e-tk-${r}-at-${r}`, from: `tk-${r}`, to: `at-${r}` },
    {
      id: `e-cq-${r}-at-${r}`,
      from: `cq-${r}`,
      to: `at-${r}`,
      waypoints: [
        { x: X.cq, y: y + LANE },
        { x: X.attn, y: y + LANE },
      ],
    },
    { id: `e-cache-at-${r}`, from: 'cache', to: `at-${r}`, style: 'dashed' as const, label: '항목 읽기' },
  ];
};

export const csa2ReuseDetail = defineDiagram({
  id: 'ds-v41-csa2-reuse',
  direction: 'LR',
  nodes: [
    ...row(0),
    ...row(1),
    ...row(2),
    {
      id: 'mk',
      label: '캐시 항목과 indexer 키를 만든다',
      variant: 'proj',
      ...at(X.score, TOP_LANE, 460, 60),
    },
    {
      id: 'cache',
      kind: 'io',
      label: '전역 KV 캐시 (21층이 쓴 한 벌)',
      title: '공유 전역 KV 캐시',
      variant: 'io',
      ...at(X.cache, ROWS[1], 240, 520),
    },
    {
      id: 'saved',
      kind: 'annotation',
      label: '저장은 21층 한 벌뿐이고, 채점은 21층과 25층만 한다',
      variant: 'annotation',
      ...at(900, 700, 900, 56),
    },
  ],
  edges: [
    ...rowEdges(0),
    ...rowEdges(1),
    ...rowEdges(2),
    // 21층이 캐시를 쓴다
    { id: 'e-h-0-mk', from: 'h-0', to: 'mk', waypoints: [{ x: X.h, y: TOP_LANE }] },
    { id: 'e-mk-cache', from: 'mk', to: 'cache', label: '저장', waypoints: [{ x: X.cache, y: TOP_LANE }] },
    { id: 'e-mk-sc-0', from: 'mk', to: 'sc-0', label: 'indexer 키' },
    // 22층은 21층의 선택을 물려받는다
    { id: 'e-tk-0-tk-1', from: 'tk-0', to: 'tk-1', style: 'dotted', label: '고른 번호를 물려준다' },
    // 25층은 캐시의 indexer 키를 다시 채점한다
    {
      id: 'e-cache-sc-2',
      from: 'cache',
      to: 'sc-2',
      style: 'dashed',
      label: '같은 indexer 키를 다시 채점',
      labelPos: 0.6,
      waypoints: [
        { x: X.cache, y: ROWS[2] + 110 },
        { x: X.score, y: ROWS[2] + 110 },
      ],
    },
  ],
});

/** reveal bundles — 행 라벨과 각 층 입력 h는 어떤 번들에도 없다 (frame-0 앵커) */
const stages = (r: 0 | 1 | 2) => [`cq-${r}`, `qi-${r}`, `sc-${r}`, `tk-${r}`, `at-${r}`];
const edgeIds = (r: 0 | 1 | 2) => rowEdges(r).map((e) => e.id);

export const csa2ReuseIds = {
  full: [...stages(0), ...edgeIds(0), 'mk', 'cache', 'e-h-0-mk', 'e-mk-cache', 'e-mk-sc-0'],
  reuse: [...stages(1), ...edgeIds(1), 'e-tk-0-tk-1'],
  reindex: [...stages(2), ...edgeIds(2), 'e-cache-sc-2'],
  saved: ['saved'],
};
