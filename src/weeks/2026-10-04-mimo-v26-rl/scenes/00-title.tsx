import React from 'react';
import { defineScene, step } from '@/lib/timeline';
import { Board, Center, Phrase, Stack, Title } from '@/lib/kit';

const AGENDA = [
  'RL 전 준비: Mid-training과 Muown',
  'RL 한 스텝과 Eq. 1',
  '환경과 harness',
  '채점: GRS, GAR, 감점',
  '30 스텝에서 얻은 교훈',
  'MOPD2',
];

/** Title — the heading is static (the frame-0 anchor); only the agenda lines are wiped in. */
export const titleScene = defineScene(
  {
    id: '00-title',
    title: '타이틀',
    steps: [step('agenda', 3.0, { hold: 0.6 })],
  },
  () => (
    <Board source="ML Weekly · MiMo-V2.6 Technical Report (Xiaomi LLM-Core)">
      <Center>
        <Stack gap={8} align="center">
          <div style={{ textAlign: 'center' }}>
            <Title sub="구조는 건너뛰고 학습만 봅니다">MiMo-V2.6: RL을 키우는 법</Title>
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
