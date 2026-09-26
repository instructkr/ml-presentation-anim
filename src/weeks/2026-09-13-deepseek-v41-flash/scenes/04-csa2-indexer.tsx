import React from 'react';
import { Appear, defineScene, step } from '@/lib/timeline';
import { Callout, DiagramView, EqSteps, Grid, SlideFrame, Spec, Stack, WalkthroughStage } from '@/lib/kit';
import { csa2IndexerDetail, csa2IndexerIds } from '../diagrams/csa2-indexer.diagram';

/**
 * The full indexing path of one Full-mode layer. This is the computation that
 * Reuse skips entirely and Reindex runs half of, so it is laid out once, end
 * to end, before the next scene takes it apart across layers. The story is
 * "cheap preliminary round, then the real attention on the finalists"; the
 * projections are EqSteps and every dimension is a Spec chip.
 */
export const csa2IndexerScene = defineScene(
  {
    id: '04-csa2-indexer',
    title: 'Full 층의 인덱싱',
    steps: [
      step('lowrank', 3.0),
      step('iq', 2.6),
      step('ik', 2.6),
      step('score', 3.0),
      step('topk', 2.6),
      step('attend', 3.0, { hold: 0.6 }),
    ],
  },
  () => (
    <SlideFrame title="Full 층: 값싼 예선으로 읽을 512개를 고른다" footer="ML Weekly · DeepSeek-V4 §2.3.1 · V4.1 §2.3">
      <WalkthroughStage
        placement="bottom"
        gap={3}
        visual={
          <DiagramView
            diagram={csa2IndexerDetail}
            stepEffects={{
              // ht와 entries는 어떤 reveal에도 없음 — frame-0 앵커
              lowrank: {
                reveal: csa2IndexerIds.lowrank,
                highlight: ['cq'],
                camera: { focus: ['ht', 'cq', 'qmain'], padding: 60, maxScale: 1.1 },
              },
              iq: {
                reveal: csa2IndexerIds.iq,
                highlight: ['qi', 'w'],
                pulse: ['e-iuq-qi'],
                camera: { focus: ['ht', 'qi', 'w'], padding: 60, maxScale: 1.1 },
              },
              ik: {
                reveal: csa2IndexerIds.ik,
                highlight: ['ki'],
                pulse: ['e-ik-ki'],
                camera: { focus: ['ht', 'entries', 'ki', 'qi'], padding: 60, maxScale: 1.1 },
              },
              score: {
                reveal: csa2IndexerIds.score,
                highlight: ['score'],
                pulse: ['e-qi-score', 'e-w-score', 'e-ki-score'],
                camera: { focus: ['qi', 'w', 'ki', 'score'], padding: 60, maxScale: 1.1 },
              },
              topk: {
                reveal: csa2IndexerIds.topk,
                highlight: ['topk', 'gather'],
                pulse: ['e-entries-gather'],
                camera: { focus: ['entries', 'score', 'gather'], padding: 60, maxScale: 1.1 },
              },
              attend: {
                reveal: csa2IndexerIds.attend,
                highlight: ['core'],
                pulse: ['e-gather-core', 'e-swa-core', 'e-qmain-core'],
                // 마지막 비트는 전체로 물러난다
                camera: { focus: ['ht', 'w', 'swa', 'uq'], padding: 40 },
              },
            }}
          />
        }
        explanation={
          <Stack gap={2}>
            {/* 투영과 점수는 수식으로 점등; 차원은 칩으로 */}
            <EqSteps
              size="sm"
              parts={[
                { tex: 'c^Q_t = h_t W^{DQ},\\ \\ q_t = c^Q_t W^{UQ}', step: 'lowrank' },
                { tex: ',\\quad q^I_t = c^Q_t W^{IUQ},\\ \\ w_t = h_t W^{w}', step: 'iq' },
                { tex: ',\\quad K^I_s = C^{\\mathrm{comp}}_s W^{IK}', step: 'ik' },
              ]}
            />
            <EqSteps
              size="sm"
              parts={[
                { tex: 'I_{t,s} = \\textstyle\\sum_{h=1}^{32} w_{t,h}\\,\\mathrm{ReLU}(q^I_{t,h} \\cdot K^I_s)', step: 'score' },
                { tex: '\\quad\\to\\quad \\mathrm{Top}\\text{-}512', step: 'topk' },
                { tex: '\\quad\\to\\quad \\mathrm{Attn}\\big(q_t,\\ [\\,C_{\\mathrm{sel}};\\ C_{\\mathrm{swa}}\\,]\\big)', step: 'attend' },
              ]}
            />
            <Stack direction="row" gap={2} align="center">
              <Appear step="lowrank" effect="fade">
                <Spec label="쿼리">5120 → 1280 → 64 헤드 × 512</Spec>
              </Appear>
              <Appear step="iq" effect="fade">
                <Spec label="indexer 쿼리">32 헤드 × 128</Spec>
              </Appear>
              <Appear step="ik" effect="fade">
                <Spec label="indexer 키">512 → 128 · FP4</Spec>
              </Appear>
              <Appear step="attend" effect="fade">
                <Spec label="읽는 양">512 + 128 = 640 · key = value</Spec>
              </Appear>
            </Stack>
            <Grid columns={3} gap={4}>
              <Appear step="lowrank" effect="rise">
                <Callout title="예선과 본선: 쿼리를 둘 만든다">
                  어디를 읽을지는 값싼 예선으로 정하고, 본 어텐션은 통과한 항목만 읽는다. 그래서 지금 토큰은 본
                  쿼리와 예선용 indexer 쿼리를 따로 만든다. 둘 다 같은 재료에서 나온다.
                </Callout>
              </Appear>
              <Appear step="score" effect="rise">
                <Callout title="예선 점수는 가벼운 내적">
                  캐시 항목마다 작은 indexer 키를 하나씩 붙여 둔다. indexer 쿼리와 이 키를 내적하면 항목마다
                  점수가 하나 나온다. 차원이 작아 문맥 전체를 훑어도 싸다.
                </Callout>
              </Appear>
              <Appear step="attend" effect="rise">
                <Callout tone="ok" title="본선: 고른 512개만 읽는다">
                  본 쿼리는 예선을 통과한 512개와 최근 128개만 읽는다. 문맥이 백만 토큰이어도 읽는 양은 같다.
                  다음 탭에서는 이 과정 중 어디까지를 다른 층이 건너뛰는지 본다.
                </Callout>
              </Appear>
            </Grid>
          </Stack>
        }
      />
    </SlideFrame>
  ),
);

export default csa2IndexerScene;
