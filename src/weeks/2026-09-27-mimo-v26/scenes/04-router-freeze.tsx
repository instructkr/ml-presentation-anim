import React from 'react';
import { Appear, defineScene, step, useStepProgress } from '@/lib/timeline';
import { Callout, Fill, Grid, Label, LineChart, SlideFrame, Spec, Stack, WalkthroughStage } from '@/lib/kit';
import { useTheme } from '@/lib/theme';
import { COLD, CV, PEAK, type LoadPoint } from '../data/opt-router-load';

/**
 * §5.4 Fig. 11 as three live charts (CV, peak load, cold experts) for the two
 * Pro RL runs, then the §5.5 failure that freezing did not prevent. The chart
 * frames and their definitions are the frame-0 anchor; the trainable-router
 * run draws on `collapse`, the frozen run on `freeze`. Curves are the plan's
 * values read off Fig. 11 (근사값, see notes); the chip numbers are the ones
 * §5.4 states in its text.
 *
 * Series carry no end labels: the frozen run's cold-expert curve lies on the
 * x-axis (≈ 1 %), so its label would ride the tick row. One legend above the
 * charts serves all three panels, as it does in Fig. 11 itself.
 *
 * The frozen-router conclusion stays on the last frame (the thumbnail). The
 * §5.5 OOM arrives beside it as what freezing does not fix: it happened with
 * the router frozen, inside one micro-batch, a finer grain than these per-step
 * charts, so its 30× is never set against the charts' own ÷ 평균 numbers.
 */

/** the part of a curve left of the sweep head, ending on an interpolated point, so each run draws on its own beat */
const upTo = (pts: LoadPoint[], p: number): LoadPoint[] => {
  if (p <= 0 || pts.length === 0) return [];
  const x0 = pts[0]!.x;
  const x1 = pts[pts.length - 1]!.x;
  const head = x0 + (x1 - x0) * Math.min(1, p);
  const out = pts.filter((q) => q.x <= head);
  const last = out[out.length - 1];
  const next = pts.find((q) => q.x > head);
  if (last && next && head > last.x) {
    out.push({ x: head, y: last.y + ((next.y - last.y) * (head - last.x)) / (next.x - last.x) });
  }
  return out;
};

interface Panel {
  title: string;
  sub: string;
  data: { trainable: LoadPoint[]; frozen: LoadPoint[] };
  /** fixed ticks pin both domains, so a half-drawn curve never rescales the axes */
  yTicks: number[];
  yFormat: (v: number) => string;
  /** §5.4's own numbers */
  collapse: string;
  frozen: string;
}

const PANELS: Panel[] = [
  {
    title: 'CV',
    sub: '표준편차 ÷ 평균: 부하가 흩어진 정도',
    data: CV,
    yTicks: [0.5, 1, 1.5, 2, 2.5],
    yFormat: (v) => v.toFixed(1),
    collapse: '0.78 → 2.0',
    frozen: '≈ 0.7',
  },
  {
    title: '최대 부하',
    sub: '가장 바쁜 전문가의 부하 ÷ 평균',
    data: PEAK,
    yTicks: [0, 5, 10, 15, 20],
    yFormat: (v) => `${v}×`,
    collapse: '6× → 16×',
    frozen: '≈ 5.5×',
  },
  {
    title: '콜드 전문가',
    sub: '평균의 0.1배도 못 받는 전문가 비율',
    data: COLD,
    yTicks: [0, 10, 20, 30],
    yFormat: (v) => `${v}%`,
    collapse: '0.5% → 22%',
    frozen: '≈ 1%',
  },
];
const X_TICKS = [0, 5, 10, 15, 20, 25, 30];
/** §5.4: the router of the step-20 checkpoint was reset to its pre-RL values */
const RESET_STEP = 20;

/** a vertical rule at x rising from the lowest to the highest tick; empty before it starts */
const markerAt = (x: number, ticks: number[], p: number): LoadPoint[] => {
  if (p <= 0) return [];
  const lo = Math.min(...ticks);
  const hi = Math.max(...ticks);
  return [
    { x, y: lo },
    { x, y: lo + (hi - lo) * Math.min(1, p) },
  ];
};

/** layers stacked in one grid cell: the slot keeps the height of its tallest layer, so nothing re-flows */
const Swap: React.FC<{ layers: { opacity: number; node: React.ReactNode }[] }> = ({ layers }) => (
  <div style={{ display: 'grid' }}>
    {layers.map((l, i) => (
      <div key={i} style={{ gridArea: '1 / 1', opacity: l.opacity }}>
        {l.node}
      </div>
    ))}
  </div>
);

/** one legend entry: a line with the end dot, in the series color, beside a plain label */
const LegendKey: React.FC<{ color: string; children: React.ReactNode }> = ({ color, children }) => {
  const t = useTheme();
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
            background: color,
          }}
        />
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: '50%',
            width: t.space(1.5),
            height: t.space(1.5),
            marginTop: -t.space(0.75),
            borderRadius: '50%',
            background: color,
          }}
        />
      </div>
      <Label size="sm">{children}</Label>
    </Stack>
  );
};

export const routerFreezeScene = defineScene(
  {
    id: '04-router-freeze',
    title: '라우터 고정',
    steps: [
      step('load', 2.6),
      step('collapse', 3.0),
      step('diagnose', 2.8),
      step('freeze', 3.0),
      step('cost', 2.6, { hold: 0.6 }),
    ],
  },
  () => {
    const t = useTheme();
    const trainP = useStepProgress('collapse', { portion: [0.05, 0.7], easing: 'inOut' });
    const frozenP = useStepProgress('freeze', { portion: [0.05, 0.7], easing: 'inOut' });
    const markerP = useStepProgress('diagnose', { portion: [0.1, 0.5], easing: 'inOut' });
    const collapseChip = useStepProgress('collapse', { portion: [0.7, 0.9] });
    const frozenChip = useStepProgress('freeze', { portion: [0.7, 0.9] });
    // each legend entry arrives just before its run starts drawing
    const trainKey = useStepProgress('collapse', { portion: [0, 0.1] });
    const frozenKey = useStepProgress('freeze', { portion: [0, 0.1] });

    // band slots: A = load, B = collapse → diagnose → freeze (the conclusion stays), C = cost
    const loadIn = useStepProgress('load', { portion: [0.2, 0.45] });
    const collapseIn = useStepProgress('collapse', { portion: [0.1, 0.35] });
    const diagnoseOut = useStepProgress('diagnose', { portion: [0, 0.15] });
    const diagnoseIn = useStepProgress('diagnose', { portion: [0.15, 0.4] });
    const freezeOut = useStepProgress('freeze', { portion: [0, 0.15] });
    const freezeIn = useStepProgress('freeze', { portion: [0.15, 0.4] });
    const costIn = useStepProgress('cost', { portion: [0.15, 0.4] });

    const trainColor = t.palette.series[1]!;
    const frozenColor = t.palette.series[0]!;

    return (
      <SlideFrame title="라우터가 흔들리면 전문가가 몰린다" footer="ML Weekly · MiMo-V2.6 §5.4, §5.5 · 그림 11 (근사값)">
        <WalkthroughStage
          placement="bottom"
          gap={5}
          visual={
            <Stack gap={3} style={{ height: '100%' }}>
              <Stack direction="row" gap={3} align="center" justify="space-between">
                <Stack direction="row" gap={3} align="center">
                  <Appear step="load" effect="fade" delay={0.2}>
                    <Spec label="그림 11">Pro · 디코더 9층 · 전문가 384개</Spec>
                  </Appear>
                  <Appear step="diagnose" effect="fade" delay={0.4}>
                    <Spec label="진단 (20스텝)" tone="warn">
                      라우터만 RL 이전 값으로 되돌림
                    </Spec>
                  </Appear>
                </Stack>
                <Stack direction="row" gap={5} align="center">
                  <div style={{ opacity: trainKey }}>
                    <LegendKey color={trainColor}>라우터 학습</LegendKey>
                  </div>
                  <div style={{ opacity: frozenKey }}>
                    <LegendKey color={frozenColor}>라우터 고정</LegendKey>
                  </div>
                </Stack>
              </Stack>
              <Grid columns={3} gap={5} style={{ flex: 1, minHeight: 0, gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
                {PANELS.map((panel) => (
                  <Stack key={panel.title} gap={2} style={{ minHeight: 0 }}>
                    {/* chart titles, definitions and axes are the frame-0 anchor */}
                    <Stack gap={0}>
                      <Stack direction="row" gap={2} align="center" justify="space-between">
                        <Label size="sm" weight={700}>
                          {panel.title}
                        </Label>
                        <Stack direction="row" gap={2}>
                          <div style={{ opacity: collapseChip }}>
                            <Spec label="학습" tone="warn">
                              {panel.collapse}
                            </Spec>
                          </div>
                          <div style={{ opacity: frozenChip }}>
                            <Spec label="고정" tone="ok">
                              {panel.frozen}
                            </Spec>
                          </div>
                        </Stack>
                      </Stack>
                      <Label size="xs" color="textSecondary">
                        {panel.sub}
                      </Label>
                    </Stack>
                    <div style={{ flex: 1, minHeight: 0 }}>
                      <Fill>
                        {({ width, height }) => (
                          <LineChart
                            width={width}
                            height={height}
                            series={[
                              { label: '', color: trainColor, points: upTo(panel.data.trainable, trainP) },
                              { label: '', color: frozenColor, points: upTo(panel.data.frozen, frozenP) },
                              // the step-20 checkpoint whose router was reset: a vertical rule that rises on `diagnose`
                              { label: '', color: 'muted', points: markerAt(RESET_STEP, panel.yTicks, markerP) },
                            ]}
                            xTicks={X_TICKS}
                            yTicks={panel.yTicks}
                            yFormat={panel.yFormat}
                            xLabel="RL 스텝"
                          />
                        )}
                      </Fill>
                    </div>
                  </Stack>
                ))}
              </Grid>
            </Stack>
          }
          explanation={
            <Grid columns={3} gap={5} style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
              <div style={{ opacity: loadIn }}>
                <Callout title="전문가 부하">
                  MoE 층의 라우터는 토큰마다 전문가 384개 중 8개를 고른다. 한 스텝 동안 전문가 하나가 받은 토큰 수가
                  그 전문가의 부하다.
                </Callout>
              </div>
              <Swap
                layers={[
                  {
                    opacity: collapseIn * (1 - diagnoseOut),
                    node: (
                      <Callout tone="warn" title="라우터를 학습시키면">
                        RL에서 라우터도 함께 학습시키자 세 지표가 20스텝 내내 올랐다. 토큰은 소수의 전문가로 몰리고,
                        일을 거의 못 받는 전문가가 늘었다.
                      </Callout>
                    ),
                  },
                  {
                    opacity: diagnoseIn * (1 - freezeOut),
                    node: (
                      <Callout tone="warn" title="원인은 전문가가 아니라 라우터">
                        라우터만 되돌리자 부하 균형이 돌아왔고 점수는 그대로였다. 라우터가 RL 이전 값에서 멀어진 것,
                        곧 라우터 드리프트가 원인이다.
                      </Callout>
                    ),
                  },
                  {
                    opacity: freezeIn,
                    node: (
                      <Callout tone="ok" title="라우터를 고정하면">
                        라우터를 고정한 런은 세 지표가 끝까지 평평했고 벤치마크 점수는 정상적으로 올랐다. 그래서 RL
                        내내 라우터를 고정한다.
                      </Callout>
                    ),
                  },
                ]}
              />
              <div style={{ opacity: costIn }}>
                <Callout tone="warn" title="라우터를 고정해도 메모리가 넘쳤다">
                  스텝마다 배치 전체를 센 위 그래프와 달리, 실제 학습의 마이크로배치 하나에서는 GPU 한 대가 평균의
                  30배 넘는 토큰을 받았다.
                </Callout>
              </div>
            </Grid>
          }
        />
      </SlideFrame>
    );
  },
);

export default routerFreezeScene;
