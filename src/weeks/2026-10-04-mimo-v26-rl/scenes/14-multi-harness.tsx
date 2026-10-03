import React from 'react';
import { defineScene, step, useCurrentStepIndex, useStepProgress } from '@/lib/timeline';
import { Board, Captions, Fill, LineChart, Quantities, Term } from '@/lib/kit';
import { TRAINING_HARNESSES, fig10HeldOut, fig10Summary, fig10Training } from '../data/environment-fig10';

/**
 * §4.2.5 / §5.3, Fig. 10 — multi-harness training. Pass@1 on DeepSWE v1.1,
 * averaged over the four mini-harnesses the model trains in and over three
 * harnesses it never trained in (codex, claude code, mini-swe-agent). The
 * axes are on screen from frame 0; each mean is swept in on its own beat.
 * The points were read off the figure (approximate).
 */
/** two lines, two inks: the harnesses used in training, and the ones never seen */
const QUANTITIES = { seen: 'blue', unseen: 'gold' } as const;

const percent = (v: number) => `${v}%`;
const whole = (v: number) => Math.round(v);
/** the number of training harnesses, as the phrase says it */
const COUNT_WORD = ['', '한', '두', '세', '네', '다섯'][TRAINING_HARNESSES]!;

const Scene: React.FC = () => {
  const idx = useCurrentStepIndex();
  const seenP = useStepProgress('mini', { portion: [0.1, 0.8], easing: 'inOut' });
  const unseenP = useStepProgress('heldout', { portion: [0.1, 0.8], easing: 'inOut' });

  return (
    <Quantities map={QUANTITIES}>
      <Board
        title="처음 보는 harness에서도 통할까?"
        source="MiMo-V2.6 §4.2.5, §5.3, 그림 10 (그래프에서 읽은 근사값)"
        figure={
          <Fill>
            {({ width, height }) => (
              <LineChart
                width={width}
                height={height}
                series={[
                  { label: '학습에 쓴 harness', color: QUANTITIES.seen, points: fig10Training, progress: seenP },
                  { label: '처음 보는 harness', color: QUANTITIES.unseen, points: fig10HeldOut, progress: unseenP },
                ]}
                // pinned, so the axes already cover both lines on frame 0 and never rescale
                xTicks={[1, 10, 20, 30]}
                yTicks={[50, 55, 60, 65, 70]}
                yFormat={percent}
                xLabel="RL 스텝"
                yLabel="DeepSWE 통과율"
                highlightSeries={idx === 2 ? 1 : undefined}
              />
            )}
          </Fill>
        }
        caption={
          <Captions
            items={[
              { step: 'mini', text: <>도구를 쥐여 주는 틀인 <Term of="seen">harness를 {COUNT_WORD} 가지</Term> 섞어 학습합니다</> },
              { step: 'heldout', text: <><Term of="unseen">써 본 적 없는</Term> Codex, Claude Code에서도 같이 오릅니다</> },
              {
                step: 'gap',
                text: (
                  <>
                    <Term of="unseen">처음 보는 harness</Term>의 통과율이 {whole(fig10Summary.heldOutStart)}%에서 {whole(fig10Summary.heldOutEnd)}%로 올랐습니다
                  </>
                ),
              },
            ]}
          />
        }
      />
    </Quantities>
  );
};

export const multiHarnessScene = defineScene(
  {
    id: '14-multi-harness',
    title: '처음 보는 harness에서도 통할까?',
    steps: [step('mini', 2.8), step('heldout', 2.8), step('gap', 2.4, { hold: 0.6 })],
  },
  Scene,
);

export default multiHarnessScene;
