import type { DetailsMap } from '@/lib/explorer/types';
import type { SceneModule } from '@/lib/timeline';

/**
 * One slice of the week, owned by one work order. `manifest.ts` merges every
 * track: its scenes join the week's scene list (sorted by id), its details are
 * spread into `explorable.details` (keys are root-diagram node ids), and its
 * notes are spread into the presenter notes. A track never edits the manifest.
 */
export interface WeekTrack {
  scenes: SceneModule[];
  details: DetailsMap;
  notes: Record<string, string>;
}
