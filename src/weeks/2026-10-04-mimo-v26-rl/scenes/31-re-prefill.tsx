import React from 'react';
import { defineScene, step, useStepProgress } from '@/lib/timeline';
import { Board, Captions, Fill, Lanes, Quantities, Term, type LaneSegment, type LanesMarker } from '@/lib/kit';
import { useTheme } from '@/lib/theme';
import {
  FIRST_UPDATE,
  INTERVAL_OFTEN,
  INTERVAL_RARE,
  OFTEN,
  RARE,
  SECOND_UPDATE,
  type Stretch,
} from '../data/saturate-re-prefill';
import { pick } from '../quantities';

/**
 * §4.1, §6.4 — what a partial rollout costs. An attempt keeps the Attention
 * results of everything it has read and written in the KV cache; a model update
 * makes that cache worthless, so before the attempt goes on, the whole prefix is
 * read again with the new weights (re-prefill), and every later update re-reads
 * a longer prefix. The second lane is the same attempt when updates come half
 * as often: the paper's "a large batch amortizes the re-prefill".
 *
 * The axis counts tokens processed, not time. The attempt's length and the
 * update intervals are examples; every position comes from
 * `data/saturate-re-prefill.ts`.
 */
const QUANTITIES = pick('run', 'reread');

const man = (v: number) => `${v}만`;
/** axis ticks: the origin is a bare 0 */
const tick = (v: number) => (v === 0 ? '0' : man(v));
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
/** a marker shows once its lane's playhead has passed it */
const passed = (head: number, at: number) => clamp01((head - at) / 0.6);

const segment = (s: Stretch): LaneSegment =>
  s.kind === 'write'
    ? { from: s.from, to: s.to, color: QUANTITIES.run }
    : { from: s.from, to: s.to, color: QUANTITIES.reread, label: man(s.to - s.from) };

const Scene: React.FC = () => {
  const t = useTheme();
  const cacheP = useStepProgress('cache', { portion: [0.1, 0.75] });
  const updateP = useStepProgress('update', { portion: [0.1, 0.6] });
  const rereadP = useStepProgress('reread', { portion: [0.1, 0.9], easing: 'inOut' });
  /** the prefix has been read again by the middle of the `reread` sweep: its cache is whole again */
  const rebuiltP = useStepProgress('reread', { portion: [0.1, 0.5], easing: 'inOut' });
  const againP = useStepProgress('again', { portion: [0.08, 0.92], easing: 'inOut' });
  const batchP = useStepProgress('batch', { portion: [0.1, 0.9], easing: 'inOut' });

  const oftenHead =
    cacheP * FIRST_UPDATE + rereadP * (SECOND_UPDATE - FIRST_UPDATE) + againP * (OFTEN.total - SECOND_UPDATE);
  const rareHead = batchP * RARE.total;

  // the first stretch dims while its cache is stale, and comes back once it has been read again
  const stale = 0.6 * updateP * (1 - rebuiltP);
  const often = OFTEN.stretches.map((s, i) => (i === 0 ? { ...segment(s), opacity: 1 - stale } : segment(s)));

  const markers: LanesMarker[] = [
    ...OFTEN.updates.map(
      (at, k): LanesMarker => ({
        at,
        label: `갱신 ${k + 1}`,
        color: 'text',
        lanes: [0],
        opacity: k === 0 ? updateP : passed(oftenHead, at),
      }),
    ),
    ...RARE.updates.map((at): LanesMarker => ({ at, color: 'text', lanes: [1], opacity: passed(rareHead, at) })),
  ];

  return (
    <Quantities map={QUANTITIES}>
      <Board
        title="이어 쓰는 데 드는 값은?"
        source="MiMo-V2.6 §4.1, §6.4 · 길이와 갱신 간격은 예시"
        figure={
          <Fill>
            {({ width, height }) => (
              <Lanes
                width={width}
                height={height}
                lanes={[
                  { label: `${man(INTERVAL_OFTEN)}마다 갱신`, segments: often, until: oftenHead },
                  { label: `${man(INTERVAL_RARE)}마다 갱신`, segments: RARE.stretches.map(segment), until: rareHead },
                ]}
                markers={markers}
                xDomain={[0, OFTEN.total]}
                xTicks={[0, 10, 20, 30]}
                xFormat={tick}
                xLabel="처리한 토큰"
                textSize={t.fontSize.sm}
              />
            )}
          </Fill>
        }
        caption={
          <Captions
            items={[
              { step: 'cache', text: <>읽고 쓴 <Term of="run">토큰의 계산 결과</Term>는 KV cache에 남겨 둡니다</> },
              { step: 'update', text: <>모델이 바뀌면 옛 가중치로 만든 cache는 쓸 수 없습니다</> },
              { step: 'reread', text: <>그래서 앞부분을 새 모델로 처음부터 <Term of="reread">다시 읽습니다</Term></> },
              { step: 'again', text: <>갱신을 만날 때마다 <Term of="reread">더 긴 앞부분</Term>을 다시 읽습니다</> },
              { step: 'batch', text: <>배치가 크면 갱신이 드물어 <Term of="reread">다시 읽는 양</Term>이 줄어듭니다</> },
            ]}
          />
        }
      />
    </Quantities>
  );
};

export const rePrefillScene = defineScene(
  {
    id: '31-re-prefill',
    title: '이어 쓰는 데 드는 값은?',
    steps: [
      step('cache', 2.4),
      step('update', 2.2),
      step('reread', 2.8),
      step('again', 3.0),
      step('batch', 2.8, { hold: 0.6 }),
    ],
  },
  Scene,
);

export default rePrefillScene;
