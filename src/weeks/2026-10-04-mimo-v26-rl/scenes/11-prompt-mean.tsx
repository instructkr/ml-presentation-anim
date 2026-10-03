import React from 'react';
import { defineScene, step, useCurrentStepIndex, useStepProgress } from '@/lib/timeline';
import { Board, Captions, ColumnBars, Fill, Formula, Quantities, Term } from '@/lib/kit';
import { useTheme } from '@/lib/theme';
import { GROUPS, groupTokensK, lengthRatio, man, pct, promptShare, tokenShare } from '../data/correction-prompt-mean';
import { INK } from '../quantities';

/**
 * §5.1 — the 1/Σ|oᵢ| term of Eq. 1 (prompt-mean aggregation). Two prompts of
 * one batch, sixteen attempts each: averaged over every token of the batch the
 * long prompt owns almost all of the loss; averaged per prompt first, both get
 * the same share. The attempt lengths are examples; every number on screen is
 * computed from them.
 */
const QUANTITIES = { norm: INK.norm, short: 'teal', long: INK.len } as const;

const [SHORT, LONG] = [0, 1];
/** each column is named by its prompt and its token total, so the picture can be checked by eye */
const LABELS = GROUPS.map((g, i) => `${g.label} · 토큰 ${man(groupTokensK[i]!)}`);

/** the per-prompt normaliser of Eq. 1 */
const PER_PROMPT = '\\q{norm}{\\sum_{i}|o_i|}';

const Scene: React.FC = () => {
  const t = useTheme();
  const idx = useCurrentStepIndex();
  const growP = useStepProgress('tokens', { portion: [0.15, 0.75] });
  const shareP = useStepProgress('share', { portion: [0.1, 0.5] });
  const promptP = useStepProgress('prompt', { portion: [0.2, 0.85], easing: 'inOut' });

  return (
    <Quantities map={QUANTITIES}>
      <Board
        title="긴 풀이가 학습을 독차지하지 않으려면?"
        source="MiMo-V2.6 §5.1 · 길이는 예시"
        formula={
          <Formula
            size="xl"
            write="share"
            // per prompt, only its own tokens are counted: the sum over prompts drops out of the denominator
            then={[{ step: 'prompt', tex: `\\q{whole}{\\frac{1}{${PER_PROMPT}}}` }]}
            box={{ key: 'whole', step: 'why', delay: 0.5 }}
          >
            {`\\frac{1}{\\sum_{q}\\,${PER_PROMPT}}`}
          </Formula>
        }
        figure={
          <Fill>
            {({ width, height }) => (
              <ColumnBars
                width={width}
                height={height}
                values={idx >= 2 ? promptShare : tokenShare}
                from={idx >= 2 ? tokenShare : undefined}
                morph={idx >= 2 ? promptP : 1}
                progress={growP}
                labels={LABELS}
                colors={[QUANTITIES.short, QUANTITIES.long]}
                refLines={[{ value: promptShare[SHORT]!, label: '같은 몫', color: QUANTITIES.norm, opacity: promptP }]}
                yDomain={[0, 100]}
                yTicks={[0, 25, 50, 75, 100]}
                yFormat={pct}
                valueFormat={pct}
                valueOpacity={shareP}
                textSize={t.fontSize.sm}
              />
            )}
          </Fill>
        }
        caption={
          <Captions
            items={[
              { step: 'tokens', text: <><Term of="long">긴 과제</Term>는 <Term of="short">짧은 과제</Term>보다 토큰이 {lengthRatio}배 많습니다</> },
              { step: 'share', text: <>토큰 전체로 평균 내면 <Term of="long">긴 과제</Term>가 {pct(tokenShare[LONG]!)}를 차지합니다</> },
              { step: 'prompt', text: <>과제마다 <Term of="norm">자기 토큰 수</Term>로 나누면 몫이 같아집니다</> },
              { step: 'why', text: <>그래서 길게 푼다고 목소리가 커지지 않습니다</> },
            ]}
          />
        }
      />
    </Quantities>
  );
};

export const promptMeanScene = defineScene(
  {
    id: '11-prompt-mean',
    title: '긴 풀이가 학습을 독차지하지 않으려면?',
    steps: [step('tokens', 2.4), step('share', 2.6), step('prompt', 2.8), step('why', 2.4, { hold: 0.6 })],
  },
  Scene,
);

export default promptMeanScene;
