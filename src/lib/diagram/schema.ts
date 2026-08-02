import { z } from 'zod';

/**
 * The single source of truth for architecture diagrams. LLMs generate this
 * from paper figures; the explorer renders it interactively; DiagramView
 * animates it; the (future) editor bakes `position` into it.
 */

export const NodeSchema = z.object({
  id: z.string().min(1),
  kind: z.enum(['block', 'op', 'io', 'annotation']).default('block'),
  /** Korean + inline English both fine */
  label: z.string(),
  /** small KaTeX line rendered under the label */
  tex: z.string().optional(),
  /** palette.diagram role: attention | ffn | norm | route | embed | io | op | default … */
  variant: z.string().default('default'),
  /** group id this node belongs to */
  parent: z.string().optional(),
  size: z.object({ w: z.number(), h: z.number() }).optional(),
  /** absent ⇒ auto-layout. Baked by the editor for hand-tuned diagrams. */
  position: z.object({ x: z.number(), y: z.number() }).optional(),
});

export const EdgeSchema = z.object({
  id: z.string().min(1),
  from: z.string(),
  to: z.string(),
  label: z.string().optional(),
  style: z.enum(['solid', 'dashed']).default('solid'),
  color: z.string().optional(),
});

export const GroupSchema = z.object({
  id: z.string().min(1),
  label: z.string().optional(),
  variant: z.string().default('group'),
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
    for (const e of d.edges) {
      for (const end of [e.from, e.to]) {
        if (!nodeIds.has(end)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `edge "${e.id}" references unknown node "${end}"`,
          });
        }
      }
      if (ids.has(e.id)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: `edge id "${e.id}" collides with a node/group id` });
      }
    }
  });

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
