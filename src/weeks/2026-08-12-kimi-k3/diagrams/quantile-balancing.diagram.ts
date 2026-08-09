import { defineDiagram } from '@/lib/diagram';

const e = (from: string, to: string, extra?: Record<string, unknown>) => ({
  id: `e-${from}-${to}`,
  from,
  to,
  ...extra,
});

/**
 * Aux-loss-free routing, unrolled over one training step: the current batch is
 * routed with bias b(t); both update rules — DeepSeek's fixed step and K3's
 * quantile — only ever produce b(t+1) for the NEXT step (a batch is never
 * routed with a bias derived from itself).
 */
export const quantileBalancingDetail = defineDiagram({
  id: 'quantile-balancing',
  direction: 'LR',
  layout: { rankGap: 96 },
  nodes: [
    { id: 'x', kind: 'io', label: '토큰 x', variant: 'io' },
    { id: 'router', label: 'Router', variant: 'route', tex: 's_i = \\sigma(W_r x_i)' },
    { id: 'bias', label: 'Expert bias', variant: 'annotation', tex: 'b^{(t)}' },
    { id: 'add', kind: 'op', label: '편향 합', variant: 'op', tex: 's_i + b^{(t)}' },
    { id: 'topk', kind: 'op', label: 'Top-k 선택', variant: 'route' },
    { id: 'p', label: 'Gate', variant: 'annotation', tex: 'p_{i,j} \\propto s_{i,j}' },
    { id: 'experts', label: 'Experts 16 / 896', variant: 'expertRouted' },
    { id: 'load', kind: 'op', label: '부하', variant: 'op', shape: 'bars', tex: '\\ell_j' },
    { id: 'fixed', label: 'DeepSeek V3 · 고정 스텝', variant: 'annotation', tex: '\\gamma\\,\\mathrm{sign}(\\bar{\\ell} - \\ell_j)' },
    { id: 'alpha', label: '컷오프', variant: 'annotation', tex: '\\alpha^{(t)}_i' },
    { id: 'qb', label: 'Quantile Balancing', variant: 'route', tex: '\\mathrm{quantile}_{1-k/n}' },
    { id: 'bnext', kind: 'io', label: '다음 스텝 bias', variant: 'io', tex: 'b^{(t+1)}' },
  ],
  edges: [
    e('x', 'router'),
    e('router', 'add', { label: 's' }),
    e('bias', 'add', { style: 'dashed' }),
    e('add', 'topk'),
    e('topk', 'experts', { label: 'dispatch' }),
    e('router', 'p', { style: 'dashed', label: 'bias 없음' }),
    e('experts', 'load'),
    e('load', 'fixed', { style: 'dashed' }),
    e('fixed', 'bnext', { style: 'dashed' }),
    e('topk', 'alpha', { style: 'dashed', label: 'k+1번째' }),
    e('alpha', 'qb'),
    e('router', 'qb', { style: 'dashed', label: '마진 s−α' }),
    e('qb', 'bnext'),
  ],
});
