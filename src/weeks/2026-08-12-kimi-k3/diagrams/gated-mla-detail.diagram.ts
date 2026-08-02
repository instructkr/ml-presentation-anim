import { defineDiagram } from '@/lib/diagram';

const e = (from: string, to: string, extra?: Record<string, unknown>) => ({
  id: `e-${from}-${to}`,
  from,
  to,
  ...extra,
});

/**
 * The 1-in-4 global-attention layer: MLA's latent KV cache, no positional
 * encoding at all, and the same full-rank output gate KDA uses.
 */
export const gatedMlaDetail = defineDiagram({
  id: 'gated-mla-detail',
  direction: 'LR',
  layout: { rankGap: 130 },
  nodes: [
    { id: 'x', kind: 'io', label: '토큰 xₜ', variant: 'io' },
    { id: 'cache', label: '잠재 KV 캐시', variant: 'embed', tex: 'c_t = W_cx_t' },
    { id: 'up', label: '업-프로젝션', variant: 'proj', tex: 'K,\\,V' },
    { id: 'attn', label: '전역 어텐션 · NoPE', variant: 'attention', tex: '\\tilde o_t' },
    { id: 'gate', label: '출력 게이트', variant: 'route', tex: '\\sigma(W_gx_t)\\odot' },
    { id: 'y', kind: 'io', label: '출력 yₜ', variant: 'io' },
  ],
  edges: [
    e('x', 'cache'),
    e('cache', 'up'),
    e('up', 'attn'),
    e('attn', 'gate'),
    e('x', 'gate', { style: 'dashed' }),
    e('gate', 'y', { label: 'Wₒ' }),
  ],
});
