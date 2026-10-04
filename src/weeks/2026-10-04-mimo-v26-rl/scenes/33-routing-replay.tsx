import React from 'react';
import { interpolateColors } from 'remotion';
import { defineScene, step, useCurrentStepIndex, useStepProgress } from '@/lib/timeline';
import { Board, Captions, ColumnBars, Panels, Quantities, Term } from '@/lib/kit';
import { useTheme } from '@/lib/theme';
import {
  EXPERTS,
  FLIP_MARGIN,
  GAINED,
  KL_DENSE_INDEX,
  LOST,
  PICK_ROLLOUT,
  PICK_TRAIN,
  R3_KL,
  S_ROLLOUT,
  S_TRAIN,
  TOP_K,
  fmtKl,
  fmtScore,
  others,
} from '../data/consistency-router-example';
import { INK, pick } from '../quantities';

/**
 * Rollout Routing Replay (Ma et al. 2025; "Keep Routing" in DeepSeek-V3.2;
 * one sentence in MiMo-V2.6 §6.4). The Router keeps only its highest-scoring
 * Experts, and that choice is a cliff: the Training engine scores the same
 * token a hair differently and a different Expert is used. R3 writes down the
 * Experts Rollout used and makes Training use the same ones, while the scores
 * stay Training's own.
 *
 * Left and middle: one token's Router scores in each engine (예시 — six
 * Experts, two kept). A bar is faded when that engine does not use the Expert;
 * the Experts Rollout wrote down turn gold when they are replayed. Right: the
 * KL divergence between the two engines' token probabilities that the R3 paper
 * measured — the paper's numbers.
 */
const QUANTITIES = { ...pick('record'), rollout: INK.mu, train: INK.pi, gap: INK.r } as const;

const N = EXPERTS.length;
/** how many Experts the Router keeps, as the phrase says it */
const COUNT_WORD = ['', '한', '두', '세', '네'][TOP_K]!;
/** the two bars the flip hangs on carry their numbers */
const CLOSE = [LOST, GAINED].sort((a, b) => a - b);

const Scene: React.FC = () => {
  const t = useTheme();
  const idx = useCurrentStepIndex();
  const pickGrow = useStepProgress('pick', { portion: [0.1, 0.6] });
  // the Experts an engine does not use fade once, after its bars have landed
  const pickDone = useStepProgress('pick', { portion: [0.6, 0.8], easing: 'linear' });
  const flipGrow = useStepProgress('flip', { portion: [0.1, 0.6] });
  const flipDone = useStepProgress('flip', { portion: [0.6, 0.8], easing: 'linear' });
  const swapP = useStepProgress('replay', { portion: [0.15, 0.4], easing: 'linear' });
  const goldP = useStepProgress('replay', { portion: [0.4, 0.8] });
  const klGrow = useStepProgress('effect', { portion: [0.1, 0.7] });

  const ink = t.palette.ink;
  const record = (base: string) => interpolateColors(goldP, [0, 1], [base, ink[QUANTITIES.record]]);

  // Training uses its own picks until the replay beat hands it Rollout's
  const trainPicks = idx >= 2 && swapP >= 1 ? PICK_ROLLOUT : PICK_TRAIN;

  return (
    <Quantities map={QUANTITIES}>
      <Board
        title="Router가 다른 Expert를 고르면?"
        source="Ma et al. 2025 (R3) · DeepSeek-V3.2 §3.1 · MiMo-V2.6 §6.4 · 점수는 예시"
        figure={
          <Panels
            titles={[
              <Term of="rollout">Rollout이 매긴 점수</Term>,
              <Term of="train">Training이 다시 매긴 점수</Term>,
              <Term of="gap">두 엔진의 차이 (KL ×0.001)</Term>,
            ]}
            weights={[1, 1, 0.8]}
          >
            {[
              ({ width, height }) => (
                <ColumnBars
                  width={width}
                  height={height}
                  values={S_ROLLOUT}
                  progress={pickGrow}
                  labels={EXPERTS}
                  colors={S_ROLLOUT.map((_, i) => (PICK_ROLLOUT.includes(i) ? record(ink[QUANTITIES.rollout]) : QUANTITIES.rollout))}
                  muted={pickDone >= 1 ? others(N, PICK_ROLLOUT) : []}
                  highlight={idx === 0 && pickDone >= 1 ? PICK_ROLLOUT : []}
                  yDomain={[0, 2]}
                  yTicks={[0, 1, 2]}
                  valueFormat={fmtScore}
                  valueIndices={CLOSE}
                  textSize={t.fontSize.sm}
                />
              ),
              ({ width, height }) => (
                <ColumnBars
                  width={width}
                  height={height}
                  values={S_TRAIN}
                  progress={flipGrow}
                  labels={EXPERTS}
                  colors={S_TRAIN.map((_, i) =>
                    idx >= 2 && swapP >= 1 && PICK_ROLLOUT.includes(i) ? record(ink[QUANTITIES.train]) : QUANTITIES.train,
                  )}
                  muted={idx >= 1 && flipDone >= 1 ? others(N, trainPicks) : []}
                  highlight={idx === 1 && flipDone >= 1 ? [GAINED] : []}
                  yDomain={[0, 2]}
                  yTicks={[0, 1, 2]}
                  valueFormat={fmtScore}
                  valueIndices={CLOSE}
                  textSize={t.fontSize.sm}
                />
              ),
              ({ width, height }) => (
                <ColumnBars
                  width={width}
                  height={height}
                  values={R3_KL.map((d) => d.value)}
                  progress={klGrow}
                  labels={R3_KL.map((d) => d.label)}
                  colors={R3_KL.map(() => QUANTITIES.gap)}
                  // the dense model is the yardstick, not the model under test
                  muted={[KL_DENSE_INDEX]}
                  yDomain={[0, 2]}
                  yTicks={[0, 1, 2]}
                  valueFormat={fmtKl}
                  textSize={t.fontSize.sm}
                />
              ),
            ]}
          </Panels>
        }
        caption={
          <Captions
            items={[
              { step: 'pick', text: <>Router는 점수가 높은 Expert {COUNT_WORD} 개만 씁니다</> },
              { step: 'flip', text: <><Term of="train">Training</Term>에서는 {fmtScore(FLIP_MARGIN)} 차이로 다른 Expert가 뽑힙니다</> },
              { step: 'replay', text: <>그래서 Rollout이 고른 <Term of="record">번호</Term>를 적어 두었다가 그대로 씁니다</> },
              { step: 'effect', text: <>원 논문에서는 <Term of="gap">두 엔진의 차이</Term>가 절반으로 줄었습니다</> },
            ]}
          />
        }
      />
    </Quantities>
  );
};

export const routingReplayScene = defineScene(
  {
    id: '33-routing-replay',
    title: 'Router가 다른 Expert를 고르면?',
    steps: [step('pick', 2.6), step('flip', 2.8), step('replay', 2.8), step('effect', 2.6, { hold: 0.6 })],
  },
  Scene,
);

export default routingReplayScene;
