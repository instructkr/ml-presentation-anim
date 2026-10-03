import React from 'react';
import { interpolateColors } from 'remotion';
import { defineScene, step, useCurrentStepIndex, useStepProgress } from '@/lib/timeline';
import { Board, Captions, ColumnBars, Fill, Formula, Quantities, Term } from '@/lib/kit';
import { tint, useTheme } from '@/lib/theme';
import { lenParams, lenResult, lenReward, lenTokensK } from '../data/length-example';
import { INK, pick } from '../quantities';

/**
 * §4.3.3, the first half of Eq. 4 — where the "too long" line is drawn. One
 * prompt, eight attempts (the paper samples 16): only the attempts that passed
 * are looked at, and the B-th percentile of their lengths is this prompt's
 * reference length ℓ*. The scene ends on how far the two longest passing
 * attempts sit above it, which is the x-axis of the next scene.
 *
 * The eight lengths and B = 50 are examples (the paper publishes neither);
 * every number on screen is computed from `data/length-example.ts`.
 */
const QUANTITIES = pick('len', 'ref');

const LABELS = lenTokensK.map((_, i) => String(i + 1));
const FAILED = lenReward.flatMap((r, i) => (r === 1 ? [] : [i]));
/** passing attempts longer than the reference — the ones the penalty will look at */
const LONG = lenResult.passIdx.filter((i) => lenResult.ratio[i]! > 1);
/** the worked ratio in the equation: the first of them */
const WORKED = LONG[0]!;

const trim = (v: number) => String(Number(v.toFixed(2)));
const TIMES = LONG.map((i) => `${trim(lenResult.ratio[i]!)}배`);

const REFERENCE =
  '\\q{ref}{\\ell_q^{\\star}} = \\mathrm{Quantile}_{B/100}\\{\\q{len}{\\ell_j} : j \\in \\mathcal{P}_q\\}';
const RATIO = `\\frac{\\q{len}{\\ell_${WORKED + 1}}}{\\q{ref}{\\ell_q^{\\star}}} = \\frac{\\q{len}{${lenTokensK[WORKED]}\\mathrm{K}}}{\\q{ref}{${trim(lenResult.reference)}\\mathrm{K}}} = \\q{out}{${trim(lenResult.ratio[WORKED]!)}}`;

const Scene: React.FC = () => {
  const t = useTheme();
  const idx = useCurrentStepIndex();
  const growP = useStepProgress('lengths', { portion: [0.1, 0.7] });
  const passP = useStepProgress('passing', { portion: [0.1, 0.6] });
  const refP = useStepProgress('reference', { portion: [0.1, 0.5] });
  const ratioP = useStepProgress('ratio', { portion: [0.45, 0.85] });

  const len = t.palette.ink[INK.len];
  // failed attempts fade back: they never enter the reference
  const colors = lenTokensK.map((_, i) =>
    FAILED.includes(i) ? interpolateColors(passP, [0, 1], [len, tint(len, 0.22)]) : len,
  );

  return (
    <Quantities map={QUANTITIES}>
      <Board
        title="얼마나 길면 너무 긴 걸까?"
        source={`MiMo-V2.6 §4.3.3, Eq. 4 (풀이 ${lenTokensK.length}개와 B = ${lenParams.B}은 예시)`}
        formula={
          <Formula
            size="xl"
            write="reference"
            then={[{ step: 'ratio', tex: RATIO }]}
            brace={{ key: 'ref', step: 'reference', delay: 1.5, until: 'ratio', label: '기준 길이', color: INK.ref }}
            box={{ key: 'out', step: 'ratio', delay: 1.4 }}
          >
            {REFERENCE}
          </Formula>
        }
        figure={
          <Fill>
            {({ width, height }) => (
              <ColumnBars
                width={width}
                height={height}
                values={lenTokensK}
                progress={growP}
                labels={LABELS}
                colors={colors}
                highlight={idx === 3 && ratioP > 0 ? LONG : []}
                refLines={[{ value: lenResult.reference, label: '기준 길이', color: INK.ref, opacity: refP }]}
                yDomain={[0, 260]}
                yTicks={[0, 100, 200]}
                yFormat={(v) => `${v}K`}
                // the two long passes carry how many times the reference they are
                valueFormat={(v) => `${trim(v / lenResult.reference)}배`}
                valueIndices={LONG}
                valueOpacity={ratioP}
                textSize={t.fontSize.sm}
              />
            )}
          </Fill>
        }
        caption={
          <Captions
            items={[
              { step: 'lengths', text: <>같은 과제의 풀이 {lenTokensK.length}개는 <Term of="len">길이</Term>가 제각각입니다</> },
              { step: 'passing', text: <>그중 통과한 풀이 {lenResult.passIdx.length}개만 봅니다</> },
              { step: 'reference', text: <>그 길이들의 가운데 값이 이 과제의 <Term of="ref">기준 길이</Term>입니다</> },
              { step: 'ratio', text: <><Term of="ref">기준</Term>보다 {TIMES.join(', ')} 긴 풀이가 감점 대상입니다</> },
            ]}
          />
        }
      />
    </Quantities>
  );
};

export const lengthReferenceScene = defineScene(
  {
    id: '20-length-reference',
    title: '얼마나 길면 너무 긴 걸까?',
    steps: [step('lengths', 2.4), step('passing', 2.2), step('reference', 2.8), step('ratio', 2.8, { hold: 0.6 })],
  },
  Scene,
);

export default lengthReferenceScene;
