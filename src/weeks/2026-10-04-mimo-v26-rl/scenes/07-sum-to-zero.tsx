import React from 'react';
import { defineScene, step } from '@/lib/timeline';
import { Board, Captions, Formula, Quantities, Term } from '@/lib/kit';
import { RL_SCALE } from '../data/objective-rl-scale';
import { INK, pick } from '../quantities';

/**
 * MiMo-V2.6 §4.1 / §4.3.2 — started from the style-pilot derivation scene: an
 * equation alone on the board, one move per beat.
 * Each beat's phrase says why the move is made; the new form is what it hands
 * you. The definition is on screen from frame 0 (no `write`), so it is the anchor.
 *
 * Claim: inside one group the gaps from the average always add up to zero.
 */
const QUANTITIES = { ...pick('A', 'R', 'Rbar'), sixteen: INK.Rbar } as const;

/** group size: attempts per task (§4.1) */
const G = RL_SCALE.G;

const SUM = `\\sum_{i=1}^{${G}}`;
const LHS = `${SUM} \\q{A}{A_i} =`;

export const sumToZeroScene = defineScene(
  {
    id: '07-sum-to-zero',
    title: '차이를 모두 더하면?',
    steps: [step('sum', 2.6), step('split', 2.6), step('swap', 2.8), step('zero', 2.6, { hold: 0.6 })],
  },
  () => (
    <Quantities map={QUANTITIES}>
      <Board
        title="차이를 모두 더하면?"
        source="MiMo-V2.6 §4.1, §4.3.2"
        formula={
          <Formula
            size="2xl"
            // every form's `=` stays put, so only the side being rewritten moves
            align="equals"
            then={[
              { step: 'sum', tex: `${LHS} ${SUM} \\left( \\q{R}{R_i} - \\q{Rbar}{\\bar R} \\right)` },
              // `total` wraps the whole sum so the brace can sit under all of it; the R inside keeps its own tag
              { step: 'split', tex: `${LHS} \\q{total}{${SUM} \\q{R}{R_i}} - ${G}\\,\\q{Rbar}{\\bar R}` },
              { step: 'swap', tex: `${LHS} \\q{sixteen}{${G}\\,\\bar R} - ${G}\\,\\q{Rbar}{\\bar R}` },
              { step: 'zero', tex: `${LHS} \\q{out}{0}` },
            ]}
            brace={{ key: 'total', step: 'split', delay: 1.3, until: 'swap', label: `평균의 ${G}배` }}
            box={{ key: 'out', step: 'zero', delay: 1.2 }}
          >
            {'\\q{A}{A_i} = \\q{R}{R_i} - \\q{Rbar}{\\bar R}'}
          </Formula>
        }
        caption={
          <Captions
            items={[
              { step: 'sum', text: <>한 그룹의 <Term of="A">차이</Term>를 전부 더해 보겠습니다</> },
              { step: 'split', text: <><Term of="Rbar">평균</Term>은 {G}번 똑같이 빠집니다</> },
              { step: 'swap', text: <><Term of="R">점수</Term>를 다 더한 값이 바로 평균의 {G}배입니다</> },
              { step: 'zero', text: <>그래서 합은 늘 0입니다. 누군가 오르면 누군가는 내려갑니다</> },
            ]}
          />
        }
      />
    </Quantities>
  ),
);

export default sumToZeroScene;
