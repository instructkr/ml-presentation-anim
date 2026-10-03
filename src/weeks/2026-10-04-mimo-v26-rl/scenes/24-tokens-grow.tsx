import React from 'react';
import { interpolateColors } from 'remotion';
import { defineScene, step, useCurrentStepIndex, useStepProgress } from '@/lib/timeline';
import { Board, Captions, LineChart, Panels, Quantities, Term, useQuantityColors } from '@/lib/kit';
import { useTheme } from '@/lib/theme';
import { fig9Score, firstY, lastY } from '../data/lessons-fig9-score';
import { fig9Tokens } from '../data/fig9-tokens';

/**
 * §5.3, Fig. 9 (the DeepSWE v1.1 column) — over the 30 RL steps the benchmark
 * score rises, and so does the number of tokens a solution takes. Two panels,
 * as in the figure: score on the left, total tokens on the right, one line per
 * model. Both sets of curves were read off the figure (approximate); both axes
 * are on screen from frame 0 and each panel is swept in on its own beat.
 * Every number in the phrases is read from the data files.
 */

/** the two models are this scene's quantities: the same ink for the same model in both panels */
const QUANTITIES = { pro: 'blue', flash: 'gold' } as const;

const X_TICKS = [0, 10, 20, 30];
const SCORE_TICKS = [40, 50, 60, 70, 80];
const TOKEN_TICKS = [100, 150, 200, 250];

const one = (v: number) => v.toFixed(1);
/** "…로" or "…으로" after a number, by the last digit's final consonant (0 영, 3 삼, 6 육 take 으로) */
const ro = (digits: string) => `${digits}${'036'.includes(digits[digits.length - 1]!) ? '으로' : '로'}`;

const SCORE = { from: one(firstY(fig9Score.pro)), to: one(lastY(fig9Score.pro)) };
const TOKENS = { from: firstY(fig9Tokens.pro), to: lastY(fig9Tokens.pro) };

const Charts: React.FC = () => {
  const t = useTheme();
  const ink = useQuantityColors();
  const idx = useCurrentStepIndex();
  const scoreP = useStepProgress('score', { portion: [0.1, 0.85], easing: 'inOut' });
  const tokensP = useStepProgress('tokens', { portion: [0.1, 0.85], easing: 'inOut' });
  // the last beat points at one model in both panels: its score and its length rose together.
  // Pro glows, and Flash steps back toward the background so the pair of Pro lines reads at once.
  const pointed = idx === 2 ? 0 : undefined;
  const backP = useStepProgress('together', { portion: [0, 0.35] });
  const flash = interpolateColors(backP * 0.6, [0, 1], [ink.flash!, t.palette.colors.bg]);

  const panel = (data: { pro: { x: number; y: number }[]; flash: { x: number; y: number }[] }, yTicks: number[], progress: number) =>
    ({ width, height }: { width: number; height: number }) => (
      <LineChart
        width={width}
        height={height}
        series={[
          { label: 'Pro', color: ink.pro, points: data.pro },
          { label: 'Flash', color: flash, points: data.flash },
        ]}
        progress={progress}
        xTicks={X_TICKS}
        yTicks={yTicks}
        xLabel="RL 스텝"
        highlightSeries={pointed}
      />
    );

  return (
    <Panels titles={['DeepSWE 점수', '풀이 하나의 토큰 (K)']} gap={10}>
      {[panel(fig9Score, SCORE_TICKS, scoreP), panel(fig9Tokens, TOKEN_TICKS, tokensP)]}
    </Panels>
  );
};

export const tokensGrowScene = defineScene(
  {
    id: '24-tokens-grow',
    title: '점수가 오를 때 무엇이 같이 늘까?',
    steps: [step('score', 2.8), step('tokens', 2.8), step('together', 2.4, { hold: 0.6 })],
  },
  () => (
    <Quantities map={QUANTITIES}>
      <Board
        title="점수가 오를 때 무엇이 같이 늘까?"
        source="MiMo-V2.6 §5.3, 그림 9 (그래프에서 읽은 근사값)"
        figure={<Charts />}
        caption={
          <Captions
            items={[
              { step: 'score', text: <><Term of="pro">Pro</Term>의 DeepSWE 점수가 30 스텝 동안 {SCORE.from}에서 {ro(SCORE.to)} 올랐습니다</> },
              { step: 'tokens', text: <>같은 동안 풀이 하나의 토큰은 {TOKENS.from}K에서 {TOKENS.to}K로 늘었습니다</> },
              { step: 'together', text: <>더 잘 풀게 된 만큼 더 길게 풀고 있습니다</> },
            ]}
          />
        }
      />
    </Quantities>
  ),
);

export default tokensGrowScene;
