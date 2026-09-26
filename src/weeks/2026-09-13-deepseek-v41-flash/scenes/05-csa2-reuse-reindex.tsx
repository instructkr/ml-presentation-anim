import React from 'react';
import { Appear, defineScene, step } from '@/lib/timeline';
import { Callout, DiagramView, Grid, SlideFrame, Spec, Stack, WalkthroughStage } from '@/lib/kit';
import { csa2ReuseDetail, csa2ReuseIds } from '../diagrams/csa2-reuse.diagram';

/**
 * Scene 04's pipeline laid across three decoder layers. Each beat fills one
 * row, so the audience sees exactly which stages a Reuse layer drops and
 * which half of the indexer a Reindex layer keeps.
 */
export const csa2ReuseReindexScene = defineScene(
  {
    id: '05-csa2-reuse-reindex',
    title: 'Reuse와 Reindex',
    steps: [
      step('full', 3.0),
      step('reuse', 3.0),
      step('reindex', 3.0),
      step('saved', 2.4, { hold: 0.6 }),
    ],
  },
  () => (
    <SlideFrame title="Reuse와 Reindex: 캐시 한 벌을 층마다 어떻게 나눠 쓰나" footer="ML Weekly · DeepSeek-V4.1-Flash §2.3.1">
      <WalkthroughStage
        placement="bottom"
        gap={4}
        visual={
          <DiagramView
            diagram={csa2ReuseDetail}
            stepEffects={{
              // 행 라벨과 각 층 입력 h는 어떤 reveal에도 없음 — frame-0 앵커
              full: {
                reveal: csa2ReuseIds.full,
                highlight: ['mk', 'cache', 'sc-0'],
                pulse: ['e-mk-cache', 'e-qi-0-sc-0', 'e-sc-0-tk-0', 'e-cache-at-0'],
              },
              reuse: {
                reveal: csa2ReuseIds.reuse,
                highlight: ['tk-1', 'at-1'],
                pulse: ['e-tk-0-tk-1', 'e-cache-at-1'],
              },
              reindex: {
                reveal: csa2ReuseIds.reindex,
                highlight: ['qi-2', 'sc-2', 'tk-2'],
                pulse: ['e-cache-sc-2', 'e-sc-2-tk-2', 'e-cache-at-2'],
              },
              saved: { reveal: csa2ReuseIds.saved, highlight: ['cache', 'sc-0', 'sc-2'] },
            }}
          />
        }
        explanation={
          <Stack gap={3}>
            {/* 층마다 실제로 도는 단계는 칩으로 */}
            <Stack direction="row" gap={2} align="center">
              <Appear step="full" effect="fade">
                <Spec label="21층 Full">저장 + 채점 + 어텐션</Spec>
              </Appear>
              <Appear step="reuse" effect="fade">
                <Spec label="22층 Reuse">어텐션만 · 나머지는 21층 것</Spec>
              </Appear>
              <Appear step="reindex" effect="fade">
                <Spec label="25층 Reindex">채점 + 어텐션 · 항목은 21층 것</Spec>
              </Appear>
              <Appear step="saved" effect="fade">
                <Spec label="디코더">Full 1 · Reindex 4 · Reuse 15</Spec>
              </Appear>
            </Stack>
            <Grid columns={3} gap={4}>
              <Appear step="full" effect="rise">
                <Callout title="Full: 만들고, 고르고, 읽는다">
                  앞 탭의 과정을 전부 직접 한다. 캐시 항목과 indexer 키를 만들어 저장하고, 자기 indexer 쿼리로
                  채점해 512개를 고른다. 비싼 일은 이 층에 다 몰려 있다.
                </Callout>
              </Appear>
              <Appear step="reuse" effect="rise">
                <Callout tone="ok" title="Reuse: 고른 것까지 물려받는다">
                  자기 쿼리만 만든다. 어느 항목을 읽을지는 21층이 고른 512개를 그대로 받고, 항목 값도 21층
                  캐시에서 꺼낸다. 저장도 채점도 없지만, 쿼리가 다르므로 어텐션 결과는 층마다 다르다.
                </Callout>
              </Appear>
              <Appear step="reindex" effect="rise">
                <Callout title="Reindex: 캐시는 빌리고 선택은 새로">
                  깊은 층은 다른 항목을 봐야 할 수도 있다. 그래서 21층 캐시의 indexer 키를 자기 indexer 쿼리로
                  다시 채점해 512개를 새로 고른다. 저장은 늘지 않고 선택만 바뀐다. 26~28층은 이 선택을
                  물려받는다.
                </Callout>
              </Appear>
            </Grid>
          </Stack>
        }
      />
    </SlideFrame>
  ),
);

export default csa2ReuseReindexScene;
