import React from 'react';
import { Appear, defineScene, step } from '@/lib/timeline';
import { Center, Label, SlideFrame, Spec, Stack, Title } from '@/lib/kit';

const AGENDA = [
  '옵티마이저: AdamW에서 Muown으로',
  'RL 한 스텝과 목적함수',
  '채점으로 보상 다듬기: GRS · GAR',
  '행동 페널티',
  'RL 이후: MOPD2',
];

export const titleScene = defineScene(
  {
    id: '00-title',
    title: '타이틀',
    steps: [step('title', 1.8), step('agenda', 2.6, { hold: 0.6 })],
  },
  () => (
    <SlideFrame footer="ML Weekly · MiMo-V2.6">
      <Center>
        <Stack gap={7} align="center">
          {/* the title is the frame-0 anchor (hard rule 6); only the lines under it animate */}
          <div style={{ textAlign: 'center' }}>
            <Title sub="옵티마이저 설정과 RL 목적함수">MiMo-V2.6 학습 레시피</Title>
          </div>
          <Appear step="title" effect="fade" delay={0.3}>
            <Stack gap={3} align="center">
              <Label size="sm" color="muted">
                2026-09-27 · ML Weekly · MiMo-V2.6 Technical Report (Xiaomi LLM-Core)
              </Label>
              <Stack direction="row" gap={3} justify="center">
                <Spec label="Pro">1.02T · 활성 42B</Spec>
                <Spec label="Flash">310B · 활성 15B</Spec>
                <Spec label="RL">30 스텝</Spec>
              </Stack>
            </Stack>
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
