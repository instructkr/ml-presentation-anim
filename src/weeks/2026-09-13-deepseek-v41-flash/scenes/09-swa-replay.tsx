import React from 'react';
import { Appear, defineScene, step } from '@/lib/timeline';
import { Callout, DiagramView, EqSteps, Grid, SlideFrame, Spec, Stack, WalkthroughStage } from '@/lib/kit';
import { swaReplayDetail, swaReplayIds } from '../diagrams/swa-replay.diagram';

/**
 * SWA Bounded Replay (§3.2.1–3.2.2). Systems section, so the spine is what
 * moves and what it costs: SWA KV occupies half the SSD cache but is dead
 * within minutes; dropping it is only affordable if a miss is cheap; exact
 * rebuild is a cone of L × 128 tokens; bounded replay flattens it to 128.
 */
export const swaReplayScene = defineScene(
  {
    id: '09-swa-replay',
    title: 'SWA Bounded Replay',
    steps: [
      step('v4', 2.4),
      step('exact', 2.8),
      step('bounded', 2.8),
      step('split', 2.6, { hold: 0.6 }),
    ],
  },
  () => (
    <SlideFrame title="SWA Bounded Replay: 금방 버릴 캐시는 저장하지 않고 다시 만든다" footer="ML Weekly · DeepSeek-V4.1-Flash §3.2">
      <WalkthroughStage
        placement="bottom"
        gap={4}
        visual={
          <DiagramView
            diagram={swaReplayDetail}
            stepEffects={{
              // V4 그룹과 두 블록은 어떤 reveal에도 없음 — frame-0 앵커
              v4: { highlight: ['v4-swa'] },
              exact: { reveal: swaReplayIds.exact, highlight: ['x-l1'] },
              bounded: {
                reveal: swaReplayIds.bounded,
                highlight: ['b-l1', 'b-l2', 'b-l3'],
                pulse: ['e-exact-bounded'],
              },
              split: {
                reveal: swaReplayIds.split,
                highlight: ['ssd-global', 'dram-swa'],
                pulse: ['e-v4-v41'],
              },
            }}
          />
        }
        explanation={
          <Stack gap={3}>
            <Stack direction="row" gap={4} align="center" justify="space-between">
              {/* 재생 비용과 영구 캐시 크기는 수식으로 */}
              <EqSteps
                size="sm"
                parts={[
                  { tex: '\\text{replay}\\ L \\times 128', step: 'exact' },
                  { tex: '\\quad\\to\\quad 128', step: 'bounded' },
                  { tex: '\\quad \\text{persistent}\\ \\tfrac{1}{2} \\times \\tfrac{1}{4} = \\tfrac{1}{8}', step: 'split' },
                ]}
              />
              <Stack direction="row" gap={2}>
                <Appear step="v4" effect="fade">
                  <Spec label="V4">SSD에 둘 다 · 72시간</Spec>
                </Appear>
                <Appear step="bounded" effect="fade">
                  <Spec label="재생">128 토큰만 · 창 자름</Spec>
                </Appear>
                <Appear step="split" effect="fade">
                  <Spec label="V4.1">SWA KV → DRAM 풀 (몇 분)</Spec>
                </Appear>
              </Stack>
            </Stack>
            <Grid columns={3} gap={4}>
              <Appear step="v4" effect="rise">
                <Callout title="저장할 가치가 없는 캐시">
                  V4는 SSD 영구 캐시에 전역 KV와 SWA KV를 나란히 넣었고, SWA KV가 절반을 차지했다. 그런데 SWA
                  KV는 대화가 이어지는 몇 분 동안만 쓰이고 다음 턴이 오면 쓸모가 없어진다. 며칠씩 보관하는 곳에 둘
                  이유가 없다.
                </Callout>
              </Appear>
              <Appear step="exact" effect="rise">
                <Callout tone="warn" title="그런데 버리면 되살리기가 비싸다">
                  3층의 창은 2층의 최근 128 토큰에서 나오고, 2층의 창은 다시 그 앞 128 토큰을 본다. 층을
                  내려갈수록 필요한 구간이 128씩 넓어진다. 정확히 되살리려면 층 수 × 128 토큰을 다시 돌려야
                  해서 V4에서는 포기했다.
                </Callout>
              </Appear>
              <Appear step="bounded" effect="rise">
                <Callout tone="ok" title="마지막 128 토큰만 돌리고 창을 자른다">
                  모든 층에서 마지막 128 토큰만 다시 계산하고, 그 구간 밖은 아예 보지 않게 창을 자른다. 결과는
                  근사지만 품질 차이는 거의 없었다. 덕분에 SWA KV를 SSD에서 빼고 몇 분짜리 DRAM 풀에만 둔다.
                </Callout>
              </Appear>
            </Grid>
          </Stack>
        }
      />
    </SlideFrame>
  ),
);

export default swaReplayScene;
