import React from 'react';
import { Appear, defineScene, step } from '@/lib/timeline';
import { Center, Label, SlideFrame, Stack, Title } from '@/lib/kit';

const AGENDA = [
  '왜 메모리인가: 모델은 고정된 이름을 층을 써서 다시 조립한다',
  '조회: 직전 N개 토큰을 해시해 테이블에서 한 줄을 꺼낸다',
  '게이트: 현재 문맥과 어긋나는 메모리는 끈다',
  '시스템: 주소가 입력만으로 정해지니 호스트 메모리에서 미리 가져온다',
  'V4.1의 테이블 학습: Adam 대신 Sinkhorn 균형 갱신 (Algorithm 1)',
];

export const titleScene = defineScene(
  {
    id: '00-title',
    title: '타이틀',
    steps: [step('title', 1.6), step('agenda', 2.6, { hold: 0.6 })],
  },
  () => (
    <SlideFrame footer="ML Weekly">
      <Center>
        <Stack gap={8} align="center">
          {/* the title is the frame-0 anchor (hard rule 6) — only sub-elements animate */}
          <Title sub="2026-09-20 · ML Weekly · Conditional Memory via Scalable Lookup (arXiv 2601.07372)">
            Engram: 조회로 만드는 조건부 메모리
          </Title>
          <Appear step="title" effect="fade" delay={0.4}>
            <Label size="sm" color="muted">
              MoE와 나란한 두 번째 희소성 · DeepSeek-V4.1-Flash에 196B 파라미터로 탑재
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
