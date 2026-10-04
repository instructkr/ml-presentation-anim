import React from 'react';
import { defineScene, step } from '@/lib/timeline';
import { Board, Captions, DiagramView, Quantities, Term } from '@/lib/kit';
import { SEQUENCES_PER_STEP, manCheon } from '../data/objective-rl-scale';
import { payloadDrop, porterIds, porterPlanes } from '../diagrams/porter-planes.diagram';
import { pick } from '../quantities';

/**
 * §6.2, Fig. 14 — the Payload Porter: where the 25K attempts of one step wait
 * until they are packed. The picture starts with the plain path, every attempt
 * handed to the driver, and shows what one attempt carries as four chips
 * sitting on that one node. On the split the chips glide down to a distributed
 * store, the driver keeps a summary, and the Packer fetches from the store only
 * the part each GPU group needs. Figure walkthrough, no equation; the detail
 * (accept-time hook, asynchronous grader, TP/CP packing, AsyncFlow's
 * TransferQueue) is in the notes.
 */
/** the two records the previous chapter added are gold, the logged probability is μ's grey */
const QUANTITIES = pick('record', 'mu');

/** the count in the title is the paper's 1,568 × 16 */
const TITLE = `풀이 ${manCheon(SEQUENCES_PER_STEP)} 개를 어디에 둘까?`;

export const payloadPorterScene = defineScene(
  {
    id: '39-payload-porter',
    title: TITLE,
    steps: [step('heavy', 2.6), step('driver', 2.4), step('split', 2.8), step('meta', 2.6), step('pack', 2.8, { hold: 0.6 })],
  },
  () => (
    <Quantities map={QUANTITIES}>
      <Board
        title={TITLE}
        source="MiMo-V2.6 §6.2, 그림 14 · AsyncFlow (TransferQueue)"
        figure={
          <DiagramView
            diagram={porterPlanes}
            stepEffects={{
              // Rollout → driver → Packer → Training is in no reveal → on screen from frame 0 (the anchor)
              heavy: { reveal: porterIds.payload, highlight: ['rollout'], pulse: ['e-rollout-driver'] },
              driver: { highlight: ['driver'], dim: porterIds.downstream },
              // the content leaves the driver's node: the chips glide down into the store
              split: { reveal: porterIds.split, move: payloadDrop, highlight: ['store'], pulse: ['e-rollout-store'] },
              meta: { reveal: porterIds.meta, highlight: ['driver', 'summary'], pulse: ['e-rollout-driver'] },
              // the last frame is the thumbnail: the whole figure, nothing dimmed
              pack: { reveal: porterIds.pack, highlight: ['packer'], pulse: ['e-store-packer'] },
            }}
          />
        }
        caption={
          <Captions
            items={[
              { step: 'heavy', text: <>풀이마다 <Term of="mu">확률</Term>과 <Term of="record">Expert 번호, 후보 집합</Term>이 딸려 옵니다</> },
              { step: 'driver', text: <>한 노드에 다 모으면 그 노드의 메모리가 한계가 됩니다</> },
              { step: 'split', text: <>그래서 무거운 내용은 분산 저장소에 한 번만 씁니다</> },
              { step: 'meta', text: <>driver는 점수와 길이, 꺼낼 열쇠만 보고 배치를 짭니다</> },
              { step: 'pack', text: <>묶을 때는 GPU마다 자기가 쓸 부분만 꺼내 갑니다</> },
            ]}
          />
        }
      />
    </Quantities>
  ),
);

export default payloadPorterScene;
