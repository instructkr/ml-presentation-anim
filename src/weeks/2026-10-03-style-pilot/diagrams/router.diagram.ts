import { defineDiagram } from '@/lib/diagram';

const e = (from: string, to: string, extra?: Record<string, unknown>) => ({
  id: `e-${from}-${to}`,
  from,
  to,
  ...extra,
});

/**
 * A token goes through a router to four experts. Labels name what each block
 * is; the scores ride on the edges. No formulas on nodes — a scene that needs
 * one shows it with `Formula`.
 */
export const router = defineDiagram({
  id: 'pilot-router',
  direction: 'LR',
  // wide rank gap so the score labels fit between the router and the experts
  layout: { rankGap: 170 },
  nodes: [
    { id: 'x', kind: 'io', label: '토큰', variant: 'io' },
    { id: 'router', label: 'Router', variant: 'route' },
    { id: 'expert-1', label: 'Expert 1', variant: 'ffn' },
    { id: 'expert-2', label: 'Expert 2', variant: 'ffn' },
    { id: 'expert-3', label: 'Expert 3', variant: 'ffn' },
    { id: 'expert-4', label: 'Expert 4', variant: 'ffn' },
    { id: 'mix', kind: 'op', label: '가중 합', variant: 'op' },
    { id: 'y', kind: 'io', label: '출력', variant: 'io' },
  ],
  edges: [
    e('x', 'router'),
    e('router', 'expert-1', { style: 'dashed', label: '0.62', labelPos: 0.52 }),
    e('router', 'expert-2', { style: 'dashed', label: '0.05', labelPos: 0.52 }),
    e('router', 'expert-3', { style: 'dashed', label: '0.28', labelPos: 0.52 }),
    e('router', 'expert-4', { style: 'dashed', label: '0.05', labelPos: 0.52 }),
    e('expert-1', 'mix'),
    e('expert-3', 'mix'),
    e('mix', 'y'),
  ],
});

/** id bundles, so a scene's `reveal` lists stay short and can't drift from the figure */
export const routerIds = {
  experts: ['expert-1', 'expert-2', 'expert-3', 'expert-4'],
  scores: ['e-router-expert-1', 'e-router-expert-2', 'e-router-expert-3', 'e-router-expert-4'],
  chosen: ['expert-1', 'expert-3'],
  skipped: ['expert-2', 'expert-4', 'e-router-expert-2', 'e-router-expert-4'],
  output: ['e-expert-1-mix', 'e-expert-3-mix', 'mix', 'e-mix-y', 'y'],
};
