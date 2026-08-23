import { defineDiagram } from '@/lib/diagram';

/**
 * Home screen of the K3 심화 deck — an index, not an architecture.
 *
 * The main K3 week reconstructs Fig. 2 and stops where the paper's body stops.
 * Everything here lives in the parts that figure has no room for: the appendix
 * derivations behind Quantile Balancing, the EP scheme that makes 896 experts
 * trainable, and the serving-side cache that makes a hybrid model's prefixes
 * reusable. Each block opens exactly one scene, so any of the five can be
 * presented on its own.
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
      label: '라우팅 · 부하 균형   §2.3.3 · 부록 C · 부록 D',
      rect: { x: 60, y: 90, w: 700, h: 300 },
    },
    {
      id: 'training',
      label: '학습 인프라   §5.2.1 · 부록 E',
      rect: { x: 800, y: 90, w: 580, h: 300 },
    },
    {
      id: 'serving',
      label: '서빙 인프라 — 프리픽스 캐시   §5.4.1',
      rect: { x: 60, y: 440, w: 1320, h: 300 },
    },
  ],
  nodes: [
    {
      id: 'title',
      kind: 'annotation',
      label: 'Kimi K3 — 본편에서 접고 지나간 여섯 편',
      variant: 'annotation',
      ...at(720, 42, 900, 48),
    },

    {
      id: 'qb-dual',
      label: '왜 분위수인가',
      title: 'QB 유도 — 균형 배정의 쌍대',
      variant: 'route',
      tex: '\\mathrm{quantile}_{1-k/n}',
      parent: 'routing',
      ...at(215, 250, 280, 150),
    },
    {
      id: 'qb-histogram',
      label: '히스토그램 추정',
      title: 'QB 히스토그램 — 전 배치 분위수',
      variant: 'route',
      tex: 'H \\in \\mathbb{N}^{n \\times B}',
      parent: 'routing',
      ...at(605, 250, 280, 150),
    },

    {
      id: 'moon-ep',
      label: 'MoonEP — 랭크마다 정확히 S×K',
      title: 'MoonEP — 완벽 균형 EP',
      variant: 'expertRouted',
      tex: 'M(I) \\le E/R',
      parent: 'training',
      ...at(1090, 250, 480, 150),
    },

    {
      id: 'block-hash',
      label: '블록 해시 캐시 기본기',
      title: '프리픽스 캐시는 원래 어떻게 동작하나',
      variant: 'embed',
      tex: '\\text{hash} = \\text{block}',
      parent: 'serving',
      ...at(280, 600, 360, 150),
    },
    {
      id: 'prefix-cache',
      label: 'K3 — 세 단위를 분리',
      title: 'KDA Prefix Cache — Fig. 12',
      variant: 'attention',
      tex: '512 \\;\\ne\\; 6144',
      parent: 'serving',
      ...at(720, 600, 360, 150),
    },
    {
      id: 'sglang-radix',
      label: 'SGLang Radix Cache',
      title: 'SGLang RadixAttention — 비교군',
      variant: 'ffn',
      tex: '\\mathtt{match\\_prefix}',
      parent: 'serving',
      ...at(1160, 600, 360, 150),
    },
  ],
  edges: [
    { id: 'e-qb-dual-qb-histogram', from: 'qb-dual', to: 'qb-histogram', label: '그다음', style: 'dashed' },
    { id: 'e-block-hash-prefix-cache', from: 'block-hash', to: 'prefix-cache', style: 'dashed' },
    { id: 'e-prefix-cache-sglang-radix', from: 'prefix-cache', to: 'sglang-radix', label: '비교', style: 'dashed' },
  ],
});
