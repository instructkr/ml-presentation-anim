import React from 'react';
import { Appear, defineScene, step, useStepProgress } from '@/lib/timeline';
import { Callout, EqSteps, SlideFrame, Spec, Stack, TensorMatrix, Tex, WalkthroughStage } from '@/lib/kit';
import { C_VEC, R_VEC } from './sinkhorn-example';

/**
 * 정리: where D_r and D_c in V4.1 eq. (7) come from. The pseudocode never
 * forms them because they are the accumulated products of the per-step
 * diagonal scalings; eq. (7) is that bookkeeping written down. The anchor is
 * eq. (7) itself; each beat derives one line under it. Numbers are the shared
 * 5 × 3 example (sinkhorn-example.ts).
 */
export const sinkhornDrDcScene = defineScene(
  {
    id: '08-sinkhorn-dr-dc',
    title: 'D_r과 D_c는 어디서 오나',
    steps: [
      step('diag', 2.8),
      step('collect', 2.8),
      step('entry', 2.8),
      step('closed', 2.8),
      step('impl', 2.4, { hold: 0.6 }),
    ],
  },
  () => {
    const vecP = useStepProgress('entry');
    return (
      <SlideFrame title="식 (7)의 D_r, D_c는 루프가 쌓은 배율이다" footer="ML Weekly · DeepSeek-V4.1 §2.5 eq. (7), §3.1.3">
        <WalkthroughStage
          visual={
            <Stack gap={4} align="center" justify="center" style={{ height: '100%' }}>
              {/* frame-0 anchor: the equation being explained */}
              <Tex display size="lg">{'\\Delta_t = \\sqrt{n}\\,U^{(K)} = \\sqrt{n}\\; D_r\\, \\widehat G_t\\, D_c'}</Tex>
              <EqSteps
                display
                size="md"
                parts={[
                  { tex: 'U \\leftarrow R_k\\,U', step: 'diag' },
                  { tex: '\\qquad U \\leftarrow U\\,C_k', step: 'diag' },
                  { tex: '\\qquad R_k, C_k \\text{ diagonal}', step: 'diag' },
                ]}
              />
              <EqSteps
                display
                size="md"
                parts={[
                  {
                    tex: 'U^{(11)} = \\underbrace{R_{11}\\cdots R_3 R_1}_{D_r}\\;\\widehat G_t\\;\\underbrace{C_2 C_4 \\cdots C_{10}}_{D_c}',
                    step: 'collect',
                  },
                ]}
              />
              <EqSteps
                display
                size="md"
                parts={[
                  { tex: '\\Delta_{ij} = \\sqrt{n}\\; r_i\\, \\widehat G_{ij}\\, c_j', step: 'entry' },
                  { tex: '\\qquad r_i = 1 \\,/\\, \\lVert \\widehat G_{i,:} \\odot c \\rVert_2', step: 'closed' },
                ]}
              />
              <Appear step="entry" effect="fade">
                <Stack direction="row" gap={6} align="flex-start">
                  <TensorMatrix
                    title="r: 행(N-gram)마다 배율"
                    values={R_VEC}
                    columnLabels={['g₁', 'g₂', 'g₃', 'g₄', 'g₅']}
                    progress={vecP}
                    width={480}
                    cellHeight={44}
                  />
                  <TensorMatrix
                    title="c: 열(특징)마다 배율"
                    values={C_VEC}
                    columnLabels={['f₁', 'f₂', 'f₃']}
                    highlight={[[0, 0]]}
                    color="ok"
                    progress={vecP}
                    width={300}
                    cellHeight={44}
                  />
                </Stack>
              </Appear>
              <Stack direction="row" gap={3}>
                <Appear step="entry" effect="fade">
                  <Spec label="검산">Δ₁₁ = √3 · 0.30 · 6 · 0.33 ≈ 1.03</Spec>
                </Appear>
                <Appear step="closed" effect="fade">
                  <Spec label="검산">r₁ = 1 / ‖(2.00, 2.18, −1.64)‖ ≈ 0.30</Spec>
                </Appear>
              </Stack>
              <Stack direction="row" gap={3}>
                <Appear step="impl" effect="fade">
                  <Spec label="V4.1 구현">U를 11번 다시 쓰지 않고 r(m개) · c(n개)만 갱신</Spec>
                </Appear>
                <Appear step="impl" effect="fade" delay={0.3}>
                  <Spec label="커널">행 정규화 + 열 부분합을 한 커널에</Spec>
                </Appear>
              </Stack>
            </Stack>
          }
          explanation={
            <Stack gap={4}>
              <Appear step="diag" effect="rise">
                <Callout title="나누기 한 번은 대각행렬 곱 한 번">
                  행 단계는 행마다 다른 수를 곱한다. 이것은 대각행렬 R을 왼쪽에 곱하는 것과 같다. 열 단계는 대각행렬
                  C를 오른쪽에 곱한다.
                </Callout>
              </Appear>
              <Appear step="collect" effect="rise">
                <Callout title="D_r과 D_c는 쌓인 배율이다">
                  대각행렬끼리 곱해도 대각행렬이다. 그래서 왼쪽 여섯 개는 D_r 하나로, 오른쪽 다섯 개는 D_c 하나로
                  모인다. 식 (7)은 새 단계가 아니라 루프의 결과를 두 벡터로 적은 것이다.
                </Callout>
              </Appear>
              <Appear step="closed" effect="rise">
                <Callout tone="ok" title="실제로 푸는 것은 c다">
                  마지막이 행 단계라서 c가 정해지면 r은 계산으로 따라온다. 갱신은 특징마다 c로 무게를 바꾼 뒤 행을
                  길이 1로 맞춘 것이다. 가장 길던 f₁ 열은 c₁ = 0.33으로 눌린다.
                </Callout>
              </Appear>
            </Stack>
          }
        />
      </SlideFrame>
    );
  },
);

export default sinkhornDrDcScene;
