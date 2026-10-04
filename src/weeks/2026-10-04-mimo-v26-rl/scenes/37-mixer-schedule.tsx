import React from 'react';
import { defineScene, step, useCurrentStepIndex, useStepProgress } from '@/lib/timeline';
import { Board, Captions, ColumnBars, Formula, Panels, Quantities, Term } from '@/lib/kit';
import { useTheme } from '@/lib/theme';
import { ALPHA, FULL, LABELS, blended, collectedPct, deficitOnly, pct, targetOnly, whole } from '../data/mixer-schedule';
import { INK } from '../quantities';

/**
 * §6.3, Eq. 7 — Adaptive Rollout Scheduling, the second mechanism of the Sample
 * Mixer: which source gets the next free slot. The left panel is a snapshot in
 * the middle of a step (예시): how much of its target each source has collected.
 * The right panel is the scheduling weight that snapshot gives each source,
 * under the target term alone, the deficit term alone, and the two mixed half
 * and half — the three policies Fig. 16 compares. The equation is built up to
 * Eq. 7 one term at a time and is true of the right panel at every pause.
 *
 * B and r are the paper's (Fig. 16's legend); the weights are computed from
 * them and the snapshot in `data/mixer-schedule.ts`.
 *
 * The target term and the deficit term each contain a B_i and an r_i. They are
 * tagged apart (`Bt`/`rt`, `Bd`/`rd`) so that in the last form each fraction
 * stays itself instead of the deficit's glyphs flying into the target term.
 */
const QUANTITIES = {
  share: INK.share,
  Bt: INK.share,
  Bd: INK.share,
  accept: INK.accept,
  rt: INK.accept,
  rd: INK.accept,
  got: 'blue',
  w: 'gold',
} as const;

const LHS = '\\q{w}{w_i} =';
const TARGET = '\\frac{\\q{Bt}{B_i}}{\\q{rt}{r_i}}';
const DEFICIT = '\\frac{(\\q{Bd}{B_i} - \\q{got}{A_i})^{+}}{\\q{rd}{r_i}}';
const percent = (v: number) => `${v}%`;

const Scene: React.FC = () => {
  const t = useTheme();
  const idx = useCurrentStepIndex();
  const snapP = useStepProgress('snapshot', { portion: [0.1, 0.7] });
  const targetP = useStepProgress('target', { portion: [0.4, 0.9] });
  const deficitP = useStepProgress('deficit', { portion: [0.3, 0.85], easing: 'inOut' });
  const blendP = useStepProgress('blend', { portion: [0.3, 0.85], easing: 'inOut' });

  const weight =
    idx <= 1
      ? { values: targetOnly, from: undefined, morph: 1 }
      : idx === 2
        ? { values: deficitOnly, from: targetOnly, morph: deficitP }
        : { values: blended, from: deficitOnly, morph: blendP };

  return (
    <Quantities map={QUANTITIES}>
      <Board
        title="다음에는 어느 과제를 시작할까?"
        source="MiMo-V2.6 §6.3, Eq. 7, 그림 16 · 진행 상황은 예시"
        formula={
          <Formula
            size="xl"
            write="target"
            then={[
              { step: 'deficit', tex: `${LHS} ${DEFICIT}` },
              { step: 'blend', tex: `${LHS} \\q{alpha}{\\alpha}\\,${TARGET} + (1 - \\alpha)\\,${DEFICIT}` },
            ]}
            brace={{ key: 'alpha', step: 'blend', delay: 1.6, label: `화면은 ${ALPHA}` }}
          >
            {`${LHS} ${TARGET}`}
          </Formula>
        }
        figure={
          <Panels
            titles={[
              <><Term of="share">목표</Term> 가운데 <Term of="got">지금까지 모은 양</Term></>,
              <Term of="w">다음 풀이를 시작할 비율</Term>,
            ]}
          >
            {[
              ({ width, height }) => (
                <ColumnBars
                  width={width}
                  height={height}
                  values={collectedPct}
                  progress={snapP}
                  labels={LABELS}
                  colors={collectedPct.map(() => QUANTITIES.got)}
                  highlight={snapP >= 1 ? FULL : []}
                  yDomain={[0, 100]}
                  yTicks={[0, 50, 100]}
                  yFormat={percent}
                  valueFormat={whole}
                  textSize={t.fontSize.sm}
                />
              ),
              ({ width, height }) => (
                <ColumnBars
                  width={width}
                  height={height}
                  values={weight.values}
                  from={weight.from}
                  morph={weight.morph}
                  progress={targetP}
                  labels={LABELS}
                  colors={targetOnly.map(() => QUANTITIES.w)}
                  // the source that is already full: the bar the three policies disagree about most
                  highlight={idx >= 1 ? FULL : []}
                  yDomain={[0, 50]}
                  yTicks={[0, 10, 20, 30, 40, 50]}
                  yFormat={percent}
                  valueFormat={pct}
                  textSize={t.fontSize.sm}
                />
              ),
            ]}
          </Panels>
        }
        caption={
          <Captions
            items={[
              { step: 'snapshot', text: <>스텝 도중입니다. 빠른 과제는 벌써 <Term of="share">목표</Term>를 다 채웠습니다</> },
              { step: 'target', text: <><Term of="share">목표</Term>만 보면 다 채운 과제도 같은 비율로 계속 풉니다</> },
              { step: 'deficit', text: <>모자란 양만 보면 다 채운 과제는 아예 멈춥니다</> },
              { step: 'blend', text: <>Sample Mixer는 이 두 값을 섞습니다. 화면은 반씩 섞은 값입니다</> },
            ]}
          />
        }
      />
    </Quantities>
  );
};

export const mixerScheduleScene = defineScene(
  {
    id: '37-mixer-schedule',
    title: '다음에는 어느 과제를 시작할까?',
    steps: [step('snapshot', 2.4), step('target', 2.8), step('deficit', 3.0), step('blend', 3.0, { hold: 0.6 })],
  },
  Scene,
);

export default mixerScheduleScene;
