import { defineDiagram } from '@/lib/diagram';

/**
 * SWA Bounded Replay (§3.2) in three panels.
 *
 * Top-left:  V4's persistent cache (SSD) holds global KV and SWA KV side by side.
 * Bottom:    what it costs to rebuild SWA KV once it is dropped. Exact
 *            reconstruction widens by one window per layer (a cone, L × 128);
 *            bounded replay re-runs the last 128 tokens in every layer.
 * Top-right: V4.1's split. SSD keeps global KV only; SWA KV goes to a
 *            minutes-TTL host DRAM pool.
 *
 * Bars are drawn to scale in token units: one window = WIN diagram units,
 * right-aligned at the prompt end, three layers shown. The 1/2 × 1/4 = 1/8
 * arithmetic is an EqSteps row in the scene.
 */

const at = (cx: number, cy: number, w: number, h: number) => ({
  size: { w, h },
  position: { x: Math.round(cx - w / 2), y: Math.round(cy - h / 2) },
});

/** place by right edge so every bar ends at the prompt end */
const bar = (right: number, cy: number, w: number, h: number) => ({
  size: { w, h },
  position: { x: right - w, y: Math.round(cy - h / 2) },
});

const WIN = 190;
const BAR_H = 52;
const ROW_Y = [370, 440, 510] as const;
const EXACT_END = 820;
const BOUNDED_END = 1500;

export const swaReplayDetail = defineDiagram({
  id: 'ds-v41-swa-replay',
  direction: 'LR',
  groups: [
    { id: 'v4', label: 'V4 영구 캐시 (SSD)', rect: { x: 20, y: 0, w: 620, h: 190 } },
    { id: 'v41', label: 'V4.1: 둘을 떼어 놓는다', rect: { x: 900, y: 0, w: 620, h: 190 } },
    { id: 'exact', label: '정확히 되살리려면', rect: { x: 20, y: 290, w: 820, h: 260 } },
    { id: 'bounded', label: 'Bounded Replay: 마지막 128만', rect: { x: 1060, y: 290, w: 460, h: 260 } },
  ],
  nodes: [
    // ── frame-0 앵커: V4 영구 캐시 ─────────────────────────────────────────
    { id: 'v4-global', label: '전역 KV', variant: 'proj', parent: 'v4', ...at(180, 110, 260, 80) },
    { id: 'v4-swa', label: 'SWA KV: 절반 차지', variant: 'norm', parent: 'v4', ...at(490, 110, 290, 80) },

    // ── 정확한 복원: 층마다 창 하나씩 넓어진다 ────────────────────────────
    { id: 'x-l3', label: '3층: 128', variant: 'norm', parent: 'exact', ...bar(EXACT_END, ROW_Y[0], WIN, BAR_H) },
    { id: 'x-l2', label: '2층: 256', variant: 'norm', parent: 'exact', ...bar(EXACT_END, ROW_Y[1], WIN * 2, BAR_H) },
    { id: 'x-l1', label: '1층: 384 토큰', variant: 'norm', parent: 'exact', ...bar(EXACT_END, ROW_Y[2], WIN * 3, BAR_H) },

    // ── Bounded Replay: 모든 층이 마지막 128 토큰만 ────────────────────────
    { id: 'b-l3', label: '128', variant: 'expertShared', parent: 'bounded', ...bar(BOUNDED_END, ROW_Y[0], WIN, BAR_H) },
    { id: 'b-l2', label: '128', variant: 'expertShared', parent: 'bounded', ...bar(BOUNDED_END, ROW_Y[1], WIN, BAR_H) },
    { id: 'b-l1', label: '128', variant: 'expertShared', parent: 'bounded', ...bar(BOUNDED_END, ROW_Y[2], WIN, BAR_H) },
    {
      id: 'approx',
      kind: 'annotation',
      label: '창을 잘라 근사한다',
      variant: 'annotation',
      ...at(1180, 440, 210, 110),
    },

    // ── V4.1의 분리 ────────────────────────────────────────────────────────
    { id: 'ssd-global', label: 'SSD: 전역 KV (72시간+)', variant: 'proj', parent: 'v41', ...at(1055, 110, 290, 80) },
    { id: 'dram-swa', label: 'DRAM: SWA KV (몇 분)', variant: 'norm', parent: 'v41', ...at(1365, 110, 290, 80) },
  ],
  edges: [
    { id: 'e-v4-v41', from: 'v4', to: 'v41', label: '영구 캐시 1/8' },
    { id: 'e-x-l3-x-l2', from: 'x-l3', to: 'x-l2', style: 'dotted', arrow: false },
    { id: 'e-x-l2-x-l1', from: 'x-l2', to: 'x-l1', style: 'dotted', arrow: false },
    { id: 'e-exact-bounded', from: 'exact', to: 'bounded', label: '층 수 × 128 → 128' },
  ],
});

/** reveal bundles — V4 그룹과 두 블록은 어떤 번들에도 없다 (frame-0 앵커) */
export const swaReplayIds = {
  exact: ['exact', 'x-l3', 'x-l2', 'x-l1', 'e-x-l3-x-l2', 'e-x-l2-x-l1'],
  bounded: ['bounded', 'b-l3', 'b-l2', 'b-l1', 'approx', 'e-exact-bounded'],
  split: ['v41', 'ssd-global', 'dram-swa', 'e-v4-v41'],
};
