import React from 'react';
import { defineScene, step } from '@/lib/timeline';
import { Board, Center, Phrase, Stack, Title } from '@/lib/kit';

const AGENDA = ['차트와 수식', '그림 따라가기', '그림과 수식', '수식 유도', '3D'];

/**
 * Title — the one scene that uses the Board's free-form children. The title is
 * static (the frame-0 anchor); only the agenda lines are wiped in.
 */
export const titleScene = defineScene(
  {
    id: '00-title',
    title: '타이틀',
    steps: [step('agenda', 2.6, { hold: 0.6 })],
  },
  () => (
    <Board source="ML Weekly · 2026-10-03">
      <Center>
        <Stack gap={8} align="center">
          <div style={{ textAlign: 'center' }}>
            <Title sub="장면 다섯 가지로 보는 새 스타일">칠판 방식 레퍼런스</Title>
          </div>
          <Stack gap={2} align="center">
            {AGENDA.map((item, i) => (
              <Phrase key={item} step="agenda" delay={i * 0.35} color="textSecondary">
                {i + 1}. {item}
              </Phrase>
            ))}
          </Stack>
        </Stack>
      </Center>
    </Board>
  ),
);

export default titleScene;
