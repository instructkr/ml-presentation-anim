import type { DetailsMap, WeekManifest } from '@/lib/explorer/types';
import { trainingPipeline } from './diagrams/training-pipeline.diagram';
import { sftNote } from './details/sft-note';
import { titleScene } from './scenes/00-title';
import { groupAdvantageScene } from './scenes/06-group-advantage';
import { presenterNotes } from './notes';
import { objectiveTrack } from './tracks/objective';
import { gradingTrack } from './tracks/grading';
import { optimizerTrack } from './tracks/optimizer';
import { penaltiesTrack } from './tracks/penalties';

/**
 * MiMo-V2.6 — scoped to training: the optimizer switch (AdamW → Muown, §3.2),
 * one RL step and its objective (§4.1, §5.1), groupwise grading (GRS/GAR,
 * §4.3), behavior penalties (§4.3.3) and MOPD2 (§5.6). The root is the
 * training pipeline with the RL stage drawn open as a loop.
 *
 * The scenes are split into track modules (tracks/*.ts), each owned by one
 * work order; this manifest only merges them. Paper PDF lives in
 * public/assets/2026-09-27-mimo-v26/ (gitignored).
 */

const TRACKS = [optimizerTrack, objectiveTrack, gradingTrack, penaltiesTrack];

/** presenter order over the root; ids without a detail yet are dropped below */
const PATH = [
  'pretrain',
  'midtrain',
  'update',
  'router',
  'rollout',
  'advantage',
  'loss',
  'ratio',
  'grs',
  'gar',
  'length',
  'segment',
  'mopd2',
];

const details: DetailsMap = {
  advantage: { kind: 'scene', scene: groupAdvantageScene },
  sft: { kind: 'note', content: sftNote, label: 'SFT' },
  ...optimizerTrack.details,
  ...objectiveTrack.details,
  ...gradingTrack.details,
  ...penaltiesTrack.details,
};

export const week20260927: WeekManifest = {
  id: '2026-09-27-mimo-v26',
  title: 'MiMo-V2.6 학습: 옵티마이저와 RL 목적함수',
  explorable: {
    root: trainingPipeline,
    details,
    path: PATH.filter((id) => id in details),
  },
  slides: [{ kind: 'scene', scene: titleScene }],
  notes: {
    ...presenterNotes,
    ...optimizerTrack.notes,
    ...objectiveTrack.notes,
    ...gradingTrack.notes,
    ...penaltiesTrack.notes,
  },
  scenes: [titleScene, groupAdvantageScene, ...TRACKS.flatMap((t) => t.scenes)].sort((a, b) =>
    a.meta.id.localeCompare(b.meta.id),
  ),
};
