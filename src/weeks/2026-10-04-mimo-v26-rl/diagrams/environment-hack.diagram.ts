import { defineDiagram } from '@/lib/diagram';
import { HACK_SHARE_CEILING } from '../data/environment-hack';

/**
 * Reward-hacking prevention, after Fig. 6(a) (§4.2.6).
 *
 *            밖에서 가져온 정답                    확인된 꼼수 2% 미만
 *                    ┊                                   ┊
 *   환경 정리 ──▶ RL Training ──────────────▶ 풀이 감사
 *     │  ▲  ▲                                        │
 *     ▼  │  └──────────────── 새 구멍 ───────────────┘
 *   Hack Agent
 *
 * The main line reads left to right: prepare the environments, train, audit
 * the rollouts. The Hack Agent sits under the preparation step as its tester —
 * it probes the prepared environments and hands what it finds back, round
 * after round — and the audits feed the same step from the other end. The leak
 * is the one coloured node: it is the thing the rest of the figure is built to
 * keep out.
 *
 * Hand-positioned so the two return paths run on rails. Labels are names only.
 */

/** place a node by its centre */
const at = (cx: number, cy: number, w: number, h: number) => ({
  size: { w, h },
  position: { x: Math.round(cx - w / 2), y: Math.round(cy - h / 2) },
});

// ── geometry ────────────────────────────────────────────────────────────────
const X = { prep: 170, rl: 700, audit: 1230 };
const Y = { top: 96, row: 300, agent: 540 };
const H = 84;
const W = { prep: 280, rl: 300, audit: 280, agent: 280 };
/** the rail that carries the audits' findings back, between the row and the Hack Agent */
const RAIL_Y = 430;
/** where each path meets the bottom face of 환경 정리: out to the agent, back from it, back from the audits */
const LANE = { down: X.prep - 50, up: X.prep + 30, rail: X.prep + 105 };
const MID_Y = (Y.row + H / 2 + Y.agent - H / 2) / 2;

export const hackDefense = defineDiagram({
  id: 'mimo-v26-rl-hack-defense',
  direction: 'LR',
  nodes: [
    // ── the main line ───────────────────────────────────────────────────────
    { id: 'prep', label: '환경 정리', variant: 'default', ...at(X.prep, Y.row, W.prep, H) },
    { id: 'rl', label: 'RL Training', variant: 'default', ...at(X.rl, Y.row, W.rl, H) },
    { id: 'audit', label: '풀이 감사', variant: 'default', ...at(X.audit, Y.row, W.audit, H) },
    // ── what it is defending against ────────────────────────────────────────
    { id: 'leak', kind: 'op', label: '밖에서 가져온 정답', variant: 'red', ...at(X.rl, Y.top, 340, 72) },
    // ── the tester of the prepared environments ─────────────────────────────
    { id: 'agent', label: 'Hack Agent', variant: 'default', ...at(X.prep, Y.agent, W.agent, H) },
    // ── the outcome, read off the audits ────────────────────────────────────
    {
      id: 'rate',
      kind: 'annotation',
      label: `확인된 꼼수 ${HACK_SHARE_CEILING}% 미만`,
      variant: 'annotation',
      ...at(X.audit, Y.top, 300, 52),
    },
  ],
  edges: [
    { id: 'e-leak-rl', from: 'leak', to: 'rl', style: 'dashed', color: 'red' },
    { id: 'e-prep-rl', from: 'prep', to: 'rl' },
    { id: 'e-rl-audit', from: 'rl', to: 'audit' },
    // the probe goes down one lane and its findings come back up the next
    { id: 'e-prep-agent', from: 'prep', to: 'agent', waypoints: [{ x: LANE.down, y: MID_Y }] },
    { id: 'e-agent-prep', from: 'agent', to: 'prep', waypoints: [{ x: LANE.up, y: MID_Y }] },
    {
      id: 'e-audit-prep',
      from: 'audit',
      to: 'prep',
      label: '새 구멍',
      // the label sits on the rail between RL Training and 풀이 감사
      labelPos: 0.3,
      waypoints: [
        { x: X.audit, y: RAIL_Y },
        { x: LANE.rail, y: RAIL_Y },
      ],
    },
    { id: 'e-audit-rate', from: 'audit', to: 'rate', style: 'dotted', arrow: false },
  ],
});

/** reveal bundles per beat — `rl` is in none of them (the frame-0 anchor) */
export const hackIds = {
  leak: ['leak', 'e-leak-rl'],
  clean: ['prep', 'e-prep-rl'],
  attack: ['agent', 'e-prep-agent', 'e-agent-prep'],
  audit: ['audit', 'e-rl-audit', 'e-audit-prep'],
  rate: ['e-audit-rate', 'rate'],
};
