import type { Diagram } from '@/lib/diagram/schema';
import type { DetailsMap } from '@/lib/explorer/types';
import { weeks } from '@/weeks';

/** One selectable diagram in the sidebar. */
export interface DiagramEntry {
  /** stable selection key */
  key: string;
  diagram: Diagram;
  weekId: string;
  weekTitle: string;
  /** node ids drilled through to reach this diagram — empty for a week root */
  trail: string[];
}

const walk = (
  diagram: Diagram,
  details: DetailsMap,
  week: { id: string; title: string },
  trail: string[],
  seen: Set<Diagram>,
  out: DiagramEntry[],
): void => {
  if (seen.has(diagram)) return;
  seen.add(diagram);
  out.push({
    key: `${week.id}::${diagram.id}`,
    diagram,
    weekId: week.id,
    weekTitle: week.title,
    trail,
  });
  for (const [nodeId, detail] of Object.entries(details)) {
    for (const item of Array.isArray(detail) ? detail : [detail]) {
      if (item.kind === 'diagram') {
        walk(item.diagram, item.details ?? {}, week, [...trail, nodeId], seen, out);
      }
    }
  }
};

/** Every diagram reachable from the weeks registry: each root plus nested 'diagram' details. */
export const collectDiagrams = (): DiagramEntry[] => {
  const out: DiagramEntry[] = [];
  for (const week of weeks) {
    walk(
      week.explorable.root,
      week.explorable.details,
      { id: week.id, title: week.title },
      [],
      new Set(),
      out,
    );
  }
  return out;
};
