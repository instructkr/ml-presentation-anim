import { defineDiagram } from '@/lib/diagram';

const e = (from: string, to: string, extra?: Record<string, unknown>) => ({
  id: `e-${from}-${to}`,
  from,
  to,
  ...extra,
});

/**
 * Per-Head Muon: the K2 path orthogonalizes the whole Q/K/V momentum as one
 * coupled block; K3 partitions the momentum along the head dimension and runs
 * Newton–Schulz on each head's block separately.
 */
export const perHeadMuonDetail = defineDiagram({
  id: 'per-head-muon',
  direction: 'LR',
  layout: { rankGap: 100 },
  nodes: [
    { id: 'g', kind: 'io', label: 'Gradient', variant: 'io', tex: 'G_t' },
    { id: 'm', kind: 'op', label: 'Momentum', variant: 'op', tex: 'M_t = \\mu M_{t-1} + G_t' },
    { id: 'full', label: 'Full-matrix NS', variant: 'proj', tex: '\\mathrm{NS}_5(M_t)' },
    { id: 'split', kind: 'op', label: '헤드축 분할', variant: 'route' },
    { id: 'h1', label: 'Head 1', variant: 'proj', tex: '\\mathrm{NS}_5(M^{(1)})' },
    { id: 'hdots', label: '\\cdots', variant: 'annotation', math: true, shape: 'circle', size: { w: 44, h: 44 } },
    { id: 'h96', label: 'Head 96', variant: 'proj', tex: '\\mathrm{NS}_5(M^{(96)})' },
    { id: 'concat', kind: 'op', label: '연결', variant: 'op', tex: 'O = [\\,O^{(1)}|\\cdots\\,]' },
    { id: 'w', kind: 'io', label: 'Weight update', variant: 'io', tex: 'W \\leftarrow W - \\eta\\,O' },
  ],
  edges: [
    e('g', 'm'),
    e('m', 'full', { style: 'dashed', label: 'K2' }),
    e('full', 'w', { style: 'dashed' }),
    e('m', 'split', { label: 'K3' }),
    e('split', 'h1'),
    e('split', 'hdots', { style: 'dotted' }),
    e('split', 'h96'),
    e('h1', 'concat'),
    e('hdots', 'concat', { style: 'dotted' }),
    e('h96', 'concat'),
    e('concat', 'w'),
  ],
});
