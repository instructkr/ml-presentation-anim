import React from 'react';
import { Appear, defineScene, step, useCurrentStepIndex, useStepProgress } from '@/lib/timeline';
import { Callout, EqSteps, Label, LineChart, SlideFrame, Stack, Tex } from '@/lib/kit';

/** hand-written, Chinchilla-shaped: each family flattens once its capacity binds */
const FAMILIES = [
  {
    label: '400M',
    points: [
      { x: 1e18, y: 3.45 },
      { x: 3e18, y: 3.2 },
      { x: 1e19, y: 3.02 },
      { x: 3e19, y: 2.92 },
      { x: 1e20, y: 2.87 },
      { x: 3e20, y: 2.85 },
      { x: 1e21, y: 2.84 },
    ],
  },
  {
    label: '1.4B',
    points: [
      { x: 3e18, y: 3.3 },
      { x: 1e19, y: 2.92 },
      { x: 3e19, y: 2.7 },
      { x: 1e20, y: 2.55 },
      { x: 3e20, y: 2.47 },
      { x: 1e21, y: 2.44 },
      { x: 3e21, y: 2.43 },
    ],
  },
  {
    label: '7B',
    points: [
      { x: 1e19, y: 2.95 },
      { x: 3e19, y: 2.62 },
      { x: 1e20, y: 2.38 },
      { x: 3e20, y: 2.22 },
      { x: 1e21, y: 2.12 },
      { x: 3e21, y: 2.07 },
      { x: 1e22, y: 2.05 },
    ],
  },
];

const SUPERSCRIPT = '⁰¹²³⁴⁵⁶⁷⁸⁹';
const powerOfTen = (v: number): string =>
  `10${String(Math.round(Math.log10(v)))
    .split('')
    .map((d) => SUPERSCRIPT[Number(d)])
    .join('')}`;

const Term: React.FC<{ step: string; tex: string; children: React.ReactNode }> = ({
  step: stepId,
  tex,
  children,
}) => (
  <Appear step={stepId} effect="left">
    <Stack direction="row" gap={2} align="baseline">
      <div style={{ width: 150, flexShrink: 0 }}>
        <Tex size="sm">{tex}</Tex>
      </div>
      <Label size="sm" color="textSecondary" style={{ flex: 1 }}>
        {children}
      </Label>
    </Stack>
  </Appear>
);

export const scalingLawsScene = defineScene(
  {
    id: '05-scaling-laws',
    title: '스케일링 법칙',
    steps: [
      step('curves', 2.4, { hold: 0.5 }),
      step('irreducible', 2.0, { hold: 0.4 }),
      step('params', 2.2, { hold: 0.4 }),
      step('data', 2.2, { hold: 0.4 }),
      step('takeaway', 2.0, { hold: 0.8 }),
    ],
  },
  () => {
    const curves = useStepProgress('curves');
    const stepIdx = useCurrentStepIndex();
    return (
      <SlideFrame title="Scaling Laws" footer="ML Weekly · MoE 해부">
        <Stack gap={4} style={{ height: '100%' }}>
          <Stack direction="row" gap={5} style={{ flex: 1, minHeight: 0 }}>
            <LineChart
              series={FAMILIES}
              width={1060}
              height={600}
              progress={curves}
              xScale="log"
              xTicks={[1e18, 1e19, 1e20, 1e21, 1e22]}
              yTicks={[2.0, 2.5, 3.0, 3.5]}
              xFormat={powerOfTen}
              yFormat={(v) => v.toFixed(1)}
              xLabel="학습 연산량 (FLOPs)"
              yLabel="테스트 손실"
              highlightSeries={stepIdx >= 4 ? 2 : undefined}
            />
            <Stack gap={4} justify="center" style={{ flex: 1 }}>
              <div>
                <Label size="lg" weight={700}>
                  Chinchilla 스케일링 법칙
                </Label>
                <Label size="xs" color="muted">
                  Hoffmann et al., 2022
                </Label>
              </div>
              <Term step="irreducible" tex={'E'}>
                데이터 자체의 엔트로피. 모델을 아무리 키워도 남는 하한.
              </Term>
              <Term step="params" tex={'A/N^{\\alpha}'}>
                파라미터 N이 모자라서 생기는 손실. α ≈ 0.34.
              </Term>
              <Term step="data" tex={'B/D^{\\beta}'}>
                학습 토큰 D가 모자라서 생기는 손실. β ≈ 0.28.
              </Term>
              <Appear step="takeaway" effect="rise">
                <Callout tone="ok" title="N과 D를 함께 키운다">
                  두 지수가 비슷하므로, 연산 예산이 커지면 모델 크기와 토큰 수를 거의 같은 비율로 늘리는 것이
                  최적이다.
                </Callout>
              </Appear>
            </Stack>
          </Stack>
          <EqSteps
            size="xl"
            parts={[
              { tex: 'L(N, D) =' },
              { tex: 'E', step: 'irreducible' },
              { tex: '+ \\frac{A}{N^{\\alpha}}', step: 'params' },
              { tex: '+ \\frac{B}{D^{\\beta}}', step: 'data' },
            ]}
          />
        </Stack>
      </SlideFrame>
    );
  },
);

export default scalingLawsScene;
