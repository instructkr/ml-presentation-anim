import React from 'react';
import { defineScene, step } from '@/lib/timeline';
import { Board, Captions, DiagramView, Quantities, Term } from '@/lib/kit';
import { prefixDiagram, prefixIds } from '../diagrams/distill-prefix.diagram';
import { pick } from '../quantities';

/**
 * §5.6, Fig. 13 (c) — Prefix-Conditioned OPD. A finished trajectory is cut
 * before each of its k assistant turns; the Student writes only the next turn
 * after each fixed history, and the Teacher supervises that one turn. The
 * trajectory and the Teacher are on screen from frame 0.
 */
const QUANTITIES = pick('student', 'teacher', 'prefix');

export const prefixOpdScene = defineScene(
  {
    id: '28-prefix-opd',
    title: '왜 이력을 고정할까?',
    steps: [step('drift', 2.4), step('split', 2.8), step('turn', 2.6), step('teach', 2.8), step('reach', 2.6, { hold: 0.6 })],
  },
  () => (
    <Quantities map={QUANTITIES}>
      <Board
        title="왜 이력을 고정할까?"
        source="MiMo-V2.6 §5.6, 그림 13 (c)"
        figure={
          <DiagramView
            diagram={prefixDiagram}
            stepEffects={{
              // 'demo' and 'teacher' are in no reveal → on screen from frame 0 (the anchor)
              drift: { highlight: ['teacher'] },
              split: { reveal: prefixIds.split, highlight: ['demo', ...prefixIds.prefixes] },
              turn: { reveal: prefixIds.turn, highlight: prefixIds.turns, pulse: prefixIds.writing },
              teach: { reveal: prefixIds.teach, highlight: ['teacher', 'opd'], pulse: ['e-teacher-opd'] },
              reach: { reveal: prefixIds.update, highlight: ['update'], pulse: ['e-opd-update'] },
            }}
          />
        }
        caption={
          <Captions
            items={[
              { step: 'drift', text: <>길게 풀다 보면 <Term of="teacher">Teacher</Term>가 본 적 없는 곳까지 벗어납니다</> },
              { step: 'split', text: <>그래서 시범 풀이를 턴마다 잘라 <Term of="prefix">이력 k개</Term>를 만듭니다</> },
              { step: 'turn', text: <><Term of="student">Student</Term>는 이력마다 <Term of="student">다음 턴 하나</Term>만 씁니다</> },
              { step: 'teach', text: <>그 한 턴을 <Term of="teacher">Teacher</Term>가 토큰 단위로 가르칩니다</> },
              { step: 'reach', text: <>이렇게 채점이 어려운 게임 개발, 과학 연구까지 넓혔습니다</> },
            ]}
          />
        }
      />
    </Quantities>
  ),
);

export default prefixOpdScene;
