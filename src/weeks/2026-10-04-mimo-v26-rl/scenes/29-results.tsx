import React from 'react';
import { defineScene, step, useCurrentStepIndex, useStepProgress } from '@/lib/timeline';
import { BarChart, Board, Captions, Fill, Quantities, Term } from '@/lib/kit';
import { BEST, DEEPSWE_ORDER, GAP_TO_BEST, MIMO, PREV, PRO, RL_RUN, deepswe } from '../data/distill-table3';
import { INK } from '../quantities';

/**
 * Table 3, the DeepSWE v1.1 row — where the final models (after MOPD2) landed:
 * the previous generation, MiMo-V2.6, and three frontier models. The model
 * names are on screen from frame 0 (the chart's axis); beat 1 sweeps the bars.
 * Every number in a phrase is computed from the table data.
 */
const QUANTITIES = { score: INK.R } as const;

/** the bar each beat points at */
const PRO_INDEX = DEEPSWE_ORDER.indexOf('MiMo-V2.6 Pro');
const BEST_INDEX = DEEPSWE_ORDER.indexOf(BEST.model);
const HIGHLIGHT = [PRO_INDEX, BEST_INDEX, PRO_INDEX];

const whole = (v: number) => String(Math.round(v));
/** the next multiple of ten above the best score on the chart */
const AXIS_MAX = Math.ceil((Math.max(...deepswe.map((d) => d.score)) + 1) / 10) * 10;

const Scene: React.FC = () => {
  const idx = useCurrentStepIndex();
  const sweep = useStepProgress('jump', { portion: [0.1, 0.75] });

  return (
    <Quantities map={QUANTITIES}>
      <Board
        title="어디까지 왔을까?"
        source="MiMo-V2.6 표 3 (DeepSWE v1.1), §4.1"
        figure={
          <Fill>
            {({ width, height }) => (
              <BarChart
                width={width}
                height={height}
                // the MiMo line wears the score's ink; the other models stay grey
                data={deepswe.map((d) => ({
                  label: d.model,
                  value: d.score,
                  color: MIMO.includes(d.model) ? QUANTITIES.score : 'grey',
                }))}
                progress={sweep}
                // bars start at zero; the axis ends just past the best score so the row fills the slot
                maxValue={AXIS_MAX}
                valueFormat={(v) => v.toFixed(1)}
                highlightIndex={HIGHLIGHT[idx]}
              />
            )}
          </Fill>
        }
        caption={
          <Captions
            items={[
              { step: 'jump', text: <>DeepSWE 점수가 이전 세대 <Term of="score">{whole(PREV)}점</Term>에서 <Term of="score">{whole(PRO)}점</Term>으로 올랐습니다</> },
              { step: 'frontier', text: <>가장 높은 {BEST.model}와 {whole(GAP_TO_BEST)}점 차이까지 따라왔습니다</> },
              { step: 'takeaway', text: <>이 가운데 <Term of="score">{whole(RL_RUN.start)}점</Term>부터는 RL 30 스텝이 올린 몫입니다</> },
            ]}
          />
        }
      />
    </Quantities>
  );
};

export const resultsScene = defineScene(
  {
    id: '29-results',
    title: '어디까지 왔을까?',
    steps: [step('jump', 2.8), step('frontier', 2.4), step('takeaway', 2.4, { hold: 0.6 })],
  },
  Scene,
);

export default resultsScene;
