import { defineDiagram } from '@/lib/diagram';

/**
 * Home screen of the K3 심화 deck — an index, not an architecture.
 *
 * The main K3 week reconstructs Fig. 2 and stops where the paper's body stops.
 * Everything here lives in the parts that figure has no room for: the routing
 * story from the problem statement through both appendices, the EP scheme that
 * makes 896 experts trainable, and the serving-side cache that makes a hybrid
 * model's prefixes reusable.
 *
 * The routing block is six scenes rather than two on purpose. §2.3.3 and
 * Appendix C are both written from the middle of an argument — they assume the
 * load of an expert, the additive bias, the fixed-step rule and the word
 * "quantile" are all already understood — so this row starts one step before
 * the paper does, defines the vocabulary, and then does the derivation one
 * move at a time instead of naming it.
 */

/** place a node by its centre */
const at = (cx: number, cy: number, w: number, h: number) => ({
  size: { w, h },
  position: { x: Math.round(cx - w / 2), y: Math.round(cy - h / 2) },
});

export const k3InfraIndex = defineDiagram({
  id: 'k3-infra-index',
  direction: 'TB',
  groups: [
    {
      id: 'routing',
      label: '라우팅과 부하 균형   §2.3.3 · 부록 C · 부록 D',
      rect: { x: 60, y: 90, w: 1440, h: 440 },
    },
    {
      id: 'training',
      label: '학습 인프라   §5.2.1 · 부록 E',
      rect: { x: 60, y: 580, w: 620, h: 240 },
    },
    {
      id: 'serving',
      label: '서빙 인프라 · 프리픽스 캐시   §5.4.1',
      rect: { x: 720, y: 580, w: 780, h: 240 },
    },
  ],
  nodes: [
    {
      id: 'title',
      kind: 'annotation',
      label: 'Kimi K3 — 본편에서 접고 지나간 열한 편',
      variant: 'annotation',
      ...at(780, 42, 900, 48),
    },

    {
      id: 'qb-problem',
      label: '① 부하가 쏠린다는 문제',
      title: '① 문제 — 부하와 bias',
      variant: 'route',
      tex: '\\ell_j \\ne q',
      parent: 'routing',
      ...at(313, 225, 430, 130),
    },
    {
      id: 'qb-quantile',
      label: '② 분위수란 무엇인가',
      title: '② 도구 — 분위수의 정의',
      variant: 'route',
      tex: '\\mathrm{quantile}_{1-k/n}',
      parent: 'routing',
      ...at(780, 225, 430, 130),
    },
    {
      id: 'qb-dual',
      label: '③ 제약에 값을 매긴다',
      title: '③ 유도 — 임계 규칙이 나온다',
      variant: 'route',
      tex: 's_{ij} - \\alpha_i - \\beta_j > 0',
      parent: 'routing',
      ...at(1248, 225, 430, 130),
    },
    {
      id: 'qb-minimise',
      label: '④ 분위수가 나오는 계산',
      title: '④ 유도 — 최소점이 k+1번째',
      variant: 'route',
      tex: 'f\'(\\alpha) = k - \\#\\{ m > \\alpha \\}',
      parent: 'routing',
      ...at(313, 395, 430, 130),
    },
    {
      id: 'qb-jump',
      label: '⑤ 고정 스텝과의 관계',
      title: '⑤ 정리 — SignSGD와 배포',
      variant: 'route',
      tex: 'b = -\\beta',
      parent: 'routing',
      ...at(780, 395, 430, 130),
    },
    {
      id: 'qb-histogram',
      label: '⑥ 실제로 계산하는 법',
      title: '⑥ 구현 — 부록 D 히스토그램',
      variant: 'route',
      tex: 'H \\in \\mathbb{N}^{n \\times B}',
      parent: 'routing',
      ...at(1248, 395, 430, 130),
    },

    {
      id: 'ep-dispatch',
      label: '⑦ 왜 복사가 균형이 되나',
      title: '⑦ 토큰은 어디서 계산되나',
      variant: 'route',
      tex: '90 \\rightarrow 50{+}20{+}20',
      parent: 'training',
      ...at(203, 715, 280, 130),
    },
    {
      id: 'moon-ep',
      label: '⑧ MoonEP — 비워 둔 자리',
      title: 'MoonEP — 비워 둔 자리',
      variant: 'expertRouted',
      tex: 'E/R\\ \\text{slots}',
      parent: 'training',
      ...at(537, 715, 280, 130),
    },

    {
      id: 'block-hash',
      label: '블록 해시 캐시 기본기',
      title: '프리픽스 캐시는 원래 어떻게 동작하나',
      variant: 'embed',
      tex: '\\text{hash} = \\text{block}',
      parent: 'serving',
      ...at(858, 715, 230, 130),
    },
    {
      id: 'prefix-cache',
      label: 'K3 — 세 단위를 분리한다',
      title: 'KDA Prefix Cache — Fig. 12',
      variant: 'attention',
      tex: '512 \\;\\ne\\; 6144',
      parent: 'serving',
      ...at(1110, 715, 230, 130),
    },
    {
      id: 'sglang-radix',
      label: 'SGLang Radix Cache',
      title: 'SGLang RadixAttention — 비교군',
      variant: 'ffn',
      tex: '\\mathtt{match\\_prefix}',
      parent: 'serving',
      ...at(1363, 715, 230, 130),
    },
  ],
  edges: [
    { id: 'e-qb-problem-qb-quantile', from: 'qb-problem', to: 'qb-quantile', style: 'dashed' },
    { id: 'e-qb-quantile-qb-dual', from: 'qb-quantile', to: 'qb-dual', style: 'dashed' },
    { id: 'e-qb-minimise-qb-jump', from: 'qb-minimise', to: 'qb-jump', style: 'dashed' },
    { id: 'e-qb-jump-qb-histogram', from: 'qb-jump', to: 'qb-histogram', style: 'dashed' },
    { id: 'e-ep-dispatch-moon-ep', from: 'ep-dispatch', to: 'moon-ep', style: 'dashed' },
    { id: 'e-block-hash-prefix-cache', from: 'block-hash', to: 'prefix-cache', style: 'dashed' },
    { id: 'e-prefix-cache-sglang-radix', from: 'prefix-cache', to: 'sglang-radix', label: '비교', style: 'dashed' },
  ],
});
