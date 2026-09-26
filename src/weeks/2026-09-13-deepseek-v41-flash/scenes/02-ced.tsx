import React from 'react';
import { Appear, defineScene, step } from '@/lib/timeline';
import { Callout, DiagramView, EqSteps, SlideFrame, Stack, WalkthroughStage } from '@/lib/kit';
import { cedDetail, cedIds } from '../diagrams/ced.diagram';

/**
 * CED (§2.2). Baseline first: prefill costs N × L because every layer builds
 * its own KV from its own hidden state. Then the one change (decoder global
 * KV is a projection of the encoder's last output), what it buys (prefill
 * stops at the encoder), and the loose end it leaves (decoder SWA KV) which
 * scene 09 closes. The projection and the cost are EqSteps in the rail; the
 * prose only says why. Parameter counts (8B/16B) live in the notes.
 */
export const cedScene = defineScene(
  {
    id: '02-ced',
    title: 'Causal Encoder-Decoder',
    steps: [
      step('baseline', 2.4),
      step('project', 3.0),
      step('half', 2.6),
      step('swa', 2.8, { hold: 0.6 }),
    ],
  },
  () => (
    <SlideFrame title="CED: 프롬프트는 층의 절반만 지나간다" footer="ML Weekly · DeepSeek-V4.1-Flash §2.2">
      <WalkthroughStage
        visual={
          <DiagramView
            diagram={cedDetail}
            stepEffects={{
              // prompt·enc·dec·next와 기준선 레일은 어떤 reveal에도 없음 — frame-0 앵커
              baseline: {
                reveal: cedIds.baseline,
                highlight: ['enc', 'dec'],
                pulse: ['e-enc-dec'],
              },
              project: {
                reveal: cedIds.project,
                highlight: ['h-enc', 'proj', 'dec-kv'],
                pulse: ['e-h-enc-proj', 'e-proj-dec-kv'],
              },
              half: {
                reveal: cedIds.half,
                highlight: ['enc', 'prefill-end'],
                dim: ['e-enc-dec', 'baseline'],
              },
              swa: {
                reveal: cedIds.swa,
                highlight: ['tail'],
                pulse: ['e-tail-dec'],
                dim: ['e-enc-dec', 'baseline'],
              },
            }}
          />
        }
        explanation={
          <Stack gap={2}>
            {/* 수식은 비트에 맞춰 점등 — 산문은 왜 그런지만 말한다 */}
            <EqSteps
              size="sm"
              parts={[
                { tex: 'O(N \\cdot 40)', step: 'baseline' },
                { tex: '\\quad\\to\\quad O(N \\cdot 20', step: 'half' },
                { tex: '\\ +\\ 128 \\cdot 20)', step: 'swa' },
              ]}
            />
            <EqSteps size="sm" parts={[{ tex: 'C_l = H_{20}\\,W^{KV}_l \\qquad (l > 20)', step: 'project' }]} />
            <Appear step="baseline" effect="rise">
              <Callout title="prefill이 비싼 이유">
                프롬프트를 처음 읽어 KV를 만드는 단계가 <b>prefill</b>이다. 층마다 자기 계산 결과로 KV를
                만드니, 토큰 전부가 40층을 다 지나야 한다.
              </Callout>
            </Appear>
            <Appear step="project" effect="rise">
              <Callout tone="ok" title="디코더의 전역 KV는 인코더 출력에서">
                아래 20층이 인코더, 위 20층이 디코더다. 디코더의 전역 KV는 그 층에서 계산하지 않고, 인코더
                마지막 출력에 층마다 다른 행렬을 곱해 만든다.
              </Callout>
            </Appear>
            <Appear step="swa" effect="rise">
              <Callout tone="warn" title="SWA KV만은 디코더가 직접 만든다">
                SWA KV는 투영하면 깊이가 얕아져 층마다 직접 계산한다. 대신 마지막 128 토큰만 디코더에
                넣으니 prefill이 거의 절반으로 준다.
              </Callout>
            </Appear>
          </Stack>
        }
      />
    </SlideFrame>
  ),
);

export default cedScene;
