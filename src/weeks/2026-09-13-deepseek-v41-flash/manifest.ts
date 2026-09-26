import type { Detail, WeekManifest } from '@/lib/explorer/types';
import { kvLevers } from './diagrams/kv-levers.diagram';
import { titleScene } from './scenes/00-title';
import { kvBasicsScene } from './scenes/01-kv-basics';
import { cedScene } from './scenes/02-ced';
import { csa2CompressScene } from './scenes/03-csa2-compress';
import { csa2IndexerScene } from './scenes/04-csa2-indexer';
import { csa2ReuseReindexScene } from './scenes/05-csa2-reuse-reindex';
import { csa2CandidatePoolScene } from './scenes/06-csa2-candidate-pool';
import { csa2ModesScene } from './scenes/07-csa2-modes';
import { fp4KvScene } from './scenes/08-fp4-kv';
import { swaReplayScene } from './scenes/09-swa-replay';
import { presenterNotes } from './notes';

/**
 * DeepSeek-V4.1-Flash — scoped to the KV-cache reductions: CED (§2.2),
 * CSA2 compression, indexer, cross-layer reuse and candidate pool (§2.3), FP4 main KV (§2.4.4), and SWA Bounded
 * Replay / persistent cache (§3.2). The primer (01) defines the two KV
 * branches and the two storage tiers every later scene refers to.
 * Paper PDF lives in public/assets/2026-09-13-deepseek-v41-flash/ (gitignored).
 */

// FP4 씬이 890 bytes를 직접 더하므로, 루트의 890 노드도 같은 씬을 연다
const fp4: Detail = { kind: 'scene', scene: fp4KvScene };

export const week20260913: WeekManifest = {
  id: '2026-09-13-deepseek-v41-flash',
  title: 'DeepSeek-V4.1-Flash KV 캐시 압축',
  explorable: {
    root: kvLevers,
    details: {
      prompt: { kind: 'scene', scene: kvBasicsScene },
      ced: { kind: 'scene', scene: cedScene },
      // CSA2는 이해 순서대로 탭 다섯 개: 압축 → Full 인덱싱 → 층 간 재사용 → 후보 풀 → 요약 표
      csa2: [
        { kind: 'scene', scene: csa2CompressScene, label: '압축' },
        { kind: 'scene', scene: csa2IndexerScene, label: 'Full 층' },
        { kind: 'scene', scene: csa2ReuseReindexScene, label: 'Reuse · Reindex' },
        { kind: 'scene', scene: csa2CandidatePoolScene, label: '후보 풀' },
        { kind: 'scene', scene: csa2ModesScene, label: '요약 표' },
      ],
      fp4,
      'global-kv': fp4,
      'swa-replay': { kind: 'scene', scene: swaReplayScene },
    },
    path: ['prompt', 'ced', 'csa2', 'fp4', 'swa-replay'],
  },
  slides: [{ kind: 'scene', scene: titleScene }],
  notes: presenterNotes,
  scenes: [
    titleScene,
    kvBasicsScene,
    cedScene,
    csa2CompressScene,
    csa2IndexerScene,
    csa2ReuseReindexScene,
    csa2CandidatePoolScene,
    csa2ModesScene,
    fp4KvScene,
    swaReplayScene,
  ],
};
