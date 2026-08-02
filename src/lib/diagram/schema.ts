import { z } from 'zod';

/**
 * The single source of truth for architecture diagrams. LLMs generate this
 * from paper figures; the explorer renders it interactively; DiagramView
 * animates it; the (future) editor bakes `position` into it.
 */

/**
 * Node silhouette. `rect` is the default block; the rest exist so paper
 * figures can be reproduced literally — projections are trapezoids (the slant
 * shows which way the width changes), element-wise ops are circles, and
 * low-rank pairs are an hourglass.
 */
export const ShapeSchema = z.enum([
  'rect',
  'circle',
  'pill',
  /** narrow bottom → wide top: an up-projection in an upward-flowing figure */
  'trapUp',
  /** wide bottom → narrow top: a down-projection */
  'trapDown',
  /** stacked trapDown+trapUp — a low-rank bottleneck drawn as one node */
  'hourglass',
  /** router score histogram glyph */
  'bars',
]);

export const NodeSchema = z.object({
  id: z.string().min(1),
  kind: z.enum(['block', 'op', 'io', 'annotation']).default('block'),
  /** Korean + inline English both fine */
  label: z.string(),
  /**
   * Name used by the deck's chrome (breadcrumb, guided path, overview cards).
   * Set it when `label` is unsuitable there — raw KaTeX under `math`, or blank
   * on a purely graphical node. Falls back to `label`, then the id.
   */
  title: z.string().optional(),
  /** small KaTeX line rendered under the label */
  tex: z.string().optional(),
  /** palette.diagram role: attention | ffn | norm | route | embed | io | op | default … */
  variant: z.string().default('default'),
  shape: ShapeSchema.default('rect'),
  /** render the label in KaTeX instead of the sans face (α, w, σ, N …) */
  math: z.boolean().default(false),
  /** permanently faded — figure elements that are present but inactive (unselected experts) */
  muted: z.boolean().default(false),
  /** group id this node belongs to */
  parent: z.string().optional(),
  size: z.object({ w: z.number(), h: z.number() }).optional(),
  /** absent ⇒ auto-layout. Baked by the editor for hand-tuned diagrams. */
  position: z.object({ x: z.number(), y: z.number() }).optional(),
});

export const PointSchema = z.object({ x: z.number(), y: z.number() });

export const EdgeSchema = z.object({
  id: z.string().min(1),
  from: z.string(),
  to: z.string(),
  label: z.string().optional(),
  /** 0..1 — fraction along the edge where the label sits (default 0.5); nudge it off crowded midpoints */
  labelPos: z.number().min(0).max(1).optional(),
  style: z.enum(['solid', 'dashed', 'dotted']).default('solid'),
  /** token name (`accent`) or raw CSS color */
  color: z.string().optional(),
  /**
   * Explicit corner points in diagram coordinates, for hand-routed (fully
   * positioned) diagrams. The endpoints are still clipped to the two rects, so
   * only the elbows go here. Ignored under auto-layout.
   */
  waypoints: z.array(PointSchema).optional(),
  /** figure rails that merely carry a value have no arrowhead */
  arrow: z.boolean().default(true),
});

export const GroupSchema = z.object({
  id: z.string().min(1),
  label: z.string().optional(),
  /** name for the deck's chrome when the box carries no on-canvas label */
  title: z.string().optional(),
  variant: z.string().default('group'),
  dash: z.enum(['dashed', 'dotted']).default('dashed'),
  /** explicit box in diagram coordinates; absent ⇒ derived from member bounds */
  rect: z.object({ x: z.number(), y: z.number(), w: z.number(), h: z.number() }).optional(),
});

export const DiagramSchema = z
  .object({
    id: z.string().min(1),
    direction: z.enum(['TB', 'LR']).default('TB'),
    nodes: z.array(NodeSchema).min(1),
    edges: z.array(EdgeSchema).default([]),
    groups: z.array(GroupSchema).default([]),
    layout: z
      .object({ nodeGap: z.number(), rankGap: z.number() })
      .partial()
      .optional(),
  })
  .superRefine((d, ctx) => {
    const ids = new Set<string>();
    for (const el of [...d.nodes, ...d.groups]) {
      if (ids.has(el.id)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: `duplicate id "${el.id}"` });
      }
      ids.add(el.id);
    }
    const groupIds = new Set(d.groups.map((g) => g.id));
    for (const n of d.nodes) {
      if (n.parent && !groupIds.has(n.parent)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `node "${n.id}" references unknown group "${n.parent}"`,
        });
      }
    }
    const nodeIds = new Set(d.nodes.map((n) => n.id));
    const manual = d.nodes.every((n) => n.position);
    for (const e of d.edges) {
      for (const end of [e.from, e.to]) {
        if (nodeIds.has(end)) continue;
        if (groupIds.has(end)) {
          // dagre cannot terminate an edge on a cluster; panel-to-panel
          // connectors only make sense in a hand-positioned figure anyway
          if (!manual) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: `edge "${e.id}" attaches to group "${end}", which requires every node to have a position`,
            });
          }
          continue;
        }
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `edge "${e.id}" references unknown node "${end}"`,
        });
      }
      if (e.waypoints?.length && !manual) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `edge "${e.id}" has waypoints, which require every node to have a position`,
        });
      }
      if (ids.has(e.id)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: `edge id "${e.id}" collides with a node/group id` });
      }
    }
  });

export type NodeShape = z.output<typeof ShapeSchema>;
export type DiagramPoint = z.output<typeof PointSchema>;
export type DiagramNode = z.output<typeof NodeSchema>;
export type DiagramEdge = z.output<typeof EdgeSchema>;
export type DiagramGroup = z.output<typeof GroupSchema>;
export type Diagram = z.output<typeof DiagramSchema>;

/** Validate at import time so a malformed (e.g. LLM-generated) diagram fails loudly and early. */
export const defineDiagram = (d: z.input<typeof DiagramSchema>): Diagram => {
  const parsed = DiagramSchema.safeParse(d);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `  - ${i.path.join('.')}: ${i.message}`).join('\n');
    throw new Error(`Invalid diagram "${String(d.id)}":\n${issues}`);
  }
  return parsed.data;
};
