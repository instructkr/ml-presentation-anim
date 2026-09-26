import React from 'react';
import { Appear, defineScene, step } from '@/lib/timeline';
import { Callout, DiagramView, EqSteps, Grid, SlideFrame, Spec, Stack, WalkthroughStage } from '@/lib/kit';
import { fp4KvDetail, fp4Ids } from '../diagrams/fp4-kv.diagram';

/**
 * FP4 main KV (§2.4.4). The diagram shows the structure (entry → groups →
 * scale + values); the arithmetic is an EqSteps row that lights up 288 and
 * then 890. The last beat is where CSA2 (only four layers store global KV)
 * and FP4 meet, so this scene also answers the root diagram's "890 B" node.
 */
export const fp4KvScene = defineScene(
  {
    id: '08-fp4-kv',
    title: 'FP4 Main KV와 890 bytes',
    steps: [
      step('groups', 2.4),
      step('code', 2.8),
      step('bytes', 2.4),
      step('total', 3.0, { hold: 0.6 }),
    ],
  },
  () => (
    <SlideFrame title="FP4 Main KV: 값 하나를 4비트에 담는다" footer="ML Weekly · DeepSeek-V4.1-Flash §2.4.4">
      <WalkthroughStage
        placement="bottom"
        gap={4}
        visual={
          <DiagramView
            diagram={fp4KvDetail}
            stepEffects={{
              // entry와 fp8 주석은 어떤 reveal에도 없음 — frame-0 앵커
              groups: { reveal: fp4Ids.groups, highlight: ['g-0'] },
              code: { reveal: fp4Ids.code, highlight: ['scale', 'values'] },
              bytes: { reveal: fp4Ids.bytes, highlight: ['bytes'], dim: ['fp8'] },
              total: { reveal: fp4Ids.total, highlight: ['total'] },
            }}
          />
        }
        explanation={
          <Stack gap={3}>
            <Stack gap={2}>
              {/* 산수는 수식으로 점등, 형식은 칩으로 */}
              <EqSteps
                size="sm"
                parts={[
                  { tex: '512 \\times \\tfrac{4}{8} + 32 \\times 1 = 288\\ \\mathrm{B}', step: 'bytes' },
                  { tex: '\\qquad 3 \\times \\tfrac{288 + 68}{2} + 1 \\times (288 + 68)', step: 'total' },
                  { tex: '= 890\\ \\mathrm{B}', step: 'total' },
                ]}
              />
              <Stack direction="row" gap={2}>
                <Appear step="code" effect="fade">
                  <Spec label="E2M1 눈금">±{'{0, 0.5, 1, 1.5, 2, 3, 4, 6}'} · 배율 E4M3</Spec>
                </Appear>
                <Appear step="total" effect="fade">
                  <Spec label="항목마다">indexer 키 68 B 추가 · SWA KV는 FP8 유지</Spec>
                </Appear>
              </Stack>
            </Stack>
            <Grid columns={3} gap={4}>
              <Appear step="code" effect="rise">
                <Callout title="4비트에 담는 법">
                  4비트로는 숫자 16개밖에 구분하지 못한다. 그래서 값을 16개씩 묶고 묶음마다 배율 하나를 따로
                  둔다. 각 값은 배율로 나눈 뒤 가장 가까운 눈금으로 반올림한다. 학습 막바지에 같은 반올림을
                  미리 겪게 해 정확도를 지킨다.
                </Callout>
              </Appear>
              <Appear step="bytes" effect="rise">
                <Callout tone="ok" title="항목 하나가 288바이트">
                  값 512개가 4비트씩이면 256바이트이고, 묶음 32개의 배율이 32바이트다. V4의 FP8 캐시는 항목당
                  512바이트였으니 거의 절반이다.
                </Callout>
              </Appear>
              <Appear step="total" effect="rise">
                <Callout tone="ok" title="그래서 토큰당 890바이트">
                  CSA2 덕분에 전역 KV를 저장하는 층은 40층 중 네 개뿐이다. 인코더 세 층은 토큰 둘에 항목 하나,
                  디코더 한 층은 토큰마다 항목 하나다. 항목마다 indexer 키를 얹어 더하면 890이다.
                </Callout>
              </Appear>
            </Grid>
          </Stack>
        }
      />
    </SlideFrame>
  ),
);

export default fp4KvScene;
