import { defineDiagram } from '@/lib/diagram';

/**
 * §5.2.1 — MoonEP, the expert-parallel scheme behind 3T-class pre-training.
 *
 * Conventional EP dispatches whatever the router produced, so ranks receive
 * different token counts (stragglers) and different shapes every layer (memory
 * fragmentation + a host↔device sync before every MoE launch). MoonEP plans
 * *redundant expert replicas* from the current micro-batch's router output and
 * prefetches them, so every rank ends up with exactly S×K tokens. Perfect
 * balance is what unlocks the rest: static shapes, sync-free launches, a
 * fixed-size S×K communication buffer, and a fused zero-copy permute.
 *
 * Appendix E: at most E/R redundant experts per rank always suffice, and the
 * bound is essentially tight (⌈E(R−1)/R²⌉), so reserving E/R slots means the
 * planner can never fail — training is never interrupted for infeasibility.
 */
export const moonEpDetail = defineDiagram({
  id: 'moon-ep',
  direction: 'TB',
  layout: { rankGap: 56, nodeGap: 40 },
  nodes: [
    {
      id: 'router',
      kind: 'io',
      label: '라우터 출력 · 이번 micro-batch, 이번 layer',
      variant: 'route',
    },
    {
      id: 'skew',
      kind: 'op',
      label: '랭크별 토큰 수가 제각각',
      variant: 'op',
      shape: 'bars',
      size: { w: 230, h: 84 },
    },
    {
      id: 'ilp',
      kind: 'annotation',
      label: '오프라인 ILP 최적해 = 기준선',
      variant: 'annotation',
    },
    {
      id: 'plan',
      label: 'GPU 온라인 계획 커널',
      variant: 'attention',
      tex: '\\min_P \\max_r m_r(P)',
    },
    {
      id: 'bound',
      kind: 'annotation',
      label: '항상 실현 가능 (Thm. 1)',
      variant: 'annotation',
      tex: 'M(I) \\le E/R',
    },
    {
      id: 'tight',
      kind: 'annotation',
      label: '그리고 이보다 크게 줄일 수 없다 (Thm. 2)',
      variant: 'annotation',
      tex: '\\max_I M(I) \\ge \\lceil E(R-1)/R^2 \\rceil',
    },
    {
      id: 'redundant',
      label: '중복 전문가 복제 · prefetch',
      variant: 'expertRouted',
      tex: 'E/R\\ \\mathrm{slots/rank}',
    },
    {
      id: 'permute',
      kind: 'op',
      label: 'fused permute · 목적지 사전 계산',
      variant: 'proj',
    },
    {
      id: 'balanced',
      kind: 'io',
      label: '모든 랭크가 정확히 같은 양',
      variant: 'ffn',
      shape: 'bars',
      tex: 'S \\times K',
      size: { w: 250, h: 92 },
    },
    {
      id: 'static',
      kind: 'annotation',
      label: '정적 shape → layer마다의 host sync 제거',
      variant: 'annotation',
    },
    {
      id: 'buffer',
      kind: 'annotation',
      label: '통신 버퍼 S×K 고정 (DeepEP는 최악 S×K×R)',
      variant: 'annotation',
    },
    {
      id: 'gemm',
      label: 'routed expert GEMM · workload-aware 스케줄',
      variant: 'expertRouted',
    },
    {
      id: 'shared',
      label: 'shared expert · 별도 스트림',
      variant: 'expertShared',
    },
    {
      id: 'combine',
      kind: 'op',
      label: 'unpermute / combine',
      variant: 'proj',
    },
    {
      id: 'stage',
      kind: 'op',
      label: 'backward: 복제본 grad → local reduce buffer',
      variant: 'norm',
    },
    {
      id: 'home',
      kind: 'io',
      label: 'home rank의 gradient buffer로 reduce',
      variant: 'io',
    },
  ],
  edges: [
    { id: 'e-router-skew', from: 'router', to: 'skew' },
    { id: 'e-skew-plan', from: 'skew', to: 'plan' },
    { id: 'e-ilp-plan', from: 'ilp', to: 'plan', style: 'dotted', arrow: false },
    { id: 'e-plan-bound', from: 'plan', to: 'bound', style: 'dotted', arrow: false },
    { id: 'e-bound-tight', from: 'bound', to: 'tight', style: 'dotted', arrow: false },
    { id: 'e-plan-redundant', from: 'plan', to: 'redundant', label: '계획 + prefetch' },
    { id: 'e-redundant-permute', from: 'redundant', to: 'permute' },
    { id: 'e-plan-permute', from: 'plan', to: 'permute', style: 'dashed', label: '토큰별 목적지' },
    { id: 'e-permute-balanced', from: 'permute', to: 'balanced', label: 'zero-copy all-to-all' },
    { id: 'e-balanced-static', from: 'balanced', to: 'static', style: 'dotted', arrow: false },
    { id: 'e-balanced-buffer', from: 'balanced', to: 'buffer', style: 'dotted', arrow: false },
    { id: 'e-balanced-gemm', from: 'balanced', to: 'gemm' },
    { id: 'e-shared-gemm', from: 'shared', to: 'gemm', style: 'dashed', arrow: false, label: '겹쳐 실행' },
    { id: 'e-gemm-combine', from: 'gemm', to: 'combine' },
    { id: 'e-combine-stage', from: 'combine', to: 'stage', style: 'dashed' },
    { id: 'e-stage-home', from: 'stage', to: 'home' },
  ],
});
