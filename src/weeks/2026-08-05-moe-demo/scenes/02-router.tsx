import React from 'react';
import { Appear, defineScene, step } from '@/lib/timeline';
import { Callout, DiagramView, SlideFrame, Stack, Tex } from '@/lib/kit';
import { routerDetail } from '../diagrams/router-detail.diagram';

export const routerScene = defineScene(
  {
    id: '02-router',
    title: 'Router와 Top-K',
    steps: [step('tokens', 1.8), step('scoring', 2.6), step('topk', 2.8, { hold: 0.5 })],
  },
  () => (
    <SlideFrame title="Router: 토큰별 전문가 선택" footer="ML Weekly · MoE 해부">
      <Stack direction="row" gap={5} style={{ height: '100%' }}>
        <DiagramView
          diagram={routerDetail}
          width={1150}
          height={780}
          stepEffects={{
            tokens: { reveal: ['x', 'router', 'e-x-router'] },
            scoring: {
              reveal: [
                'expert-1',
                'expert-2',
                'expert-3',
                'expert-4',
                'e-router-expert-1',
                'e-router-expert-2',
                'e-router-expert-3',
                'e-router-expert-4',
              ],
              pulse: ['e-router-expert-1', 'e-router-expert-2', 'e-router-expert-3', 'e-router-expert-4'],
              highlight: ['router'],
            },
            topk: {
              reveal: ['combine', 'y', 'e-expert-1-combine', 'e-expert-3-combine', 'e-combine-y'],
              highlight: ['expert-1', 'expert-3'],
              dim: ['expert-2', 'expert-4', 'e-router-expert-2', 'e-router-expert-4', 'e-expert-2-combine', 'e-expert-4-combine'],
            },
          }}
        />
        <Stack gap={4} justify="center" style={{ flex: 1 }}>
          <Appear step="scoring" effect="rise">
            <Tex display size="lg">{'g = \\mathrm{softmax}(W_g\\,x)'}</Tex>
          </Appear>
          <Appear step="topk" effect="rise">
            <Tex display size="lg">{'y = \\sum_{i \\in \\mathrm{Top}K} g_i\\,E_i(x)'}</Tex>
          </Appear>
          <Appear step="topk" effect="fade" delay={0.4}>
            <Callout title="Top-2 라우팅">
              전체 파라미터는 4배지만, 토큰당 연산은 Expert 2개 분량만 활성화된다.
            </Callout>
          </Appear>
        </Stack>
      </Stack>
    </SlideFrame>
  ),
);

export default routerScene;
