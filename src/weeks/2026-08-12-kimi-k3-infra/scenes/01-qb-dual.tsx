import React from 'react';
import { Appear, defineScene, step } from '@/lib/timeline';
import { Callout, DiagramView, SlideFrame, Stack, WalkthroughStage } from '@/lib/kit';
import { qbDualDetail } from '../diagrams/qb-dual.diagram';

/**
 * §2.3.3 leaves the quantile looking like a heuristic; Appendix C shows it is
 * the exact coordinate minimiser of the balanced-assignment dual. This is the
 * scene that answers "왜 하필 분위수인가" and, in the same breath, why QB has
 * no learning-rate-like knob while the fixed-step rule does.
 */
export const qbDualScene = defineScene(
  {
    id: '01-qb-dual',
    title: '왜 분위수인가',
    steps: [
      step('assign', 2.2),
      step('dual', 2.6),
      step('alternate', 3.0),
      step('sign', 2.8),
      step('keepbeta', 2.8, { hold: 0.6 }),
    ],
  },
  () => (
    <SlideFrame title="Quantile Balancing의 유도 — 균형 배정의 쌍대" footer="ML Weekly · Kimi K3 § C">
      <WalkthroughStage
        visual={
          <DiagramView
            diagram={qbDualDetail}
            stepEffects={{
              // 'assign'·'cons'는 어떤 reveal에도 없음 — frame-0 앵커 (hard rule 6)
              assign: {
                highlight: ['assign'],
                camera: { focus: ['assign', 'cons'], padding: 90 },
              },
              dual: {
                reveal: ['dual', 'e-assign-dual', 'loop', 'e-dual-loop'],
                highlight: ['dual'],
                camera: { focus: ['assign', 'dual'], padding: 80 },
              },
              alternate: {
                reveal: ['alpha', 'beta', 'e-loop-alpha', 'e-alpha-beta'],
                highlight: ['alpha', 'beta'],
                pulse: ['e-alpha-beta'],
                camera: { focus: ['loop', 'alpha', 'beta'], padding: 70 },
              },
              sign: {
                reveal: ['grad', 'sign', 'e-dual-grad', 'e-grad-sign'],
                highlight: ['grad', 'sign'],
                camera: { focus: ['grad', 'sign'], padding: 80 },
              },
              keepbeta: {
                reveal: ['routing', 'infer', 'e-beta-routing', 'e-routing-infer'],
                highlight: ['beta', 'routing', 'infer'],
                dim: ['alpha'],
                camera: { focus: ['routing', 'infer'], padding: 80 },
              },
            }}
          />
        }
        explanation={
          <Stack gap={4}>
            <Appear step="alternate" effect="rise">
              <Callout tone="ok" title="이름의 유래">
                두 갱신이 <b>같은 분위수</b>다 — 하나는 행(토큰) 방향, 하나는 열(전문가) 방향. 부분문제가
                조각별 선형이라 닫힌 해가 있고, 그래서 최소점으로 바로 점프한다.
              </Callout>
            </Appear>
            <Appear step="sign" effect="rise">
              <Callout tone="warn" title="고정 스텝 = 같은 목적함수의 SignSGD">
                기울기가 곧 &lsquo;목표 부하 − 실제 부하&rsquo;. DeepSeek 규칙은 부호만 쓰고 크기를 γ로
                대체한 것 — QB에 학습률류 하이퍼파라미터가 없는 이유다.
              </Callout>
            </Appear>
            <Appear step="keepbeta" effect="fade">
              <Callout title="배포까지 살아남는 건 β 하나">
                최적점의 선택 집합은 정확히 s − β의 Top-k. α는 배치에 묶인 중간 변수라 버려진다.
              </Callout>
            </Appear>
          </Stack>
        }
      />
    </SlideFrame>
  ),
);

export default qbDualScene;
