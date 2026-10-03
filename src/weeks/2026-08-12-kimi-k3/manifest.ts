import type { Detail, WeekManifest } from '@/lib/explorer/types';
import { darkDefault } from '@/lib/theme';
import { kimiK3Arch } from './diagrams/kimi-k3-arch.diagram';
import { titleScene } from './scenes/00-title';
import { architectureScene } from './scenes/01-architecture';
import { kdaScene } from './scenes/02-kda';
import { kdaChunkScene } from './scenes/06-kda-chunk';
import { gatedMlaScene } from './scenes/03-gated-mla';
import { attnResScene } from './scenes/04-attn-residuals';
import { latentMoeScene } from './scenes/05-latent-moe';
import { quantileBalancingScene } from './scenes/07-quantile-balancing';
import { perHeadMuonScene } from './scenes/08-per-head-muon';
import { presenterNotes } from './notes';

const kda: Detail[] = [
  { kind: 'scene', scene: kdaScene, label: 'Delta Rule' },
  { kind: 'scene', scene: kdaChunkScene, label: 'Chunkwise' },
];
const gmla: Detail = { kind: 'scene', scene: gatedMlaScene };
const attnRes: Detail = { kind: 'scene', scene: attnResScene };
const qb: Detail = { kind: 'scene', scene: quantileBalancingScene, label: 'Quantile Balancing' };
const latentMoe: Detail[] = [
  { kind: 'scene', scene: latentMoeScene, label: 'LatentMoE' },
  qb,
];
const muon: Detail = { kind: 'scene', scene: perHeadMuonScene, label: 'Per-Head Muon' };

export const week20260812: WeekManifest = {
  id: '2026-08-12-kimi-k3',
  title: 'Kimi K3 아키텍처',
  palette: darkDefault,
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
      // 라우터(및 점수 막대)를 직접 클릭하면 QB 설명으로 바로 들어간다
      router: qb,
      'router-scores': qb,
      // KDA 패널의 q/k/v projection 블록 → 이 행렬들을 학습시키는 옵티마이저
      'q-proj': muon,
      'k-proj': muon,
      'v-proj': muon,
    },
    path: ['kda', 'gmla', 'a-out', 'smoe-lo', 'router', 'q-proj'],
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
    kdaChunkScene,
    gatedMlaScene,
    attnResScene,
    latentMoeScene,
    quantileBalancingScene,
    perHeadMuonScene,
  ],
};
