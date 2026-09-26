import React from 'react';
import { Appear, defineScene, step, useStepProgress } from '@/lib/timeline';
import { Callout, DiagramView, EqSteps, Grid, SlideFrame, Spec, Stack, TensorMatrix, WalkthroughStage } from '@/lib/kit';
import { retrievalDetail, retrievalIds } from '../diagrams/retrieval.diagram';

/**
 * Engram §2.2. The collision table is a toy: one hash value per N-gram,
 * reduced modulo two different primes (7 and 11) to stand for two heads.
 *   38 mod 7 = 3, 45 mod 7 = 3  → collide in head 1
 *   38 mod 11 = 5, 45 mod 11 = 1 → separate in head 2
 */
const COLLIDE = [
  ['38', '3', '5'],
  ['45', '3', '1'],
];

export const retrievalScene = defineScene(
  {
    id: '02-retrieval',
    title: '조회: 해시된 N-gram',
    steps: [
      step('compress', 2.4),
      step('suffix', 2.2),
      step('hash', 2.8),
      step('collide', 2.8),
      step('concat', 2.4, { hold: 0.6 }),
    ],
  },
  () => {
    const collideP = useStepProgress('collide');
    return (
      <SlideFrame title="조회: 직전 N개 토큰을 해시해 테이블 행을 꺼낸다" footer="ML Weekly · Engram §2.2 · V4.1 §2.4.2">
        <WalkthroughStage
          placement="bottom"
          gap={4}
          visual={
            <Stack direction="row" gap={5} style={{ height: '100%' }}>
              <div style={{ flex: 1, minWidth: 0, minHeight: 0 }}>
                <DiagramView
                  diagram={retrievalDetail}
                  stepEffects={{
                    // 원래 토큰 세 개는 어떤 reveal에도 없다 — frame-0 앵커
                    compress: { reveal: retrievalIds.compress, highlight: ['compress'] },
                    suffix: { reveal: retrievalIds.suffix, highlight: ['g2', 'g3'] },
                    hash: { reveal: retrievalIds.hash, pulse: ['e-h2-1-r2-1', 'e-h2-2-r2-2', 'e-h3-1-r3-1', 'e-h3-2-r3-2'] },
                    collide: { highlight: ['h2-1', 'h2-2'], dim: 'others' },
                    concat: { reveal: retrievalIds.concat, highlight: ['et'] },
                  }}
                />
              </div>
              <Appear step="collide" effect="fade">
                <Stack gap={3}>
                  <TensorMatrix
                    title="g₁ = (the, great), g₂ = (the, wall)"
                    values={COLLIDE}
                    rowLabels={['g₁', 'g₂']}
                    columnLabels={['해시값', '헤드 1: mod 7', '헤드 2: mod 11']}
                    highlight={[[0, 1], [1, 1]]}
                    color="warn"
                    progress={collideP}
                    width={440}
                    cellHeight={44}
                  />
                  <Spec label="예시">해시값은 설명용 숫자다</Spec>
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
                    { tex: "x'_t = \\mathcal{P}(x_t)", step: 'compress' },
                    { tex: "\\quad g_{t,n} = (x'_{t-n+1}, \\dots, x'_t)", step: 'suffix' },
                    { tex: '\\quad e_{t,n,k} = E_{n,k}\\big[\\varphi_{n,k}(g_{t,n})\\big]', step: 'hash' },
                    { tex: '\\quad e_t = \\big\\Vert_{n}\\,\\big\\Vert_{k}\\; e_{t,n,k}', step: 'concat' },
                  ]}
                />
                <Stack direction="row" gap={2}>
                  <Appear step="concat" effect="fade">
                    <Spec label="V4.1">차수 {'{2, 3, 4}'} · 헤드 8개 · 헤드당 ≈16M행</Spec>
                  </Appear>
                </Stack>
              </Stack>
              <Grid columns={3} gap={4}>
                <Appear step="compress" effect="rise">
                  <Callout title="같은 단어는 같은 열쇠로">
                    토크나이저는 ␣Great와 great에 서로 다른 번호를 준다. Engram은 NFKC 정규화와 소문자화로 이런
                    번호를 하나로 묶어 128k 어휘를 23% 줄인다. 그다음 현재 토큰에서 끝나는 2-gram과 3-gram을
                    열쇠로 삼는다.
                  </Callout>
                </Appear>
                <Appear step="hash" effect="rise">
                  <Callout title="모든 N-gram에 행을 줄 수는 없다">
                    3-gram의 가짓수는 어휘 크기의 세제곱이라 표로 만들 수 없다. 그래서 해시 함수로 N-gram을 고정
                    크기 테이블의 행 번호 z로 접는다. 접으면 서로 다른 N-gram이 같은 행에 떨어지는 충돌이 생긴다.
                  </Callout>
                </Appear>
                <Appear step="collide" effect="rise">
                  <Callout tone="ok" title="헤드를 여럿 두면 충돌이 풀린다">
                    헤드마다 크기가 서로 다른 소수인 테이블을 따로 둔다. 오른쪽 예처럼 두 N-gram이 헤드 1에서 같은
                    행에 떨어져도 헤드 2에서는 갈린다. 모든 헤드의 행을 이어 붙인 eₜ는 N-gram마다 거의 항상
                    다르다.
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

export default retrievalScene;
