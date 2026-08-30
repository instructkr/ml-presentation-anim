import { defineDiagram } from '@/lib/diagram';

/**
 * The pay-off half of Appendix C: what the dual buys once it exists.
 *
 * Differentiating the same dual along β gives `q − ℓ_j`, the load error — so
 * DeepSeek's fixed-step rule was already descending this exact objective, with
 * the magnitude thrown away and replaced by a hand-set γ. QB instead evaluates
 * the coordinate minimiser in closed form, which is why it has no learning
 * rate. And because the optimum's selection set is a Top-k over `s − β`, the
 * only thing deployment has to carry is `b = −β`; α is batch-bound and dies
 * with the batch.
 */
export const qbJumpDetail = defineDiagram({
  id: 'qb-jump',
  direction: 'TB',
  layout: { rankGap: 68, nodeGap: 48 },
  nodes: [
    {
      id: 'dual',
      kind: 'io',
      label: '앞 편의 가격 함수',
      variant: 'io',
      tex: 'g(\\alpha, \\beta)',
    },
    {
      id: 'grad',
      kind: 'op',
      label: '기울기가 곧 부하 오차',
      variant: 'op',
      tex: '\\partial g / \\partial \\beta_j = q - \\ell_j',
    },
    {
      id: 'sign',
      kind: 'op',
      label: '부호만 쓰면',
      variant: 'route',
      tex: 'b_j \\leftarrow b_j + \\gamma\\,\\mathrm{sign}(q - \\ell_j)',
    },
    {
      id: 'deepseek',
      kind: 'annotation',
      label: 'DeepSeek 고정 스텝 규칙',
      variant: 'annotation',
    },
    {
      id: 'jump',
      kind: 'op',
      label: '바닥으로 바로 간다',
      variant: 'expertRouted',
      tex: '\\beta_j \\leftarrow \\mathrm{quantile}_{1-k/n}(s_{:,j} - \\alpha)',
    },
    {
      id: 'nolr',
      kind: 'annotation',
      label: '정할 보폭이 없다',
      variant: 'annotation',
    },
    {
      id: 'opt',
      kind: 'op',
      label: '최적점의 선택 집합',
      variant: 'attention',
      tex: 'T_i = \\mathrm{argtop}_k(s_i - \\beta)',
    },
    {
      id: 'bias',
      kind: 'io',
      label: '배포에 남는 것',
      variant: 'io',
      tex: 'b = -\\beta',
    },
    {
      id: 'center',
      kind: 'annotation',
      label: '평균을 빼서 가운데로',
      variant: 'annotation',
      tex: 'b \\leftarrow b - \\mathrm{mean}(b)\\,\\mathbf{1}',
    },
    {
      id: 'drop',
      kind: 'annotation',
      label: 'α는 배치와 함께 버린다',
      variant: 'annotation',
    },
  ],
  edges: [
    { id: 'e-dual-grad', from: 'dual', to: 'grad', label: 'β로 미분' },
    { id: 'e-grad-sign', from: 'grad', to: 'sign', label: '부호만' },
    { id: 'e-sign-deepseek', from: 'sign', to: 'deepseek', style: 'dashed', arrow: false },
    { id: 'e-grad-jump', from: 'grad', to: 'jump', label: '바닥으로' },
    { id: 'e-jump-nolr', from: 'jump', to: 'nolr', style: 'dashed', arrow: false },
    { id: 'e-jump-opt', from: 'jump', to: 'opt' },
    { id: 'e-opt-bias', from: 'opt', to: 'bias' },
    { id: 'e-bias-center', from: 'bias', to: 'center', style: 'dotted', arrow: false },
    { id: 'e-bias-drop', from: 'bias', to: 'drop', style: 'dashed', arrow: false },
  ],
});
