import { defineDiagram } from '@/lib/diagram';

/**
 * Causal Encoder-Decoder (§2.2), drawn as the prefill path of one prompt.
 *
 * Left column: the 40-layer stack cut in half. Right column: where decoder
 * global KV comes from under CED, i.e. a per-layer projection of the encoder's
 * last hidden state instead of each decoder layer's own hidden state.
 * The dashed rail on the far left is the baseline (all N tokens through all
 * 40 layers); the "last 128 tokens" node is what replaces it.
 * The projection formula and the cost formula are EqSteps in the scene.
 */

const at = (cx: number, cy: number, w: number, h: number) => ({
  size: { w, h },
  position: { x: Math.round(cx - w / 2), y: Math.round(cy - h / 2) },
});

const MAIN = 360;
const SIDE = 820;

export const cedDetail = defineDiagram({
  id: 'ds-v41-ced',
  direction: 'TB',
  nodes: [
    // ── frame-0 앵커: 40층 스택 ────────────────────────────────────────────
    { id: 'prompt', kind: 'io', label: '프롬프트 (N 토큰)', variant: 'io', ...at(MAIN, 50, 340, 68) },
    {
      id: 'enc',
      label: 'Encoder: 1–20층',
      title: 'Causal Encoder',
      variant: 'attention',
      ...at(MAIN, 190, 360, 84),
    },
    {
      id: 'dec',
      label: 'Decoder: 21–40층',
      title: 'Decoder',
      variant: 'attention',
      ...at(MAIN, 640, 360, 84),
    },
    { id: 'next', kind: 'io', label: '다음 토큰', variant: 'io', ...at(MAIN, 780, 260, 64) },

    // ── 기준선: 보통은 모든 토큰이 위층까지 전부 ──────────────────────────
    {
      id: 'baseline',
      kind: 'annotation',
      label: '보통은 모든 토큰이 40층을 다 지난다',
      variant: 'annotation',
      ...at(30, 415, 200, 120),
    },

    // ── CED: 디코더 전역 KV의 출처 ─────────────────────────────────────────
    { id: 'h-enc', kind: 'op', label: '인코더 출력', title: '인코더 마지막 출력', variant: 'op', shape: 'pill', ...at(MAIN, 330, 220, 64) },
    { id: 'enc-kv', kind: 'io', label: '인코더 전역 KV', variant: 'io', ...at(SIDE, 190, 320, 68) },
    {
      id: 'proj',
      label: '층마다 행렬 하나를 곱한다',
      title: '디코더 KV 투영',
      variant: 'proj',
      ...at(SIDE, 330, 360, 80),
    },
    { id: 'dec-kv', kind: 'io', label: '디코더 전역 KV', variant: 'io', ...at(SIDE, 480, 320, 68) },

    // ── 남는 문제: 디코더 SWA KV ───────────────────────────────────────────
    { id: 'tail', label: '마지막 128 토큰만 디코더로', title: '디코더 SWA 재생', variant: 'embed', ...at(MAIN, 480, 340, 72) },
    {
      id: 'prefill-end',
      kind: 'annotation',
      label: '나머지 토큰의 prefill은 인코더에서 끝난다',
      variant: 'annotation',
      ...at(SIDE, 640, 380, 90),
    },
  ],
  edges: [
    { id: 'e-prompt-enc', from: 'prompt', to: 'enc' },
    {
      id: 'e-enc-dec',
      from: 'enc',
      to: 'dec',
      style: 'dashed',
      waypoints: [
        { x: 160, y: 190 },
        { x: 160, y: 640 },
      ],
    },
    { id: 'e-dec-next', from: 'dec', to: 'next' },
    { id: 'e-enc-enc-kv', from: 'enc', to: 'enc-kv' },
    { id: 'e-enc-h-enc', from: 'enc', to: 'h-enc' },
    { id: 'e-h-enc-proj', from: 'h-enc', to: 'proj' },
    { id: 'e-proj-dec-kv', from: 'proj', to: 'dec-kv' },
    { id: 'e-h-enc-tail', from: 'h-enc', to: 'tail' },
    { id: 'e-tail-dec', from: 'tail', to: 'dec', label: 'SWA KV를 만든다' },
    {
      id: 'e-dec-kv-dec',
      from: 'dec-kv',
      to: 'dec',
      style: 'dashed',
      label: '디코더가 읽는다',
      waypoints: [{ x: SIDE - 120, y: 560 }, { x: MAIN + 120, y: 560 }],
    },
  ],
});

/** reveal bundles — prompt/enc/dec/next와 기준선 레일은 frame-0 앵커 */
export const cedIds = {
  baseline: ['baseline'],
  project: ['h-enc', 'enc-kv', 'proj', 'dec-kv', 'e-enc-enc-kv', 'e-enc-h-enc', 'e-h-enc-proj', 'e-proj-dec-kv'],
  half: ['prefill-end', 'e-dec-kv-dec'],
  swa: ['tail', 'e-h-enc-tail', 'e-tail-dec'],
};
