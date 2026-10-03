import React from 'react';
import { interpolateColors } from 'remotion';
import { defineScene, step, useCurrentStepIndex, useStepProgress } from '@/lib/timeline';
import { Board, Captions, ColumnBars, Fill, Formula, Quantities, Term } from '@/lib/kit';
import { useTheme } from '@/lib/theme';
import {
  segKappa,
  segNeg,
  segNegAfter,
  segNegAmplified,
  segNegBefore,
  segScales,
  segSum,
} from '../data/segment-example';
import { INK, pick } from '../quantities';

/**
 * §4.3.3, Eq. 5, the negative half — a failed attempt that contains a broken
 * tool call. The flagged tokens are punished κ times as hard; the other tokens'
 * punishment is scaled down by β, chosen so that the attempt's total stays
 * where it was. The equation gains one factor per beat and is true of the bars
 * at every pause; the last beat works β out on the example's numbers.
 *
 * One attempt of ten tokens and κ = 3 are examples (the paper only requires
 * κ > 1), and the attempt stands for the whole batch. Every number on screen is
 * computed from `data/segment-example.ts`.
 *
 * Flagged tokens are gold here, as in the previous scene: the bars are red
 * because they are below zero, so red cannot also mean "flagged".
 */
const QUANTITIES = { ...pick('A', 'neg', 'kappa', 'beta'), At: INK.A, flag: 'gold' } as const;

const N = segNeg.h.length;
const LABELS = segNeg.h.map((_, i) => String(i + 1));
const FLAGGED = segNeg.h.flatMap((h, i) => (h === 1 ? [i] : []));

const one = (v: number) => v.toFixed(1);
const trim = (v: number) => String(Number(v.toFixed(3)));
const signed = (v: number) => (Math.abs(v) < 5e-4 ? '0' : `${v > 0 ? '+' : '−'}${trim(Math.abs(v))}`);
const TOKENS = FLAGGED.map((i) => `${i + 1}번`).join('과 ');
/** how the phrase says β */
const SHRINK = segScales.beta === 0.5 ? '절반으로' : `${trim(segScales.beta)}배로`;
/** punishment added on the flagged tokens = punishment taken off the others */
const ADDED = (segKappa - 1) * segScales.hNeg;

/** `eq` and `keep` are uncoloured tags: they keep the `=` and the bracket travelling as blocks between forms */
const LHS = '\\q{At}{\\widetilde{A}_{i,t}} \\q{eq}{=}';
const KEEP = '\\q{keep}{(1 - \\q{flag}{h_{i,t}})}';
const HIT = '\\q{kappa}{\\kappa}\\,\\q{flag}{h_{i,t}}';
const BETA = `\\q{beta}{\\beta} = 1 - \\frac{(\\q{kappa}{\\kappa} - 1)\\sum_{H_-}|\\q{A}{A_i}|}{\\sum_{C_-}|\\q{A}{A_i}|} = 1 - \\frac{${segKappa - 1} \\times ${one(segScales.hNeg)}}{${one(segScales.cNeg)}} = \\q{out}{${trim(segScales.beta)}}`;

const Scene: React.FC = () => {
  const t = useTheme();
  const idx = useCurrentStepIndex();
  const growP = useStepProgress('uniform', { portion: [0.1, 0.7] });
  // the flagged tokens change colour first, then grow
  const flagP = useStepProgress('amplify', { portion: [0.05, 0.35] });
  const ampP = useStepProgress('amplify', { portion: [0.3, 0.85], easing: 'inOut' });
  const relaxP = useStepProgress('relax', { portion: [0.2, 0.8], easing: 'inOut' });

  const chart =
    idx === 0
      ? { values: segNegBefore, from: undefined, morph: 1 }
      : idx === 1
        ? { values: segNegAmplified, from: segNegBefore, morph: ampP }
        : { values: segNegAfter, from: segNegAmplified, morph: relaxP };

  const below = t.palette.ink[INK.neg];
  const colors = segNeg.h.map((h) => (h === 1 ? interpolateColors(flagP, [0, 1], [below, t.palette.ink.gold]) : below));

  return (
    <Quantities map={QUANTITIES}>
      <Board
        title="실패한 풀이 속의 잘못된 토큰"
        source={`MiMo-V2.6 §4.3.3, Eq. 5 (토큰 ${N}개짜리 풀이와 κ = ${segKappa}은 예시)`}
        formula={
          <Formula
            size="xl"
            write="uniform"
            then={[
              { step: 'amplify', tex: `${LHS} \\left[${KEEP} + ${HIT}\\right]\\q{A}{A_i}` },
              { step: 'relax', tex: `${LHS} \\left[\\q{beta}{\\beta}\\,${KEEP} + ${HIT}\\right]\\q{A}{A_i}` },
              { step: 'conserve', tex: BETA },
            ]}
            indicate={[
              { key: 'kappa', step: 'amplify', delay: 1.4 },
              { key: 'beta', step: 'relax', delay: 1.4 },
            ]}
            box={{ key: 'out', step: 'conserve', delay: 1.5 }}
          >
            {`${LHS} \\q{A}{A_i}`}
          </Formula>
        }
        figure={
          <Fill>
            {({ width, height }) => (
              <ColumnBars
                width={width}
                height={height}
                values={chart.values}
                from={chart.from}
                morph={chart.morph}
                progress={growP}
                labels={LABELS}
                colors={colors}
                yDomain={[-1.75, 0]}
                yTicks={[-1.5, -1, -0.5, 0]}
                valueFormat={signed}
                textSize={t.fontSize.sm}
              />
            )}
          </Fill>
        }
        caption={
          <Captions
            items={[
              { step: 'uniform', text: <>실패한 풀이의 토큰은 모두 똑같이 <Term of="neg">{signed(segNeg.A)}</Term>씩 받습니다</> },
              { step: 'amplify', text: <><Term of="flag">깨진 도구 호출</Term>인 {TOKENS} 토큰은 <Term of="kappa">{segKappa}배</Term>로 벌합니다</> },
              { step: 'relax', text: <>대신 멀쩡한 토큰의 벌은 <Term of="beta">{SHRINK}</Term> 줄입니다</> },
              { step: 'conserve', text: <>더한 벌 {one(ADDED)}만큼 나머지에서 덜어서 합은 −{one(-segSum(segNegAfter))} 그대로입니다</> },
            ]}
          />
        }
      />
    </Quantities>
  );
};

export const segmentNegativeScene = defineScene(
  {
    id: '23-segment-negative',
    title: '실패한 풀이 속의 잘못된 토큰',
    steps: [step('uniform', 2.4), step('amplify', 3.0), step('relax', 2.8), step('conserve', 2.8, { hold: 0.6 })],
  },
  Scene,
);

export default segmentNegativeScene;
