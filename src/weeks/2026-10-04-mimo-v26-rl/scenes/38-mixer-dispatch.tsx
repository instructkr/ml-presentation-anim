import React from 'react';
import { defineScene, step, useCurrentStepIndex, useStepProgress } from '@/lib/timeline';
import { Board, Captions, ColumnBars, Panels, Quantities, Term } from '@/lib/kit';
import { useTheme } from '@/lib/theme';
import {
  CHOSEN,
  COLLECT,
  COLLECT_LABELS,
  ESTIMATE,
  MARGIN,
  NEED,
  RANK_FREE,
  RANK_FREE_AFTER,
  RANK_LABELS,
  REFUSED,
  STARTUP,
  STARTUP_OVER_STEADY,
  man,
  times,
} from '../data/porter-dispatch';
import { pick } from '../quantities';

/**
 * §6.3 — the last two mechanisms of the Sample Mixer. Left: Predictive Rollout
 * Dispatch. Each bar is the KV cache room left on one rank of the rollout
 * engine; the new attempt's length is guessed from its source's average, the
 * guess times a safety margin is the room a rank must have, and the roomiest
 * rank that passes takes the attempt. Right: Sample Replay. Collecting the
 * first batch after a start takes 1.8× as long as usual (the paper's number),
 * so that batch is topped up with stored attempts.
 *
 * Capacities, the guess and the margin are examples; which ranks are refused
 * and which one is chosen follow from them (`data/porter-dispatch.ts`).
 */
const QUANTITIES = { ...pick('slots', 'len', 'time'), replay: 'teal' } as const;

/** bar values are whole 만 — rounded, so the bar that gives up room counts down in whole numbers */
const wholeMan = (v: number) => man(Math.round(v));

const Scene: React.FC = () => {
  const t = useTheme();
  const idx = useCurrentStepIndex();
  const growP = useStepProgress('guess', { portion: [0.05, 0.45] });
  const guessP = useStepProgress('guess', { portion: [0.5, 0.85] });
  const fitP = useStepProgress('fit', { portion: [0.1, 0.5] });
  // the roomiest rank lights up first, then gives up the room the new attempt takes
  const placeP = useStepProgress('place', { portion: [0.4, 0.9], easing: 'inOut' });
  const slowP = useStepProgress('slow', { portion: [0.1, 0.7] });
  const replayP = useStepProgress('replay', { portion: [0.1, 0.5] });

  // ranks under the line fade once the line has landed, and stay faded
  const refusedNow = idx > 1 || (idx === 1 && fitP >= 1) ? REFUSED : [];

  return (
    <Quantities map={QUANTITIES}>
      <Board
        title="새 풀이를 어느 GPU에 놓을까?"
        source="MiMo-V2.6 §6.3 · 용량과 길이는 예시"
        figure={
          <Panels titles={['GPU마다 남은 KV cache 자리', '배치를 모으는 데 걸린 시간']} weights={[1.7, 1]}>
            {[
              ({ width, height }) => (
                <ColumnBars
                  width={width}
                  height={height}
                  values={RANK_FREE_AFTER}
                  from={RANK_FREE}
                  morph={placeP}
                  progress={growP}
                  labels={RANK_LABELS}
                  colors={RANK_FREE.map(() => QUANTITIES.slots)}
                  muted={refusedNow}
                  highlight={idx === 2 ? [CHOSEN] : []}
                  // both lines are in the array from frame 0, so the plot never re-flows when one fades in
                  refLines={[
                    { value: ESTIMATE, label: `짐작 ${man(ESTIMATE)}`, color: QUANTITIES.len, opacity: guessP * (1 - 0.55 * fitP) },
                    { value: NEED, label: `× ${MARGIN} = ${man(NEED)}`, color: QUANTITIES.len, dashed: false, opacity: fitP },
                  ]}
                  yDomain={[0, 60]}
                  yTicks={[0, 20, 40, 60]}
                  yFormat={man}
                  valueFormat={wholeMan}
                  yLabel="토큰"
                  textSize={t.fontSize.sm}
                />
              ),
              ({ width, height }) => (
                <ColumnBars
                  width={width}
                  height={height}
                  values={COLLECT}
                  progress={slowP}
                  labels={COLLECT_LABELS}
                  colors={COLLECT.map(() => QUANTITIES.time)}
                  highlight={idx === 4 ? [STARTUP] : []}
                  // the stretch between the usual time and the startup time: what the stored attempts are for
                  bands={[{ from: COLLECT[0]!, to: STARTUP_OVER_STEADY, label: 'Sample Replay', color: QUANTITIES.replay, opacity: 0.2 * replayP }]}
                  yDomain={[0, 2]}
                  yTicks={[0, 1, 2]}
                  yFormat={times}
                  valueFormat={times}
                  textSize={t.fontSize.sm}
                />
              ),
            ]}
          </Panels>
        }
        caption={
          <Captions
            items={[
              { step: 'guess', text: <>풀이가 <Term of="len">얼마나 길어질지</Term>는 과제 종류의 평균으로 짐작합니다</> },
              { step: 'fit', text: <><Term of="len">짐작한 길이에 여유를 곱한 만큼</Term> <Term of="slots">자리</Term>가 남아야 받습니다</> },
              { step: 'place', text: <><Term of="slots">남은 자리</Term>가 가장 넉넉한 GPU에 새 풀이를 놓습니다</> },
              { step: 'slow', text: <>시작 직후에는 배치를 모으는 데 <Term of="time">{times(STARTUP_OVER_STEADY)}</Term> 걸립니다</> },
              { step: 'replay', text: <>그래서 첫 배치는 <Term of="replay">저장해 둔 풀이</Term>로 느린 과제를 메웁니다</> },
            ]}
          />
        }
      />
    </Quantities>
  );
};

export const mixerDispatchScene = defineScene(
  {
    id: '38-mixer-dispatch',
    title: '새 풀이를 어느 GPU에 놓을까?',
    steps: [step('guess', 2.8), step('fit', 2.6), step('place', 2.8), step('slow', 2.4), step('replay', 2.6, { hold: 0.6 })],
  },
  Scene,
);

export default mixerDispatchScene;
