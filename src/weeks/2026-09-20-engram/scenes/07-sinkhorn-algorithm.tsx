import React from 'react';
import { defineScene, step, useCurrentStepIndex, useStepProgress } from '@/lib/timeline';
import { Callout, Code, SlideFrame, Spec, Stack, TensorMatrix, WalkthroughStage } from '@/lib/kit';
import { COLS, DELTA, G_HAT, ROWS, U0, U1, U11, U2 } from './sinkhorn-example';

/**
 * 유도: V4.1 Algorithm 1, line by line. The listing is the frame-0 anchor and
 * keeps the paper's line numbers (the Require clause sits in the title). Each
 * beat lights its lines, swaps the example matrix to the state those lines
 * produce, and shows the one note that explains them — the rail holds a
 * single note at a time instead of six stacked callouts.
 */
const ALGORITHM = `Mₜ ← β·Mₜ₋₁ + (1−β)·Gₜ
Ĝₜ ← β·Mₜ + (1−β)·Gₜ                  ▹ Nesterov
ρᵢ ← ‖Ĝₜ,ᵢ,:‖₂ ,   ρ̄ ← (1/m)·Σᵢ ρᵢ
U⁽⁰⁾ ← Ĝₜ
U⁽⁰⁾ᵢ,: ← 0  if ρᵢ ≤ τ·ρ̄                ▹ 거의 0인 행 지우기
for k = 1, …, K do
  if k is odd then
    for all i = 1, …, m do
      U⁽ᵏ⁾ᵢ,: ← U⁽ᵏ⁻¹⁾ᵢ,: / (‖U⁽ᵏ⁻¹⁾ᵢ,:‖₂ + ε)
    end for
  else
    for all j = 1, …, n do
      U⁽ᵏ⁾:,ⱼ ← U⁽ᵏ⁻¹⁾:,ⱼ / (‖U⁽ᵏ⁻¹⁾:,ⱼ‖₂ + ε)
    end for
  end if
end for
Δₜ ← √n · U⁽ᴷ⁾                        ▹ 행 ℓ₂ = 1 → 행 RMS = 1
η̃ₜ ← γ·ηₜ                             ▹ Adam과 보폭 맞추기
Wₜ₊₁ ← Wₜ − η̃ₜ·Δₜ`;

const liveRows = [0, 1, 3, 4];
const rowNormCells: [number, number][] = liveRows.map((r) => [r, 3]);
const colNormCells: [number, number][] = [[5, 0], [5, 1], [5, 2]];

interface Beat {
  id: string;
  seconds: number;
  lines: number[];
  table: string[][];
  tableTitle: string;
  highlight: [number, number][];
  color?: string;
  note: { title: string; body: string };
  spec: { label: string; value: string };
}

const BEATS: Beat[] = [
  {
    id: 'momentum',
    seconds: 2.8,
    lines: [1, 2],
    table: G_HAT,
    tableTitle: 'Ĝ: 2행의 결과',
    highlight: [],
    note: {
      title: '1–2행: 모멘텀 하나만 기억한다',
      body: '1행은 기울기의 지수이동평균 M을 쌓는다. 2행은 Nesterov 방식으로 그 M에 이번 기울기를 한 번 더 섞어 한 걸음 앞의 방향 Ĝ를 만든다. 스텝 사이에 들고 가는 상태는 M 하나뿐이고, 아래 줄은 모두 Ĝ만 가지고 계산한다.',
    },
    spec: { label: 'β', value: '0.95 (Muon과 같음)' },
  },
  {
    id: 'mask',
    seconds: 3.0,
    lines: [3, 4, 5],
    table: U0,
    tableTitle: 'U⁽⁰⁾: g₃을 지운 뒤',
    highlight: [[2, 0], [2, 1], [2, 2], [2, 3]],
    color: 'warn',
    note: {
      title: '3–5행: 거의 0인 행은 지운다',
      body: '3행은 행마다 길이 ρᵢ를 재고 평균 ρ̄를 구한다. 5행은 ρ̄의 τ배보다 짧은 행을 0으로 만든다. 이 행을 남겨 두면 다음 단계가 잡음뿐인 행을 길이 1로 부풀려, 이번 배치에 거의 없던 N-gram이 크게 움직인다.',
    },
    spec: { label: 'τρ̄', value: '10⁻³ × 2.46 = 0.0025 > ρ₃ = 0.0012' },
  },
  {
    id: 'row',
    seconds: 2.8,
    lines: [6, 7, 8, 9, 10],
    table: U1,
    tableTitle: 'U⁽¹⁾: 행마다 나눈 뒤 (k = 1)',
    highlight: rowNormCells,
    note: {
      title: '6–10행 (k 홀수): 행마다 길이 1로',
      body: 'k가 홀수면 행마다 자기 길이로 나눈다. 길이 7이던 g₁도, 1.3이던 g₄도 길이 1이 된다. 자주 나온 N-gram이든 드문 N-gram이든 한 스텝에 움직이는 양이 같아진다. ε은 지운 행에서 0을 0으로 나누지 않게 막는다.',
    },
    spec: { label: 'ε', value: '10⁻²⁰ → 지운 행은 0 / ε = 0' },
  },
  {
    id: 'col',
    seconds: 2.8,
    lines: [11, 12, 13, 14],
    table: U2,
    tableTitle: 'U⁽²⁾: 열마다 나눈 뒤 (k = 2)',
    highlight: colNormCells,
    note: {
      title: '11–14행 (k 짝수): 열마다 길이 1로',
      body: 'k가 짝수면 열마다 자기 길이로 나눈다. 열 하나는 은닉 특징 하나다. 행을 맞춘 뒤 보니 f₁ 열은 1.63, f₂ 열은 0.54로 특징끼리 세 배 차이가 났다. 열을 나누면 이 차이는 사라지지만 행 길이가 0.77–0.99로 다시 흐트러진다.',
    },
    spec: { label: '열 길이', value: '1.63 · 0.54 · 1.02 → 1 · 1 · 1' },
  },
  {
    id: 'repeat',
    seconds: 3.0,
    lines: [6, 15, 16],
    table: U11,
    tableTitle: 'U⁽¹¹⁾: 번갈아 11번 (K = 11)',
    highlight: [...rowNormCells, ...colNormCells],
    note: {
      title: '6, 16행: 행과 열을 번갈아 K번',
      body: '그래서 행과 열을 번갈아 나눈다. 반복할수록 행 길이가 서로 같아지고, 그러면 행 나누기는 모든 원소를 같은 수로 나누는 일에 가까워져 열 조건을 깨지 않는다. 11번째 뒤에는 행 길이가 모두 1, 열 길이가 모두 1.15다.',
    },
    spec: { label: 'K = 11', value: '행 단계 6번 · 열 단계 5번' },
  },
  {
    id: 'apply',
    seconds: 3.0,
    lines: [17, 18, 19],
    table: DELTA,
    tableTitle: 'Δ = √3 · U⁽¹¹⁾ (마지막 행·열 = RMS)',
    highlight: [...rowNormCells, ...colNormCells],
    color: 'ok',
    note: {
      title: '17–19행: 크기를 정하고 뺀다',
      body: 'K가 홀수라 마지막 단계는 행 나누기이고, 행 길이는 정확히 1이다. √n을 곱하면 행 RMS가 1이 되고 열 RMS도 1이 된다. 끝으로 학습률에 γ를 곱해 Adam과 보폭을 맞추고, weight decay 없이 가중치에서 뺀다.',
    },
    spec: { label: 'γ', value: '0.18 · Engram 학습률 ×5' },
  },
];

const BeatTable: React.FC<{ beat: Beat; progress: number }> = ({ beat, progress }) => (
  <TensorMatrix
    title={beat.tableTitle}
    values={beat.table}
    rowLabels={beat.id === 'apply' ? [...ROWS.slice(0, 5), 'RMS'] : ROWS}
    columnLabels={beat.id === 'apply' ? [...COLS.slice(0, 3), 'RMS'] : COLS}
    highlight={beat.highlight}
    color={beat.color}
    // each beat's table shimmers in from half-visible, so the swap reads as an update
    progress={0.5 + 0.5 * progress}
    width={520}
    cellHeight={38}
  />
);

export const sinkhornAlgorithmScene = defineScene(
  {
    id: '07-sinkhorn-algorithm',
    title: 'Algorithm 1 한 줄씩',
    steps: BEATS.map((b, i) => step(b.id, b.seconds, i === BEATS.length - 1 ? { hold: 0.6 } : undefined)),
  },
  () => {
    const idx = useCurrentStepIndex();
    // hooks in a fixed-length loop: same order every render
    const progress = BEATS.map((b) => useStepProgress(b.id));
    const noteP = BEATS.map((b) => useStepProgress(b.id, { portion: [0, 0.4] }));
    const beat = BEATS[idx]!;
    return (
      <SlideFrame title="Algorithm 1: Sinkhorn 균형을 넣은 모멘텀 갱신" footer="ML Weekly · DeepSeek-V4.1 §2.5, Algorithm 1 · 예시 5 × 3, K = 11">
        <WalkthroughStage
          gap={5}
          visual={
            <Code
              fontSize={23}
              highlightLines={beat.lines}
              title="입력: W ∈ ℝᵐˣⁿ, 기울기 G, 모멘텀 M, β, η, γ, ε, τ, 홀수 K"
              style={{ height: '100%' }}
            >
              {ALGORITHM}
            </Code>
          }
          explanation={
            <Stack gap={4}>
              <BeatTable beat={beat} progress={progress[idx]!} />
              <div style={{ opacity: 0.25 + 0.75 * noteP[idx]!, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <Callout tone={beat.color === 'warn' ? 'warn' : beat.color === 'ok' ? 'ok' : undefined} title={beat.note.title}>
                  {beat.note.body}
                </Callout>
                <div>
                  <Spec label={beat.spec.label}>{beat.spec.value}</Spec>
                </div>
              </div>
            </Stack>
          }
        />
      </SlideFrame>
    );
  },
);

export default sinkhornAlgorithmScene;
