import React from 'react';
import { defineScene, step, useStepProgress } from '@/lib/timeline';
import {
  DiagramView,
  ExplainerCard,
  SlideFrame,
  TensorMatrix,
  Tex,
  WalkthroughStage,
} from '@/lib/kit';
import { useTheme } from '@/lib/theme';
import { routerDetail } from '../diagrams/router-detail.diagram';

const Scene: React.FC = () => {
  const t = useTheme();
  const scoring = useStepProgress('scoring', { portion: [0, 0.28], easing: 'inOut' });
  const topk = useStepProgress('topk', { portion: [0, 0.28], easing: 'inOut' });
  const beatOpacity = {
    tokens: 1 - scoring,
    scoring: scoring * (1 - topk),
    topk,
  };

  return (
    <SlideFrame title="Router: 점수에서 Top-K 전문가까지" footer="ML Weekly · MoE 해부">
      <WalkthroughStage
        placement="bottom"
        visual={
          <DiagramView
            diagram={routerDetail}
            width={1776}
            height={560}
            maxScale={1.28}
            stepEffects={{
              tokens: {
                reveal: ['x', 'router', 'e-x-router'],
                highlight: ['x', 'router'],
                camera: { focus: ['x', 'router'], padding: 84, maxScale: 1.18 },
              },
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
                highlight: ['router', 'e-router-expert-1', 'e-router-expert-2', 'e-router-expert-3', 'e-router-expert-4'],
                camera: {
                  focus: ['router', 'expert-1', 'expert-2', 'expert-3', 'expert-4'],
                  padding: 76,
                  maxScale: 1.08,
                },
              },
              topk: {
                reveal: [
                  'combine',
                  'y',
                  'e-expert-1-combine',
                  'e-expert-2-combine',
                  'e-expert-3-combine',
                  'e-expert-4-combine',
                  'e-combine-y',
                ],
                highlight: ['expert-1', 'expert-3', 'e-expert-1-combine', 'e-expert-3-combine'],
                dim: [
                  'expert-2',
                  'expert-4',
                  'e-router-expert-2',
                  'e-router-expert-4',
                  'e-expert-2-combine',
                  'e-expert-4-combine',
                ],
                camera: {
                  focus: ['router', 'expert-1', 'expert-2', 'expert-3', 'expert-4', 'combine', 'y'],
                  padding: 88,
                  maxScale: 1.02,
                },
              },
            }}
          />
        }
        explanation={
          <div
            style={{
              height: 228,
              display: 'grid',
              gridTemplateColumns: '440px minmax(410px, 0.9fr) minmax(480px, 1.1fr)',
              gap: t.space(5),
              alignItems: 'center',
            }}
          >
            <TensorMatrix
              title="GATE PROBABILITIES · token x"
              values={[[0.62, 0.05, 0.28, 0.05]]}
              columnLabels={['E₁', 'E₂', 'E₃', 'E₄']}
              highlight={topk > 0.12 ? [[0, 0], [0, 2]] : []}
              progress={scoring}
              width={440}
              cellHeight={54}
            />

            <div style={{ position: 'relative', height: 132 }}>
              <div style={{ position: 'absolute', inset: 0, opacity: beatOpacity.tokens }}>
                <Tex display size="md">{'x \\in \\mathbb{R}^{d_{model}}'}</Tex>
              </div>
              <div style={{ position: 'absolute', inset: 0, opacity: beatOpacity.scoring }}>
                <Tex display size="md">{'g = \\mathrm{softmax}(W_g\\,x)'}</Tex>
              </div>
              <div style={{ position: 'absolute', inset: 0, opacity: beatOpacity.topk }}>
                <Tex display size="md">{'y = \\sum_{i \\in \\mathrm{Top}K} g_i\\,E_i(x)'}</Tex>
              </div>
            </div>

            <div style={{ position: 'relative', height: 164 }}>
              <ExplainerCard
                index={1}
                eyebrow="Input token"
                title="라우터가 토큰 표현을 읽는다"
                style={{ position: 'absolute', inset: 0, opacity: beatOpacity.tokens }}
              >
                전체 모델을 깨우기 전에, 작은 선형 투영이 어떤 전문가가 필요한지 판단한다.
              </ExplainerCard>
              <ExplainerCard
                index={2}
                eyebrow="Score"
                title="전문가별 확률을 같은 자리에서 비교한다"
                style={{ position: 'absolute', inset: 0, opacity: beatOpacity.scoring }}
              >
                숫자는 고정폭 정렬을 유지하고, 행렬 셀과 연결선이 함께 점수의 흐름을 보여준다.
              </ExplainerCard>
              <ExplainerCard
                index={3}
                eyebrow="Sparse dispatch"
                title="Top-2만 계산하고 가중 합으로 복귀한다"
                tone="ok"
                style={{ position: 'absolute', inset: 0, opacity: beatOpacity.topk }}
              >
                파라미터 용량은 커지지만 토큰당 활성 연산은 선택된 두 전문가로 제한된다.
              </ExplainerCard>
            </div>
          </div>
        }
      />
    </SlideFrame>
  );
};

export const routerScene = defineScene(
  {
    id: '02-router',
    title: 'Router와 Top-K',
    steps: [step('tokens', 2.1), step('scoring', 3.1), step('topk', 3.2, { hold: 0.7 })],
  },
  Scene,
);

export default routerScene;
