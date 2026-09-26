import { defineDiagram } from '@/lib/diagram';

/**
 * Root: the four places V4.1-Flash shrinks the KV cache, in the order a
 * token's KV meets them. Edge labels say what each lever buys, in plain words;
 * the mechanism lives in the scene each node opens. The prompt node opens the
 * primer (two kinds of KV cache); the global-KV sink opens the FP4 scene,
 * where 890 is added up.
 */
export const kvLevers = defineDiagram({
  id: 'ds-v41-kv-levers',
  direction: 'TB',
  // 모듈 사이 세로 간격을 넉넉히 — 엣지 라벨이 블록에 붙지 않게
  layout: { rankGap: 150, nodeGap: 120 },
  nodes: [
    { id: 'prompt', kind: 'io', label: '프롬프트 토큰', title: 'KV 캐시 두 종류', variant: 'io' },
    { id: 'ced', label: 'Causal Encoder-Decoder', variant: 'attention' },
    { id: 'csa2', label: 'CSA2 Cross-Layer Reuse', variant: 'route' },
    { id: 'fp4', label: 'FP4 Main KV Cache', variant: 'proj' },
    { id: 'global-kv', kind: 'io', label: '전역 KV: 토큰당 890 B', variant: 'io' },
    { id: 'swa-replay', label: 'SWA Bounded Replay', variant: 'norm' },
  ],
  edges: [
    { id: 'e-prompt-ced', from: 'prompt', to: 'ced' },
    { id: 'e-ced-csa2', from: 'ced', to: 'csa2', label: 'prefill 계산 절반' },
    { id: 'e-csa2-fp4', from: 'csa2', to: 'fp4', label: '저장하는 층 40 → 4' },
    { id: 'e-fp4-global-kv', from: 'fp4', to: 'global-kv', label: '항목당 바이트 절반' },
    { id: 'e-ced-swa-replay', from: 'ced', to: 'swa-replay', style: 'dashed', label: 'SWA KV는 저장하지 않는다' },
  ],
});
