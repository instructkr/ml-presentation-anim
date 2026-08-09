import { defineDiagram } from '@/lib/diagram';

/**
 * Kimi K3 architecture — a reconstruction of Figure 2 of the technical report.
 *
 * Three panels, all hand-positioned (no auto-layout):
 *   · right  — the repeating backbone block: 3× (KDA + Stable LatentMoE) then
 *              1× (Gated MLA + Stable LatentMoE), with the Attention-Residual
 *              (w, α) column feeding every module from the block history.
 *   · top-left    — inside one Stable LatentMoE layer.
 *   · bottom-left — inside one KDA layer.
 *
 * Coordinates are in diagram px and mirror the published figure's proportions;
 * DiagramView and the explorer both scale the whole thing to fit.
 */

type Pt = { x: number; y: number };

/** place a node by its centre — every coordinate below is a centre, like the figure's geometry */
const at = (cx: number, cy: number, w: number, h: number) => ({
  size: { w, h },
  position: { x: Math.round(cx - w / 2), y: Math.round(cy - h / 2) },
});

/** invisible endpoint so a rail can start or end in empty space (a spine leaving the panel) */
const anchor = (id: string, cx: number, cy: number) => ({
  id,
  kind: 'annotation' as const,
  variant: 'annotation',
  label: '',
  ...at(cx, cy, 2, 2),
});

interface EdgeOpts {
  label?: string;
  style?: 'solid' | 'dashed' | 'dotted';
  color?: string;
  arrow?: boolean;
  waypoints?: Pt[];
}
const e = (from: string, to: string, opts: EdgeOpts = {}) => ({
  id: `e-${from}-${to}`,
  from,
  to,
  ...opts,
});

/** the salmon Attention-Residual wiring, drawn in the accent hue like the paper */
const res = (from: string, to: string, opts: EdgeOpts = {}) => e(from, to, { color: 'accent', ...opts });

// ── geometry ────────────────────────────────────────────────────────────────
/** backbone spine and the α / w column beside it */
const SPINE = 1250;
const ALPHA_X = 1452;
/** module centres, bottom to top — spaced so every module↔⊕ edge gap is 26px */
const Y = {
  kda: 800,
  add1: 726,
  smoeLo: 638,
  add2: 550,
  gmla: 476,
  add3: 402,
  smoeHi: 314,
  add4: 226,
  out: 142,
};
/** where the bottom of the block fades into the layers below */
const TAIL_Y = 878;
/** left-hand residual bypass rails, alternating x so adjacent ones stay legible */
const BYPASS_A = 1076;
const BYPASS_B = 1086;
/** one vertical rail per Attention-Residual source, innermost = most recent block */
const SRC = [
  { id: 'blk-1', cy: 1010, rail: 1590, nudge: -9 },
  { id: 'blk-2', cy: 1094, rail: 1618, nudge: -3 },
  { id: 'blk-3', cy: 1178, rail: 1646, nudge: 3 },
  { id: 'embedding', cy: 1330, rail: 1674, nudge: 9 },
];
/**
 * Every module that reads from the residual history: `alpha` mixes the sources
 * below with the block's own running sum (`partial`) and feeds `target`.
 */
const ATTENDERS = [
  { key: 'kda', cy: Y.kda, target: 'kda', partialY: TAIL_Y, partial: 'vdots' },
  { key: 'smoe-lo', cy: Y.smoeLo, target: 'smoe-lo', partialY: Y.add1, partial: 'add1' },
  { key: 'gmla', cy: Y.gmla, target: 'gmla', partialY: Y.add2, partial: 'add2' },
  { key: 'smoe-hi', cy: Y.smoeHi, target: 'smoe-hi', partialY: Y.add3, partial: 'add3' },
  { key: 'out', cy: Y.out, target: null, partialY: Y.add4, partial: 'add4' },
];

const MOD = { w: 270, h: 52 };
/** "Stable LatentMoE" wraps to two lines at this width, so its box is taller */
const SMOE = { w: 270, h: 80 };
const PLUS = 44;
const ALPHA = 46;

const alphaNode = (key: string, cy: number, cx = ALPHA_X) => [
  { id: `w-${key}`, label: 'w', title: 'pseudo-query w', variant: 'op', math: true, ...at(cx, cy - 60, 40, 36) },
  {
    id: `a-${key}`,
    label: '\\alpha',
    // the on-canvas glyph is raw KaTeX, so the deck's chrome needs a readable name
    title: 'Attention Residuals (α)',
    variant: 'op',
    shape: 'circle' as const,
    math: true,
    ...at(cx, cy, ALPHA, ALPHA),
  },
];

const plus = (id: string, cy: number) => ({
  id,
  kind: 'op' as const,
  label: '+',
  variant: 'op',
  shape: 'circle' as const,
  ...at(SPINE, cy, PLUS, PLUS),
});

const note = (id: string, label: string, cx: number, cy: number, w: number, h: number, math = false) => ({
  id,
  kind: 'annotation' as const,
  variant: 'annotation',
  label,
  math,
  ...at(cx, cy, w, h),
});

// ── the repeating backbone block, plus the history it attends over ───────────
const backboneNodes = [
  ...alphaNode('kda', Y.kda),
  ...alphaNode('smoe-lo', Y.smoeLo),
  ...alphaNode('gmla', Y.gmla),
  ...alphaNode('smoe-hi', Y.smoeHi),

  { id: 'kda', label: 'KDA', title: 'Kimi Delta Attention', variant: 'attention', ...at(SPINE, Y.kda, MOD.w, MOD.h) },
  { id: 'smoe-lo', label: 'Stable LatentMoE', variant: 'ffn', ...at(SPINE, Y.smoeLo, SMOE.w, SMOE.h) },
  { id: 'gmla', label: 'Gated MLA', variant: 'proj', ...at(SPINE, Y.gmla, MOD.w, MOD.h) },
  { id: 'smoe-hi', label: 'Stable LatentMoE', variant: 'ffn', ...at(SPINE, Y.smoeHi, SMOE.w, SMOE.h) },

  plus('add1', Y.add1),
  plus('add2', Y.add2),
  plus('add3', Y.add3),
  plus('add4', Y.add4),

  note('vdots', '⋮', SPINE, TAIL_Y, 40, 44),
  note('rep-1x', '1\\times', 930, Y.add3, 70, 40, true),
  note('rep-3x', '3\\times', 930, Y.add1, 70, 40, true),
];

const historyNodes = [
  ...alphaNode('out', Y.out, SPINE).map((n) =>
    // the final aggregation sits in its own dotted box, w beside α rather than above it
    n.id === 'w-out' ? { ...n, ...at(1196, Y.out, 40, 36) } : n,
  ),
  note('output', 'Output', SPINE, 56, 200, 40),
  { id: 'blk-1', label: 'Block n−1', variant: 'default', ...at(SPINE, 1010, 290, 56) },
  { id: 'blk-2', label: 'Block n−2', variant: 'default', ...at(SPINE, 1094, 290, 56) },
  { id: 'blk-3', label: 'Block n−3', variant: 'default', ...at(SPINE, 1178, 290, 56) },
  note('src-dots', '⋮', SPINE, 1252, 40, 44),
  { id: 'embedding', label: 'Embedding', variant: 'embed', ...at(SPINE, 1330, 290, 56) },
];

// ── inside one Stable LatentMoE layer ───────────────────────────────────────
const smoeNodes = [
  { id: 'lg-shared', label: '', variant: 'expertShared', ...at(168, 205, 30, 30) },
  note('lg-shared-t', 'Shared Expert', 300, 205, 220, 34),
  { id: 'lg-routed', label: '', variant: 'expertRouted', ...at(168, 249, 30, 30) },
  note('lg-routed-t', 'Routed Expert', 300, 249, 220, 34),

  anchor('smoe-out', 500, 120),
  { id: 'smoe-add', kind: 'op' as const, label: '+', variant: 'op', shape: 'circle' as const, ...at(500, 196, PLUS, PLUS) },
  { id: 'smoe-up', label: 'Linear', variant: 'proj', shape: 'trapUp' as const, ...at(700, 262, 140, 48) },
  { id: 'smoe-norm', kind: 'op' as const, label: 'Norm', variant: 'norm', ...at(700, 328, 120, 44) },
  { id: 'smoe-mix', kind: 'op' as const, label: '+', variant: 'op', shape: 'circle' as const, ...at(700, 384, 38, 38) },

  { id: 'shared-1', label: '1', variant: 'expertShared', ...at(255, 450, 50, 50) },
  { id: 'shared-2', label: '2', variant: 'expertShared', ...at(350, 450, 50, 50) },
  { id: 'routed-1', label: '1', variant: 'expertRouted', muted: true, ...at(500, 450, 50, 50) },
  { id: 'routed-2', label: '2', variant: 'expertRouted', ...at(585, 450, 50, 50) },
  { id: 'routed-3', label: '3', variant: 'expertRouted', muted: true, ...at(670, 450, 50, 50) },
  note('routed-dots', '· · ·', 730, 450, 56, 34),
  { id: 'routed-n', label: 'N', variant: 'expertRouted', math: true, ...at(800, 450, 50, 50) },

  { id: 'router', kind: 'op' as const, label: 'Router', variant: 'io', ...at(500, 566, 140, 48) },
  { id: 'router-scores', kind: 'op' as const, label: '', variant: 'op', shape: 'bars' as const, ...at(590, 566, 34, 34) },
  { id: 'smoe-down', label: 'Linear', variant: 'proj', shape: 'trapDown' as const, ...at(700, 566, 140, 48) },
  anchor('smoe-in', 500, 686),
];

// ── inside one KDA layer ────────────────────────────────────────────────────
const kdaNodes = [
  anchor('kda-out', 500, 716),
  { id: 'kda-o-proj', label: 'Linear', variant: 'proj', ...at(500, 786, 210, 48) },
  { id: 'kda-gate-mul', kind: 'op' as const, label: '×', variant: 'op', shape: 'circle' as const, ...at(500, 852, 42, 42) },
  { id: 'kda-norm', kind: 'op' as const, label: 'Norm', variant: 'norm', ...at(500, 912, 180, 46) },
  { id: 'kda-core', label: 'Kimi Delta Attention', variant: 'attention', ...at(500, 990, 480, 56) },

  // q and k share one parameterisation, so the figure draws the chain twice,
  // offset — the back copy is a bare silhouette, its label hidden behind the front
  { id: 'k-proj', label: '', variant: 'proj', ...at(266, 1248, 130, 46) },
  { id: 'k-conv', kind: 'op' as const, label: '', variant: 'op', shape: 'pill' as const, ...at(266, 1186, 112, 40) },
  { id: 'k-swish', kind: 'op' as const, label: '', variant: 'op', shape: 'pill' as const, ...at(266, 1126, 118, 38) },
  { id: 'k-l2', kind: 'op' as const, label: '', variant: 'op', shape: 'pill' as const, ...at(266, 1066, 84, 38) },

  { id: 'q-proj', label: 'Linear', variant: 'proj', ...at(280, 1262, 130, 46) },
  { id: 'q-conv', kind: 'op' as const, label: 'Conv', variant: 'op', shape: 'pill' as const, ...at(280, 1200, 112, 40) },
  { id: 'q-swish', kind: 'op' as const, label: 'Swish', variant: 'op', shape: 'pill' as const, ...at(280, 1140, 118, 38) },
  { id: 'q-l2', kind: 'op' as const, label: 'L2', variant: 'op', shape: 'pill' as const, ...at(280, 1080, 84, 38) },

  { id: 'v-proj', label: 'Linear', variant: 'proj', ...at(420, 1262, 130, 46) },
  { id: 'v-conv', kind: 'op' as const, label: 'Conv', variant: 'op', shape: 'pill' as const, ...at(420, 1200, 112, 40) },
  { id: 'v-swish', kind: 'op' as const, label: 'Swish', variant: 'op', shape: 'pill' as const, ...at(420, 1140, 118, 38) },

  // the decay logit comes from a low-rank pair — one hourglass, as in the figure
  { id: 'alpha-lowrank', label: '', variant: 'expertShared', shape: 'hourglass' as const, ...at(560, 1250, 110, 80) },
  { id: 'alpha-sig', kind: 'op' as const, label: '\\sigma', variant: 'route', shape: 'circle' as const, math: true, ...at(560, 1140, 34, 34) },

  { id: 'beta-proj', label: '', variant: 'expertShared', shape: 'trapDown' as const, ...at(680, 1262, 100, 46) },
  { id: 'beta-sig', kind: 'op' as const, label: '\\sigma', variant: 'route', shape: 'circle' as const, math: true, ...at(680, 1140, 34, 34) },

  { id: 'gate-proj', label: 'Linear', variant: 'proj', ...at(800, 1262, 130, 46) },
  { id: 'gate-sig', kind: 'op' as const, label: '\\sigma', variant: 'route', shape: 'circle' as const, math: true, ...at(800, 1140, 34, 34) },
  anchor('kda-in', 500, 1380),
];

const withParent = <T extends object>(parent: string, nodes: T[]) => nodes.map((n) => ({ ...n, parent }));

export const kimiK3Arch = defineDiagram({
  id: 'kimi-k3-arch',
  direction: 'TB',
  groups: [
    // the panels carry no on-canvas label (the figure identifies them by their
    // contents), so `title` is what the deck's chrome shows
    { id: 'smoe-panel', title: 'Stable LatentMoE 확대도', rect: { x: 110, y: 150, w: 760, h: 500 } },
    { id: 'kda-panel', title: 'KDA 확대도', rect: { x: 110, y: 730, w: 760, h: 610 } },
    { id: 'block-panel', title: '반복 블록', rect: { x: 980, y: 180, w: 570, h: 750 } },
    {
      id: 'attnres-out',
      title: '최종 출력 집계',
      dash: 'dotted',
      rect: { x: 1168, y: 110, w: 130, h: 64 },
    },
  ],
  nodes: [
    ...withParent('block-panel', backboneNodes),
    ...historyNodes,
    ...withParent('smoe-panel', smoeNodes),
    ...withParent('kda-panel', kdaNodes),
  ],
  edges: [
    // ── backbone spine: module → ⊕, and the bypass that carries the running sum
    e('kda', 'add1'),
    e('smoe-lo', 'add2'),
    e('gmla', 'add3'),
    e('smoe-hi', 'add4'),
    e('vdots', 'add1', { waypoints: [{ x: BYPASS_B, y: TAIL_Y }, { x: BYPASS_B, y: Y.add1 }] }),
    e('add1', 'add2', { waypoints: [{ x: BYPASS_A, y: Y.add1 }, { x: BYPASS_A, y: Y.add2 }] }),
    e('add2', 'add3', { waypoints: [{ x: BYPASS_B, y: Y.add2 }, { x: BYPASS_B, y: Y.add3 }] }),
    e('add3', 'add4', { waypoints: [{ x: BYPASS_A, y: Y.add3 }, { x: BYPASS_A, y: Y.add4 }] }),

    // ── Attention Residuals: α reads the history, w is its learned pseudo-query
    ...ATTENDERS.flatMap(({ key, cy, target, partial, partialY }) => [
      res(`w-${key}`, `a-${key}`, { arrow: false }),
      ...(target ? [res(`a-${key}`, target)] : []),
      // the block's own running sum joins the keys the module attends over
      res(partial, `a-${key}`, {
        waypoints: key === 'out' ? [] : [{ x: ALPHA_X, y: partialY }],
      }),
      ...SRC.map((s) =>
        res(s.id, `a-${key}`, {
          arrow: false,
          waypoints: [
            { x: s.rail, y: s.cy },
            { x: s.rail, y: cy + s.nudge },
          ],
        }),
      ),
    ]),
    res('a-out', 'output'),

    // ── Stable LatentMoE panel ────────────────────────────────────────────
    e('smoe-in', 'router', { waypoints: [{ x: 500, y: 612 }] }),
    e('smoe-in', 'shared-1', { waypoints: [{ x: 500, y: 612 }, { x: 255, y: 612 }] }),
    e('smoe-in', 'shared-2', { waypoints: [{ x: 500, y: 612 }, { x: 350, y: 612 }] }),
    e('smoe-in', 'smoe-down', { waypoints: [{ x: 500, y: 612 }, { x: 700, y: 612 }] }),
    // the router dispatches rather than carries a value, so its lines are dashed
    e('router-scores', 'routed-2', { style: 'dashed', arrow: false, waypoints: [{ x: 590, y: 512 }, { x: 585, y: 512 }] }),
    e('router-scores', 'routed-n', { style: 'dashed', arrow: false, waypoints: [{ x: 590, y: 528 }, { x: 800, y: 528 }] }),
    e('smoe-down', 'routed-2', { waypoints: [{ x: 700, y: 496 }, { x: 585, y: 496 }] }),
    e('smoe-down', 'routed-n', { waypoints: [{ x: 700, y: 496 }, { x: 800, y: 496 }] }),
    e('routed-2', 'smoe-mix', { waypoints: [{ x: 585, y: 418 }, { x: 700, y: 418 }] }),
    e('routed-n', 'smoe-mix', { waypoints: [{ x: 800, y: 418 }, { x: 700, y: 418 }] }),
    e('smoe-mix', 'smoe-norm'),
    e('smoe-norm', 'smoe-up'),
    e('smoe-up', 'smoe-add'),
    e('shared-1', 'smoe-add'),
    e('shared-2', 'smoe-add'),
    e('smoe-add', 'smoe-out'),

    // ── KDA panel ─────────────────────────────────────────────────────────
    e('kda-in', 'q-proj', { waypoints: [{ x: 500, y: 1310 }, { x: 280, y: 1310 }] }),
    e('kda-in', 'k-proj', { arrow: false, waypoints: [{ x: 500, y: 1310 }, { x: 264, y: 1310 }] }),
    e('kda-in', 'v-proj', { waypoints: [{ x: 500, y: 1310 }, { x: 420, y: 1310 }] }),
    e('kda-in', 'alpha-lowrank', { waypoints: [{ x: 500, y: 1310 }, { x: 560, y: 1310 }] }),
    e('kda-in', 'beta-proj', { waypoints: [{ x: 500, y: 1310 }, { x: 680, y: 1310 }] }),
    e('kda-in', 'gate-proj', { waypoints: [{ x: 500, y: 1310 }, { x: 800, y: 1310 }] }),

    e('q-proj', 'q-conv'),
    e('q-conv', 'q-swish'),
    e('q-swish', 'q-l2'),
    e('k-proj', 'k-conv'),
    e('k-conv', 'k-swish'),
    e('k-swish', 'k-l2'),
    e('v-proj', 'v-conv'),
    e('v-conv', 'v-swish'),
    e('alpha-lowrank', 'alpha-sig'),
    e('beta-proj', 'beta-sig'),
    // q, k, v, α, β all rise straight into the recurrence — one waypoint keeps
    // each arrow on its own column instead of aiming at the wide block's centre
    e('q-l2', 'kda-core', { waypoints: [{ x: 280, y: 1040 }] }),
    e('k-l2', 'kda-core', { waypoints: [{ x: 266, y: 1040 }] }),
    e('v-swish', 'kda-core', { waypoints: [{ x: 420, y: 1090 }] }),
    e('alpha-sig', 'kda-core', { waypoints: [{ x: 560, y: 1090 }] }),
    e('beta-sig', 'kda-core', { waypoints: [{ x: 680, y: 1090 }] }),
    // the output gate skips the recurrence entirely and meets it at the product
    e('gate-proj', 'gate-sig'),
    e('gate-sig', 'kda-gate-mul', { waypoints: [{ x: 800, y: 852 }] }),
    e('kda-core', 'kda-norm'),
    e('kda-norm', 'kda-gate-mul'),
    e('kda-gate-mul', 'kda-o-proj'),
    e('kda-o-proj', 'kda-out'),

    // ── callouts: which block each panel magnifies
    e('smoe-panel', 'block-panel', { style: 'dotted', arrow: false, waypoints: [{ x: 906, y: 196 }] }),
    e('kda-panel', 'block-panel', {
      style: 'dotted',
      arrow: false,
      waypoints: [{ x: 906, y: 906 }, { x: 962, y: 918 }],
    }),
  ],
});

// ── step groupings, derived so a scene never hand-lists 70 ids ───────────────
const membersOf = (groupId: string) =>
  kimiK3Arch.nodes.filter((n) => n.parent === groupId).map((n) => n.id);

/** every edge whose two endpoints are both inside `ids` */
const edgesWithin = (ids: string[]): string[] => {
  const set = new Set(ids);
  return kimiK3Arch.edges.filter((x) => set.has(x.from) && set.has(x.to)).map((x) => x.id);
};

const withEdges = (ids: string[]): string[] => [...ids, ...edgesWithin(ids)];

/** the α/w column, the history it reads, and every salmon wire between them */
const attnRes = [
  'attnres-out',
  'output',
  ...ATTENDERS.flatMap((a) => [`a-${a.key}`, `w-${a.key}`]),
  ...SRC.map((s) => s.id),
  'src-dots',
  ...kimiK3Arch.edges.filter((x) => x.color === 'accent').map((x) => x.id),
];
const attnResSet = new Set(attnRes);

/**
 * Id bundles for `stepEffects` — the four beats the figure reads in: the
 * backbone spine, then the residual wiring, then each magnified panel.
 */
export const k3Ids = {
  spine: withEdges(['block-panel', ...membersOf('block-panel')]).filter((id) => !attnResSet.has(id)),
  attnRes,
  smoePanel: [...withEdges(['smoe-panel', ...membersOf('smoe-panel')]), 'e-smoe-panel-block-panel'],
  kdaPanel: [...withEdges(['kda-panel', ...membersOf('kda-panel')]), 'e-kda-panel-block-panel'],
};
