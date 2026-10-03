import React from 'react';
import { defineScene, step, useCurrentStepIndex, useStepProgress } from '@/lib/timeline';
import { Board, Captions, LineChart, Panels, Quantities, Term } from '@/lib/kit';
import { fig8 } from '../data/fig8';

/**
 * §4.3.2, Fig. 8 — code-only RL on MiMo-V2.6-Flash with and without GAR
 * (training batch 128, token-mean aggregation, evaluated on DeepSWE v1.1).
 * Three panels as in the figure: pass rate (avg@3), mean turns, mean total
 * tokens. The points were read off the figure (approximate). The axes are on
 * screen from frame 0; each panel is swept in on its own beat.
 */
const QUANTITIES = { on: 'blue', off: 'grey' } as const;

/** the run with GAR goes on to step 52; the one without stops at 28 */
const X_TICKS = [0, 20, 40];

const OFF_LABEL = 'GAR 없음';
/**
 * The run without GAR stops at step 28, so its direct label sits inside the
 * plot. In the token panel the other line runs straight through that spot, so
 * there the label is blank — the first two panels have already named the grey
 * line. The blank is as wide as the real label by the chart's own estimate
 * (two full-width + four narrow spaces), so all three plots keep one width.
 */
const OFF_BLANK = '\u3000\u3000\u00a0\u00a0\u00a0\u00a0';

type Curve = { x: number; y: number }[];
const PANELS: { title: string; data: { without: Curve; with: Curve }; yTicks: number[]; offLabel?: string }[] = [
  { title: '통과율 (%)', data: fig8.passrate, yTicks: [50, 55, 60] },
  { title: '평균 턴 수', data: fig8.turns, yTicks: [110, 120, 130] },
  { title: '평균 토큰 (K)', data: fig8.tokens, yTicks: [150, 175, 200], offLabel: OFF_BLANK },
];

const Scene: React.FC = () => {
  const idx = useCurrentStepIndex();
  const sweep = [
    useStepProgress('pass', { portion: [0.1, 0.85], easing: 'inOut' }),
    useStepProgress('turns', { portion: [0.1, 0.85], easing: 'inOut' }),
    useStepProgress('tokens', { portion: [0.1, 0.85], easing: 'inOut' }),
  ];

  return (
    <Quantities map={QUANTITIES}>
      <Board
        title="GAR을 켜면 무엇이 달라질까?"
        source="MiMo-V2.6 §4.3.2, 그림 8 (그래프에서 읽은 근사값)"
        figure={
          <Panels titles={PANELS.map((p) => p.title)}>
            {PANELS.map((p, i) => ({ width, height }: { width: number; height: number }) => (
              <LineChart
                width={width}
                height={height}
                series={[
                  { label: p.offLabel ?? OFF_LABEL, color: QUANTITIES.off, points: p.data.without },
                  { label: 'GAR', color: QUANTITIES.on, points: p.data.with },
                ]}
                progress={sweep[i]}
                xTicks={X_TICKS}
                yTicks={p.yTicks}
                xLabel="RL 스텝"
                highlightSeries={idx === 3 ? 1 : undefined}
              />
            ))}
          </Panels>
        }
        caption={
          <Captions
            items={[
              { step: 'pass', text: <><Term of="off">GAR이 없으면</Term> 통과율이 20 스텝쯤에서 꺾입니다</> },
              { step: 'turns', text: <><Term of="off">GAR이 없으면</Term> 턴 수가 계속 늘어납니다</> },
              { step: 'tokens', text: <>토큰도 훨씬 빨리 늘어서 길이 한도에 걸립니다</> },
              { step: 'code', text: <><Term of="on">GAR로 학습한 모델</Term>은 더 작고 정확하게 고칩니다</> },
            ]}
          />
        }
      />
    </Quantities>
  );
};

export const garEffectScene = defineScene(
  {
    id: '19-gar-effect',
    title: 'GAR을 켜면 무엇이 달라질까?',
    steps: [step('pass', 2.8), step('turns', 2.6), step('tokens', 2.6), step('code', 2.4, { hold: 0.6 })],
  },
  Scene,
);

export default garEffectScene;
