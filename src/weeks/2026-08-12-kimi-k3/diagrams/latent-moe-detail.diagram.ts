import { defineDiagram } from '@/lib/diagram';

const e = (from: string, to: string, extra?: Record<string, unknown>) => ({
  id: `e-${from}-${to}`,
  from,
  to,
  ...extra,
});

/**
 * Stable LatentMoE: the shared branch keeps the full model width, the routed
 * branch works in a compact latent width ℓ — which is what makes 896 experts
 * affordable — plus the RMSNorm that stabilises it before the up-projection.
 */
export const latentMoeDetail = defineDiagram({
  id: 'latent-moe-detail',
  direction: 'LR',
  layout: { rankGap: 110 },
  nodes: [
    { id: 'x', kind: 'io', label: '토큰 x', variant: 'io' },
    { id: 'shared', label: '공유 전문가 ×2', variant: 'expertShared', tex: 'd \\to d' },
    { id: 'down', label: '잠재 압축', variant: 'proj', tex: 'z = W_{\\downarrow}x' },
    { id: 'router', label: 'Router · QB', variant: 'io', tex: 's_i = \\sigma(W_rx_i)' },
    { id: 'experts', label: 'Routed 16 / 896', variant: 'expertRouted', tex: '\\ell \\to \\ell' },
    { id: 'agg', kind: 'op', label: '가중 합 → RMSNorm', variant: 'op', tex: 'u' },
    { id: 'up', label: '복원', variant: 'proj', tex: 'W_{\\uparrow}' },
    { id: 'sum', kind: 'op', label: '합', variant: 'op' },
    { id: 'y', kind: 'io', label: '출력 y', variant: 'io' },
  ],
  edges: [
    e('x', 'shared'),
    e('x', 'down'),
    e('x', 'router'),
    e('down', 'experts'),
    e('router', 'experts', { style: 'dashed', label: 'Top-16' }),
    e('experts', 'agg'),
    e('agg', 'up'),
    e('up', 'sum'),
    e('shared', 'sum'),
    e('sum', 'y'),
  ],
});
