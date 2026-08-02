import { defineDiagram } from '@/lib/diagram';

const e = (from: string, to: string, extra?: Record<string, unknown>) => ({
  id: `e-${from}-${to}`,
  from,
  to,
  ...extra,
});

/**
 * "Dense FFN → MoE layer" morph. Geometry is hand-baked (every node carries
 * `position` + `size`, so auto-layout is skipped) because scene 06 drives it
 * with `stepEffects.move`, and the offsets there are picked against these exact
 * coordinates:
 *
 *   baked     = the dense state — input → attn → ffn → output, one column.
 *   after 'open'    — input/attn slide up, ffn slides out to the left,
 *                     output slides down: the layer opens up.
 *   after 'experts' — the expert pile stacked under the router fans out into a
 *                     row; the `moe` group box grows with it.
 *
 * Nodes revealed later (router, experts, combine) are baked at their *final*
 * spots, which is why their boxes overlap the dense column here — by the time
 * they are revealed the dense nodes have moved out of the way.
 */
export const morphDemo = defineDiagram({
  id: 'morph-demo',
  direction: 'TB',
  groups: [{ id: 'moe', label: 'MoE Layer' }],
  nodes: [
    { id: 'input', kind: 'io', label: '입력 토큰', variant: 'io', size: { w: 240, h: 66 }, position: { x: 580, y: 200 } },
    {
      id: 'attn',
      label: 'Multi-Head Attention',
      variant: 'attention',
      size: { w: 420, h: 84 },
      position: { x: 490, y: 310 },
    },
    {
      id: 'ffn',
      label: 'Dense FFN',
      variant: 'ffn',
      tex: 'W_2\\,\\sigma(W_1 x)',
      size: { w: 280, h: 96 },
      position: { x: 560, y: 440 },
    },
    { id: 'output', kind: 'io', label: '출력', variant: 'io', size: { w: 200, h: 66 }, position: { x: 600, y: 590 } },
    {
      id: 'router',
      label: 'Router',
      variant: 'route',
      tex: 'g = \\mathrm{softmax}(W_g x)',
      size: { w: 320, h: 110 },
      position: { x: 540, y: 250 },
    },
    { id: 'expert-1', label: 'Expert 1', variant: 'ffn', parent: 'moe', size: { w: 185, h: 84 }, position: { x: 580, y: 444 } },
    { id: 'expert-2', label: 'Expert 2', variant: 'ffn', parent: 'moe', size: { w: 185, h: 84 }, position: { x: 660, y: 460 } },
    { id: 'expert-3', label: 'Expert 3', variant: 'ffn', parent: 'moe', size: { w: 185, h: 84 }, position: { x: 740, y: 476 } },
    { id: 'expert-4', label: 'Expert 4', variant: 'ffn', parent: 'moe', size: { w: 185, h: 84 }, position: { x: 820, y: 492 } },
    {
      id: 'combine',
      kind: 'op',
      label: '가중 합',
      variant: 'op',
      tex: '\\textstyle\\sum_i g_i E_i(x)',
      size: { w: 280, h: 84 },
      position: { x: 560, y: 620 },
    },
  ],
  edges: [
    e('input', 'attn'),
    e('attn', 'ffn'),
    e('ffn', 'output'),
    e('attn', 'router'),
    e('router', 'expert-1', { style: 'dashed', label: 'g₁=0.62' }),
    e('router', 'expert-2', { style: 'dashed' }),
    e('router', 'expert-3', { style: 'dashed', label: 'g₃=0.28' }),
    e('router', 'expert-4', { style: 'dashed' }),
    e('expert-1', 'combine'),
    e('expert-2', 'combine'),
    e('expert-3', 'combine'),
    e('expert-4', 'combine'),
    e('combine', 'output'),
  ],
});

/** Offsets applied by scene 06 — kept next to the geometry they are derived from. */
export const morphMoves: Record<string, Record<string, { dx: number; dy: number }>> = {
  open: {
    input: { dx: 0, dy: -200 },
    attn: { dx: 0, dy: -200 },
    ffn: { dx: -540, dy: -68 },
    output: { dx: 0, dy: 210 },
  },
  // spread wide enough that the boxes are already clear of each other halfway
  // through the fan — mid-flight labels must stay readable.
  experts: {
    'expert-1': { dx: -200, dy: -4 },
    'expert-2': { dx: -50, dy: -20 },
    'expert-3': { dx: 100, dy: -36 },
    'expert-4': { dx: 250, dy: -52 },
  },
};
