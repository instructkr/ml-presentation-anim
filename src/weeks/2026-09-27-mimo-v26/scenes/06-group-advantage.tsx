import React from 'react';
import { Appear, defineScene, step, useCurrentStepIndex, useStepProgress } from '@/lib/timeline';
import { Callout, ColumnBars, EqSteps, Fill, Label, SlideFrame, Spec, Stack, WalkthroughStage } from '@/lib/kit';

/**
 * §4.1 / §4.3.2 on one group of G = 16 rollouts: reward → group mean →
 * advantage A_i = R_i − R̄, then two more prompts to show what the size of A
 * means (a rare success on a hard prompt) and when it vanishes (every attempt
 * passes). All three groups are made-up examples; every number on screen is
 * computed from the 0/1 rewards below. The paper does not divide by the
 * group's standard deviation, so neither does this scene.
 */
const G = 16;
const SUB = '₀₁₂₃₄₅₆₇₈₉';
const LABELS = Array.from({ length: G }, (_, i) => `τ${[...String(i + 1)].map((d) => SUB[Number(d)]).join('')}`);

const passing = (idx: number[]) => Array.from({ length: G }, (_, i) => (idx.includes(i) ? 1 : 0));
const passCount = (r: number[]) => r.filter((v) => v === 1).length;
const mean = (r: number[]) => r.reduce((a, b) => a + b, 0) / r.length;
const advantage = (r: number[]) => r.map((v) => v - mean(r));
/** caption chip, e.g. 'R̄ = 10/16 = 0.625' */
const meanText = (r: number[]) => `R̄ = ${passCount(r)}/${G} = ${mean(r)}`;

/** prompt A: 10 of 16 pass → R̄ = 0.625 → A = +0.375 / −0.625 */
const R_A = [1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 0, 1, 0];
/** prompt B, harder: 2 of 16 pass → R̄ = 0.125 → A = +0.875 / −0.125 */
const B_PASS = [5, 11];
const R_B = passing(B_PASS);
/** prompt C, easy: 16 of 16 pass → R̄ = 1 → A = 0 everywhere */
const R_C = passing(Array.from({ length: G }, (_, i) => i));
const A_A = advantage(R_A);
const A_B = advantage(R_B);
const A_C = advantage(R_C);

/** one passing and one failing column carry a value label; all sixteen would collide */
const LABELS_A = [2, 4];
const LABELS_B = [5, 6];

const signed = (v: number) => (Math.abs(v) < 5e-4 ? '0' : `${v > 0 ? '+' : '−'}${Math.abs(v).toFixed(3)}`);

/** stacked in one grid cell so captions crossfade without re-flowing the column */
const Swap: React.FC<{ layers: { opacity: number; node: React.ReactNode }[] }> = ({ layers }) => (
  <div style={{ display: 'grid' }}>
    {layers.map((l, i) => (
      <div key={i} style={{ gridArea: '1 / 1', opacity: l.opacity }}>
        {l.node}
      </div>
    ))}
  </div>
);

const Caption: React.FC<{ text: string; mean?: string; meanOpacity?: number }> = ({ text, mean: m, meanOpacity = 1 }) => (
  <Stack direction="row" gap={3} align="center">
    <Label size="sm" color="textSecondary" weight={600}>
      {text}
    </Label>
    {m ? (
      <div style={{ opacity: meanOpacity }}>
        <Spec label="평균">{m}</Spec>
      </div>
    ) : null}
  </Stack>
);

export const groupAdvantageScene = defineScene(
  {
    id: '06-group-advantage',
    title: '그룹 상대 어드밴티지',
    steps: [
      step('group', 2.6),
      step('mean', 2.2),
      step('advantage', 2.8),
      step('surprise', 2.8),
      step('flat', 2.6, { hold: 0.6 }),
    ],
  },
  () => {
    const idx = useCurrentStepIndex();
    const growP = useStepProgress('group', { portion: [0.15, 0.75] });
    const meanP = useStepProgress('mean', { portion: [0, 0.4] });
    const advP = useStepProgress('advantage', { portion: [0.15, 0.8], easing: 'inOut' });
    const surP = useStepProgress('surprise', { portion: [0.2, 0.85], easing: 'inOut' });
    const flatP = useStepProgress('flat', { portion: [0.2, 0.8], easing: 'inOut' });
    // value labels leave before each morph and return on the new columns; the A labels wait until the
    // columns are nearly down, so no R value (+1.000) is ever printed under the A axis
    const advOut = useStepProgress('advantage', { portion: [0, 0.12] });
    const advIn = useStepProgress('advantage', { portion: [0.7, 0.9] });
    const surOut = useStepProgress('surprise', { portion: [0, 0.15] });
    // τ6/τ7 start the morph at the same +0.375 and sit one slot apart — label them once they've split
    const surIn = useStepProgress('surprise', { portion: [0.75, 0.95] });
    const flatOut = useStepProgress('flat', { portion: [0, 0.15] });
    const flatIn = useStepProgress('flat', { portion: [0.8, 1] });
    const toB = useStepProgress('surprise', { portion: [0, 0.2] });
    const toC = useStepProgress('flat', { portion: [0, 0.2] });

    const chart = (() => {
      switch (idx) {
        case 0:
        case 1:
          return { values: R_A, from: undefined, morph: 1, valueIndices: undefined, valueOpacity: 1 };
        case 2:
          return advOut < 1
            ? { values: A_A, from: R_A, morph: advP, valueIndices: undefined, valueOpacity: 1 - advOut }
            : { values: A_A, from: R_A, morph: advP, valueIndices: LABELS_A, valueOpacity: advIn };
        case 3:
          return surOut < 1
            ? { values: A_B, from: A_A, morph: surP, valueIndices: LABELS_A, valueOpacity: 1 - surOut }
            : { values: A_B, from: A_A, morph: surP, valueIndices: LABELS_B, valueOpacity: surIn };
        default:
          return flatOut < 1
            ? { values: A_C, from: A_B, morph: flatP, valueIndices: LABELS_B, valueOpacity: 1 - flatOut }
            : { values: A_C, from: A_B, morph: flatP, valueIndices: undefined, valueOpacity: flatIn };
      }
    })();
    // axis title and label format switch to A on the morph's first frame, after the R labels have faded out
    const inA = idx > 2 || (idx === 2 && advP > 0);
    // subtracting R̄ slides the mean line down onto zero together with every column
    const meanLine = mean(R_A) * (1 - (idx >= 2 ? advP : 0));

    return (
      <SlideFrame title="그룹 안에서 비교한다: 상대 어드밴티지" footer="ML Weekly · MiMo-V2.6 §4.1, §4.3.2">
        <WalkthroughStage
          visual={
            <Stack gap={4} style={{ height: '100%' }}>
              <Stack direction="row" gap={5} align="center" justify="space-between">
                <Stack direction="row" gap={6} align="center">
                  <EqSteps size="md" parts={[{ tex: '\\bar R = \\frac{1}{G}\\sum_{i=1}^{G} R_i', step: 'mean' }]} />
                  <EqSteps size="md" parts={[{ tex: 'A_i = R_i - \\bar R', step: 'advantage' }]} />
                </Stack>
                <Stack gap={2} align="flex-end">
                  <Appear step="group" effect="fade" delay={0.4}>
                    <Stack direction="row" gap={2}>
                      <Spec label="그룹 크기">G = 16</Spec>
                      <Spec label="프롬프트">1,568개 / 스텝</Spec>
                    </Stack>
                  </Appear>
                  <Appear step="flat" effect="fade" delay={1.6}>
                    <Spec label="동적 샘플러" tone="warn">
                      전부 통과·전부 실패 그룹 제외
                    </Spec>
                  </Appear>
                </Stack>
              </Stack>
              <Swap
                layers={[
                  {
                    opacity: 1 - toB,
                    node: (
                      <Caption
                        text={`프롬프트 A (예시): ${G}번 풀어 ${passCount(R_A)}번 통과`}
                        mean={meanText(R_A)}
                        meanOpacity={meanP}
                      />
                    ),
                  },
                  {
                    opacity: toB * (1 - toC),
                    node: (
                      <Caption text={`더 어려운 프롬프트 B (예시): ${G}번 중 ${passCount(R_B)}번 통과`} mean={meanText(R_B)} />
                    ),
                  },
                  {
                    opacity: toC,
                    node: (
                      <Caption
                        text="쉬운 프롬프트 C (예시): 모두 통과하면 A가 전부 0이 되어 배울 것이 없다"
                        mean={meanText(R_C)}
                      />
                    ),
                  },
                ]}
              />
              <div style={{ flex: 1, minHeight: 0 }}>
                <Fill>
                  {({ width, height }) => (
                    <ColumnBars
                      width={width}
                      height={height}
                      values={chart.values}
                      from={chart.from}
                      morph={chart.morph}
                      progress={growP}
                      labels={LABELS}
                      highlight={idx === 3 ? B_PASS : []}
                      refLines={[{ value: meanLine, label: 'R̄', opacity: meanP }]}
                      yDomain={[-0.75, 1]}
                      yTicks={[-0.5, 0, 0.5, 1]}
                      yLabel={inA ? '어드밴티지 A' : '보상 R'}
                      valueFormat={inA ? signed : (v) => String(Math.round(v))}
                      valueIndices={chart.valueIndices}
                      valueOpacity={chart.valueOpacity}
                    />
                  )}
                </Fill>
              </div>
            </Stack>
          }
          explanation={
            <Stack gap={3}>
              <Appear step="group" effect="rise" delay={0.3}>
                <Callout title="롤아웃(궤적): 한 번의 풀이 시도 전체">
                  모델이 프롬프트 하나를 도구까지 써 가며 끝까지 풀어 본 기록이다. 테스트를 통과하면 보상 R = 1,
                  실패하면 0을 받는다.
                </Callout>
              </Appear>
              <Appear step="advantage" effect="rise" delay={0.3}>
                <Callout title="어드밴티지: 평균보다 얼마나 나았나">
                  R̄은 모델이 이 문제에서 평소 얻는 점수다. A가 양수인 궤적은 그 토큰이 모두 더 자주 나오게, 음수면
                  덜 나오게 학습한다.
                </Callout>
              </Appear>
              <Appear step="surprise" effect="rise" delay={0.3}>
                <Callout tone="ok" title="뜻밖의 결과일수록 크게 움직인다">
                  {`어려운 문제는 R̄이 낮다. 그래서 드문 성공은 ${signed(A_B[B_PASS[0]!]!)}로 세게 밀어 올리고, 흔한 실패는 ${signed(A_B[0]!)}로 살짝만 끌어내린다.`}
                </Callout>
              </Appear>
            </Stack>
          }
        />
      </SlideFrame>
    );
  },
);

export default groupAdvantageScene;
