import React from 'react';
import { defineScene, step } from '@/lib/timeline';
import { Board, Captions, DiagramView, Formula, Quantities, Term } from '@/lib/kit';
import { attention } from '../diagrams/attention.diagram';

/**
 * Recipe 3 · figure + equation — a top-to-bottom diagram in the tall left cell
 * of a `split` Board, the equation growing beside it. The diagram nodes wear
 * the same ink names as the equation's terms, so Query is blue in both.
 */
const QUANTITIES = { Q: 'blue', K: 'teal', V: 'green', A: 'gold' } as const;

const SCORES = '\\frac{\\q{Q}{Q}\\,\\q{K}{K}^{\\top}}{\\sqrt{d}}';

export const attentionSplitScene = defineScene(
  {
    id: '03-attention-split',
    title: '어디를 얼마나 볼까?',
    steps: [step('match', 2.6), step('weights', 2.6), step('mix', 2.8, { hold: 0.6 })],
  },
  () => (
    <Quantities map={QUANTITIES}>
      <Board
        title="어디를 얼마나 볼까?"
        source="Attention"
        layout="split"
        figure={
          <DiagramView
            diagram={attention}
            stepEffects={{
              // Query, Key and Value are in no reveal → the frame-0 anchor
              match: { reveal: ['e-q-scores', 'e-k-scores', 'scores'], highlight: ['q', 'k'] },
              weights: { reveal: ['e-scores-weights', 'weights'], highlight: ['weights'] },
              mix: { reveal: ['e-weights-mix', 'e-v-mix', 'mix', 'e-mix-out', 'out'], highlight: ['v'] },
            }}
          />
        }
        formula={
          <Formula
            size="lg"
            write="match"
            then={[
              { step: 'weights', tex: `\\q{A}{A} = \\mathrm{softmax}\\!\\left(${SCORES}\\right)` },
              { step: 'mix', tex: `\\mathrm{softmax}\\!\\left(${SCORES}\\right)\\q{V}{V}` },
            ]}
          >
            {SCORES}
          </Formula>
        }
        caption={
          <Captions
            items={[
              { step: 'match', text: <><Term of="Q">Query</Term>와 <Term of="K">Key</Term>가 얼마나 닮았는지 점수를 냅니다</> },
              { step: 'weights', text: <>softmax로 점수를 합이 1인 <Term of="A">비율</Term>로 바꿉니다</> },
              { step: 'mix', text: <>그 비율만큼 <Term of="V">Value</Term>를 섞으면 출력이 됩니다</> },
            ]}
          />
        }
      />
    </Quantities>
  ),
);

export default attentionSplitScene;
