import type { WeekManifest } from '@/lib/explorer/types';
import { moeArch } from './diagrams/moe-arch.diagram';
import { titleScene } from './scenes/00-title';
import { attentionScene } from './scenes/01-attention';
import { routerScene } from './scenes/02-router';
import { tensorParallelScene } from './scenes/03-tensor-parallel';
import { benchmarksScene } from './scenes/04-benchmarks';
import { TensorPlayground } from './interactive/TensorPlayground';

export const week20260805: WeekManifest = {
  id: '2026-08-05-moe-demo',
  title: 'Mixture of Experts 해부',
  explorable: {
    root: moeArch,
    details: {
      attn: { kind: 'scene', scene: attentionScene },
      router: { kind: 'scene', scene: routerScene },
      moe: [
        { kind: 'scene', scene: tensorParallelScene, label: 'Tensor Parallel' },
        { kind: 'interactive', component: TensorPlayground, label: 'Live 3D' },
      ],
    },
    path: ['attn', 'router', 'moe'],
  },
  slides: [
    { kind: 'scene', scene: titleScene },
    { kind: 'scene', scene: benchmarksScene },
  ],
  scenes: [titleScene, attentionScene, routerScene, tensorParallelScene, benchmarksScene],
};
