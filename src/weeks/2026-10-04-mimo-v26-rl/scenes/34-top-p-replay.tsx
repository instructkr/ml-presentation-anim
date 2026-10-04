import React from 'react';
import { interpolateColors } from 'remotion';
import { defineScene, step, useCurrentStepIndex, useStepProgress } from '@/lib/timeline';
import { Board, Captions, ColumnBars, Fill, Formula, Quantities, Term } from '@/lib/kit';
import { useTheme } from '@/lib/theme';
import {
  CANDIDATES,
  CHOSEN,
  CUT,
  KEPT_MASS,
  MU,
  P_FULL,
  P_SET,
  PI_FULL,
  R_MISMATCH,
  R_REPLAY,
  SET,
  fmtProb,
} from '../data/consistency-top-p-example';
import { INK, pick } from '../quantities';

/**
 * The replay of top-p candidate sets ("Keep Sampling Mask" in DeepSeek-V3.2
 * §3.1; MAI-Thinking-1 §3.1.3; two sentences in MiMo-V2.6 §6.4). Rollout drops
 * the unlikely tail before it samples and rescales what is left, so the
 * probability it logs for a token (μ) is taken over the candidate set. If
 * Training takes its probability (π) over the whole vocabulary, the ratio r is
 * off even when the two models are the same model: r equals what the kept
 * candidates added up to. Recording the set and rescaling inside it puts r
 * back at 1.
 *
 * The bars are one position's candidates (예시) — grey while they are what the
 * Rollout copy samples from, teal once they are what Training computes. Every
 * number in the equation is computed in data/consistency-top-p-example.ts.
 */
const QUANTITIES = { ...pick('mu', 'pi', 'r'), muv: INK.mu, piv: INK.pi } as const;

const R = '\\q{r}{r} = \\frac{\\q{pi}{\\pi}}{\\q{mu}{\\mu}} =';
/** `key` names the result: `mass` when it is the kept total (the 0.98 travels there from the first form), `out` when it is 1 */
const ratio = (pi: number, out: number, key: 'mass' | 'out') =>
  `${R} \\frac{\\q{piv}{${fmtProb(pi)}}}{\\q{muv}{${fmtProb(MU)}}} = \\q{${key}}{${fmtProb(out)}}`;

const Scene: React.FC = () => {
  const t = useTheme();
  const idx = useCurrentStepIndex();
  const growP = useStepProgress('dist', { portion: [0.1, 0.7] });
  // the tail fades once, a moment into the beat
  const cutP = useStepProgress('cut', { portion: [0.2, 0.45], easing: 'linear' });
  const renormP = useStepProgress('renorm', { portion: [0.15, 0.7], easing: 'inOut' });
  const fullP = useStepProgress('mismatch', { portion: [0.1, 0.6], easing: 'inOut' });
  const replayP = useStepProgress('replay', { portion: [0.1, 0.6], easing: 'inOut' });

  const chart =
    idx <= 1
      ? { values: P_FULL, from: undefined, morph: 1 }
      : idx === 2
        ? { values: P_SET, from: P_FULL, morph: renormP }
        : idx === 3
          ? { values: P_FULL, from: P_SET, morph: fullP }
          : { values: P_SET, from: P_FULL, morph: replayP };

  // the tail is out of the picture while a candidate set is in force
  const tailOut = (idx === 1 && cutP >= 1) || idx === 2 || (idx === 3 && fullP <= 0) || (idx === 4 && replayP > 0);
  // whose distribution the bars are: the Rollout copy's until Training computes its own
  const color = interpolateColors(fullP, [0, 1], [t.palette.ink[QUANTITIES.mu], t.palette.ink[QUANTITIES.pi]]);

  return (
    <Quantities map={QUANTITIES}>
      <Board
        title="뽑을 때 버린 후보는 어떻게 할까?"
        source="DeepSeek-V3.2 §3.1 · MAI-Thinking-1 §3.1.3 · MiMo-V2.6 §6.4 · 확률은 예시"
        formula={
          <Formula
            size="xl"
            write="renorm"
            then={[
              { step: 'mismatch', tex: ratio(PI_FULL, R_MISMATCH, 'mass') },
              { step: 'replay', tex: ratio(P_SET[CHOSEN]!, R_REPLAY, 'out') },
            ]}
            brace={{ key: 'mass', step: 'renorm', delay: 1.5, until: 'mismatch', label: '남은 후보의 합' }}
            indicate={{ key: 'mass', step: 'mismatch', delay: 1.6 }}
            box={{ key: 'out', step: 'replay', delay: 1.6 }}
          >
            {`\\q{mu}{\\mu} = \\frac{${fmtProb(PI_FULL)}}{\\q{mass}{${fmtProb(KEPT_MASS)}}} = \\q{muv}{${fmtProb(MU)}}`}
          </Formula>
        }
        figure={
          <Fill>
            {({ width, height }) => (
              <ColumnBars
                width={width}
                height={height}
                values={chart.values}
                from={chart.from}
                morph={chart.morph}
                progress={growP}
                labels={CANDIDATES}
                colors={P_FULL.map(() => color)}
                muted={tailOut ? CUT : []}
                // first the candidates top-p keeps, then the token that was actually written — the one μ, π and r are about
                highlight={idx === 1 && cutP >= 1 ? SET : idx >= 2 ? [CHOSEN] : []}
                yDomain={[0, 0.7]}
                yTicks={[0, 0.2, 0.4, 0.6]}
                valueFormat={fmtProb}
                textSize={t.fontSize.sm}
              />
            )}
          </Fill>
        }
        caption={
          <Captions
            items={[
              { step: 'dist', text: <>모델이 다음 토큰 후보마다 확률을 매깁니다</> },
              { step: 'cut', text: <>top-p는 확률이 낮은 꼬리 후보를 버리고 뽑습니다</> },
              { step: 'renorm', text: <>남은 후보끼리 합이 1이 되도록 키운 뒤에 뽑습니다</> },
              { step: 'mismatch', text: <><Term of="pi">꼬리까지 넣어 계산하면</Term> 같은 모델인데도 <Term of="r">비</Term>가 어긋납니다</> },
              { step: 'replay', text: <>후보 집합을 적어 두고 그 안에서만 계산하면 <Term of="r">1</Term>이 됩니다</> },
            ]}
          />
        }
      />
    </Quantities>
  );
};

export const topPReplayScene = defineScene(
  {
    id: '34-top-p-replay',
    title: '뽑을 때 버린 후보는 어떻게 할까?',
    steps: [step('dist', 2.4), step('cut', 2.4), step('renorm', 3.0), step('mismatch', 3.0), step('replay', 3.0, { hold: 0.6 })],
  },
  Scene,
);

export default topPReplayScene;
