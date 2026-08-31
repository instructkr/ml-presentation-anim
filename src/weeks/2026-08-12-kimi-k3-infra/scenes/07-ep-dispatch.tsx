import React from 'react';
import { Appear, defineScene, lerp, step, useStepProgress } from '@/lib/timeline';
import {
  BarChart,
  Callout,
  DiagramView,
  Fill,
  Label,
  SlideFrame,
  Stack,
  WalkthroughStage,
} from '@/lib/kit';
import { epDispatchDetail, epDispatchMoves } from '../diagrams/ep-dispatch.diagram';

/**
 * MoonEP(08) 바로 앞에 서는 편. 여기서 답하는 질문은 하나다.
 * "토큰은 자기 랭크 안에 있는데, 전문가를 복사한다고 어떻게 균형이 맞나."
 *
 * 이 질문이 생기는 이유는 EP에서 토큰이 어디서 계산되는지가 늘 생략되기 때문이다.
 * 토큰은 자기 랭크에서 계산되지 않는다. all-to-all로 자기가 고른 전문가의 가중치가
 * 있는 랭크까지 건너가서 거기서 계산되고 돌아온다. 그러니 부하가 쏠리는 주체는
 * 랭크가 아니라 전문가이고, 한 전문가로 몰린 줄은 그 가중치가 한 랭크에만 있는 동안
 * 절대 갈라지지 않는다. 복사가 늘리는 것은 계산량이 아니라 그 줄이 갈 수 있는
 * 목적지의 개수다. 이 한 문장이 서면 08의 빈 자리와 정리 1이 전부 따라온다.
 *
 * 화면에서 세어 확인할 수 있는 숫자로 잡았다. 토큰 150개, 랭크 3대.
 */
const RANKS = ['랭크 0', '랭크 1', '랭크 2'];
/** 복사 전 — 랭크가 계산할 토큰 수는 자기가 들고 있는 전문가로 몰린 양이다 */
const BEFORE = [30, 90, 30];
/** 복사 후 — E7의 90개를 50·20·20으로 가른 결과 */
const AFTER = [50, 50, 50];

export const epDispatchScene = defineScene(
  {
    id: '07-ep-dispatch',
    title: '전문가를 복사하면 왜 균형이 맞나',
    steps: [
      step('dispatch', 2.8),
      step('owner', 2.6),
      step('hot', 2.4),
      step('replicate', 3.0),
      step('split', 3.0, { hold: 0.6 }),
    ],
  },
  () => {
    // 줄이 갈라지는 순간 부하가 평평해진다. 라우터 출력은 그대로다
    const settle = useStepProgress('split');
    const loads = BEFORE.map((v, i) => ({
      label: RANKS[i]!,
      value: lerp(v, AFTER[i]!, settle),
    }));
    return (
      <SlideFrame
        title="토큰은 자기 랭크가 아니라 전문가가 있는 랭크에서 계산된다"
        footer="ML Weekly · Kimi K3 §5.2.1 들어가기 전에"
      >
        <WalkthroughStage
          visual={
            <Stack gap={2} style={{ height: '100%' }}>
              <div style={{ flex: 1, minHeight: 0 }}>
                <DiagramView
                  diagram={epDispatchDetail}
                  stepEffects={{
                    // b0·b1·b2와 랭크 세 대의 전문가 자리는 어떤 reveal에도 없다
                    // → frame 0부터 보이는 앵커 (hard rule 6)
                    dispatch: {
                      reveal: [
                        'alltoall',
                        'e-b0-alltoall',
                        'e-b1-alltoall',
                        'e-b2-alltoall',
                        'p1',
                        'p7',
                        'p3',
                        'e-alltoall-p1',
                        'e-alltoall-p7',
                        'e-alltoall-p3',
                      ],
                      highlight: ['alltoall'],
                      camera: { focus: ['b0', 'b2', 'alltoall', 'p1', 'p3'], padding: 60 },
                    },
                    owner: {
                      reveal: ['e-p1-e1', 'e-p7-e7', 'e-p3-e3', 'rule'],
                      highlight: ['e1', 'e7', 'e3', 'rule'],
                      camera: { focus: ['p1', 'p3', 'rank0', 'rank2'], padding: 50 },
                    },
                    hot: {
                      highlight: ['p7', 'e7'],
                      pulse: ['e-p7-e7'],
                      dim: ['p1', 'p3', 'e1', 'e3', 'e-p1-e1', 'e-p3-e3'],
                      camera: { focus: ['p7', 'rank1'], padding: 70, maxScale: 1.2 },
                    },
                    replicate: {
                      reveal: ['e7a', 'e7b'],
                      move: { e7a: epDispatchMoves.toRank0, e7b: epDispatchMoves.toRank2 },
                      highlight: ['e7a', 'e7b', 's0', 's2'],
                      camera: { focus: ['rank0', 'rank1', 'rank2'], padding: 50 },
                    },
                    split: {
                      reveal: ['e-p7-e7a', 'e-p7-e7b'],
                      pulse: ['e-p7-e7', 'e-p7-e7a', 'e-p7-e7b'],
                      highlight: ['p7', 'e7', 'e7a', 'e7b'],
                      // 마지막 비트는 그림 전체로 물러난다 (썸네일 프레임)
                      camera: { focus: [] },
                    },
                  }}
                />
              </div>
              <Stack gap={1} style={{ height: 200, flexShrink: 0 }}>
                <Label size="sm" color="textSecondary" weight={600}>
                  랭크가 실제로 계산하는 토큰 수 · 토큰 150개 · 라우터 출력은 손대지 않았다
                </Label>
                <div style={{ flex: 1, minHeight: 0 }}>
                  <Fill>
                    {({ width, height }) => (
                      <BarChart
                        width={width}
                        height={height}
                        data={loads}
                        maxValue={100}
                        valueFormat={(v) => v.toFixed(0)}
                      />
                    )}
                  </Fill>
                </div>
              </Stack>
            </Stack>
          }
          explanation={
            <Stack gap={3}>
              <Appear step="owner" effect="rise">
                <Callout tone="warn" title="토큰은 자기 랭크에서 계산되지 않는다">
                  랭크마다 배치의 일부를 들고 있는 것은 맞지만, 계산은 그 자리에서 하지 않는다. 고른
                  전문가의 가중치가 어느 랭크에 있느냐가 그 토큰이 건너갈 곳을 정하고, 그 왕복이
                  all-to-all이다. 그래서 부하가 쏠리는 주체는 랭크가 아니라 전문가다.
                </Callout>
              </Appear>
              <Appear step="replicate" effect="rise">
                <Callout tone="ok" title="복사가 늘리는 것은 목적지의 개수다">
                  E7 하나에 90개가 몰렸는데, 그 가중치가 랭크 1에만 있는 동안에는 이 줄을 나눌 방법이
                  없다. 한가한 랭크의 빈 자리에 E7을 복사해 두면 목적지가 셋으로 늘어나고, 그제서야
                  나눠 보낼 수 있다.
                </Callout>
              </Appear>
              <Appear step="split" effect="fade">
                <Callout title="라우터는 한 글자도 바뀌지 않았다">
                  토큰이 어느 전문가를 통과하는지는 그대로다. 바뀐 것은 그 가중치가 놓인 위치뿐이다.
                  90개를 50·20·20으로 가르면 세 랭크가 모두 50개를 계산한다.
                </Callout>
              </Appear>
            </Stack>
          }
        />
      </SlideFrame>
    );
  },
);

export default epDispatchScene;
