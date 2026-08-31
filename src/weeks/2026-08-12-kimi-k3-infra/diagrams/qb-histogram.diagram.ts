import { defineDiagram } from '@/lib/diagram';

/**
 * Appendix D — how the Eq. 14 quantile is actually computed at 3T scale.
 *
 * The exact quantile ranges over the whole global batch: millions of margins
 * spread across data-parallel ranks *and* gradient-accumulation micro-batches,
 * which never coexist anywhere. So the values are never gathered. Each rank
 * scatter-adds the *required bias* r_ij = α_i − s_ij into a per-expert integer
 * histogram with no communication at all, one all-reduce per layer per step
 * pools the counts, and the quantile is read back off the pooled counts.
 * Counts add, so what comes out is the quantile of the pooled batch — not an
 * average of per-rank quantiles, which is a different and wrong number.
 */
export const qbHistogramDetail = defineDiagram({
  id: 'qb-histogram',
  direction: 'LR',
  layout: { rankGap: 92, nodeGap: 40 },
  nodes: [
    {
      id: 'batch',
      kind: 'io',
      label: '랭크 하나의 micro-batch',
      variant: 'io',
      tex: 's_{ij},\\; \\alpha_i',
    },
    {
      id: 'spread',
      kind: 'annotation',
      label: '값이 랭크와 스텝에 흩어져 있다',
      variant: 'annotation',
    },
    {
      id: 'req',
      kind: 'op',
      label: '필요 bias',
      variant: 'route',
      tex: 'r_{ij} = \\alpha_i - s_{ij}',
    },
    {
      id: 'range',
      kind: 'annotation',
      label: '구간은 현재 bias가 정한다',
      variant: 'annotation',
      tex: '[\\,b_{\\min}-1,\\; b_{\\max}+1\\,],\\; B = 1000',
    },
    {
      id: 'hist',
      kind: 'op',
      label: '값 대신 개수만 센다',
      variant: 'op',
      shape: 'bars',
      tex: 'H \\in \\mathbb{N}^{n \\times B}',
      size: { w: 260, h: 92 },
    },
    {
      id: 'accum',
      kind: 'annotation',
      label: '누적 스텝도 같은 표에',
      variant: 'annotation',
    },
    {
      id: 'ar',
      kind: 'op',
      label: '스텝당 정수 all-reduce 1회',
      variant: 'attention',
      tex: 'nB \\;\\text{counts}',
    },
    {
      id: 'global',
      label: '전 배치를 합친 표',
      variant: 'expertRouted',
      shape: 'bars',
      tex: '\\textstyle\\sum_r H^{(r)}',
      size: { w: 230, h: 92 },
    },
    {
      id: 'cum',
      kind: 'op',
      label: '목표 q에 닿는 첫 칸',
      variant: 'op',
      tex: 'q = mk/n',
    },
    {
      id: 'interp',
      kind: 'op',
      label: '칸 안에서 선형 보간',
      variant: 'route',
      tex: '\\hat b_j = b_{\\min}-1+\\big(\\beta_j + \\tfrac{q-c_j}{h_j}\\big)w',
    },
    {
      id: 'center',
      kind: 'io',
      label: '평균을 빼고 다음 bias로',
      variant: 'io',
      tex: 'b^{(t+1)} = \\hat b - \\mathrm{mean}(\\hat b)\\,\\mathbf{1}',
    },
    {
      id: 'ema',
      kind: 'annotation',
      label: '원하면 스텝 간 EMA',
      variant: 'annotation',
    },
    {
      id: 'naive',
      kind: 'annotation',
      label: '값을 모으면 micro-batch마다 O(mn)',
      variant: 'annotation',
      muted: true,
    },
  ],
  edges: [
    { id: 'e-batch-spread', from: 'batch', to: 'spread', style: 'dashed', arrow: false },
    { id: 'e-batch-req', from: 'batch', to: 'req' },
    { id: 'e-range-hist', from: 'range', to: 'hist', style: 'dashed', arrow: false },
    { id: 'e-req-hist', from: 'req', to: 'hist', label: '칸 폭 w' },
    { id: 'e-accum-hist', from: 'accum', to: 'hist', style: 'dotted', arrow: false },
    { id: 'e-hist-ar', from: 'hist', to: 'ar' },
    { id: 'e-ar-global', from: 'ar', to: 'global' },
    { id: 'e-global-cum', from: 'global', to: 'cum' },
    { id: 'e-cum-interp', from: 'cum', to: 'interp' },
    { id: 'e-interp-center', from: 'interp', to: 'center' },
    { id: 'e-center-ema', from: 'center', to: 'ema', style: 'dotted', arrow: false },
    { id: 'e-req-naive', from: 'req', to: 'naive', style: 'dotted', arrow: false },
  ],
});
