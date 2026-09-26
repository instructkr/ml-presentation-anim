import React from 'react';
import { Appear, defineScene, step, useCurrentStepIndex, useStepProgress } from '@/lib/timeline';
import {
  Callout,
  ColumnBars,
  DiagramView,
  EqSteps,
  Fill,
  Grid,
  Label,
  SlideFrame,
  Spec,
  Stack,
  WalkthroughStage,
} from '@/lib/kit';
import { useTheme } from '@/lib/theme';
import { twoEnginesDetail, twoEnginesIds } from '../diagrams/obj-two-engines.diagram';

/**
 * §4.1 / §5.1 / §6.4: why the sampler μ is not the trainer π, the per-token
 * importance ratio r = sg[π/μ], and the decoupled mask M: a token votes only
 * while its r sits inside its sign's bounds, and outside it is dropped, not
 * clipped. Both bounds start at [0.2, 5.0]; the entropy thermostat widens the
 * positive bounds and narrows the negative ones when entropy is too low (and
 * the opposite when it is too high).
 *
 * The twelve ratios are examples, and so is how far the thermostat moves the
 * bounds (the paper gives directions only) — both are labelled 예시 on screen.
 * Which token is masked follows from the ratios and the current bounds every
 * frame, so the mask flips exactly when a bound sweeps past a bar.
 */

const TOKENS = ['t₁', 't₂', 't₃', 't₄', 't₅', 't₆'];
/** tokens of trajectories with A ≥ 0; t₄ starts outside [0.2, 5] */
const R_POS = [1.1, 0.8, 1.4, 6.5, 0.9, 1.2];
/** tokens of trajectories with A < 0; t₂ starts outside, t₅ falls outside once the bounds narrow */
const R_NEG = [1.2, 0.15, 0.9, 1.3, 2.6, 0.7];

type Bounds = [number, number];
/** both directions start here (§5.1) */
const INITIAL: Bounds = [0.2, 5.0];
/** entropy too low → widen the positive bounds, narrow the negative ones; amounts are 예시 */
const LOW_ENTROPY_POS: Bounds = [0.14, 8.0];
const LOW_ENTROPY_NEG: Bounds = [0.3, 2.2];

/** bounds interpolate in log space, the axis the chart is drawn on */
const lerpLog = (a: Bounds, b: Bounds, p: number): Bounds => [
  Math.exp(Math.log(a[0]) + (Math.log(b[0]) - Math.log(a[0])) * p),
  Math.exp(Math.log(a[1]) + (Math.log(b[1]) - Math.log(a[1])) * p),
];
const outside = (r: number[], [lo, hi]: Bounds) => r.flatMap((v, i) => (v < lo || v > hi ? [i] : []));
const fmt = (v: number) => (v >= 1 ? v.toFixed(1) : String(Number(v.toFixed(2))));

const RatioChart: React.FC<{
  values: number[];
  color: string;
  yLabel: string;
  grow: number;
  bounds: Bounds;
  bandOpacity: number;
  maskOn: boolean;
  refOpacity: number;
}> = ({ values, color, yLabel, grow, bounds, bandOpacity, maskOn, refOpacity }) => (
  <Fill>
    {({ width, height }) => (
      <ColumnBars
        width={width}
        height={height}
        values={values}
        progress={grow}
        labels={TOKENS}
        colors={values.map(() => color)}
        muted={maskOn ? outside(values, bounds) : []}
        bands={[{ from: bounds[0], to: bounds[1], color: 'ok', opacity: bandOpacity }]}
        // the starting bounds stay behind as faint guides once the thermostat moves the band
        refLines={[
          { value: INITIAL[0], color: 'muted', opacity: refOpacity },
          { value: INITIAL[1], color: 'muted', opacity: refOpacity },
        ]}
        yScale="log"
        yDomain={[0.1, 10]}
        yTicks={[0.2, 1, 5]}
        yLabel={yLabel}
        valueFormat={fmt}
      />
    )}
  </Fill>
);

export const ratioMaskScene = defineScene(
  {
    id: '08-ratio-mask',
    title: '비율 r과 마스크 M',
    steps: [step('why', 2.8), step('ratio', 2.6), step('mask', 2.8), step('entropy', 3.0, { hold: 0.6 })],
  },
  () => {
    const t = useTheme();
    const idx = useCurrentStepIndex();
    const grow = useStepProgress('ratio', { portion: [0.2, 0.75] });
    const band = useStepProgress('mask', { portion: [0.1, 0.4] });
    const thermo = useStepProgress('entropy', { portion: [0.3, 0.85], easing: 'inOut' });
    const cap = (id: string) => useStepProgress(id, { portion: [0, 0.15] });
    const capIn = [1, cap('ratio'), cap('mask'), cap('entropy')];
    const capOpacity = (i: number) => capIn[i]! * (i + 1 < capIn.length ? 1 - capIn[i + 1]! : 1);

    const posBounds = lerpLog(INITIAL, LOW_ENTROPY_POS, thermo);
    const negBounds = lerpLog(INITIAL, LOW_ENTROPY_NEG, thermo);
    const maskOn = idx >= 2 && band > 0.5;
    const bandOpacity = 0.16 * band;

    const caption = (text: React.ReactNode) => (
      <Label size="sm" color="textSecondary" weight={600}>
        {text}
      </Label>
    );

    return (
      <SlideFrame title="샘플러와 학습기가 다를 때: 비율 r과 마스크 M" footer="ML Weekly · MiMo-V2.6 §4.1, §5.1, §6.4">
        <WalkthroughStage
          visual={
            <Stack gap={2} style={{ height: '100%' }}>
              <div style={{ flex: 1, minHeight: 0 }}>
                <DiagramView
                  diagram={twoEnginesDetail}
                  stepEffects={{
                    // 두 엔진 상자와 설명 줄은 어떤 reveal에도 없음 — frame-0 앵커
                    why: { reveal: twoEnginesIds.why, pulse: ['e-trainer-sampler'], highlight: ['sampler', 'trainer'] },
                    ratio: { highlight: ['sampler', 'trainer'] },
                  }}
                />
              </div>
              {/* r 옆에 M을 두 줄로 — 식은 visual 열 안에 머문다 */}
              <Stack direction="row" gap={5} align="center" justify="space-between">
                <EqSteps
                  size="md"
                  parts={[
                    {
                      tex: 'r_{i,t} = \\mathrm{sg}\\!\\left[\\frac{\\pi_\\theta(o_{i,t})}{\\mu_{\\theta_{\\mathrm{old}}}(o_{i,t})}\\right]',
                      step: 'ratio',
                    },
                  ]}
                  style={{ display: 'inline-block' }}
                />
                <Stack gap={0} align="flex-start">
                  <EqSteps
                    size="md"
                    parts={[
                      {
                        tex: 'M_{i,t} = \\mathbb{1}\\Big[(A_i \\ge 0 \\,\\wedge\\, \\epsilon_+^{l} \\le r_{i,t} \\le \\epsilon_+^{h})',
                        step: 'mask',
                      },
                    ]}
                    style={{ display: 'inline-block' }}
                  />
                  <Stack direction="row" justify="flex-end" style={{ alignSelf: 'stretch' }}>
                    <EqSteps
                      size="md"
                      parts={[
                        {
                          tex: '\\vee\\ (A_i < 0 \\,\\wedge\\, \\epsilon_-^{l} \\le r_{i,t} \\le \\epsilon_-^{h})\\Big]',
                          step: 'mask',
                        },
                      ]}
                      style={{ display: 'inline-block' }}
                    />
                  </Stack>
                </Stack>
              </Stack>
              <Stack direction="row" gap={2}>
                <Appear step="why" effect="fade" delay={1.2}>
                  <Spec label="staleness">최대 4 버전</Spec>
                </Appear>
                <Appear step="mask" effect="fade" delay={0.6}>
                  <Spec label="초기 범위">양수 · 음수 모두 [0.2, 5.0]</Spec>
                </Appear>
                <Appear step="entropy" effect="fade" delay={1.8}>
                  <Spec label="빠진 토큰의 비중">방향마다 따로 지켜본다</Spec>
                </Appear>
              </Stack>
              <div style={{ display: 'grid' }}>
                {[
                  <>
                    같은 토큰이라도 두 사본이 매긴 확률은 조금씩 다르다. 계산 차이로 고르는 전문가까지 바뀔 수
                    있어서, 롤아웃이 고른 전문가를 학습에서 그대로 재현한다.
                  </>,
                  <>막대는 토큰마다의 r이다 (예시, 로그 축). 1보다 크면 지금 모델이 그 토큰을 더 좋아한다.</>,
                  <>
                    M은 괄호 안 조건이 맞으면 1, 아니면 0이다. 범위는 A ≥ 0인 토큰(양수 쪽)과 A &lt; 0인
                    토큰(음수 쪽)에 따로 둔다. 초록 범위 밖 토큰은 잘라 쓰지 않고 통째로 뺀다.
                  </>,
                  <>엔트로피가 너무 낮을 때 (예시): 양수 쪽 범위는 넓어져 t₄가 돌아오고, 음수 쪽은 좁아져 t₅가 빠진다.</>,
                ].map((node, i) => (
                  <div key={i} style={{ gridArea: '1 / 1', opacity: capOpacity(i) }}>
                    {caption(node)}
                  </div>
                ))}
              </div>
              <Grid columns={2} gap={4} style={{ flex: 2.2, minHeight: 0 }}>
                <RatioChart
                  values={R_POS}
                  color={t.palette.series[0]!}
                  yLabel="A ≥ 0인 토큰의 r"
                  grow={grow}
                  bounds={posBounds}
                  bandOpacity={bandOpacity}
                  maskOn={maskOn}
                  refOpacity={thermo}
                />
                <RatioChart
                  values={R_NEG}
                  color={t.palette.series[1]!}
                  yLabel="A < 0인 토큰의 r"
                  grow={grow}
                  bounds={negBounds}
                  bandOpacity={bandOpacity}
                  maskOn={maskOn}
                  refOpacity={thermo}
                />
              </Grid>
            </Stack>
          }
          explanation={
            <Stack gap={2}>
              <Appear step="why" effect="rise" delay={0.3}>
                <Callout title="샘플러와 학습기는 다른 사본이다">
                  롤아웃은 학습과 동시에 돈다. 그래서 궤적을 쓴 사본 μ는 학습기 π보다 몇 버전 늦을 수 있고,
                  이를 staleness라 한다. 엔진이 달라 생기는 계산 차이도 있다.
                </Callout>
              </Appear>
              <Appear step="ratio" effect="rise" delay={0.3}>
                <Callout title="중요도 비율 r: 학습기 ÷ 샘플러">
                  토큰마다 학습기가 준 확률을 샘플러가 준 확률로 나눈다. 이 값으로 표의 무게를 보정한다. sg는 r을
                  무게로만 쓰고 미분하지 않는다는 표시다.
                </Callout>
              </Appear>
              <Appear step="entropy" effect="rise" delay={0.3}>
                <Callout tone="ok" title="엔트로피로 범위를 조절한다">
                  엔트로피는 다음 토큰 확률이 얼마나 퍼졌는지 잰다. 너무 낮으면 양수 쪽 범위를 넓히고 음수 쪽은
                  좁히며, 너무 높으면 반대로 한다.
                </Callout>
              </Appear>
            </Stack>
          }
        />
      </SlideFrame>
    );
  },
);

export default ratioMaskScene;
