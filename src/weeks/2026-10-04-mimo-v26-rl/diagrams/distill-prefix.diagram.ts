import { defineDiagram } from '@/lib/diagram';
import { INK } from '../quantities';

/**
 * Prefix-Conditioned OPD, Fig. 13 (c), as a small scene diagram (§5.6).
 *
 *                 ┌→ 이력 1 → 다음 턴 1 ─┐        Teacher
 *   시범 풀이 하나 ─┼→ 이력 2 → 다음 턴 2 ─┼→ OPD ←───┘
 *                 │     ⋮          ⋮     │    └→ Student 갱신
 *                 └→ 이력 k → 다음 턴 k ─┘
 *
 * One finished trajectory is cut before each of its k assistant turns. Every
 * cut is a fixed history (maroon); the Student writes only the next turn after
 * it (blue), and the Teacher (gold) supervises that one turn. Three rows stand
 * for the k; the ⋮ row carries no edges. Hand-positioned so the fan-out and
 * fan-in run on shared rails.
 */

/** place a node by its centre */
const at = (cx: number, cy: number, w: number, h: number) => ({
  size: { w, h },
  position: { x: Math.round(cx - w / 2), y: Math.round(cy - h / 2) },
});

/** the three drawn rows (1, 2, k) and the ⋮ between the last two */
const ROW_Y = { '1': 190, '2': 370, k: 550 };
const DOTS_Y = 460;
const MID_Y = ROW_Y['2'];
const X = { demo: 150, prefix: 480, turn: 780, opd: 1070, update: 1345 };
/** shared rails: demo → prefixes, turns → OPD */
const FAN_OUT_X = 338;
const FAN_IN_X = 935;
/** above the first row, so the fan-in rail turns well clear of the Teacher's box */
const TEACHER_Y = 66;

const ROWS = ['1', '2', 'k'] as const;

const e = (from: string, to: string, extra?: Record<string, unknown>) => ({ id: `e-${from}-${to}`, from, to, ...extra });

export const prefixDiagram = defineDiagram({
  id: 'mimo-v26-rl-prefix-opd',
  direction: 'LR',
  nodes: [
    { id: 'demo', kind: 'io', label: '시범 풀이 하나', variant: 'io', ...at(X.demo, MID_Y, 270, 68) },

    ...ROWS.map((r) => ({
      id: `h${r}`,
      kind: 'op' as const,
      label: `이력 ${r}`,
      variant: INK.prefix,
      ...at(X.prefix, ROW_Y[r], 180, 72),
    })),
    { id: 'hdots', kind: 'annotation', label: '⋮', variant: 'annotation', ...at(X.prefix, DOTS_Y, 60, 44) },

    ...ROWS.map((r) => ({
      id: `y${r}`,
      kind: 'op' as const,
      label: `다음 턴 ${r}`,
      variant: INK.student,
      ...at(X.turn, ROW_Y[r], 210, 72),
    })),
    { id: 'ydots', kind: 'annotation', label: '⋮', variant: 'annotation', ...at(X.turn, DOTS_Y, 60, 44) },

    { id: 'teacher', label: 'Teacher', variant: INK.teacher, ...at(X.opd, TEACHER_Y, 220, 84) },
    { id: 'opd', kind: 'op', label: 'OPD', variant: 'op', ...at(X.opd, MID_Y, 170, 84) },
    { id: 'update', kind: 'op', label: 'Student 갱신', variant: INK.student, ...at(X.update, MID_Y, 260, 72) },
  ],
  edges: [
    // fan-out: the trajectory is cut into k histories
    ...ROWS.map((r) =>
      e('demo', `h${r}`, ROW_Y[r] === MID_Y ? {} : { waypoints: [{ x: FAN_OUT_X, y: MID_Y }, { x: FAN_OUT_X, y: ROW_Y[r] }] }),
    ),
    // one new turn per history
    ...ROWS.map((r) => e(`h${r}`, `y${r}`)),
    // fan-in: every turn is supervised
    ...ROWS.map((r) =>
      e(`y${r}`, 'opd', ROW_Y[r] === MID_Y ? {} : { waypoints: [{ x: FAN_IN_X, y: ROW_Y[r] }, { x: FAN_IN_X, y: MID_Y }] }),
    ),
    e('teacher', 'opd'),
    e('opd', 'update'),
  ],
});

/** reveal bundles per beat — `demo` and `teacher` are in none (the frame-0 anchor) */
export const prefixIds = {
  prefixes: ROWS.map((r) => `h${r}`),
  turns: ROWS.map((r) => `y${r}`),
  split: [...ROWS.map((r) => `e-demo-h${r}`), 'h1', 'h2', 'hdots', 'hk'],
  turn: [...ROWS.map((r) => `e-h${r}-y${r}`), 'y1', 'y2', 'ydots', 'yk'],
  writing: ROWS.map((r) => `e-h${r}-y${r}`),
  teach: [...ROWS.map((r) => `e-y${r}-opd`), 'opd', 'e-teacher-opd'],
  update: ['e-opd-update', 'update'],
};
