import React from 'react';
import { Appear, defineScene, step, useStepProgress } from '@/lib/timeline';
import {
  BarChart,
  Callout,
  EqSteps,
  Fill,
  Grid,
  Label,
  SlideFrame,
  Stack,
  TensorMatrix,
} from '@/lib/kit';

/**
 * The vocabulary scene. "Quantile" is the load-bearing word of §2.3.3 and of
 * both appendices, and the paper never defines it, so it is defined here on
 * eight numbers you can count on screen.
 *
 * The second half is the observation the next two scenes explain: a Top-k
 * router is already cutting one row of the score matrix at a quantile, and
 * cutting the columns at the same quantile is exactly what a balanced load
 * would mean. Why alternating those two cuts converges is Appendix C's job.
 */

/** one token's scores over n = 8 experts, already sorted; k = 3 are switched on */
const K = 3;
const SCORES: { label: string; value: number }[] = [
  { label: 'E₇', value: 0.91 },
  { label: 'E₂', value: 0.83 },
  { label: 'E₆', value: 0.77 },
  { label: 'E₄', value: 0.62 },
  { label: 'E₁', value: 0.55 },
  { label: 'E₈', value: 0.48 },
  { label: 'E₅', value: 0.33 },
  { label: 'E₃', value: 0.19 },
];

/**
 * m = 8 tokens × n = 4 experts, k = 1 — small enough to check by eye.
 * Row-wise maxima give loads (4,3,1,0); column-wise top-q with q = mk/n = 2
 * gives (2,2,2,2) and happens to still hand every token exactly one expert.
 */
const GRID: string[][] = [
  ['0.82', '0.41', '0.30', '0.15'],
  ['0.76', '0.44', '0.34', '0.19'],
  ['0.68', '0.22', '0.51', '0.26'],
  ['0.61', '0.25', '0.18', '0.47'],
  ['0.45', '0.88', '0.26', '0.33'],
  ['0.39', '0.71', '0.21', '0.30'],
  ['0.28', '0.63', '0.24', '0.55'],
  ['0.24', '0.35', '0.66', '0.17'],
];
const BY_ROW: [number, number][] = [
  [0, 0], [1, 0], [2, 0], [3, 0], [4, 1], [5, 1], [6, 1], [7, 2],
];
const BY_COLUMN: [number, number][] = [
  [0, 0], [1, 0], [4, 1], [5, 1], [7, 2], [2, 2], [6, 3], [3, 3],
];

export const qbQuantileScene = defineScene(
  {
    id: '02-qb-quantile',
    title: '분위수란 무엇인가',
    steps: [
      step('sorted', 2.4),
      step('cut', 2.6),
      step('define', 3.0),
      step('row', 2.8),
      step('col', 3.0, { hold: 0.6 }),
    ],
  },
  () => {
    const sortedP = useStepProgress('sorted');
    const cutP = useStepProgress('cut');
    const rowP = useStepProgress('row');
    const colP = useStepProgress('col');
    const cutShown = cutP > 0;
    const byColumn = colP > 0;
    const bars = SCORES.map((d, i) => ({
      ...d,
      color: cutShown ? (i < K ? 'accent' : 'muted') : undefined,
    }));
    return (
      <SlideFrame
        title="도구 하나 — 분위수는 정렬해서 자르는 자리를 가리키는 말이다"
        footer="ML Weekly · Kimi K3 §2.3.3"
      >
        <Stack gap={3} style={{ height: '100%' }}>
          <Stack direction="row" gap={6} style={{ flex: 1, minHeight: 0 }}>
            <Stack gap={2} style={{ flex: 1, minWidth: 0, minHeight: 0 }}>
              <Label size="sm" color="textSecondary" weight={600}>
                토큰 하나가 전문가 8개에 매긴 점수 · 큰 것부터 늘어놓았다 · k = 3
              </Label>
              <div style={{ flex: 1, minHeight: 0 }}>
                <Fill>
                  {({ width, height }) => (
                    <BarChart
                      width={width}
                      height={height}
                      data={bars}
                      progress={sortedP}
                      maxValue={1}
                      highlightIndex={cutShown ? K : undefined}
                      valueFormat={(v) => v.toFixed(2)}
                    />
                  )}
                </Fill>
              </div>
            </Stack>
            <Appear step="row" effect="fade">
              <TensorMatrix
                title={
                  byColumn
                    ? '열마다 위에서 q = 2개 → 부하 (2, 2, 2, 2)'
                    : '행마다 위에서 k = 1개 → 부하 (4, 3, 1, 0)'
                }
                values={GRID}
                rowLabels={['t₁', 't₂', 't₃', 't₄', 't₅', 't₆', 't₇', 't₈']}
                columnLabels={['E₁', 'E₂', 'E₃', 'E₄']}
                highlight={byColumn ? BY_COLUMN : BY_ROW}
                color={byColumn ? 'ok' : 'accent'}
                progress={rowP}
                width={470}
                cellHeight={34}
              />
            </Appear>
          </Stack>

          <Stack gap={2}>
            <EqSteps
              size="sm"
              parts={[
                { tex: 'v_{(1)} \\ge v_{(2)} \\ge \\cdots \\ge v_{(n)}' },
                { tex: ',\\qquad \\tau = v_{(k+1)}', step: 'cut' },
                { tex: '\\;=\\; \\mathrm{quantile}_{1-k/n}(v)', step: 'define' },
              ]}
            />
            <EqSteps
              size="sm"
              parts={[
                { tex: '\\alpha_i = \\mathrm{quantile}_{1-k/n}(s_{i,:})', step: 'row' },
                {
                  tex: ',\\qquad \\beta_j = \\mathrm{quantile}_{1-q/m}(s_{:,j}),\\qquad \\tfrac{q}{m} = \\tfrac{k}{n}',
                  step: 'col',
                },
              ]}
            />
          </Stack>

          <Grid columns={3} gap={4}>
            <Appear step="define" effect="rise">
              <Callout tone="ok" title="정의: p 분위수">
                값을 크기순으로 늘어놓고, 아래에서부터 전체의 p 비율만큼 올라간 자리에 있는 값이 p
                분위수다. 위에 k개만 남기려면 아래에 n − k개가 있어야 하므로 p = 1 − k/n이다. 왼쪽은
                8개 중 위에 3개를 남긴 경우라 p = 5/8이고, 그 자리의 값 0.62가 임계값 τ다.
              </Callout>
            </Appear>
            <Appear step="row" effect="rise">
              <Callout title="Top-k는 이미 분위수로 자르고 있다">
                점수를 늘어놓고 위에서 k개를 자르는 것, 그게 Top-k 라우팅이다. 그러니 토큰마다 임계값이
                하나씩 딸려 있는 셈이고, 그 값 α<sub>i</sub>가 그 행의 1 − k/n 분위수다. 새로운 것은
                없다. 이름만 붙였다.
              </Callout>
            </Appear>
            <Appear step="col" effect="rise">
              <Callout tone="warn" title="같은 표를 세로로 자르면 부하가 맞는다">
                열마다 위에서 q개씩 자르면 부하는 정의상 q가 된다. 오른쪽 표를 가로로 자르면 (4, 3, 1, 0),
                세로로 자르면 (2, 2, 2, 2)다. q/m = k/n이라 세로 자름도 같은 분위수다. 남은 문제는 두
                자름이 서로를 흔든다는 것이고, 그건 다음 편에서 푼다.
              </Callout>
            </Appear>
          </Grid>
        </Stack>
      </SlideFrame>
    );
  },
);

export default qbQuantileScene;
