import { defineDiagram } from '@/lib/diagram';

/**
 * Where Mid-training sits and what it changes (§3.2).
 *
 *   Pre-training ──▶ Mid-training ──▶ SFT ──▶ RL
 *                         │
 *        ┌────────────────┼────────────────┬────────────────┐
 *   agent 풀이 데이터   문맥 256K → 1M   AdamW → Muown    MXFP4 QAT
 *
 * The top row is the training order; the comb under Mid-training lists the
 * four things that stage does before RL starts. Hand-positioned so the comb
 * can run on one horizontal rail (waypoints). Everything is grey: no node here
 * stands for a quantity, and the scene points with `highlight`.
 */

/** kept compact so the whole figure scales up past 1 in the wide cell and the labels read large */
const STAGE = { w: 240, h: 84 };
const ITEM = { w: 290, h: 68 };
const MARGIN = 24;

/** comb row: four items on one line */
const ITEM_PITCH = 330;
const itemX = (i: number) => MARGIN + i * ITEM_PITCH;
const itemCentre = (i: number) => itemX(i) + ITEM.w / 2;

/** stage row: Mid-training sits exactly above the second comb item, so its drop is one straight line */
const STAGE_PITCH = itemCentre(1) - STAGE.w / 2 - MARGIN;
const stageX = (i: number) => MARGIN + i * STAGE_PITCH;
const MID_CENTRE = stageX(1) + STAGE.w / 2;

const Y = { stage: MARGIN, rail: 204, item: 300 };

const stage = (id: string, label: string, i: number) => ({
  id,
  label,
  variant: 'default',
  size: STAGE,
  position: { x: stageX(i), y: Y.stage },
});

const item = (id: string, label: string, i: number) => ({
  id,
  kind: 'op' as const,
  label,
  variant: 'op',
  size: ITEM,
  position: { x: itemX(i), y: Y.item },
});

/** Mid-training → one comb item: down to the rail, along it, down into the item */
const comb = (to: string, i: number) => ({
  id: `e-mid-${to}`,
  from: 'mid',
  to,
  style: 'dashed' as const,
  ...(itemCentre(i) === MID_CENTRE
    ? {}
    : {
        waypoints: [
          { x: MID_CENTRE, y: Y.rail },
          { x: itemCentre(i), y: Y.rail },
        ],
      }),
});

const ITEMS: [id: string, label: string][] = [
  ['data', 'agent 풀이 데이터'],
  ['ctx', '문맥 256K → 1M'],
  ['opt', 'AdamW → Muown'],
  ['qat', 'MXFP4 QAT'],
];

export const midtrainDiagram = defineDiagram({
  id: 'mimo-v26-rl-midtrain',
  direction: 'LR',
  nodes: [
    stage('pre', 'Pre-training', 0),
    stage('mid', 'Mid-training', 1),
    stage('sft', 'SFT', 2),
    stage('rl', 'RL', 3),
    ...ITEMS.map(([id, label], i) => item(id, label, i)),
  ],
  edges: [
    { id: 'e-pre-mid', from: 'pre', to: 'mid' },
    { id: 'e-mid-sft', from: 'mid', to: 'sft' },
    { id: 'e-sft-rl', from: 'sft', to: 'rl' },
    ...ITEMS.map(([id], i) => comb(id, i)),
  ],
});

/** per-beat reveal bundles — the stage row is in none of them (the frame-0 anchor) */
export const midtrainIds = {
  data: ['e-mid-data', 'data'],
  context: ['e-mid-ctx', 'ctx'],
  optimizer: ['e-mid-opt', 'opt'],
  qat: ['e-mid-qat', 'qat'],
  items: ITEMS.map(([id]) => id),
};
