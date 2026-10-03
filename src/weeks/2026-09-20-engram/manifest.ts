import type { Detail, WeekManifest } from '@/lib/explorer/types';
import { darkDefault } from '@/lib/theme';
import { engramArch, engramIds } from './diagrams/engram-arch.diagram';
import { titleScene } from './scenes/00-title';
import { whyMemoryScene } from './scenes/01-why-memory';
import { retrievalScene } from './scenes/02-retrieval';
import { gatingScene } from './scenes/03-gating';
import { outputScene } from './scenes/04-output';
import { systemScene } from './scenes/05-system';
import { sinkhornWhyScene } from './scenes/06-sinkhorn-why';
import { sinkhornAlgorithmScene } from './scenes/07-sinkhorn-algorithm';
import { sinkhornDrDcScene } from './scenes/08-sinkhorn-dr-dc';
import { presenterNotes } from './notes';

/**
 * Engram (arXiv 2601.07372) — the root is a reconstruction of the paper's
 * Figure 1; every block of the magnified module opens the scene for its
 * stage. Two off-figure chips in the left margin cover what the figure
 * leaves out: the host-memory system design (§2.5) and how DeepSeek-V4.1
 * trains the tables (§2.5 Algorithm 1, Sinkhorn-balanced update).
 * Paper PDF lives in public/assets/2026-09-20-engram/ (gitignored); the V4.1
 * report is in public/assets/2026-09-13-deepseek-v41-flash/.
 */

// every related id opens the same explanation, whichever one gets clicked
const why: Detail = { kind: 'scene', scene: whyMemoryScene };
const retrieval: Detail = { kind: 'scene', scene: retrievalScene };
const gating: Detail = { kind: 'scene', scene: gatingScene };
const output: Detail = { kind: 'scene', scene: outputScene };
const sinkhorn: Detail[] = [
  { kind: 'scene', scene: sinkhornWhyScene, label: '왜 Adam이 아닌가' },
  { kind: 'scene', scene: sinkhornAlgorithmScene, label: 'Algorithm 1' },
  { kind: 'scene', scene: sinkhornDrDcScene, label: 'D_r · D_c' },
];

const aliases = (ids: string[], d: Detail) => Object.fromEntries(ids.map((id) => [id, d]));

export const week20260920: WeekManifest = {
  id: '2026-09-20-engram',
  title: 'Engram: 조회로 만드는 조건부 메모리',
  palette: darkDefault,
  explorable: {
    root: engramArch,
    details: {
      ...aliases(engramIds.backbone, why),
      ...aliases(engramIds.retrieval, retrieval),
      ...aliases(engramIds.gating, gating),
      ...aliases(engramIds.output, output),
      'host-mem': { kind: 'scene', scene: systemScene },
      'table-train': sinkhorn,
    },
    path: ['engram', 'hash-3', 'sdp', 'conv', 'host-mem', 'table-train'],
  },
  slides: [{ kind: 'scene', scene: titleScene }],
  notes: presenterNotes,
  scenes: [
    titleScene,
    whyMemoryScene,
    retrievalScene,
    gatingScene,
    outputScene,
    systemScene,
    sinkhornWhyScene,
    sinkhornAlgorithmScene,
    sinkhornDrDcScene,
  ],
};
