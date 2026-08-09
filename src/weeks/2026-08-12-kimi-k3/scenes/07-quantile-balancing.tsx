import React from 'react';
import { Appear, defineScene, step, useStepProgress } from '@/lib/timeline';
import { Callout, DiagramView, EqSteps, Grid, SlideFrame, Stack, TensorMatrix, Tex } from '@/lib/kit';
import { quantileBalancingDetail } from '../diagrams/quantile-balancing.diagram';

/**
 * Fig. 5 of the paper, m=8 tokens × n=4 experts, k=1: margins s_ij − α_i.
 * Row-wise maxima reproduce the imbalanced Top-1 routing (loads 4·3·1·0);
 * the per-column top-q (q = mk/n = 2) cells are the balanced routing QB picks.
 */
const MARGINS: string[][] = [
  ['0.8', '0.0', '-0.4', '-0.9'],
  ['0.7', '0.0', '-0.3', '-0.8'],
  ['0.3', '-0.5', '0.0', '-0.6'],
  ['0.2', '-0.4', '-0.7', '0.0'],
  ['0.0', '0.9', '-0.5', '-0.3'],
  ['0.0', '0.6', '-0.6', '-0.4'],
  ['-0.3', '0.4', '-0.5', '0.0'],
  ['-0.4', '0.0', '0.5', '-0.6'],
];
const TOPK_INITIAL: [number, number][] = [
  [0, 0], [1, 0], [2, 0], [3, 0], [4, 1], [5, 1], [6, 1], [7, 2],
];
const TOPQ_BALANCED: [number, number][] = [
  [0, 0], [1, 0], [4, 1], [5, 1], [2, 2], [7, 2], [3, 3], [6, 3],
];

export const quantileBalancingScene = defineScene(
  {
    id: '07-quantile-balancing',
    title: 'Quantile Balancing',
    steps: [
      step('route', 2.2),
      step('bias', 2.6),
      step('fixedstep', 2.8),
      step('cutoff', 2.8),
      step('quantile', 3.0),
      step('deploy', 2.6, { hold: 0.6 }),
    ],
  },
  () => {
    const cutP = useStepProgress('cutoff');
    const quantP = useStepProgress('quantile');
    const balanced = quantP > 0;
    return (
      <SlideFrame title="Quantile Balancing — 부하 균형을 한 번에" footer="ML Weekly · Kimi K3 §2.3.3">
        <Stack gap={2} style={{ height: '100%' }}>
          <DiagramView
            diagram={quantileBalancingDetail}
            width={1776}
            height={290}
            stepEffects={{
              // 'x'와 'router'는 어떤 reveal에도 없음 — frame-0 앵커 (hard rule 6)
              route: {
                reveal: ['add', 'topk', 'experts', 'e-router-add', 'e-add-topk', 'e-topk-experts'],
                highlight: ['topk'],
              },
              bias: {
                reveal: ['bias', 'p', 'e-bias-add', 'e-router-p'],
                highlight: ['bias'],
                pulse: ['e-bias-add'],
              },
              fixedstep: {
                reveal: ['load', 'fixed', 'bnext', 'e-experts-load', 'e-load-fixed', 'e-fixed-bnext'],
                highlight: ['fixed'],
                pulse: ['e-load-fixed'],
              },
              cutoff: {
                reveal: ['alpha', 'e-topk-alpha'],
                highlight: ['alpha'],
              },
              quantile: {
                reveal: ['qb', 'e-alpha-qb', 'e-router-qb', 'e-qb-bnext'],
                highlight: ['qb'],
                dim: ['fixed', 'e-load-fixed', 'e-fixed-bnext'],
              },
              deploy: {
                highlight: ['bnext', 'bias'],
                dim: ['fixed', 'e-load-fixed', 'e-fixed-bnext'],
              },
            }}
          />
          <EqSteps
            size="md"
            parts={[
              { tex: 's_i = \\sigma(W_r x_i)' },
              { tex: ',\\quad T_i = \\mathrm{argtop}_k(s_i', step: 'route' },
              { tex: '\\,+\\,b^{(t)}', step: 'bias' },
              { tex: ')', step: 'route' },
              { tex: ',\\quad p_{i,j} \\propto s_{i,j}', step: 'bias' },
            ]}
          />
          <EqSteps
            size="sm"
            parts={[
              { tex: '\\alpha^{(t)}_i = \\mathrm{top}_{k+1}(s_i + b^{(t)})', step: 'cutoff' },
              { tex: ',\\qquad \\hat b^{(t+1)}_j \\leftarrow \\mathrm{quantile}_{1-k/n}\\big(s_{:,j} - \\alpha^{(t)}\\big)', step: 'quantile' },
              { tex: ',\\qquad b^{(t+1)} = \\hat b^{(t+1)} - \\mathrm{mean}\\big(\\hat b^{(t+1)}\\big)\\mathbf{1}', step: 'deploy' },
            ]}
          />
          <Grid columns={3} gap={4} style={{ flex: 1, minHeight: 0 }}>
            <Appear step="fixedstep" effect="rise">
              <Callout tone="warn" title="원조 규칙: 고정 스텝 (DeepSeek V3)">
                <Tex size="sm">{'b^{(t+1)}_j = b^{(t)}_j + \\gamma\\,\\mathrm{sign}(\\bar{\\ell} - \\ell_j)'}</Tex>
                <div style={{ marginTop: 6 }}>
                  bias가 선택에만 들어가는 뼈대는 공유. 다만 γ가 크면 부하가 진동, 작으면 적응이
                  느리다 — 전문가 896개에서 이 줄타기가 깨진다.
                </div>
              </Callout>
            </Appear>
            <Appear step="cutoff" effect="rise">
              <TensorMatrix
                title={balanced ? '열별 상위 q=2 → 부하 (2,2,2,2)' : '행별 Top-1 → 부하 (4,3,1,0)'}
                values={MARGINS}
                rowLabels={['t₁', 't₂', 't₃', 't₄', 't₅', 't₆', 't₇', 't₈']}
                columnLabels={['E₁', 'E₂', 'E₃', 'E₄']}
                highlight={balanced ? TOPQ_BALANCED : TOPK_INITIAL}
                color={balanced ? 'ok' : 'accent'}
                progress={cutP}
                width={470}
                cellHeight={28}
              />
            </Appear>
            <Appear step="quantile" effect="rise">
              <Callout tone="ok" title="분위수로 한 번에">
                Top-(k+1)의 k+1번째가 컷오프 α. 마진 s−α의 (1−k/n) 분위수가 곧 다음 bias — forward
                한 번에 목표 부하 q = mk/n을 맞춘다.
                <Appear step="deploy" effect="fade">
                  <div style={{ marginTop: 8 }}>
                    실전: 분위수는 히스토그램 all-reduce로 추정, inference에서는 bias 동결 — 배포 시
                    분위수 계산이 없다.
                  </div>
                </Appear>
              </Callout>
            </Appear>
          </Grid>
        </Stack>
      </SlideFrame>
    );
  },
);

export default quantileBalancingScene;
