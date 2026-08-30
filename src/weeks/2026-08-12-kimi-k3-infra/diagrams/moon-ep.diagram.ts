import { defineDiagram } from '@/lib/diagram';

/**
 * §5.2.1 + Appendix E — MoonEP, read as a story about *weights*, not routing.
 *
 * The framing this figure commits to: the router's output is never touched.
 * A rank that was handed too many tokens cannot push them to a neighbour,
 * because the neighbour does not hold that expert; and rewriting the routing
 * would change what the model computes. The only remaining lever is to copy the
 * expert's weights to wherever the tokens already are — so every rank keeps a
 * reserved, deliberately empty region of expert slots (the weight buffer) that
 * a planning kernel fills, per micro-batch and per layer, with replicas of
 * whatever experts are currently hot. Appendix E is then the sizing question
 * for that region: E/R slots always suffice, and no general bound is much
 * smaller — which is also, since a rank already holds E/R local experts, a
 * standing 2× reservation of expert-weight memory.
 *
 * Hand-positioned (every node carries `position`), so edges may use waypoints
 * and terminate on the group box. Left column = the argument, right column =
 * the rank's memory and what lands in it. Canvas ≈ 1134 × 872.
 */

/** place a node by its centre */
const at = (cx: number, cy: number, w: number, h: number) => ({
  size: { w, h },
  position: { x: Math.round(cx - w / 2), y: Math.round(cy - h / 2) },
});

export const moonEpDetail = defineDiagram({
  id: 'moon-ep',
  direction: 'TB',
  groups: [
    {
      id: 'rank',
      label: 'EP 랭크 하나의 전문가 자리',
      rect: { x: 600, y: 110, w: 470, h: 350 },
    },
  ],
  nodes: [
    {
      id: 'router',
      kind: 'io',
      label: '이번 micro-batch, 이번 layer의 라우터 출력',
      variant: 'route',
      ...at(565, 36, 680, 64),
    },

    // ── 왼쪽: 왜 가중치를 복사하는가 ─────────────────────────────────────────
    {
      id: 'skew',
      kind: 'op',
      label: '랭크마다 받는 토큰 수가 다르다',
      variant: 'op',
      ...at(270, 150, 400, 84),
    },
    {
      id: 'noreroute',
      kind: 'annotation',
      label: '옆 랭크로 넘길 수 없다',
      variant: 'annotation',
      ...at(270, 265, 440, 62),
    },
    {
      id: 'copy',
      label: '전문가 가중치를 복사한다',
      title: '균형을 맞추는 유일한 수단',
      variant: 'proj',
      ...at(270, 405, 420, 116),
    },
    {
      id: 'plan',
      label: 'micro-batch·layer마다 도는 계획 커널',
      title: 'GPU 온라인 계획 커널',
      variant: 'norm',
      tex: '\\min_P \\max_r m_r(P)',
      ...at(270, 590, 480, 136),
    },
    {
      id: 'backward',
      label: '기울기는 주인 랭크로 되돌린다',
      variant: 'norm',
      ...at(270, 790, 460, 104),
    },

    // ── 오른쪽: 랭크 한 대의 전문가 메모리 ──────────────────────────────────
    {
      id: 'local',
      label: '이 랭크가 원래 들고 있는 전문가',
      title: '로컬 전문가',
      variant: 'expertRouted',
      parent: 'rank',
      tex: 'E/R',
      ...at(835, 228, 400, 110),
    },
    {
      id: 'buffer',
      label: '비워 둔 자리 (weight buffer)',
      title: 'weight buffer',
      variant: 'attention',
      parent: 'rank',
      tex: 'E/R\\ \\mathrm{slots}',
      ...at(835, 364, 400, 118),
    },
    {
      id: 'bound',
      kind: 'annotation',
      label: 'E/R칸이면 계획은 절대 실패하지 않는다 (정리 1·2)',
      variant: 'annotation',
      tex: 'M(I) \\le E/R',
      ...at(835, 505, 500, 96),
    },
    {
      id: 'prefetch',
      kind: 'op',
      label: '계산 직전에 가중치를 복사해 넣는다 (prefetch)',
      variant: 'op',
      ...at(835, 645, 460, 110),
    },
    {
      id: 'balanced',
      label: '모든 랭크가 정확히 같은 양을 계산한다',
      variant: 'expertShared',
      tex: 'S \\times K',
      ...at(835, 790, 420, 116),
    },
  ],
  edges: [
    { id: 'e-router-skew', from: 'router', to: 'skew', waypoints: [{ x: 565, y: 88 }, { x: 270, y: 88 }] },
    { id: 'e-router-rank', from: 'router', to: 'rank', waypoints: [{ x: 835, y: 88 }] },

    { id: 'e-skew-noreroute', from: 'skew', to: 'noreroute', style: 'dotted', arrow: false },
    { id: 'e-noreroute-copy', from: 'noreroute', to: 'copy', label: '그래서' },
    { id: 'e-copy-plan', from: 'copy', to: 'plan', label: '무엇을 어디로?' },
    {
      id: 'e-plan-prefetch',
      from: 'plan',
      to: 'prefetch',
      waypoints: [{ x: 545, y: 620 }],
    },
    {
      id: 'e-prefetch-buffer',
      from: 'prefetch',
      to: 'buffer',
      color: 'accent',
      waypoints: [
        { x: 1110, y: 645 },
        { x: 1110, y: 364 },
      ],
    },
    { id: 'e-buffer-bound', from: 'buffer', to: 'bound', style: 'dotted', arrow: false },
    { id: 'e-prefetch-balanced', from: 'prefetch', to: 'balanced' },
    {
      id: 'e-balanced-backward',
      from: 'balanced',
      to: 'backward',
      style: 'dashed',
      waypoints: [{ x: 560, y: 790 }],
    },
  ],
});
