import React from 'react';
import { Appear, defineScene, step } from '@/lib/timeline';
import { Center, Label, SlideFrame, Stack, Title } from '@/lib/kit';

const AGENDA = [
  'Kimi Delta Attention — 선형 어텐션의 게이트',
  'Gated MLA — 3:1 하이브리드의 전역 레이어',
  'Attention Residuals — 깊이 방향 어텐션',
  'Stable LatentMoE — 896개 중 16개',
];

export const titleScene = defineScene(
  {
    id: '00-title',
    title: '타이틀',
    steps: [step('title', 1.6), step('agenda', 2.4, { hold: 0.6 })],
  },
  () => (
    <SlideFrame footer="ML Weekly">
      <Center>
        <Stack gap={8} align="center">
          {/* the title is the frame-0 anchor (hard rule 6) — only sub-elements animate */}
          <Title sub="2026-08-12 · ML Weekly · Kimi K3 Technical Report">
            Kimi K3 아키텍처 해부
          </Title>
          <Appear step="title" effect="fade" delay={0.4}>
            <Label size="sm" color="muted">
              2.8T 파라미터 · 토큰당 104B 활성 · 1M 컨텍스트
            </Label>
          </Appear>
          <Stack gap={3} align="flex-start">
            {AGENDA.map((item, i) => (
              <Appear key={item} step="agenda" index={i} effect="left">
                <Label size="md" color="textSecondary">
                  {i + 1}. {item}
                </Label>
              </Appear>
            ))}
          </Stack>
        </Stack>
      </Center>
    </SlideFrame>
  ),
);

export default titleScene;
