import { defineDiagram } from '@/lib/diagram';

/**
 * FP4 main KV (§2.4.4) as a structure you can count on screen.
 *
 * Row 1: one main KV entry, a 512-channel latent (FP8 in V4 → 512 bytes).
 * Row 2: cut into 32 groups of 16 channels.
 * Row 3: one group = one scale byte + sixteen 4-bit values.
 * Row 4: bytes per entry.   Row 5: bytes per token.
 * The arithmetic itself (288, 890) is an EqSteps row in the scene; the E2M1
 * grid of representable magnitudes is a Spec chip.
 */

const at = (cx: number, cy: number, w: number, h: number) => ({
  size: { w, h },
  position: { x: Math.round(cx - w / 2), y: Math.round(cy - h / 2) },
});

const GROUP_W = 150;
const GROUP_PITCH = 172;
const groupCx = (i: number) => 260 + i * GROUP_PITCH;

export const fp4KvDetail = defineDiagram({
  id: 'ds-v41-fp4-kv',
  direction: 'TB',
  nodes: [
    // ── frame-0 앵커: 항목 하나 ─────────────────────────────────────────────
    { id: 'entry', label: '캐시 항목 하나 (512채널)', title: 'main KV 항목', variant: 'proj', ...at(560, 50, 440, 72) },
    {
      id: 'fp8',
      kind: 'annotation',
      label: 'V4: 채널당 1바이트 (FP8) = 512 B',
      variant: 'annotation',
      ...at(1060, 50, 400, 56),
    },

    // ── 16채널씩 32묶음 ────────────────────────────────────────────────────
    ...[0, 1, 2, 3].map((i) => ({
      id: `g-${i}`,
      label: '16채널',
      variant: 'embed',
      ...at(groupCx(i), 160, GROUP_W, 56),
    })),
    { id: 'g-more', kind: 'annotation', label: '… 모두 32묶음', variant: 'annotation', ...at(groupCx(4) + 60, 160, 260, 56) },

    // ── 묶음 하나의 구성 ───────────────────────────────────────────────────
    { id: 'scale', kind: 'op', label: '묶음의 배율 (1바이트)', title: 'scale (E4M3)', variant: 'norm', ...at(260, 275, 300, 72) },
    { id: 'values', label: '값 16개 (각 4비트)', title: '값 (E2M1)', variant: 'expertShared', ...at(790, 275, 640, 72) },

    // ── 항목당 바이트 ──────────────────────────────────────────────────────
    { id: 'bytes', kind: 'io', label: '항목 하나: 288바이트', variant: 'io', ...at(560, 390, 620, 72) },

    // ── 토큰당 합계 ────────────────────────────────────────────────────────
    { id: 'total', kind: 'io', label: '토큰 하나: 890바이트 (indexer 키 포함)', variant: 'route', ...at(560, 510, 900, 76) },
  ],
  edges: [
    { id: 'e-entry-g-0', from: 'entry', to: 'g-0' },
    { id: 'e-entry-g-3', from: 'entry', to: 'g-3' },
    { id: 'e-g-0-scale', from: 'g-0', to: 'scale' },
    { id: 'e-g-0-values', from: 'g-0', to: 'values' },
    { id: 'e-values-bytes', from: 'values', to: 'bytes' },
    { id: 'e-bytes-total', from: 'bytes', to: 'total', label: '저장하는 층 4개' },
  ],
});

/** reveal bundles — entry와 fp8 주석은 어떤 번들에도 없다 (frame-0 앵커) */
export const fp4Ids = {
  groups: ['g-0', 'g-1', 'g-2', 'g-3', 'g-more', 'e-entry-g-0', 'e-entry-g-3'],
  code: ['scale', 'values', 'e-g-0-scale', 'e-g-0-values'],
  bytes: ['bytes', 'e-values-bytes'],
  total: ['total', 'e-bytes-total'],
};
