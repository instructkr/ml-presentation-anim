import { defaultNodeSize, type DiagramLayout } from '@/lib/diagram/layout';
import type { Diagram } from '@/lib/diagram/schema';

/** node id → top-left corner, as dragged in the editor. */
export type Positions = Record<string, { x: number; y: number }>;

export interface NodeBox {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface GroupRect {
  id: string;
  label?: string;
  variant: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

/** same padding constants as layout.ts, so group boxes match the renderer */
const PAD = 18;
const LABEL_ROOM = 26;

export const layoutPositions = (layout: DiagramLayout): Positions =>
  Object.fromEntries(layout.nodes.map((n) => [n.node.id, { x: n.x, y: n.y }]));

/** A copy with every baked position removed — feeds the "Auto-layout" button through dagre. */
export const stripPositions = (diagram: Diagram): Diagram => ({
  ...diagram,
  nodes: diagram.nodes.map(({ position: _position, ...node }) => node),
});

/** Laid-out sizes, with dragged positions overriding the layout ones. */
export const nodeBoxes = (diagram: Diagram, layout: DiagramLayout, dragged: Positions): NodeBox[] =>
  diagram.nodes.map((node) => {
    const laid = layout.byId.get(node.id);
    const size = laid ? { w: laid.w, h: laid.h } : defaultNodeSize(node);
    const pos = dragged[node.id] ?? { x: laid?.x ?? 0, y: laid?.y ?? 0 };
    return { id: node.id, x: pos.x, y: pos.y, w: size.w, h: size.h };
  });

/**
 * Derived group boxes hug their members. Explicit rectangles are authored
 * geometry and stay exact in the editor, just as they do at runtime.
 */
export const groupRects = (diagram: Diagram, boxes: NodeBox[]): GroupRect[] => {
  const byId = new Map(boxes.map((b) => [b.id, b]));
  const rects: GroupRect[] = [];
  for (const group of diagram.groups) {
    if (group.rect) {
      rects.push({
        id: group.id,
        label: group.label,
        variant: group.variant,
        ...group.rect,
      });
      continue;
    }
    const members = diagram.nodes
      .filter((n) => n.parent === group.id)
      .map((n) => byId.get(n.id))
      .filter((b): b is NodeBox => Boolean(b));
    if (members.length === 0) continue;
    const x0 = Math.min(...members.map((m) => m.x)) - PAD;
    const y0 = Math.min(...members.map((m) => m.y)) - PAD - LABEL_ROOM;
    const x1 = Math.max(...members.map((m) => m.x + m.w)) + PAD;
    const y1 = Math.max(...members.map((m) => m.y + m.h)) + PAD;
    rects.push({
      id: group.id,
      label: group.label,
      variant: group.variant,
      x: x0,
      y: y0,
      w: x1 - x0,
      h: y1 - y0,
    });
  }
  return rects;
};
