import React from 'react';
import { defineScene, step, useCurrentStepIndex, useStepProgress } from '@/lib/timeline';
import { Board, Captions, Fill, Lanes, Quantities, Term, type LaneSegment } from '@/lib/kit';
import { useTheme } from '@/lib/theme';
import {
  BATCH_ATTEMPTS,
  CONTINUED,
  CUT,
  DURATIONS,
  FIRST,
  HORIZON,
  IDLE,
  IDLE_SHARE,
  LONGEST,
  LONGEST_SLOT,
  NEXT,
  REFILLS,
  RESUME,
  SHORTEST,
  SLOTS,
  type Span,
} from '../data/saturate-partial-rollout';
import { pick } from '../quantities';

/**
 * §4.1 (partial rollout, Kimi k1.5 §2.6.2) — why a step does not wait for its
 * longest attempt. Six rollout slots, one per data source of Fig. 16, each
 * attempt as long as that source's mean rollout duration (the paper's numbers).
 * A step that waits for all six leaves half of the slot-time empty; refilling
 * the freed slots keeps them busy, the batch is collected as soon as enough
 * attempts have finished, and the attempts still being written are stopped and
 * continued after the update — by the updated model. So one attempt ends up
 * holding tokens written by two versions, which is what the ratio r corrects.
 *
 * That there are six slots, how many finished attempts fill a batch and how
 * long Training takes are examples; every position on the chart is computed in
 * `data/saturate-partial-rollout.ts`.
 */
/** one ink per model version; the waiting slot is not a quantity, so it stays grey */
const QUANTITIES = { ...pick('run', 'runNext'), idle: 'grey' } as const;

const minutes = (v: number) => `${v}분`;
const whole = (v: number) => Math.round(v);

/**
 * An attempt of the first phase. It is one box until the batch is collected;
 * from then on it is two — what was written before the cut stays, the rest
 * fades out with `afterCut`.
 */
const firstPhase = (a: Span, head: number, afterCut: number): LaneSegment[] =>
  afterCut >= 1
    ? [{ from: a.from, to: Math.min(a.to, LONGEST, head), color: QUANTITIES.run }]
    : [
        { from: a.from, to: Math.min(a.to, CUT, head), color: QUANTITIES.run },
        { from: Math.max(a.from, CUT), to: Math.min(a.to, LONGEST, head), color: QUANTITIES.run, opacity: afterCut },
      ];

const Scene: React.FC = () => {
  const t = useTheme();
  const idx = useCurrentStepIndex();
  const waitP = useStepProgress('wait', { portion: [0.1, 0.85], easing: 'inOut' });
  const idleP = useStepProgress('idle', { portion: [0.1, 0.6] });
  const refillP = useStepProgress('refill', { portion: [0.1, 0.85], easing: 'inOut' });
  const cutP = useStepProgress('cut', { portion: [0.15, 0.7] });
  const gapP = useStepProgress('resume', { portion: [0, 0.3] });
  const resumeP = useStepProgress('resume', { portion: [0.25, 0.9], easing: 'inOut' });

  // three playheads: the first attempts, the attempts that take over a freed slot, the next rollout phase
  const firstHead = waitP * LONGEST;
  const refillHead = SHORTEST + refillP * (LONGEST - SHORTEST);
  const nextHead = RESUME + resumeP * (HORIZON - RESUME);

  const lanes = SLOTS.map((slot, i) => ({
    label: slot.label,
    segments: [
      ...FIRST.filter((a) => a.slot === i).flatMap((a) => firstPhase(a, firstHead, 1 - cutP)),
      ...IDLE.filter((a) => a.slot === i).map(
        (a): LaneSegment => ({ ...a, color: QUANTITIES.idle, variant: 'hatch', opacity: idleP * (1 - refillP) }),
      ),
      ...(refillP > 0 ? REFILLS.filter((a) => a.slot === i).flatMap((a) => firstPhase(a, refillHead, 1 - cutP)) : []),
      ...(resumeP > 0
        ? [...CONTINUED, ...NEXT]
            .filter((a) => a.slot === i)
            .map((a): LaneSegment => ({ from: a.from, to: Math.min(a.to, nextHead), color: QUANTITIES.runNext }))
        : []),
    ],
  }));

  const last = idx === 5;

  return (
    <Quantities map={QUANTITIES}>
      <Board
        title="긴 풀이를 기다려야 할까?"
        source="Kimi k1.5 §2.6.2 · MiMo-V2.6 §4.1, 그림 16의 풀이 시간"
        figure={
          <Fill>
            {({ width, height }) => (
              <Lanes
                width={width}
                height={height}
                lanes={lanes}
                markers={[
                  { at: CUT, label: '배치 수집', color: 'text', opacity: cutP },
                  { at: RESUME, label: '새 모델', color: 'text', opacity: gapP },
                ]}
                xDomain={[0, HORIZON]}
                xTicks={[0, 15, 30, 45, 60]}
                xFormat={minutes}
                highlight={last ? [LONGEST_SLOT] : []}
                muted={last ? DURATIONS.map((_, i) => i).filter((i) => i !== LONGEST_SLOT) : []}
                textSize={t.fontSize.sm}
              />
            )}
          </Fill>
        }
        caption={
          <Captions
            items={[
              { step: 'wait', text: <>풀이마다 끝나는 시각이 {whole(SHORTEST)}분에서 {whole(LONGEST)}분까지 다릅니다</> },
              { step: 'idle', text: <>다 끝나기를 기다리면 <Term of="idle">자리의 {whole(IDLE_SHARE * 100)}%</Term>가 놉니다</> },
              { step: 'refill', text: <>끝난 자리는 곧바로 <Term of="run">다음 풀이</Term>를 시작합니다</> },
              { step: 'cut', text: <>풀이 {BATCH_ATTEMPTS}개가 끝나 배치가 차면 쓰던 풀이는 멈춥니다</> },
              { step: 'resume', text: <>모델을 고친 뒤 멈춘 자리에서 <Term of="runNext">이어 씁니다</Term></> },
              {
                step: 'stale',
                text: <>그래서 한 풀이에 <Term of="run">옛 모델</Term>과 <Term of="runNext">새 모델</Term>이 쓴 토큰이 섞입니다</>,
              },
            ]}
          />
        }
      />
    </Quantities>
  );
};

export const partialRolloutScene = defineScene(
  {
    id: '30-partial-rollout',
    title: '긴 풀이를 기다려야 할까?',
    steps: [
      step('wait', 2.6),
      step('idle', 2.4),
      step('refill', 2.6),
      step('cut', 2.6),
      step('resume', 2.8),
      step('stale', 2.4, { hold: 0.6 }),
    ],
  },
  Scene,
);

export default partialRolloutScene;
