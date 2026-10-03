import React from 'react';
import { defineScene, step } from '@/lib/timeline';
import { Board, Captions, DiagramView } from '@/lib/kit';
import { router, routerIds } from '../diagrams/router.diagram';

/**
 * Recipe 2 · figure walkthrough — a left-to-right diagram in the wide `stack`
 * cell, one phrase per beat underneath. No equation: the picture does the work.
 */
export const routerWalkScene = defineScene(
  {
    id: '02-router-walk',
    title: '누가 이 토큰을 맡을까?',
    steps: [step('score', 2.4), step('pick', 2.4), step('mix', 2.6, { hold: 0.6 })],
  },
  () => (
    <Board
      title="누가 이 토큰을 맡을까?"
      source="Mixture of Experts"
      figure={
        <DiagramView
          diagram={router}
          stepEffects={{
            // '토큰' and 'Router' are in no reveal → on screen from frame 0 (the anchor)
            score: {
              reveal: [...routerIds.experts, ...routerIds.scores],
              highlight: ['router'],
              pulse: routerIds.scores,
            },
            pick: { highlight: routerIds.chosen, dim: routerIds.skipped },
            mix: { reveal: routerIds.output, pulse: ['e-expert-1-mix', 'e-expert-3-mix'], dim: routerIds.skipped },
          }}
        />
      }
      caption={
        <Captions
          items={[
            { step: 'score', text: <>Router가 Expert마다 점수를 매깁니다</> },
            { step: 'pick', text: <>점수가 높은 Expert 두 개만 일을 합니다</> },
            { step: 'mix', text: <>두 Expert의 출력을 점수만큼 섞어서 내보냅니다</> },
          ]}
        />
      }
    />
  ),
);

export default routerWalkScene;
