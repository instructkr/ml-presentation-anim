import React from 'react';
import { Appear, defineScene, step } from '@/lib/timeline';
import { Callout, DiagramView, EqSteps, Grid, SlideFrame, Spec, Stack, WalkthroughStage } from '@/lib/kit';
import { csa2PoolDetail, csa2PoolIds } from '../diagrams/csa2-pool.diagram';

/**
 * Hierarchical Sparse Indexer (§2.3.2): what a decoder Reindex layer actually
 * scores. Eight blocks you can count stand in for 2,048; the block score is a
 * max; the pool is fixed-size, so later indexers stop scaling with context.
 */
export const csa2CandidatePoolScene = defineScene(
  {
    id: '06-csa2-candidate-pool',
    title: '디코더의 후보 풀',
    steps: [
      step('scan', 2.4),
      step('blocks', 2.8),
      step('pool', 2.6),
      step('reindex', 2.8),
      step('cost', 2.4, { hold: 0.6 }),
    ],
  },
  () => (
    <SlideFrame title="후보 풀: 뒤쪽 층은 앞 층이 추린 자리에서만 고른다" footer="ML Weekly · DeepSeek-V4.1-Flash §2.3.2">
      <WalkthroughStage
        placement="bottom"
        gap={4}
        visual={
          <DiagramView
            diagram={csa2PoolDetail}
            stepEffects={{
              // Full 그룹과 블록 여덟 개는 어떤 reveal에도 없음 — frame-0 앵커
              scan: { highlight: ['full'] },
              blocks: { reveal: csa2PoolIds.blocks, highlight: ['m-1', 'm-4', 'm-6'] },
              pool: { reveal: csa2PoolIds.pool, highlight: ['p-0', 'p-1', 'p-2', ...csa2PoolIds.picked] },
              reindex: { reveal: csa2PoolIds.reindex, highlight: ['r25', 'r29'], pulse: ['e-pool-r25', 'e-pool-r29'] },
              cost: { reveal: csa2PoolIds.cost, highlight: ['cost', 'pool'] },
            }}
          />
        }
        explanation={
          <Stack gap={3}>
            <Stack direction="row" gap={4} align="center" justify="space-between">
              {/* 쿼리 하나가 채점하는 위치 수: 문맥 길이 N에서 상수로 */}
              <EqSteps
                size="sm"
                parts={[
                  { tex: '\\text{scored per query} = N', step: 'scan' },
                  { tex: '\\quad\\to\\quad 2048 \\times 8 = 16{,}384', step: 'cost' },
                ]}
              />
              <Stack direction="row" gap={2}>
                <Appear step="blocks" effect="fade">
                  <Spec label="블록 점수">블록 안 최고점</Spec>
                </Appear>
                <Appear step="pool" effect="fade">
                  <Spec label="실제 설정">2,048 블록 × 8칸 = 16,384 후보</Spec>
                </Appear>
                <Appear step="reindex" effect="fade">
                  <Spec label="적용">디코더만 · 사후 학습</Spec>
                </Appear>
              </Stack>
            </Stack>
            <Grid columns={3} gap={4}>
              <Appear step="blocks" effect="rise">
                <Callout title="첫 Full 층의 점수를 한 번 더 쓴다">
                  Reindex도 매번 문맥 전체를 채점하면 문맥이 길수록 비싸진다. 그런데 디코더의 첫 Full 층은 이미
                  모든 위치를 채점했다. 그 점수를 8칸씩 묶고, 묶음 안의 최고점을 블록의 점수로 삼는다.
                </Callout>
              </Appear>
              <Appear step="pool" effect="rise">
                <Callout title="높은 블록만 남겨 후보 풀을 만든다">
                  점수 높은 블록을 고르고 그 안의 위치를 전부 후보 풀에 넣는다. 최종으로 읽을 512개보다 훨씬
                  넉넉하게 남기므로 뒤쪽 층이 고를 여지는 남아 있다. 새로 저장하는 것은 없다.
                </Callout>
              </Appear>
              <Appear step="reindex" effect="rise">
                <Callout tone="ok" title="뒤쪽 층은 풀 안에서만 고른다">
                  25층, 29층 같은 Reindex 층은 풀에 든 위치만 채점해 각자 512개를 고른다. 풀 크기가 고정이라
                  문맥이 백만 토큰이 되어도 이 층들의 채점 비용은 늘지 않는다. 학습 때도 같은 제한을 걸었다.
                </Callout>
              </Appear>
            </Grid>
          </Stack>
        }
      />
    </SlideFrame>
  ),
);

export default csa2CandidatePoolScene;
