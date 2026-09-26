import { defineDiagram } from '@/lib/diagram';

/**
 * MOPD2, reconstructed from Fig. 13 (§5.6, p25). Every box and rail of the
 * figure, enumerated from the page before writing this file:
 *
 * (a) Domain-Specific Teachers
 *     Verifiable Tasks → mixRL Teachers        Open-Domain Tasks → SFT Teachers
 * (b) Standard MOPD
 *     Task prompt → "Full student rollout" (a heading, no box) over y₁ – y₂ – ⋯ – y_T
 *     → OPD (mixRL teacher), the drop leaving the chain under its ellipsis
 * (c) Prefix-Conditioned OPD
 *     Teacher-Prefix OPD: Trajectory from Teacher Rollout ┐
 *     SFT-Prefix OPD:     Trajectory from SFT Data        ┴→ Split into k history prefixes
 *       → h₁, h₂, ⋯, h_k → Student turn y₁, y₂, ⋯, y_k → OPD (mixRL / SFT teacher)
 * rails: mixRL Teachers → OPD (mixRL teacher) (down the gap between b and c)
 *        mixRL Teachers → OPD (mixRL / SFT teacher) (along the top, joining SFT's rail)
 *        SFT Teachers   → OPD (mixRL / SFT teacher) (down the right edge)
 *        both OPD boxes → MiMo Student Update
 *
 * Block names stay English as in the figure; the scene's callouts carry the
 * Korean. Hand-positioned so every rail can run orthogonally on waypoints.
 */

const at = (cx: number, cy: number, w: number, h: number) => ({
  size: { w, h },
  position: { x: Math.round(cx - w / 2), y: Math.round(cy - h / 2) },
});

// ── geometry ────────────────────────────────────────────────────────────────
const Y = {
  titleA: 24,
  teachers: 84,
  /** rail under the teacher row */
  bus: 146,
  panelTop: 166,
  heads: 232,
  prompt: 262,
  rolloutHead: 396,
  traj: 300,
  mergeTraj: 360,
  split: 398,
  fan: 440,
  h: 484,
  chain: 468,
  turn: 572,
  mergeTurn: 632,
  opd: 672,
  panelBottom: 720,
  update: 780,
};
/** panel (b) centre, panel (c) centre, and the rails beside them */
const B_X = 245;
const C_X = 870;
const GAP_X = 495;
const RIGHT_X = 1252;
/** (c) columns: h₁ h₂ ⋯ h_k */
const COLS = { c1: 610, c2: 770, dots: 930, ck: 1100 };
const TP_X = 700;
const SP_X = 1040;

const drop = (from: string, to: string, x: number, y: number) => ({
  id: `e-${from}-${to}`,
  from,
  to,
  waypoints: [
    { x, y },
    { x: C_X, y },
  ],
});

export const mopd2Detail = defineDiagram({
  id: 'mimo-v26-mopd2',
  direction: 'TB',
  groups: [
    { id: 'panel-b', label: '(b) Standard MOPD', rect: { x: 20, y: Y.panelTop, w: 450, h: Y.panelBottom - Y.panelTop } },
    {
      id: 'panel-c',
      label: '(c) Prefix-Conditioned OPD',
      rect: { x: 520, y: Y.panelTop, w: 700, h: Y.panelBottom - Y.panelTop },
    },
  ],
  nodes: [
    // ── (a) domain-specific teachers ────────────────────────────────────────
    {
      id: 'title-a',
      kind: 'annotation',
      label: '(a) Domain-Specific Teachers',
      variant: 'annotation',
      ...at(620, Y.titleA, 440, 40),
    },
    { id: 'verifiable', kind: 'io', label: 'Verifiable Tasks', variant: 'io', ...at(160, Y.teachers, 280, 60) },
    { id: 'mixrl', kind: 'op', label: 'mixRL Teachers', variant: 'default', ...at(470, Y.teachers, 250, 60) },
    { id: 'opendomain', kind: 'io', label: 'Open-Domain Tasks', variant: 'io', ...at(810, Y.teachers, 290, 60) },
    { id: 'sftteach', kind: 'op', label: 'SFT Teachers', variant: 'route', ...at(1110, Y.teachers, 220, 60) },

    // ── (b) standard MOPD ───────────────────────────────────────────────────
    { id: 'prompt', kind: 'annotation', label: 'Task prompt', variant: 'annotation', ...at(B_X, Y.prompt, 200, 40) },
    {
      id: 'rollout-head',
      kind: 'annotation',
      label: 'Full student rollout',
      variant: 'annotation',
      ...at(B_X, Y.rolloutHead, 280, 40),
    },
    // the chain is centred on the panel so the drop to OPD leaves it under the ellipsis, as in the figure
    { id: 'y1', kind: 'op', label: 'y_1', math: true, variant: 'op', ...at(B_X - 165, Y.chain, 64, 52) },
    { id: 'y2', kind: 'op', label: 'y_2', math: true, variant: 'op', ...at(B_X - 75, Y.chain, 64, 52) },
    { id: 'ydots', kind: 'annotation', label: '⋯', variant: 'annotation', ...at(B_X, Y.chain, 60, 52) },
    { id: 'yT', kind: 'op', label: 'y_T', math: true, variant: 'op', ...at(B_X + 90, Y.chain, 64, 52) },
    { id: 'opd-b', kind: 'op', label: 'OPD (mixRL teacher)', variant: 'default', ...at(B_X, Y.opd, 330, 60) },

    // ── (c) prefix-conditioned OPD ──────────────────────────────────────────
    { id: 'tp-head', kind: 'annotation', label: 'Teacher-Prefix OPD', variant: 'annotation', ...at(TP_X, Y.heads, 280, 36) },
    { id: 'sp-head', kind: 'annotation', label: 'SFT-Prefix OPD', variant: 'annotation', ...at(SP_X, Y.heads, 240, 36) },
    { id: 'tp-traj', kind: 'op', label: 'Trajectory from Teacher Rollout', variant: 'op', ...at(TP_X, Y.traj, 290, 72) },
    { id: 'sp-traj', kind: 'op', label: 'Trajectory from SFT Data', variant: 'op', ...at(SP_X, Y.traj, 260, 72) },
    {
      id: 'split',
      kind: 'annotation',
      label: 'Split into k history prefixes',
      variant: 'annotation',
      ...at(C_X, Y.split, 420, 36),
    },
    { id: 'h1', kind: 'op', label: 'h_1', math: true, variant: 'route', ...at(COLS.c1, Y.h, 90, 52) },
    { id: 'h2', kind: 'op', label: 'h_2', math: true, variant: 'route', ...at(COLS.c2, Y.h, 90, 52) },
    { id: 'hdots', kind: 'annotation', label: '⋯', variant: 'annotation', ...at(COLS.dots, Y.h, 60, 52) },
    { id: 'hk', kind: 'op', label: 'h_k', math: true, variant: 'route', ...at(COLS.ck, Y.h, 90, 52) },
    { id: 'st1', kind: 'op', label: 'Student turn y₁', variant: 'op', ...at(COLS.c1, Y.turn, 150, 72) },
    { id: 'st2', kind: 'op', label: 'Student turn y₂', variant: 'op', ...at(COLS.c2, Y.turn, 150, 72) },
    { id: 'stdots', kind: 'annotation', label: '⋯', variant: 'annotation', ...at(COLS.dots, Y.turn, 60, 52) },
    { id: 'stk', kind: 'op', label: 'Student turn yₖ', variant: 'op', ...at(COLS.ck, Y.turn, 150, 72) },
    { id: 'opd-c', kind: 'op', label: 'OPD (mixRL / SFT teacher)', variant: 'route', ...at(C_X, Y.opd, 600, 56) },

    // ── the one student ─────────────────────────────────────────────────────
    { id: 'update', kind: 'op', label: 'MiMo Student Update', variant: 'expertShared', ...at(620, Y.update, 330, 60) },
  ],
  edges: [
    // (a)
    { id: 'e-verifiable-mixrl', from: 'verifiable', to: 'mixrl' },
    { id: 'e-opendomain-sftteach', from: 'opendomain', to: 'sftteach' },

    // (b)
    { id: 'e-prompt-rollout-head', from: 'prompt', to: 'rollout-head' },
    { id: 'e-y1-y2', from: 'y1', to: 'y2' },
    { id: 'e-y2-ydots', from: 'y2', to: 'ydots', arrow: false },
    { id: 'e-ydots-yT', from: 'ydots', to: 'yT' },
    { id: 'e-ydots-opd-b', from: 'ydots', to: 'opd-b' },

    // (c)
    {
      id: 'e-tp-traj-split',
      from: 'tp-traj',
      to: 'split',
      waypoints: [
        { x: TP_X, y: Y.mergeTraj },
        { x: C_X, y: Y.mergeTraj },
      ],
    },
    {
      id: 'e-sp-traj-split',
      from: 'sp-traj',
      to: 'split',
      waypoints: [
        { x: SP_X, y: Y.mergeTraj },
        { x: C_X, y: Y.mergeTraj },
      ],
    },
    ...(['h1', 'h2', 'hk'] as const).map((h, i) => {
      const x = [COLS.c1, COLS.c2, COLS.ck][i]!;
      return {
        id: `e-split-${h}`,
        from: 'split',
        to: h,
        waypoints: [
          { x: C_X, y: Y.fan },
          { x, y: Y.fan },
        ],
      };
    }),
    { id: 'e-h1-st1', from: 'h1', to: 'st1' },
    { id: 'e-h2-st2', from: 'h2', to: 'st2' },
    { id: 'e-hk-stk', from: 'hk', to: 'stk' },
    drop('st1', 'opd-c', COLS.c1, Y.mergeTurn),
    drop('st2', 'opd-c', COLS.c2, Y.mergeTurn),
    drop('stk', 'opd-c', COLS.ck, Y.mergeTurn),

    // teacher rails
    {
      id: 'e-mixrl-opd-b',
      from: 'mixrl',
      to: 'opd-b',
      waypoints: [
        { x: 470, y: Y.bus },
        { x: GAP_X, y: Y.bus },
        { x: GAP_X, y: Y.opd },
      ],
    },
    {
      id: 'e-mixrl-opd-c',
      from: 'mixrl',
      to: 'opd-c',
      waypoints: [
        { x: 470, y: Y.bus },
        { x: RIGHT_X, y: Y.bus },
        { x: RIGHT_X, y: Y.opd },
      ],
    },
    {
      id: 'e-sftteach-opd-c',
      from: 'sftteach',
      to: 'opd-c',
      waypoints: [
        { x: 1110, y: Y.bus },
        { x: RIGHT_X, y: Y.bus },
        { x: RIGHT_X, y: Y.opd },
      ],
    },

    // into the student
    { id: 'e-opd-b-update', from: 'opd-b', to: 'update', waypoints: [{ x: B_X, y: Y.update }] },
    { id: 'e-opd-c-update', from: 'opd-c', to: 'update', waypoints: [{ x: 1000, y: Y.update }] },
  ],
});

/** reveal bundles per beat — `update` and the two panel boxes are in none (frame-0 anchor) */
export const mopd2Ids = {
  teachers: ['title-a', 'verifiable', 'mixrl', 'opendomain', 'sftteach', 'e-verifiable-mixrl', 'e-opendomain-sftteach'],
  opd: [
    'prompt',
    'rollout-head',
    'e-prompt-rollout-head',
    'y1',
    'y2',
    'ydots',
    'yT',
    'e-y1-y2',
    'e-y2-ydots',
    'e-ydots-yT',
    'opd-b',
    'e-ydots-opd-b',
  ],
  standard: ['e-mixrl-opd-b', 'e-opd-b-update'],
  prefix: [
    'tp-head',
    'sp-head',
    'tp-traj',
    'sp-traj',
    'e-tp-traj-split',
    'e-sp-traj-split',
    'split',
    'e-split-h1',
    'e-split-h2',
    'e-split-hk',
    'h1',
    'h2',
    'hdots',
    'hk',
    'e-h1-st1',
    'e-h2-st2',
    'e-hk-stk',
    'st1',
    'st2',
    'stdots',
    'stk',
    'e-st1-opd-c',
    'e-st2-opd-c',
    'e-stk-opd-c',
    'opd-c',
    'e-mixrl-opd-c',
    'e-sftteach-opd-c',
    'e-opd-c-update',
  ],
  prefixes: ['h1', 'h2', 'hk'],
  turns: ['st1', 'st2', 'stk'],
  fanOut: ['e-split-h1', 'e-split-h2', 'e-split-hk'],
};
