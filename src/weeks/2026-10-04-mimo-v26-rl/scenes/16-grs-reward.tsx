import React from 'react';
import { interpolateColors } from 'remotion';
import { defineScene, step, useCurrentStepIndex, useStepProgress } from '@/lib/timeline';
import { Board, Captions, ColumnBars, Fill, Formula, Quantities, Term } from '@/lib/kit';
import { useTheme } from '@/lib/theme';
import {
  GRS_G,
  GRS_WORKED,
  grsAdvantage,
  grsBeh,
  grsFailed,
  grsFailedReward,
  grsMean,
  grsReward,
  grsSol,
  grsTest,
  grsTestMean,
} from '../data/grs-example';
import { INK, pick } from '../quantities';

/**
 * §4.3.1, Eq. 2 — GRS on one group whose eight attempts all pass (예시; the
 * paper's group is 16). With the test score alone every bar is 1 and nothing
 * can be learned; multiplying in the two rubric scores spreads the bars, and
 * subtracting the new average splits them into better and worse than usual.
 * Every number on screen is computed in data/grs-example.ts.
 */
/** attempts are numbered like the 16 bars of the group scene: a bar is one attempt */
const LABELS = Array.from({ length: GRS_G }, (_, i) => String(i + 1));

/** a rubric score: at least one decimal, so 1.0 reads as a score and not as the test's 1 */
const score = (v: number) => v.toFixed(2).replace(/0$/, '');
/** a reward on a bar or in the equation: trimmed, 0 stays a bare 0 */
const plain = (v: number) => String(Number(v.toFixed(2)));
const signed = (v: number) => (Math.abs(v) < 5e-4 ? '0' : `${v > 0 ? '+' : '−'}${Number(Math.abs(v).toFixed(3))}`);

/**
 * one colour per quantity — `T` (the test score) is tagged so it stays in place
 * through the forms but takes no ink; `out` is a reward, so it is blue like R
 */
const QUANTITIES = { ...pick('R', 'Rbar', 'A', 'sol', 'beh'), out: INK.R } as const;

const product = (i: string, test: number, sol: number, beh: number, out: number) =>
  `\\q{R}{R_${i}} = \\q{T}{${test}} \\cdot \\q{sol}{${score(sol)}} \\cdot \\q{beh}{${score(beh)}} = \\q{out}{${plain(out)}}`;

const W = GRS_WORKED;

const Scene: React.FC = () => {
  const t = useTheme();
  const idx = useCurrentStepIndex();
  const meanIn = useStepProgress('flat', { portion: [0.1, 0.55] });
  const mulP = useStepProgress('multiply', { portion: [0.2, 0.8], easing: 'inOut' });
  const mulValues = useStepProgress('multiply', { portion: [0.82, 1] });
  const gapOut = useStepProgress('gap', { portion: [0, 0.12] });
  const gapP = useStepProgress('gap', { portion: [0.15, 0.8], easing: 'inOut' });
  const gapValues = useStepProgress('gap', { portion: [0.82, 1] });

  const chart =
    idx <= 0
      ? { values: grsTest, from: undefined, morph: 1 }
      : idx < 4
        ? { values: grsReward, from: grsTest, morph: mulP }
        : { values: grsAdvantage, from: grsReward, morph: gapP };
  // the average rides down with the bars: 1 → 0.745 when the scores are multiplied in, → 0 when it is subtracted
  const meanLine = idx < 4 ? grsTestMean + (grsMean - grsTestMean) * mulP : grsMean * (1 - gapP);
  // bars are scores (blue) until the subtraction, then gaps: above the average green, below red
  const drawn = chart.values.map((v, i) => (chart.from ? chart.from[i]! + (v - chart.from[i]!) * chart.morph : v));
  const colors = drawn.map((v) =>
    interpolateColors(idx >= 4 ? gapP : 0, [0, 1], [t.palette.ink[INK.R], v >= 0 ? t.palette.ink[INK.A] : t.palette.ink[INK.neg]]),
  );

  return (
    <Quantities map={QUANTITIES}>
      <Board
        title="모두 통과한 그룹에서 무엇을 배울까?"
        source="MiMo-V2.6 §4.3.1, Eq. 2 (점수는 예시)"
        formula={
          <Formula
            size="xl"
            write="multiply"
            then={[
              { step: 'worked', tex: product(String(W + 1), grsTest[W]!, grsSol[W]!, grsBeh[W]!, grsReward[W]!) },
              { step: 'gate', tex: product('i', grsFailed.test, grsFailed.sol, grsFailed.beh, grsFailedReward) },
              { step: 'gap', tex: '\\q{A}{A_i} = \\q{R}{R_i} - \\q{Rbar}{\\bar R}' },
            ]}
            indicate={[
              { key: 'out', step: 'worked', delay: 1.3 },
              { key: 'T', step: 'gate', delay: 1.3 },
            ]}
          >
            {'\\q{R}{R_i} = \\q{T}{R_i^{\\mathrm{test}}} \\cdot \\q{sol}{S_i^{\\mathrm{sol}}} \\cdot \\q{beh}{S_i^{\\mathrm{beh}}}'}
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
                highlight={idx === 2 ? [W] : []}
                refLines={[{ value: meanLine, label: '평균', color: INK.Rbar, opacity: meanIn }]}
                // pinned, so neither morph rescales the axis
                yDomain={[-0.3, 1]}
                yTicks={[0, 0.5, 1]}
                valueFormat={idx >= 4 && gapP > 0 ? signed : plain}
                // the numbers leave before a morph starts and come back once it has landed
                valueOpacity={idx < 1 ? 0 : idx < 4 ? mulValues : Math.max(1 - gapOut, gapValues)}
                textSize={t.fontSize.sm}
              />
            )}
          </Fill>
        }
        caption={
          <Captions
            items={[
              { step: 'flat', text: <>여덟 번 모두 통과하면 전부 <Term of="R">1점</Term>이라 차이가 없습니다</> },
              { step: 'multiply', text: <>테스트 점수에 <Term of="sol">결과물 점수</Term>와 <Term of="beh">일하는 방식 점수</Term>를 곱합니다</> },
              // the particles after the numbers (…라서, …점이) are written for the example's 0.5
              { step: 'worked', text: <>{W + 1}번 풀이는 <Term of="sol">결과물 점수가 {score(grsSol[W]!)}</Term>라서 <Term of="R">{plain(grsReward[W]!)}점</Term>이 됩니다</> },
              { step: 'gate', text: <>실패한 풀이는 {grsFailed.test}을 곱하니 그대로 <Term of="R">{plain(grsFailedReward)}점</Term>입니다</> },
              { step: 'gap', text: <><Term of="Rbar">평균</Term>을 빼면 통과한 풀이끼리도 <Term of="A">위아래로</Term> 갈립니다</> },
            ]}
          />
        }
      />
    </Quantities>
  );
};

export const grsRewardScene = defineScene(
  {
    id: '16-grs-reward',
    title: '모두 통과한 그룹에서 무엇을 배울까?',
    steps: [step('flat', 2.4), step('multiply', 2.8), step('worked', 2.6), step('gate', 2.6), step('gap', 2.8, { hold: 0.6 })],
  },
  Scene,
);

export default grsRewardScene;
