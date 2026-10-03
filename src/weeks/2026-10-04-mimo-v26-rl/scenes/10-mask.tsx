import React from 'react';
import { defineScene, step, useCurrentStepIndex, useStepProgress } from '@/lib/timeline';
import { Board, Captions, ColumnBars, Formula, Panels, Quantities, Term } from '@/lib/kit';
import { useTheme } from '@/lib/theme';
import {
  type Bounds,
  fmtRatio,
  INITIAL,
  lerpBounds,
  LOW_ENTROPY_NEG,
  LOW_ENTROPY_POS,
  outside,
  R_NEG,
  R_POS,
  TOKENS,
} from '../data/correction-ratio-example';
import { INK, pick } from '../quantities';

/**
 * §5.1 — the mask M of Eq. 1. A token stays in the loss only while its ratio r
 * sits inside a range; outside it the token is dropped, not clipped. The range
 * is kept separately for attempts above the group average (A ≥ 0) and below it
 * (A < 0); both start at [0.2, 5.0], and when the model's answers narrow down
 * (entropy too low) the first widens and the second narrows.
 *
 * The twelve ratios are examples, and so is how far the ranges move — the
 * paper gives directions only. Which bars are faded follows from the ratios and
 * the current range every frame, so a bar flips exactly when a bound passes it.
 */
const QUANTITIES = { ...pick('r', 'M'), bound: 'gold', pos: INK.A, neg: INK.neg } as const;

const one = (v: number) => v.toFixed(1);
const range = (lo: string, hi: string) =>
  `\\mathbf{1}\\!\\left[\\,\\q{bound}{${lo}} \\le \\q{r}{r_{i,t}} \\le \\q{bound}{${hi}}\\,\\right]`;
const LHS = '\\q{M}{M_{i,t}} =';

/** one attempt's ratios on the log axis of scene 09, with the range it has to stay in */
const RatioBars: React.FC<{
  values: number[];
  bounds: Bounds;
  bandP: number;
  maskOn: boolean;
  movedP: number;
  width: number;
  height: number;
}> = ({ values, bounds, bandP, maskOn, movedP, width, height }) => {
  const t = useTheme();
  const out = maskOn ? outside(values, bounds) : [];
  // a bar carries its number while it is, or started, outside the range
  const labelled = [...new Set([...outside(values, INITIAL), ...out])];
  return (
    <ColumnBars
      width={width}
      height={height}
      values={values}
      labels={TOKENS}
      colors={values.map(() => QUANTITIES.r)}
      muted={out}
      bands={[{ from: bounds[0], to: bounds[1], color: QUANTITIES.bound, opacity: 0.18 * bandP }]}
      // the starting range stays behind as two faint lines once the band moves away from it
      refLines={INITIAL.map((value) => ({ value, color: 'muted', opacity: movedP }))}
      yScale="log"
      yDomain={[0.1, 10]}
      yTicks={[0.2, 1, 5]}
      valueFormat={fmtRatio}
      valueIndices={labelled}
      valueOpacity={bandP}
      textSize={t.fontSize.sm}
    />
  );
};

const Scene: React.FC = () => {
  const idx = useCurrentStepIndex();
  const bandP = useStepProgress('band', { portion: [0.1, 0.5] });
  // the out-of-range bars fade once, a moment into the beat, not on its first frame
  const dropP = useStepProgress('drop', { portion: [0.1, 0.35], easing: 'linear' });
  const moveP = useStepProgress('entropy', { portion: [0.25, 0.85], easing: 'inOut' });
  const maskOn = idx >= 1 && dropP >= 1;

  const posBounds = lerpBounds(INITIAL, LOW_ENTROPY_POS, moveP);
  const negBounds = lerpBounds(INITIAL, LOW_ENTROPY_NEG, moveP);

  return (
    <Quantities map={QUANTITIES}>
      <Board
        title="어떤 토큰을 계산에서 뺄까?"
        source="MiMo-V2.6 §5.1 · 비율과 범위가 움직인 양은 예시"
        formula={
          <Formula
            size="xl"
            write="band"
            then={[
              {
                step: 'split',
                tex: `${LHS} \\begin{cases} ${range('\\epsilon_{+}^{l}', '\\epsilon_{+}^{h}')}, & \\q{pos}{A_i \\ge 0} \\\\ ${range('\\epsilon_{-}^{l}', '\\epsilon_{-}^{h}')}, & \\q{neg}{A_i < 0} \\end{cases}`,
              },
            ]}
          >
            {`${LHS} ${range(one(INITIAL[0]), one(INITIAL[1]))}`}
          </Formula>
        }
        figure={
          <Panels
            titles={[
              <Term of="pos">평균보다 잘한 풀이의 토큰</Term>,
              <Term of="neg">평균보다 못한 풀이의 토큰</Term>,
            ]}
          >
            {[
              ({ width, height }) => (
                <RatioBars values={R_POS} bounds={posBounds} bandP={bandP} maskOn={maskOn} movedP={moveP} width={width} height={height} />
              ),
              ({ width, height }) => (
                <RatioBars values={R_NEG} bounds={negBounds} bandP={bandP} maskOn={maskOn} movedP={moveP} width={width} height={height} />
              ),
            ]}
          </Panels>
        }
        caption={
          <Captions
            items={[
              { step: 'band', text: <><Term of="r">비</Term>가 <Term of="bound">{fmtRatio(INITIAL[0])}와 {Number(INITIAL[1])} 사이</Term>인 토큰만 계산에 넣습니다</> },
              { step: 'drop', text: <>범위를 벗어난 토큰은 잘라 쓰지 않고 아예 뺍니다</> },
              { step: 'split', text: <><Term of="pos">잘한 풀이</Term>와 <Term of="neg">못한 풀이</Term>에 <Term of="bound">범위</Term>를 따로 둡니다</> },
              { step: 'entropy', text: <>답이 한쪽으로 쏠리면 <Term of="pos">잘한 쪽은 넓히고</Term> <Term of="neg">못한 쪽은 좁힙니다</Term></> },
            ]}
          />
        }
      />
    </Quantities>
  );
};

export const maskScene = defineScene(
  {
    id: '10-mask',
    title: '어떤 토큰을 계산에서 뺄까?',
    steps: [step('band', 2.8), step('drop', 2.4), step('split', 2.8), step('entropy', 3.0, { hold: 0.6 })],
  },
  Scene,
);

export default maskScene;
