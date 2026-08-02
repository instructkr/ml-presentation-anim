import { defineDiagram } from '@/lib/diagram';

const e = (from: string, to: string) => ({ id: `e-${from}-${to}`, from, to });

/** Detail level for the attention block. */
export const attentionDetail = defineDiagram({
  id: 'attention-detail',
  direction: 'LR',
  nodes: [
    { id: 'x', kind: 'io', label: 'x', variant: 'io' },
    { id: 'wq', kind: 'op', label: 'W_Q', variant: 'op' },
    { id: 'wk', kind: 'op', label: 'W_K', variant: 'op' },
    { id: 'wv', kind: 'op', label: 'W_V', variant: 'op' },
    { id: 'q', label: 'Q', variant: 'attention' },
    { id: 'k', label: 'K', variant: 'attention' },
    { id: 'v', label: 'V', variant: 'attention' },
    { id: 'scores', kind: 'op', label: '유사도', variant: 'op', tex: 'QK^{\\top}/\\sqrt{d_k}' },
    { id: 'softmax', kind: 'op', label: 'softmax', variant: 'route' },
    { id: 'weighted', kind: 'op', label: '가중 합', variant: 'op' },
    { id: 'out', kind: 'io', label: '출력', variant: 'io' },
  ],
  edges: [
    e('x', 'wq'),
    e('x', 'wk'),
    e('x', 'wv'),
    e('wq', 'q'),
    e('wk', 'k'),
    e('wv', 'v'),
    e('q', 'scores'),
    e('k', 'scores'),
    e('scores', 'softmax'),
    e('softmax', 'weighted'),
    e('v', 'weighted'),
    e('weighted', 'out'),
  ],
});
