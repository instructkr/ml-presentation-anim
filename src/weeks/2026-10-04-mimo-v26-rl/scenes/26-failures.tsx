import React from 'react';
import { defineScene, step } from '@/lib/timeline';
import { Board, Captions, DiagramView } from '@/lib/kit';
import { failuresIds, failuresLoop } from '../diagrams/lessons-failures.diagram';
import { ELAPSED_HOURS, EP_PEAK_OVER_MEAN, RL_STEPS } from '../data/lessons-failures';

/**
 * §5.5, Fig. 12 — where the 30-step run was interrupted. The figure is one RL
 * step as a loop standing on its hardware, all of it on screen from frame 0;
 * each beat only points at the place one kind of failure happened (the four
 * causes of Fig. 12's legend), and the last beat gives the whole loop back
 * with the elapsed time. Every number in the phrases is the paper's, read
 * from `data/lessons-failures.ts`.
 */
const hours = (h: number) => Math.round(h);

export const failuresScene = defineScene(
  {
    id: '26-failures',
    title: '30 스텝 동안 어디서 멈췄을까?',
    steps: [
      step('infra', 2.4),
      step('rollout', 2.4),
      step('training', 2.4),
      step('driver', 2.4),
      step('time', 2.6, { hold: 0.6 }),
    ],
  },
  () => (
    <Board
      title="30 스텝 동안 어디서 멈췄을까?"
      source="MiMo-V2.6 §5.5, 그림 12"
      figure={
        <DiagramView
          diagram={failuresLoop}
          stepEffects={{
            // nothing is revealed: the loop and its hardware are the frame-0 anchor.
            // Hardware faults hit every module standing on it, so this beat dims nothing.
            infra: { highlight: ['infra', ...failuresIds.rails] },
            rollout: { highlight: ['rollout'], dim: 'others' },
            training: { highlight: ['training'], dim: 'others' },
            driver: { highlight: ['packing'], dim: 'others' },
            time: { pulse: failuresIds.loop },
          }}
        />
      }
      caption={
        <Captions
          items={[
            { step: 'infra', text: <>장비 고장은 주로 GPU 메모리 오류였습니다</> },
            { step: 'rollout', text: <>Rollout은 풀이 길이를 잘못 짐작해 메모리가 바닥났습니다</> },
            { step: 'training', text: <>Training은 Expert 한 곳에 토큰이 {EP_PEAK_OVER_MEAN}배 몰려 멈췄습니다</> },
            { step: 'driver', text: <>풀이가 길어지자 배치를 묶는 쪽 메모리도 넘쳤습니다</> },
            {
              step: 'time',
              text: (
                <>
                  그래도 Pro는 {hours(ELAPSED_HOURS.pro)}시간, Flash는 {hours(ELAPSED_HOURS.flash)}시간에 {RL_STEPS} 스텝을 마쳤습니다
                </>
              ),
            },
          ]}
        />
      }
    />
  ),
);

export default failuresScene;
