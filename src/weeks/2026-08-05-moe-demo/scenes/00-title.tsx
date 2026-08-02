import React from 'react';
import { Appear, defineScene, step } from '@/lib/timeline';
import { Center, Label, SlideFrame, Stack, Title } from '@/lib/kit';

const AGENDA = ['전체 아키텍처 탐색', 'Attention 내부 동작', 'Router와 Top-K 선택', 'Tensor Parallelism (3D)'];

export const titleScene = defineScene(
  {
    id: '00-title',
    title: '타이틀',
    steps: [step('title', 1.6), step('agenda', 2.2, { hold: 0.6 })],
  },
  () => (
    <SlideFrame footer="ML Weekly">
      <Center>
        <Stack gap={8} align="center">
          <Appear step="title" effect="rise">
            <Title sub="2026-08-05 · ML Weekly">Mixture of Experts 아키텍처 해부</Title>
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
