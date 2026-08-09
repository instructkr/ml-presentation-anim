import React from 'react';
import { Appear, defineScene, step } from '@/lib/timeline';
import { Callout, DiagramView, SlideFrame, Stack } from '@/lib/kit';
import { k3Ids, kimiK3Arch } from '../diagrams/kimi-k3-arch.diagram';

/**
 * The paper's Figure 2, assembled in the four beats it reads in: the repeating
 * block, the depth-wise residual wiring, then each magnified panel.
 */
export const architectureScene = defineScene(
  {
    id: '01-architecture',
    title: '전체 아키텍처',
    steps: [
      step('spine', 2.6),
      step('attnres', 2.8),
      step('smoe', 2.4),
      step('kda', 2.6, { hold: 0.8 }),
    ],
  },
  () => (
    <SlideFrame title="Kimi K3: 세 방향으로 확장한 정보 흐름" footer="ML Weekly · Kimi K3">
      <Stack direction="row" gap={4} style={{ height: '100%' }}>
        <DiagramView
          diagram={kimiK3Arch}
          width={1250}
          height={820}
          stepEffects={{
            // panel box + Embedding stay visible from frame 0 — the anchor (hard rule 6)
            spine: { reveal: k3Ids.spine.filter((id) => id !== 'block-panel') },
            attnres: { reveal: k3Ids.attnRes.filter((id) => id !== 'embedding') },
            smoe: { reveal: k3Ids.smoePanel, highlight: ['smoe-hi', 'smoe-lo'] },
            kda: { reveal: k3Ids.kdaPanel, highlight: ['kda'] },
          }}
        />
        <Stack gap={4} justify="center" style={{ flex: 1 }}>
          <Appear step="spine" effect="rise">
            <Callout title="블록 = 3×(KDA + MoE) + 1×(MLA + MoE)">
              선형 어텐션 KDA 3개마다 전역 어텐션 Gated MLA 1개. 어텐션 레이어마다 Stable
              LatentMoE가 뒤따른다.
            </Callout>
          </Appear>
          <Appear step="attnres" effect="rise">
            <Callout title="Attention Residuals — 깊이">
              학습된 pseudo-query w로 임베딩과 이전 블록 출력을 골라 읽는다 (α). 잔차가 한 줄로
              눌리지 않는다.
            </Callout>
          </Appear>
          <Appear step="smoe" effect="fade">
            <Callout title="Stable LatentMoE — 너비">
              Shared 2개는 full-width, Routed 896개 중 16개만 latent 폭에서 활성 (희소도 56).
            </Callout>
          </Appear>
          <Appear step="kda" effect="fade">
            <Callout title="Kimi Delta Attention — 길이">
              채널별 forget gate를 붙인 delta-rule. 입력이 q·k·v·α·β 다섯 갈래로 갈라진다.
            </Callout>
          </Appear>
        </Stack>
      </Stack>
    </SlideFrame>
  ),
);

export default architectureScene;
