import React from 'react';
import { defineScene, step, useCurrentStepIndex, useStepProgress } from '@/lib/timeline';
import { Board, Captions, ColumnBars, Fill, Quantities, Term } from '@/lib/kit';
import { useTheme } from '@/lib/theme';
import { TASK_MIX, taskIndex, taskShare } from '../data/environment-task-mix';

/**
 * §4.2 / §5.1 — what the RL run practises on. Five bars: the share of each
 * task domain in the mixed-task run (the paper's numbers). After the bars grow
 * in, the highlight walks from domain to domain while the phrase says how that
 * domain is graded; the detail of each pipeline is in the notes.
 * The paper does not describe the context-following tasks, so that bar is
 * never highlighted.
 */
/** one quantity on screen — the share of the RL tasks — so one ink for every bar */
const QUANTITIES = { share: 'purple' } as const;

const percent = (v: number) => `${Math.round(v)}%`;

/** which bar each beat points at (`mix` shows the whole mix) */
const FOCUS: (number | undefined)[] = [
  undefined,
  taskIndex('code'),
  taskIndex('general'),
  taskIndex('visual'),
  taskIndex('cyber'),
];

const Scene: React.FC = () => {
  const t = useTheme();
  const idx = useCurrentStepIndex();
  const growP = useStepProgress('mix', { portion: [0.1, 0.7] });
  const focus = FOCUS[idx];

  return (
    <Quantities map={QUANTITIES}>
      <Board
        title="어떤 과제로 연습할까?"
        source="MiMo-V2.6 §4.2, §5.1"
        figure={
          <Fill>
            {({ width, height }) => (
              <ColumnBars
                width={width}
                height={height}
                values={TASK_MIX.map((d) => d.share)}
                progress={growP}
                labels={TASK_MIX.map((d) => d.label)}
                colors={TASK_MIX.map(() => QUANTITIES.share)}
                highlight={focus === undefined ? [] : [focus]}
                yDomain={[0, 80]}
                yTicks={[0, 20, 40, 60, 80]}
                yFormat={percent}
                valueFormat={percent}
                textSize={t.fontSize.sm}
              />
            )}
          </Fill>
        }
        caption={
          <Captions
            items={[
              { step: 'mix', text: <>RL 과제의 <Term of="share">{taskShare('code')}%</Term>가 코딩입니다</> },
              { step: 'code', text: <>코딩은 테스트를 돌려서 채점합니다</> },
              { step: 'general', text: <>도구 사용 과제는 항목별 체크리스트로 채점합니다</> },
              { step: 'visual', text: <>디자인은 같은 과제의 결과물끼리 견주어 채점합니다</> },
              { step: 'cyber', text: <>보안은 충돌의 종류와 위치가 맞아야 통과입니다</> },
            ]}
          />
        }
      />
    </Quantities>
  );
};

export const taskMixScene = defineScene(
  {
    id: '12-task-mix',
    title: '어떤 과제로 연습할까?',
    steps: [step('mix', 2.4), step('code', 2.2), step('general', 2.2), step('visual', 2.2), step('cyber', 2.2, { hold: 0.6 })],
  },
  Scene,
);

export default taskMixScene;
