import React from 'react';
import { defineScene, step, useCurrentStepIndex, useStepProgress } from '@/lib/timeline';
import { Board, Captions, LineChart, Panels, Quantities, Term, useQuantityColors } from '@/lib/kit';
import { COLD, CV, FIG11_TEXT, PEAK, type LoadPoint } from '../data/router-load';

/**
 * §5.4, Fig. 11 — two MiMo-V2.6-Pro RL runs that differ only in whether the
 * MoE Router is trainable, tracked on decoder layer 9 (384 Experts). Three
 * panels, as in the figure: how uneven the load is (CV), how overloaded the
 * busiest Expert is (max ÷ mean) and how many Experts are nearly idle.
 * The curves were read off the figure (approximate); the axes are on screen
 * from frame 0 and each run is swept in on its own beat. The numbers in the
 * phrases come from the paper's text (`FIG11_TEXT`).
 */

/** the two runs are this scene's quantities — the figure's own colours: red trains the Router, blue freezes it */
const QUANTITIES = { trained: 'red', frozen: 'blue' } as const;

const X_TICKS = [0, 10, 20, 30];

interface PanelSpec {
  title: string;
  data: { trainable: LoadPoint[]; frozen: LoadPoint[] };
  yTicks: number[];
  yFormat?: (v: number) => string;
}

const PANELS: PanelSpec[] = [
  { title: '일감의 고르지 않은 정도', data: CV, yTicks: [0, 1, 2, 3] },
  { title: '가장 바쁜 Expert ÷ 평균', data: PEAK, yTicks: [0, 5, 10, 15, 20], yFormat: (v) => `${v}배` },
  { title: '거의 쉬는 Expert', data: COLD, yTicks: [0, 10, 20, 30], yFormat: (v) => `${v}%` },
];
/** the panel the `cold` beat points at */
const COLD_PANEL = 2;

/** 22% of the Experts → "one in five" */
const KOREAN_COUNT = ['', '하나', '둘', '셋', '넷', '다섯', '여섯', '일곱', '여덟', '아홉', '열'];
const ONE_IN = KOREAN_COUNT[Math.round(100 / FIG11_TEXT.cold[1])];

const Charts: React.FC = () => {
  const ink = useQuantityColors();
  const idx = useCurrentStepIndex();
  const trainedP = useStepProgress('collapse', { portion: [0.1, 0.85], easing: 'inOut' });
  const frozenP = useStepProgress('freeze', { portion: [0.15, 0.85], easing: 'inOut' });
  // `cold` points at the third panel: the other two step back, and return when the frozen run is drawn
  const pointIn = useStepProgress('cold', { portion: [0, 0.3] });
  const pointOut = useStepProgress('freeze', { portion: [0, 0.15] });
  const stepBack = 0.6 * pointIn * (1 - pointOut);

  return (
    <Panels titles={PANELS.map((p) => p.title)}>
      {PANELS.map((p, i) => ({ width, height }: { width: number; height: number }) => (
        <div style={{ opacity: i === COLD_PANEL ? 1 : 1 - stepBack }}>
          <LineChart
            width={width}
            height={height}
            series={[
              { label: '학습', color: ink.trained, points: p.data.trainable, progress: trainedP },
              { label: '얼림', color: ink.frozen, points: p.data.frozen, progress: frozenP },
            ]}
            xTicks={X_TICKS}
            yTicks={p.yTicks}
            yFormat={p.yFormat}
            xLabel="RL 스텝"
            highlightSeries={idx === 1 && i === COLD_PANEL ? 0 : undefined}
          />
        </div>
      ))}
    </Panels>
  );
};

export const routerFreezeScene = defineScene(
  {
    id: '25-router-freeze',
    title: 'RL 중에 Router를 얼리는 이유',
    steps: [step('collapse', 3.0), step('cold', 2.4), step('freeze', 3.0, { hold: 0.6 })],
  },
  () => (
    <Quantities map={QUANTITIES}>
      <Board
        title="RL 중에 Router를 얼리는 이유"
        source="MiMo-V2.6 §5.4, 그림 11 (그래프에서 읽은 근사값)"
        figure={<Charts />}
        caption={
          <Captions
            items={[
              { step: 'collapse', text: <><Term of="trained">Router도 같이 학습하면</Term> Expert 사이의 일감이 쏠립니다</> },
              { step: 'cold', text: <>{FIG11_TEXT.steps} 스텝 만에 Expert {ONE_IN} 중 하나가 일을 거의 못 받습니다</> },
              { step: 'freeze', text: <>Router만 되돌려도 풀리는 문제라서, <Term of="frozen">아예 얼리고</Term> 학습합니다</> },
            ]}
          />
        }
      />
    </Quantities>
  ),
);

export default routerFreezeScene;
