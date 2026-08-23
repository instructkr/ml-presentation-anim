import React from 'react';
import { Appear, defineScene, step } from '@/lib/timeline';
import { Callout, DiagramView, Grid, SlideFrame, WalkthroughStage } from '@/lib/kit';
import { blockHashCacheDetail, blockHashIds } from '../diagrams/block-hash-cache.diagram';

/**
 * The prerequisite scene. K3 §5.4.1 is written as a modification of block-hash
 * prefix caching, so the modification is unreadable until the baseline is on
 * screen: what a block is, what exactly gets hashed, why the hash is chained,
 * and what the "only complete blocks are hashed" rule costs you.
 *
 * Everything here is standard vLLM/SGLang-era practice, not K3.
 */
export const blockHashCacheScene = defineScene(
  {
    id: '04-block-hash-cache',
    title: '블록 해시 캐시 기본기',
    steps: [
      step('block', 2.6),
      step('hash', 2.8),
      step('chain', 3.0),
      step('index', 2.4),
      step('lookup', 3.0),
      step('aligned', 2.8, { hold: 0.6 }),
    ],
  },
  () => (
    <SlideFrame
      title="먼저: 프리픽스 캐시는 원래 어떻게 동작하나"
      footer="ML Weekly · block-hash prefix caching (K3 이전의 표준)"
    >
      <WalkthroughStage
        placement="bottom"
        gap={4}
        visual={
          <DiagramView
            diagram={blockHashCacheDetail}
            stepEffects={{
              // 요청 A의 블록 다섯 개는 어떤 reveal에도 없음 — frame-0 앵커 (hard rule 6)
              block: {
                highlight: ['blk-0', 'blk-1', 'blk-2', 'blk-3'],
                camera: { focus: ['reqa'], padding: 70 },
              },
              hash: {
                reveal: blockHashIds.hashes,
                highlight: ['h-0', 'h-1'],
                camera: { focus: ['blk-0', 'blk-1', 'h-0', 'h-1'], padding: 60 },
              },
              chain: {
                reveal: blockHashIds.chain,
                highlight: ['h-2', 'h-3'],
                pulse: ['e-h-0-h-1', 'e-h-1-h-2', 'e-h-2-h-3'],
                camera: { focus: ['h-0', 'h-3'], padding: 70 },
              },
              index: {
                reveal: blockHashIds.index,
                highlight: ['index'],
                camera: { focus: ['h-3', 'index'], padding: 60 },
              },
              lookup: {
                reveal: blockHashIds.lookup,
                highlight: ['lookup', 'hit'],
                pulse: ['e-lookup-hit'],
                camera: { focus: ['reqb', 'lookup', 'hit'], padding: 50 },
              },
              aligned: {
                reveal: blockHashIds.aligned,
                highlight: ['rule', 'tail'],
                // 마지막 비트는 그림 전체로 물러난다 — 규칙이 어디서 나온 규칙인지 같이 보여야 한다
                camera: { focus: ['reqa', 'index', 'rule', 'tail'], padding: 40 },
              },
            }}
          />
        }
        explanation={
          <Grid columns={3} gap={4}>
            <Appear step="block" effect="rise">
              <Callout title="블록이란 무엇인가">
                KV 캐시를 토큰 하나씩 관리하면 메타데이터가 감당이 안 된다. 그래서 정해진 개수의 토큰
                몫(그림에서는 512개)을 한 덩어리로 잡고, 할당·해제·참조 카운트를 모두 그 단위로
                돌린다. 이 덩어리가 <b>블록</b>이다.
              </Callout>
            </Appear>
            <Appear step="chain" effect="rise">
              <Callout tone="ok" title="해시는 무엇을 해싱하나">
                블록이 가득 차면 그 안의 토큰 id들과 <b>바로 앞 블록의 해시</b>를 함께 넣어 값 하나를
                만든다. 그 해시가 또 그 앞을 담고 있으므로, 해시 하나가 맞으면 그 지점까지의 토큰 열
                전체가 같다는 뜻이 된다.
              </Callout>
            </Appear>
            <Appear step="aligned" effect="rise">
              <Callout tone="warn" title="그래서 따라오는 제약">
                해시는 가득 찬 블록에만 생긴다. 그래서 재사용은 늘 블록 크기의 배수에서 끊긴다. 512면
                버리는 꼬리가 짧아 아무도 신경 쓰지 않는다. 다음 편은 이 블록이 <b>6144</b>가 될 때의
                이야기다.
              </Callout>
            </Appear>
          </Grid>
        }
      />
    </SlideFrame>
  ),
);

export default blockHashCacheScene;
