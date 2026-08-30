import React from 'react';
import { Appear, defineScene, step } from '@/lib/timeline';
import { Callout, DiagramView, EqSteps, SlideFrame, Stack, WalkthroughStage } from '@/lib/kit';
import { qbDualDetail } from '../diagrams/qb-dual.diagram';

/**
 * Appendix C, first half — done rather than named.
 *
 * Why a Lagrangian appears at all is the question this scene owes the audience:
 * it is the move that turns a constraint into a price, and pricing the two
 * constraints is what makes each cell's decision independent — which is the
 * only reason a batch-wide assignment can end up as a rule a single token can
 * evaluate at inference time. The equations sit under the diagram rather than
 * across the full slide so they stay inside the visual column and never run
 * beneath the explanation rail. Minimising the leftover g is the next scene,
 * so this one deliberately stops at "남은 일은 g의 최소화".
 */
export const qbDualScene = defineScene(
  {
    id: '03-qb-dual',
    title: '유도 — 제약에 값을 매긴다',
    steps: [
      step('ideal', 2.6),
      step('whynot', 2.8),
      step('price', 3.0),
      step('threshold', 3.2),
      step('leftover', 2.6, { hold: 0.6 }),
    ],
  },
  () => (
    <SlideFrame
      title="유도 ① — 균형 배정에 값을 매기면 임계 규칙이 떨어진다"
      footer="ML Weekly · Kimi K3 부록 C"
    >
      <WalkthroughStage
        visual={
          <Stack gap={3} style={{ height: '100%' }}>
            <div style={{ flex: 1, minHeight: 0 }}>
              <DiagramView
                diagram={qbDualDetail}
                stepEffects={{
                  // 'assign'·'cons'는 어떤 reveal에도 없다 — frame-0 앵커 (hard rule 6)
                  ideal: {
                    highlight: ['assign', 'cons'],
                    camera: { focus: ['assign', 'cons'], padding: 80 },
                  },
                  whynot: {
                    reveal: ['whynot', 'infer', 'e-assign-whynot', 'e-whynot-infer'],
                    highlight: ['whynot', 'infer'],
                    camera: { focus: ['assign', 'whynot', 'infer'], padding: 60 },
                  },
                  price: {
                    reveal: ['price', 'lag', 'e-assign-price', 'e-price-lag'],
                    highlight: ['price', 'lag'],
                    camera: { focus: ['assign', 'price', 'lag'], padding: 60 },
                  },
                  threshold: {
                    reveal: ['free', 'rule', 'isbias', 'e-lag-free', 'e-free-rule', 'e-rule-isbias'],
                    highlight: ['free', 'rule', 'isbias'],
                    pulse: ['e-free-rule'],
                    camera: { focus: ['lag', 'free', 'rule', 'isbias'], padding: 50 },
                  },
                  leftover: {
                    reveal: ['dual', 'next', 'e-lag-dual', 'e-dual-next'],
                    highlight: ['dual', 'next'],
                    // 마지막 비트는 유도 전체를 한 화면에 (썸네일 프레임)
                    camera: { focus: [] },
                  },
                }}
              />
            </div>
            <EqSteps
              size="sm"
              parts={[
                {
                  tex: 'L(x,\\alpha,\\beta) = \\textstyle\\sum_{ij} x_{ij}\\,(s_{ij} - \\alpha_i - \\beta_j) + k\\sum_i \\alpha_i + q\\sum_j \\beta_j',
                  step: 'price',
                },
              ]}
            />
            <EqSteps
              size="sm"
              parts={[
                {
                  tex: '\\Longrightarrow\\;\\; x_{ij} = 1 \\iff s_{ij} - \\beta_j > \\alpha_i',
                  step: 'threshold',
                },
              ]}
            />
          </Stack>
        }
        explanation={
          <Stack gap={4}>
            <Appear step="price" effect="rise">
              <Callout title="라그랑주 승수가 여기서 하는 일">
                제약을 반드시 지키라고 강요하는 대신, 어기면 값을 물리는 문제로 바꾸는 것이다.
                α<sub>i</sub>는 토큰 i가 전문가를 한 명 더 부를 때 내는 값, β<sub>j</sub>는 전문가
                j의 자리를 한 칸 더 쓸 때 내는 값이다. 승수라는 말이 어색하면 통행료라고 불러도 된다.
              </Callout>
            </Appear>
            <Appear step="threshold" effect="rise">
              <Callout tone="ok" title="이 유도의 목적지는 여기다">
                가격을 상수로 놓으면 x에 대한 항이 칸별로 완전히 분리된다. 그래서 켤지 말지를 칸마다
                따로 정할 수 있고, 답은 괄호 안이 양수인 칸을 켜는 것이다. 다시 쓰면 토큰 i는
                s<sub>ij</sub> − β<sub>j</sub>가 자기 임계값 α<sub>i</sub>를 넘는 전문가만 켜면 된다.
              </Callout>
            </Appear>
            <Appear step="leftover" effect="fade">
              <Callout tone="ok" title="β는 새 개념이 아니다">
저 규칙은 앞 편에서 본 bias 라우팅과 글자 그대로 같은 모양이다. 배치를 몰라도 계산되고,
                β가 곧 전문가별 bias다. 남은 일은 g를 최소화하는 것뿐이다.
              </Callout>
            </Appear>
          </Stack>
        }
      />
    </SlideFrame>
  ),
);

export default qbDualScene;
