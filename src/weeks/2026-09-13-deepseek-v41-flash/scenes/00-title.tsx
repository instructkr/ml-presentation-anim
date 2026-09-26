import React from 'react';
import { Appear, defineScene, step } from '@/lib/timeline';
import { Center, Label, SlideFrame, Stack, Title } from '@/lib/kit';

const AGENDA = [
  'Causal Encoder-Decoder: 프롬프트는 층의 절반만 지나간다',
  'CSA2: 여러 층이 KV 캐시 한 벌을 나눠 쓴다',
  'FP4 Main KV Cache: 캐시 값 하나를 4비트에 담는다',
  'SWA Bounded Replay: 금방 버릴 캐시는 저장하지 않고 다시 만든다',
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
          <Title sub="2026-09-13 · ML Weekly · DeepSeek-V4.1-Flash Technical Report">
            DeepSeek-V4.1-Flash의 KV 캐시 압축
          </Title>
          <Appear step="title" effect="fade" delay={0.4}>
            <Label size="sm" color="muted">
              552B 파라미터 · 1M 컨텍스트 · 토큰당 전역 KV 890 bytes (V4-Flash의 약 1/4)
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
