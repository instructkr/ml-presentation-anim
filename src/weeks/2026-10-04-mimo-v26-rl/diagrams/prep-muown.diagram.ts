import { defineDiagram } from '@/lib/diagram';
import { INK } from '../quantities';

const e = (from: string, to: string) => ({ id: `e-${from}-${to}`, from, to });

/**
 * What Muown keeps and who updates it (§3.2; mechanism from the Muown paper).
 * Top to bottom, so it fills the tall cell of a `split` Board:
 *
 *      Adam          Muon          the two optimizers
 *        ↓             ↓
 *   행 길이 g      행 방향 R       the two variables Muown stores
 *        └─────┬───────┘
 *          가중치 W                rebuilt from them in the forward pass
 *
 * g and R wear the inks of the equation's terms; everything else is grey.
 */
export const muownDiagram = defineDiagram({
  id: 'mimo-v26-rl-muown',
  direction: 'TB',
  layout: { nodeGap: 90, rankGap: 96 },
  nodes: [
    { id: 'adam', kind: 'op', label: 'Adam', variant: 'op' },
    { id: 'muon', kind: 'op', label: 'Muon', variant: 'op' },
    { id: 'g', label: '행 길이 g', variant: INK.g },
    { id: 'r', label: '행 방향 R', variant: INK.dir },
    { id: 'w', kind: 'io', label: '가중치 W', variant: 'io' },
  ],
  edges: [e('adam', 'g'), e('muon', 'r'), e('g', 'w'), e('r', 'w')],
});

/** per-beat reveal bundles — `w` is in none of them (the frame-0 anchor) */
export const muownIds = {
  split: ['g', 'r', 'e-g-w', 'e-r-w'],
  direction: ['muon', 'e-muon-r'],
  length: ['adam', 'e-adam-g'],
};
