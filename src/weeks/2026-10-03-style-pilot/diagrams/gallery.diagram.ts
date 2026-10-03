import { defineDiagram } from '@/lib/diagram';

const e = (from: string, to: string) => ({ id: `e-${from}-${to}`, from, to });

/** Home of the reference week: one node per scene shape, in the order the recipes list them. */
export const gallery = defineDiagram({
  id: 'style-gallery',
  direction: 'TB',
  nodes: [
    { id: 'chart', label: '차트와 수식', variant: 'attention' },
    { id: 'walk', label: '그림 따라가기', variant: 'ffn' },
    { id: 'split', label: '그림과 수식', variant: 'route' },
    { id: 'derive', label: '수식 유도', variant: 'proj' },
    { id: 'space', label: '3D', variant: 'embed' },
  ],
  edges: [e('chart', 'walk'), e('walk', 'split'), e('split', 'derive'), e('derive', 'space')],
});
