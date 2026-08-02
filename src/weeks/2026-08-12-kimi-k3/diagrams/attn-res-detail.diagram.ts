import { defineDiagram } from '@/lib/diagram';

const e = (from: string, to: string, extra?: Record<string, unknown>) => ({
  id: `e-${from}-${to}`,
  from,
  to,
  ...extra,
});

/**
 * Attention Residuals turn the residual stream into an attention problem over
 * depth: every source on the left is a key/value, and the layer's learned
 * pseudo-query decides how much of each to read.
 */
export const attnResDetail = defineDiagram({
  id: 'attn-res-detail',
  // TB: the sources fan in from a single row, which keeps this wide and short
  // enough to read as a full-width band
  direction: 'TB',
  layout: { rankGap: 90, nodeGap: 40 },
  // no group box: dagre pads clusters generously, and six sources in one rank
  // plus a cluster makes the layout far too tall to read as a full-width band.
  // The key/value role is carried by the edges and the scene's callout instead.
  nodes: [
    { id: 'emb', kind: 'io', label: '임베딩', variant: 'io', tex: 'b_0 = h_1' },
    { id: 'b1', label: '블록 1', variant: 'default', tex: 'b_1' },
    { id: 'b2', label: '블록 2', variant: 'default', tex: 'b_2' },
    { id: 'bn', label: '블록 n−1', variant: 'default', tex: 'b_{n-1}' },
    { id: 'partial', label: '현재 부분합', variant: 'norm', tex: 'b_n^{\\,i-1}' },
    { id: 'query', label: 'pseudo-query', variant: 'route', tex: 'q_l = w_l' },
    { id: 'attend', label: '깊이 방향 Attention', variant: 'attention', tex: '\\alpha_{i\\to l}' },
    { id: 'layer', label: '레이어 l', variant: 'ffn', tex: 'f_l(h_l)' },
  ],
  edges: [
    e('emb', 'attend'),
    e('b1', 'attend'),
    e('b2', 'attend'),
    e('bn', 'attend'),
    e('partial', 'attend'),
    e('query', 'attend', { style: 'dashed' }),
    e('attend', 'layer', { label: 'hₗ' }),
  ],
});
