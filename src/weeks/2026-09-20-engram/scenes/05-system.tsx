import React from 'react';
import { Appear, defineScene, step } from '@/lib/timeline';
import { Callout, DiagramView, Grid, SlideFrame, Spec, Stack, WalkthroughStage } from '@/lib/kit';
import { systemDetail, systemIds } from '../diagrams/system.diagram';

/** Engram §2.5, §6.4 (Table 4) and V4.1 §2.4.2, §3.1.3. */
export const systemScene = defineScene(
  {
    id: '05-system',
    title: '시스템: 테이블은 호스트 메모리에',
    steps: [step('address', 2.6), step('infer', 2.8), step('numbers', 2.2), step('zipf', 2.4, { hold: 0.6 })],
  },
  () => (
    <SlideFrame title="주소가 입력만으로 정해지니 미리 가져온다" footer="ML Weekly · Engram §2.5, §6.4 (Table 4) · V4.1 §2.4.2, §3.1.3">
      <WalkthroughStage
        placement="bottom"
        gap={4}
        visual={
          <DiagramView
            diagram={systemDetail}
            stepEffects={{
              // 토큰 ID, GPU 레인의 두 블록은 어떤 reveal에도 없다 — frame-0 앵커
              address: { reveal: systemIds.address, highlight: ['ids', 'hashc'] },
              infer: { reveal: systemIds.infer, highlight: ['b0', 'table'], pulse: ['e-table-b1'] },
              numbers: { highlight: ['b1', 'table'] },
              zipf: { reveal: systemIds.zipf, highlight: ['hbm', 'ssd'] },
            }}
          />
        }
        explanation={
          <Stack gap={3}>
            <Stack direction="row" gap={3}>
              <Appear step="numbers" effect="fade">
                <Spec label="Engram 실측">100B 테이블을 호스트에 둬도 처리량 −2.8% (8B dense, H800)</Spec>
              </Appear>
              <Appear step="numbers" effect="fade" delay={0.3}>
                <Spec label="V4.1">1층 모듈의 prefetch를 0층 계산과 겹친다 · FP8 저장 · RDMA</Spec>
              </Appear>
            </Stack>
            <Grid columns={3} gap={4}>
              <Appear step="address" effect="rise">
                <Callout title="어느 행을 읽을지 미리 안다">
                  Engram이 읽을 행 번호는 토큰 ID를 해시한 값이라 문장만 있으면 계산된다. MoE는 다르다. 어느
                  전문가를 부를지는 그 층의 은닉 상태를 봐야 정해지므로 미리 알 수 없다.
                </Callout>
              </Appear>
              <Appear step="infer" effect="rise">
                <Callout title="앞 블록이 도는 동안 행이 건너온다">
                  그래서 거대한 테이블을 GPU 대신 호스트 메모리에 둔다. GPU가 0층을 계산하는 동안 1층이 쓸 행을
                  미리 보내 두면 전송 시간이 계산 뒤에 숨는다. 오가는 양은 테이블 크기가 아니라 읽는 행 수에
                  비례한다.
                </Callout>
              </Appear>
              <Appear step="zipf" effect="rise">
                <Callout tone="ok" title="자주 쓰는 행만 빠른 곳에">
                  N-gram 빈도는 Zipf 분포를 따라서 소수의 N-gram이 조회 대부분을 차지한다. 자주 쓰는 행은 HBM에,
                  드문 행은 SSD에 두는 계층 캐시가 자연스럽다. 학습 때는 테이블을 GPU들에 행 단위로 나눠 둔다.
                </Callout>
              </Appear>
            </Grid>
          </Stack>
        }
      />
    </SlideFrame>
  ),
);

export default systemScene;
