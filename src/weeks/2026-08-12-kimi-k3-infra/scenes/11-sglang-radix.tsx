import React from 'react';
import { Appear, defineScene, step } from '@/lib/timeline';
import { Callout, Code, DiagramView, SlideFrame, Stack, WalkthroughStage } from '@/lib/kit';
import { sglangRadixDetail } from '../diagrams/sglang-radix.diagram';

/** the request path through sglang/srt/mem_cache/radix_cache.py, in six lines */
const RADIX_API = `node, kv = match_prefix(key)
  # 트리 하강 + _split_node
inc_lock_ref(node)
  # evictable_size_ → protected_size_
   ... prefill / decode ...
insert(key, kv_indices)
  # cache_(un)finished_req
dec_lock_ref(node); evict(n)
  # leaf 힙, lock_ref == 0 만`;

/**
 * The contrast piece for §5.4.1: what prefix caching looks like when the model
 * has only a KV cache. SGLang keeps one radix tree over token ids, so sharing
 * is positional-free and node-granular; K3 cannot copy this wholesale because
 * a hit boundary must also have a KDA checkpoint behind it.
 */
export const sglangRadixScene = defineScene(
  {
    id: '11-sglang-radix',
    title: 'SGLang Radix Cache',
    steps: [
      step('tree', 2.4),
      step('match', 2.8),
      step('lock', 2.6),
      step('evict', 2.8),
      step('sched', 2.6),
      step('contrast', 3.0, { hold: 0.6 }),
    ],
  },
  () => (
    <SlideFrame title="비교군 — SGLang RadixAttention의 접두 캐시" footer="ML Weekly · sglang/srt/mem_cache/radix_cache.py">
      <WalkthroughStage
        visual={
          <DiagramView
            diagram={sglangRadixDetail}
            stepEffects={{
              // 'tree' 그룹 · root · n-sys 는 어떤 reveal에도 없음 — frame-0 앵커 (hard rule 6)
              tree: {
                reveal: ['n-a', 'n-b', 'e-n-sys-n-a', 'e-n-sys-n-b'],
                highlight: ['n-sys'],
                camera: { focus: ['tree'], padding: 60 },
              },
              match: {
                reveal: ['op-match', 'op-split', 'op-page', 'e-op-match-n-sys', 'e-op-split-n-b', 'e-op-page-n-a'],
                highlight: ['op-match', 'op-split'],
                camera: { focus: ['op-match', 'n-sys', 'op-split'], padding: 50 },
              },
              lock: {
                reveal: ['n-a1', 'n-a2', 'e-n-a-n-a1', 'e-n-a-n-a2', 'op-lock', 'e-op-lock-n-a1'],
                highlight: ['n-a1', 'op-lock'],
                camera: { focus: ['op-lock', 'n-a', 'n-a1', 'n-a2'], padding: 50 },
              },
              evict: {
                reveal: ['n-b1', 'e-n-b-n-b1', 'op-evict', 'op-insert', 'e-op-evict-n-b1', 'e-op-insert-n-a2', 'hicache', 'e-n-b1-hicache'],
                highlight: ['n-b1', 'op-evict', 'hicache'],
                pulse: ['e-n-b1-hicache'],
                camera: { focus: ['n-b1', 'op-evict', 'hicache'], padding: 50 },
              },
              sched: {
                reveal: ['sched', 'e-n-sys-sched'],
                highlight: ['sched', 'n-sys'],
                camera: { focus: ['n-sys', 'sched'], padding: 60 },
              },
              contrast: {
                highlight: ['n-sys'],
                camera: { focus: ['op-match', 'op-evict', 'sched', 'hicache'], padding: 30 },
              },
            }}
          />
        }
        explanation={
          <Stack gap={3}>
            <Appear step="match" effect="rise">
              <Code fontSize={20} title="요청 하나가 캐시를 지나가는 길" highlightLines={[1, 8]}>
                {RADIX_API}
              </Code>
            </Appear>
            <Appear step="evict" effect="rise">
              <Callout title="회수는 leaf부터 시작한다">
                축출 힙에 들어가는 것은 <b>lock_ref가 0인 leaf</b>뿐이다. 실행 중인 요청이 밟고 있는 경로는
                참조 카운트가 막아 준다. HiCache를 켜면 버리는 대신 host 계층으로 내려보낸다.
              </Callout>
            </Appear>
            <Appear step="contrast" effect="rise">
              <Callout tone="warn" title="K3가 이 설계를 그대로 못 쓰는 이유">
                트리가 아무 데서나 경계를 만들 수 있는 이유는 되살릴 것이 KV 하나뿐이고 그 KV가 토큰 단위로
                쪼개져 있기 때문이다. 하이브리드는 같은 경계에 <b>KDA 상태</b>까지 있어야 하는데, 이쪽은
                시퀀스당 고정 크기라 쪼갤 수가 없다. 그래서 드문 지점에만 떠 두게 된다.
              </Callout>
            </Appear>
          </Stack>
        }
      />
    </SlideFrame>
  ),
);

export default sglangRadixScene;
