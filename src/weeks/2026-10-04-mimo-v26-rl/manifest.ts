import type { DetailsMap, WeekManifest } from '@/lib/explorer/types';
import { homeDiagram, homePath } from './diagrams/home.diagram';
import { presenterNotes } from './notes';
import { titleScene } from './scenes/00-title';
import { consistencyTrack } from './tracks/consistency';
import { correctionTrack } from './tracks/correction';
import { distillTrack } from './tracks/distill';
import { environmentTrack } from './tracks/environment';
import { gradingTrack } from './tracks/grading';
import { lessonsTrack } from './tracks/lessons';
import { mixerTrack } from './tracks/mixer';
import { objectiveTrack } from './tracks/objective';
import { penaltiesTrack } from './tracks/penalties';
import { porterTrack } from './tracks/porter';
import { prepTrack } from './tracks/prep';
import { saturateTrack } from './tracks/saturate';

/**
 * MiMo-V2.6, training only, in the blackboard look. The 2026-09-27 deck covered
 * the same report in the classic look; this one is rebuilt around what the
 * report is actually about: Mid-training (§3.2), one RL step and Eq. 1 (§4.1,
 * §5.1), the environments (§4.2), groupwise grading and the behaviour penalties
 * (§4.3), the machinery that fills a 25K-sequence batch (the last paragraph of
 * §4.1 with the detail of §6), what the 30-step run taught (§5.3–5.5) and
 * MOPD2 (§5.6). The architecture (§2) is left out.
 *
 * The infrastructure chapters lean on the papers the report only cites: Kimi
 * k1.5 (partial rollout), DAPO (dynamic sampling), Ma et al. 2025 (R3),
 * DeepSeek-V3.2 and MAI-Thinking-1 (top-p candidate sets), AsyncFlow
 * (TransferQueue). Their notes say which sentence comes from which paper.
 *
 * The scenes are split into track modules (tracks/*.ts), each owning its
 * scenes, diagrams, data and notes; this manifest only merges them. The paper
 * PDF is in public/assets/2026-09-27-mimo-v26/ (gitignored).
 */
const TRACKS = [
  prepTrack,
  objectiveTrack,
  correctionTrack,
  environmentTrack,
  gradingTrack,
  penaltiesTrack,
  saturateTrack,
  consistencyTrack,
  mixerTrack,
  porterTrack,
  lessonsTrack,
  distillTrack,
];

const details: DetailsMap = Object.assign({}, ...TRACKS.map((t) => t.details));

export const week20261004: WeekManifest = {
  id: '2026-10-04-mimo-v26-rl',
  title: 'MiMo-V2.6: RL을 키우는 법',
  explorable: {
    root: homeDiagram,
    details,
    path: homePath.filter((id) => id in details),
  },
  slides: [{ kind: 'scene', scene: titleScene }],
  notes: Object.assign({}, presenterNotes, ...TRACKS.map((t) => t.notes)),
  scenes: [titleScene, ...TRACKS.flatMap((t) => t.scenes)].sort((a, b) => a.meta.id.localeCompare(b.meta.id)),
};
