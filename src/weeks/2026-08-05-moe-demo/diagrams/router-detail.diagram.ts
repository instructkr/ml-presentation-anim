import { defineDiagram } from '@/lib/diagram';

const e = (from: string, to: string, extra?: Record<string, unknown>) => ({
  id: `e-${from}-${to}`,
  from,
  to,
  ...extra,
});

/** Detail level for the router: scoring and Top-K selection. */
export const routerDetail = defineDiagram({
  id: 'router-detail',
  direction: 'LR',
  // wide rank gap so the gate-value labels fit between router and experts
  layout: { rankGap: 170 },
  nodes: [
    { id: 'x', kind: 'io', label: '토큰 x', variant: 'io' },
    { id: 'router', label: 'Router', variant: 'route', tex: 'g = \\mathrm{softmax}(W_g x)' },
    { id: 'expert-1', label: 'Expert 1', variant: 'ffn' },
    { id: 'expert-2', label: 'Expert 2', variant: 'ffn' },
    { id: 'expert-3', label: 'Expert 3', variant: 'ffn' },
    { id: 'expert-4', label: 'Expert 4', variant: 'ffn' },
    { id: 'combine', kind: 'op', label: '가중 합', variant: 'op' },
    { id: 'y', kind: 'io', label: 'y', variant: 'io' },
  ],
  edges: [
    e('x', 'router'),
    e('router', 'expert-1', { style: 'dashed', label: 'g₁=0.62' }),
    e('router', 'expert-2', { style: 'dashed', label: 'g₂=0.05' }),
    e('router', 'expert-3', { style: 'dashed', label: 'g₃=0.28' }),
    e('router', 'expert-4', { style: 'dashed', label: 'g₄=0.05' }),
    e('expert-1', 'combine'),
    e('expert-2', 'combine'),
    e('expert-3', 'combine'),
    e('expert-4', 'combine'),
    e('combine', 'y'),
  ],
});
