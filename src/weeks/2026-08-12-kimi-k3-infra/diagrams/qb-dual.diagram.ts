import { defineDiagram } from '@/lib/diagram';

/**
 * Appendix C, first half — the move that makes the whole thing work.
 *
 * The point is not that a dual exists. It is that pricing the two constraints
 * turns a batch-wide combinatorial assignment into a per-cell test,
 * `s_ij − α_i − β_j > 0`, which is exactly the shape of a router that has to
 * run on one token at inference time. β is then not "a Lagrange multiplier";
 * it is the routing bias of the previous scene. Minimising the leftover
 * function g is the next scene.
 *
 * Labels stay short on purpose: the sentences live in the scene's callouts, and
 * a node wide enough to hold one drags the whole canvas below a readable scale.
 */
export const qbDualDetail = defineDiagram({
  id: 'qb-dual',
  direction: 'TB',
  layout: { rankGap: 72, nodeGap: 44 },
  nodes: [
    {
      id: 'assign',
      kind: 'io',
      label: '원하는 배정',
      variant: 'io',
      tex: '\\max_x \\; \\textstyle\\sum_{ij} x_{ij}\\, s_{ij}',
    },
    {
      id: 'cons',
      kind: 'annotation',
      label: '행마다 k개, 열마다 q개',
      variant: 'annotation',
      tex: '\\textstyle\\sum_j x_{ij} = k,\\;\\; \\sum_i x_{ij} = q',
    },
    {
      id: 'whynot',
      kind: 'annotation',
      label: '배치를 다 봐야 풀린다',
      variant: 'annotation',
    },
    {
      id: 'infer',
      kind: 'annotation',
      label: '추론에는 배치가 없다',
      variant: 'annotation',
    },
    {
      id: 'price',
      kind: 'op',
      label: '제약에 값을 매긴다',
      variant: 'proj',
      tex: '\\alpha_i, \\; \\beta_j',
    },
    {
      id: 'lag',
      kind: 'op',
      label: '라그랑주 함수',
      variant: 'op',
      tex: 'L(x, \\alpha, \\beta)',
    },
    {
      id: 'free',
      kind: 'op',
      label: '칸마다 따로 정해진다',
      variant: 'route',
      tex: 's_{ij} - \\alpha_i - \\beta_j > 0',
    },
    {
      id: 'rule',
      kind: 'io',
      label: '토큰 하나만 보는 규칙',
      variant: 'io',
      tex: 'T_i = \\{\\, j : s_{ij} - \\beta_j > \\alpha_i \\,\\}',
    },
    {
      id: 'isbias',
      kind: 'annotation',
      label: 'β가 곧 전문가별 bias',
      variant: 'annotation',
    },
    {
      id: 'dual',
      kind: 'op',
      label: '가격만의 함수가 남는다',
      variant: 'expertRouted',
      tex: 'g(\\alpha, \\beta)',
    },
    {
      id: 'next',
      kind: 'annotation',
      label: '남은 일은 g의 최소화',
      variant: 'annotation',
    },
  ],
  edges: [
    { id: 'e-cons-assign', from: 'cons', to: 'assign', style: 'dashed', arrow: false },
    { id: 'e-assign-whynot', from: 'assign', to: 'whynot', style: 'dashed' },
    { id: 'e-whynot-infer', from: 'whynot', to: 'infer', style: 'dotted', arrow: false },
    { id: 'e-assign-price', from: 'assign', to: 'price' },
    { id: 'e-price-lag', from: 'price', to: 'lag' },
    { id: 'e-lag-free', from: 'lag', to: 'free', label: 'x로 최대화' },
    { id: 'e-free-rule', from: 'free', to: 'rule' },
    { id: 'e-rule-isbias', from: 'rule', to: 'isbias', style: 'dashed', arrow: false },
    { id: 'e-lag-dual', from: 'lag', to: 'dual', label: 'x를 지우면' },
    { id: 'e-dual-next', from: 'dual', to: 'next', style: 'dotted', arrow: false },
  ],
});
