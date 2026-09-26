import React from 'react';
import { Appear, defineScene, step, useStepProgress } from '@/lib/timeline';
import { Callout, DiagramView, EqSteps, Grid, SlideFrame, Spec, Stack, TensorMatrix, WalkthroughStage } from '@/lib/kit';
import { outputDetail, outputIds } from '../diagrams/output.diagram';

/**
 * Engram eq. 5 + residual + multi-branch sharing (§2.4), then what V4.1 kept.
 * The strip is the receptive field of the dilated conv at t = "." in the
 * Figure 1 sentence: kernel 4, dilation 3 → taps at t, t−3, t−6, t−9.
 */
const WORDS = ['Only', 'Alexander', 'the', 'Great', 'could', 'tame', 'the', 'horse', 'Bucephalus', '.'];
const POS = WORDS.map((_, i) => (i === 9 ? 't' : `t−${9 - i}`));
const TAPS: [number, number][] = [[0, 0], [0, 3], [0, 6], [0, 9]];

export const outputScene = defineScene(
  {
    id: '04-output',
    title: '출력: 합성곱과 잔차',
    steps: [
      step('conv', 2.8),
      step('skip', 2.2),
      step('residual', 2.4),
      step('branches', 2.4),
      step('v41', 2.4, { hold: 0.6 }),
    ],
  },
  () => {
    const stripP = useStepProgress('conv');
    return (
      <SlideFrame title="출력: 짧은 합성곱을 거쳐 잔차 스트림에 더한다" footer="ML Weekly · Engram §2.3 (eq. 5), §2.4, §6.2 · V4.1 §2.4.2">
        <WalkthroughStage
          placement="bottom"
          gap={4}
          visual={
            <Stack gap={3} style={{ height: '100%' }}>
              <div style={{ flex: 1, minWidth: 0, minHeight: 0 }}>
                <DiagramView
                  diagram={outputDetail}
                  stepEffects={{
                    // Ṽ는 어떤 reveal에도 없다 — frame-0 앵커
                    conv: { reveal: outputIds.conv, highlight: ['conv'] },
                    skip: { reveal: outputIds.skip, highlight: ['plus', 'y'], pulse: ['e-vt-plus'] },
                    residual: { reveal: outputIds.residual, highlight: ['res'], pulse: ['e-y-res'] },
                    branches: { highlight: ['h', 'res'] },
                    v41: { highlight: ['conv'] },
                  }}
                />
              </div>
              <Stack direction="row" gap={5} align="flex-end">
                <Appear step="conv" effect="fade">
                  <TensorMatrix
                    title="t = '.'에서 합성곱이 읽는 위치 (커널 4, 팽창 3)"
                    values={[WORDS]}
                    columnLabels={POS}
                    highlight={TAPS}
                    progress={stripP}
                    width={1180}
                    cellHeight={40}
                  />
                </Appear>
                <Stack gap={2} align="flex-start">
                  <Appear step="branches" effect="fade">
                    <Spec label="mHC M = 4">W_V 공유 · W_K 4개 → FP8 행렬곱 1회</Spec>
                  </Appear>
                  <Appear step="v41" effect="fade">
                    <Spec label="위치">27B: 2·15층 · V4.1: 1·14층 (0부터)</Spec>
                  </Appear>
                </Stack>
              </Stack>
            </Stack>
          }
          explanation={
            <Stack gap={3}>
              <Stack direction="row" gap={4} align="center" justify="space-between">
                <EqSteps
                  size="sm"
                  parts={[
                    { tex: 'Y = \\mathrm{SiLU}\\big(\\mathrm{Conv1D}(\\mathrm{RMSNorm}(\\tilde V))\\big)', step: 'conv' },
                    { tex: '\\, + \\tilde V', step: 'skip' },
                    { tex: '\\qquad H^{(\\ell)} \\leftarrow H^{(\\ell)} + Y', step: 'residual' },
                  ]}
                />
              </Stack>
              <Grid columns={3} gap={4}>
                <Appear step="conv" effect="rise">
                  <Callout title="짧은 합성곱으로 이웃 메모리를 섞는다">
                    RMSNorm 뒤에 커널 4, 팽창 3의 depthwise 합성곱과 SiLU를 거치고 Ṽ를 다시 더한다. 팽창이 최대
                    N-gram 차수 3과 같아서 네 탭이 겹치지 않는 3-gram 네 개를 본다. 합성곱 가중치는 0에서 시작한다.
                  </Callout>
                </Appear>
                <Appear step="residual" effect="rise">
                  <Callout title="잔차로 더하고, 가지마다 게이트를 따로">
                    Y는 잔차 스트림에 더해지고 그 뒤로 평소처럼 Attention과 MoE가 돈다. 백본이 스트림 4개짜리
                    mHC일 때는 테이블과 W_V를 함께 쓰고 W_K만 가지마다 두어서, 게이트 α가 가지마다 하나씩 나온다.
                  </Callout>
                </Appear>
                <Appear step="v41" effect="rise">
                  <Callout tone="warn" title="V4.1은 합성곱을 뺐다">
                    논문의 ablation에서도 합성곱을 빼면 손실이 조금만 나빠졌다. V4.1은 추론 스택이 복잡해지는 것에
                    비해 이득이 작다고 보고 합성곱을 생략했다. 조회, 게이트, 가지별 통합은 그대로 가져왔다.
                  </Callout>
                </Appear>
              </Grid>
            </Stack>
          }
        />
      </SlideFrame>
    );
  },
);

export default outputScene;
