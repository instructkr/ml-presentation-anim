import React from 'react';
import { defineScene, step } from '@/lib/timeline';
import { Board, Captions, DiagramView } from '@/lib/kit';
import { midtrainDiagram, midtrainIds } from '../diagrams/prep-midtrain.diagram';

/**
 * §3.2 — what Mid-training does between pre-training and RL. A figure
 * walkthrough: the training order is on screen from frame 0, and each beat
 * hangs one more of the stage's four jobs under Mid-training.
 */
export const midtrainScene = defineScene(
  {
    id: '01-midtrain',
    title: 'RL 전에 무엇을 준비할까?',
    steps: [
      step('bridge', 2.2),
      step('data', 2.4),
      step('context', 2.4),
      step('optimizer', 2.4),
      step('qat', 2.6, { hold: 0.6 }),
    ],
  },
  () => (
    <Board
      title="RL 전에 무엇을 준비할까?"
      source="MiMo-V2.6 §3.2"
      figure={
        <DiagramView
          diagram={midtrainDiagram}
          stepEffects={{
            // the four stages are in no reveal → on screen from frame 0 (the anchor)
            bridge: { highlight: ['mid'], pulse: ['e-pre-mid', 'e-mid-sft'] },
            data: { reveal: midtrainIds.data, highlight: ['data'] },
            context: { reveal: midtrainIds.context, highlight: ['ctx'] },
            optimizer: { reveal: midtrainIds.optimizer, highlight: ['opt'] },
            qat: { reveal: midtrainIds.qat, highlight: ['qat'] },
          }}
        />
      }
      caption={
        <Captions
          items={[
            { step: 'bridge', text: <>Mid-training이 pre-training과 RL 사이를 잇습니다</> },
            { step: 'data', text: <>agent가 실제로 일한 기록을 섞어서 학습합니다</> },
            { step: 'context', text: <>문맥 길이를 256K에서 1M으로 늘립니다</> },
            { step: 'optimizer', text: <>옵티마이저를 AdamW에서 Muown으로 바꿉니다</> },
            { step: 'qat', text: <>4비트 계산에도 미리 익숙해지게 합니다</> },
          ]}
        />
      }
    />
  ),
);

export default midtrainScene;
