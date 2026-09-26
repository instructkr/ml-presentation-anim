import React from 'react';
import { Appear, defineScene, step, useCurrentStepIndex, useStepProgress } from '@/lib/timeline';
import { Callout, ColumnBars, EqSteps, Fill, Label, SlideFrame, Spec, Stack, WalkthroughStage } from '@/lib/kit';
import {
  GAR_G,
  GAR_HACK,
  garA,
  garFinal,
  garMean,
  garMixedA,
  garMixedMean,
  garQuality,
  garRedist,
  garReward,
  garTest,
} from '../data/grade-gar-example';

/**
 * §4.3.2 (GAR, Eq. 3) on one mixed group of 8 (the paper's G is 16): plain
 * group-relative advantages push every pass up equally; the grader zeroes a
 * confirmed hack and the group statistics are recomputed; the four clean passes
 * are ranked into quality factors f; downweighting alone shrinks the positive
 * total, and λ restores it without touching the failures. The positive and
 * negative totals are read off the drawn columns, so they count along with
 * every morph. All numbers come from data/grade-gar-example.ts.
 */
const SUB = '₀₁₂₃₄₅₆₇₈₉';
const TAU = Array.from({ length: GAR_G }, (_, i) => `τ${SUB[i + 1]}`);
const PASSES = Object.keys(garQuality).map(Number);
const RANKED = [...PASSES].sort((a, b) => garQuality[b]! - garQuality[a]!);

const count = (r: number[]) => r.filter((v) => v === 1).length;
const signed = (v: number) => (Math.abs(v) < 5e-4 ? '0' : `${v > 0 ? '+' : '−'}${Math.abs(v).toFixed(3)}`);
const trim = (v: number) => String(Number(v.toFixed(3)));
const lerp = (a: number[], b: number[], t: number) => a.map((v, i) => v + (b[i]! - v) * t);
const sumSigned = (xs: number[], sign: 1 | -1) => xs.reduce((s, v) => (v * sign > 0 ? s + v : s), 0);

const posBefore = sumSigned(garA, 1);
const posDown = sumSigned(garRedist.downweighted, 1);

/** stacked in one grid cell so captions crossfade without re-flowing the column */
const Swap: React.FC<{ layers: { opacity: number; node: React.ReactNode }[] }> = ({ layers }) => (
  <div style={{ display: 'grid' }}>
    {layers.map((l, i) => (
      <div key={i} style={{ gridArea: '1 / 1', opacity: l.opacity }}>
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

export const garScene = defineScene(
  {
    id: '10-gar',
    title: 'GAR: 통과한 답끼리 재분배',
    steps: [
      step('mixed', 2.6),
      step('hack', 3.0),
      step('rank', 2.8),
      step('redistribute', 3.0),
      step('finalize', 2.6, { hold: 0.6 }),
    ],
  },
  () => {
    const idx = useCurrentStepIndex();
    const growP = useStepProgress('mixed', { portion: [0.1, 0.6] });
    const chipsIn = useStepProgress('mixed', { portion: [0.6, 0.85] });
    const hackP = useStepProgress('hack', { portion: [0.25, 0.75], easing: 'inOut' });
    const rankP = useStepProgress('rank', { portion: [0.3, 0.8], easing: 'inOut' });
    const redistP = useStepProgress('redistribute', { portion: [0.3, 0.8], easing: 'inOut' });
    const finalP = useStepProgress('finalize', { portion: [0.2, 0.6], easing: 'inOut' });
    const cap = [
      useStepProgress('hack', { portion: [0, 0.15] }),
      useStepProgress('rank', { portion: [0, 0.15] }),
      useStepProgress('redistribute', { portion: [0, 0.15] }),
      useStepProgress('finalize', { portion: [0, 0.15] }),
    ];

    const stages = [garMixedA, garA, garRedist.downweighted, garRedist.redistributed, garFinal];
    const morphs = [1, hackP, rankP, redistP, finalP];
    const values = stages[idx]!;
    const from = idx > 0 ? stages[idx - 1] : undefined;
    const drawn = from ? lerp(from, values, morphs[idx]!) : values;

    const labels = TAU.map((tau, i) => {
      if (i === GAR_HACK && idx >= 1) return `${tau} 해킹`;
      if (idx >= 2 && PASSES.includes(i)) return `${tau} ${RANKED.indexOf(i) + 1}위`;
      return tau;
    });

    const captionOpacity = (k: number) => {
      const inP = k === 0 ? 1 : cap[k - 1]!;
      const outP = k < cap.length ? cap[k]! : 0;
      return inP * (1 - outP);
    };
    const nPass = count(garReward);

    return (
      <SlideFrame title="통과한 패치에도 순위를: GAR" footer="ML Weekly · MiMo-V2.6 §4.3.2">
        <WalkthroughStage
          visual={
            <Stack gap={3} style={{ height: '100%' }}>
              <Stack direction="row" gap={7} align="center">
                <EqSteps size="md" parts={[{ tex: 'A_i = R_i - \\bar R' }]} />
                <EqSteps
                  size="md"
                  parts={[
                    { tex: "A_i' =", step: 'rank' },
                    { tex: '\\lambda', step: 'redistribute' },
                    { tex: 'f_i A_i', step: 'rank' },
                    { tex: '\\;\\; (i \\in \\mathcal P)', step: 'rank' },
                  ]}
                />
                <EqSteps
                  size="md"
                  parts={[
                    {
                      tex: '\\lambda = \\frac{\\sum_{j\\in\\mathcal P} A_j}{\\sum_{j\\in\\mathcal P} f_j A_j}',
                      step: 'redistribute',
                    },
                  ]}
                />
              </Stack>
              <Swap
                layers={[
                  {
                    opacity: captionOpacity(0),
                    node: (
                      <Caption>
                        예시 그룹: {GAR_G}번 중 {count(garTest)}번 통과. 통과한 {count(garTest)}개는 품질과 상관없이
                        똑같이 {signed(garMixedA[0]!)}를 받는다.
                      </Caption>
                    ),
                  },
                  {
                    opacity: captionOpacity(1),
                    node: (
                      <Caption>
                        {TAU[GAR_HACK]}는 유출된 답에 기대 통과했다. 실패로 바꿔 다시 계산하면 {GAR_G}번 중 {nPass}번
                        통과라서 A는 ±{trim(garA[0]!)}가 된다.
                      </Caption>
                    ),
                  },
                  {
                    opacity: captionOpacity(2),
                    node: (
                      <Caption>
                        통과한 {nPass}개(집합 P)에 순위대로 예시 f ={' '}
                        {RANKED.map((i) => garQuality[i]!.toFixed(1)).join(', ')}를 곱하면 양수 합이{' '}
                        {posBefore.toFixed(3)}에서 {posDown.toFixed(3)}으로 준다.
                      </Caption>
                    ),
                  },
                  {
                    opacity: captionOpacity(3),
                    node: (
                      <Caption>
                        λ = {posBefore.toFixed(3)} ÷ {posDown.toFixed(3)} = {trim(garRedist.lambda)}을 통과 쪽에 곱하면
                        양수 합이 {posBefore.toFixed(3)}으로 돌아온다. 실패한 {GAR_G - nPass}개는 그대로다.
                      </Caption>
                    ),
                  },
                  {
                    opacity: captionOpacity(4),
                    node: (
                      <Caption>
                        실제로는 λ에 상한을 두고, 그룹 평균을 빼 평균을 0으로 맞춘다. 그렇게 나온 A′가 궤적의 모든 응답
                        토큰에 똑같이 붙는다.
                      </Caption>
                    ),
                  },
                ]}
              />
              <Stack direction="row" gap={2} align="center" style={{ opacity: chipsIn }}>
                <Swap
                  layers={[
                    { opacity: 1 - cap[0]!, node: <Spec label="평균">{`R̄ = ${count(garTest)}/${GAR_G} = ${trim(garMixedMean)}`}</Spec> },
                    { opacity: cap[0]!, node: <Spec label="평균">{`R̄ = ${nPass}/${GAR_G} = ${trim(garMean)}`}</Spec> },
                  ]}
                />
                <Spec label="A 양수 합" tone="ok">
                  {signed(sumSigned(drawn, 1))}
                </Spec>
                <Spec label="A 음수 합" tone="warn">
                  {signed(sumSigned(drawn, -1))}
                </Spec>
                <div style={{ opacity: cap[2]! }}>
                  <Spec label="재분배">{`λ = ${trim(garRedist.lambda)}`}</Spec>
                </div>
              </Stack>
              <div style={{ flex: 1, minHeight: 0 }}>
                <Fill>
                  {({ width, height }) => (
                    <ColumnBars
                      width={width}
                      height={height}
                      values={values}
                      from={from}
                      morph={morphs[idx]}
                      progress={growP}
                      labels={labels}
                      highlight={idx === 1 ? [GAR_HACK] : []}
                      yDomain={[-0.75, 1]}
                      yTicks={[-0.5, 0, 0.5, 1]}
                      yLabel="어드밴티지 A (예시 그룹)"
                      valueFormat={signed}
                    />
                  )}
                </Fill>
              </div>
            </Stack>
          }
          explanation={
            <Stack gap={3}>
              <Appear step="hack" effect="rise" delay={0.3}>
                <Callout tone="warn" title="확정된 해킹: 증거로 잡힌 편법 통과">
                  채점 에이전트는 그룹 전체를 한 작업 공간에 모아 코드를 읽고 테스트를 돌려 본다. 유출된 답에 기댄
                  통과가 확인되면 보상을 0으로 바꾼다.
                </Callout>
              </Appear>
              <Appear step="rank" effect="rise" delay={0.3}>
                <Callout title="품질 계수 f: 순위를 무게로 바꾼 값">
                  통과한 패치끼리 접근의 적절성, 구현의 정밀함, 변경의 최소성, 과제 밖 부작용, 코드 관례를 비교해
                  순위를 매긴다. 순위가 낮을수록 f가 작다.
                </Callout>
              </Appear>
              <Appear step="redistribute" effect="rise" delay={0.4}>
                <Callout tone="ok" title="λ로 다시 키우는 이유">
                  f로 깎기만 하면 양수 쪽만 줄어 끌어내리는 힘이 더 세진다. 그러면 뽑힌 토큰의 확률이 깎여 분포가
                  퍼지고 엔트로피가 커진다.
                </Callout>
              </Appear>
            </Stack>
          }
        />
      </SlideFrame>
    );
  },
);

export default garScene;
