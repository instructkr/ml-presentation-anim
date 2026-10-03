import React from 'react';
import { interpolateColors } from 'remotion';
import { defineScene, step, useCurrentStepIndex, useStepProgress } from '@/lib/timeline';
import { Board, Captions, ColumnBars, Fill, Formula, Quantities, Term } from '@/lib/kit';
import { useTheme } from '@/lib/theme';
import { segPos, segPosAfter, segPosBefore, segPosMasked, segScales, segSum } from '../data/segment-example';
import { INK, pick } from '../quantities';

/**
 * §4.3.3, Eq. 5, the positive half — a successful attempt that contains a
 * broken tool call. Every token of an attempt carries the same gap A; a rule
 * flags the broken tokens (h = 1); they are set to zero, and what was taken
 * away is handed to the other tokens through α, so the attempt's total stays
 * the same. The equation gains one factor per beat and is true of the bars at
 * every pause; the last beat works α out on the example's numbers.
 *
 * One attempt of ten tokens is an example, and it stands for the whole batch
 * (Eq. 5 sums over every token of the training batch). Every number on screen
 * is computed from `data/segment-example.ts`.
 *
 * The flagged tokens are gold in this scene and the next: `INK.flag` is red,
 * but the next scene's bars are already red (below zero), and a flagged token
 * has to look the same in both.
 */
const QUANTITIES = { ...pick('A', 'alpha'), At: INK.A, flag: 'gold' } as const;

const N = segPos.h.length;
const LABELS = segPos.h.map((_, i) => String(i + 1));
const FLAGGED = segPos.h.flatMap((h, i) => (h === 1 ? [i] : []));

const one = (v: number) => v.toFixed(1);
const trim = (v: number) => String(Number(v.toFixed(3)));
const signed = (v: number) => (Math.abs(v) < 5e-4 ? '0' : `${v > 0 ? '+' : '−'}${trim(Math.abs(v))}`);
const TOKENS = FLAGGED.map((i) => `${i + 1}번`).join('과 ');

/** `eq` and `keep` are uncoloured tags: they keep the `=` and the bracket travelling as blocks between forms */
const LHS = '\\q{At}{\\widetilde{A}_{i,t}} \\q{eq}{=}';
const KEEP = '\\q{keep}{(1 - \\q{flag}{h_{i,t}})}';
const ALPHA = `\\q{alpha}{\\alpha} = 1 + \\frac{\\sum_{H_+} \\q{A}{A_i}}{\\sum_{C_+} \\q{A}{A_i}} = 1 + \\frac{${one(segScales.hPos)}}{${one(segScales.cPos)}} = \\q{out}{${trim(segScales.alpha)}}`;

const Scene: React.FC = () => {
  const t = useTheme();
  const idx = useCurrentStepIndex();
  const growP = useStepProgress('uniform', { portion: [0.1, 0.7] });
  const flagP = useStepProgress('flag', { portion: [0.1, 0.55] });
  const maskP = useStepProgress('mask', { portion: [0.2, 0.8], easing: 'inOut' });
  const boostP = useStepProgress('boost', { portion: [0.2, 0.8], easing: 'inOut' });

  const chart =
    idx <= 1
      ? { values: segPosBefore, from: undefined, morph: 1 }
      : idx === 2
        ? { values: segPosMasked, from: segPosBefore, morph: maskP }
        : { values: segPosAfter, from: segPosMasked, morph: boostP };

  const gap = t.palette.ink[INK.A];
  const colors = segPos.h.map((h) => (h === 1 ? interpolateColors(flagP, [0, 1], [gap, t.palette.ink.gold]) : gap));

  return (
    <Quantities map={QUANTITIES}>
      <Board
        title="성공한 풀이 속의 잘못된 토큰"
        source={`MiMo-V2.6 §4.3.3, Eq. 5 (토큰 ${N}개짜리 풀이는 예시)`}
        formula={
          <Formula
            size="xl"
            write="uniform"
            then={[
              { step: 'mask', tex: `${LHS} ${KEEP}\\,\\q{A}{A_i}` },
              { step: 'boost', tex: `${LHS} \\q{alpha}{\\alpha}\\,${KEEP}\\,\\q{A}{A_i}` },
              { step: 'conserve', tex: ALPHA },
            ]}
            indicate={[
              { key: 'flag', step: 'mask', delay: 1.3 },
              { key: 'alpha', step: 'boost', delay: 1.3 },
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
                // once their bars are gone, the flagged tokens keep a bold number so the gap still reads as "6 and 7"
                highlight={idx >= 2 && maskP >= 1 ? FLAGGED : []}
                yDomain={[0, 0.75]}
                yTicks={[0, 0.25, 0.5, 0.75]}
                valueFormat={signed}
                textSize={t.fontSize.sm}
              />
            )}
          </Fill>
        }
        caption={
          <Captions
            items={[
              { step: 'uniform', text: <>성공한 풀이의 토큰은 모두 똑같이 <Term of="A">{signed(segPos.A)}</Term>씩 받습니다</> },
              { step: 'flag', text: <>그런데 {TOKENS} 토큰은 <Term of="flag">깨진 도구 호출</Term>입니다</> },
              { step: 'mask', text: <>이 두 토큰은 0으로 만들어 칭찬하지 않습니다</> },
              { step: 'boost', text: <>지운 몫은 <Term of="alpha">나머지 토큰에 골고루 얹어</Term> 줍니다</> },
              { step: 'conserve', text: <>지운 몫 {one(segScales.hPos)}만큼 나머지 {one(segScales.cPos)}에 얹어서 합은 {one(segSum(segPosAfter))} 그대로입니다</> },
            ]}
          />
        }
      />
    </Quantities>
  );
};

export const segmentPositiveScene = defineScene(
  {
    id: '22-segment-positive',
    title: '성공한 풀이 속의 잘못된 토큰',
    steps: [
      step('uniform', 2.4),
      step('flag', 2.2),
      step('mask', 2.8),
      step('boost', 2.8),
      step('conserve', 2.8, { hold: 0.6 }),
    ],
  },
  Scene,
);

export default segmentPositiveScene;
