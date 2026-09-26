import React from 'react';
import { Appear, defineScene, step, useStepProgress } from '@/lib/timeline';
import { Callout, DiagramView, EqSteps, Grid, SlideFrame, Spec, Stack, TensorMatrix, WalkthroughStage } from '@/lib/kit';
import { gatingDetail, gatingIds } from '../diagrams/gating.diagram';

/**
 * Engram §2.3 worked on d = 4 so every number can be checked on screen.
 * Entries are ±1, so each vector already has RMS 1 (RMSNorm leaves it as is).
 *   k  = ( 1,  1, −1,  1)
 *   h₁ = ( 1,  1, −1, −1)  "…deposited cash at the bank"  h₁ᵀk =  2 → /√4 =  1 → σ = 0.73
 *   h₂ = (−1,  1,  1, −1)  "…walked along the river to the bank"  h₂ᵀk = −2 → −1 → σ = 0.27
 */
const VECS = [
  ['1', '1', '−1', '1'],
  ['1', '1', '−1', '−1'],
  ['−1', '1', '1', '−1'],
];
const GATES = [
  ['2', '1', '0.73'],
  ['−2', '−1', '0.27'],
];

export const gatingScene = defineScene(
  {
    id: '03-gating',
    title: '게이트: 문맥이 메모리를 거른다',
    steps: [
      step('kv', 2.4),
      step('query', 2.4),
      step('score', 2.6),
      step('example', 2.8),
      step('gate', 2.6, { hold: 0.6 }),
    ],
  },
  () => {
    const vecP = useStepProgress('score');
    const gateP = useStepProgress('example');
    return (
      <SlideFrame title="Context-aware Gating: 문맥이 쿼리, 메모리가 키" footer="ML Weekly · Engram §2.3 (eq. 3–4), §6.5">
        <WalkthroughStage
          placement="bottom"
          gap={4}
          visual={
            <Stack direction="row" gap={5} style={{ height: '100%' }}>
              <div style={{ flex: 1, minWidth: 0, minHeight: 0 }}>
                <DiagramView
                  diagram={gatingDetail}
                  stepEffects={{
                    // eₜ 노드는 어떤 reveal에도 없다 — frame-0 앵커
                    kv: { reveal: gatingIds.kv, highlight: ['wk', 'wv'] },
                    query: { reveal: gatingIds.query, highlight: ['h', 'dot'] },
                    score: { reveal: gatingIds.score, highlight: ['dot', 'sig'] },
                    example: { highlight: ['sig'] },
                    gate: { reveal: gatingIds.gate, highlight: ['mul', 'out'], pulse: ['e-sig-mul'] },
                  }}
                />
              </div>
              <Appear step="score" effect="fade">
                <Stack gap={3}>
                  <TensorMatrix
                    title="같은 (the, bank)의 k, 두 문맥의 h"
                    values={VECS}
                    rowLabels={['k', 'h₁ 돈', 'h₂ 강']}
                    columnLabels={['1', '2', '3', '4']}
                    highlight={[[1, 3], [2, 0], [2, 2], [2, 3]]}
                    progress={vecP}
                    width={420}
                    cellHeight={38}
                  />
                  <Appear step="example" effect="fade">
                    <TensorMatrix
                      values={GATES}
                      rowLabels={['h₁ 돈', 'h₂ 강']}
                      columnLabels={['hᵀk', '÷ √4', 'α = σ(·)']}
                      highlight={[[0, 2], [1, 2]]}
                      color="ok"
                      progress={gateP}
                      width={420}
                      cellHeight={38}
                    />
                  </Appear>
                </Stack>
              </Appear>
            </Stack>
          }
          explanation={
            <Stack gap={3}>
              <Stack direction="row" gap={4} align="center" justify="space-between">
                <EqSteps
                  size="sm"
                  parts={[
                    { tex: 'k_t = W_K e_t,\\;\\; v_t = W_V e_t', step: 'kv' },
                    {
                      tex: '\\qquad \\alpha_t = \\sigma\\!\\left(\\mathrm{RMSNorm}(h_t)^{\\top}\\,\\mathrm{RMSNorm}(k_t)\\,/\\sqrt{d}\\right)',
                      step: 'score',
                    },
                    { tex: '\\qquad \\tilde v_t = \\alpha_t\\, v_t', step: 'gate' },
                  ]}
                />
                <Appear step="gate" effect="fade">
                  <Spec label="αₜ">토큰마다 스칼라 1개</Spec>
                </Appear>
              </Stack>
              <Grid columns={3} gap={4}>
                <Appear step="kv" effect="rise">
                  <Callout title="메모리가 키와 값, 문맥이 쿼리">
                    꺼낸 eₜ는 문맥을 모르는 고정 벡터다. 해시 충돌이나 여러 뜻을 가진 말이면 틀린 값일 수도 있다.
                    그래서 eₜ로 키 k와 값 v를 만들고, 어텐션을 이미 거친 은닉 상태 hₜ를 쿼리로 삼는다.
                  </Callout>
                </Appear>
                <Appear step="score" effect="rise">
                  <Callout title="방향이 맞으면 1 쪽, 어긋나면 0 쪽">
                    두 벡터를 RMSNorm으로 같은 크기로 맞춘 뒤 내적하고 √d로 나눠 시그모이드에 넣는다. 결과 α는 0과 1
                    사이의 수 하나다. 오른쪽 표에서 돈 문맥은 0.73, 강 문맥은 0.27이 나온다.
                  </Callout>
                </Appear>
                <Appear step="gate" effect="rise">
                  <Callout tone="ok" title="문맥이 아니라고 하면 메모리를 줄인다">
                    출력은 v에 α를 곱한 값이다. (the, bank)는 두 문장에서 같은 행을 꺼내지만, 강가 이야기에서는
                    게이트가 은행이라는 뜻의 메모리를 약하게 들여보낸다. 학습된 모델은 이름이 완성되는 토큰에서
                    게이트를 크게 연다.
                  </Callout>
                </Appear>
              </Grid>
            </Stack>
          }
        />
      </SlideFrame>
    );
  },
);

export default gatingScene;
