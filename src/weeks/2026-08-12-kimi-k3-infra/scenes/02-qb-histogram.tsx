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
 * over the range the current bias itself bounds. The target rank q = mk/n is
 * read off the cumulative counts, so the whole global-batch quantile costs one
 * integer all-reduce instead of a gather of O(mn) margins.
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
/** the first bin whose cumulative count reaches ⌈q⌉ — where b̂ⱼ is interpolated */
const CUT_BIN = 5;

export const qbHistogramScene = defineScene(
  {
    id: '02-qb-histogram',
    title: '히스토그램 추정',
    steps: [
      step('need', 2.2),
      step('required', 2.6),
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
      <SlideFrame title="전 배치 분위수를 히스토그램으로 — all-reduce 한 번" footer="ML Weekly · Kimi K3 § D">
        <WalkthroughStage
          placement="bottom"
          gap={4}
          visual={
            <Stack direction="row" gap={4} style={{ height: '100%' }}>
              <div style={{ flex: 1.35, minWidth: 0, minHeight: 0 }}>
                <DiagramView
                  diagram={qbHistogramDetail}
                  stepEffects={{
                    // 'batch'는 어떤 reveal에도 없음 — frame-0 앵커 (hard rule 6)
                    need: {
                      highlight: ['batch'],
                      camera: { focus: ['batch'], padding: 120 },
                    },
                    required: {
                      reveal: ['req', 'range', 'e-batch-req', 'e-range-hist', 'e-req-naive', 'naive'],
                      highlight: ['req', 'range'],
                      camera: { focus: ['batch', 'req', 'range'], padding: 60 },
                    },
                    local: {
                      reveal: ['hist', 'accum', 'e-req-hist', 'e-accum-hist'],
                      highlight: ['hist'],
                      pulse: ['e-req-hist'],
                      camera: { focus: ['hist', 'accum'], padding: 60 },
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
                      camera: { focus: ['center', 'ema'], padding: 60 },
                    },
                  }}
                />
              </div>
              <Stack gap={2} style={{ flex: 1, minWidth: 0, minHeight: 0 }}>
                <Label size="sm" color="textSecondary" weight={600}>
                  전문가 j의 필요 bias 분포 · B개 bin
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
                  { tex: 'r_{ij} = \\alpha_i - s_{ij}' },
                  { tex: '\\;\\in\\; [\\,b_{\\min}-1,\\; b_{\\max}+1\\,]', step: 'required' },
                  {
                    tex: ',\\qquad \\hat b_j = b_{\\min}-1+\\Big(\\beta_j + \\mathrm{clip}\\big(\\tfrac{q-c_j}{h_j},0,1\\big)\\Big)w',
                    step: 'read',
                  },
                ]}
              />
              <Grid columns={3} gap={4}>
                <Appear step="required" effect="rise">
                  <Callout title="마진이 아니라 &lsquo;필요 bias&rsquo;를 담는다">
                    r = α − s는 전문가 j를 토큰 i의 컷오프에 딱 올려놓는 bias. 부호가 뒤집혀 목표가 k/n
                    분위수가 되고, s ∈ (0,1)이라 범위는 현재 bias가 묶어준다.
                  </Callout>
                </Appear>
                <Appear step="allreduce" effect="rise">
                  <Callout tone="ok" title="통신은 스텝당 정수 all-reduce 하나">
                    forward마다 각 랭크가 H ∈ ℕ<sup>n×B</sup>에 scatter-add — micro-batch 사이 통신 0.
                    스텝 끝에 n·B개를 한 번 더하면 끝이고 비용은 <b>m과 무관</b>하다.
                  </Callout>
                </Appear>
                <Appear step="props" effect="rise">
                  <Callout tone="ok" title="가산성이 곧 정확성">
                    카운트가 더해지므로 전역 히스토그램은 샤딩 방식과 무관하게 같다 — 랭크별 분위수의
                    평균이 아니라 풀링된 전 배치의 분위수. 오차는 bin 폭 이내.
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
