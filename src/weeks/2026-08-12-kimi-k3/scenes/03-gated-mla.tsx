import React from 'react';
import { Appear, defineScene, step } from '@/lib/timeline';
import { Callout, DiagramView, EqSteps, Grid, SlideFrame, Stack } from '@/lib/kit';
import { gatedMlaDetail } from '../diagrams/gated-mla-detail.diagram';

/**
 * The 1-in-4 layer that still does real global attention: MLA's latent KV
 * cache, NoPE, and the same full-rank output gate KDA uses.
 */
export const gatedMlaScene = defineScene(
  {
    id: '03-gated-mla',
    title: 'Gated MLA',
    steps: [
      step('compress', 2.6),
      step('reconstruct', 2.4),
      step('attend', 2.6),
      step('nope', 2.8),
      step('gate', 2.8, { hold: 0.6 }),
    ],
  },
  () => (
    <SlideFrame title="Gated MLA — 블록마다 한 번의 전역 어텐션" footer="ML Weekly · Kimi K3 §2.1.2">
      <Stack gap={5} justify="center" style={{ height: '100%' }}>
        <DiagramView
          diagram={gatedMlaDetail}
          width={1776}
          height={280}
          stepEffects={{
            // 'x' stays out of every reveal — the frame-0 anchor (hard rule 6)
            compress: { reveal: ['cache', 'e-x-cache'], highlight: ['cache'] },
            reconstruct: { reveal: ['up', 'e-cache-up'], highlight: ['up'] },
            attend: { reveal: ['attn', 'e-up-attn'], highlight: ['attn'] },
            nope: { highlight: ['attn'] },
            gate: {
              reveal: ['gate', 'y', 'e-attn-gate', 'e-x-gate', 'e-gate-y'],
              highlight: ['gate'],
              pulse: ['e-x-gate'],
            },
          }}
        />
        <EqSteps
          size="md"
          parts={[
            { tex: 'c_t = W_c x_t', step: 'compress' },
            { tex: '\\;\\Rightarrow\\;' },
            { tex: 'K,V = W_{\\uparrow}c_t', step: 'reconstruct' },
            { tex: ',\\qquad' },
            { tex: 'y_t = W_o\\big[' },
            { tex: '\\sigma(W_g x_t)', step: 'gate' },
            { tex: '\\odot\\, \\tilde o_t', step: 'attend' },
            { tex: '\\big]' },
          ]}
        />
        <Grid columns={3} gap={4}>
          <Appear step="compress" effect="rise">
            <Callout title="KV 캐시는 잠재 벡터 하나">
              헤드별 K/V를 통째로 캐싱하지 않고 저차원 잠재 벡터만 저장한 뒤, 어텐션 시점에 다시
              펼친다. 1M 컨텍스트의 메모리를 감당하는 쪽이 이 레이어다.
            </Callout>
          </Appear>
          <Appear step="nope" effect="rise">
            <Callout tone="ok" title="NoPE — 위치 인코딩 없음">
              K2와 달리 MLA 레이어에는 위치 인코딩을 전혀 주지 않는다. 위치·최신성은 사이의 KDA
              3개가 담당하고, MLA는 순수한 전역 내용 매칭만 한다. 컨텍스트를 늘릴 때 RoPE base를
              다시 튜닝하거나 YaRN을 붙일 필요가 사라진다.
            </Callout>
          </Appear>
          <Appear step="gate" effect="rise">
            <Callout title="3:1 하이브리드">
              KDA 3 + Gated MLA 1이 블록 단위로 반복되고, 백본 맨 끝에 Gated MLA를 하나 더 두어
              마지막 레이어는 항상 전역 어텐션이 되게 한다.
            </Callout>
          </Appear>
        </Grid>
      </Stack>
    </SlideFrame>
  ),
);

export default gatedMlaScene;
