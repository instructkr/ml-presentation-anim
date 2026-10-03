import React from 'react';
import { interpolateColors } from 'remotion';
import { defineScene, step, useCurrentStepIndex, useStepProgress } from '@/lib/timeline';
import { Board, Captions, ColumnBars, Fill, Formula, Quantities, Term } from '@/lib/kit';
import { useTheme } from '@/lib/theme';

/**
 * Recipe 1 · chart + equation — MiMo-V2.6 §4.1 / §4.3.2 in the blackboard look.
 * One group of 16 attempts at the same problem: score → the group's average →
 * how far each attempt landed from that average, then two more problems to show
 * when that gap is large (a rare success) and when it vanishes (everyone passes).
 * All three groups are made-up examples; every number on screen is computed
 * from the 0/1 scores below.
 */
const G = 16;
const LABELS = Array.from({ length: G }, (_, i) => String(i + 1));

const passing = (idx: number[]) => Array.from({ length: G }, (_, i) => (idx.includes(i) ? 1 : 0));
const mean = (r: number[]) => r.reduce((a, b) => a + b, 0) / r.length;
const gap = (r: number[]) => r.map((v) => v - mean(r));

/** problem A: 10 of 16 pass → average 0.625 */
const R_A = [1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 0, 1, 0];
/** problem B, harder: 2 of 16 pass → average 0.125, so a pass lands +0.875 above it */
const B_PASS = [5, 11];
const R_B = passing(B_PASS);
/** problem C, easy: all pass → average 1, every gap is 0 */
const R_C = passing(Array.from({ length: G }, (_, i) => i));
const A_A = gap(R_A);
const A_B = gap(R_B);
const A_C = gap(R_C);

const signed = (v: number) => (Math.abs(v) < 5e-4 ? '0' : `${v > 0 ? '+' : '−'}${Math.abs(v)}`);

/**
 * One colour per quantity — the equation, the bars, the average line and the
 * words all read from here. Yellow is left free: it is the pointer colour
 * (box, flash), so it never names a quantity.
 */
const QUANTITIES = { R: 'blue', Rbar: 'gold', A: 'green', out: 'green' } as const;

const Scene: React.FC = () => {
  const t = useTheme();
  const idx = useCurrentStepIndex();
  const growP = useStepProgress('group', { portion: [0.1, 0.7] });
  const meanP = useStepProgress('mean', { portion: [0, 0.4] });
  const gapP = useStepProgress('gap', { portion: [0.15, 0.8], easing: 'inOut' });
  const rareP = useStepProgress('rare', { portion: [0.15, 0.8], easing: 'inOut' });
  const flatP = useStepProgress('flat', { portion: [0.15, 0.8], easing: 'inOut' });
  const flatIn = useStepProgress('flat', { portion: [0.8, 1] });

  const chart = (() => {
    switch (idx) {
      case 0:
      case 1:
        return { values: R_A, from: undefined, morph: 1 };
      case 2:
        return { values: A_A, from: R_A, morph: gapP };
      case 3:
        return { values: A_B, from: A_A, morph: rareP };
      default:
        return { values: A_C, from: A_B, morph: flatP };
    }
  })();
  // subtracting the average slides its line down onto zero together with every bar
  const meanLine = mean(R_A) * (1 - (idx >= 2 ? gapP : 0));
  // bars are scores (blue) until the subtraction, then gaps: above average green, below red
  const toGap = idx >= 2 ? gapP : 0;
  const drawn = chart.values.map((v, i) => (chart.from ? chart.from[i]! + (v - chart.from[i]!) * chart.morph : v));
  const colors = drawn.map((v) =>
    interpolateColors(toGap, [0, 1], [t.palette.ink.blue, v >= 0 ? t.palette.ink.green : t.palette.ink.red]),
  );

  return (
    <Quantities map={QUANTITIES}>
      <Board
        title="평소보다 얼마나 잘했을까?"
        source="MiMo-V2.6 §4.1, §4.3.2"
        formula={
          <Formula
            size="xl"
            write="mean"
            then={[
              { step: 'gap', tex: '\\q{A}{A_i} = \\q{R}{R_i} - \\q{Rbar}{\\bar R}' },
              { step: 'rare', tex: '\\q{A}{A_i} = \\q{R}{1} - \\q{Rbar}{0.125} = \\q{out}{+0.875}' },
              { step: 'flat', tex: '\\q{A}{A_i} = \\q{R}{1} - \\q{Rbar}{1} = \\q{out}{0}' },
            ]}
            brace={{ key: 'Rbar', step: 'mean', delay: 1.2, until: 'gap', label: '평소 점수', color: 'gold' }}
            indicate={{ key: 'out', step: 'rare', delay: 1.3 }}
            box={{ key: 'out', step: 'flat', delay: 1.3 }}
          >
            {'\\q{Rbar}{\\bar R} = \\frac{1}{16}\\sum_{i=1}^{16} \\q{R}{R_i}'}
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
                highlight={idx === 3 ? B_PASS : []}
                refLines={[{ value: meanLine, label: '평균', color: 'gold', opacity: meanP }]}
                yDomain={[-0.75, 1]}
                yTicks={[-0.5, 0, 0.5, 1]}
                valueFormat={signed}
                // the rare success carries its number; when everyone passes, every bar reads 0
                valueIndices={idx === 3 ? [B_PASS[0]!] : idx === 4 ? undefined : []}
                valueOpacity={idx === 3 ? rareP : idx === 4 ? flatIn : 0}
                textSize={t.fontSize.sm}
              />
            )}
          </Fill>
        }
        caption={
          <Captions
            items={[
              { step: 'group', text: <>같은 문제를 16번 풀게 합니다. 통과하면 <Term of="R">1점</Term>, 실패하면 <Term of="R">0점</Term>입니다</> },
              { step: 'mean', text: <>16번 중 10번 통과했으니 <Term of="Rbar">평균은 0.625</Term>입니다</> },
              { step: 'gap', text: <><Term of="Rbar">평균</Term>보다 잘한 풀이는 <Term of="A">위로</Term>, 못한 풀이는 아래로 갑니다</> },
              { step: 'rare', text: <>어려운 문제일수록 드문 성공을 <Term of="A">더 크게 밀어 올립니다</Term></> },
              { step: 'flat', text: <>모두 통과하면 차이가 없어서 배울 것도 없습니다</> },
            ]}
          />
        }
      />
    </Quantities>
  );
};

export const groupAdvantageScene = defineScene(
  {
    id: '01-group-advantage',
    title: '평소보다 얼마나 잘했을까?',
    steps: [step('group', 2.4), step('mean', 2.6), step('gap', 2.8), step('rare', 2.8), step('flat', 2.8, { hold: 0.6 })],
  },
  Scene,
);

export default groupAdvantageScene;
