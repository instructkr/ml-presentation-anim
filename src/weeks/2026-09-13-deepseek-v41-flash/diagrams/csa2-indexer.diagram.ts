import { defineDiagram } from '@/lib/diagram';

/**
 * One Full-mode CSA2 layer, query token t (V4 report eq. 13–18, V4.1 §2.3, §4.2.1).
 *
 *   h_t ─W^{DQ}→ c^Q (shared latent) ─W^{IUQ}→ indexer Q
 *                                     └W^{UQ}→ main Q
 *   h_t ─W^{w}→ head weights w
 *   cache entry C^comp_s ─W^{IK}→ indexer K_s          ← CSA2: projected from main KV
 *   score(t, s) → Top-512 → gather → ⊕ SWA KV → Core Attention
 *
 * Nodes carry only what each quantity *is*; the projection glyphs keep their
 * matrix names because the EqSteps in the scene use the same symbols. Every
 * dimension is a Spec chip in the scene.
 */

const at = (cx: number, cy: number, w: number, h: number) => ({
  size: { w, h },
  position: { x: Math.round(cx - w / 2), y: Math.round(cy - h / 2) },
});

const Y_W = 50;
const Y_Q = 170;
const Y_K = 370;
const Y_MAIN = 520;
const SCORE_X = 1520;
const SWA_X = 1910;

export const csa2IndexerDetail = defineDiagram({
  id: 'ds-v41-csa2-indexer',
  direction: 'LR',
  nodes: [
    // ── frame-0 앵커: 지금 토큰과 캐시 항목 ────────────────────────────────
    { id: 'ht', kind: 'io', label: '지금 토큰', title: '쿼리 토큰 hₜ', variant: 'io', ...at(130, Y_Q, 220, 72) },
    { id: 'entries', kind: 'io', label: '캐시 항목 (압축 KV)', title: '압축 main KV 항목', variant: 'io', ...at(130, Y_K, 240, 72) },

    // ── 저랭크 쿼리 경로 ───────────────────────────────────────────────────
    { id: 'dq', label: 'W^{DQ}', title: '쿼리 줄이기 (down-projection)', math: true, variant: 'proj', shape: 'trapDown', ...at(380, Y_Q, 150, 84) },
    { id: 'cq', kind: 'op', label: '잠재 쿼리 (공유)', title: '쿼리 잠재 벡터 c^Q', variant: 'op', ...at(610, Y_Q, 250, 72) },
    { id: 'uq', label: 'W^{UQ}', title: '본 쿼리 만들기 (up-projection)', math: true, variant: 'proj', shape: 'trapUp', ...at(850, Y_MAIN, 150, 84) },
    { id: 'qmain', kind: 'op', label: '본 쿼리', title: '본 어텐션 쿼리', variant: 'attention', ...at(1080, Y_MAIN, 220, 72) },

    // ── indexer 쿼리와 헤드 가중치 ─────────────────────────────────────────
    { id: 'iuq', label: 'W^{IUQ}', title: 'indexer 쿼리 만들기', math: true, variant: 'proj', shape: 'trapUp', ...at(850, Y_Q, 150, 84) },
    { id: 'qi', kind: 'op', label: 'indexer 쿼리', title: 'indexer Q', variant: 'route', ...at(1080, Y_Q, 240, 72) },
    { id: 'ww', label: 'W^{w}', title: '헤드 가중치 만들기', math: true, variant: 'proj', ...at(380, Y_W, 120, 64) },
    { id: 'w', kind: 'op', label: '헤드 가중치', title: '헤드 가중치 w', variant: 'route', ...at(1080, Y_W, 240, 64) },

    // ── indexer 키: CSA2는 캐시 항목에서 투영 ──────────────────────────────
    { id: 'ik', label: 'W^{IK}', title: 'indexer 키 만들기', math: true, variant: 'proj', shape: 'trapDown', ...at(380, Y_K, 130, 84) },
    { id: 'ki', kind: 'op', label: 'indexer 키', title: 'indexer K', variant: 'route', ...at(560, Y_K, 200, 72) },

    // ── 점수와 선택 ────────────────────────────────────────────────────────
    { id: 'score', label: '점수: 항목마다 하나', title: 'Index score', variant: 'route', ...at(SCORE_X, Y_Q, 400, 72) },
    { id: 'topk', kind: 'op', label: 'Top-512', variant: 'route', shape: 'pill', ...at(SCORE_X, 280, 200, 60) },
    { id: 'gather', kind: 'io', label: '고른 항목 512개', variant: 'proj', ...at(SCORE_X, Y_K + 20, 320, 68) },

    // ── 본 어텐션 ──────────────────────────────────────────────────────────
    { id: 'swa', kind: 'io', label: 'SWA KV (최근 128)', variant: 'norm', ...at(SWA_X, Y_MAIN, 260, 68) },
    { id: 'core', label: 'Core Attention', title: 'Core Attention (MQA)', variant: 'attention', ...at(SCORE_X, Y_MAIN, 300, 72) },
  ],
  edges: [
    // 저랭크 쿼리
    { id: 'e-ht-dq', from: 'ht', to: 'dq' },
    { id: 'e-dq-cq', from: 'dq', to: 'cq' },
    { id: 'e-cq-uq', from: 'cq', to: 'uq', waypoints: [{ x: 700, y: Y_MAIN }] },
    { id: 'e-uq-qmain', from: 'uq', to: 'qmain' },
    // indexer 쿼리·가중치
    { id: 'e-cq-iuq', from: 'cq', to: 'iuq' },
    { id: 'e-iuq-qi', from: 'iuq', to: 'qi' },
    { id: 'e-ht-ww', from: 'ht', to: 'ww', waypoints: [{ x: 130, y: Y_W }] },
    { id: 'e-ww-w', from: 'ww', to: 'w' },
    // indexer 키
    { id: 'e-entries-ik', from: 'entries', to: 'ik' },
    { id: 'e-ik-ki', from: 'ik', to: 'ki' },
    // 점수
    { id: 'e-qi-score', from: 'qi', to: 'score' },
    { id: 'e-w-score', from: 'w', to: 'score', waypoints: [{ x: SCORE_X, y: Y_W }] },
    {
      id: 'e-ki-score',
      from: 'ki',
      to: 'score',
      waypoints: [
        { x: 1270, y: Y_K },
        { x: 1270, y: Y_Q + 22 },
      ],
    },
    { id: 'e-score-topk', from: 'score', to: 'topk' },
    { id: 'e-topk-gather', from: 'topk', to: 'gather' },
    {
      id: 'e-entries-gather',
      from: 'entries',
      to: 'gather',
      style: 'dashed',
      label: '고른 번호의 항목만 꺼낸다',
      labelPos: 0.7,
      waypoints: [
        { x: 130, y: 450 },
        { x: SCORE_X, y: 450 },
      ],
    },
    // 본 어텐션
    { id: 'e-gather-core', from: 'gather', to: 'core' },
    { id: 'e-swa-core', from: 'swa', to: 'core' },
    { id: 'e-qmain-core', from: 'qmain', to: 'core' },
  ],
});

/** reveal bundles — ht와 entries는 어떤 번들에도 없다 (frame-0 앵커) */
export const csa2IndexerIds = {
  lowrank: ['dq', 'cq', 'uq', 'qmain', 'e-ht-dq', 'e-dq-cq', 'e-cq-uq', 'e-uq-qmain'],
  iq: ['iuq', 'qi', 'ww', 'w', 'e-cq-iuq', 'e-iuq-qi', 'e-ht-ww', 'e-ww-w'],
  ik: ['ik', 'ki', 'e-entries-ik', 'e-ik-ki'],
  score: ['score', 'e-qi-score', 'e-w-score', 'e-ki-score'],
  topk: ['topk', 'gather', 'e-score-topk', 'e-topk-gather', 'e-entries-gather'],
  attend: ['swa', 'core', 'e-gather-core', 'e-swa-core', 'e-qmain-core'],
};
