import type { Detail, WeekManifest } from '@/lib/explorer/types';
import { kimiK3Arch } from './diagrams/kimi-k3-arch.diagram';
import { titleScene } from './scenes/00-title';
import { architectureScene } from './scenes/01-architecture';
import { kdaScene } from './scenes/02-kda';
import { gatedMlaScene } from './scenes/03-gated-mla';
import { attnResScene } from './scenes/04-attn-residuals';
import { latentMoeScene } from './scenes/05-latent-moe';
import { presenterNotes } from './notes';

const kda: Detail = { kind: 'scene', scene: kdaScene };
const gmla: Detail = { kind: 'scene', scene: gatedMlaScene };
const attnRes: Detail = { kind: 'scene', scene: attnResScene };
const latentMoe: Detail = { kind: 'scene', scene: latentMoeScene };

export const week20260812: WeekManifest = {
  id: '2026-08-12-kimi-k3',
  title: 'Kimi K3 아키텍처',
  explorable: {
    root: kimiK3Arch,
    // the same explanation opens from the backbone block, from its magnified
    // panel, and from any of the α circles — whichever the presenter clicks
    details: {
      kda,
      'kda-core': kda,
      'kda-panel': kda,
      gmla,
      'smoe-hi': latentMoe,
      'smoe-lo': latentMoe,
      'smoe-panel': latentMoe,
      'a-kda': attnRes,
      'a-smoe-lo': attnRes,
      'a-gmla': attnRes,
      'a-smoe-hi': attnRes,
      'a-out': attnRes,
      'attnres-out': attnRes,
    },
    path: ['kda', 'gmla', 'a-out', 'smoe-lo'],
  },
  slides: [
    { kind: 'scene', scene: titleScene },
    { kind: 'scene', scene: architectureScene },
  ],
  notes: presenterNotes,
  scenes: [
    titleScene,
    architectureScene,
    kdaScene,
    gatedMlaScene,
    attnResScene,
    latentMoeScene,
  ],
};
