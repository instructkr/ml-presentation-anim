import React from 'react';
import { defineScene, step } from '@/lib/timeline';
import { Board, Captions, DiagramView, Quantities, Term } from '@/lib/kit';
import { engines, enginesIds } from '../diagrams/consistency-engines.diagram';
import { pick } from '../quantities';

/**
 * §6.4 (and the "train–inference consistency" sentence of §4.1) — the ratio r
 * of Eq. 1 divides a probability computed by the Training engine by one logged
 * by the Rollout engine. The two are different programs, so even on identical
 * weights they can disagree, and then r measures the programs instead of the
 * model. The figure runs one token through both engines and adds, one per
 * beat, the three places where Training is made to see what Rollout saw: the
 * Expert weights (QDQ), the Experts the Router picked (R3) and the candidates
 * the probability is taken over (the top-p set). Scenes 33 and 34 open the
 * last two.
 */
const QUANTITIES = pick('mu', 'pi', 'record');

export const twoEnginesScene = defineScene(
  {
    id: '32-two-engines',
    title: '같은 모델인데 확률이 다르다면?',
    steps: [step('two', 2.8), step('differ', 2.4), step('weights', 2.6), step('route', 2.6), step('nucleus', 2.6, { hold: 0.6 })],
  },
  () => (
    <Quantities map={QUANTITIES}>
      <Board
        title="같은 모델인데 확률이 다르다면?"
        source="MiMo-V2.6 §4.1, §6.4"
        figure={
          <DiagramView
            diagram={engines}
            stepEffects={{
              // '토큰', its two edges and the two engine boxes are in no reveal → on screen from frame 0 (the anchor)
              two: { reveal: enginesIds.rows },
              differ: { highlight: enginesIds.probs, dim: 'others' },
              weights: { reveal: enginesIds.weights.reveal, highlight: enginesIds.weights.look },
              route: { reveal: enginesIds.route.reveal, highlight: enginesIds.route.look },
              nucleus: { reveal: enginesIds.nucleus.reveal, highlight: enginesIds.nucleus.look },
            }}
          />
        }
        caption={
          <Captions
            items={[
              { step: 'two', text: <>풀이는 SGLang이 쓰고, 학습은 Megatron-LM이 합니다</> },
              { step: 'differ', text: <>같은 가중치여도 두 엔진이 낸 확률은 어긋날 수 있습니다</> },
              { step: 'weights', text: <>Training도 Rollout이 쓰는 4비트 가중치를 그대로 봅니다</> },
              { step: 'route', text: <>Rollout이 고른 <Term of="record">Expert 번호</Term>를 Training이 그대로 씁니다</> },
              { step: 'nucleus', text: <>Rollout이 추린 <Term of="record">후보 집합</Term>도 Training이 그대로 씁니다</> },
            ]}
          />
        }
      />
    </Quantities>
  ),
);

export default twoEnginesScene;
