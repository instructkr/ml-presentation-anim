import type { Diagram } from '@/lib/diagram/schema';
import type { Positions } from './geometry';

/** TS single-quoted string literal — labels are Korean, tex carries backslashes. */
const q = (s: string): string =>
  `'${s.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\r?\n/g, '\\n')}'`;

/** 'moe-arch' → 'moeArch' (the exported const name in the .diagram.ts file) */
const camel = (id: string): string => {
  const words = id.split(/[^A-Za-z0-9]+/).filter(Boolean);
  const [first, ...rest] = words;
  const name = (first ?? 'diagram').toLowerCase() + rest.map((w) => w[0]!.toUpperCase() + w.slice(1)).join('');
  return /^[0-9]/.test(name) ? `d${name}` : name;
};

const obj = (parts: string[]): string => `{ ${parts.join(', ')} }`;

/**
 * The full source of a `.diagram.ts` file with every node's dragged position
 * baked in. Fields equal to their schema default (kind 'block', variant
 * 'default', style 'solid') are left out — parsing re-applies them.
 */
export const exportDiagramTs = (diagram: Diagram, positions: Positions): string => {
  const nodes = diagram.nodes.map((n) => {
    const p = positions[n.id] ?? n.position ?? { x: 0, y: 0 };
    const parts = [`id: ${q(n.id)}`];
    if (n.kind !== 'block') parts.push(`kind: ${q(n.kind)}`);
    parts.push(`label: ${q(n.label)}`);
    if (n.variant !== 'default') parts.push(`variant: ${q(n.variant)}`);
    if (n.tex) parts.push(`tex: ${q(n.tex)}`);
    if (n.parent) parts.push(`parent: ${q(n.parent)}`);
    if (n.size) parts.push(`size: { w: ${n.size.w}, h: ${n.size.h} }`);
    parts.push(`position: { x: ${Math.round(p.x)}, y: ${Math.round(p.y)} }`);
    return `    ${obj(parts)},`;
  });

  const edges = diagram.edges.map((e) => {
    const parts = [`id: ${q(e.id)}`, `from: ${q(e.from)}`, `to: ${q(e.to)}`];
    if (e.label) parts.push(`label: ${q(e.label)}`);
    if (e.style !== 'solid') parts.push(`style: ${q(e.style)}`);
    if (e.color) parts.push(`color: ${q(e.color)}`);
    return `    ${obj(parts)},`;
  });

  const groups = diagram.groups.map((g) => {
    const parts = [`id: ${q(g.id)}`];
    if (g.label) parts.push(`label: ${q(g.label)}`);
    if (g.variant !== 'group') parts.push(`variant: ${q(g.variant)}`);
    return `    ${obj(parts)},`;
  });

  const lines = [
    `import { defineDiagram } from '@/lib/diagram';`,
    ``,
    `/** Positions baked by the editor — auto-layout is skipped. */`,
    `export const ${camel(diagram.id)} = defineDiagram({`,
    `  id: ${q(diagram.id)},`,
    `  direction: ${q(diagram.direction)},`,
  ];
  if (diagram.layout) {
    const parts: string[] = [];
    if (diagram.layout.nodeGap !== undefined) parts.push(`nodeGap: ${diagram.layout.nodeGap}`);
    if (diagram.layout.rankGap !== undefined) parts.push(`rankGap: ${diagram.layout.rankGap}`);
    if (parts.length) lines.push(`  layout: ${obj(parts)},`);
  }
  if (groups.length) lines.push(`  groups: [`, ...groups, `  ],`);
  lines.push(`  nodes: [`, ...nodes, `  ],`);
  if (edges.length) lines.push(`  edges: [`, ...edges, `  ],`);
  lines.push(`});`, ``);
  return lines.join('\n');
};
