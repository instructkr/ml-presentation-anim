import React from 'react';
import { Appear, defineScene, step } from '@/lib/timeline';
import { Callout, DiagramView, Grid, SlideFrame, Spec, Stack, WalkthroughStage } from '@/lib/kit';
import { csa2ModesDetail, csa2Ids } from '../diagrams/csa2-modes.diagram';

/**
 * CSA2 cross-layer reuse (§2.3.1) as a summary table. It fills row by row:
 * Full makes every column, Reuse borrows every column, Reindex borrows the
 * storage but re-selects. The last beat counts what is actually stored.
 */
export const csa2ModesScene = defineScene(
  {
    id: '07-csa2-modes',
    title: 'CSA2 세 가지 모드',
    steps: [
      step('full', 2.8),
      step('reuse', 2.8),
      step('reindex', 2.8),
      step('count', 2.4, { hold: 0.6 }),
    ],
  },
  () => (
    <SlideFrame title="CSA2 정리: 층마다 무엇을 만들고 무엇을 빌리나" footer="ML Weekly · DeepSeek-V4.1-Flash §2.3.1">
      <WalkthroughStage
        placement="bottom"
        gap={4}
        visual={
          <DiagramView
            diagram={csa2ModesDetail}
            stepEffects={{
              // 헤더·행 라벨·자기 쿼리·SWA KV 열은 어떤 reveal에도 없음 — frame-0 앵커
              full: { reveal: csa2Ids.full, highlight: ['row-0', 'kv-0', 'idx-0', 'topk-0'] },
              reuse: {
                reveal: csa2Ids.reuse,
                highlight: ['row-1', 'row-2', 'row-3'],
                pulse: ['e-kv-0-kv-1', 'e-topk-0-topk-1'],
              },
              reindex: {
                reveal: csa2Ids.reindex,
                highlight: ['row-4', 'topk-4'],
                pulse: ['e-topk-4-topk-5'],
              },
              count: { reveal: csa2Ids.count, highlight: ['kv-0', 'stored'] },
            }}
          />
        }
        explanation={
          <Stack gap={3}>
            {/* 모델 전체의 층 배치는 칩으로 */}
            <Stack direction="row" gap={2} align="center">
              <Appear step="full" effect="fade">
                <Spec label="인코더 18층">6층 묶음 × 3 · 묶음마다 Full 1 + Reuse 5</Spec>
              </Appear>
              <Appear step="reindex" effect="fade">
                <Spec label="디코더 20층">4층 묶음 × 5 · Full 1, Reindex 4, Reuse 15</Spec>
              </Appear>
              <Appear step="count" effect="fade" delay={0.3}>
                <Spec label="전역 KV 저장" tone="ok">40층 중 4층</Spec>
              </Appear>
            </Stack>
            <Grid columns={3} gap={4}>
              <Appear step="full" effect="rise">
                <Callout title="Full: 이 층이 캐시를 만든다">
                  세 열이 모두 초록이다. 캐시 항목을 만들어 저장하고, 거기서 indexer 키를 뽑고, 채점해서
                  512개를 고른다. V4에서는 모든 층이 이렇게 했다.
                </Callout>
              </Appear>
              <Appear step="reuse" effect="rise">
                <Callout tone="ok" title="Reuse: 세 열을 모두 빌린다">
                  가장 가까운 Full 층의 캐시와 선택을 그대로 쓴다. 저장할 것도 채점할 것도 없다. 오른쪽 열의 자기
                  쿼리와 SWA KV만 직접 만든다.
                </Callout>
              </Appear>
              <Appear step="reindex" effect="rise">
                <Callout title="Reindex: 마지막 열만 새로">
                  캐시와 indexer 키는 빌리되, 고르는 일은 자기 쿼리로 다시 한다. 캐시는 그대로인데 깊은 층이
                  읽는 항목이 달라질 수 있다. 다음 Reuse 층은 이 새 선택을 물려받는다.
                </Callout>
              </Appear>
            </Grid>
          </Stack>
        }
      />
    </SlideFrame>
  ),
);

export default csa2ModesScene;
