import React from 'react';
import { Appear, defineScene, step, useStepProgress } from '@/lib/timeline';
import {
  Callout,
  DiagramView,
  EqSteps,
  Grid,
  SlideFrame,
  Spec,
  Stack,
  TensorMatrix,
  WalkthroughStage,
} from '@/lib/kit';
import { csa2CompressDetail, csa2CompressIds } from '../diagrams/csa2-compress.diagram';

/**
 * CSA2 compression. The diagram is the structure (8 tokens → 4 entries); the
 * arithmetic for block 3 (tokens 5, 6) is performed beside it on four
 * channels you can check, in two matrices that reveal on their beats:
 *
 *   Z₅ = ( 2.0, 0.0, −1.0, 1.0)   Z₆ = (0.0, 0.0, 1.0, 1.0)
 *   per-channel softmax over the two tokens
 *   S₅ = (0.88, 0.50, 0.12, 0.50)  S₆ = (0.12, 0.50, 0.88, 0.50)
 *   C₅ = ( 0.8, −0.2,  0.5, 1.0)   C₆ = (0.2, 0.6, −0.4, 0.0)
 *   S₅⊙C₅ + S₆⊙C₆ = (0.73, 0.20, −0.29, 0.50)
 */

const CH = ['ch 1', 'ch 2', 'ch 3', 'ch 4'];
const SCORES: string[][] = [
  ['2.0', '0.0', '−1.0', '1.0'],
  ['0.0', '0.0', '1.0', '1.0'],
  ['0.88', '0.50', '0.12', '0.50'],
  ['0.12', '0.50', '0.88', '0.50'],
];
const MIX: string[][] = [
  ['0.8', '−0.2', '0.5', '1.0'],
  ['0.2', '0.6', '−0.4', '0.0'],
  ['0.73', '0.20', '−0.29', '0.50'],
];

export const csa2CompressScene = defineScene(
  {
    id: '03-csa2-compress',
    title: 'CSA2 압축: 토큰 m개 → 항목 하나',
    steps: [
      step('project', 2.6),
      step('group', 2.4),
      step('weights', 3.0),
      step('mix', 2.8),
      step('entries', 2.8, { hold: 0.6 }),
    ],
  },
  () => {
    const weightsP = useStepProgress('weights');
    const mixP = useStepProgress('mix');
    return (
      <SlideFrame title="압축: 이웃한 토큰 m개를 항목 하나로 합친다" footer="ML Weekly · DeepSeek-V4 §2.3.1 · V4.1 §2.3">
        <WalkthroughStage
          placement="bottom"
          gap={4}
          visual={
            <Stack direction="row" gap={5} style={{ height: '100%' }}>
              <div style={{ flex: 1, minWidth: 0, minHeight: 0 }}>
                <DiagramView
                  diagram={csa2CompressDetail}
                  stepEffects={{
                    // 토큰 여덟 개는 어떤 reveal에도 없음 — frame-0 앵커
                    project: { reveal: csa2CompressIds.project, highlight: ['cz-4', 'cz-5'] },
                    group: { reveal: csa2CompressIds.group, highlight: ['blk-2'] },
                    weights: { highlight: ['blk-2', 'cz-4', 'cz-5'] },
                    mix: { highlight: ['blk-2'] },
                    entries: {
                      reveal: csa2CompressIds.entries,
                      highlight: ['ent-2', 'count'],
                      pulse: ['e-blk-2-ent-2'],
                    },
                  }}
                />
              </div>
              {/* 블록 3의 계산: 숫자는 산문이 아니라 표로, 비트에 맞춰 등장 */}
              <Appear step="weights" effect="fade">
                <Stack gap={3}>
                  <TensorMatrix
                    title="블록 3: 채널마다 두 토큰의 점수 Z → softmax → 비율 S"
                    values={SCORES}
                    rowLabels={['Z₅', 'Z₆', 'S₅', 'S₆']}
                    columnLabels={CH}
                    highlight={[[2, 0], [3, 2]]}
                    progress={weightsP}
                    width={470}
                    cellHeight={34}
                  />
                  <Appear step="mix" effect="fade">
                    <TensorMatrix
                      title="값 C를 그 비율로 섞는다 → 항목 3"
                      values={MIX}
                      rowLabels={['C₅', 'C₆', '항목 3']}
                      highlight={[[2, 0], [2, 1], [2, 2], [2, 3]]}
                      color="ok"
                      progress={mixP}
                      width={470}
                      cellHeight={34}
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
                    { tex: 'C_i = h_i W^{C},\\ \\ Z_i = h_i W^{Z}', step: 'project' },
                    { tex: '\\qquad S_i = \\operatorname{softmax}_{i \\in \\mathrm{block}}(Z_i)', step: 'weights' },
                    { tex: '\\qquad C^{\\mathrm{comp}} = \\textstyle\\sum_{i \\in \\mathrm{block}} S_i \\odot C_i', step: 'mix' },
                  ]}
                />
                <Stack direction="row" gap={2}>
                  <Appear step="group" effect="fade">
                    <Spec label="블록">토큰 m개 · 인코더 m = 2, 디코더 m = 1</Spec>
                  </Appear>
                </Stack>
              </Stack>
              <Grid columns={3} gap={4}>
                <Appear step="project" effect="rise">
                  <Callout title="토큰마다 값 하나와 점수 하나">
                    캐시를 줄이는 첫 방법은 이웃한 토큰 여러 개를 항목 하나로 합치는 것이다. 그러려면 토큰마다
                    두 가지가 필요하다. 캐시에 들어갈 값 <b>C</b>와, 채널마다 이 토큰을 얼마나 믿을지 매긴 점수{' '}
                    <b>Z</b>다.
                  </Callout>
                </Appear>
                <Appear step="weights" effect="rise">
                  <Callout title="평균이 아니라 배운 비율로 섞는다">
                    같은 블록의 두 토큰을 채널 하나씩 놓고 점수를 softmax로 비율로 바꾼다. 어떤 채널은 토큰 5를,
                    어떤 채널은 토큰 6을 거의 그대로 가져간다. 어느 토큰을 믿을지를 모델이 채널마다 따로 배운다.
                  </Callout>
                </Appear>
                <Appear step="entries" effect="rise">
                  <Callout tone="ok" title="캐시가 m분의 1로 준다">
                    그 비율로 값을 섞은 결과가 블록의 항목 하나다. 인코더는 토큰 둘에 항목 하나라서 캐시가
                    절반이 되고, 디코더는 압축하지 않는다. V4에 있던 옆 블록과의 겹침과 위치 편향은 없앴다.
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

export default csa2CompressScene;
