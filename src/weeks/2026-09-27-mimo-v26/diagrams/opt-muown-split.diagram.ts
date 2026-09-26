import { defineDiagram } from '@/lib/diagram';

/**
 * Muown's split, for 02-muown (Lion et al., 2026, arXiv 2605.10797):
 *
 *            가중치 W
 *           ┌────┴────┐
 *      행 길이 g     방향 R
 *          │           │
 *        Adam     Muon + 감쇠
 *           └────┬────┘
 *            갱신된 W
 *
 * The optimizer keeps each row's length g and its direction R as two separate
 * variables; g is stepped by Adam, R by Muon (weight decay applies to R only),
 * and the forward pass rebuilds W = Diag(g / ‖R‖_row) · R. Hand-positioned so
 * the fork and the join are orthogonal elbows. Variables are navy
 * (`attention`), optimizers maroon (`proj`, the optimizer hue of the root).
 */

/** place a node by its centre */
const at = (cx: number, cy: number, w: number, h: number) => ({
  size: { w, h },
  position: { x: Math.round(cx - w / 2), y: Math.round(cy - h / 2) },
});

const COL = { left: 150, mid: 300, right: 450 };
const ROW = { w: 57, vars: 217, opt: 397, out: 557 };
const IO = { w: 240, h: 66 };
const BLOCK = { w: 250, h: 84 };
/** where the fork splits and the join meets */
const FORK_Y = 134;
const JOIN_Y = 486;

export const muownSplit = defineDiagram({
  id: 'opt-muown-split',
  direction: 'TB',
  nodes: [
    { id: 'w', kind: 'io', label: '가중치 W', variant: 'io', ...at(COL.mid, ROW.w, IO.w, IO.h) },
    { id: 'g', label: '행 길이 g', variant: 'attention', ...at(COL.left, ROW.vars, BLOCK.w, BLOCK.h) },
    { id: 'r', label: '방향 R', variant: 'attention', ...at(COL.right, ROW.vars, BLOCK.w, BLOCK.h) },
    { id: 'adam', label: 'Adam', variant: 'proj', ...at(COL.left, ROW.opt, BLOCK.w, BLOCK.h) },
    { id: 'muon', label: 'Muon + 감쇠', variant: 'proj', ...at(COL.right, ROW.opt, BLOCK.w, BLOCK.h) },
    { id: 'w-next', kind: 'io', label: '갱신된 W', variant: 'io', ...at(COL.mid, ROW.out, IO.w, IO.h) },
  ],
  edges: [
    {
      id: 'e-w-g',
      from: 'w',
      to: 'g',
      waypoints: [
        { x: COL.mid, y: FORK_Y },
        { x: COL.left, y: FORK_Y },
      ],
    },
    {
      id: 'e-w-r',
      from: 'w',
      to: 'r',
      waypoints: [
        { x: COL.mid, y: FORK_Y },
        { x: COL.right, y: FORK_Y },
      ],
    },
    { id: 'e-g-adam', from: 'g', to: 'adam' },
    { id: 'e-r-muon', from: 'r', to: 'muon' },
    {
      id: 'e-adam-w-next',
      from: 'adam',
      to: 'w-next',
      waypoints: [
        { x: COL.left, y: JOIN_Y },
        { x: COL.mid, y: JOIN_Y },
      ],
    },
    {
      id: 'e-muon-w-next',
      from: 'muon',
      to: 'w-next',
      waypoints: [
        { x: COL.right, y: JOIN_Y },
        { x: COL.mid, y: JOIN_Y },
      ],
    },
  ],
});
