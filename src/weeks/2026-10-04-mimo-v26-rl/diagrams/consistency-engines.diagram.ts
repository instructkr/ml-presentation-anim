import { defineDiagram } from '@/lib/diagram';
import { INK } from '../quantities';

/**
 * The same token through the two engines (§6.4), and the three places where
 * Training is made to see what Rollout saw:
 *
 *          ┌ Rollout · SGLang ────────────────────────────────────────┐
 *      ┌──▶│ Router ──▶ Expert · MXFP4 ──▶ top-p ──────▶ 확률 μ       │
 *      │   └───┼──────────────┼──────────────┼────────────────────────┘
 *   토큰       R3            QDQ          후보 집합
 *      │   ┌───▼──────────────┼──────────────▼────────────────────────┐
 *      └──▶│ Router ──▶ Expert · FP32 ───▶ 전체 어휘 ──▶ 확률 π       │
 *          └ Training · Megatron-LM ──────────────────────────────────┘
 *
 * Each row is one engine's path from a token to its probability: the Router
 * picks Experts, the Experts compute, and the probability is taken over a set
 * of candidates — the top-p set in Rollout, the whole vocabulary in Training.
 * The two probabilities wear the inks of Eq. 1 (μ grey, π teal). R3 and 후보
 * 집합 are things Rollout wrote down, so they wear the record ink and their
 * links point down; QDQ is not a record but a rounding both sides share, so it
 * stays grey and its link has no arrowhead.
 *
 * Hand-positioned: the column pitch leaves room for the Training box's label
 * chip between the first two links.
 */

/** place a node by its centre */
const at = (cx: number, cy: number, w: number, h: number) => ({
  size: { w, h },
  position: { x: Math.round(cx - w / 2), y: Math.round(cy - h / 2) },
});

const NODE = { w: 290, h: 92 };
const LINK = { w: 190, h: 64 };
const TOKEN = { w: 150, h: 66 };
const PITCH = 372;
/** column centres */
const X_TOKEN = 20 + TOKEN.w / 2;
const X0 = 405;
const X = { router: X0, expert: X0 + PITCH, pool: X0 + PITCH * 2, prob: X0 + PITCH * 3 };
/** row centres */
const Y = { rollout: 136, link: 330, train: 524 };
/** engine box padding; the top one leaves room for the label chip (fit rule 9) */
const PAD = { x: 28, top: 50, bottom: 26 };

const box = (cy: number) => ({
  x: X.router - NODE.w / 2 - PAD.x,
  y: cy - NODE.h / 2 - PAD.top,
  w: X.prob - X.router + NODE.w + PAD.x * 2,
  h: NODE.h + PAD.top + PAD.bottom,
});

const e = (from: string, to: string, extra?: Record<string, unknown>) => ({ id: `e-${from}-${to}`, from, to, ...extra });

/** one engine's row: Router → Expert → candidates → probability */
const row = (p: 'r' | 't', cy: number, parent: string, expert: string, pool: string, prob: string, ink: string) => [
  { id: `${p}-router`, label: 'Router', variant: 'default', parent, ...at(X.router, cy, NODE.w, NODE.h) },
  { id: `${p}-expert`, label: expert, variant: 'default', parent, ...at(X.expert, cy, NODE.w, NODE.h) },
  { id: `${p}-pool`, kind: 'op' as const, label: pool, variant: 'op', parent, ...at(X.pool, cy, NODE.w, NODE.h) },
  { id: `${p}-prob`, kind: 'op' as const, label: prob, variant: ink, parent, ...at(X.prob, cy, NODE.w, NODE.h) },
];
const rowEdges = (p: 'r' | 't') => [e(`${p}-router`, `${p}-expert`), e(`${p}-expert`, `${p}-pool`), e(`${p}-pool`, `${p}-prob`)];

/** a link between the two rows: what is made the same at that stage */
const link = (id: string, label: string, variant: string, cx: number) => ({
  id,
  kind: 'op' as const,
  label,
  variant,
  ...at(cx, Y.link, LINK.w, LINK.h),
});

export const engines = defineDiagram({
  id: 'mimo-v26-rl-two-engines',
  direction: 'LR',
  groups: [
    { id: 'g-rollout', label: 'Rollout · SGLang', rect: box(Y.rollout) },
    { id: 'g-train', label: 'Training · Megatron-LM', rect: box(Y.train) },
  ],
  nodes: [
    { id: 'token', kind: 'io', label: '토큰', variant: 'io', ...at(X_TOKEN, Y.link, TOKEN.w, TOKEN.h) },
    ...row('r', Y.rollout, 'g-rollout', 'Expert · MXFP4', 'top-p', '확률 μ', INK.mu),
    ...row('t', Y.train, 'g-train', 'Expert · FP32', '전체 어휘', '확률 π', INK.pi),
    link('qdq', 'QDQ', 'op', X.expert),
    link('r3', 'R3', INK.record, X.router),
    link('set', '후보 집합', INK.record, X.pool),
  ],
  edges: [
    // the same token goes into both engines
    e('token', 'r-router', { waypoints: [{ x: X_TOKEN, y: Y.rollout }] }),
    e('token', 't-router', { waypoints: [{ x: X_TOKEN, y: Y.train }] }),
    ...rowEdges('r'),
    ...rowEdges('t'),
    // the weights are rounded the same way on both sides: nothing travels, so no arrowheads
    e('r-expert', 'qdq', { arrow: false, style: 'dashed' }),
    e('qdq', 't-expert', { arrow: false, style: 'dashed' }),
    // what Rollout wrote down is handed to Training
    e('r-router', 'r3', { arrow: false, color: INK.record }),
    e('r3', 't-router', { color: INK.record }),
    e('r-pool', 'set', { arrow: false, color: INK.record }),
    e('set', 't-pool', { color: INK.record }),
  ],
});

/** id bundles per beat — `token`, its two edges and the two engine boxes are in none of them (the frame-0 anchor) */
export const enginesIds = {
  /** both rows, in the order a token passes through them */
  rows: [
    'r-router',
    't-router',
    'e-r-router-r-expert',
    'e-t-router-t-expert',
    'r-expert',
    't-expert',
    'e-r-expert-r-pool',
    'e-t-expert-t-pool',
    'r-pool',
    't-pool',
    'e-r-pool-r-prob',
    'e-t-pool-t-prob',
    'r-prob',
    't-prob',
  ],
  probs: ['r-prob', 't-prob'],
  weights: { reveal: ['e-r-expert-qdq', 'qdq', 'e-qdq-t-expert'], look: ['r-expert', 't-expert', 'qdq'] },
  route: { reveal: ['e-r-router-r3', 'r3', 'e-r3-t-router'], look: ['r-router', 't-router', 'r3'] },
  nucleus: { reveal: ['e-r-pool-set', 'set', 'e-set-t-pool'], look: ['r-pool', 't-pool', 'set'] },
};
