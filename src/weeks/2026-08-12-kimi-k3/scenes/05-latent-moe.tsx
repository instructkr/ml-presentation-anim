import React from 'react';
import { Appear, defineScene, step } from '@/lib/timeline';
import { Callout, DiagramView, EqSteps, Grid, SlideFrame, Stack, Tex } from '@/lib/kit';
import { latentMoeDetail } from '../diagrams/latent-moe-detail.diagram';

/**
 * The width axis. LatentMoE separates model width from routed-expert width, so
 * routing multiplicity stops costing full-width traffic — plus the two
 * stabilisers that extreme sparsity then makes necessary.
 */
export const latentMoeScene = defineScene(
  {
    id: '05-latent-moe',
    title: 'Stable LatentMoE',
    steps: [
      step('shared', 2.4),
      step('latent', 2.8),
      step('route', 2.6),
      step('experts', 2.4),
      step('stabilise', 3.0),
      step('balance', 3.0, { hold: 0.6 }),
    ],
  },
  () => (
    <SlideFrame title="Stable LatentMoE — 너비 방향 확장" footer="ML Weekly · Kimi K3 §2.3">
      <Stack gap={3} style={{ height: '100%' }}>
        <DiagramView
          diagram={latentMoeDetail}
          width={1776}
          height={410}
          stepEffects={{
            // 'x' stays out of every reveal — the frame-0 anchor (hard rule 6)
            shared: { reveal: ['shared', 'e-x-shared'], highlight: ['shared'] },
            latent: { reveal: ['down', 'e-x-down'], highlight: ['down'] },
            route: { reveal: ['router', 'e-x-router'], highlight: ['router'] },
            experts: {
              reveal: ['experts', 'agg', 'e-down-experts', 'e-router-experts', 'e-experts-agg'],
              highlight: ['experts'],
              pulse: ['e-router-experts'],
            },
            stabilise: {
              reveal: ['up', 'sum', 'y', 'e-agg-up', 'e-up-sum', 'e-shared-sum', 'e-sum-y'],
              highlight: ['agg'],
            },
            balance: { highlight: ['router'] },
          }}
        />
        <EqSteps
          size="md"
          parts={[
            { tex: 'y =' },
            { tex: '\\textstyle\\sum_{j=1}^{2} E^{\\mathrm{shared}}_j(x)', step: 'shared' },
            { tex: '+\\; W_{\\uparrow}' },
            { tex: '\\mathrm{RMSNorm}', step: 'stabilise' },
            { tex: '\\Big(\\textstyle\\sum_{i\\in T_k}' },
            { tex: 'p_i E^{\\mathrm{routed}}_i', step: 'experts' },
            { tex: '\\big(' },
            { tex: 'W_{\\downarrow}x', step: 'latent' },
            { tex: '\\big)\\Big)' },
          ]}
        />
        <Grid columns={3} gap={4} style={{ flex: 1, minHeight: 0 }}>
          <Appear step="latent" effect="rise">
            <Callout title="모델 폭 d와 라우팅 폭 ℓ의 분리">
              보통 MoE는 선택된 전문가마다 d차원 토큰을 통째로 보내서, 라우팅 수를 늘리면 통신량이
              그대로 따라 는다. 라우팅 경로만 좁은 잠재 폭에서 돌리면 896개 중 16개 활성 — 희소도
              56 — 이 감당 가능해진다.
            </Callout>
          </Appear>
          <Appear step="stabilise" effect="rise">
            <Callout tone="ok" title="&quot;Stable&quot;이 붙은 이유">
              라우팅 경로에 W↓ · 게이트 FFN · W↑로 행렬곱이 네 번 연달아 붙어 2.8T 규모에서 활성값이
              폭주했다. ① W↑ 앞 RMSNorm, ② SwiGLU 대신 상한이 있는 SiTU-GLU:
              <Tex size="sm" style={{ display: 'block', marginTop: 6 }}>
                {'\\beta\\tanh(x/\\beta)\\cdot\\sigma(x),\\ \\ \\beta_1{=}4,\\ \\beta_2{=}25'}
              </Tex>
            </Callout>
          </Appear>
          <Appear step="balance" effect="rise">
            <Callout tone="warn" title="Quantile Balancing">
              전문가가 896개면 고정 스텝 bias 업데이트가 진동한다. QB는 Top-(k+1)에서 얻은 컷오프
              대비 마진의 (1−k/n) 분위수를 bias로 바로 잡아, 한 번의 forward로 목표 부하를 맞춘다.
            </Callout>
          </Appear>
        </Grid>
      </Stack>
    </SlideFrame>
  ),
);

export default latentMoeScene;
