import React from 'react';
import { defineScene, step } from '@/lib/timeline';
import { Board, Captions, DiagramView, Quantities, Term } from '@/lib/kit';
import { opdDiagram, opdIds } from '../diagrams/distill-opd.diagram';
import { pick } from '../quantities';

/**
 * §5.6, Fig. 13 (a) and (b) — MOPD2's first half: a Teacher per domain, and
 * on-policy distillation. The Student writes first; the Teachers then say, token
 * by token, what they would have written in its place. The Student and its
 * rollout are on screen from frame 0; the Teachers arrive in beat 1.
 */
const QUANTITIES = pick('student', 'teacher');

export const opdScene = defineScene(
  {
    id: '27-opd',
    title: 'RL로 못 가르치는 분야는 어떻게 할까?',
    steps: [step('teachers', 2.8), step('kinds', 2.4), step('write', 2.2), step('grade', 2.8), step('update', 2.6, { hold: 0.6 })],
  },
  () => (
    <Quantities map={QUANTITIES}>
      <Board
        title="RL로 못 가르치는 분야는 어떻게 할까?"
        source="MiMo-V2.6 §5.6, 그림 13 (a)(b)"
        figure={
          <DiagramView
            diagram={opdDiagram}
            stepEffects={{
              // 'student', 'rollout' and their edge are in no reveal → on screen from frame 0 (the anchor)
              teachers: { reveal: opdIds.teachers, highlight: ['mixrl', 'sft'] },
              kinds: { highlight: opdIds.sftBranch, pulse: ['e-open-sft'], dim: opdIds.mixrlBranch },
              write: { highlight: ['student', 'rollout'], pulse: ['e-student-rollout'] },
              grade: { reveal: opdIds.grade, highlight: ['opd'], pulse: opdIds.teacherRails },
              update: { reveal: opdIds.update, highlight: ['update'], pulse: ['e-opd-update'] },
            }}
          />
        }
        caption={
          <Captions
            items={[
              { step: 'teachers', text: <>분야마다 <Term of="teacher">Teacher</Term> 모델을 따로 키워 둡니다</> },
              { step: 'kinds', text: <>채점이 어려운 분야의 <Term of="teacher">Teacher</Term>는 시범 데이터로 만듭니다</> },
              { step: 'write', text: <><Term of="student">Student</Term>가 먼저 직접 풉니다</> },
              { step: 'grade', text: <><Term of="teacher">Teacher</Term>는 토큰마다 자기라면 어떻게 썼을지 알려 줍니다</> },
              { step: 'update', text: <><Term of="student">Student</Term>는 자기가 실제로 틀리는 자리에서 배웁니다</> },
            ]}
          />
        }
      />
    </Quantities>
  ),
);

export default opdScene;
