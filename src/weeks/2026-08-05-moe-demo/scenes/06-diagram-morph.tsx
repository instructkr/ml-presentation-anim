import React from 'react';
import { Appear, defineScene, step } from '@/lib/timeline';
import { Callout, DiagramView, Label, SlideFrame, Stack, Tex } from '@/lib/kit';
import { morphDemo, morphMoves } from '../diagrams/morph-demo.diagram';

const LEGACY = ['ffn', 'e-attn-ffn', 'e-ffn-output'];

export const diagramMorphScene = defineScene(
  {
    id: '06-diagram-morph',
    title: 'Dense → MoE 변형',
    steps: [
      step('dense', 2.0, { hold: 0.8 }),
      step('open', 2.4, { hold: 0.6 }),
      step('experts', 2.6, { hold: 0.6 }),
      step('route', 2.8, { hold: 1.0 }),
    ],
  },
  () => (
    <SlideFrame title="Dense FFN을 MoE 층으로 바꾸면" footer="ML Weekly · MoE 해부">
      <Stack direction="row" gap={5} style={{ height: '100%' }}>
        <DiagramView
          diagram={morphDemo}
          width={1180}
          height={840}
          stepEffects={{
            dense: {
              reveal: ['input', 'attn', 'ffn', 'output', 'e-input-attn', 'e-attn-ffn', 'e-ffn-output'],
            },
            open: {
              move: morphMoves.open,
            },
            experts: {
              reveal: [
                'moe',
                'router',
                'e-attn-router',
                'expert-1',
                'expert-2',
                'expert-3',
                'expert-4',
                'e-router-expert-1',
                'e-router-expert-2',
                'e-router-expert-3',
                'e-router-expert-4',
                'combine',
                'e-expert-1-combine',
                'e-expert-2-combine',
                'e-expert-3-combine',
                'e-expert-4-combine',
                'e-combine-output',
              ],
              move: morphMoves.experts,
              highlight: ['router'],
              dim: LEGACY,
            },
            route: {
              pulse: ['e-router-expert-1', 'e-router-expert-3'],
              highlight: ['router', 'expert-1', 'expert-3', 'combine'],
              dim: [
                ...LEGACY,
                'expert-2',
                'expert-4',
                'e-router-expert-2',
                'e-router-expert-4',
                'e-expert-2-combine',
                'e-expert-4-combine',
              ],
            },
          }}
        />
        <Stack gap={3} justify="center" style={{ flex: 1 }}>
          <Appear step="dense" effect="rise">
            <Label size="sm" color="textSecondary">
              Dense 층에서는 모든 토큰이 같은 FFN 하나를 통과한다.
            </Label>
          </Appear>
          <Appear step="open" effect="left">
            <Callout title="1. 자리를 비운다">
              기존 FFN을 옆으로 밀어내고, 그 자리에 라우터와 전문가들이 들어갈 공간을 만든다.
            </Callout>
          </Appear>
          <Appear step="experts" effect="rise">
            <Tex display size="md">{'g = \\mathrm{softmax}(W_g x)'}</Tex>
          </Appear>
          <Appear step="experts" effect="fade" delay={0.5}>
            <Label size="sm" color="textSecondary">
              FFN 하나가 전문가 4개로 갈라진다.
            </Label>
          </Appear>
          <Appear step="route" effect="rise">
            <Tex display size="md">{'y = \\textstyle\\sum_{i \\in \\mathrm{Top}\\text{-}2} g_i\\,E_i(x)'}</Tex>
          </Appear>
          <Appear step="route" effect="fade" delay={0.5}>
            <Callout tone="ok" title="2. 토큰마다 2개만 켠다">
              용량은 4배, 토큰당 연산량은 Dense와 같다.
            </Callout>
          </Appear>
        </Stack>
      </Stack>
    </SlideFrame>
  ),
);

export default diagramMorphScene;
