import React from 'react';
import { defineScene, step } from '@/lib/timeline';
import { Board, Captions, DiagramView, Quantities, Term } from '@/lib/kit';
import { RL_SCALE, SEQUENCES_PER_STEP, eok, manCheon } from '../data/objective-rl-scale';
import { rlStep, rlStepIds } from '../diagrams/objective-rl-step.diagram';
import { pick } from '../quantities';

/**
 * §4.1 — one RL step as a loop: the same task is attempted 16 times, the
 * Grader scores every attempt, Training nudges the model toward the better
 * attempts, and the new weights go back to the Rollout side. The paper runs
 * this loop 30 times. Figure walkthrough, no equation: the numbers in the
 * phrases are the paper's (1,568 × 16 ≈ 25K attempts, 2.7–3.7B tokens a step)
 * and are read from data/objective-rl-scale.ts.
 */
const QUANTITIES = pick('R');

export const rlStepScene = defineScene(
  {
    id: '04-rl-step',
    title: 'RL 한 스텝은 어떻게 돌까?',
    steps: [step('rollout', 2.4), step('grade', 2.6), step('train', 2.6), step('loop', 2.8), step('scale', 2.6, { hold: 0.6 })],
  },
  () => (
    <Quantities map={QUANTITIES}>
      <Board
        title="RL 한 스텝은 어떻게 돌까?"
        source="MiMo-V2.6 §4.1, §5.1"
        figure={
          <DiagramView
            diagram={rlStep}
            stepEffects={{
              // '과제' and 'Rollout' are in no reveal → on screen from frame 0 (the anchor)
              rollout: { reveal: rlStepIds.rollout, highlight: ['rollout'], pulse: ['e-rollout-tries'] },
              grade: { reveal: rlStepIds.grade, highlight: ['grader'], pulse: ['e-grader-scores'] },
              train: { reveal: rlStepIds.train, highlight: ['train'], pulse: ['e-scores-train'] },
              loop: { reveal: rlStepIds.loop, highlight: ['rollout'], pulse: ['e-train-rollout'] },
              scale: { highlight: ['tries'], pulse: rlStepIds.ring },
            }}
          />
        }
        caption={
          <Captions
            items={[
              { step: 'rollout', text: <>같은 과제를 {RL_SCALE.G}번 풀게 합니다</> },
              { step: 'grade', text: <>Grader가 풀이마다 <Term of="R">점수</Term>를 매깁니다</> },
              { step: 'train', text: <><Term of="R">점수</Term>가 높은 풀이가 더 자주 나오도록 모델을 고칩니다</> },
              { step: 'loop', text: <>고친 모델로 다시 풉니다. 이 고리를 {RL_SCALE.steps}번 돕니다</> },
              {
                step: 'scale',
                text: <>한 바퀴에 풀이 {manCheon(SEQUENCES_PER_STEP)} 개, 토큰 {eok(RL_SCALE.tokens[0])}에서 {eok(RL_SCALE.tokens[1])} 개가 들어갑니다</>,
              },
            ]}
          />
        }
      />
    </Quantities>
  ),
);

export default rlStepScene;
