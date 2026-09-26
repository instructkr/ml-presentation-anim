import React from 'react';
import { interpolateColors } from 'remotion';
import { Appear, defineScene, step, useCurrentStepIndex, useStepProgress } from '@/lib/timeline';
import { Callout, ColumnBars, EqSteps, Fill, Grid, Label, SlideFrame, Spec, Stack, WalkthroughStage } from '@/lib/kit';
import { useTheme } from '@/lib/theme';
import {
  SEG_T,
  segKappa,
  segNeg,
  segNegAfter,
  segNegAmplified,
  segNegBefore,
  segPos,
  segPosAfter,
  segPosBefore,
  segPosMasked,
  segScales,
  segSum,
} from '../data/pen-segment-example';

/**
 * §4.3.3 (Eq. 5) and §6.1 on one successful and one failed trajectory of ten
 * tokens (예시): the outcome advantage lands on every token alike, rules flag a
 * broken tool call, and Eq. 5 moves the advantage off the flagged tokens while
 * each sign's total stays put. Each sign is shown in two moves so the total can
 * be watched: shape the flagged tokens (the total drifts), then rescale the rest
 * with α or β (the total returns). All numbers come from data/pen-segment-example.ts.
 */
const SUB = '₀₁₂₃₄₅₆₇₈₉';
const sub = (n: number) => [...String(n)].map((d) => SUB[Number(d)]).join('');
const TOK = Array.from({ length: SEG_T }, (_, i) => `t${sub(i + 1)}`);
const flagged = (h: number[]) => h.flatMap((v, i) => (v === 1 ? [i] : []));
const POS_FLAG = flagged(segPos.h);
const NEG_FLAG = flagged(segNeg.h);
const firstKept = (h: number[], from: number) => h.findIndex((v, i) => v === 0 && i >= from);
/**
 * one unflagged and one flagged value per trajectory (ten equal labels in a row
 * would collide), each kept a slot clear of the other so neither ever touches
 */
const POS_LABELS = [firstKept(segPos.h, 2), POS_FLAG[0]!];
const NEG_LABELS = [NEG_FLAG[0]!, firstKept(segNeg.h, NEG_FLAG[NEG_FLAG.length - 1]! + 3)];

const trim = (v: number) => String(Number(v.toFixed(3)));
const one = (v: number) => v.toFixed(1);
const signed = (v: number) => (Math.abs(v) < 5e-4 ? '0' : `${v > 0 ? '+' : '−'}${Math.abs(v).toFixed(3)}`);
const signed1 = (v: number) => `${v > 0 ? '+' : v < 0 ? '−' : ''}${Math.abs(v).toFixed(1)}`;
const names = (idx: number[]) => idx.map((i) => TOK[i]).join('·');
/** keeps an inline formula on one line */
const nb = (s: string) => s.replace(/ /g, ' ');
/** two-move morph: a → b by p1, then b → c by p2 */
const chain = (a: number[], b: number[], c: number[], p1: number, p2: number) =>
  a.map((v, i) => v + (b[i]! - v) * p1 + (c[i]! - b[i]!) * p2);

const S = segScales;
const posSum0 = segSum(segPosBefore);
const posSum1 = segSum(segPosMasked);
const negSum0 = segSum(segNegBefore);
const negSum1 = segSum(segNegAmplified);

/** stacked in one grid cell so layers swap without re-flowing the column */
const Swap: React.FC<{ layers: { opacity: number; node: React.ReactNode }[] }> = ({ layers }) => (
  <div style={{ display: 'grid' }}>
    {layers.map((l, i) => (
      <div key={i} style={{ gridArea: '1 / 1', opacity: l.opacity, minWidth: 0 }}>
        {l.node}
      </div>
    ))}
  </div>
);

const Caption: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Label size="sm" color="textSecondary" weight={600}>
    {children}
  </Label>
);

export const segmentPenaltyScene = defineScene(
  {
    id: '13-segment-penalty',
    title: '구간 페널티: 잘못된 토큰만',
    steps: [
      step('problem', 2.6),
      step('flag', 2.6),
      step('positive', 3.0),
      step('negative', 3.0),
      step('conserve', 2.4, { hold: 0.6 }),
    ],
  },
  () => {
    const t = useTheme();
    const c = t.palette.colors;
    const idx = useCurrentStepIndex();
    const growP = useStepProgress('problem', { portion: [0.1, 0.5] });
    const flagP = useStepProgress('flag', { portion: [0.2, 0.55] });
    const maskP = useStepProgress('positive', { portion: [0.15, 0.45], easing: 'inOut' });
    const alphaP = useStepProgress('positive', { portion: [0.58, 0.9], easing: 'inOut' });
    const kappaP = useStepProgress('negative', { portion: [0.15, 0.45], easing: 'inOut' });
    const betaP = useStepProgress('negative', { portion: [0.56, 0.86], easing: 'inOut' });
    // a value label hangs on its bar end, so it would sweep through the dashed A line while a bar crosses it:
    // the labels step out for those moves (flagged +0.5 → 0, unflagged −0.5 → −0.25) and return once the bars rest
    const posLabels =
      (1 - useStepProgress('positive', { portion: [0.05, 0.13] })) +
      useStepProgress('positive', { portion: [0.47, 0.55] });
    const negLabels =
      (1 - useStepProgress('negative', { portion: [0.47, 0.55] })) +
      useStepProgress('negative', { portion: [0.88, 0.95] });
    // sequential caption swaps: the old line is gone before the new one arrives
    const capOut = [
      useStepProgress('flag', { portion: [0, 0.08] }),
      useStepProgress('positive', { portion: [0, 0.08] }),
      useStepProgress('negative', { portion: [0, 0.08] }),
      useStepProgress('conserve', { portion: [0, 0.08] }),
    ];
    const capIn = [
      useStepProgress('flag', { portion: [0.08, 0.18] }),
      useStepProgress('positive', { portion: [0.08, 0.18] }),
      useStepProgress('negative', { portion: [0.08, 0.18] }),
      useStepProgress('conserve', { portion: [0.08, 0.18] }),
    ];
    const layer = (k: number) => (k === 0 ? 1 : capIn[k - 1]!) * (k < capOut.length ? 1 - capOut[k]! : 1);

    const pos = chain(segPosBefore, segPosMasked, segPosAfter, maskP, alphaP);
    const neg = chain(segNegBefore, segNegAmplified, segNegAfter, kappaP, betaP);
    const posColors = segPos.h.map((h) =>
      h === 1 ? interpolateColors(flagP, [0, 1], [t.palette.series[0]!, c.warn]) : undefined,
    );
    const negColors = segNeg.h.map((h) =>
      h === 1 ? interpolateColors(flagP, [0, 1], [t.palette.series[1]!, c.warn]) : undefined,
    );
    const conserve = idx === 4;
    const sumStyle = conserve ? { borderColor: c.accent } : undefined;

    return (
      <SlideFrame title="잘못된 도구 호출만 골라 벌한다: 구간 페널티" footer="ML Weekly · MiMo-V2.6 §4.3.3, §6.1">
        <WalkthroughStage
          visual={
            <Stack gap={3} style={{ height: '100%' }}>
              <Stack direction="row" gap={6} align="center">
                {/* the paper's cases block: before shaping every token reads A_i; the factors arrive on their beats */}
                <EqSteps
                  size="sm"
                  parts={[
                    { tex: '\\tilde A_{i,t} = \\begin{cases}' },
                    { tex: '\\alpha\\,(1-h_{i,t})\\,', step: 'positive' },
                    { tex: 'A_i, & A_i > 0, \\\\' },
                    { tex: '\\left[\\beta\\,(1-h_{i,t}) + \\kappa\\, h_{i,t}\\right]', step: 'negative' },
                    { tex: 'A_i, & A_i < 0,' },
                    { tex: '\\quad \\kappa > 1', step: 'negative' },
                    { tex: '\\\\ 0, & A_i = 0 \\end{cases}' },
                  ]}
                />
                <Stack gap={2} align="flex-start">
                  <Appear step="negative" effect="fade" delay={0.4}>
                    <Spec label="예시">{`κ = ${segKappa}`}</Spec>
                  </Appear>
                  <Appear step="conserve" effect="fade" delay={0.4}>
                    <Spec label="α 상한 · β 하한" tone="warn">
                      논문에 값 없음
                    </Spec>
                  </Appear>
                </Stack>
              </Stack>
              <Stack direction="row">
                <EqSteps
                  size="sm"
                  parts={[
                    {
                      tex: '\\alpha = \\min\\!\\left(\\alpha_{\\max},\\ 1 + \\frac{\\sum_{H_+} A_i}{\\sum_{C_+} A_i}\\right)',
                      step: 'positive',
                    },
                    { tex: '\\qquad' },
                    {
                      tex: '\\beta = \\max\\!\\left(\\beta_{\\min},\\ 1 - \\frac{(\\kappa-1)\\sum_{H_-} |A_i|}{\\sum_{C_-} |A_i|}\\right)',
                      step: 'negative',
                    },
                  ]}
                />
              </Stack>
              <Swap
                layers={[
                  {
                    opacity: layer(0),
                    node: (
                      <Caption>
                        결과 보상은 궤적의 모든 토큰에 같은 A로 퍼진다. 그래서 성공한 궤적 속 잘못된 도구 호출도 칭찬받고,
                        실패한 궤적의 멀쩡한 토큰도 똑같이 벌받는다.
                      </Caption>
                    ),
                  },
                  {
                    opacity: layer(1),
                    node: (
                      <Caption>
                        예시에서는 성공한 궤적의 {names(POS_FLAG)} 토큰과 실패한 궤적의 {names(NEG_FLAG)} 토큰이 깨진 도구
                        호출이다. 여기서 쓰는 전략은 이 토큰들의 A만 고치는 것이다.
                      </Caption>
                    ),
                  },
                  {
                    opacity: layer(2),
                    node: (
                      <Caption>
                        표시된 토큰의 A를 지우면 합이 {one(posSum0)}에서 {one(posSum1)}으로 준다. 지운 몫 {one(S.hPos)}을 나머지{' '}
                        {SEG_T - POS_FLAG.length}개(합 {one(S.cPos)})에 나눠 주는 배율이{' '}
                        {nb(`α = 1 + ${one(S.hPos)} ÷ ${one(S.cPos)} = ${trim(S.alpha)}다.`)}
                      </Caption>
                    ),
                  },
                  {
                    opacity: layer(3),
                    node: (
                      <Caption>
                        표시된 토큰을 κ배로 더 벌하면 합이 {signed1(negSum0)}에서 {signed1(negSum1)}이 된다. 대신 나머지{' '}
                        {SEG_T - NEG_FLAG.length}개에{' '}
                        {nb(`β = 1 − ${segKappa - 1} × ${one(S.hNeg)} ÷ ${one(S.cNeg)} = ${trim(S.beta)}를`)} 곱해 합을{' '}
                        {signed1(negSum0)}으로 되돌린다.
                      </Caption>
                    ),
                  },
                  {
                    opacity: layer(4),
                    node: (
                      <Caption>
                        α가 상한에, β가 하한에 걸리거나 분모가 0이면(그때 배율은 1) 합이 보존되지 않는다. 예시는 어느
                        쪽에도 걸리지 않는다.
                      </Caption>
                    ),
                  },
                ]}
              />
              <Grid columns={2} gap={4} style={{ flex: 1, minHeight: 0 }}>
                <Stack gap={1} style={{ minHeight: 0 }}>
                  <Stack direction="row" gap={3} align="center" justify="space-between">
                    <Label size="sm" weight={600}>
                      성공한 궤적 (예시, A = {signed1(segPos.A)})
                    </Label>
                    <Spec label="A의 합" style={sumStyle}>
                      {signed(segSum(pos))}
                    </Spec>
                  </Stack>
                  <div style={{ flex: 1, minHeight: 0 }}>
                    <Fill>
                      {({ width, height }) => (
                        <ColumnBars
                          width={width}
                          height={height}
                          values={pos}
                          progress={growP}
                          labels={TOK}
                          colors={posColors}
                          highlight={idx === 1 || idx === 2 ? POS_FLAG : []}
                          refLines={[{ value: segPos.A, label: 'A' }]}
                          yDomain={[0, 0.75]}
                          yTicks={[0, 0.25, 0.5, 0.75]}
                          valueIndices={POS_LABELS}
                          valueOpacity={posLabels}
                        />
                      )}
                    </Fill>
                  </div>
                </Stack>
                <Stack gap={1} style={{ minHeight: 0 }}>
                  <Stack direction="row" gap={3} align="center" justify="space-between">
                    <Label size="sm" weight={600}>
                      실패한 궤적 (예시, A = {signed1(segNeg.A)})
                    </Label>
                    <Spec label="A의 합" style={sumStyle}>
                      {signed(segSum(neg))}
                    </Spec>
                  </Stack>
                  <div style={{ flex: 1, minHeight: 0 }}>
                    <Fill>
                      {({ width, height }) => (
                        <ColumnBars
                          width={width}
                          height={height}
                          values={neg}
                          progress={growP}
                          labels={TOK}
                          colors={negColors}
                          highlight={idx === 1 || idx === 3 ? NEG_FLAG : []}
                          refLines={[{ value: segNeg.A, label: 'A' }]}
                          yDomain={[-1.75, 0]}
                          yTicks={[-1.5, -1, -0.5, 0]}
                          valueIndices={NEG_LABELS}
                          valueOpacity={negLabels}
                        />
                      )}
                    </Fill>
                  </div>
                </Stack>
              </Grid>
            </Stack>
          }
          explanation={
            <Stack gap={3}>
              <Appear step="flag" effect="rise" delay={0.3}>
                <Callout tone="warn" title="표시된 토큰: 규칙이 잡은 잘못">
                  규칙이 깨진 마크업, 없는 도구 이름, 잘못된 인자를 찾아 h = 1로 표시한다. 그 토큰을 어떻게 다룰지는
                  전략이 정한다.
                </Callout>
              </Appear>
              <Appear step="positive" effect="rise" delay={0.3}>
                <Callout title="어드밴티지 질량은 부호마다 지킨다">
                  질량은 같은 부호 토큰의 A를 모두 더한 값이다. 표시된 토큰에서 옮긴 만큼 나머지 토큰에서 되돌려
                  합을 그대로 둔다.
                </Callout>
              </Appear>
              <Appear step="conserve" effect="rise" delay={0.3}>
                <Callout tone="ok" title="합을 지키는 이유">
                  벌을 키운 만큼 나머지 벌을 줄이므로 음수 쪽 합이 늘지 않는다. 여분의 음수 압력은 엔트로피를 걷잡을 수
                  없이 키울 수 있다.
                </Callout>
              </Appear>
            </Stack>
          }
        />
      </SlideFrame>
    );
  },
);

export default segmentPenaltyScene;
