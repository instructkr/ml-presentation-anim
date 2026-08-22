import React from 'react';
import { Appear, defineScene, step } from '@/lib/timeline';
import { Callout, DiagramView, ExplainerCard, SlideFrame, Stack, WalkthroughStage } from '@/lib/kit';
import { cacheIds, kdaPrefixCacheDetail } from '../diagrams/kda-prefix-cache.diagram';

/**
 * §5.4.1, reconstructing Fig. 12. The beats follow the paper's own order:
 * one pool → why block-hash caching collapses on a hybrid model → decoupling
 * hash granularity from allocation granularity → the two-stage lookup that
 * lands mid-block → the three consistency rules that make it safe to share a
 * block that is simultaneously a cache entry and a live request's growth point.
 */
export const kdaPrefixCacheScene = defineScene(
  {
    id: '04-kda-prefix-cache',
    title: 'KDA Prefix Cache',
    steps: [
      step('pool', 2.4),
      step('coarse', 2.8),
      step('decouple', 3.0),
      step('chain', 2.6),
      step('lookup', 3.0),
      step('consist', 2.8, { hold: 0.6 }),
    ],
  },
  () => (
    <SlideFrame title="하이브리드 캐시 — 512 토큰 경계에서 다시 쓰기" footer="ML Weekly · Kimi K3 §5.4.1">
      <WalkthroughStage
        visual={
          <DiagramView
            diagram={kdaPrefixCacheDetail}
            stepEffects={{
              // 'pool' 그룹과 페이지들은 어떤 reveal에도 없음 — frame-0 앵커 (hard rule 6)
              pool: {
                reveal: cacheIds.poolNote,
                highlight: ['pg-kv-1', 'pg-kv-2', 'pg-kv-3', 'pg-kda-1', 'pg-kda-2'],
                camera: { focus: ['pool'], padding: 60 },
              },
              coarse: {
                reveal: cacheIds.strip,
                highlight: ['coarse', 'phys'],
                camera: { focus: ['phys', 'coarse'], padding: 60 },
              },
              decouple: {
                reveal: cacheIds.marks,
                highlight: [...cacheIds.cachedCells, 'lbl-ckpt'],
                camera: { focus: ['phys', 'lbl-ckpt'], padding: 40 },
              },
              chain: {
                highlight: cacheIds.cachedCells,
                dim: ['coarse'],
                camera: { focus: ['lbl-mla', 'hb-6'], padding: 40 },
              },
              lookup: {
                reveal: [...cacheIds.hit, ...cacheIds.stages],
                highlight: ['hit', 'stage-mla', 'stage-kda'],
                pulse: ['e-ck-4-hit'],
                camera: { focus: ['phys', 'hit'], padding: 40 },
              },
              consist: {
                reveal: cacheIds.result,
                highlight: ['pin', 'resume'],
                camera: { focus: ['stage-mla', 'stage-kda', 'pin', 'resume'], padding: 50 },
              },
            }}
          />
        }
        explanation={
          <Stack gap={3}>
            <Appear step="coarse" effect="rise">
              <Callout tone="warn" title="블록 해시가 하이브리드에서 무너지는 지점">
                KDA 스냅숏은 드문 경계에서만 감당 가능 → 공유 블록 크기가 1024–6144로 밀려 올라간다.
                한 블록보다 짧은 요청은 <b>영원히</b> 재사용 불가.
              </Callout>
            </Appear>
            <Appear step="decouple" effect="rise">
              <Callout tone="ok" title="두 입도를 분리한다">
                해시는 512 토큰 해시 블록, 할당은 그대로 물리 블록. KDA 체크포인트는 <b>해시 끝점의
                희소한 부분집합</b>에만.
              </Callout>
            </Appear>
            <Appear step="consist" effect="fade">
              <Stack gap={0}>
                <ExplainerCard index={1} eyebrow="shared free list" title="할당 전에 전 그룹에서 pin" />
                <ExplainerCard index={2} eyebrow="scheduling step" title="복사가 착지하기 전엔 매칭 제외" />
                <ExplainerCard index={3} eyebrow="KDA groups" title="체크포인트 축출은 원자적" tone="ok" />
              </Stack>
            </Appear>
          </Stack>
        }
      />
    </SlideFrame>
  ),
);

export default kdaPrefixCacheScene;
