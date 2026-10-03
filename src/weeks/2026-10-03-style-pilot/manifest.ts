import type { WeekManifest } from '@/lib/explorer/types';
import { gallery } from './diagrams/gallery.diagram';
import { presenterNotes } from './notes';
import { titleScene } from './scenes/00-title';
import { groupAdvantageScene } from './scenes/01-group-advantage';
import { routerWalkScene } from './scenes/02-router-walk';
import { attentionSplitScene } from './scenes/03-attention-split';
import { sumToZeroScene } from './scenes/04-sum-to-zero';
import { tensorShardsScene } from './scenes/05-tensor-shards';

/**
 * The reference week of the blackboard (3Blue1Brown) look — not a talk. One
 * scene per recipe in `.claude/skills/new-scene/recipes.md`; the recipes are
 * excerpts of these files, so anything copied from them compiles and has been
 * rendered. Start a new scene from the closest one.
 */
export const week20261003: WeekManifest = {
  id: '2026-10-03-style-pilot',
  title: '칠판 방식 레퍼런스',
  explorable: {
    root: gallery,
    details: {
      chart: { kind: 'scene', scene: groupAdvantageScene },
      walk: { kind: 'scene', scene: routerWalkScene },
      split: { kind: 'scene', scene: attentionSplitScene },
      derive: { kind: 'scene', scene: sumToZeroScene },
      space: { kind: 'scene', scene: tensorShardsScene },
    },
    path: ['chart', 'walk', 'split', 'derive', 'space'],
  },
  slides: [{ kind: 'scene', scene: titleScene }],
  notes: presenterNotes,
  scenes: [titleScene, groupAdvantageScene, routerWalkScene, attentionSplitScene, sumToZeroScene, tensorShardsScene],
};
