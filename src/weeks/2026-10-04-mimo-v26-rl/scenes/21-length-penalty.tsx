import React from 'react';
import { defineScene, step, useCurrentStepIndex, useStepProgress } from '@/lib/timeline';
import { Board, Captions, ColumnBars, Formula, LineChart, Panels, Quantities, Term } from '@/lib/kit';
import { useTheme } from '@/lib/theme';
import { deductionCurve, lenParams, lenResult, lenReward } from '../data/length-example';
import { INK, pick } from '../quantities';

/**
 * §4.3.3, Eq. 4 — how much a long passing attempt loses. The equation is built
 * one layer per beat while the curve it describes is drawn beside it: the
 * tolerated stretch (up to 1 + δ times the reference), the ramp, the plateau at
 * the maximum deduction X. The last beat applies it to the group of the
 * previous scene: the two long passes drop, everything else stays.
 *
 * The paper publishes none of X, δ, s, γ, A, B, so the curve and the group are
 * examples; every number on screen is computed from `data/length-example.ts`.
 */
const QUANTITIES = { ...pick('len', 'ref', 'cut', 'R'), Rt: INK.R } as const;

const P = lenParams;
const RES = lenResult;
const LABELS = lenReward.map((_, i) => String(i + 1));
/** passing attempts that lose something */
const CUT = RES.passIdx.filter((i) => RES.deduction[i]! > 0);
/** the curve is drawn up to the longest of them, so its label has clear space to the right */
const X_END = Math.max(...CUT.map((i) => RES.ratio[i]!));
const X_DOMAIN: [number, number] = [0, 3];
const CURVE = deductionCurve(X_DOMAIN[0], X_END, 125);
/** where each stage of the curve ends, as a fraction of the plot's width */
const sweepTo = (x: number) => (x - X_DOMAIN[0]) / (X_DOMAIN[1] - X_DOMAIN[0]);
const FLAT_END = sweepTo(1 + P.delta);
const RAMP_END = sweepTo(1 + P.s);

const trim = (v: number) => String(Number(v.toFixed(3)));
const times = (v: number) => (Number.isInteger(v) ? `${v}배` : `${v.toFixed(1)}배`);

/**
 * The equation's layers. Besides the quantities, every piece that survives a
 * beat carries a tag of its own (uncoloured), so it travels as one block when
 * the next layer is wrapped around it instead of being re-paired glyph by glyph.
 */
const RATIO = '\\q{len}{\\ell_i}/\\q{ref}{\\ell_q^{\\star}}';
const EXCESS = `\\q{ex}{${RATIO} - 1 - \\q{tol}{\\delta}}`;
const CLIP = `\\q{clip}{\\mathrm{clip}}\\!\\q{par}{\\left(\\q{arg}{\\frac{${EXCESS}}{\\q{den}{s - \\delta}},\\,0,\\,1}\\right)}`;
const POWER = '^{\\q{pow}{\\gamma}}';
const DEDUCTION = `\\q{cut}{X}\\q{box}{\\left[${CLIP}\\right]}${POWER}`;

const Scene: React.FC = () => {
  const t = useTheme();
  const idx = useCurrentStepIndex();
  const flatP = useStepProgress('tolerate', { portion: [0.15, 0.75], easing: 'inOut' });
  const rampP = useStepProgress('ramp', { portion: [0.2, 0.85], easing: 'inOut' });
  const capP = useStepProgress('cap', { portion: [0.2, 0.75], easing: 'inOut' });
  const pointsP = useStepProgress('apply', { portion: [0.2, 0.45] });
  const applyP = useStepProgress('apply', { portion: [0.4, 0.85], easing: 'inOut' });

  // one line, swept in three stages: flat → ramp → plateau
  const curveP = FLAT_END * flatP + (RAMP_END - FLAT_END) * rampP + (1 - RAMP_END) * capP;

  return (
    <Quantities map={QUANTITIES}>
      <Board
        title="긴 풀이는 얼마나 깎을까?"
        source="MiMo-V2.6 §4.3.3, Eq. 4 (X, δ, s, γ와 풀이들은 예시)"
        formula={
          <Formula
            size="xl"
            write="tolerate"
            then={[
              { step: 'ramp', tex: `${CLIP}${POWER}` },
              { step: 'cap', tex: DEDUCTION },
              {
                step: 'apply',
                tex: `\\q{Rt}{\\widetilde{R}_i} = \\q{R}{R_i} - \\q{pass}{\\mathbf{1}[i \\in \\mathcal{P}_q]}\\;${DEDUCTION}`,
              },
            ]}
            brace={{ key: 'tol', step: 'tolerate', delay: 1.4, until: 'ramp', label: '봐주는 폭' }}
            indicate={[
              { key: 'cut', step: 'cap', delay: 1.3 },
              { key: 'pass', step: 'apply', delay: 1.5 },
            ]}
          >
            {EXCESS}
          </Formula>
        }
        figure={
          <Panels titles={['길이에 따른 감점', '풀이별 점수']}>
            {[
              ({ width, height }) => (
                <LineChart
                  width={width}
                  height={height}
                  series={[
                    // unlabelled: the panel heading names the curve
                    { label: '', color: INK.cut, points: CURVE, progress: curveP },
                    ...CUT.map((i) => ({
                      label: `${i + 1}번`,
                      color: INK.len,
                      points: [{ x: RES.ratio[i]!, y: RES.deduction[i]! }],
                      progress: pointsP,
                    })),
                  ]}
                  xTicks={[1, 2, 3]}
                  yTicks={[0, P.X / 2, P.X]}
                  xFormat={times}
                  xLabel="풀이 길이 ÷ 기준 길이"
                />
              ),
              ({ width, height }) => (
                <ColumnBars
                  width={width}
                  height={height}
                  values={RES.adjusted}
                  from={lenReward}
                  morph={applyP}
                  labels={LABELS}
                  colors={lenReward.map(() => INK.R)}
                  highlight={idx === 3 && applyP > 0 ? CUT : []}
                  yDomain={[0, 1]}
                  yTicks={[0, 0.5, 1]}
                  // every score stays readable, so the two that change can be checked against the rest
                  valueFormat={trim}
                  textSize={t.fontSize.sm}
                />
              ),
            ]}
          </Panels>
        }
        caption={
          <Captions
            items={[
              { step: 'tolerate', text: <><Term of="ref">기준</Term>보다 조금 긴 정도는 봐줍니다</> },
              { step: 'ramp', text: <>그보다 길어질수록 <Term of="cut">감점</Term>이 점점 커집니다</> },
              { step: 'cap', text: <>기준의 {times(1 + P.s)}부터는 <Term of="cut">최대 감점 {trim(P.X)}</Term>에서 멈춥니다</> },
              { step: 'apply', text: <>통과한 풀이의 <Term of="R">점수</Term>에서만 이만큼을 뺍니다</> },
            ]}
          />
        }
      />
    </Quantities>
  );
};

export const lengthPenaltyScene = defineScene(
  {
    id: '21-length-penalty',
    title: '긴 풀이는 얼마나 깎을까?',
    steps: [step('tolerate', 2.6), step('ramp', 2.8), step('cap', 2.6), step('apply', 3.2, { hold: 0.6 })],
  },
  Scene,
);

export default lengthPenaltyScene;
