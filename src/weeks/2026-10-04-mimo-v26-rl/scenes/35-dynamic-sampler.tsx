import React from 'react';
import { defineScene, step, useCurrentStepIndex, useStepProgress } from '@/lib/timeline';
import { Board, Captions, ColumnBars, Formula, Panels, Quantities, Term } from '@/lib/kit';
import { useTheme } from '@/lib/theme';
import { ACCEPT_RATE, BATCH, DRAWN, FIRST, G, KEPT, MORE, dropped, taskLabels } from '../data/mixer-sampler';
import { INK, pick } from '../quantities';

/**
 * §4.1 names the dynamic sampler in one sentence and cites DAPO; this scene is
 * DAPO §3.2 on a batch of eight groups. A group whose 16 attempts all passed or
 * all failed has a gap of 0 everywhere and moves nothing, so it is left out and
 * more tasks are attempted until the batch is full. The last beat counts what
 * that costs: the share of drawn groups that survive — the acceptance rate the
 * next scene (Sample Mixer) starts from.
 *
 * The pass counts are examples; which groups drop out, how many had to be
 * drawn and the rate are computed in `data/mixer-sampler.ts`.
 */
/** the bars are pass counts — sums of the score R — so they wear its ink */
const QUANTITIES = { k: INK.R, ...pick('accept') } as const;

const FIRST_OUT = dropped(FIRST);
const MORE_OUT = dropped(MORE);
const whole = (v: number) => String(Math.round(v));

const Scene: React.FC = () => {
  const t = useTheme();
  const idx = useCurrentStepIndex();
  const growP = useStepProgress('groups', { portion: [0.1, 0.7] });
  // the unusable bars fade once, a moment into the beat, not on its first frame
  const dropP = useStepProgress('drop', { portion: [0.1, 0.35], easing: 'linear' });
  const refillP = useStepProgress('refill', { portion: [0.1, 0.75] });

  const bars = (values: number[], from: number, progress: number, out: number[], muted: boolean) =>
    ({ width, height }: { width: number; height: number }) => (
      <ColumnBars
        width={width}
        height={height}
        values={values}
        progress={progress}
        labels={taskLabels(from, values.length)}
        colors={values.map(() => QUANTITIES.k)}
        // only the groups already drawn are pointed at: the right panel is still empty in `flat`
        highlight={idx === 1 && from === 0 ? out : []}
        muted={muted ? out : []}
        yDomain={[0, G]}
        yTicks={[0, G / 2, G]}
        valueFormat={whole}
        textSize={t.fontSize.sm}
      />
    );

  return (
    <Quantities map={QUANTITIES}>
      <Board
        title="배울 것이 없는 그룹은 어떻게 할까?"
        source="DAPO §3.2 · MiMo-V2.6 §4.1, §6.2 · 그룹은 예시"
        formula={
          <Formula
            size="xl"
            write="drop"
            then={[
              {
                step: 'cost',
                tex: `\\frac{${KEPT}}{${DRAWN.length}} \\approx \\q{accept}{${whole(ACCEPT_RATE * 100)}\\%}`,
              },
            ]}
            brace={{ key: 'k', step: 'drop', delay: 1.4, until: 'cost', label: '통과한 횟수', color: QUANTITIES.k }}
            box={{ key: 'accept', step: 'cost', delay: 1.4 }}
          >
            {`0 < \\q{k}{k} < ${G}`}
          </Formula>
        }
        figure={
          <Panels titles={[`처음 푼 과제 ${FIRST.length}개`, `더 푼 과제 ${MORE.length}개`]} weights={[FIRST.length, MORE.length]}>
            {[
              bars(FIRST, 0, growP, FIRST_OUT, dropP >= 1),
              // the groups drawn later are judged as they arrive
              bars(MORE, FIRST.length, refillP, MORE_OUT, idx >= 3),
            ]}
          </Panels>
        }
        caption={
          <Captions
            items={[
              { step: 'groups', text: <>과제 {BATCH}개를 {G}번씩 풀었습니다. 막대는 <Term of="k">통과한 횟수</Term>입니다</> },
              { step: 'flat', text: <>모두 통과하거나 모두 실패하면 차이가 전부 0입니다</> },
              { step: 'drop', text: <>이런 그룹은 학습 배치에 넣지 않습니다</> },
              { step: 'refill', text: <>빈자리가 찰 때까지 새 과제를 더 풉니다</> },
              { step: 'cost', text: <>{DRAWN.length}그룹을 풀어 {KEPT}그룹을 건졌습니다. 버린 만큼 더 풀어야 합니다</> },
            ]}
          />
        }
      />
    </Quantities>
  );
};

export const dynamicSamplerScene = defineScene(
  {
    id: '35-dynamic-sampler',
    title: '배울 것이 없는 그룹은 어떻게 할까?',
    steps: [step('groups', 2.6), step('flat', 2.4), step('drop', 2.8), step('refill', 2.6), step('cost', 2.8, { hold: 0.6 })],
  },
  Scene,
);

export default dynamicSamplerScene;
