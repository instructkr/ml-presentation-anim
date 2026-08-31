import React from 'react';
import { Appear, defineScene, step, useStepProgress } from '@/lib/timeline';
import {
  Callout,
  EqSteps,
  Fill,
  Label,
  LineChart,
  SlideFrame,
  Stack,
} from '@/lib/kit';

/**
 * Appendix C, second half — the step where the word "quantile" is earned.
 *
 * The paper states the coordinate minimiser and moves on, which is why §2.3.3
 * reads like a heuristic. It is not: f is a sum of hinges, so it is convex and
 * piecewise linear, its slope counts margins above the threshold, and that
 * count passes k exactly at the (k+1)-th largest margin. Drawn on eight
 * numbers, the whole argument is visible at once — the kinks sit on the
 * margins, and the flat bottom is the interval where the count equals k.
 */

/** eight margins for one token: 0.9 0.7 0.5 0.3 0.1 −0.1 −0.4 −0.8, with k = 3 */
/** −0.1 is dropped from the axis only: its label collides with 0.1 at this width */
const TICKS = [-0.8, -0.4, 0.3, 0.5, 0.9];

/** f(α) = kα + Σ (m − α)₊ evaluated at every kink, plus one point past each end */
const CURVE = [
  { x: -1.0, y: 6.2 },
  { x: -0.8, y: 5.2 },
  { x: -0.4, y: 3.6 },
  { x: -0.1, y: 2.7 },
  { x: 0.1, y: 2.3 },
  { x: 0.3, y: 2.1 },
  { x: 0.5, y: 2.1 },
  { x: 0.7, y: 2.3 },
  { x: 0.9, y: 2.7 },
  { x: 1.1, y: 3.3 },
];
/** the flat bottom: every α in here has exactly k margins above it */
const FLOOR = [
  { x: 0.3, y: 2.1 },
  { x: 0.5, y: 2.1 },
];

export const qbMinimiseScene = defineScene(
  {
    id: '04-qb-minimise',
    title: '유도 — 분위수가 나오는 계산',
    steps: [
      step('hinge', 2.8),
      step('slope', 3.0),
      step('min', 3.2),
      step('both', 2.8, { hold: 0.6 }),
    ],
  },
  () => {
    const hingeP = useStepProgress('hinge');
    const minP = useStepProgress('min');
    const series = [
      { label: 'f(α)', points: CURVE },
      ...(minP > 0 ? [{ label: '기울기 0', color: 'ok', points: FLOOR }] : []),
    ];
    return (
      <SlideFrame
        title="유도 ② — 최소점을 실제로 찾아보면 k+1번째 값이 나온다"
        footer="ML Weekly · Kimi K3 부록 C"
      >
        <Stack gap={4} style={{ height: '100%' }}>
          <Stack direction="row" gap={7} style={{ flex: 1, minHeight: 0 }}>
            <Stack gap={2} style={{ flex: 1.25, minWidth: 0, minHeight: 0 }}>
              <Label size="sm" color="textSecondary" weight={600}>
마진 8개 (0.9 0.7 0.5 0.3 0.1 −0.1 −0.4 −0.8), k = 3 · 꺾인 점이 곧 마진의 위치다
              </Label>
              <div style={{ flex: 1, minHeight: 0 }}>
                <Fill>
                  {({ width, height }) => (
                    <LineChart
                      width={width}
                      height={height}
                      series={series}
                      progress={hingeP}
                      markers
                      xTicks={TICKS}
                      xLabel="임계값 α"
                      yLabel="f(α)"
                      xFormat={(v) => v.toFixed(1)}
                      yFormat={(v) => v.toFixed(1)}
                    />
                  )}
                </Fill>
              </div>
              <EqSteps
                size="sm"
                parts={[
                  { tex: 'm_{ij} = s_{ij} - \\beta_j' },
                  { tex: ',\\quad f(\\alpha) = k\\,\\alpha + \\textstyle\\sum_j (m_{ij} - \\alpha)_+', step: 'hinge' },
                ]}
              />
              <EqSteps
                size="sm"
                parts={[
                  { tex: "\\Longrightarrow\\; f'(\\alpha) = k - \\#\\{\\, j : m_{ij} > \\alpha \\,\\}", step: 'slope' },
                  { tex: '\\;= 0 \\iff \\alpha = m_{i,(k+1)}', step: 'min' },
                ]}
              />
            </Stack>

            <Stack gap={4} style={{ flex: 1, minWidth: 0, minHeight: 0 }}>
              <Appear step="slope" effect="rise">
                <Callout title="기울기가 계단인 이유">
f는 꺾인 직선 (m − α)<sub>+</sub>을 여러 개 더한 것이다. α가 마진 하나를 지나칠 때마다 그
                  항이 꺼지므로, 기울기는 k에서 α보다 큰 마진의 개수를 뺀 값이 된다. 그림의 꺾인 점이
                  곧 마진 8개의 위치다.
                </Callout>
              </Appear>
              <Appear step="min" effect="rise">
                <Callout tone="ok" title="그래서 최소점이 k+1번째 값이다">
왼쪽 끝에서는 큰 마진이 8개라 기울기가 3 − 8 = −5다. 오른쪽으로 밀수록 개수가 줄어
                  기울기가 올라가고, 개수가 k = 3인 구간에서 0이 된다. 평평한 바닥 [0.3, 0.5]가 그
                  구간이고, 왼쪽 끝 0.3이 크기순 4번째 마진이다.
                </Callout>
              </Appear>
              <Appear step="both" effect="rise">
                <Callout tone="ok" title="이름이 Quantile Balancing인 이유">
0.3은 위에 정확히 3개를 남기는 자리이므로 앞 편의 정의로 1 − k/n 분위수다. β도 같은 계산을
                  열 방향으로 한 것이고, q/m = k/n이라 분위수 자리까지 같다.
                </Callout>
              </Appear>
            </Stack>
          </Stack>

        </Stack>
      </SlideFrame>
    );
  },
);

export default qbMinimiseScene;
