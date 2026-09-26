import React from 'react';
import { Appear, defineScene, step, useCurrentStepIndex, useStepProgress } from '@/lib/timeline';
import { BarChart, Callout, Fill, SlideFrame, Spec, Stack, TensorMatrix, WalkthroughStage } from '@/lib/kit';
import { COLS, G_HAT } from './sinkhorn-example';

/**
 * 문제 for V4.1 §2.5: what an embedding-table gradient looks like (rows of
 * wildly different size) and why V4.1 will not pay Adam's two state tensors
 * for 196B Engram parameters. The Ĝ table is the frame-0 anchor.
 */
const SKEW: [number, number][] = [0, 1, 2, 3, 4].map((r) => [r, 3]);

export const sinkhornWhyScene = defineScene(
  {
    id: '06-sinkhorn-why',
    title: '테이블 학습: 왜 Adam이 아닌가',
    steps: [step('table', 2.4), step('skew', 2.6), step('adam', 2.6), step('plan', 2.4, { hold: 0.6 })],
  },
  () => {
    const idx = useCurrentStepIndex();
    const barP = useStepProgress('adam');
    return (
      <SlideFrame title="V4.1은 Engram 테이블을 Adam으로 학습하지 않는다" footer="ML Weekly · DeepSeek-V4.1 §2.5, §4.2.2">
        <WalkthroughStage
          visual={
            <Stack gap={5} style={{ height: '100%' }}>
              <Stack direction="row" gap={5} align="flex-end">
                <TensorMatrix
                  title="Ĝ: 행 = N-gram, 열 = 은닉 특징 (5 × 3로 줄인 예)"
                  values={G_HAT.slice(0, 5)}
                  rowLabels={['g₁', 'g₂', 'g₃', 'g₄', 'g₅']}
                  columnLabels={COLS}
                  highlight={idx >= 1 ? SKEW : []}
                  width={680}
                  cellHeight={48}
                />
                <Appear step="plan" effect="fade">
                  <Stack gap={2} align="flex-start">
                    <Spec label="틀">Muon과 같다: 모멘텀 → 정규화 → 갱신</Spec>
                    <Spec label="정규화">Newton–Schulz 대신 Sinkhorn</Spec>
                    <Spec label="적용">Engram 테이블 · 토큰 임베딩</Spec>
                    <Spec label="적용">예측 헤드</Spec>
                  </Stack>
                </Appear>
              </Stack>
              <Appear step="adam" effect="fade" style={{ flex: 1, minHeight: 0 }}>
                <Fill>
                  {({ width, height }) => (
                    <BarChart
                      width={width}
                      height={height}
                      progress={barP}
                      highlightIndex={1}
                      data={[
                        { label: 'Adam: m과 v', value: 392 },
                        { label: '모멘텀 M 하나', value: 196 },
                      ]}
                      valueFormat={(v) => `${Math.round(v)}B개`}
                    />
                  )}
                </Fill>
              </Appear>
            </Stack>
          }
          explanation={
            <Stack gap={4}>
              <Appear step="table" effect="rise">
                <Callout title="기울기는 행 단위로 온다">
                  테이블은 행 하나가 N-gram 하나, 열 하나가 은닉 특징 하나인 m × n 행렬이다. 배치에서 조회된 행에만
                  기울기가 생긴다.
                </Callout>
              </Appear>
              <Appear step="skew" effect="rise">
                <Callout title="행마다 크기가 수천 배 다르다">
                  자주 나온 g₁은 길이가 7이고 g₃은 0.0012다. 같은 학습률로 빼면 g₁만 움직인다. Adam은 원소마다 크기를
                  재서 이 차이를 지운다.
                </Callout>
              </Appear>
              <Appear step="adam" effect="rise">
                <Callout tone="warn" title="Adam의 상태는 파라미터의 두 배">
                  Adam은 원소마다 m과 v를 저장해서, 196B개 파라미터에 상태가 392B개 붙는다. V4.1은 모멘텀 M 하나만
                  두고, 크기 맞추기는 매 스텝 행과 열을 나누는 Sinkhorn 균형으로 대신한다.
                </Callout>
              </Appear>
            </Stack>
          }
        />
      </SlideFrame>
    );
  },
);

export default sinkhornWhyScene;
