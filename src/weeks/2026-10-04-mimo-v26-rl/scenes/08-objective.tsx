import React from 'react';
import { defineScene, step } from '@/lib/timeline';
import { Board, Captions, Formula, Quantities, Term } from '@/lib/kit';
import { RL_SCALE } from '../data/objective-rl-scale';
import { pick } from '../quantities';

/**
 * §4.1, Eq. 1 — the RL objective put together one factor per beat, starting
 * from the one thing training can move (the log-probability of a written
 * token) and ending on the paper's line:
 *
 *   L(θ) = −E[ 1/Σ|oᵢ| · Σᵢ Σₜ r · M · A · log π_θ(o_{i,t}) ]
 *
 * Left out for width, and said in the notes instead: the summation limits
 * (i = 1…G, t = 1…|oᵢ|), the conditioning of π on the prompt and the earlier
 * tokens (| q, o_{i,<t}), and the subscript of E (which prompt and which
 * attempts the average runs over). Nothing else differs from Eq. 1.
 *
 * Size `xl`, not `2xl`: every form shares one frame as wide as the last form
 * (~23 em), so a larger size would shrink the whole derivation.
 *
 * Every part that survives a step is tagged, including the ones with no ink
 * (`lp`, `tok`, `sums`, `fix`): an untagged glyph is matched by shape and
 * nearness, and the two Σ's, or the i's and t's, would swap places mid-morph.
 */
const QUANTITIES = pick('pi', 'A', 'r', 'M', 'norm');

/** log π_θ(o_{i,t}) — the written token's log-probability */
const LOGP = '\\q{lp}{\\log \\q{pi}{\\pi_\\theta}}\\q{tok}{(o_{i,t})}';
const A = '\\q{A}{A_i}\\,';
const SUMS = '\\q{sums}{\\sum_{i}\\sum_{t}}\\,';
/** the two per-token corrections; `fix` wraps both so one brace can sit under them */
const FIX = '\\q{fix}{\\q{r}{r_{i,t}}\\,\\q{M}{M_{i,t}}}\\,';
const NORM = '\\q{norm}{\\frac{1}{\\sum_{i}|o_i|}}\\,';

export const objectiveScene = defineScene(
  {
    id: '08-objective',
    title: 'Eq. 1은 무엇을 더한 것일까?',
    steps: [step('weight', 2.6), step('sum', 2.6), step('correct', 2.8), step('mean', 2.8), step('loss', 3.0, { hold: 0.6 })],
  },
  () => (
    <Quantities map={QUANTITIES}>
      <Board
        title="Eq. 1은 무엇을 더한 것일까?"
        source="MiMo-V2.6 §4.1, Eq. 1"
        formula={
          <Formula
            size="xl"
            then={[
              { step: 'weight', tex: `${A}${LOGP}` },
              { step: 'sum', tex: `${SUMS}${A}${LOGP}` },
              { step: 'correct', tex: `${SUMS}${FIX}${A}${LOGP}` },
              { step: 'mean', tex: `${NORM}${SUMS}${FIX}${A}${LOGP}` },
              {
                step: 'loss',
                tex: `\\mathcal{L}(\\theta) = -\\,\\mathbb{E}\\!\\left[\\, ${NORM}${SUMS}${FIX}${A}${LOGP} \\,\\right]`,
              },
            ]}
            brace={[
              { key: 'A', step: 'weight', delay: 1.3, until: 'sum', label: '평균과의 차이', color: QUANTITIES.A },
              { key: 'fix', step: 'correct', delay: 1.3, until: 'mean', label: '토큰별 보정' },
              { key: 'norm', step: 'mean', delay: 1.3, until: 'loss', label: '과제별 평균', color: QUANTITIES.norm },
            ]}
          >
            {LOGP}
          </Formula>
        }
        caption={
          <Captions
            items={[
              { step: 'weight', text: <>토큰의 <Term of="pi">log 확률</Term>에 그 풀이의 <Term of="A">평균과의 차이</Term>를 곱합니다</> },
              { step: 'sum', text: <>풀이 {RL_SCALE.G}개의 모든 토큰에 대해 더합니다</> },
              { step: 'correct', text: <>토큰마다 보정 두 가지를 곱합니다. 바로 뒤에서 봅니다</> },
              { step: 'mean', text: <>그 과제의 <Term of="norm">토큰 수로 나눠서</Term> 평균을 냅니다</> },
              { step: 'loss', text: <>모든 과제에 걸쳐 평균 내고 부호를 뒤집으면 Eq. 1입니다</> },
            ]}
          />
        }
      />
    </Quantities>
  ),
);

export default objectiveScene;
