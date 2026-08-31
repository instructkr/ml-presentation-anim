import React from 'react';
import { Appear, defineScene, step } from '@/lib/timeline';
import { Callout, DiagramView, Grid, SlideFrame, WalkthroughStage } from '@/lib/kit';
import { cacheIds, kdaPrefixCacheDetail } from '../diagrams/kda-prefix-cache.diagram';

/**
 * §5.4.1, reconstructing Fig. 12 — and told as a modification of the previous
 * scene, which is where "block", "hash" and "block-aligned reuse" were defined.
 *
 * The order is the paper's own argument: one pool → KDA snapshots are rare, so
 * the block size everyone shares is dragged up to 1024–6144 → at that size the
 * cache stops working at all → so give hashing, allocation and checkpointing
 * three separate units → two-stage lookup that can land mid-block.
 */
export const kdaPrefixCacheScene = defineScene(
  {
    id: '10-kda-prefix-cache',
    title: 'KDA Prefix Cache',
    steps: [
      step('pool', 2.4),
      step('forced', 3.0),
      step('cost', 2.8),
      step('decouple', 3.0),
      step('ckpt', 2.8),
      step('lookup', 3.0),
      step('consist', 2.6, { hold: 0.6 }),
    ],
  },
  () => (
    <SlideFrame
      title="K3의 수정 — 블록 하나가 겸하던 세 가지를 떼어놓는다"
      footer="ML Weekly · Kimi K3 §5.4.1 (Fig. 12)"
    >
      <WalkthroughStage
        placement="bottom"
        gap={4}
        visual={
          <DiagramView
            diagram={kdaPrefixCacheDetail}
            stepEffects={{
              // 'pool' 그룹과 페이지들은 어떤 reveal에도 없음 — frame-0 앵커 (hard rule 6)
              pool: {
                reveal: cacheIds.poolNote,
                highlight: ['pg-kv-1', 'pg-kv-2', 'pg-kv-3', 'pg-kda-1', 'pg-kda-2'],
                camera: { focus: ['pool'], padding: 60, maxScale: 1.3 },
              },
              forced: {
                reveal: cacheIds.physBlock,
                highlight: ['phys'],
                camera: { focus: ['phys'], padding: 90, maxScale: 1 },
              },
              cost: {
                reveal: cacheIds.coarse,
                highlight: ['coarse'],
                camera: { focus: ['phys', 'coarse'], padding: 60, maxScale: 1 },
              },
              decouple: {
                reveal: cacheIds.hashCells,
                highlight: [...cacheIds.cachedCells, 'lbl-mla'],
                dim: ['coarse'],
                camera: { focus: ['phys', 'lbl-mla'], padding: 50, maxScale: 1 },
              },
              ckpt: {
                reveal: cacheIds.marks,
                highlight: ['lbl-ckpt', 'ck-1', 'ckpt-note'],
                camera: { focus: ['phys', 'lbl-ckpt', 'ckpt-note'], padding: 40, maxScale: 1 },
              },
              lookup: {
                reveal: [...cacheIds.hit, ...cacheIds.stages],
                highlight: ['hit', 'stage-mla', 'stage-kda'],
                pulse: ['e-ck-4-hit'],
                camera: { focus: ['hit', 'stage-mla', 'stage-kda'], padding: 40, maxScale: 1 },
              },
              consist: {
                reveal: cacheIds.result,
                highlight: ['pin', 'resume'],
                // 마지막 비트는 그림 전체 — 마지막 프레임이 곧 썸네일이다
                camera: { focus: ['pool', 'phys', 'pin', 'resume'], padding: 30 },
              },
            }}
          />
        }
        explanation={
          <Grid columns={3} gap={4}>
            <Appear step="forced" effect="rise">
              <Callout tone="warn" title="왜 하이브리드에서는 블록이 커지나">
                KDA 레이어는 토큰마다 KV를 남기지 않는다. 시퀀스당 고정 크기 상태가 <b>한 덩어리</b> 있을
                뿐이라, 경계 B에서 이어받으려면 그 시점의 상태를 통째로 떠 둬야 한다. 스냅숏이 크니
                자주 뜰 수 없고, 그래서 이어받을 수 있는 지점이 드문드문해진다. 여기에 더해 해시는
                저장 블록 하나에 묶여 있다. 그 드문 간격이 그대로 모든 레이어의 블록 크기가 된다.
              </Callout>
            </Appear>
            <Appear step="cost" effect="rise">
              <Callout tone="warn" title="6144짜리 블록의 대가">
                블록을 다 못 채우면 해시가 안 생기고, 해시가 없으면 인덱스에 등록되지 않는다. 즉 6144
                토큰에 못 미치는 요청은 몇 번을 다시 와도 재사용률이 <b>0</b>이다 — 같은 시스템
                프롬프트로 시작하는 짧은 대화가 실제 트래픽의 대부분인데도.
              </Callout>
            </Appear>
            <Appear step="decouple" effect="rise">
              <Callout tone="ok" title="세 가지를 각자의 단위로">
                지금까지 &lsquo;블록&rsquo; 하나가 할당 단위·해시 단위·재사용 경계를 겸했다. K3는 셋을
                나눈다. <b>할당</b>은 6144 그대로 두어 메모리 관리 이득을 지키고, <b>해시</b>는 그
                안에서 512마다 걸어 재사용 경계를 12배 촘촘하게 만들고, <b>KDA 체크포인트</b>는 그
                512 경계 중 일부에만 남긴다.
              </Callout>
            </Appear>
          </Grid>
        }
      />
    </SlideFrame>
  ),
);

export default kdaPrefixCacheScene;
