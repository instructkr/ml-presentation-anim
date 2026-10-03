import { defineDiagram } from '@/lib/diagram';
import { INK } from '../quantities';

/**
 * MOPD2's first half, Fig. 13 (a) and (b), as a small scene diagram (§5.6).
 *
 *   채점할 수 있는 과제 → mixRL Teacher        채점하기 어려운 과제 → SFT Teacher
 *                              └──────────┐  ┌──────────────────────────┘
 *   Student → Student가 쓴 풀이 ────────→ OPD → Student 갱신
 *
 * Top row: a Teacher is trained per domain, by one of two routes. Bottom row:
 * the Student writes first, and the Teachers supervise what it wrote. Nodes
 * that stand for the Student are blue and the Teachers gold; the rest is grey.
 * Hand-positioned so both Teacher rails can drop into OPD side by side.
 */

/** place a node by its centre */
const at = (cx: number, cy: number, w: number, h: number) => ({
  size: { w, h },
  position: { x: Math.round(cx - w / 2), y: Math.round(cy - h / 2) },
});

const Y = { teachers: 70, student: 420 };
/** where the two Teacher rails turn toward OPD */
const RAIL_Y = 250;
const X = { verifiable: 190, mixrl: 565, open: 1000, sft: 1385, student: 150, rollout: 520, opd: 905, update: 1290 };
/** the rails land on OPD's top face, either side of its centre */
const DROP = 32;

const e = (from: string, to: string, extra?: Record<string, unknown>) => ({ id: `e-${from}-${to}`, from, to, ...extra });

export const opdDiagram = defineDiagram({
  id: 'mimo-v26-rl-opd',
  direction: 'LR',
  nodes: [
    // ── a Teacher per domain ────────────────────────────────────────────────
    { id: 'verifiable', kind: 'io', label: '채점할 수 있는 과제', variant: 'io', ...at(X.verifiable, Y.teachers, 330, 68) },
    { id: 'mixrl', label: 'mixRL Teacher', variant: INK.teacher, ...at(X.mixrl, Y.teachers, 300, 84) },
    { id: 'open', kind: 'io', label: '채점하기 어려운 과제', variant: 'io', ...at(X.open, Y.teachers, 340, 68) },
    { id: 'sft', label: 'SFT Teacher', variant: INK.teacher, ...at(X.sft, Y.teachers, 270, 84) },

    // ── the Student's line ──────────────────────────────────────────────────
    { id: 'student', label: 'Student', variant: INK.student, ...at(X.student, Y.student, 220, 84) },
    { id: 'rollout', kind: 'op', label: 'Student가 쓴 풀이', variant: INK.student, ...at(X.rollout, Y.student, 300, 72) },
    { id: 'opd', kind: 'op', label: 'OPD', variant: 'op', ...at(X.opd, Y.student, 170, 84) },
    { id: 'update', kind: 'op', label: 'Student 갱신', variant: INK.student, ...at(X.update, Y.student, 260, 72) },
  ],
  edges: [
    e('verifiable', 'mixrl'),
    e('open', 'sft'),
    e('student', 'rollout'),
    e('rollout', 'opd'),
    e('mixrl', 'opd', {
      waypoints: [
        { x: X.mixrl, y: RAIL_Y },
        { x: X.opd - DROP, y: RAIL_Y },
      ],
    }),
    e('sft', 'opd', {
      waypoints: [
        { x: X.sft, y: RAIL_Y },
        { x: X.opd + DROP, y: RAIL_Y },
      ],
    }),
    e('opd', 'update'),
  ],
});

/** reveal bundles per beat — `student`, `rollout` and their edge are in none (the frame-0 anchor) */
export const opdIds = {
  teachers: ['verifiable', 'e-verifiable-mixrl', 'mixrl', 'open', 'e-open-sft', 'sft'],
  mixrlBranch: ['verifiable', 'e-verifiable-mixrl', 'mixrl'],
  sftBranch: ['open', 'e-open-sft', 'sft'],
  writing: ['student', 'e-student-rollout', 'rollout'],
  teacherRails: ['e-mixrl-opd', 'e-sft-opd'],
  grade: ['e-rollout-opd', 'opd', 'e-mixrl-opd', 'e-sft-opd'],
  update: ['e-opd-update', 'update'],
};
