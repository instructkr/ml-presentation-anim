import type { Detail, WeekManifest } from '@/lib/explorer/types';
import { k3InfraIndex } from './diagrams/k3-infra-index.diagram';
import { qbDualScene } from './scenes/01-qb-dual';
import { qbHistogramScene } from './scenes/02-qb-histogram';
import { moonEpScene } from './scenes/03-moon-ep';
import { kdaPrefixCacheScene } from './scenes/04-kda-prefix-cache';
import { sglangRadixScene } from './scenes/05-sglang-radix';
import { presenterNotes } from './notes';

/**
 * Kimi K3 심화 — the five explanations the architecture week has no node for.
 *
 * Deliberately a separate week rather than extra tabs on `2026-08-12-kimi-k3`:
 * every topic here is self-contained, so each gets its own home-screen block,
 * its own breadcrumb and its own overview card, and any one of them can be
 * opened and discussed without the rest.
 */
const qbDual: Detail = { kind: 'scene', scene: qbDualScene };
const qbHistogram: Detail = { kind: 'scene', scene: qbHistogramScene };
const moonEp: Detail = { kind: 'scene', scene: moonEpScene };
const prefixCache: Detail = { kind: 'scene', scene: kdaPrefixCacheScene };
const sglangRadix: Detail = { kind: 'scene', scene: sglangRadixScene };

export const week20260812Infra: WeekManifest = {
  id: '2026-08-12-kimi-k3-infra',
  title: 'Kimi K3 심화 — QB · MoonEP · 캐시',
  explorable: {
    root: k3InfraIndex,
    details: {
      'qb-dual': qbDual,
      'qb-histogram': qbHistogram,
      'moon-ep': moonEp,
      'prefix-cache': prefixCache,
      'sglang-radix': sglangRadix,
    },
    // 한 편씩 떼어 다뤄도 되고, N/P로 이 순서대로 훑어도 된다
    path: ['qb-dual', 'qb-histogram', 'moon-ep', 'prefix-cache', 'sglang-radix'],
  },
  notes: presenterNotes,
  scenes: [qbDualScene, qbHistogramScene, moonEpScene, kdaPrefixCacheScene, sglangRadixScene],
};
