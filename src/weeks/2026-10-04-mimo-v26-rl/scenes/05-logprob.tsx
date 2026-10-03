import React from 'react';
import { interpolateColors } from 'remotion';
import { defineScene, step, useCurrentStepIndex, useStepProgress } from '@/lib/timeline';
import { Board, Captions, ColumnBars, Fill, Formula, Quantities, Term } from '@/lib/kit';
import { useTheme } from '@/lib/theme';
import { CHOSEN, P, P_DOWN, P_UP, TOKENS, prob } from '../data/objective-logprob';
import { INK } from '../quantities';

/**
 * §4.1, the last factor of Eq. 1 — what training can actually move. At every
 * position the model spreads probability over the candidate next tokens; the
 * one it wrote has a probability, and RL pushes that one number up after a
 * good attempt and down after a bad one. The other candidates move the other
 * way because the bars always sum to 1.
 *
 * The five candidates and every probability are an example, computed in
 * data/objective-logprob.ts (one policy-gradient step on the logits).
 */
const QUANTITIES = { pi: INK.pi, val: INK.pi } as const;

/**
 * `arg` is tagged (it has no ink) so the argument travels as one piece when the
 * `log` is written in front of it. Untagged, its two o's and two t's pair up by
 * nearness and cross over mid-morph.
 */
const POLICY = '\\q{pi}{\\pi_\\theta}\\q{arg}{(o_t \\mid q,\\, o_{<t})}';

const Scene: React.FC = () => {
  const t = useTheme();
  const idx = useCurrentStepIndex();
  const growP = useStepProgress('dist', { portion: [0.1, 0.7] });
  const pickP = useStepProgress('chosen', { portion: [0, 0.4] });
  const upP = useStepProgress('up', { portion: [0.15, 0.8], easing: 'inOut' });
  const downP = useStepProgress('down', { portion: [0.15, 0.8], easing: 'inOut' });

  const chart = (() => {
    switch (idx) {
      case 0:
      case 1:
        return { values: P, from: undefined, morph: 1 };
      case 2:
        return { values: P_UP, from: P, morph: upP };
      default:
        return { values: P_DOWN, from: P_UP, morph: downP };
    }
  })();
  // every candidate is grey until the written token is singled out
  const colors = TOKENS.map((_, i) =>
    i === CHOSEN ? interpolateColors(pickP, [0, 1], [t.palette.ink.grey, t.palette.ink.teal]) : t.palette.ink.grey,
  );

  return (
    <Quantities map={QUANTITIES}>
      <Board
        title="무엇을 올리고 내릴까?"
        source="MiMo-V2.6 §4.1 · 확률은 예시"
        formula={
          <Formula
            size="xl"
            write="chosen"
            then={[{ step: 'up', tex: `\\q{lp}{\\log ${POLICY}}` }]}
            brace={{ key: 'lp', step: 'up', delay: 1.3, label: '올리고 내릴 값' }}
          >
            {`${POLICY} = \\q{val}{${prob(P[CHOSEN]!)}}`}
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
                labels={TOKENS}
                colors={colors}
                highlight={idx >= 1 ? [CHOSEN] : []}
                yDomain={[0, 1]}
                yTicks={[0, 0.5, 1]}
                yLabel="확률"
                valueFormat={prob}
                valueIndices={[CHOSEN]}
                valueOpacity={pickP}
                textSize={t.fontSize.md}
              />
            )}
          </Fill>
        }
        caption={
          <Captions
            items={[
              { step: 'dist', text: <>모델은 다음 토큰 후보마다 확률을 매깁니다</> },
              { step: 'chosen', text: <>실제로 쓴 토큰은 {TOKENS[CHOSEN]}이고, <Term of="pi">그 확률은 {prob(P[CHOSEN]!)}</Term>였습니다</> },
              { step: 'up', text: <>좋은 풀이였다면 <Term of="pi">이 확률</Term>을 올립니다. 나머지는 줄어듭니다</> },
              { step: 'down', text: <>나쁜 풀이였다면 반대로 내립니다</> },
            ]}
          />
        }
      />
    </Quantities>
  );
};

export const logprobScene = defineScene(
  {
    id: '05-logprob',
    title: '무엇을 올리고 내릴까?',
    steps: [step('dist', 2.4), step('chosen', 2.6), step('up', 2.8), step('down', 2.8, { hold: 0.6 })],
  },
  Scene,
);

export default logprobScene;
