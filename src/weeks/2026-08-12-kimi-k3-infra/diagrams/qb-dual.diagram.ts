import { defineDiagram } from '@/lib/diagram';

/**
 * Appendix C of the K3 report — *why* the update is a quantile.
 *
 * The balanced-assignment LP (every token gets k experts, every expert gets
 * mk/n tokens) is relaxed and dualised; the dual decouples into one threshold
 * per token (α) and one per expert (β), and each coordinate minimiser is the
 * SAME (1−k/n) quantile taken along a different axis of the score matrix.
 * Alg. 1 alternates the two. Only β survives into routing — b = −β — which is
 * what keeps train and inference consistent.
 */
export const qbDualDetail = defineDiagram({
  id: 'qb-dual',
  direction: 'TB',
  layout: { rankGap: 64, nodeGap: 44 },
  nodes: [
    {
      id: 'assign',
      kind: 'io',
      label: '균형 배정 문제',
      variant: 'io',
      tex: '\\max_x \\sum_{i,j} x_{ij}\\, s_{ij}',
    },
    {
      id: 'cons',
      kind: 'annotation',
      label: '제약: 토큰당 k개 · 전문가당 q개',
      variant: 'annotation',
      tex: '\\sum_j x_{ij} = k,\\quad \\sum_i x_{ij} = q',
    },
    {
      id: 'dual',
      kind: 'op',
      label: '라그랑주 쌍대',
      variant: 'op',
      tex: 'L(\\alpha,\\beta)',
    },
    {
      id: 'loop',
      kind: 'op',
      label: '교대 좌표 최소화',
      variant: 'route',
      tex: 't = 1 \\ldots T',
    },
    {
      id: 'alpha',
      label: '토큰 임계 · 행 방향',
      variant: 'attention',
      tex: '\\alpha_i \\leftarrow \\mathrm{quantile}_{1-k/n}(s_i - \\beta)',
    },
    {
      id: 'beta',
      label: '전문가 임계 · 열 방향',
      variant: 'expertRouted',
      tex: '\\beta_j \\leftarrow \\mathrm{quantile}_{1-k/n}(s_{:,j} - \\alpha)',
    },
    {
      id: 'grad',
      kind: 'annotation',
      label: '같은 목적함수의 기울기 = 부하 오차',
      variant: 'annotation',
      tex: '\\partial L/\\partial \\beta_j = q - \\ell_j',
    },
    {
      id: 'sign',
      kind: 'annotation',
      label: 'SignSGD 한 스텝 = DeepSeek 고정 스텝',
      variant: 'annotation',
    },
    {
      id: 'routing',
      kind: 'io',
      label: '라우팅에 남는 것은 β 뿐 · α는 폐기',
      variant: 'io',
      tex: 'T_i = \\mathrm{argtop}_k(s_i - \\beta),\\; b = -\\beta',
    },
    {
      id: 'infer',
      kind: 'io',
      label: '추론: bias 동결 · 분위수 계산 없음',
      variant: 'ffn',
    },
  ],
  edges: [
    { id: 'e-cons-assign', from: 'cons', to: 'assign', style: 'dashed', arrow: false },
    { id: 'e-assign-dual', from: 'assign', to: 'dual', label: '완화 + 쌍대' },
    { id: 'e-dual-loop', from: 'dual', to: 'loop' },
    { id: 'e-loop-alpha', from: 'loop', to: 'alpha', label: 'Alg.1 line 3' },
    { id: 'e-alpha-beta', from: 'alpha', to: 'beta', label: 'Alg.1 line 4' },
    { id: 'e-beta-routing', from: 'beta', to: 'routing' },
    { id: 'e-dual-grad', from: 'dual', to: 'grad', style: 'dashed' },
    { id: 'e-grad-sign', from: 'grad', to: 'sign', style: 'dashed' },
    { id: 'e-routing-infer', from: 'routing', to: 'infer' },
  ],
});
