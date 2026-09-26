import React from 'react';
import { Appear, defineScene, step } from '@/lib/timeline';
import { Callout, DiagramView, Grid, SlideFrame, Spec, Stack, WalkthroughStage } from '@/lib/kit';
import { whyMemoryDetail, whyMemoryIds } from '../diagrams/why-memory.diagram';

/**
 * 문제 → 도구. The backbone spends six layers rebuilding a fixed entity
 * (Table 3); a lookup keyed by the last few tokens returns it at once. Last
 * beat names the new axis: conditional memory beside MoE's conditional
 * computation.
 */
export const whyMemoryScene = defineScene(
  {
    id: '01-why-memory',
    title: '왜 메모리인가',
    steps: [
      step('layers', 3.0),
      step('lookup', 2.6),
      step('same', 2.0),
      step('axes', 2.4, { hold: 0.6 }),
    ],
  },
  () => (
    <SlideFrame title="고정된 지식을 계산으로 다시 만드는 낭비" footer="ML Weekly · Engram §1, §6.1 (Table 3, Ghandeharioun et al. 2024)">
      <WalkthroughStage
        placement="bottom"
        gap={4}
        visual={
          <DiagramView
            diagram={whyMemoryDetail}
            stepEffects={{
              // 문장 다섯 토큰은 어떤 reveal에도 없다 — frame-0 앵커
              layers: { reveal: whyMemoryIds.layers, highlight: ['tok-4'] },
              lookup: { reveal: whyMemoryIds.lookup, highlight: ['last3', 'table'], pulse: ['e-last3-hash'] },
              same: { reveal: whyMemoryIds.same, highlight: ['l6', 'vec'] },
              axes: { highlight: ['table'] },
            }}
          />
        }
        explanation={
          <Stack gap={3}>
            <Appear step="axes" effect="fade">
              <Stack direction="row" gap={3}>
                <Spec label="같은 조건">Engram-27B vs MoE-27B · 총 파라미터와 토큰당 연산 동일</Spec>
                <Spec label="차이" tone="ok">MMLU +3.4 · BBH +5.0 · HumanEval +3.0</Spec>
              </Stack>
            </Appear>
            <Grid columns={3} gap={4}>
              <Appear step="layers" effect="rise">
                <Callout title="고정된 이름을 층마다 다시 만든다">
                  마지막 토큰 Wales의 은닉 상태를 층마다 글로 풀어 보면, 1–2층에서는 영국의 한 나라이고 6층에
                  가서야 다이애나 왕세자비가 된다. 답이 늘 같은 이름인데도 모델은 매번 층 여섯 개를 들여 다시
                  조립한다.
                </Callout>
              </Appear>
              <Appear step="lookup" effect="rise">
                <Callout title="고정된 것은 찾아 쓴다">
                  Engram은 현재 토큰에서 끝나는 N개 토큰을 열쇠로 삼아 큰 테이블에서 벡터 한 줄을 꺼낸다. 열쇠는
                  토큰만 보고 정해지므로 계산은 조회 한 번으로 끝난다. 아낀 앞쪽 층은 추론에 쓸 수 있다.
                </Callout>
              </Appear>
              <Appear step="axes" effect="rise">
                <Callout tone="ok" title="MoE 옆의 두 번째 희소성">
                  MoE는 토큰마다 FFN 몇 개만 골라 돌리는 조건부 계산이다. Engram은 토큰마다 테이블 행 몇 개만
                  골라 읽는 조건부 메모리다. 둘 다 전체 파라미터는 크고 토큰 하나가 쓰는 양은 작다.
                </Callout>
              </Appear>
            </Grid>
          </Stack>
        }
      />
    </SlideFrame>
  ),
);

export default whyMemoryScene;
