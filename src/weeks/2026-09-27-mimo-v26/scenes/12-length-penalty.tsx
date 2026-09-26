import React from 'react';
import { interpolateColors } from 'remotion';
import { Appear, defineScene, step, useCurrentStepIndex, useStepProgress } from '@/lib/timeline';
import { Callout, ColumnBars, EqSteps, Fill, Grid, Label, LineChart, SlideFrame, Spec, Stack, WalkthroughStage } from '@/lib/kit';
import { useTheme } from '@/lib/theme';
import { fig9Tokens } from '../data/pen-fig9';
import {
  LEN_G,
  deductionCurve,
  lenAdvantage,
  lenAdvantagePlain,
  lenHardPassRate,
  lenHardReward,
  lenParams,
  lenResult,
  lenReward,
  lenTokensK,
  mean,
} from '../data/pen-length-example';

/**
 * §4.3.3 (Eq. 4) on one prompt's group of 8 (예시): trajectories grow during RL
 * (Fig. 9, read off the figure), so the reward of a successful rollout is cut
 * by how far its length runs past a per-prompt reference ℓ* — the B-th
 * percentile of the passing lengths. The penalty curve, the pass-rate gate and
 * the advantage recomputed from R̃ follow. X, δ, s, γ, A and B are examples;
 * every number on screen comes from data/pen-length-example.ts or data/pen-fig9.ts.
 */
const SUB = '₀₁₂₃₄₅₆₇₈₉';
const TAU = Array.from({ length: LEN_G }, (_, i) => `τ${SUB[i + 1]}`);
const P = lenParams;
const RES = lenResult;
const REF = RES.reference;
const PASS = RES.passIdx;
/** passes that lose reward, shortest first */
const CUT = PASS.filter((i) => RES.deduction[i]! > 0);
const SHORT = PASS.filter((i) => RES.deduction[i] === 0);
const FAILS = lenReward.flatMap((r, i) => (r === 1 ? [] : [i]));
/** the longest failure: long, yet never deducted */
const LONG_FAIL = FAILS.reduce((a, b) => (lenTokensK[b]! > lenTokensK[a]! ? b : a));
const LONGEST_PASS = CUT[CUT.length - 1]!;
/** the curve spans the passing ratios, rounded out to half steps */
const X_MIN = 0.5;
const X_MAX = Math.ceil(Math.max(...PASS.map((i) => RES.ratio[i]!)) * 2) / 2;
const CURVE = deductionCurve(X_MIN, X_MAX, 200);
/** A labels on a subset: three identical +0.457 columns side by side would collide, and the middle one keeps clear of τ₄'s */
const A_LABELS = [SHORT[Math.floor(SHORT.length / 2)]!, ...CUT, FAILS[0]!];

const trim = (v: number) => String(Number(v.toFixed(3)));
const signed = (v: number) => (Math.abs(v) < 5e-4 ? '0' : `${v > 0 ? '+' : '−'}${Math.abs(v).toFixed(3)}`);
const first = (pts: { y: number }[]) => pts[0]!.y;
const last = (pts: { y: number }[]) => pts[pts.length - 1]!.y;
const count = (r: number[]) => r.filter((v) => v === 1).length;

/** stacked in one grid cell so layers crossfade without re-flowing the column */
const Swap: React.FC<{ layers: { opacity: number; node: React.ReactNode }[]; style?: React.CSSProperties }> = ({
  layers,
  style,
}) => (
  <div style={{ display: 'grid', ...style }}>
    {layers.map((l, i) => (
      <div key={i} style={{ gridArea: '1 / 1', opacity: l.opacity, minWidth: 0, minHeight: 0 }}>
        {l.node}
      </div>
    ))}
  </div>
);

const Caption: React.FC<{ children: React.ReactNode; chips?: React.ReactNode }> = ({ children, chips }) => (
  <Stack gap={1}>
    <Label size="sm" color="textSecondary" weight={600}>
      {children}
    </Label>
    {chips ? (
      <Stack direction="row" gap={2} align="center">
        {chips}
      </Stack>
    ) : null}
  </Stack>
);

const PanelTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Label size="sm" weight={600}>
    {children}
  </Label>
);

export const lengthPenaltyScene = defineScene(
  {
    id: '12-length-penalty',
    title: '그룹 상대 길이 페널티',
    steps: [
      step('growth', 2.6),
      step('reference', 2.8),
      step('curve', 3.0),
      step('gate', 3.0),
      step('effect', 2.8, { hold: 0.6 }),
    ],
  },
  () => {
    const t = useTheme();
    const idx = useCurrentStepIndex();
    const passColor = t.palette.series[0]!;
    const failColor = t.palette.series[1]!;

    // every swap is sequential (the old layer is gone before the new one arrives), so two texts never overlap
    const swapOut = [
      useStepProgress('reference', { portion: [0, 0.08] }),
      useStepProgress('curve', { portion: [0, 0.08] }),
      useStepProgress('gate', { portion: [0, 0.08] }),
      useStepProgress('effect', { portion: [0, 0.08] }),
    ];
    const swapIn = [
      useStepProgress('reference', { portion: [0.08, 0.18] }),
      useStepProgress('curve', { portion: [0.08, 0.18] }),
      useStepProgress('gate', { portion: [0.08, 0.18] }),
      useStepProgress('effect', { portion: [0.08, 0.18] }),
    ];
    /** layer k is on screen from beat k to beat k+1 */
    const layer = (k: number) => (k === 0 ? 1 : swapIn[k - 1]!) * (k < swapOut.length ? 1 - swapOut[k]! : 1);
    const curveOut = swapOut[1]!;
    const curveIn = swapIn[1]!;
    const rewardOut = swapOut[2]!;
    const rewardIn = swapIn[2]!;

    const figP = useStepProgress('growth', { portion: [0.1, 0.85], easing: 'linear' });
    const lenGrow = useStepProgress('reference', { portion: [0.1, 0.5] });
    const refIn = useStepProgress('reference', { portion: [0.55, 0.8] });
    const curveP = useStepProgress('curve', { portion: [0.2, 0.8], easing: 'linear' });
    const bandIn = useStepProgress('curve', { portion: [0.5, 0.8] });
    const cutP = useStepProgress('gate', { portion: [0.3, 0.75], easing: 'inOut' });
    // τ₄/τ₅ start together at 1 and split apart: hide the value labels while the cut moves them
    const gateOut = useStepProgress('gate', { portion: [0.2, 0.3] });
    const gateIn = useStepProgress('gate', { portion: [0.78, 0.95] });
    // effect: the R̃ labels leave first (τ₅'s 0.5 sits where R̄ = 0.543 lands), then R̄ appears and slides to zero
    const rOut = swapOut[3]!;
    const meanIn = useStepProgress('effect', { portion: [0.1, 0.25] });
    const advP = useStepProgress('effect', { portion: [0.28, 0.8], easing: 'inOut' });
    const aIn = useStepProgress('effect', { portion: [0.8, 0.95] });

    // failures do not count towards ℓ*: they fade to the muted tone as the reference line lands
    const lenColors = lenReward.map((r) => (r === 1 ? passColor : interpolateColors(refIn, [0, 1], [failColor, t.palette.colors.muted])));

    const inA = idx === 4 && rOut >= 1;
    const reward = inA
      ? { values: lenAdvantage, from: RES.adjusted, morph: advP, valueOpacity: aIn, valueIndices: A_LABELS }
      : idx === 4
        ? { values: RES.adjusted, from: undefined, morph: 1, valueOpacity: 1 - rOut, valueIndices: undefined }
        : { values: RES.adjusted, from: lenReward, morph: cutP, valueOpacity: Math.max(1 - gateOut, gateIn), valueIndices: undefined };
    // subtracting R̄ slides the mean line onto zero together with every column
    const meanLine = mean(RES.adjusted) * (1 - advP);

    const fig9 = [
      { label: 'Flash', color: t.palette.series[3], points: fig9Tokens.flash },
      { label: 'Pro', color: t.palette.series[2], points: fig9Tokens.pro },
    ];
    const curveSeries = [
      { label: '', color: 'accent', points: CURVE },
      ...CUT.map((i) => ({ label: TAU[i]!, color: passColor, points: [{ x: RES.ratio[i]!, y: RES.deduction[i]! }] })),
    ];

    return (
      <SlideFrame title="정답끼리 길이를 비교한다: 길이 페널티" footer="ML Weekly · MiMo-V2.6 §4.3.3, 그림 9">
        <WalkthroughStage
          visual={
            <Stack gap={3} style={{ height: '100%' }}>
              <Stack direction="row" gap={4} align="center">
                <EqSteps
                  size="sm"
                  parts={[
                    {
                      tex: '\\ell_q^\\star = \\mathrm{Quantile}_{B/100}\\{\\ell_j : j\\in\\mathcal P_q\\}',
                      step: 'reference',
                    },
                  ]}
                />
                <Appear step="reference" effect="fade" delay={1.6}>
                  <Spec label="예시">{`B = ${P.B}`}</Spec>
                </Appear>
                {/* the paper names this threshold A; A_min keeps it apart from the advantage A on the same screen */}
                <EqSteps size="sm" parts={[{ tex: '\\frac{|\\mathcal P_q|}{G} > A_{\\min}', step: 'gate' }]} />
                <Appear step="gate" effect="fade" delay={0.6}>
                  <Spec label="예시">{`A_min = ${P.A}`}</Spec>
                </Appear>
              </Stack>
              <Stack direction="row">
                <EqSteps
                  size="md"
                  parts={[
                    { tex: '\\tilde R_i = R_i' },
                    { tex: '\\:-\\:', step: 'curve' },
                    { tex: '\\mathbf{1}[i\\in\\mathcal P_q]\\,', step: 'gate' },
                    {
                      tex: 'X\\left[\\mathrm{clip}\\!\\left(\\frac{\\ell_i/\\ell_q^\\star - 1 - \\delta}{s-\\delta},\\ 0,\\ 1\\right)\\right]^{\\gamma}',
                      step: 'curve',
                    },
                  ]}
                />
              </Stack>
              <Swap
                layers={[
                  {
                    opacity: layer(0),
                    node: (
                      <Caption>
                        그림 9 (근사값): 본 학습 30 스텝 동안 DeepSWE 평가 궤적 하나의 토큰 수가 Flash는{' '}
                        {first(fig9Tokens.flash)}K에서 {last(fig9Tokens.flash)}K로, Pro는 {first(fig9Tokens.pro)}K에서{' '}
                        {last(fig9Tokens.pro)}K로 늘었다.
                      </Caption>
                    ),
                  },
                  {
                    opacity: layer(1),
                    node: (
                      <Caption>
                        예시 프롬프트에서 {LEN_G}번 중 {PASS.length}번 통과했다. 통과한 답만 짧은 순으로 세우면 가운데 값{' '}
                        {trim(REF)}K가 기준 길이 ℓ*가 된다.
                      </Caption>
                    ),
                  },
                  {
                    opacity: layer(2),
                    node: (
                      <Caption
                        chips={
                          <>
                            <Spec label="예시">{`X = ${P.X} · δ = ${P.delta} · s = ${P.s.toFixed(1)} · γ = ${P.gamma}`}</Spec>
                            {CUT.map((i) => (
                              <Spec key={i} label={`${TAU[i]} ${trim(RES.ratio[i]!)}배`}>
                                {`감점 ${trim(RES.deduction[i]!)}`}
                              </Spec>
                            ))}
                          </>
                        }
                      >
                        ℓ*의 (1+δ)배까지는 감점이 없고, 그 뒤로 γ 제곱 곡선을 따라 커지다가 (1+s)배에서 최대 감점 X에 닿는다.
                      </Caption>
                    ),
                  },
                  {
                    opacity: layer(3),
                    node: (
                      <Caption
                        chips={
                          <>
                            <Spec label="이 그룹" tone="ok">
                              {`통과율 ${PASS.length}/${LEN_G} = ${trim(RES.passRate)} > A_min → 감점`}
                            </Spec>
                            <Spec label="어려운 그룹 (예시)" tone="warn">
                              {`${count(lenHardReward)}/${lenHardReward.length} = ${trim(lenHardPassRate)} ≤ A_min → 원래 보상`}
                            </Spec>
                          </>
                        }
                      >
                        감점은 통과한 답에만 붙는다. 실패한 {TAU[LONG_FAIL]}은 {lenTokensK[LONG_FAIL]}K로 길지만 보상 0 그대로다.
                      </Caption>
                    ),
                  },
                  {
                    opacity: layer(4),
                    node: (
                      <Caption
                        chips={
                          <>
                            <Spec label="짧은 정답" tone="ok">{`${signed(lenAdvantagePlain[SHORT[0]!]!)} → ${signed(lenAdvantage[SHORT[0]!]!)}`}</Spec>
                            <Spec label="가장 긴 정답" tone="warn">
                              {`${signed(lenAdvantagePlain[LONGEST_PASS]!)} → ${signed(lenAdvantage[LONGEST_PASS]!)}`}
                            </Spec>
                          </>
                        }
                      >
                        A는 깎인 보상 R̃로 계산한다. 그래서 정답끼리는 짧을수록 A가 크다.
                      </Caption>
                    ),
                  },
                ]}
              />
              <Grid columns={2} gap={4} style={{ flex: 1, minHeight: 0, gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.2fr)' }}>
                <Stack gap={1} style={{ minHeight: 0 }}>
                  <Swap
                    layers={[
                      { opacity: 1 - curveOut, node: <PanelTitle>그림 9: DeepSWE 궤적 토큰 수 (K, 근사값)</PanelTitle> },
                      { opacity: curveIn, node: <PanelTitle>감점 곡선 (예시 값)</PanelTitle> },
                    ]}
                  />
                  <Swap
                    style={{ flex: 1, minHeight: 0 }}
                    layers={[
                      {
                        opacity: 1 - curveOut,
                        node: (
                          <Fill>
                            {({ width, height }) => (
                              <LineChart
                                width={width}
                                height={height}
                                series={fig9}
                                progress={figP}
                                xTicks={[0, 10, 20, 30]}
                                yTicks={[100, 150, 200, 250]}
                                xLabel="RL 스텝"
                              />
                            )}
                          </Fill>
                        ),
                      },
                      {
                        opacity: curveIn,
                        node: (
                          <Fill>
                            {({ width, height }) => (
                              <LineChart
                                width={width}
                                height={height}
                                series={curveSeries}
                                progress={curveP}
                                xTicks={[0.5, 1, 1.5, 2, 2.5]}
                                yTicks={[0, 0.25, 0.5]}
                                xLabel="길이 비율 ℓ/ℓ*"
                                yLabel="감점"
                              />
                            )}
                          </Fill>
                        ),
                      },
                    ]}
                  />
                </Stack>
                <Stack gap={1} style={{ minHeight: 0 }}>
                  <Swap
                    layers={[
                      { opacity: 1 - rewardOut, node: <PanelTitle>예시 프롬프트: 롤아웃 {LEN_G}개의 길이 (K 토큰)</PanelTitle> },
                      { opacity: rewardIn * (1 - swapOut[3]!), node: <PanelTitle>보상 R에서 감점을 뺀 R̃ (예시)</PanelTitle> },
                      { opacity: swapIn[3]!, node: <PanelTitle>어드밴티지 A = R̃ − R̄ (예시)</PanelTitle> },
                    ]}
                  />
                  <Swap
                    style={{ flex: 1, minHeight: 0 }}
                    layers={[
                      {
                        opacity: 1 - rewardOut,
                        node: (
                          <Fill>
                            {({ width, height }) => (
                              <ColumnBars
                                width={width}
                                height={height}
                                values={lenTokensK}
                                progress={lenGrow}
                                labels={TAU}
                                colors={lenColors}
                                highlight={idx === 2 ? CUT : []}
                                refLines={[{ value: REF, label: 'ℓ*', opacity: refIn }]}
                                bands={[
                                  {
                                    from: REF * (1 + P.delta),
                                    to: REF * (1 + P.s),
                                    label: '감점 증가',
                                    opacity: 0.14 * bandIn,
                                  },
                                  { from: REF * (1 + P.s), to: 250, label: '최대 감점', opacity: 0.24 * bandIn },
                                ]}
                                yDomain={[0, 250]}
                                yTicks={[0, 100, 200]}
                                valueFormat={(v) => String(Math.round(v))}
                              />
                            )}
                          </Fill>
                        ),
                      },
                      {
                        opacity: rewardIn,
                        node: (
                          <Fill>
                            {({ width, height }) => (
                              <ColumnBars
                                width={width}
                                height={height}
                                values={reward.values}
                                from={reward.from}
                                morph={reward.morph}
                                labels={TAU}
                                highlight={idx === 3 ? CUT : idx === 4 ? SHORT : []}
                                refLines={[{ value: meanLine, label: 'R̄', opacity: meanIn }]}
                                yDomain={[-0.75, 1]}
                                yTicks={[-0.5, 0, 0.5, 1]}
                                valueFormat={inA ? signed : trim}
                                valueIndices={reward.valueIndices}
                                valueOpacity={reward.valueOpacity}
                              />
                            )}
                          </Fill>
                        ),
                      },
                    ]}
                  />
                </Stack>
              </Grid>
            </Stack>
          }
          explanation={
            <Stack gap={3}>
              <Appear step="growth" effect="rise" delay={0.3}>
                <Callout title="길이 자체를 벌할 수는 없다">
                  RL이 진행되면 답이 길어진다. 그런데 원래 긴 풀이가 필요한 문제도 있다. 그래서 같은 문제의 정답끼리
                  길이를 비교한다.
                </Callout>
              </Appear>
              <Appear step="reference" effect="rise" delay={0.3}>
                <Callout title="기준 길이 ℓ*는 프롬프트마다 잰다">
                  이 프롬프트에서 통과한 답만 길이순으로 세운다. 짧은 쪽에서 B% 지점의 값이
                  {' B 백분위수이고, B = 50이면 중앙값이다.'}
                </Callout>
              </Appear>
              <Appear step="gate" effect="rise" delay={0.3}>
                <Callout tone="ok" title="어려운 문제는 봐준다">
                  통과율이 문턱 A_min을 넘는 그룹에서만 감점한다. 통과가 드문 어려운 프롬프트에는 길게 탐색할 여지를
                  남긴다.
                </Callout>
              </Appear>
            </Stack>
          }
        />
      </SlideFrame>
    );
  },
);

export default lengthPenaltyScene;
