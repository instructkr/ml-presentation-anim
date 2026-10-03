import { defineDiagram } from '@/lib/diagram';
import { INK } from '../quantities';

const e = (from: string, to: string) => ({ id: `e-${from}-${to}`, from, to });

/**
 * GRS, after Fig. 7(a) (§4.3.1), read left to right. Before training, one agent
 * compares several attempts at the same task and writes two rubrics; during
 * training a grader reuses them on every new attempt and returns two scores.
 *
 *   미리 풀어 본 풀이들 → Build Rubrics → Solution rubric ┐
 *                                        Behavior rubric ┴→ Rubric Grader → 점수 두 개
 *                                           새 풀이 하나 ┘
 *
 * The two rubrics wear the inks of the scores they produce (S^sol teal, S^beh
 * purple), so scene 16's equation picks the same colours up. Module names stay
 * as the figure writes them; the attempts and the scores are plain values.
 */
export const grsDiagram = defineDiagram({
  id: 'mimo-v26-rl-grs',
  direction: 'LR',
  layout: { rankGap: 76, nodeGap: 40 },
  nodes: [
    { id: 'rollouts', kind: 'io', label: '미리 풀어 본 풀이들', variant: 'io' },
    { id: 'build', label: 'Build Rubrics', variant: 'default' },
    { id: 'sol', label: 'Solution rubric', variant: INK.sol },
    { id: 'beh', label: 'Behavior rubric', variant: INK.beh },
    { id: 'tau', kind: 'io', label: '새 풀이 하나', variant: 'io' },
    { id: 'grader', label: 'Rubric Grader', variant: 'default' },
    { id: 'scores', kind: 'io', label: '점수 두 개', variant: 'io' },
  ],
  edges: [
    e('rollouts', 'build'),
    e('build', 'sol'),
    e('build', 'beh'),
    e('sol', 'grader'),
    e('beh', 'grader'),
    e('tau', 'grader'),
    e('grader', 'scores'),
  ],
});

/** reveal bundles per beat — `rollouts` and `build` are in none of them (the frame-0 anchor) */
export const grsIds = {
  compare: ['e-rollouts-build'],
  rubrics: ['e-build-sol', 'e-build-beh', 'sol', 'beh'],
  reuse: ['tau', 'grader', 'e-sol-grader', 'e-beh-grader', 'e-tau-grader'],
  intoGrader: ['e-sol-grader', 'e-beh-grader', 'e-tau-grader'],
  scores: ['e-grader-scores', 'scores'],
};
