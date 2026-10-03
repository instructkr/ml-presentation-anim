import React from 'react';
import { defineScene, step, useCurrentStepIndex, useStepProgress } from '@/lib/timeline';
import { Board, Captions, ColumnBars, Fill, Formula, Quantities, Term } from '@/lib/kit';
import { useTheme } from '@/lib/theme';
import { SIGMA0, SIGMA_FLAT } from '../data/newton-schulz';
import { INK, pick } from '../quantities';

/**
 * §3.2 — why MiMo left AdamW before RL. One update matrix (the momentum M,
 * 예시) taken apart into directions: the bars are its singular values, the
 * strength of each direction. They start lopsided; Muon's Newton–Schulz
 * iteration pulls every one of them to about 1.
 *
 * Every bar is computed in data/newton-schulz.ts: the first values are SIGMA0,
 * the flattened ones are ten Newton–Schulz steps applied to them (MiMo's RL
 * setting, §5.1).
 */
const QUANTITIES = pick('sigma');

const LABELS = SIGMA0.map((_, i) => `방향 ${i + 1}`);
const STRONGEST = SIGMA0.indexOf(Math.max(...SIGMA0));
const WEAKEST = SIGMA0.indexOf(Math.min(...SIGMA0));

const two = (v: number) => v.toFixed(2);

const Scene: React.FC = () => {
  const t = useTheme();
  const idx = useCurrentStepIndex();
  const growP = useStepProgress('lopsided', { portion: [0.1, 0.7] });
  const labelsP = useStepProgress('dominate', { portion: [0.1, 0.5] });
  const labelsOut = useStepProgress('flatten', { portion: [0, 0.12] });
  const lineP = useStepProgress('flatten', { portion: [0, 0.3] });
  const flatP = useStepProgress('flatten', { portion: [0.15, 0.85], easing: 'inOut' });
  const allP = useStepProgress('batch', { portion: [0.1, 0.5] });

  return (
    <Quantities map={QUANTITIES}>
      <Board
        title="왜 AdamW를 떠났을까?"
        source="MiMo-V2.6 §3.2 · Muon (Jordan et al., 2024)"
        formula={
          <Formula
            size="xl"
            write="lopsided"
            then={[{ step: 'flatten', tex: '\\Delta W = \\q{out}{U\\,V^{\\top}}' }]}
            brace={{ key: 'sigma', step: 'lopsided', delay: 1.5, until: 'flatten', label: '방향별 세기', color: INK.sigma }}
            box={{ key: 'out', step: 'batch', delay: 0.4 }}
          >
            {'M = U\\,\\q{sigma}{\\Sigma}\\,V^{\\top}'}
          </Formula>
        }
        figure={
          <Fill>
            {({ width, height }) => (
              <ColumnBars
                width={width}
                height={height}
                values={idx >= 2 ? SIGMA_FLAT : SIGMA0}
                from={idx >= 2 ? SIGMA0 : undefined}
                morph={idx >= 2 ? flatP : 1}
                progress={growP}
                labels={LABELS}
                colors={SIGMA0.map(() => INK.sigma)}
                highlight={idx === 1 ? [STRONGEST] : []}
                // kept in the array from frame 0 and faded in, so the plot never re-flows
                refLines={[{ value: 1, label: '세기 1', color: 'textSecondary', opacity: lineP }]}
                yDomain={[0, 1.2]}
                yTicks={[0, 0.5, 1]}
                valueFormat={two}
                // the strongest and the weakest direction carry their number first; every bar does at the end
                valueIndices={idx >= 3 ? undefined : [STRONGEST, WEAKEST]}
                valueOpacity={idx >= 3 ? allP : idx === 2 ? 1 - labelsOut : idx === 1 ? labelsP : 0}
                textSize={t.fontSize.sm}
              />
            )}
          </Fill>
        }
        caption={
          <Captions
            items={[
              { step: 'lopsided', text: <>업데이트를 방향별로 나눠 보면 <Term of="sigma">세기</Term>가 제각각입니다</> },
              { step: 'dominate', text: <>센 방향 한두 개가 업데이트를 거의 다 가져갑니다</> },
              { step: 'flatten', text: <>Muon은 모든 방향의 <Term of="sigma">세기</Term>를 1 근처로 맞춥니다</> },
              { step: 'batch', text: <>배치가 아주 클 때 AdamW보다 데이터를 잘 살립니다</> },
            ]}
          />
        }
      />
    </Quantities>
  );
};

export const adamwVsMuonScene = defineScene(
  {
    id: '02-adamw-vs-muon',
    title: '왜 AdamW를 떠났을까?',
    steps: [step('lopsided', 2.8), step('dominate', 2.4), step('flatten', 3.0), step('batch', 2.6, { hold: 0.6 })],
  },
  Scene,
);

export default adamwVsMuonScene;
