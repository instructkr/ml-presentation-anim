import React from 'react';
import { Appear, defineScene, step, useCurrentStepIndex, useStepProgress } from '@/lib/timeline';
import {
  Callout,
  ColumnBars,
  DiagramView,
  EqSteps,
  Fill,
  Label,
  SlideFrame,
  Spec,
  Stack,
  Tex,
  WalkthroughStage,
} from '@/lib/kit';
import { grsDiagram, grsIds } from '../diagrams/grade-grs.diagram';
import {
  GRS_G,
  grsAdvantage,
  grsMean,
  grsReward,
  grsTest,
  grsTestAdvantage,
  grsTestMean,
} from '../data/grade-grs-example';

/**
 * §4.3 / §4.3.1 on one easy task: all eight rollouts pass, so the group mean
 * is 1 and every advantage is 0 (the dead group from 06). GRS builds
 * task-specific rubrics offline, scores each rollout online, and multiplies
 * the two scores into the test reward (Eq. 2). The same eight columns then
 * spread out and carry an advantage again. Every number is computed in
 * data/grade-grs-example.ts; the group is 8 instead of the paper's 16.
 */
const SUB = '₀₁₂₃₄₅₆₇₈₉';
const LABELS = Array.from({ length: GRS_G }, (_, i) => `τ${SUB[i + 1]}`);

const signed = (v: number) => (Math.abs(v) < 5e-4 ? '0' : `${v > 0 ? '+' : '−'}${Math.abs(v).toFixed(3)}`);
const fixed2 = (v: number) => v.toFixed(2);
const allZero = grsTestAdvantage.every((a) => Math.abs(a) < 1e-9);

/** stacked in one grid cell so captions crossfade without re-flowing the column */
const Swap: React.FC<{ layers: { opacity: number; node: React.ReactNode }[] }> = ({ layers }) => (
  <div style={{ display: 'grid', alignItems: 'center', flex: 1, minWidth: 0 }}>
    {layers.map((l, i) => (
      <div key={i} style={{ gridArea: '1 / 1', opacity: l.opacity }}>
        {l.node}
      </div>
    ))}
  </div>
);

const Caption: React.FC<{ text: string; chipLabel: string; chip: string; chipOpacity?: number }> = ({
  text,
  chipLabel,
  chip,
  chipOpacity = 1,
}) => (
  <Stack direction="row" gap={3} align="center">
    <Label size="sm" color="textSecondary" weight={600}>
      {text}
    </Label>
    <div style={{ opacity: chipOpacity }}>
      <Spec label={chipLabel}>{chip}</Spec>
    </div>
  </Stack>
);

export const grsScene = defineScene(
  {
    id: '09-grs',
    title: 'GRS: 루브릭으로 보상 합성',
    steps: [
      step('problem', 2.8),
      step('offline', 2.6),
      step('online', 2.6),
      step('multiply', 3.0),
      step('scope', 2.0, { hold: 0.6 }),
    ],
  },
  () => {
    const idx = useCurrentStepIndex();
    const growP = useStepProgress('problem', { portion: [0.1, 0.6] });
    const meanIn = useStepProgress('problem', { portion: [0.6, 0.85] });
    const chipIn = useStepProgress('problem', { portion: [0.75, 1] });
    // multiply: 1 → R (labels count along), then R → A with the mean line sliding onto zero
    const toR = useStepProgress('multiply', { portion: [0.05, 0.42], easing: 'inOut' });
    const rOut = useStepProgress('multiply', { portion: [0.46, 0.52] });
    const toA = useStepProgress('multiply', { portion: [0.52, 0.88], easing: 'inOut' });
    const aIn = useStepProgress('multiply', { portion: [0.84, 0.95] });
    const swapCaption = useStepProgress('multiply', { portion: [0, 0.2] });

    const inA = idx >= 3 && rOut >= 1;
    const chart =
      idx < 3
        ? { values: grsTest, from: undefined, morph: 1, valueOpacity: 1 }
        : inA
          ? { values: grsAdvantage, from: grsReward, morph: toA, valueOpacity: aIn }
          : { values: grsReward, from: grsTest, morph: toR, valueOpacity: 1 - rOut };
    const meanLine = idx < 3 ? grsTestMean : inA ? grsMean * (1 - toA) : grsTestMean + (grsMean - grsTestMean) * toR;

    return (
      <SlideFrame title="모두 통과해도 배울 게 있다: GRS" footer="ML Weekly · MiMo-V2.6 §4.3, §4.3.1">
        <WalkthroughStage
          visual={
            <Stack gap={3} style={{ height: '100%' }}>
              <div style={{ flex: 1, minHeight: 0 }}>
                <DiagramView
                  diagram={grsDiagram}
                  stepEffects={{
                    offline: { reveal: grsIds.offline, highlight: ['builder'], pulse: ['e-off-rollouts-builder'] },
                    online: {
                      reveal: grsIds.online,
                      highlight: ['grader'],
                      pulse: ['e-rollout-grader', 'e-rubrics-grader'],
                    },
                    multiply: { highlight: ['scores'] },
                  }}
                />
              </div>
              <Stack direction="row" gap={6} align="center">
                <EqSteps
                  size="md"
                  parts={[
                    { tex: 'R_i = R_i^{\\mathrm{test}}' },
                    { tex: '\\cdot S_i^{\\mathrm{sol}}', step: 'multiply' },
                    { tex: '\\cdot S_i^{\\mathrm{beh}}', step: 'multiply' },
                  ]}
                />
                <Appear step="multiply" effect="fade" delay={0.9}>
                  <Tex size="sm" color="textSecondary">
                    {'R_i^{\\mathrm{test}} = 0 \\;\\Rightarrow\\; R_i = 0'}
                  </Tex>
                </Appear>
              </Stack>
              <Stack direction="row" gap={3} align="center" justify="space-between">
                <Swap
                  layers={[
                    {
                      opacity: 1 - swapCaption,
                      node: (
                        <Caption
                          text={`쉬운 과제 (예시): ${GRS_G}번 모두 통과`}
                          chipLabel="평균"
                          chip={`R̄ = ${grsTestMean}${allZero ? ' → A = 0' : ''}`}
                          chipOpacity={chipIn}
                        />
                      ),
                    },
                    {
                      opacity: swapCaption,
                      node: (
                        <Caption
                          text={`같은 ${GRS_G}개에 두 점수를 곱하면 (예시)`}
                          chipLabel="평균"
                          chip={`R̄ = ${grsMean.toFixed(3)}`}
                        />
                      ),
                    },
                  ]}
                />
                <Appear step="scope" effect="fade" delay={0.2} style={{ flexShrink: 0 }}>
                  <Stack direction="row" gap={2}>
                    <Spec label="GRS">통과율 높은 과제 일부</Spec>
                    <Spec label="나머지">GAR</Spec>
                  </Stack>
                </Appear>
              </Stack>
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
                      refLines={[{ value: meanLine, label: 'R̄', opacity: meanIn }]}
                      yDomain={[-0.5, 1]}
                      yTicks={[-0.5, 0, 0.5, 1]}
                      yLabel={inA ? '어드밴티지 A' : '보상 R'}
                      valueFormat={inA ? signed : idx < 3 ? (v) => String(Math.round(v)) : fixed2}
                      valueOpacity={chart.valueOpacity}
                    />
                  )}
                </Fill>
              </div>
            </Stack>
          }
          explanation={
            <Stack gap={3}>
              <Appear step="problem" effect="rise" delay={0.3}>
                <Callout title="테스트는 통과와 실패만 가린다">
                  통과한 패치가 깔끔한지 지저분한지는 테스트 점수에 드러나지 않는다. 그래서 모두 통과한 그룹은 A가
                  전부 0이 되어 버려진다.
                </Callout>
              </Appear>
              <Appear step="offline" effect="rise" delay={0.3}>
                <Callout title="루브릭: 과제마다 만든 채점 기준표">
                  학습 전에 에이전트가 과제의 롤아웃 여러 개를 비교해 기준표를 적는다. 해결 루브릭은 구현을, 행동
                  루브릭은 일하는 방식을 채점한다.
                </Callout>
              </Appear>
              <Appear step="multiply" effect="rise" delay={0.3}>
                <Callout tone="ok" title="곱하기라서 실패는 끝까지 0이다">
                  테스트에 실패하면 루브릭 점수가 높아도 보상은 0이다. 반면 통과한 답끼리는 점수가 갈라져, 모두 통과한
                  그룹에도 A가 생긴다.
                </Callout>
              </Appear>
            </Stack>
          }
        />
      </SlideFrame>
    );
  },
);

export default grsScene;
