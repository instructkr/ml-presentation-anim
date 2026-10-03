import { defineDiagram } from '@/lib/diagram';

const e = (from: string, to: string) => ({ id: `e-${from}-${to}`, from, to });

/**
 * Attention as a top-to-bottom flow (TB, so it fills the tall cell of a
 * `split` Board). Query, Key and Value wear ink names as their variant: inside
 * a scene a node that stands for a quantity takes that quantity's colour.
 */
export const attention = defineDiagram({
  id: 'pilot-attention',
  direction: 'TB',
  nodes: [
    { id: 'q', label: 'Query', variant: 'blue' },
    { id: 'k', label: 'Key', variant: 'teal' },
    { id: 'v', label: 'Value', variant: 'green' },
    // modules keep the paper's English name; a bare value or unnamed operation may take a short Korean noun
    { id: 'scores', kind: 'op', label: '점수', variant: 'op' },
    { id: 'weights', kind: 'op', label: 'softmax', variant: 'gold' },
    { id: 'mix', kind: 'op', label: '가중 합', variant: 'op' },
    { id: 'out', kind: 'io', label: '출력', variant: 'io' },
  ],
  edges: [e('q', 'scores'), e('k', 'scores'), e('scores', 'weights'), e('weights', 'mix'), e('v', 'mix'), e('mix', 'out')],
});
