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
    id: '05-sglang-radix',
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
              <Callout title="회수는 leaf부터, 참조 카운트가 방패">
                축출 힙에는 <b>lock_ref == 0인 leaf</b>만 들어간다. 하나를 비우면 빈 부모가 다시 힙에
                올라간다. HiCache는 버리는 대신 host 계층으로 내린다.
              </Callout>
            </Appear>
            <Appear step="contrast" effect="rise">
              <Callout tone="warn" title="K3가 이 설계를 그대로 못 쓰는 이유">
                트리는 KV 하나만 복원하면 되지만, 하이브리드는 그 경계에 <b>KDA 상태</b>도 있어야 한다.
                고정 크기라 페이징이 안 돼 체크포인트가 희소해진다.
              </Callout>
            </Appear>
          </Stack>
        }
      />
    </SlideFrame>
  ),
);

export default sglangRadixScene;
