import React from 'react';
import { defineScene, step, useCurrentStepIndex, useStepProgress } from '@/lib/timeline';
import { Board, Captions, ColumnBars, Fill, Formula, Quantities, Term } from '@/lib/kit';
import { useTheme } from '@/lib/theme';
import { fmtRatio, POS_HIGH, POS_LOW, R_POS, TOKENS } from '../data/correction-ratio-example';
import { pick } from '../quantities';

/**
 * §5.1 (with §4.1, §6.4) — the ratio r of Eq. 1. The copy that wrote an attempt
 * (μ_θold) is a few versions behind the model being updated (π_θ), so every
 * token is reweighted by how much more — or less — the current model would
 * have liked it: r = sg[π_θ / μ_θold].
 *
 * The six ratios are examples (one attempt, six tokens); the axis is
 * logarithmic with its baseline at 1, where the two models agree.
 */
const QUANTITIES = pick('pi', 'mu', 'r', 'A');

const PI = '\\q{pi}{\\pi_\\theta}(o_{i,t})';
const MU = '\\q{mu}{\\mu_{\\theta_{\\mathrm{old}}}}(o_{i,t})';

const Scene: React.FC = () => {
  const t = useTheme();
  const idx = useCurrentStepIndex();
  const growP = useStepProgress('ratio', { portion: [0.35, 0.9] });
  const readP = useStepProgress('read', { portion: [0.1, 0.5] });
  // the two bars the phrase reads out: far above 1, and a little below it
  const pointed = [POS_HIGH, POS_LOW];

  return (
    <Quantities map={QUANTITIES}>
      <Board
        title="풀이를 쓴 모델이 옛날 것이라면?"
        source="MiMo-V2.6 §4.1, §5.1 · 비율은 예시"
        formula={
          <Formula
            size="xl"
            write="stale"
            then={[
              { step: 'ratio', tex: `\\q{r}{r_{i,t}} = \\mathrm{sg}\\!\\left[\\frac{${PI}}{${MU}}\\right]` },
              { step: 'weight', tex: `\\q{r}{r_{i,t}}\\,\\q{A}{A_i}\\,\\log ${PI}` },
            ]}
            indicate={{ key: 'r', step: 'weight', delay: 1.3 }}
          >
            {`${MU} \\;\\neq\\; ${PI}`}
          </Formula>
        }
        figure={
          <Fill>
            {({ width, height }) => (
              <ColumnBars
                width={width}
                height={height}
                values={R_POS}
                progress={growP}
                labels={TOKENS}
                colors={R_POS.map(() => QUANTITIES.r)}
                highlight={idx === 2 ? pointed : []}
                yScale="log"
                yDomain={[0.1, 10]}
                yTicks={[0.2, 1, 5]}
                valueFormat={fmtRatio}
                valueIndices={pointed}
                valueOpacity={readP}
                textSize={t.fontSize.sm}
              />
            )}
          </Fill>
        }
        caption={
          <Captions
            items={[
              { step: 'stale', text: <><Term of="mu">풀이를 쓴 모델</Term>은 <Term of="pi">지금 고치는 모델</Term>보다 몇 걸음 뒤처진 사본입니다</> },
              { step: 'ratio', text: <>그래서 토큰마다 두 모델이 준 확률의 <Term of="r">비</Term>를 구합니다</> },
              { step: 'read', text: <>1보다 크면 지금 모델이 그 토큰을 더 좋아한다는 뜻입니다</> },
              { step: 'weight', text: <>이 <Term of="r">비</Term>를 곱해서 지금 모델 기준으로 무게를 맞춥니다</> },
            ]}
          />
        }
      />
    </Quantities>
  );
};

export const ratioScene = defineScene(
  {
    id: '09-ratio',
    title: '풀이를 쓴 모델이 옛날 것이라면?',
    steps: [step('stale', 2.6), step('ratio', 2.8), step('read', 2.4), step('weight', 2.8, { hold: 0.6 })],
  },
  Scene,
);

export default ratioScene;
