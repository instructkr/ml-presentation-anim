import React from 'react';
import { interpolateColors } from 'remotion';
import { defineScene, step, useCurrentStepIndex, useStepProgress } from '@/lib/timeline';
import { Board, Captions, ColumnBars, Formula, Panels, Quantities, Term } from '@/lib/kit';
import { useTheme } from '@/lib/theme';
import { LABELS, SLOWEST, concurrencyShare, demandShare, pct, read, targetShare } from '../data/mixer-concurrency';
import { pick } from '../quantities';

/**
 * §6.3, Eq. 6 — Adaptive Rollout Concurrency, the first mechanism of the
 * Sample Mixer. The left panel is what the batch asks of each source (its
 * target share B, Fig. 16's legend) and never changes; the right panel is what
 * that costs on the Rollout side: first the groups that have to be generated
 * (m = B / r), then the rollouts that have to be running at once (t · m). The
 * equation follows the right panel and ends on Eq. 6, the per-source headroom.
 *
 * Every number is the paper's legend value or arithmetic on it
 * (`data/mixer-concurrency.ts`); the last panel matches the occupancy lines of
 * Fig. 16's bottom row.
 */
/** m is this scene's own: the groups a source has to generate. Maroon keeps it apart from t (blue) and r (green). */
const QUANTITIES = { ...pick('share', 'accept', 'time', 'slots'), m: 'maroon' } as const;

const CODE2 = read('code2');
const FRACTION = '\\frac{\\q{share}{B_i}}{\\q{accept}{r_i}}';
const percent = (v: number) => `${v}%`;

const Scene: React.FC = () => {
  const t = useTheme();
  const idx = useCurrentStepIndex();
  const targetP = useStepProgress('target', { portion: [0.1, 0.7] });
  const demandP = useStepProgress('accept', { portion: [0.4, 0.9] });
  const timeP = useStepProgress('time', { portion: [0.3, 0.85], easing: 'inOut' });

  // the right panel changes what it counts: groups to generate (m's ink), then rollouts running at once (gold)
  const rightColor = interpolateColors(timeP, [0, 1], [t.palette.ink[QUANTITIES.m], t.palette.ink[QUANTITIES.slots]]);
  const pointed = idx === 3 ? [CODE2.index] : [];

  const axis = {
    labels: LABELS,
    yDomain: [0, 50] as [number, number],
    yTicks: [0, 10, 20, 30, 40, 50],
    yFormat: percent,
    valueFormat: pct,
    textSize: t.fontSize.sm,
  };

  return (
    <Quantities map={QUANTITIES}>
      <Board
        title="느린 과제는 얼마나 더 돌려야 할까?"
        source="MiMo-V2.6 §6.3, Eq. 6, 그림 16"
        formula={
          <Formula
            size="xl"
            write="accept"
            then={[
              // `conc` wraps the product so the brace can sit under all of it
              { step: 'time', tex: `\\q{conc}{\\q{time}{t_i}\\,\\q{m}{m_i}} = \\q{time}{t_i} \\cdot ${FRACTION}` },
              {
                step: 'spare',
                tex: '\\q{p}{p_i} = \\mathrm{clip}\\!\\left(c\\,\\q{time}{t_i} - 1,\\; p_{\\min},\\; p_{\\max}\\right)',
              },
            ]}
            brace={[
              { key: 'conc', step: 'time', delay: 1.5, until: 'spare', label: '필요한 자리', color: QUANTITIES.slots },
              { key: 'p', step: 'spare', delay: 1.5, label: '여유분' },
            ]}
          >
            {`\\q{m}{m_i} = ${FRACTION}`}
          </Formula>
        }
        figure={
          <Panels titles={[<Term of="share">배치에서 차지하는 몫</Term>, 'Rollout에서 차지하는 몫']}>
            {[
              ({ width, height }) => (
                <ColumnBars
                  width={width}
                  height={height}
                  values={targetShare}
                  progress={targetP}
                  colors={targetShare.map(() => QUANTITIES.share)}
                  highlight={pointed}
                  {...axis}
                />
              ),
              ({ width, height }) => (
                <ColumnBars
                  width={width}
                  height={height}
                  values={idx >= 2 ? concurrencyShare : demandShare}
                  from={idx >= 2 ? demandShare : undefined}
                  morph={idx >= 2 ? timeP : 1}
                  progress={demandP}
                  colors={demandShare.map(() => rightColor)}
                  highlight={idx === 4 ? SLOWEST : pointed}
                  {...axis}
                />
              ),
            ]}
          </Panels>
        }
        caption={
          <Captions
            items={[
              { step: 'target', text: <>배치에서 과제 종류마다 차지할 <Term of="share">몫</Term>은 미리 정해 둡니다</> },
              { step: 'accept', text: <><Term of="accept">받아들이는 비율</Term>이 낮은 과제는 그만큼 <Term of="m">더 풀어야</Term> 합니다</> },
              { step: 'time', text: <><Term of="time">오래 걸리는</Term> 과제는 그 시간만큼 <Term of="slots">자리</Term>를 더 차지합니다</> },
              {
                step: 'read',
                text: (
                  <>
                    {CODE2.label}는 <Term of="share">배치의 {pct(CODE2.target)}</Term>를 채우려고 <Term of="slots">자리의 {pct(CODE2.concurrencyShare)}</Term>를 씁니다
                  </>
                ),
              },
              { step: 'spare', text: <>느린 과제일수록 여유분을 더 얹어서 미리 시작합니다</> },
            ]}
          />
        }
      />
    </Quantities>
  );
};

export const mixerConcurrencyScene = defineScene(
  {
    id: '36-mixer-concurrency',
    title: '느린 과제는 얼마나 더 돌려야 할까?',
    steps: [step('target', 2.4), step('accept', 2.8), step('time', 3.0), step('read', 2.4), step('spare', 3.0, { hold: 0.6 })],
  },
  Scene,
);

export default mixerConcurrencyScene;
