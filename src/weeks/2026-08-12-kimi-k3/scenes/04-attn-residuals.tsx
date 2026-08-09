import React from 'react';
import { Appear, defineScene, step } from '@/lib/timeline';
import { Callout, DiagramView, EqSteps, Grid, SlideFrame, Stack } from '@/lib/kit';
import { attnResDetail } from '../diagrams/attn-res-detail.diagram';

/**
 * The depth axis. A standard residual stream is an RNN over layers — one state,
 * uniformly accumulated. AttnRes replaces that accumulation with attention, the
 * same move the Transformer made over sequence position.
 */
export const attnResScene = defineScene(
  {
    id: '04-attn-residuals',
    title: 'Attention Residuals',
    steps: [
      step('bottleneck', 2.8),
      step('sources', 2.6),
      step('query', 2.6),
      step('attend', 2.8),
      step('blockwise', 3.0, { hold: 0.6 }),
    ],
  },
  () => (
    <SlideFrame title="Attention Residuals — 깊이 방향 확장" footer="ML Weekly · Kimi K3 §2.2">
      <Stack gap={3} style={{ height: '100%' }}>
        <DiagramView
          diagram={attnResDetail}
          width={1776}
          height={520}
          stepEffects={{
            // 'emb' never reveals — the frame-0 anchor (hard rule 6); beat 1 just lights it
            bottleneck: { highlight: ['emb'] },
            sources: { reveal: ['b1', 'b2', 'bn', 'partial'], highlight: ['b1', 'b2', 'bn', 'partial'] },
            query: { reveal: ['query', 'attend', 'e-query-attend'], highlight: ['query'], pulse: ['e-query-attend'] },
            attend: {
              reveal: [
                'e-emb-attend',
                'e-b1-attend',
                'e-b2-attend',
                'e-bn-attend',
                'e-partial-attend',
                'layer',
                'e-attend-layer',
              ],
              highlight: ['attend'],
              pulse: ['e-emb-attend', 'e-bn-attend'],
            },
            blockwise: { highlight: ['partial'] },
          }}
        />
        {/* \textstyle keeps the sum's limits inline — a tall \dfrac here would
            eat the callout row below */}
        <EqSteps
          size="md"
          parts={[
            { tex: '\\alpha_{i\\to l} \\;\\propto\\; \\exp\\big(' },
            { tex: 'q_l^{\\top}', step: 'query' },
            { tex: '\\mathrm{RMSNorm}(k_i)\\big)' },
            { tex: ',\\qquad h_l = \\textstyle\\sum_{i=0}^{\\,l-1}' },
            { tex: '\\alpha_{i\\to l}\\, v_i', step: 'attend' },
          ]}
        />
        <Grid columns={3} gap={4} style={{ flex: 1, minHeight: 0 }}>
          <Appear step="bottleneck" effect="rise">
            <Callout title="잔차 스트림 = 깊이 방향의 RNN">
              표준 잔차는 이전 정보를 전부 하나의 상태에 균일하게 눌러 담는다. 시퀀스에서
              recurrence를 attention으로 바꿨던 그 수를, 이번엔 깊이에 그대로 적용한다.
            </Callout>
          </Appear>
          <Appear step="query" effect="rise">
            <Callout title="레이어마다 학습되는 pseudo-query">
              키·값은 이전 레이어 출력 그 자체. RMSNorm을 씌워, 출력 크기가 큰 레이어가 가중치를
              독점하지 못하게 막는다.
            </Callout>
          </Appear>
          <Appear step="blockwise" effect="rise">
            <Callout tone="ok" title="Block AttnRes — O(Ld) → O(Nd)">
              모든 레이어 출력을 살려두면 통신·메모리가 O(Ld). K3는 12개씩 묶어 블록 대표값으로
              합치고 블록 간에만 full attention을 건다 — 8블록 + 임베딩 = 9개 소스.
            </Callout>
          </Appear>
        </Grid>
      </Stack>
    </SlideFrame>
  ),
);

export default attnResScene;
