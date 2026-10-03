import React from 'react';
import { defineScene, step } from '@/lib/timeline';
import { Board, Captions, DiagramView, Quantities, Term } from '@/lib/kit';
import { garDiagram, garIds } from '../diagrams/grading-gar.diagram';
import { pick } from '../quantities';

/**
 * §4.3.2, Fig. 7(b) — what GAR's online grader does with one mixed group before
 * any number changes: it looks at every attempt together, turns a confirmed copy
 * into a failure, and ranks the passes that are left. Scene 18 does the
 * redistribution those two results feed.
 */
const QUANTITIES = pick('A');

export const garGraderScene = defineScene(
  {
    id: '17-gar-grader',
    title: 'Grader는 그룹을 어떻게 볼까?',
    steps: [step('together', 2.6), step('hack', 2.6), step('rank', 2.6), step('redistribute', 2.8, { hold: 0.6 })],
  },
  () => (
    <Quantities map={QUANTITIES}>
      <Board
        title="Grader는 그룹을 어떻게 볼까?"
        source="MiMo-V2.6 §4.3.2, 그림 7 (b)"
        figure={
          <DiagramView
            diagram={garDiagram}
            stepEffects={{
              // the three attempts and the Grader are in no reveal → on screen from frame 0 (the anchor)
              together: { reveal: garIds.intoGrader, highlight: ['gg'], pulse: garIds.intoGrader },
              hack: { reveal: garIds.hack, highlight: ['hack'] },
              rank: { reveal: garIds.rank, highlight: ['rank'] },
              redistribute: { reveal: garIds.redistribute, highlight: ['out'], pulse: garIds.intoOut },
            }}
          />
        }
        caption={
          <Captions
            items={[
              { step: 'together', text: <>Groupwise Grader가 한 그룹의 풀이를 한자리에 놓고 봅니다</> },
              { step: 'hack', text: <>답을 베낀 풀이는 0점으로 돌리고 실패로 칩니다</> },
              { step: 'rank', text: <>남은 통과 풀이는 품질 순서로 줄을 세웁니다</> },
              { step: 'redistribute', text: <>이 순서대로 <Term of="A">평균과의 차이</Term>를 다시 나눕니다</> },
            ]}
          />
        }
      />
    </Quantities>
  ),
);

export default garGraderScene;
