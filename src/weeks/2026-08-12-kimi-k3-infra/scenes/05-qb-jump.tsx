import React from 'react';
import { Appear, defineScene, step } from '@/lib/timeline';
import { Callout, DiagramView, SlideFrame, Stack, WalkthroughStage } from '@/lib/kit';
import { qbJumpDetail } from '../diagrams/qb-jump.diagram';

/**
 * The two questions the derivation lets you answer, and neither one is obvious
 * from §2.3.3: how QB relates to the rule it replaces, and what actually ships.
 *
 * The first is the strongest line in the whole appendix — DeepSeek's fixed-step
 * update is SignSGD on the very objective QB minimises exactly — and it only
 * lands if the audience has just seen where the objective came from, which is
 * why it lives here rather than in the derivation scene.
 */
export const qbJumpScene = defineScene(
  {
    id: '05-qb-jump',
    title: '고정 스텝과의 관계, 그리고 배포',
    steps: [
      step('grad', 2.6),
      step('sign', 2.8),
      step('jump', 2.8),
      step('opt', 2.8),
      step('deploy', 2.6, { hold: 0.6 }),
    ],
  },
  () => (
    <SlideFrame
      title="같은 산을 내려가는 두 방법 — 그리고 배포에 남는 것"
      footer="ML Weekly · Kimi K3 부록 C"
    >
      <WalkthroughStage
        visual={
          <DiagramView
            diagram={qbJumpDetail}
            stepEffects={{
              // 'dual'은 어떤 reveal에도 없다 — frame-0 앵커 (hard rule 6)
              grad: {
                reveal: ['grad', 'e-dual-grad'],
                highlight: ['grad'],
                camera: { focus: ['dual', 'grad'], padding: 90 },
              },
              sign: {
                reveal: ['sign', 'deepseek', 'e-grad-sign', 'e-sign-deepseek'],
                highlight: ['sign', 'deepseek'],
                camera: { focus: ['grad', 'sign', 'deepseek'], padding: 60 },
              },
              jump: {
                reveal: ['jump', 'nolr', 'e-grad-jump', 'e-jump-nolr'],
                highlight: ['jump', 'nolr'],
                dim: ['sign', 'deepseek', 'e-grad-sign', 'e-sign-deepseek'],
                camera: { focus: ['grad', 'jump', 'nolr'], padding: 60 },
              },
              opt: {
                reveal: ['opt', 'e-jump-opt'],
                highlight: ['opt'],
                camera: { focus: ['jump', 'opt'], padding: 70 },
              },
              deploy: {
                reveal: ['bias', 'center', 'drop', 'e-opt-bias', 'e-bias-center', 'e-bias-drop'],
                highlight: ['bias', 'drop'],
                pulse: ['e-opt-bias'],
                // 마지막 비트는 그림 전체로 물러난다 (썸네일 프레임)
                camera: { focus: [] },
              },
            }}
          />
        }
        explanation={
          <Stack gap={4}>
            <Appear step="sign" effect="rise">
              <Callout tone="warn" title="고정 스텝은 같은 목적함수의 SignSGD였다">
                가격 함수를 β로 미분하면 목표 부하에서 실제 부하를 뺀 값이 그대로 나온다. DeepSeek의 규칙은
                여기서 크기를 떼어내고 부호만 남긴 뒤 보폭을 상수 γ로 갈아 끼운 것이다. 두 방법이 다른
                목표를 좇고 있던 것이 아니라 같은 산을 다르게 내려가고 있었다.
              </Callout>
            </Appear>
            <Appear step="jump" effect="rise">
              <Callout tone="ok" title="그래서 QB에는 정할 보폭이 없다">
                조금씩 내려가는 대신 그 좌표의 바닥을 식으로 바로 계산한다. 그 자리가 분위수라는 것이 앞
                편의 결론이었다. 보폭이 없으니 γ를 고를 일도, 부하가 γ에 맞춰 출렁일 일도 없다.
              </Callout>
            </Appear>
            <Appear step="deploy" effect="fade">
              <Callout title="학습과 추론이 같은 규칙을 쓰게 되는 이유">
                최적점에서 토큰이 고르는 집합은 s − β의 상위 k개이고, 이는 bias 라우팅과 같은 모양이다.
                대응이 b = −β 하나뿐이라, 학습이 끝나면 β만 얼려 들고 나가면 된다.
              </Callout>
            </Appear>
          </Stack>
        }
      />
    </SlideFrame>
  ),
);

export default qbJumpScene;
