import { defineDiagram } from '@/lib/diagram';

/**
 * Primer: one attention layer of the V4 family has two KV branches, and the
 * serving stack keeps KV in two places. Every later scene says which of those
 * four cells it shrinks, so this picture has to be on screen first.
 *
 *   top    전역 KV (문맥 전체, indexer가 512개 선택) ─┐
 *                                                  ├─ Core Attention ← 현재 토큰 Q
 *          SWA KV (최근 128 토큰) ─────────────────┘
 *   bottom GPU 메모리 (요청 중) · SSD/호스트 (요청 사이 = 영구 캐시)
 *
 * Labels are concepts only; the numbers (m, 512, 128, 72h) are Spec chips in
 * the scene so they arrive on the beat that needs them.
 */

const at = (cx: number, cy: number, w: number, h: number) => ({
  size: { w, h },
  position: { x: Math.round(cx - w / 2), y: Math.round(cy - h / 2) },
});

export const kvBasicsDetail = defineDiagram({
  id: 'ds-v41-kv-basics',
  direction: 'LR',
  nodes: [
    // ── frame-0 앵커: 현재 토큰과 어텐션 ────────────────────────────────────
    { id: 'q', kind: 'io', label: '현재 토큰 Q', variant: 'io', ...at(160, 200, 240, 72) },
    { id: 'attn', label: 'Core Attention', variant: 'attention', ...at(1300, 200, 300, 80) },

    // ── 전역 갈래 ──────────────────────────────────────────────────────────
    {
      id: 'global',
      label: '전역 KV: 문맥 전체',
      title: '전역 KV · 문맥 전체',
      variant: 'proj',
      ...at(520, 70, 340, 76),
    },
    { id: 'indexer', label: 'Indexer (채점기)', variant: 'route', ...at(900, 70, 260, 72) },
    { id: 'topk', kind: 'op', label: 'Top-512', variant: 'route', shape: 'pill', ...at(900, 200, 200, 60) },

    // ── 지역 갈래 ──────────────────────────────────────────────────────────
    {
      id: 'swa',
      label: 'SWA KV: 최근 128 토큰',
      title: 'SWA KV · 최근 128 토큰',
      variant: 'norm',
      ...at(520, 330, 340, 76),
    },

    // ── 저장 위치 ──────────────────────────────────────────────────────────
    {
      id: 'hbm',
      kind: 'io',
      label: 'GPU 메모리 (HBM): 요청을 처리하는 동안',
      title: 'HBM (GPU 메모리)',
      variant: 'io',
      ...at(520, 490, 560, 72),
    },
    {
      id: 'ssd',
      kind: 'io',
      label: 'SSD·호스트: 요청 사이 (영구 캐시)',
      title: '영구 KV 캐시',
      variant: 'io',
      ...at(1160, 490, 520, 72),
    },
    {
      id: 'lever-global',
      kind: 'annotation',
      label: 'CED · CSA2 · FP4는 이 캐시를 줄인다',
      variant: 'annotation',
      ...at(520, 580, 480, 48),
    },
    {
      id: 'lever-swa',
      kind: 'annotation',
      label: 'Bounded Replay는 여기서 SWA KV를 뺀다',
      variant: 'annotation',
      ...at(1160, 580, 560, 48),
    },
  ],
  edges: [
    { id: 'e-q-indexer', from: 'q', to: 'indexer', style: 'dashed', waypoints: [{ x: 160, y: 70 }] },
    { id: 'e-global-indexer', from: 'global', to: 'indexer' },
    { id: 'e-indexer-topk', from: 'indexer', to: 'topk' },
    { id: 'e-topk-attn', from: 'topk', to: 'attn', label: '고른 512개만' },
    { id: 'e-q-attn', from: 'q', to: 'attn', waypoints: [{ x: 160, y: 262 }, { x: 1300, y: 262 }] },
    { id: 'e-swa-attn', from: 'swa', to: 'attn', waypoints: [{ x: 1300, y: 330 }] },
    { id: 'e-global-hbm', from: 'global', to: 'hbm', style: 'dotted', arrow: false, waypoints: [{ x: 740, y: 70 }, { x: 740, y: 490 }] },
    { id: 'e-swa-hbm', from: 'swa', to: 'hbm', style: 'dotted', arrow: false },
    { id: 'e-hbm-ssd', from: 'hbm', to: 'ssd', label: '다음 요청이 이어 쓴다', style: 'dashed' },
  ],
});

/** reveal bundles — q와 attn은 어떤 번들에도 없다 (frame-0 앵커) */
export const kvBasicsIds = {
  global: ['global', 'indexer', 'topk', 'e-q-indexer', 'e-global-indexer', 'e-indexer-topk', 'e-topk-attn'],
  local: ['swa', 'e-swa-attn', 'e-q-attn'],
  runtime: ['hbm', 'e-global-hbm', 'e-swa-hbm'],
  persist: ['ssd', 'e-hbm-ssd'],
  levers: ['lever-global', 'lever-swa'],
};
