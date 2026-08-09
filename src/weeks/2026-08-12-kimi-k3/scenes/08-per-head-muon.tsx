import React from 'react';
import { Appear, defineScene, step } from '@/lib/timeline';
import { Callout, DiagramView, EqSteps, Grid, SlideFrame, Stack } from '@/lib/kit';
import { perHeadMuonDetail } from '../diagrams/per-head-muon.diagram';

/**
 * Per-Head Muon: full-matrix Newton–Schulz treats the 96 heads of a Q/K/V
 * projection as one coupled block, so large-momentum heads dominate the shared
 * update direction; K3 orthogonalizes each head's momentum block separately.
 */
export const perHeadMuonScene = defineScene(
  {
    id: '08-per-head-muon',
    title: 'Per-Head Muon',
    steps: [
      step('muon', 2.6),
      step('coupled', 2.8),
      step('split', 2.4),
      step('ortho', 2.6),
      step('equalise', 3.0, { hold: 0.6 }),
    ],
  },
  () => (
    <SlideFrame title="Per-Head Muon — 헤드별 직교화" footer="ML Weekly · Kimi K3 §2.5">
      <Stack gap={3} style={{ height: '100%' }}>
        <DiagramView
          diagram={perHeadMuonDetail}
          width={1776}
          height={360}
          stepEffects={{
            // 'g'와 'm'은 어떤 reveal에도 없음 — frame-0 앵커 (hard rule 6)
            muon: {
              reveal: ['full', 'w', 'e-m-full', 'e-full-w'],
              highlight: ['full'],
            },
            coupled: { highlight: ['full'], pulse: ['e-m-full'] },
            split: {
              reveal: ['split', 'h1', 'hdots', 'h96', 'e-m-split', 'e-split-h1', 'e-split-hdots', 'e-split-h96'],
              highlight: ['split'],
              dim: ['full', 'e-m-full', 'e-full-w'],
            },
            ortho: {
              reveal: ['concat', 'e-h1-concat', 'e-hdots-concat', 'e-h96-concat', 'e-concat-w'],
              highlight: ['h1', 'h96'],
              dim: ['full', 'e-m-full', 'e-full-w'],
            },
            equalise: {
              highlight: ['w'],
              pulse: ['e-concat-w'],
              dim: ['full', 'e-m-full', 'e-full-w'],
            },
          }}
        />
        <EqSteps
          size="md"
          parts={[
            { tex: 'M_t = \\mu M_{t-1} + G_t' },
            { tex: ',\\qquad W \\leftarrow W - \\eta\\,\\mathrm{NS}_5(M_t)', step: 'muon' },
            { tex: '\\;\\approx\\; W - \\eta\\,UV^{\\top}', step: 'muon' },
          ]}
        />
        <EqSteps
          size="sm"
          parts={[
            { tex: 'M_t = [\\,M^{(1)}\\,|\\,\\cdots\\,|\\,M^{(96)}\\,]', step: 'split' },
            { tex: ',\\qquad O^{(h)} = \\mathrm{NS}_5\\big(M^{(h)}\\big)', step: 'ortho' },
            { tex: ',\\qquad \\Delta W = -\\eta\\,[\\,O^{(1)}\\,|\\,\\cdots\\,|\\,O^{(96)}\\,]', step: 'ortho' },
          ]}
        />
        <Grid columns={3} gap={4} style={{ flex: 1, minHeight: 0 }}>
          <Appear step="muon" effect="rise">
            <Callout title="Muon 한 줄 요약 (K2 그대로)">
              행렬 파라미터는 momentum을 그대로 더하지 않고 Newton–Schulz 5회로 직교화해서 쓴다.
              특이값을 전부 1로 밀어 크기를 버리고 방향만 남기는 msign(M) ≈ UV<sup>⊤</sup> 연산이다.
            </Callout>
          </Appear>
          <Appear step="coupled" effect="rise">
            <Callout tone="warn" title="전체 행렬 NS의 문제">
              W_Q·W_K·W_V는 96개 head의 연결인데, 한 블록으로 직교화하면 정규화 기준이 행렬
              전체다. momentum이 큰 head가 공유 업데이트 방향을 지배하고, 작은 head는 정규화가
              덜 된 채로 끌려간다.
            </Callout>
          </Appear>
          <Appear step="equalise" effect="rise">
            <Callout tone="ok" title="Per-head의 효과">
              head마다 따로 직교화하면 업데이트 스케일이 head 간에 균등해져 대규모에서 학습이
              안정된다. 덤: 7168×128 tall block의 NS 반복이 전체 행렬보다 싸서 옵티마이저
              오버헤드도 살짝 준다.
            </Callout>
          </Appear>
        </Grid>
      </Stack>
    </SlideFrame>
  ),
);

export default perHeadMuonScene;
