import { defineDiagram } from '@/lib/diagram';

const e = (from: string, to: string, extra?: Record<string, unknown>) => ({
  id: `e-${from}-${to}`,
  from,
  to,
  ...extra,
});

/** Root explorable: a MoE transformer block. */
export const moeArch = defineDiagram({
  id: 'moe-arch',
  direction: 'TB',
  groups: [{ id: 'moe', label: 'MoE Layer' }],
  nodes: [
    { id: 'input', kind: 'io', label: '입력 토큰', variant: 'io' },
    { id: 'embed', label: 'Embedding', variant: 'embed' },
    { id: 'norm1', kind: 'op', label: 'RMSNorm', variant: 'norm' },
    { id: 'attn', label: 'Multi-Head Attention', variant: 'attention' },
    { id: 'norm2', kind: 'op', label: 'RMSNorm', variant: 'norm' },
    { id: 'router', label: 'Router', variant: 'route', tex: 'g = \\mathrm{softmax}(W_g x)' },
    { id: 'expert-1', label: 'Expert 1', variant: 'ffn', parent: 'moe' },
    { id: 'expert-2', label: 'Expert 2', variant: 'ffn', parent: 'moe' },
    { id: 'expert-3', label: 'Expert 3', variant: 'ffn', parent: 'moe' },
    { id: 'expert-4', label: 'Expert 4', variant: 'ffn', parent: 'moe' },
    { id: 'combine', kind: 'op', label: '가중 합', variant: 'op', tex: '\\textstyle\\sum_i g_i E_i(x)' },
    { id: 'output', kind: 'io', label: '출력', variant: 'io' },
  ],
  edges: [
    e('input', 'embed'),
    e('embed', 'norm1'),
    e('norm1', 'attn'),
    e('attn', 'norm2'),
    e('norm2', 'router'),
    e('router', 'expert-1', { style: 'dashed', label: 'g₁' }),
    e('router', 'expert-2', { style: 'dashed', label: 'g₂' }),
    e('router', 'expert-3', { style: 'dashed', label: 'g₃' }),
    e('router', 'expert-4', { style: 'dashed', label: 'g₄' }),
    e('expert-1', 'combine'),
    e('expert-2', 'combine'),
    e('expert-3', 'combine'),
    e('expert-4', 'combine'),
    e('combine', 'output'),
  ],
});
