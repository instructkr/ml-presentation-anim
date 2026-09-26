import { defineDiagram } from '@/lib/diagram';

/**
 * CSA2's three layer modes (§2.3.1, Figure 4) drawn as a table: one row per
 * layer, one column per thing a sparse-attention layer needs. A green cell is
 * made in that layer; a grey cell names the row it borrows from.
 *
 * Rows mirror the decoder's first two groups (§4.2.1): Full + 3 Reuse, then
 * Reindex + Reuse. The rightmost column (own Q and SWA KV) is made in every
 * mode, so it is the frame-0 anchor together with the row labels.
 */

const at = (cx: number, cy: number, w: number, h: number) => ({
  size: { w, h },
  position: { x: Math.round(cx - w / 2), y: Math.round(cy - h / 2) },
});

const COL = { label: 130, kv: 450, idx: 790, topk: 1130, own: 1470 } as const;
const HEADER_Y = 40;
const ROW0 = 120;
const PITCH = 80;
const rowY = (i: number) => ROW0 + i * PITCH;
const CELL_W = 290;
const CELL_H = 60;

type Mode = 'Full' | 'Reuse' | 'Reindex';
const ROWS: { layer: string; mode: Mode }[] = [
  { layer: '21층', mode: 'Full' },
  { layer: '22층', mode: 'Reuse' },
  { layer: '23층', mode: 'Reuse' },
  { layer: '24층', mode: 'Reuse' },
  { layer: '25층', mode: 'Reindex' },
  { layer: '26층', mode: 'Reuse' },
];

const header = (id: string, cx: number, label: string) => ({
  id,
  kind: 'annotation' as const,
  label,
  variant: 'annotation',
  ...at(cx, HEADER_Y, CELL_W, 52),
});

const made = (id: string, cx: number, i: number, label = '직접 만든다') => ({
  id,
  label,
  variant: 'expertShared',
  ...at(cx, rowY(i), CELL_W, CELL_H),
});

const borrowed = (id: string, cx: number, i: number, label: string) => ({
  id,
  label,
  variant: 'default',
  muted: true,
  ...at(cx, rowY(i), CELL_W, CELL_H),
});

export const csa2ModesDetail = defineDiagram({
  id: 'ds-v41-csa2-modes',
  direction: 'TB',
  nodes: [
    header('h-kv', COL.kv, '캐시 항목 (main KV)'),
    header('h-idx', COL.idx, 'indexer 키'),
    header('h-topk', COL.topk, '고른 512개'),
    header('h-own', COL.own, '자기 쿼리 · SWA KV'),

    ...ROWS.map((r, i) => ({
      id: `row-${i}`,
      label: `${r.layer} ${r.mode}`,
      title: `${r.layer} · ${r.mode} Mode`,
      variant: r.mode === 'Full' ? 'proj' : r.mode === 'Reindex' ? 'route' : 'embed',
      ...at(COL.label, rowY(i), 220, CELL_H),
    })),
    ...ROWS.map((_, i) => made(`own-${i}`, COL.own, i)),

    // ── Full (21층) ────────────────────────────────────────────────────────
    made('kv-0', COL.kv, 0, '만들어 저장한다'),
    made('idx-0', COL.idx, 0, '캐시 항목에서 만든다'),
    made('topk-0', COL.topk, 0, '채점해서 고른다'),

    // ── Reuse (22–24층): 항목도 선택도 21층에서 ────────────────────────────
    ...[1, 2, 3].flatMap((i) => [
      borrowed(`kv-${i}`, COL.kv, i, '21층 것을 쓴다'),
      borrowed(`idx-${i}`, COL.idx, i, '필요 없다'),
      borrowed(`topk-${i}`, COL.topk, i, '21층 것을 쓴다'),
    ]),

    // ── Reindex (25층): 항목은 빌리고 선택은 새로 ──────────────────────────
    borrowed('kv-4', COL.kv, 4, '21층 것을 쓴다'),
    borrowed('idx-4', COL.idx, 4, '21층 것을 쓴다'),
    made('topk-4', COL.topk, 4, '다시 채점해서 고른다'),

    // ── Reuse (26층): 선택은 가장 가까운 25층에서 ──────────────────────────
    borrowed('kv-5', COL.kv, 5, '21층 것을 쓴다'),
    borrowed('idx-5', COL.idx, 5, '필요 없다'),
    borrowed('topk-5', COL.topk, 5, '25층 것을 쓴다'),

    {
      id: 'stored',
      kind: 'annotation',
      label: '여섯 층이 저장하는 전역 KV는 21층 한 벌뿐이다',
      variant: 'annotation',
      ...at(COL.kv + 170, rowY(6) - 6, 760, 56),
    },
  ],
  edges: [
    // 빌려 오는 방향: 표 안에서 위 행으로 거슬러 올라가는 점선
    { id: 'e-kv-0-kv-1', from: 'kv-0', to: 'kv-1', style: 'dotted' },
    { id: 'e-topk-0-topk-1', from: 'topk-0', to: 'topk-1', style: 'dotted' },
    { id: 'e-topk-4-topk-5', from: 'topk-4', to: 'topk-5', style: 'dotted' },
  ],
});

const range = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, k) => from + k);
const cells = (rows: number[]) => rows.flatMap((i) => [`kv-${i}`, `idx-${i}`, `topk-${i}`]);

/** reveal bundles — 헤더, 행 라벨, 자기 쿼리·SWA KV 열은 어떤 번들에도 없다 (frame-0 앵커) */
export const csa2Ids = {
  full: cells([0]),
  reuse: [...cells(range(1, 3)), 'e-kv-0-kv-1', 'e-topk-0-topk-1'],
  reindex: [...cells([4, 5]), 'e-topk-4-topk-5'],
  count: ['stored'],
};
