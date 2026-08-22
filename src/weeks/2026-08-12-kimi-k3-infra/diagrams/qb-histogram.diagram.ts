import { defineDiagram } from '@/lib/diagram';

/**
 * Appendix D — how the Eq. 14 quantile is actually computed at 3T scale.
 *
 * The exact quantile spans the whole global batch (millions of margins spread
 * over data-parallel ranks AND gradient-accumulation micro-batches), so it is
 * never materialised. Every rank scatter-adds the *required bias*
 * r_ij = α_i − s_ij into a per-expert histogram with no communication; one
 * integer all-reduce per layer per step pools the counts, and the quantile is
 * read back from the pooled histogram. Counts are additive, so the estimate is
 * the quantile of the pooled batch — not an average of per-rank quantiles.
 */
export const qbHistogramDetail = defineDiagram({
  id: 'qb-histogram',
  direction: 'LR',
  layout: { rankGap: 92, nodeGap: 40 },
  nodes: [
    {
      id: 'batch',
      kind: 'io',
      label: 'micro-batch · rank r',
      variant: 'io',
      tex: 's_{ij},\\; \\alpha_i',
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
      label: 'binning 구간 · 매 스텝 재계산',
      variant: 'annotation',
      tex: '[\\,b_{\\min}-1,\\; b_{\\max}+1\\,],\\; B = 1000',
    },
    {
      id: 'hist',
      kind: 'op',
      label: 'rank-local scatter-add',
      variant: 'op',
      shape: 'bars',
      tex: 'H \\in \\mathbb{N}^{n \\times B}',
      size: { w: 240, h: 88 },
    },
    {
      id: 'accum',
      kind: 'annotation',
      label: '누적 스텝 전부 누적 · 통신 0',
      variant: 'annotation',
    },
    {
      id: 'ar',
      kind: 'op',
      label: '정수 all-reduce (스텝당 1회)',
      variant: 'attention',
      tex: 'nB\\ \\mathrm{counts}',
    },
    {
      id: 'global',
      label: '전역 히스토그램',
      variant: 'expertRouted',
      shape: 'bars',
      tex: '\\sum_r H^{(r)}',
      size: { w: 220, h: 88 },
    },
    {
      id: 'cum',
      kind: 'op',
      label: '누적합이 목표 부하에 닿는 첫 bin',
      variant: 'op',
      tex: 'q = mk/n',
    },
    {
      id: 'interp',
      kind: 'op',
      label: 'bin 내부 선형 보간',
      variant: 'route',
      tex: '\\hat b_j = b_{\\min}-1+\\big(\\beta_j + \\tfrac{q-c_j}{h_j}\\big)w',
    },
    {
      id: 'center',
      kind: 'io',
      label: '평균 제거 후 다음 스텝 bias',
      variant: 'io',
      tex: 'b^{(t+1)} = \\hat b - \\mathrm{mean}(\\hat b)\\mathbf{1}',
    },
    {
      id: 'ema',
      kind: 'annotation',
      label: '선택: 스텝 간 EMA로 샘플링 잡음 완화',
      variant: 'annotation',
    },
    {
      id: 'naive',
      kind: 'annotation',
      label: '대안: 마진 전량 수집 → 매 micro-batch O(mn) 통신',
      variant: 'annotation',
      muted: true,
    },
  ],
  edges: [
    { id: 'e-batch-req', from: 'batch', to: 'req' },
    { id: 'e-range-hist', from: 'range', to: 'hist', style: 'dashed', arrow: false },
    { id: 'e-req-hist', from: 'req', to: 'hist', label: 'bin 폭 w' },
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
