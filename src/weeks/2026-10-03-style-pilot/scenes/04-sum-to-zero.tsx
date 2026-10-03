import React from 'react';
import { defineScene, step } from '@/lib/timeline';
import { Board, Captions, Formula, Quantities, Term } from '@/lib/kit';

/**
 * Recipe 4 · derivation — an equation alone on the board, one move per beat.
 * Each beat's phrase says why the move is made; the new form is what it hands
 * you. The definition is on screen from frame 0 (no `write`), so it is the anchor.
 *
 * Claim: inside one group the gaps from the average always add up to zero.
 */
const QUANTITIES = { A: 'green', R: 'blue', Rbar: 'gold', sixteen: 'gold' } as const;

const SUM = '\\sum_{i=1}^{16}';
const LHS = `${SUM} \\q{A}{A_i} =`;

export const sumToZeroScene = defineScene(
  {
    id: '04-sum-to-zero',
    title: '차이를 모두 더하면?',
    steps: [step('sum', 2.6), step('split', 2.6), step('swap', 2.8), step('zero', 2.6, { hold: 0.6 })],
  },
  () => (
    <Quantities map={QUANTITIES}>
      <Board
        title="차이를 모두 더하면?"
        source="평균을 뺀 값의 성질"
        formula={
          <Formula
            size="2xl"
            // every form's `=` stays put, so only the side being rewritten moves
            align="equals"
            then={[
              { step: 'sum', tex: `${LHS} ${SUM} \\left( \\q{R}{R_i} - \\q{Rbar}{\\bar R} \\right)` },
              // `total` wraps the whole sum so the brace can sit under all of it; the R inside keeps its own tag
              { step: 'split', tex: `${LHS} \\q{total}{${SUM} \\q{R}{R_i}} - 16\\,\\q{Rbar}{\\bar R}` },
              { step: 'swap', tex: `${LHS} \\q{sixteen}{16\\,\\bar R} - 16\\,\\q{Rbar}{\\bar R}` },
              { step: 'zero', tex: `${LHS} \\q{out}{0}` },
            ]}
            brace={{ key: 'total', step: 'split', delay: 1.3, until: 'swap', label: '평균의 16배' }}
            box={{ key: 'out', step: 'zero', delay: 1.2 }}
          >
            {'\\q{A}{A_i} = \\q{R}{R_i} - \\q{Rbar}{\\bar R}'}
          </Formula>
        }
        caption={
          <Captions
            items={[
              { step: 'sum', text: <>한 그룹의 <Term of="A">차이</Term>를 전부 더해 보겠습니다</> },
              { step: 'split', text: <><Term of="Rbar">평균</Term>은 16번 똑같이 빠집니다</> },
              { step: 'swap', text: <><Term of="R">점수</Term>를 다 더한 값이 바로 평균의 16배입니다</> },
              { step: 'zero', text: <>그래서 합은 늘 0입니다. 누군가 오르면 누군가는 내려갑니다</> },
            ]}
          />
        }
      />
    </Quantities>
  ),
);

export default sumToZeroScene;
