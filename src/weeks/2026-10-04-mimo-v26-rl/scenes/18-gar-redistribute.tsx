import React from 'react';
import { defineScene, step, useCurrentStepIndex, useStepProgress } from '@/lib/timeline';
import { Board, Captions, ColumnBars, Fill, Formula, Quantities, Term } from '@/lib/kit';
import { useTheme } from '@/lib/theme';
import {
  GAR_G,
  garA,
  garDownweightedSum,
  garPassIdx,
  garPositiveSum,
  garRedist,
  garRedistributedSum,
} from '../data/gar-example';
import { INK, pick } from '../quantities';

/**
 * §4.3.2, Eq. 3 — GAR's redistribution on one group of eight (예시; the paper's
 * group is 16), after the hack correction of scene 17: four attempts pass, so
 * every pass sits +0.5 above the average and every failure −0.5 below it.
 * The quality factors shrink the worse passes, which leaves the positive side
 * short; one common factor λ puts the total back, so the better passes end up
 * with more than they started with and the failures are never touched.
 * Every number on screen is computed in data/gar-example.ts.
 */
/** attempts are numbered like the 16 bars of the group scene: a bar is one attempt */
const LABELS = Array.from({ length: GAR_G }, (_, i) => String(i + 1));

/** a total or a factor in the equation: at least one decimal (2 → 2.0) */
const num = (v: number) => {
  const s = String(Number(v.toFixed(3)));
  return s.includes('.') ? s : `${s}.0`;
};
const signed = (v: number) => (Math.abs(v) < 5e-4 ? '0' : `${v > 0 ? '+' : '−'}${Number(Math.abs(v).toFixed(3))}`);

/**
 * One colour per quantity. `Af` is the gap the quality factor multiplies and
 * `A` the gap inside the plain sum: two tags, one ink, so each keeps its own
 * place when the inequality turns into the fraction. `sumf` and `sumA` tag the
 * two totals (no ink) so they travel into that fraction too.
 */
const QUANTITIES = {
  ...pick('R', 'Rbar', 'A', 'f', 'lam'),
  Af: INK.A,
  An: INK.A,
  lamv: INK.lam,
} as const;

const SUM = '\\sum_{j \\in \\mathcal{P}}';
const SUM_FA = `${SUM} \\q{f}{f_j}\\,\\q{Af}{A_j}`;
const SUM_A = `${SUM} \\q{A}{A_j}`;
const TOTAL_FA = `\\q{sumf}{${num(garDownweightedSum)}}`;
const TOTAL_A = `\\q{sumA}{${num(garPositiveSum)}}`;

const PASS_GAP = garA[garPassIdx[0]!]!;
const BEST = garPassIdx[0]!;

const Scene: React.FC = () => {
  const t = useTheme();
  const idx = useCurrentStepIndex();
  const sameValues = useStepProgress('same', { portion: [0.25, 0.65] });
  const qOut = useStepProgress('quality', { portion: [0, 0.12] });
  const qP = useStepProgress('quality', { portion: [0.15, 0.8], easing: 'inOut' });
  const qValues = useStepProgress('quality', { portion: [0.82, 1] });
  const rOut = useStepProgress('rescale', { portion: [0, 0.12] });
  const rP = useStepProgress('rescale', { portion: [0.2, 0.8], easing: 'inOut' });
  const rValues = useStepProgress('rescale', { portion: [0.82, 1] });

  const chart =
    idx <= 0
      ? { values: garA, from: undefined, morph: 1 }
      : idx <= 2
        ? { values: garRedist.downweighted, from: garA, morph: qP }
        : { values: garRedist.redistributed, from: garRedist.downweighted, morph: rP };
  // the numbers leave before a morph starts and come back once it has landed
  const valueOpacity =
    idx === 0 ? sameValues : idx === 1 ? Math.max(1 - qOut, qValues) : idx === 3 ? Math.max(1 - rOut, rValues) : 1;
  // above the average green, below it red — the failures never move
  const colors = chart.values.map((v) => (v >= 0 ? t.palette.ink[INK.A] : t.palette.ink[INK.neg]));

  return (
    <Quantities map={QUANTITIES}>
      <Board
        title="좋은 풀이에 더 많이 몰아주려면?"
        source="MiMo-V2.6 §4.3.2, Eq. 3 (품질 계수는 예시)"
        formula={
          <Formula
            size="xl"
            then={[
              { step: 'quality', tex: '\\q{f}{f_i}\\,\\q{Af}{A_i}' },
              { step: 'imbalance', tex: `${SUM_FA} = ${TOTAL_FA} \\;<\\; ${SUM_A} = ${TOTAL_A}` },
              {
                step: 'rescale',
                tex: `\\q{lam}{\\lambda} = \\frac{${SUM_A}}{${SUM_FA}} = \\frac{${TOTAL_A}}{${TOTAL_FA}} = \\q{lamv}{${num(garRedist.lambda)}}`,
              },
              { step: 'result', tex: "\\q{An}{A'_i} = \\q{lam}{\\lambda}\\,\\q{f}{f_i}\\,\\q{Af}{A_i}" },
            ]}
            brace={{ key: 'f', step: 'quality', delay: 1.3, until: 'imbalance', label: '품질 계수', color: INK.f }}
            indicate={{ key: 'lamv', step: 'rescale', delay: 1.5 }}
            box={{ key: 'An', step: 'result', delay: 1.3 }}
          >
            {'\\q{Af}{A_i} = \\q{R}{R_i} - \\q{Rbar}{\\bar R}'}
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
                labels={LABELS}
                colors={colors}
                highlight={idx === 0 ? garPassIdx : idx === 4 ? [BEST] : []}
                // pinned, so neither morph rescales the axis
                yDomain={[-0.75, 1]}
                yTicks={[-0.5, 0, 0.5, 1]}
                valueFormat={signed}
                valueOpacity={valueOpacity}
                textSize={t.fontSize.sm}
              />
            )}
          </Fill>
        }
        caption={
          <Captions
            items={[
              { step: 'same', text: <>통과한 풀이는 모두 똑같이 <Term of="A">{signed(PASS_GAP)}</Term>를 받고 있습니다</> },
              { step: 'quality', text: <>순위가 낮을수록 <Term of="f">작은 수</Term>를 곱해서 깎습니다</> },
              { step: 'imbalance', text: <>그런데 위쪽 합이 {num(garPositiveSum)}에서 {num(garDownweightedSum)}로 줄었습니다</> },
              { step: 'rescale', text: <>같은 <Term of="lam">배율 {num(garRedist.lambda)}</Term>을 곱해서 합을 {num(garRedistributedSum)}으로 되돌립니다</> },
              { step: 'result', text: <>합은 그대로이고, 좋은 풀이가 <Term of="A">더 큰 몫</Term>을 가져갑니다</> },
            ]}
          />
        }
      />
    </Quantities>
  );
};

export const garRedistributeScene = defineScene(
  {
    id: '18-gar-redistribute',
    title: '좋은 풀이에 더 많이 몰아주려면?',
    steps: [step('same', 2.4), step('quality', 2.8), step('imbalance', 2.6), step('rescale', 3.0), step('result', 2.6, { hold: 0.6 })],
  },
  Scene,
);

export default garRedistributeScene;
