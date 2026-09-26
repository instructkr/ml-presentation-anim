import React from 'react';
import { Appear, defineScene, step, useCurrentStepIndex, useStepProgress } from '@/lib/timeline';
import { Callout, Fill, Grid, Label, LineChart, SlideFrame, Spec, Stack, WalkthroughStage } from '@/lib/kit';
import { useTheme } from '@/lib/theme';
import { fig8 } from '../data/grade-fig8';

/**
 * §4.3.2, Fig. 8 redrawn: code-only RL on Flash with and without GAR, one
 * small multiple per metric (pass rate, turns, tokens), each swept on its own
 * beat. The paper's points are read off the figure (data/grade-fig8.ts), so
 * the readouts compare both runs at step 28, the last step of the run without
 * GAR. Series carry no end labels: the without-GAR end sits at step 28 right
 * where the with-GAR token line passes later, so one legend serves all three.
 */
/**
 * The run without GAR is the muted neutral; the GAR run takes `series[0]`, the
 * hue the week's column charts use for "pushed up" (set in the components).
 */
const WITHOUT = 'muted';
/** last step of the run without GAR — the step both runs share */
const SHARED_STEP = fig8.passrate.without[fig8.passrate.without.length - 1]!.x;

const at = (pts: { x: number; y: number }[], x: number) => pts.find((p) => p.x === x)!.y;

type Metric = keyof typeof fig8;

const series = (m: Metric, withColor: string) => [
  { label: '', color: WITHOUT, points: fig8[m].without },
  { label: '', color: withColor, points: fig8[m].with },
];

const readout = (m: Metric, fmt: (v: number) => string) =>
  `스텝 ${SHARED_STEP} · 없음 ${fmt(at(fig8[m].without, SHARED_STEP))} · 적용 ${fmt(at(fig8[m].with, SHARED_STEP))}`;

const Panel: React.FC<{
  title: string;
  metric: Metric;
  progress: number;
  highlight: boolean;
  yTicks?: number[];
}> = ({ title, metric, progress, highlight, yTicks }) => {
  const t = useTheme();
  return (
    <Stack gap={1} style={{ height: '100%', minHeight: 0 }}>
      <Label size="sm" weight={600}>
        {title}
      </Label>
      <div style={{ flex: 1, minHeight: 0 }}>
        <Fill>
          {({ width, height }) => (
            <LineChart
              width={width}
              height={height}
              series={series(metric, t.palette.series[0]!)}
              progress={progress}
              markers
              xTicks={[0, 20, 40, 60]}
              yTicks={yTicks}
              highlightSeries={highlight ? 1 : undefined}
            />
          )}
        </Fill>
      </div>
    </Stack>
  );
};

const LegendRow: React.FC<{ color: string; children: React.ReactNode }> = ({ color, children }) => {
  const t = useTheme();
  const c = (t.palette.colors as Record<string, string>)[color] ?? color;
  return (
    <Stack direction="row" gap={2} align="center">
      <div style={{ position: 'relative', width: t.space(6), height: t.space(2) }}>
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: '50%',
            height: t.stroke.thin,
            marginTop: -t.stroke.thin / 2,
            background: c,
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: t.space(1.5),
            height: t.space(1.5),
            marginLeft: -t.space(0.75),
            marginTop: -t.space(0.75),
            borderRadius: '50%',
            background: c,
          }}
        />
      </div>
      <Label size="sm">{children}</Label>
    </Stack>
  );
};

export const garEffectScene = defineScene(
  {
    id: '11-gar-effect',
    title: 'GAR의 효과 (그림 8)',
    steps: [
      step('setup', 2.4),
      step('passrate', 3.0),
      step('turns', 2.6),
      step('tokens', 2.8),
      step('audit', 2.4, { hold: 0.6 }),
    ],
  },
  () => {
    const idx = useCurrentStepIndex();
    const passP = useStepProgress('passrate', { portion: [0.05, 0.8], easing: 'linear' });
    const turnsP = useStepProgress('turns', { portion: [0.05, 0.8], easing: 'linear' });
    const tokensP = useStepProgress('tokens', { portion: [0.05, 0.8], easing: 'linear' });
    const audit = idx === 4;
    const withColor = useTheme().palette.series[0]!;

    return (
      <SlideFrame title="GAR이 바꾼 것: 통과율과 길이" footer="ML Weekly · MiMo-V2.6 §4.3.2, 그림 8">
        <WalkthroughStage
          visual={
            <Grid columns={2} gap={4} style={{ height: '100%', gridTemplateRows: 'minmax(0, 1fr) minmax(0, 1fr)' }}>
              <Panel
                title="통과율 (%, 문제당 3회 평균)"
                metric="passrate"
                progress={passP}
                highlight={audit}
                yTicks={[40, 50, 60, 70]}
              />
              <Panel
                title="평균 턴 수 (도구 호출 왕복)"
                metric="turns"
                progress={turnsP}
                highlight={audit}
                yTicks={[100, 110, 120, 130, 140]}
              />
              <Panel
                title="평균 토큰 길이 (K)"
                metric="tokens"
                progress={tokensP}
                highlight={audit}
                yTicks={[140, 160, 180, 200]}
              />
              <Stack gap={2} justify="center" style={{ height: '100%' }}>
                <Stack direction="row" gap={5} align="center">
                  <LegendRow color={withColor}>GAR 적용</LegendRow>
                  <LegendRow color={WITHOUT}>GAR 없음</LegendRow>
                </Stack>
                <Label size="xs" color="muted">
                  가로축은 RL 스텝이고, 점은 그림 8에서 읽은 근사값이다.
                </Label>
                <Appear step="setup" effect="fade" delay={0.3}>
                  <Spec label="설정">
                    Flash · 코드 과제만 RL · 배치 128
                    <br />
                    토큰 평균 집계 · DeepSWE v1.1
                  </Spec>
                </Appear>
                <Appear step="passrate" effect="fade" delay={2.2}>
                  <Spec label="통과율">{readout('passrate', (v) => `${v.toFixed(1)}%`)}</Spec>
                </Appear>
                <Appear step="turns" effect="fade" delay={1.8}>
                  <Spec label="턴 수">{readout('turns', (v) => v.toFixed(0))}</Spec>
                </Appear>
                <Appear step="tokens" effect="fade" delay={2.0}>
                  <Spec label="토큰 길이">{readout('tokens', (v) => `${v.toFixed(0)}K`)}</Spec>
                </Appear>
              </Stack>
            </Grid>
          }
          explanation={
            <Stack gap={3}>
              <Appear step="setup" effect="rise" delay={0.3}>
                <Callout title="같은 학습에서 GAR만 켜고 끈다">
                  Flash를 코드 과제로만 RL 학습하며, GAR을 쓴 실행과 쓰지 않은 실행을 비교한다.
                </Callout>
              </Appear>
              <Appear step="tokens" effect="rise" delay={0.6}>
                <Callout tone="warn" title="길이가 폭주하면 통과율이 꺾인다">
                  GAR이 없으면 턴과 토큰이 빠르게 늘어 길이 한도에 걸리는 궤적이 많아진다. 그래서 통과율 상승이
                  이어지지 못한다.
                </Callout>
              </Appear>
              <Appear step="audit" effect="rise" delay={0.3}>
                <Callout tone="ok" title="코드 리뷰에서도 차이가 났다">
                  GAR 없이 학습한 정책은 추측성 호환 분기, 과한 export, 예외 삼키기, 느슨한 검증, 평가용 설정 변경을
                  늘렸다. GAR을 쓴 정책은 요청 범위 안에서 작고 정확하게 고쳤다.
                </Callout>
              </Appear>
            </Stack>
          }
        />
      </SlideFrame>
    );
  },
);

export default garEffectScene;
