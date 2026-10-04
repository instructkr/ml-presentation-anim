import { defineDiagram } from '@/lib/diagram';
import { INK } from '../quantities';

/**
 * The Payload Porter (§6.2), after Fig. 14 with everything but the data path
 * left out:
 *
 *              ┌ Control Plane ──────────────────────┐
 *              │  driver ───────────────────────────────┐
 *        ┌────▶│  [점수 · 길이 · 열쇠]                │   ▼
 *   Rollout    └─────────────────────────────────────┘ Packer ──▶ Training
 *        │     ┌ Data Plane ─────────────────────────┐   ▲
 *        │     │  [토큰] [확률] [Expert 번호] [후보 집합]│   │
 *        └────▶│  분산 저장소 ──────── 쓸 부분만 ────────┘
 *              └─────────────────────────────────────┘
 *
 * The scene starts without the lower half: Rollout hands every attempt to the
 * driver, and the four chips — what one attempt carries — sit under the driver,
 * on the one node that would have to hold them all. On the split the chips
 * glide down into the Data Plane (`payloadDrop`), and a single small chip, the
 * summary the driver still gets, takes their place. The lower box is the upper
 * one upside down — chips above, module below — so the chips land on the row
 * nearest to where they came from and cross nothing on the way.
 *
 * The chips are in no group: a group box with an explicit rect follows its
 * members when they move, and these boxes must stay where they are. The two
 * records the previous chapter added (Expert 번호, 후보 집합) wear `record`'s
 * ink and the logged probability wears μ's; modules stay grey.
 *
 * Hand-positioned so the fork out of Rollout and the two paths into the Packer
 * run on elbows.
 */

/** place a node by its centre */
const at = (cx: number, cy: number, w: number, h: number) => ({
  size: { w, h },
  position: { x: Math.round(cx - w / 2), y: Math.round(cy - h / 2) },
});

// ── geometry ────────────────────────────────────────────────────────────────
const MODULE = { w: 200, h: 84 };
/** the two plane boxes share one size; the lower one sits `PLANE_PITCH` below the upper */
const PLANE = { x: 400, y: 40, w: 660, h: 250 };
const PLANE_PITCH = 340;
/** rows inside a plane, from its top: the upper box has the module above its chips, the lower box the chips above its module */
const IN = { padX: 26, driverY: 105, chipY: 205, landY: 80, storeY: 175 };
const CHIP_H = 52;
const CHIP_GAP = 14;

const Y_DRIVER = PLANE.y + IN.driverY;
const Y_STORE = PLANE.y + PLANE_PITCH + IN.storeY;
/** Rollout, Packer and Training sit on the line halfway between the two planes */
const Y_MID = (Y_DRIVER + Y_STORE) / 2;
const X = {
  rollout: 124,
  /** where the path out of Rollout forks toward the two planes */
  fork: 320,
  module: PLANE.x + IN.padX + MODULE.w / 2,
  packer: 1205,
  training: 1464,
};

/** what one attempt carries (§6.2), left to right */
const CHIPS = [
  { id: 'c-token', label: '토큰', w: 100, variant: 'op' },
  { id: 'c-prob', label: '확률', w: 100, variant: INK.mu },
  { id: 'c-expert', label: 'Expert 번호', w: 184, variant: INK.record },
  { id: 'c-nucleus', label: '후보 집합', w: 164, variant: INK.record },
] as const;

/** the chips in a row from the plane's left padding; they start in the upper plane, under the driver */
const chipNodes = CHIPS.map((chip, i) => {
  const left = PLANE.x + IN.padX + CHIPS.slice(0, i).reduce((sum, c) => sum + c.w + CHIP_GAP, 0);
  return {
    id: chip.id,
    kind: 'op' as const,
    label: chip.label,
    variant: chip.variant,
    ...at(left + chip.w / 2, PLANE.y + IN.chipY, chip.w, CHIP_H),
  };
});

export const porterPlanes = defineDiagram({
  id: 'mimo-v26-rl-payload-porter',
  direction: 'LR',
  groups: [
    { id: 'control', label: 'Control Plane', rect: PLANE },
    { id: 'data', label: 'Data Plane', rect: { ...PLANE, y: PLANE.y + PLANE_PITCH } },
  ],
  nodes: [
    { id: 'rollout', label: 'Rollout', variant: 'default', ...at(X.rollout, Y_MID, MODULE.w, 110) },
    { id: 'driver', label: 'driver', variant: 'default', parent: 'control', ...at(X.module, Y_DRIVER, MODULE.w, MODULE.h) },
    { id: 'store', label: '분산 저장소', variant: 'default', parent: 'data', ...at(X.module, Y_STORE, MODULE.w, MODULE.h) },
    { id: 'packer', label: 'Packer', variant: 'default', ...at(X.packer, Y_MID, MODULE.w, MODULE.h) },
    { id: 'training', label: 'Training', variant: 'default', ...at(X.training, Y_MID, MODULE.w, 110) },
    ...chipNodes,
    // what the driver still receives once the content goes to the store: it lands where the chips were
    {
      id: 'summary',
      kind: 'op' as const,
      label: '점수 · 길이 · 열쇠',
      variant: 'op',
      ...at(PLANE.x + IN.padX + 130, PLANE.y + IN.chipY, 260, CHIP_H),
    },
  ],
  edges: [
    {
      id: 'e-rollout-driver',
      from: 'rollout',
      to: 'driver',
      waypoints: [
        { x: X.fork, y: Y_MID },
        { x: X.fork, y: Y_DRIVER },
      ],
    },
    { id: 'e-driver-packer', from: 'driver', to: 'packer', waypoints: [{ x: X.packer, y: Y_DRIVER }] },
    { id: 'e-packer-training', from: 'packer', to: 'training' },
    {
      id: 'e-rollout-store',
      from: 'rollout',
      to: 'store',
      label: '내용',
      labelPos: 0.8,
      waypoints: [
        { x: X.fork, y: Y_MID },
        { x: X.fork, y: Y_STORE },
      ],
    },
    {
      id: 'e-store-packer',
      from: 'store',
      to: 'packer',
      label: '쓸 부분만',
      labelPos: 0.35,
      waypoints: [{ x: X.packer, y: Y_STORE }],
    },
  ],
});

/** how far the chips glide on the split: from under the driver to the row above the store */
export const payloadDrop = Object.fromEntries(
  CHIPS.map((chip) => [chip.id, { dx: 0, dy: PLANE_PITCH + IN.landY - IN.chipY }]),
);

/** id bundles per beat — Rollout, driver, Packer, Training and the edges between them are in none (the frame-0 anchor) */
export const porterIds = {
  /** what one attempt carries */
  payload: CHIPS.map((chip) => chip.id) as string[],
  /** the lower half, and the names of the two planes */
  split: ['control', 'data', 'store', 'e-rollout-store'],
  meta: ['summary'],
  pack: ['e-store-packer'],
  /** the naive path's downstream half, dimmed while the driver is the point */
  downstream: ['packer', 'training', 'e-driver-packer', 'e-packer-training'],
};
