import { defineDiagram } from '@/lib/diagram';
import { INK } from '../quantities';

const e = (from: string, to: string) => ({ id: `e-${from}-${to}`, from, to });

/**
 * GAR's online grader, after Fig. 7(b) (§4.3.2), read left to right. Every
 * attempt of one mixed group goes to the Groupwise Grader together; it turns a
 * confirmed copy into a failure, ranks the passes that remain, and both results
 * feed the redistribution that scene 18 works through.
 *
 *   풀이 1 · 통과 ┐                    ┌ 베낀 풀이 → 0점 ┐
 *   풀이 2 · 통과 ┼→ Groupwise Grader ┤                 ├→ 차이 다시 나누기
 *   풀이 3 · 실패 ┘                    └ 통과한 풀이 순위 ┘
 *
 * Three attempts stand for the group of sixteen. The hack verdict is red (it
 * zeroes a score) and the output wears the ink of the gap from the average.
 */
export const garDiagram = defineDiagram({
  id: 'mimo-v26-rl-gar',
  direction: 'LR',
  layout: { rankGap: 84, nodeGap: 44 },
  nodes: [
    { id: 't1', kind: 'io', label: '풀이 1 · 통과', variant: 'io' },
    { id: 't2', kind: 'io', label: '풀이 2 · 통과', variant: 'io' },
    { id: 't3', kind: 'io', label: '풀이 3 · 실패', variant: 'io' },
    { id: 'gg', label: 'Groupwise Grader', variant: 'default' },
    { id: 'hack', kind: 'op', label: '베낀 풀이 → 0점', variant: INK.neg },
    { id: 'rank', kind: 'op', label: '통과한 풀이 순위', variant: 'op' },
    { id: 'out', label: '차이 다시 나누기', variant: INK.A },
  ],
  edges: [e('t1', 'gg'), e('t2', 'gg'), e('t3', 'gg'), e('gg', 'hack'), e('gg', 'rank'), e('hack', 'out'), e('rank', 'out')],
});

/** reveal bundles per beat — the three attempts and the Grader are in none of them (the frame-0 anchor) */
export const garIds = {
  attempts: ['t1', 't2', 't3'],
  intoGrader: ['e-t1-gg', 'e-t2-gg', 'e-t3-gg'],
  hack: ['e-gg-hack', 'hack'],
  rank: ['e-gg-rank', 'rank'],
  redistribute: ['e-hack-out', 'e-rank-out', 'out'],
  intoOut: ['e-hack-out', 'e-rank-out'],
};
