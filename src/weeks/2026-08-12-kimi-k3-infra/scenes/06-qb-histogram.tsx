import React from 'react';
import { Appear, defineScene, step, useStepProgress } from '@/lib/timeline';
import {
  BarChart,
  Callout,
  DiagramView,
  EqSteps,
  Fill,
  Grid,
  Label,
  SlideFrame,
  Stack,
  WalkthroughStage,
} from '@/lib/kit';
import { qbHistogramDetail } from '../diagrams/qb-histogram.diagram';

/**
 * Appendix D. One expert's histogram of the *required bias* r = α − s, binned
 * over a range the current bias already bounds. The target rank q = mk/n is
 * read off the cumulative counts from the bottom, which is where the sign flip
 * lands: b = −β, so "the top q margins" becomes "the bottom q required biases".
 *
 * The whole global-batch quantile therefore costs one integer all-reduce per
 * layer per step instead of a gather of O(mn) floats per micro-batch.
 */
const BINS = [
  { label: '−1.0', value: 2 },
  { label: '−0.8', value: 6 },
  { label: '−0.6', value: 15 },
  { label: '−0.4', value: 34 },
  { label: '−0.2', value: 61 },
  { label: '0.0', value: 88 },
  { label: '0.2', value: 74 },
  { label: '0.4', value: 47 },
  { label: '0.6', value: 22 },
  { label: '0.8', value: 9 },
  { label: '1.0', value: 3 },
];
/** cumulative counts from the bottom first reach q ≈ 180k inside this bin */
const CUT_BIN = 5;

export const qbHistogramScene = defineScene(
  {
    id: '06-qb-histogram',
    title: '실제로는 어떻게 계산하나',
    steps: [
      step('problem', 2.6),
      step('required', 2.8),
      step('local', 2.8),
      step('allreduce', 2.6),
      step('read', 3.0),
      step('props', 2.8, { hold: 0.6 }),
    ],
  },
  () => {
    const localP = useStepProgress('local');
    const readP = useStepProgress('read');
    return (
      <SlideFrame
        title="구현 — 값을 모으지 않고 개수만 세서 분위수를 얻는다"
        footer="ML Weekly · Kimi K3 부록 D"
      >
        <WalkthroughStage
          placement="bottom"
          gap={4}
          visual={
            <Stack direction="row" gap={4} style={{ height: '100%' }}>
              <div style={{ flex: 1.35, minWidth: 0, minHeight: 0 }}>
                <DiagramView
                  diagram={qbHistogramDetail}
                  stepEffects={{
                    // 'batch'는 어떤 reveal에도 없다 — frame-0 앵커 (hard rule 6)
                    problem: {
                      reveal: ['spread', 'e-batch-spread'],
                      highlight: ['batch', 'spread'],
                      camera: { focus: ['batch', 'spread'], padding: 90 },
                    },
                    required: {
                      reveal: ['req', 'range', 'e-batch-req', 'e-range-hist', 'e-req-naive', 'naive'],
                      highlight: ['req', 'range'],
                      camera: { focus: ['batch', 'req', 'range'], padding: 60 },
                    },
                    local: {
                      reveal: ['hist', 'accum', 'e-req-hist', 'e-accum-hist'],
                      highlight: ['hist', 'accum'],
                      pulse: ['e-req-hist'],
                      camera: { focus: ['req', 'hist', 'accum'], padding: 60 },
                    },
                    allreduce: {
                      reveal: ['ar', 'global', 'e-hist-ar', 'e-ar-global'],
                      highlight: ['ar', 'global'],
                      pulse: ['e-hist-ar'],
                      camera: { focus: ['ar', 'global'], padding: 60 },
                    },
                    read: {
                      reveal: ['cum', 'interp', 'center', 'e-global-cum', 'e-cum-interp', 'e-interp-center'],
                      highlight: ['cum', 'interp'],
                      camera: { focus: ['cum', 'interp'], padding: 60 },
                    },
                    props: {
                      reveal: ['ema', 'e-center-ema'],
                      highlight: ['center', 'ema'],
                      // 마지막 비트는 파이프라인 전체로 물러난다 (썸네일 프레임)
                      camera: { focus: [] },
                    },
                  }}
                />
              </div>
              <Stack gap={2} style={{ flex: 1, minWidth: 0, minHeight: 0 }}>
                <Label size="sm" color="textSecondary" weight={600}>
                  전문가 하나에 대한 필요 bias 분포 · 아래에서부터 세어 q ≈ 180k에 닿는 칸이 답
                </Label>
                <div style={{ flex: 1, minHeight: 0 }}>
                  <Fill>
                    {({ width, height }) => (
                      <BarChart
                        width={width}
                        height={height}
                        data={BINS}
                        progress={localP}
                        highlightIndex={readP > 0 ? CUT_BIN : undefined}
                        valueFormat={(v) => `${v}k`}
                      />
                    )}
                  </Fill>
                </div>
              </Stack>
            </Stack>
          }
          explanation={
            <Stack gap={3}>
              <EqSteps
                size="sm"
                parts={[
                  { tex: 'r_{ij} = \\alpha_i - s_{ij} = -(s_{ij} - \\alpha_i)' },
                  { tex: '\\;\\in\\; [\\,b_{\\min}-1,\\; b_{\\max}+1\\,]', step: 'required' },
                  {
                    tex: ',\\qquad \\hat b_j = \\mathrm{quantile}_{k/n}(r_{:,j}) = b_{\\min}-1+\\Big(\\beta_j + \\mathrm{clip}\\big(\\tfrac{q-c_j}{h_j},0,1\\big)\\Big)w',
                    step: 'read',
                  },
                ]}
              />
              <Grid columns={3} gap={4}>
                <Appear step="required" effect="rise">
                  <Callout title="세는 값은 마진이 아니라 필요 bias다">
r = α − s는 전문가 j를 토큰 i의 컷오프에 딱 올려놓는 데 필요한 bias다. 배포에 쓰는 값이
                    b = −β이므로, 마진의 위쪽 q개를 세는 대신 r의 아래쪽 q개를 세면 같은 답이 나온다.
                    히스토그램을 아래에서부터 누적하는 이유가 그것이다. 구간도 따로 찾을 필요가 없다.
                  </Callout>
                </Appear>
                <Appear step="allreduce" effect="rise">
                  <Callout tone="ok" title="주고받는 것은 스텝당 정수 표 하나">
forward마다 각 랭크가 자기 표에 개수를 더해 넣기만 하므로 micro-batch 사이에는 통신이 없다.
                    스텝이 끝날 때 n × B개의 정수를 한 번 더하면 그만이고, 이 비용은 토큰이 몇 개든{' '}
                    <b>m과 무관하다</b>.
                  </Callout>
                </Appear>
                <Appear step="props" effect="rise">
                  <Callout tone="ok" title="근사인데 왜 믿어도 되나">
개수는 그냥 더해진다. 그래서 합쳐진 표는 배치를 어떻게 쪼개 놓았든 똑같고, 거기서 읽은 값은
                    랭크별 분위수를 평균 낸 것이 아니라 전 배치를 한 덩어리로 본 분위수다. 남는 오차는
                    칸 하나의 폭 안쪽이고, B = 1000이면 10<sup>−3</sup> 수준이다.
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

export default qbHistogramScene;
