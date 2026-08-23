import type { Detail, WeekManifest } from '@/lib/explorer/types';
import { k3InfraIndex } from './diagrams/k3-infra-index.diagram';
import { qbDualScene } from './scenes/01-qb-dual';
import { qbHistogramScene } from './scenes/02-qb-histogram';
import { moonEpScene } from './scenes/03-moon-ep';
import { blockHashCacheScene } from './scenes/04-block-hash-cache';
import { kdaPrefixCacheScene } from './scenes/05-kda-prefix-cache';
import { sglangRadixScene } from './scenes/06-sglang-radix';
import { presenterNotes } from './notes';

/**
 * Kimi K3 심화 — the six explanations the architecture week has no node for.
 *
 * Deliberately a separate week rather than extra tabs on `2026-08-12-kimi-k3`:
 * every topic here is self-contained, so each gets its own home-screen block,
 * its own breadcrumb and its own overview card, and any one of them can be
 * opened and discussed without the rest. The only ordering that matters is
 * 04 → 05: the K3 cache is written as a modification of block-hash caching,
 * so the baseline gets a scene of its own instead of a sentence of jargon.
 */
const qbDual: Detail = { kind: 'scene', scene: qbDualScene };
const qbHistogram: Detail = { kind: 'scene', scene: qbHistogramScene };
const moonEp: Detail = { kind: 'scene', scene: moonEpScene };
const blockHash: Detail = { kind: 'scene', scene: blockHashCacheScene };
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
      'block-hash': blockHash,
      'prefix-cache': prefixCache,
      'sglang-radix': sglangRadix,
    },
    // 한 편씩 떼어 다뤄도 되고, N/P로 이 순서대로 훑어도 된다
    path: ['qb-dual', 'qb-histogram', 'moon-ep', 'block-hash', 'prefix-cache', 'sglang-radix'],
  },
  notes: presenterNotes,
  scenes: [
    qbDualScene,
    qbHistogramScene,
    moonEpScene,
    blockHashCacheScene,
    kdaPrefixCacheScene,
    sglangRadixScene,
  ],
};
