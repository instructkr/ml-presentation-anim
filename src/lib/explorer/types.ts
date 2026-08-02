import type React from 'react';
import type { Diagram } from '../diagram/schema';
import type { SceneModule } from '../timeline/types';

/** What opens when a diagram node (or group) is clicked. */
export type Detail =
  | { kind: 'scene'; scene: SceneModule; label?: string }
  | { kind: 'diagram'; diagram: Diagram; details?: DetailsMap; label?: string }
  | { kind: 'interactive'; component: React.FC; label?: string }
  | { kind: 'note'; content: React.ReactNode; label?: string };

/** node/group id → detail (an array renders as tabs, e.g. scene + live playground) */
export type DetailsMap = Record<string, Detail | Detail[]>;

export interface Explorable {
  root: Diagram;
  details: DetailsMap;
  /** suggested presentation order of node ids — N/P keys follow it */
  path?: string[];
}

export type SlideDef =
  | { kind: 'scene'; scene: SceneModule }
  | { kind: 'component'; component: React.FC; title: string };

export interface WeekManifest {
  /** 'YYYY-MM-DD-topic' */
  id: string;
  title: string;
  explorable: Explorable;
  /** optional thin linear mode (title/benchmarks/closing) */
  slides?: SlideDef[];
  /** every defineScene of the week — drives Remotion <Composition> registration */
  scenes: SceneModule[];
}
