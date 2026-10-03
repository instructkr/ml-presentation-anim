import type { Detail, WeekManifest } from '@/lib/explorer/types';
import { darkDefault } from '@/lib/theme';
import { k3InfraIndex } from './diagrams/k3-infra-index.diagram';
import { qbProblemScene } from './scenes/01-qb-problem';
import { qbQuantileScene } from './scenes/02-qb-quantile';
import { qbDualScene } from './scenes/03-qb-dual';
import { qbMinimiseScene } from './scenes/04-qb-minimise';
import { qbJumpScene } from './scenes/05-qb-jump';
import { qbHistogramScene } from './scenes/06-qb-histogram';
import { epDispatchScene } from './scenes/07-ep-dispatch';
import { moonEpScene } from './scenes/08-moon-ep';
import { blockHashCacheScene } from './scenes/09-block-hash-cache';
import { kdaPrefixCacheScene } from './scenes/10-kda-prefix-cache';
import { sglangRadixScene } from './scenes/11-sglang-radix';
import { presenterNotes } from './notes';

/**
 * Kimi K3 심화 — the explanations the architecture week has no node for.
 *
 * Deliberately a separate week rather than extra tabs on `2026-08-12-kimi-k3`.
 * Two runs of scenes here are ordered and have to stay that way:
 *
 *  01 → 06  the routing line. The paper opens §2.3.3 in the middle of an
 *           argument, so 01 states the problem, 02 defines what a quantile is,
 *           03 and 04 do the derivation one move at a time, 05 connects it to
 *           the rule it replaces, and 06 is how it is computed at scale. Any
 *           prefix of that chain stands on its own; skipping into the middle
 *           does not.
 *  07 → 08  the EP line. 08 assumes the audience already knows that a token
 *           is computed on whichever rank owns its expert, so 07 shows that
 *           dispatch first and answers the question 08 keeps provoking: how
 *           copying an expert can possibly balance anything.
 *  09 → 10  the cache line. K3's cache is written as a modification of
 *           block-hash caching, so the baseline gets a scene of its own instead
 *           of a sentence of jargon.
 *
 * 11 (SGLang) is self-contained and can be lifted out alone.
 */
const qbProblem: Detail = { kind: 'scene', scene: qbProblemScene };
const qbQuantile: Detail = { kind: 'scene', scene: qbQuantileScene };
const qbDual: Detail = { kind: 'scene', scene: qbDualScene };
const qbMinimise: Detail = { kind: 'scene', scene: qbMinimiseScene };
const qbJump: Detail = { kind: 'scene', scene: qbJumpScene };
const qbHistogram: Detail = { kind: 'scene', scene: qbHistogramScene };
const moonEp: Detail = { kind: 'scene', scene: moonEpScene };
const epDispatch: Detail = { kind: 'scene', scene: epDispatchScene };
const blockHash: Detail = { kind: 'scene', scene: blockHashCacheScene };
const prefixCache: Detail = { kind: 'scene', scene: kdaPrefixCacheScene };
const sglangRadix: Detail = { kind: 'scene', scene: sglangRadixScene };

export const week20260812Infra: WeekManifest = {
  id: '2026-08-12-kimi-k3-infra',
  title: 'Kimi K3 심화 — QB · MoonEP · 캐시',
  palette: darkDefault,
  explorable: {
    root: k3InfraIndex,
    details: {
      'qb-problem': qbProblem,
      'qb-quantile': qbQuantile,
      'qb-dual': qbDual,
      'qb-minimise': qbMinimise,
      'qb-jump': qbJump,
      'qb-histogram': qbHistogram,
      'ep-dispatch': epDispatch,
      'moon-ep': moonEp,
      'block-hash': blockHash,
      'prefix-cache': prefixCache,
      'sglang-radix': sglangRadix,
    },
    // N/P로 이 순서대로 훑으면 되고, 줄만 지키면 중간에서 끊어 가도 된다
    path: [
      'qb-problem',
      'qb-quantile',
      'qb-dual',
      'qb-minimise',
      'qb-jump',
      'qb-histogram',
      'ep-dispatch',
      'moon-ep',
      'block-hash',
      'prefix-cache',
      'sglang-radix',
    ],
  },
  notes: presenterNotes,
  scenes: [
    qbProblemScene,
    qbQuantileScene,
    qbDualScene,
    qbMinimiseScene,
    qbJumpScene,
    qbHistogramScene,
    epDispatchScene,
    moonEpScene,
    blockHashCacheScene,
    kdaPrefixCacheScene,
    sglangRadixScene,
  ],
};
