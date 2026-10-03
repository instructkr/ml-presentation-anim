import React from 'react';
import { defineScene, step } from '@/lib/timeline';
import { Board, Captions, DiagramView, Quantities, Term } from '@/lib/kit';
import { HACK_SHARE_CEILING } from '../data/environment-hack';
import { hackDefense, hackIds } from '../diagrams/environment-hack.diagram';

/**
 * §4.2.6, Fig. 6(a) — how the run keeps the model from earning its reward
 * without doing the task. The picture starts with the training step alone,
 * shows the shortcut reaching it (a fix fetched from outside the assigned
 * checkout), then adds the three defences in the order the paper applies
 * them: clean the environments, attack them with the Hack Agent until nothing
 * is left, and audit the rollouts while training. The last beat puts the
 * outcome on the figure.
 */
/** the shortcut is the one quantity here: red in the figure and in the phrases */
const QUANTITIES = { hack: 'red' } as const;

export const rewardHackingScene = defineScene(
  {
    id: '13-reward-hacking',
    title: '점수만 따는 꼼수를 어떻게 막을까?',
    steps: [step('leak', 2.6), step('clean', 2.6), step('attack', 2.6), step('audit', 2.8), step('rate', 2.4, { hold: 0.6 })],
  },
  () => (
    <Quantities map={QUANTITIES}>
      <Board
        title="점수만 따는 꼼수를 어떻게 막을까?"
        source="MiMo-V2.6 §4.2.6, 그림 6"
        figure={
          <DiagramView
            diagram={hackDefense}
            stepEffects={{
              // 'RL Training' is in no reveal → on screen from frame 0 (the anchor)
              leak: { reveal: hackIds.leak, highlight: ['leak'], pulse: ['e-leak-rl'] },
              clean: { reveal: hackIds.clean, highlight: ['prep'] },
              attack: { reveal: hackIds.attack, highlight: ['agent'], pulse: ['e-agent-prep'] },
              audit: { reveal: hackIds.audit, highlight: ['audit'], pulse: ['e-audit-prep'] },
              // the outcome lands on the figure; the last frame is the thumbnail, so nothing is dimmed
              rate: { reveal: hackIds.rate, highlight: ['audit'] },
            }}
          />
        }
        caption={
          <Captions
            items={[
              { step: 'leak', text: <>모델은 이미 고쳐진 코드를 <Term of="hack">밖에서 찾아와</Term> 통과하기도 합니다</> },
              { step: 'clean', text: <>그래서 학습 전에 정답의 흔적을 지우고 인터넷을 끊습니다</> },
              { step: 'attack', text: <>Hack Agent가 남은 구멍을 찾고, 찾으면 다시 막습니다</> },
              { step: 'audit', text: <>학습 중에도 풀이를 감사해서 <Term of="hack">꼼수</Term>는 0점으로 돌립니다</> },
              { step: 'rate', text: <>그 결과 <Term of="hack">꼼수</Term> 비율이 학습 내내 {HACK_SHARE_CEILING}% 아래였습니다</> },
            ]}
          />
        }
      />
    </Quantities>
  ),
);

export default rewardHackingScene;
