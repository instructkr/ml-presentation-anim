import dagre from '@dagrejs/dagre';
import type { Diagram, DiagramEdge, DiagramGroup, DiagramNode } from './schema';

export interface LaidOutNode {
  node: DiagramNode;
  x: number; // top-left
  y: number;
  w: number;
  h: number;
}

export interface LaidOutEdge {
  edge: DiagramEdge;
  points: { x: number; y: number }[];
}

export interface LaidOutGroup {
  group: DiagramGroup;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface DiagramLayout {
  nodes: LaidOutNode[];
  edges: LaidOutEdge[];
  groups: LaidOutGroup[];
  width: number;
  height: number;
  byId: Map<string, LaidOutNode>;
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export const GROUP_PAD = 18;
/** vertical room reserved above a group's members for its label */
export const GROUP_LABEL_H = 26;

/** Group box that encloses its member rects. Callers re-run this per frame when members move. */
export const groupBounds = (members: Rect[]): Rect => {
  if (members.length === 0) return { x: 0, y: 0, w: 0, h: 0 };
  const x0 = Math.min(...members.map((m) => m.x)) - GROUP_PAD;
  const y0 = Math.min(...members.map((m) => m.y)) - GROUP_PAD - GROUP_LABEL_H;
  const x1 = Math.max(...members.map((m) => m.x + m.w)) + GROUP_PAD;
  const y1 = Math.max(...members.map((m) => m.y + m.h)) + GROUP_PAD;
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
};

const centerOf = (r: Rect) => ({ x: r.x + r.w / 2, y: r.y + r.h / 2 });

/**
 * Left offset (within `box`) for a group's label chip such that it avoids the
 * vertical edge-entry lines of its members (edges enter at member centre-x,
 * with their own labels sitting just right of the line). Falls back to the
 * default inset when nothing fits.
 */
export const groupLabelLeft = (box: Rect, members: Rect[], label: string, pad = 14): number => {
  const labelW = estimateWidth(label, 21) + 22; // chip padding included
  const blocked = members
    .map((m) => m.x + m.w / 2 - box.x)
    .map((cx): [number, number] => [cx - 26, cx + 52])
    .sort((a, b) => a[0] - b[0]);
  let x = pad;
  for (const [s, e] of blocked) {
    if (x + labelW <= s) break;
    if (x < e) x = e;
  }
  return x + labelW + pad <= box.w ? x : pad;
};

/** Where the ray from `r`'s centre toward `to` leaves the rect, pushed out by `gap`. */
export const rectBorderPoint = (r: Rect, to: { x: number; y: number }, gap = 0): { x: number; y: number } => {
  const c = centerOf(r);
  const dx = to.x - c.x;
  const dy = to.y - c.y;
  const len = Math.hypot(dx, dy);
  if (len < 1e-6) return c;
  const sx = dx === 0 ? Infinity : r.w / 2 / Math.abs(dx);
  const sy = dy === 0 ? Infinity : r.h / 2 / Math.abs(dy);
  const s = Math.min(sx, sy) + gap / len;
  return { x: c.x + dx * s, y: c.y + dy * s };
};

/** Straight connector between two rects, clipped to their borders — used for moved (morphing) edges. */
export const connectorPoints = (a: Rect, b: Rect, gap = 5): { x: number; y: number }[] => [
  rectBorderPoint(a, centerOf(b), gap),
  rectBorderPoint(b, centerOf(a), gap),
];

const CJK = /[ᄀ-ᇿ㄰-㆏가-힯一-鿿]/;

/** Deterministic text-width estimate (no DOM measurement in the render path). */
const estimateWidth = (text: string, fontSize: number): number => {
  let w = 0;
  for (const ch of text) {
    w += CJK.test(ch) ? fontSize * 0.98 : fontSize * 0.58;
  }
  return w;
};

export const defaultNodeSize = (node: DiagramNode): { w: number; h: number } => {
  if (node.size) return node.size;
  if (node.shape === 'circle') return { w: 46, h: 46 };
  if (node.shape === 'bars') return { w: 44, h: 44 };
  const fontSize = node.kind === 'block' ? 30 : 26;
  // KaTeX line: strip control words, count remaining glyphs at ~13px each
  const texGlyphs = node.tex ? node.tex.replace(/\\[a-zA-Z]+/g, 'xx').replace(/[{}^_]/g, '').length : 0;
  const labelW = Math.max(estimateWidth(node.label, fontSize), texGlyphs * 13);
  const texH = node.tex ? 40 : 0;
  switch (node.kind) {
    case 'io':
      return { w: Math.max(150, labelW + 64), h: 66 };
    case 'op':
      return { w: Math.max(120, labelW + 48), h: 64 + texH };
    case 'annotation':
      return { w: Math.max(120, labelW + 24), h: 52 + texH };
    default:
      return { w: Math.max(170, labelW + 64), h: 84 + texH };
  }
};

const cache = new WeakMap<Diagram, DiagramLayout>();

export const layoutDiagram = (diagram: Diagram): DiagramLayout => {
  const hit = cache.get(diagram);
  if (hit) return hit;

  const manual = diagram.nodes.every((n) => n.position);
  const result = manual ? manualLayout(diagram) : dagreLayout(diagram);
  cache.set(diagram, result);
  return result;
};

const dagreLayout = (diagram: Diagram): DiagramLayout => {
  const g = new dagre.graphlib.Graph({ compound: true, multigraph: true });
  g.setGraph({
    rankdir: diagram.direction,
    nodesep: diagram.layout?.nodeGap ?? 48,
    ranksep: diagram.layout?.rankGap ?? 64,
    marginx: 24,
    marginy: 24,
  });
  g.setDefaultEdgeLabel(() => ({}));

  for (const group of diagram.groups) {
    g.setNode(group.id, {});
  }
  for (const node of diagram.nodes) {
    const size = defaultNodeSize(node);
    g.setNode(node.id, { width: size.w, height: size.h });
    if (node.parent) g.setParent(node.id, node.parent);
  }
  for (const edge of diagram.edges) {
    g.setEdge(edge.from, edge.to, {}, edge.id);
  }

  dagre.layout(g);

  const nodes: LaidOutNode[] = diagram.nodes.map((node) => {
    const pos = g.node(node.id);
    return {
      node,
      x: pos.x - pos.width / 2,
      y: pos.y - pos.height / 2,
      w: pos.width,
      h: pos.height,
    };
  });
  const groups: LaidOutGroup[] = diagram.groups.map((group) => {
    const b = group.rect ?? groupBounds(nodes.filter((n) => n.node.parent === group.id));
    return { group, ...b };
  });
  const edges: LaidOutEdge[] = diagram.edges.map((edge) => ({
    edge,
    points: g.edge(edge.from, edge.to, edge.id)?.points ?? [],
  }));

  const graph = g.graph();
  const layout: DiagramLayout = {
    nodes,
    edges,
    groups,
    width: graph.width ?? 0,
    height: graph.height ?? 0,
    byId: new Map(nodes.map((n) => [n.node.id, n])),
  };
  return layout;
};

/**
 * Where a rail approaching from `from` meets `r`. When the approach is straight
 * down/up/left/right onto a face, it lands on that face at the rail's own
 * coordinate — so a branch entering a wide block stays vertical instead of
 * bending toward the block's centre. Otherwise it falls back to the radial hit.
 */
export const orthoBorderPoint = (
  r: Rect,
  from: { x: number; y: number },
  gap = 0,
): { x: number; y: number } => {
  const inset = 3;
  if (from.x > r.x + inset && from.x < r.x + r.w - inset) {
    if (from.y <= r.y) return { x: from.x, y: r.y - gap };
    if (from.y >= r.y + r.h) return { x: from.x, y: r.y + r.h + gap };
  }
  if (from.y > r.y + inset && from.y < r.y + r.h - inset) {
    if (from.x <= r.x) return { x: r.x - gap, y: from.y };
    if (from.x >= r.x + r.w) return { x: r.x + r.w + gap, y: from.y };
  }
  return rectBorderPoint(r, from, gap);
};

/**
 * Route a hand-drawn edge through its waypoints: the corners are given, and the
 * two ends are clipped to the endpoint rects so the line meets each box on the
 * face it actually approaches.
 */
export const waypointPoints = (
  a: Rect,
  b: Rect,
  waypoints: { x: number; y: number }[],
  gap = 4,
): { x: number; y: number }[] => {
  if (waypoints.length === 0) return connectorPoints(a, b, gap);
  const first = waypoints[0]!;
  const last = waypoints[waypoints.length - 1]!;
  return [orthoBorderPoint(a, first, gap), ...waypoints, orthoBorderPoint(b, last, gap)];
};

/**
 * All nodes have baked positions (from the editor, or hand-authored for a
 * reproduced paper figure) — skip dagre entirely. Only here may edges carry
 * `waypoints` or terminate on a group box.
 */
const manualLayout = (diagram: Diagram): DiagramLayout => {
  const nodes: LaidOutNode[] = diagram.nodes.map((node) => {
    const size = defaultNodeSize(node);
    return { node, x: node.position!.x, y: node.position!.y, w: size.w, h: size.h };
  });
  const byId = new Map(nodes.map((n) => [n.node.id, n]));
  const groups: LaidOutGroup[] = diagram.groups.map((group) => {
    const b = group.rect ?? groupBounds(nodes.filter((n) => n.node.parent === group.id));
    return { group, ...b };
  });
  // groups are addressable endpoints too, so panel-to-panel callouts can attach
  const rectById = new Map<string, Rect>([
    ...nodes.map((n): [string, Rect] => [n.node.id, { x: n.x, y: n.y, w: n.w, h: n.h }]),
    ...groups.map((g): [string, Rect] => [g.group.id, { x: g.x, y: g.y, w: g.w, h: g.h }]),
  ]);
  const edges: LaidOutEdge[] = diagram.edges.map((edge) => {
    const a = rectById.get(edge.from)!;
    const b = rectById.get(edge.to)!;
    return { edge, points: waypointPoints(a, b, edge.waypoints ?? []) };
  });
  // hand-routed rails can swing wide of every box, so they count toward the extent
  const maxX = Math.max(
    ...nodes.map((n) => n.x + n.w),
    ...groups.map((gr) => gr.x + gr.w),
    ...edges.flatMap((e) => e.points.map((p) => p.x)),
  );
  const maxY = Math.max(
    ...nodes.map((n) => n.y + n.h),
    ...groups.map((gr) => gr.y + gr.h),
    ...edges.flatMap((e) => e.points.map((p) => p.y)),
  );
  return { nodes, edges, groups, width: maxX + 24, height: maxY + 24, byId };
};
