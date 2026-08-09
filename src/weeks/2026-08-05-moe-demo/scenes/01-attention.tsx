import React from 'react';
import { Appear, defineScene, step } from '@/lib/timeline';
import { Callout, DiagramView, SlideFrame, Stack, Tex, WalkthroughStage } from '@/lib/kit';
import { attentionDetail } from '../diagrams/attention-detail.diagram';

export const attentionScene = defineScene(
  {
    id: '01-attention',
    title: 'Attention 내부 동작',
    steps: [
      step('qkv', 2.2),
      step('scores', 2.4),
      step('softmax', 2.2),
      step('output', 2.4, { hold: 0.5 }),
    ],
  },
  () => (
    <SlideFrame title="Multi-Head Attention" footer="ML Weekly · MoE 해부">
      <WalkthroughStage
        visual={
          <DiagramView
            diagram={attentionDetail}
            stepEffects={{
              // 'x' stays out of every reveal — the frame-0 anchor (hard rule 6)
              qkv: {
                reveal: ['wq', 'wk', 'wv', 'q', 'k', 'v', 'e-x-wq', 'e-x-wk', 'e-x-wv', 'e-wq-q', 'e-wk-k', 'e-wv-v'],
                highlight: ['wq', 'wk', 'wv'],
                camera: { focus: ['x', 'wq', 'wk', 'wv', 'q', 'k', 'v'], padding: 70, maxScale: 1.16 },
              },
              scores: {
                reveal: ['scores', 'e-q-scores', 'e-k-scores'],
                highlight: ['q', 'k', 'scores'],
                camera: { focus: ['q', 'k', 'scores'], padding: 78, maxScale: 1.24 },
              },
              softmax: {
                reveal: ['softmax', 'e-scores-softmax'],
                highlight: ['softmax'],
                camera: { focus: ['scores', 'softmax'], padding: 86, maxScale: 1.28 },
              },
              output: {
                reveal: ['weighted', 'out', 'e-softmax-weighted', 'e-v-weighted', 'e-weighted-out'],
                highlight: ['weighted'],
                camera: { focus: ['softmax', 'v', 'weighted', 'out'], padding: 78, maxScale: 1.2 },
              },
            }}
          />
        }
        explanation={
          <Stack gap={4}>
            <Appear step="scores" effect="rise">
              <Tex display size="lg">{'S = \\frac{QK^{\\top}}{\\sqrt{d_k}}'}</Tex>
            </Appear>
            <Appear step="softmax" effect="rise">
              <Tex display size="lg">{'A = \\mathrm{softmax}(S)'}</Tex>
            </Appear>
            <Appear step="output" effect="rise">
              <Tex display size="lg">{'O = A\\,V'}</Tex>
            </Appear>
            <Appear step="output" effect="fade" delay={0.4}>
              <Callout title="핵심">
                각 토큰이 다른 토큰들의 정보를 유사도 가중 평균으로 흡수한다.
              </Callout>
            </Appear>
          </Stack>
        }
      />
    </SlideFrame>
  ),
);

export default attentionScene;
