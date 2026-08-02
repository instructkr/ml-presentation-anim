import React from 'react';
import { Appear, defineScene, step } from '@/lib/timeline';
import { Callout, DiagramView, EqSteps, Grid, SlideFrame, Stack, Tex } from '@/lib/kit';
import { kdaDetail } from '../diagrams/kda-detail.diagram';

/**
 * KDA = the delta rule with a channel-wise forget gate applied *before* the
 * write, plus K3's two changes to Kimi Linear: a lower-bounded decay and a
 * full-rank output gate.
 */
export const kdaScene = defineScene(
  {
    id: '02-kda',
    title: 'Kimi Delta Attention',
    steps: [
      step('branch', 2.4),
      step('decay', 2.8),
      step('write', 2.8),
      step('read', 2.4),
      step('gate', 2.6),
      step('bound', 3.0, { hold: 0.6 }),
    ],
  },
  () => (
    <SlideFrame title="Kimi Delta Attention — 길이 방향 확장" footer="ML Weekly · Kimi K3 §2.1.1">
      <Stack gap={3} style={{ height: '100%' }}>
        <DiagramView
          diagram={kdaDetail}
          width={1776}
          height={380}
          stepEffects={{
            branch: {
              reveal: ['x', 'feat', 'decay', 'beta', 'e-x-feat', 'e-x-decay', 'e-x-beta'],
              highlight: ['feat'],
            },
            decay: { highlight: ['decay'] },
            write: {
              reveal: ['update', 'e-feat-update', 'e-decay-update', 'e-beta-update'],
              highlight: ['update'],
              pulse: ['e-decay-update'],
            },
            read: { reveal: ['read', 'e-update-read'], highlight: ['read'] },
            gate: {
              reveal: ['gate', 'y', 'e-read-gate', 'e-x-gate', 'e-gate-y'],
              highlight: ['gate'],
              pulse: ['e-x-gate'],
            },
            bound: { highlight: ['decay'] },
          }}
        />
        <EqSteps
          size="md"
          parts={[
            { tex: 'S_t =' },
            { tex: '\\big(I - \\beta_t k_t k_t^{\\top}\\big)', step: 'write' },
            { tex: '\\mathrm{Diag}(\\alpha_t)', step: 'decay' },
            { tex: 'S_{t-1}' },
            { tex: '+\\, \\beta_t k_t v_t^{\\top}', step: 'write' },
          ]}
        />
        <EqSteps
          size="sm"
          parts={[
            { tex: 'y_t = W_o\\big[' },
            { tex: '\\sigma(W_g x_t)', step: 'gate' },
            { tex: '\\odot\\;\\mathrm{RMSNorm}\\big(' },
            { tex: 'S_t^{\\top} q_t', step: 'read' },
            { tex: '\\big)\\big]' },
          ]}
        />
        <Grid columns={2} gap={4} style={{ flex: 1, minHeight: 0 }}>
          <Appear step="branch" effect="rise">
            <Callout title="다섯 갈래로 갈라지는 입력">
              q·k는 ShortConv → Swish → L2Norm을 함께 타고, v는 L2 없이. α는 저랭크 쌍에서 나오는
              채널별 감쇠, β는 스칼라 쓰기 강도. 그림에서 q·k 줄이 겹쳐 그려진 이유다.
            </Callout>
          </Appear>
          <Appear step="bound" effect="rise">
            <Callout tone="ok" title="K3의 변화: 하한이 있는 감쇠">
              <Tex size="sm">{'g_t = g_{\\min}\\,\\sigma(e^{A}z_t),\\quad g_{\\min}=-5'}</Tex>
              <div style={{ marginTop: 8 }}>
                Kimi Linear의 −Softplus는 아래로 열려 있어 1/Γ가 BF16 범위를 넘겼다. 하한을 두면
                16-토큰 타일의 누적 로그 감쇠가 (−80, 0)에 갇히고, 대각 타일까지 전부 Tensor Core
                matmul로 돈다.
              </div>
            </Callout>
          </Appear>
        </Grid>
      </Stack>
    </SlideFrame>
  ),
);

export default kdaScene;
