import { defineDiagram } from '@/lib/diagram';

/**
 * The comparison point for §5.4.1: how a pure-KV engine does prefix caching.
 *
 * SGLang's RadixAttention keeps every cached prefix in ONE radix tree over
 * token ids (`python/sglang/srt/mem_cache/radix_cache.py`). A node owns a key
 * segment and the KV indices for it; a lookup walks the tree, splits a node
 * wherever the match ends, and returns the matched indices. Nothing is pinned
 * by position — sharing happens wherever two requests happen to agree, down to
 * a `page_size` boundary. Eviction is a leaf-first LRU heap guarded by
 * `lock_ref`, and the scheduler reorders the waiting queue by how much of each
 * request the tree already holds.
 *
 * K3's problem is the part this design assumes away: there is no second,
 * fixed-size recurrent state that also has to be restorable at the boundary.
 */

const at = (cx: number, cy: number, w: number, h: number) => ({
  size: { w, h },
  position: { x: Math.round(cx - w / 2), y: Math.round(cy - h / 2) },
});

export const sglangRadixDetail = defineDiagram({
  id: 'sglang-radix',
  direction: 'TB',
  groups: [
    {
      id: 'tree',
      label: 'RadixCache — 토큰열 위의 하나의 트리',
      rect: { x: 330, y: 24, w: 800, h: 500 },
    },
  ],
  nodes: [
    // ── the tree ────────────────────────────────────────────────────────────
    {
      id: 'root',
      kind: 'op',
      label: 'root',
      variant: 'op',
      shape: 'pill',
      parent: 'tree',
      ...at(720, 100, 130, 46),
    },
    {
      id: 'n-sys',
      label: '공통 접두 · system prompt + 도구 선언',
      variant: 'attention',
      parent: 'tree',
      tex: '2048\\ \\mathrm{tok}',
      ...at(720, 212, 420, 96),
    },
    {
      id: 'n-a',
      label: '세션 A 접두',
      variant: 'attention',
      parent: 'tree',
      ...at(570, 336, 260, 62),
    },
    {
      id: 'n-b',
      label: '세션 B 접두',
      variant: 'attention',
      parent: 'tree',
      ...at(930, 336, 260, 62),
    },
    {
      id: 'n-a1',
      label: 'turn 1 · 실행 중',
      variant: 'expertShared',
      parent: 'tree',
      tex: 'lock\\_ref = 1',
      ...at(465, 460, 230, 74),
    },
    {
      id: 'n-a2',
      label: 'turn 2 · 유휴',
      variant: 'default',
      parent: 'tree',
      tex: 'lock\\_ref = 0',
      ...at(710, 460, 230, 74),
    },
    {
      id: 'n-b1',
      label: 'turn 1 · 최고령 leaf',
      variant: 'default',
      muted: true,
      parent: 'tree',
      tex: 'last\\_access\\_time',
      ...at(968, 462, 274, 78),
    },

    // ── 왼쪽: 조회 경로 ──────────────────────────────────────────────────────
    {
      id: 'op-match',
      kind: 'annotation',
      label: 'match_prefix — 트리를 내려가며 공통 접두 길이 계산',
      variant: 'annotation',
      ...at(158, 170, 300, 150),
    },
    {
      id: 'op-lock',
      kind: 'annotation',
      label: 'inc_lock_ref — 히트 경로를 protected_size_ 로 (축출 불가)',
      variant: 'annotation',
      ...at(158, 350, 300, 150),
    },
    {
      id: 'op-page',
      kind: 'annotation',
      label: 'page_aligned — 키를 page_size 배수로 절단',
      variant: 'annotation',
      ...at(158, 530, 300, 150),
    },

    // ── 오른쪽: 쓰기 · 회수 경로 ─────────────────────────────────────────────
    {
      id: 'op-split',
      kind: 'annotation',
      label: '_split_node — 일치가 끝난 자리에서 노드를 쪼갠다',
      variant: 'annotation',
      ...at(1280, 170, 300, 150),
    },
    {
      id: 'op-insert',
      kind: 'annotation',
      label: 'insert — 이미 캐시된 접두 길이를 돌려주고 중복분 해제',
      variant: 'annotation',
      ...at(1280, 350, 300, 150),
    },
    {
      id: 'op-evict',
      kind: 'annotation',
      label: 'evict — lock_ref == 0 인 leaf 부터 오래된 순으로 회수',
      variant: 'annotation',
      ...at(1280, 530, 300, 150),
    },

    // ── 아래: 트리가 가능하게 하는 것 ────────────────────────────────────────
    {
      id: 'sched',
      kind: 'io',
      label: '캐시 인지 스케줄링 (lpm)',
      variant: 'route',
      tex: '\\downarrow\\ \\mathtt{num\\_matched\\_prefix\\_tokens}',
      ...at(520, 664, 520, 90),
    },
    {
      id: 'hicache',
      kind: 'io',
      label: 'HiCache — host_value 로 CPU·디스크 계층에 내려둔다',
      variant: 'ffn',
      ...at(1080, 664, 480, 90),
    },
  ],
  edges: [
    { id: 'e-root-n-sys', from: 'root', to: 'n-sys' },
    { id: 'e-n-sys-n-a', from: 'n-sys', to: 'n-a' },
    { id: 'e-n-sys-n-b', from: 'n-sys', to: 'n-b' },
    { id: 'e-n-a-n-a1', from: 'n-a', to: 'n-a1' },
    { id: 'e-n-a-n-a2', from: 'n-a', to: 'n-a2' },
    { id: 'e-n-b-n-b1', from: 'n-b', to: 'n-b1' },

    { id: 'e-op-match-n-sys', from: 'op-match', to: 'n-sys', style: 'dashed', arrow: false },
    { id: 'e-op-lock-n-a1', from: 'op-lock', to: 'n-a1', style: 'dashed', arrow: false },
    { id: 'e-op-page-n-a', from: 'op-page', to: 'n-a', style: 'dotted', arrow: false },
    { id: 'e-op-split-n-b', from: 'op-split', to: 'n-b', style: 'dashed', arrow: false },
    { id: 'e-op-insert-n-a2', from: 'op-insert', to: 'n-a2', style: 'dashed', arrow: false },
    { id: 'e-op-evict-n-b1', from: 'op-evict', to: 'n-b1', style: 'dashed', color: 'warn' },

    { id: 'e-n-sys-sched', from: 'n-sys', to: 'sched', style: 'dotted', arrow: false },
    { id: 'e-n-b1-hicache', from: 'n-b1', to: 'hicache', style: 'dashed', label: '버리는 대신 내려보내기' },
  ],
});
