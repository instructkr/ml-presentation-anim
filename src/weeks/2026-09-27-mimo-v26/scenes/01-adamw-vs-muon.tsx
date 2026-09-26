import React from 'react';
import { Appear, defineScene, step, useCurrentStepIndex, useStepProgress } from '@/lib/timeline';
import {
  Callout,
  ColumnBars,
  EqSteps,
  Fill,
  Grid,
  Label,
  SlideFrame,
  Spec,
  Stack,
  TensorMatrix,
  WalkthroughStage,
} from '@/lib/kit';
import { MOMENTUM, NS_ITERATES, NS_SHOWN, spread } from '../data/opt-newton-schulz';

/**
 * §3.2: why MiMo leaves AdamW before RL. One made-up 5 × 5 momentum matrix M
 * (예시) carries the whole scene: AdamW rescales its cells one at a time, its
 * singular values show how lopsided it is (45×), and Muon's Newton–Schulz
 * pulls every singular value to ≈1. The matrix, the bars and every iterate
 * come from data/opt-newton-schulz.ts; nothing on screen is typed in.
 */
const SUB = '₀₁₂₃₄₅₆₇₈₉';
const SIGMA_LABELS = NS_ITERATES[0]!.map((_, i) => `σ${SUB[i + 1]}`);

/** two decimals, true minus sign */
const fmt = (v: number) => {
  const s = Math.abs(v).toFixed(2);
  return v <= -0.005 ? `−${s}` : s;
};
const CELLS = MOMENTUM.map((row) => row.map(fmt));
const ALL_CELLS = MOMENTUM.flatMap((row, i) => row.map((_, j): [number, number] => [i, j]));
/** AdamW beat: a few cells light up one after another, each rescaled on its own; the last one stays lit */
const ADAM_CELLS: [number, number][] = [
  [0, 2],
  [3, 0],
  [1, 4],
  [4, 2],
  [2, 1],
  [1, 3],
];

const SHOWN = NS_SHOWN.map((k) => NS_ITERATES[k]!);
const FINAL = SHOWN[SHOWN.length - 1]!;
const BAND: [number, number] = [Math.min(...FINAL), Math.max(...FINAL)];
const SPREAD_BEFORE = Math.round(spread(SHOWN[0]!));
const SPREAD_AFTER = spread(FINAL).toFixed(1);

const inOut = (x: number) => (x < 0.5 ? 4 * x ** 3 : 1 - (-2 * x + 2) ** 3 / 2);

/** layers stacked in one grid cell: the slot keeps the height of its tallest layer, so nothing re-flows */
const Swap: React.FC<{ layers: { opacity: number; node: React.ReactNode }[] }> = ({ layers }) => (
  <div style={{ display: 'grid' }}>
    {layers.map((l, i) => (
      <div key={i} style={{ gridArea: '1 / 1', opacity: l.opacity }}>
        {l.node}
      </div>
    ))}
  </div>
);

export const adamwVsMuonScene = defineScene(
  {
    id: '01-adamw-vs-muon',
    title: 'AdamW와 Muon',
    steps: [
      step('update', 2.4),
      step('adamw', 2.8),
      step('lopsided', 2.8),
      step('orthogonalize', 3.0),
      step('why-mimo', 2.6, { hold: 0.6 }),
    ],
  },
  () => {
    const idx = useCurrentStepIndex();

    // rail slots: A = update → adamw, B = lopsided, C = orthogonalize → why-mimo
    const updateIn = useStepProgress('update', { portion: [0.1, 0.35] });
    const adamOut = useStepProgress('adamw', { portion: [0, 0.15] });
    const adamIn = useStepProgress('adamw', { portion: [0.15, 0.4] });
    const lopIn = useStepProgress('lopsided', { portion: [0.35, 0.6] });
    const orthoIn = useStepProgress('orthogonalize', { portion: [0.05, 0.3] });
    const whyOut = useStepProgress('why-mimo', { portion: [0, 0.15] });
    const whyIn = useStepProgress('why-mimo', { portion: [0.15, 0.4] });

    // AdamW: cells light one at a time
    const scan = useStepProgress('adamw', { portion: [0.15, 0.85], easing: 'linear' });
    const adamCell = ADAM_CELLS[Math.min(ADAM_CELLS.length - 1, Math.floor(scan * ADAM_CELLS.length))]!;
    const matrixHighlight: [number, number][] = idx === 1 && scan > 0 ? [adamCell] : idx === 3 ? ALL_CELLS : [];

    // singular values: grow in, then Newton–Schulz 0 → 1 → 2 → 3 → 5
    const growP = useStepProgress('lopsided', { portion: [0.05, 0.45] });
    const lopValues = useStepProgress('lopsided', { portion: [0.45, 0.65] });
    const nsP = useStepProgress('orthogonalize', { portion: [0.05, 0.75], easing: 'linear' });
    const nsValuesOut = useStepProgress('orthogonalize', { portion: [0, 0.05] });
    const nsValuesIn = useStepProgress('orthogonalize', { portion: [0.8, 0.95] });
    const bandP = useStepProgress('orthogonalize', { portion: [0.75, 0.95] });
    const nsCaption = useStepProgress('orthogonalize', { portion: [0.8, 0.95] });

    const segments = SHOWN.length - 1;
    const segF = Math.min(segments, nsP * segments);
    const seg = Math.min(segments - 1, Math.floor(segF));
    const local = inOut(segF - seg);
    const inNs = idx >= 3;
    const bars = inNs
      ? { values: SHOWN[seg + 1]!, from: SHOWN[seg]!, morph: local }
      : { values: SHOWN[0]!, from: undefined, morph: 1 };
    const kShown = inNs ? NS_SHOWN[seg + (local >= 0.5 ? 1 : 0)]! : 0;
    const valueOpacity = inNs ? (nsP > 0 ? nsValuesIn : 1 - nsValuesOut) : lopValues;

    return (
      <SlideFrame title="AdamW는 원소마다, Muon은 행렬째로" footer="ML Weekly · MiMo-V2.6 §3.2">
        <WalkthroughStage
          visual={
            <Stack gap={4} style={{ height: '100%' }}>
              <Stack direction="row" gap={4} align="center" justify="space-between">
                {/* the update rule is the frame-0 anchor, together with M and the empty σ axes */}
                <Stack direction="row" gap={4} align="center">
                  <EqSteps size="md" parts={[{ tex: 'W \\leftarrow W - \\eta\\,\\Delta W' }]} />
                  <Label size="xs" color="muted">
                    η: 학습률
                  </Label>
                </Stack>
                <Appear step="orthogonalize" effect="fade" delay={0.4}>
                  <Spec label="MiMo RL">Newton–Schulz 10회</Spec>
                </Appear>
              </Stack>
              <Grid
                columns={2}
                gap={6}
                style={{ flex: 1, minHeight: 0, gridTemplateColumns: 'minmax(0, 0.85fr) minmax(0, 1fr)' }}
              >
                <Stack gap={3} style={{ minHeight: 0 }}>
                  <Label size="sm" color="textSecondary" weight={600}>
                    모멘텀 M (5×5, 예시)
                  </Label>
                  <div style={{ flex: 1, minHeight: 0 }}>
                    <Fill>
                      {({ width, height }) => (
                        <TensorMatrix
                          values={CELLS}
                          highlight={matrixHighlight}
                          width={width}
                          cellHeight={Math.min(76, (height - 4 * 5) / 5)}
                        />
                      )}
                    </Fill>
                  </div>
                  <EqSteps
                    size="md"
                    parts={[{ tex: '\\Delta W_{ij} = \\frac{M_{ij}}{\\sqrt{v_{ij}} + \\epsilon}', step: 'adamw' }]}
                  />
                </Stack>
                <Stack gap={3} style={{ minHeight: 0 }}>
                  <Stack direction="row" gap={3} align="center" justify="space-between">
                    <Label size="sm" color="textSecondary" weight={600}>
                      M의 특이값 σ
                    </Label>
                    <div style={{ opacity: inNs ? 1 : 0 }}>
                      <Spec label="Newton–Schulz">반복 {kShown}회</Spec>
                    </div>
                  </Stack>
                  <div style={{ flex: 1, minHeight: 0 }}>
                    <Fill>
                      {({ width, height }) => (
                        <ColumnBars
                          width={width}
                          height={height}
                          values={bars.values}
                          from={bars.from}
                          morph={bars.morph}
                          progress={growP}
                          labels={SIGMA_LABELS}
                          yDomain={[0, 1.2]}
                          yTicks={[0, 0.5, 1]}
                          valueFormat={(v) => v.toFixed(2)}
                          valueOpacity={valueOpacity}
                          bands={[{ from: BAND[0], to: BAND[1], label: '≈ 1', opacity: 0.16 * bandP }]}
                        />
                      )}
                    </Fill>
                  </div>
                  <EqSteps
                    size="md"
                    parts={[{ tex: 'M = U\\Sigma V^{\\top} \\;\\longrightarrow\\; UV^{\\top}', step: 'orthogonalize' }]}
                  />
                </Stack>
              </Grid>
              <Swap
                layers={[
                  {
                    opacity: nsCaption * (1 - whyOut),
                    node: (
                      <Stack gap={2}>
                        <div>
                          <Spec label="σ 최대 ÷ 최소">
                            {SPREAD_BEFORE}배 → {SPREAD_AFTER}배
                          </Spec>
                        </div>
                        <Label size="sm" color="textSecondary">
                          Newton–Schulz는 특이값 분해(SVD) 없이 행렬 곱셈만으로 모든 σ에 같은 다항식을 반복해 적용한다. σ가 정확히
                          1이 되지는 않고, 1 근처의 좁은 띠 안으로 모인다.
                        </Label>
                      </Stack>
                    ),
                  },
                  {
                    opacity: whyIn,
                    node: (
                      <Stack gap={2}>
                        <Stack direction="row" gap={3}>
                          <Spec label="스텝당 궤적">1,568 × 16 ≈ 25K</Spec>
                          <Spec label="스텝당 토큰">2.7–3.7B</Spec>
                          <Spec label="RL">30 스텝</Spec>
                        </Stack>
                        <Label size="sm" color="textSecondary">
                          MiMo는 여러 과제를 섞은 RL에서 배치가 커질수록 AdamW의 최적화 효율이 떨어지는 것을
                          확인했다. 그래서 중간학습에서 Muon 계열로 바꾼다.
                        </Label>
                      </Stack>
                    ),
                  },
                ]}
              />
            </Stack>
          }
          explanation={
            <Stack gap={3}>
              <Swap
                layers={[
                  {
                    opacity: updateIn * (1 - adamOut),
                    node: (
                      <Callout title="옵티마이저가 하는 일">
                        모멘텀 M은 최근 기울기의 이동평균이다. 옵티마이저는 M을 같은 모양의 ΔW로 바꾸며, 이 방식이
                        옵티마이저마다 다르다.
                      </Callout>
                    ),
                  },
                  {
                    opacity: adamIn,
                    node: (
                      <Callout title="AdamW: 칸마다 따로 맞춘다">
                        칸마다 그 칸의 최근 기울기 크기 √v로 나눠 보폭을 맞춘다. 칸은 자기 값만 보므로 행렬 전체가
                        어느 쪽으로 쏠렸는지는 모른다.
                      </Callout>
                    ),
                  },
                ]}
              />
              <Swap
                layers={[
                  {
                    opacity: lopIn,
                    node: (
                      <Callout tone="warn" title="특이값: 행렬이 늘리는 배율">
                        행렬이 입력을 방향마다 늘리는 배율을 큰 순서로 늘어놓은 값이다. 이 M은 σ₁이 σ₅의{' '}
                        {SPREAD_BEFORE}배라서, 업데이트가 거의 한 방향으로만 움직인다.
                      </Callout>
                    ),
                  },
                ]}
              />
              <Swap
                layers={[
                  {
                    opacity: orthoIn * (1 - whyOut),
                    node: (
                      <Callout tone="ok" title="Muon: 방향은 두고 배율만 1로">
                        M = UΣVᵀ에서 방향인 U, V는 그대로 두고 배율 Σ만 1 가까이로 맞춘다. 그래서 약한 방향도 강한
                        방향만큼 움직인다.
                      </Callout>
                    ),
                  },
                  {
                    opacity: whyIn,
                    node: (
                      <Callout tone="ok" title="임계 배치 크기">
                        배치를 두 배로 늘려도 필요한 스텝 수가 더는 절반으로 줄지 않는 크기다. 이 크기를 넘으면
                        행렬째 업데이트가 데이터 효율을 더 잘 지킨다.
                      </Callout>
                    ),
                  },
                ]}
              />
            </Stack>
          }
        />
      </SlideFrame>
    );
  },
);

export default adamwVsMuonScene;
