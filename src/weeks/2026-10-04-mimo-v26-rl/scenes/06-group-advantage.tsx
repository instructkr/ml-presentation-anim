import React from 'react';
import { interpolateColors } from 'remotion';
import { defineScene, step, useCurrentStepIndex, useStepProgress } from '@/lib/timeline';
import { Board, Captions, ColumnBars, Fill, Formula, Quantities, Term } from '@/lib/kit';
import { useTheme } from '@/lib/theme';
import { A_A, A_B, A_C, B_PASS, G, R_A, R_B, R_C, mean, passCount, signed } from '../data/objective-groups';
import { INK, pick } from '../quantities';

/**
 * MiMo-V2.6 §4.1 / §4.3.2 — the group-relative gap (started from the style-pilot reference scene).
 * One group of 16 attempts at the same task: score → the group's average →
 * how far each attempt landed from that average, then two more tasks to show
 * when that gap is large (a rare success) and when it vanishes (everyone passes).
 * All three groups are made-up examples; every number on screen is computed
 * from the 0/1 scores in data/objective-groups.ts.
 */
const LABELS = Array.from({ length: G }, (_, i) => String(i + 1));

/** signed, for the equation (TeX sets its own minus) */
const texSigned = (v: number) => (Math.abs(v) < 5e-4 ? '0' : `${v > 0 ? '+' : '-'}${Math.abs(v)}`);

/**
 * One colour per quantity — the equation, the bars, the average line and the
 * words all read from here, in the week's inks (score blue, average gold, gap
 * green). Yellow is left free: it is the pointer colour (box, flash), so it
 * never names a quantity.
 */
const QUANTITIES = { ...pick('R', 'Rbar', 'A'), out: INK.A } as const;

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
    interpolateColors(toGap, [0, 1], [t.palette.ink[INK.R], v >= 0 ? t.palette.ink[INK.A] : t.palette.ink[INK.neg]]),
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
              // the numbers go where their symbols were: a pass (R = 1) of the hard task, then of the easy one
              { step: 'rare', tex: `\\q{A}{A_i} = \\q{R}{1} - \\q{Rbar}{${mean(R_B)}} = \\q{out}{${texSigned(A_B[B_PASS[0]!]!)}}` },
              { step: 'flat', tex: `\\q{A}{A_i} = \\q{R}{1} - \\q{Rbar}{${mean(R_C)}} = \\q{out}{${texSigned(A_C[0]!)}}` },
            ]}
            brace={{ key: 'Rbar', step: 'mean', delay: 1.2, until: 'gap', label: '평소 점수', color: INK.Rbar }}
            indicate={{ key: 'out', step: 'rare', delay: 1.3 }}
            box={{ key: 'out', step: 'flat', delay: 1.3 }}
          >
            {`\\q{Rbar}{\\bar R} = \\frac{1}{${G}}\\sum_{i=1}^{${G}} \\q{R}{R_i}`}
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
                refLines={[{ value: meanLine, label: '평균', color: INK.Rbar, opacity: meanP }]}
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
              { step: 'group', text: <>같은 과제를 {G}번 풀게 합니다. 통과하면 <Term of="R">1점</Term>, 실패하면 <Term of="R">0점</Term>입니다</> },
              { step: 'mean', text: <>{G}번 중 {passCount(R_A)}번 통과했으니 <Term of="Rbar">평균은 {mean(R_A)}</Term>입니다</> },
              { step: 'gap', text: <><Term of="Rbar">평균</Term>보다 잘한 풀이는 <Term of="A">위로</Term>, 못한 풀이는 아래로 갑니다</> },
              { step: 'rare', text: <>어려운 과제일수록 드문 성공을 <Term of="A">더 크게 밀어 올립니다</Term></> },
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
    id: '06-group-advantage',
    title: '평소보다 얼마나 잘했을까?',
    steps: [step('group', 2.4), step('mean', 2.6), step('gap', 2.8), step('rare', 2.8), step('flat', 2.8, { hold: 0.6 })],
  },
  Scene,
);

export default groupAdvantageScene;
