import { defineDiagram } from '@/lib/diagram';

const e = (from: string, to: string, extra?: Record<string, unknown>) => ({
  id: `e-${from}-${to}`,
  from,
  to,
  ...extra,
});

/**
 * What the figure's KDA panel does not show: the recurrence itself. KDA is the
 * delta rule with a channel-wise forget gate applied before the write.
 */
export const kdaDetail = defineDiagram({
  id: 'kda-detail',
  direction: 'LR',
  layout: { rankGap: 120 },
  nodes: [
    { id: 'x', kind: 'io', label: '토큰 xₜ', variant: 'io' },
    { id: 'feat', label: 'Conv → Swish → L2', variant: 'attention', tex: 'q_t,k_t,v_t' },
    { id: 'decay', label: '채널별 감쇠', variant: 'route', tex: '\\alpha_t' },
    { id: 'beta', kind: 'op', label: '쓰기 강도', variant: 'op', tex: '\\beta_t' },
    { id: 'update', label: 'Delta-rule 갱신', variant: 'ffn', tex: 'S_t' },
    { id: 'read', kind: 'op', label: '읽기', variant: 'op', tex: '\\tilde o_t = S_t^{\\top}q_t' },
    { id: 'gate', label: '출력 게이트', variant: 'route', tex: '\\sigma(W_gx_t)\\odot' },
    { id: 'y', kind: 'io', label: '출력 yₜ', variant: 'io' },
  ],
  edges: [
    e('x', 'feat'),
    e('x', 'decay'),
    e('x', 'beta'),
    e('feat', 'update'),
    // the forget gate multiplies the incoming state before anything is written
    e('decay', 'update', { label: 'Diag(αₜ)·Sₜ₋₁' }),
    e('beta', 'update'),
    e('update', 'read'),
    e('read', 'gate'),
    e('x', 'gate', { style: 'dashed' }),
    e('gate', 'y'),
  ],
});
