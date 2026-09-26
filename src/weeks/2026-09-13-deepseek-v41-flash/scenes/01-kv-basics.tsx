import React from 'react';
import { Appear, defineScene, step } from '@/lib/timeline';
import { Callout, DiagramView, Grid, SlideFrame, Spec, Stack, WalkthroughStage } from '@/lib/kit';
import { kvBasicsDetail, kvBasicsIds } from '../diagrams/kv-basics.diagram';

/**
 * The primer. Every V4.1 trick is stated in the paper as "this shrinks global
 * KV" or "this takes SWA KV out of the persistent cache", so the two branches
 * and the two storage tiers have to be defined before any of it is readable.
 * Callouts say what each thing is for; the numbers arrive as Spec chips.
 */
export const kvBasicsScene = defineScene(
  {
    id: '01-kv-basics',
    title: 'KV 캐시 두 종류',
    steps: [
      step('global', 2.8),
      step('local', 2.4),
      step('runtime', 2.4),
      step('persist', 2.6),
      step('levers', 2.4, { hold: 0.6 }),
    ],
  },
  () => (
    <SlideFrame title="먼저: KV 캐시는 두 종류이고, 두는 곳도 두 군데다" footer="ML Weekly · DeepSeek-V4.1-Flash §1">
      <WalkthroughStage
        placement="bottom"
        gap={4}
        visual={
          <DiagramView
            diagram={kvBasicsDetail}
            stepEffects={{
              // 'q'와 'attn'은 어떤 reveal에도 없음 — frame-0 앵커
              global: {
                reveal: kvBasicsIds.global,
                highlight: ['global', 'topk'],
                pulse: ['e-topk-attn'],
              },
              local: { reveal: kvBasicsIds.local, highlight: ['swa'], pulse: ['e-swa-attn'] },
              runtime: { reveal: kvBasicsIds.runtime, highlight: ['hbm', 'global'] },
              persist: { reveal: kvBasicsIds.persist, highlight: ['ssd'], pulse: ['e-hbm-ssd'] },
              levers: { reveal: kvBasicsIds.levers, highlight: ['lever-global', 'lever-swa'] },
            }}
          />
        }
        explanation={
          <Stack gap={3}>
            {/* 구현 숫자는 칩으로, 비트에 맞춰 등장 */}
            <Stack direction="row" gap={2} align="center">
              <Appear step="global" effect="fade">
                <Spec label="전역 KV">토큰 m개 → 항목 1개 · 인코더 m = 2, 디코더 m = 1</Spec>
              </Appear>
              <Appear step="global" effect="fade" delay={0.5}>
                <Spec label="Indexer">항목마다 점수 → 상위 512개</Spec>
              </Appear>
              <Appear step="local" effect="fade">
                <Spec label="SWA KV">창 128 토큰 · 층마다 고정</Spec>
              </Appear>
              <Appear step="persist" effect="fade">
                <Spec label="영구 캐시">SSD · 72시간 이상 보관</Spec>
              </Appear>
            </Stack>
            <Grid columns={3} gap={4}>
              <Appear step="global" effect="rise">
                <Callout title="전역 KV: 지금까지 읽은 문맥 전체">
                  프롬프트의 모든 토큰이 남긴 기억이라 문맥이 길수록 커진다. 오늘 다루는 설계 대부분이 이
                  캐시를 줄이는 방법이다. 어텐션이 전부 읽지는 않고, 작은 채점기 <b>indexer</b>가 볼 만한
                  항목 512개를 먼저 고른다.
                </Callout>
              </Appear>
              <Appear step="local" effect="rise">
                <Callout title="SWA KV: 최근 128 토큰만">
                  같은 층에 최근 128 토큰만 보는 짧은 어텐션이 하나 더 있고, 그 어텐션이 쓰는 캐시가 따로
                  있다. 창 크기만큼만 있으면 되므로 문맥이 백만 토큰이 되어도 크기는 그대로다.
                </Callout>
              </Appear>
              <Appear step="persist" effect="rise">
                <Callout tone="warn" title="캐시를 두는 곳도 두 군데다">
                  요청을 처리하는 동안은 둘 다 GPU 메모리에 있다. 그런데 에이전트는 같은 대화 앞부분을 매번
                  다시 보낸다. 그래서 끝난 요청의 KV를 SSD에 며칠 남겨 두고 다음 요청이 이어 쓴다. 이것이{' '}
                  <b>영구 KV 캐시</b>다.
                </Callout>
              </Appear>
            </Grid>
          </Stack>
        }
      />
    </SlideFrame>
  ),
);

export default kvBasicsScene;
