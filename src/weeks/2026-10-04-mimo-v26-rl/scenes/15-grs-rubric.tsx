import React from 'react';
import { defineScene, step } from '@/lib/timeline';
import { Board, Captions, DiagramView, Quantities, Term } from '@/lib/kit';
import { grsDiagram, grsIds } from '../diagrams/grading-grs.diagram';
import { pick } from '../quantities';

/**
 * §4.3.1, Fig. 7(a) — where GRS's two rubric scores come from. A figure
 * walkthrough: before training an agent compares several attempts at one task
 * and writes two rubrics; during training a grader reuses them on every new
 * attempt. The scores it returns are what scene 16 multiplies into the reward.
 */
const QUANTITIES = pick('sol', 'beh');

export const grsRubricScene = defineScene(
  {
    id: '15-grs-rubric',
    title: '통과한 풀이끼리는 어떻게 가릴까?',
    steps: [step('compare', 2.6), step('rubric', 2.8), step('reuse', 2.8), step('scores', 2.6, { hold: 0.6 })],
  },
  () => (
    <Quantities map={QUANTITIES}>
      <Board
        title="통과한 풀이끼리는 어떻게 가릴까?"
        source="MiMo-V2.6 §4.3.1, 그림 7 (a)"
        figure={
          <DiagramView
            diagram={grsDiagram}
            stepEffects={{
              // the attempts and Build Rubrics are in no reveal → on screen from frame 0 (the anchor)
              compare: { reveal: grsIds.compare, highlight: ['rollouts', 'build'], pulse: grsIds.compare },
              rubric: { reveal: grsIds.rubrics, highlight: ['sol', 'beh'] },
              reuse: { reveal: grsIds.reuse, highlight: ['grader'], pulse: grsIds.intoGrader },
              scores: { reveal: grsIds.scores, highlight: ['scores'] },
            }}
          />
        }
        caption={
          <Captions
            items={[
              { step: 'compare', text: <>같은 과제의 풀이 여러 개를 나란히 놓고 비교합니다</> },
              { step: 'rubric', text: <>거기서 채점 기준인 rubric을 두 벌 만듭니다</> },
              { step: 'reuse', text: <>학습 중에는 이 rubric으로 새 풀이를 하나씩 채점합니다</> },
              { step: 'scores', text: <>풀이마다 <Term of="sol">결과물 점수</Term>와 <Term of="beh">일하는 방식 점수</Term>가 나옵니다</> },
            ]}
          />
        }
      />
    </Quantities>
  ),
);

export default grsRubricScene;
