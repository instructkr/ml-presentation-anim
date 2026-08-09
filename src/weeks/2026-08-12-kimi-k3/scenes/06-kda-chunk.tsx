import React from 'react';
import { defineScene, step, useStepProgress } from '@/lib/timeline';
import {
  EqSteps,
  ExplainerCard,
  Fill,
  Label,
  SlideFrame,
  Stack,
  TensorMatrix,
  Tex,
  WalkthroughStage,
} from '@/lib/kit';
import { useTheme } from '@/lib/theme';

/**
 * The blockwise KDA path (chunk_kda): the same per-token recurrence, but the
 * sequence is cut into chunks so the sequential dependency shrinks from T
 * steps to C + G. Three scans: summary_step folds each chunk into (A_g, B_g)
 * in parallel, chunk_step threads the start states through G chunks
 * sequentially, scan_chunk replays every chunk per-token in parallel.
 */
const CHUNKS = [
  {
    tokens: ['x₁', 'x₂', 'x₃', 'x₄'],
    qkv: [
      ['q₁', 'q₂', 'q₃', 'q₄'],
      ['k₁', 'k₂', 'k₃', 'k₄'],
      ['v₁', 'v₂', 'v₃', 'v₄'],
    ],
    summary: ['A₁', 'B₁'],
    outputs: ['o₁', 'o₂', 'o₃', 'o₄'],
  },
  {
    tokens: ['x₅', 'x₆', 'x₇', 'x₈'],
    qkv: [
      ['q₅', 'q₆', 'q₇', 'q₈'],
      ['k₅', 'k₆', 'k₇', 'k₈'],
      ['v₅', 'v₆', 'v₇', 'v₈'],
    ],
    summary: ['A₂', 'B₂'],
    outputs: ['o₅', 'o₆', 'o₇', 'o₈'],
  },
  {
    tokens: ['x₉', 'x₁₀', 'x₁₁', 'x₁₂'],
    qkv: [
      ['q₉', 'q₁₀', 'q₁₁', 'q₁₂'],
      ['k₉', 'k₁₀', 'k₁₁', 'k₁₂'],
      ['v₉', 'v₁₀', 'v₁₁', 'v₁₂'],
    ],
    summary: ['A₃', 'B₃'],
    outputs: ['o₉', 'o₁₀', 'o₁₁', 'o₁₂'],
  },
];

const STATE_CHAIN: { kind: 'state' | 'arrow'; tex: string }[] = [
  { kind: 'state', tex: 'S^{(0)}{=}0' },
  { kind: 'arrow', tex: '\\xrightarrow{\\;\\times A_1\\,+\\,B_1\\;}' },
  { kind: 'state', tex: 'S^{(1)}' },
  { kind: 'arrow', tex: '\\xrightarrow{\\;\\times A_2\\,+\\,B_2\\;}' },
  { kind: 'state', tex: 'S^{(2)}' },
];

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
/** cell index while a 0..1 sweep is running, -1 once it has settled */
const sweepCell = (p: number) => (p > 0 && p < 1 ? Math.min(3, Math.floor(p * 4)) : -1);

const Scene: React.FC = () => {
  const t = useTheme();

  // beat entrances — crossfade the explanation cards
  const chunkIn = useStepProgress('chunking', { portion: [0, 0.35], easing: 'inOut' });
  const projIn = useStepProgress('project', { portion: [0, 0.3], easing: 'inOut' });
  const sumIn = useStepProgress('summarize', { portion: [0, 0.3], easing: 'inOut' });
  const propIn = useStepProgress('propagate', { portion: [0, 0.3], easing: 'inOut' });
  const replayIn = useStepProgress('replay', { portion: [0, 0.3], easing: 'inOut' });
  const costIn = useStepProgress('cost', { portion: [0, 0.35], easing: 'inOut' });

  // in-beat motion
  const cut = useStepProgress('chunking', { easing: 'inOut' }); // one row → three chunks
  const projP = useStepProgress('project', { portion: [0.05, 0.6] }); // one matmul: everything lands at once
  const sumSweep = useStepProgress('summarize', { portion: [0.05, 0.72], easing: 'linear' });
  const sumChips = useStepProgress('summarize', { portion: [0.4, 1] });
  const propSeq = useStepProgress('propagate', { portion: [0.05, 1], easing: 'linear' });
  const replaySweep = useStepProgress('replay', { portion: [0.05, 0.95], easing: 'linear' });

  const cardO = {
    chunking: chunkIn * (1 - projIn),
    project: projIn * (1 - sumIn),
    summarize: sumIn * (1 - propIn),
    propagate: propIn * (1 - replayIn),
    replay: replayIn * (1 - costIn),
    cost: costIn,
  };

  const sumCell = sweepCell(sumSweep);
  const replayCell = sweepCell(replaySweep);
  // summary_step reads k·v (rows 1, 2); scan_chunk reads the state with q (row 0)
  const qkvHighlight: [number, number][] =
    sumCell >= 0
      ? [
          [1, sumCell],
          [2, sumCell],
        ]
      : replayCell >= 0
        ? [[0, replayCell]]
        : [];
  const chainRunning = propSeq > 0 && propSeq < 1;

  const rowCaption = (text: string, opacity: number) => (
    <div style={{ display: 'flex', justifyContent: 'center', opacity }}>
      <Label size="xs" mono color="muted" style={{ letterSpacing: '0.06em' }}>
        {text}
      </Label>
    </div>
  );

  return (
    <SlideFrame title="Chunkwise KDA — 순차 T를 C + G로" footer="ML Weekly · Kimi K3 · chunk_kda">
      <WalkthroughStage
        visual={
          <Fill>
            {({ width }) => {
              const gapPx = 10 + cut * 30; // the “cut”: widening gap splits the token row
              const mw = Math.min(360, (width - 2 * gapPx - 8) / 3);
              const chipW = Math.min(190, mw * 0.58);
              const chunkRow = (
                children: (chunk: (typeof CHUNKS)[number], g: number) => React.ReactNode,
              ) => (
                <div style={{ display: 'flex', gap: gapPx, justifyContent: 'center' }}>
                  {CHUNKS.map((chunk, g) => (
                    <div key={g} style={{ width: mw, display: 'flex', justifyContent: 'center' }}>
                      {children(chunk, g)}
                    </div>
                  ))}
                </div>
              );
              return (
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    gap: t.space(3),
                  }}
                >
                  <div style={{ opacity: cut }}>
                    {chunkRow((_, g) => (
                      <Label size="xs" mono color="muted">
                        CHUNK {g + 1} · C=4
                      </Label>
                    ))}
                  </div>

                  {/* token row — the frame-0 anchor, never revealed */}
                  {chunkRow((chunk) => (
                    <TensorMatrix values={[chunk.tokens]} width={mw} cellHeight={54} />
                  ))}

                  {rowCaption('① projection — q·k·v 전부 미리, matmul 한 번 · 재귀 없음', clamp01(projP * 2))}
                  {chunkRow((chunk) => (
                    <TensorMatrix
                      values={chunk.qkv}
                      width={mw}
                      cellHeight={44}
                      progress={projP}
                      highlight={qkvHighlight}
                      color={replayCell >= 0 ? 'ok' : 'accent'}
                    />
                  ))}

                  {rowCaption('② summary_step — k·v로 청크 요약 (A_g, B_g) · G개 병렬', clamp01(sumChips * 2))}
                  {chunkRow((chunk) => (
                    <TensorMatrix
                      values={[chunk.summary]}
                      width={chipW}
                      cellHeight={48}
                      progress={sumChips}
                      highlight={chainRunning ? [[0, 0], [0, 1]] : []}
                    />
                  ))}

                  {rowCaption('③ chunk_step — 시작 상태 순차 전파 · G 스텝', clamp01(propSeq * 3))}
                  <div
                    style={{
                      display: 'flex',
                      gap: t.space(2),
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  >
                    {STATE_CHAIN.map((item, k) => {
                      const o = clamp01(propSeq * STATE_CHAIN.length - k);
                      const appearing = o > 0 && o < 1;
                      return item.kind === 'state' ? (
                        <div
                          key={k}
                          style={{
                            padding: `${t.space(2)}px ${t.space(3)}px`,
                            borderRadius: t.radius.sm,
                            border: `1px solid ${
                              replayCell >= 0
                                ? t.palette.colors.ok
                                : appearing
                                  ? t.palette.colors.accent
                                  : t.palette.colors.border
                            }`,
                            background: t.palette.colors.surface,
                            opacity: o,
                          }}
                        >
                          <Tex size="sm">{item.tex}</Tex>
                        </div>
                      ) : (
                        <div key={k} style={{ opacity: o }}>
                          <Tex size="sm" color="textSecondary">
                            {item.tex}
                          </Tex>
                        </div>
                      );
                    })}
                  </div>

                  {rowCaption('④ scan_chunk — q로 상태 읽기, per-token 재계산 · 병렬', clamp01(replaySweep * 3))}
                  {chunkRow((chunk) => (
                    <TensorMatrix
                      values={[chunk.outputs]}
                      width={mw}
                      cellHeight={56}
                      progress={replaySweep}
                      color="ok"
                    />
                  ))}
                </div>
              );
            }}
          </Fill>
        }
        explanation={
          <Stack gap={3}>
            <Stack gap={2}>
              <Tex display size="md">{'S_t = A_t\\,S_{t-1} + b_t'}</Tex>
              <Tex size="sm" color="textSecondary">
                {'A_t = (I-\\beta_t k_t k_t^{\\top})\\,\\mathrm{Diag}(g_t)'}
              </Tex>
              <Tex size="sm" color="textSecondary">{'b_t = \\beta_t k_t v_t^{\\top}'}</Tex>
            </Stack>
            <EqSteps size="sm" parts={[{ tex: 'A_g = A_C \\cdots A_1', step: 'summarize' }]} />
            <EqSteps
              size="sm"
              parts={[{ tex: 'B_g = b_C + A_C\\,b_{C-1} + \\cdots', step: 'summarize' }]}
            />
            <EqSteps
              size="sm"
              parts={[{ tex: 'S^{(g)} = A_g\\,S^{(g-1)} + B_g', step: 'propagate' }]}
            />
            <EqSteps
              size="sm"
              parts={[{ tex: '\\mathrm{seq}\\;\\; T \\to C + G:\\quad 12 \\to 4 + 3', step: 'cost' }]}
            />
            <div style={{ position: 'relative', height: 280 }}>
              <ExplainerCard
                index={1}
                eyebrow="chunk_kda"
                title="순차 스캔을 그대로는 못 쓴다"
                style={{ position: 'absolute', inset: 0, opacity: cardO.chunking }}
              >
                recurrent 커널은 토큰마다 한 스텝 — 학습의 T는 수천이라 순차로는 못 돌린다. 시퀀스를
                C=4짜리 청크 G=3개로 자르면 순차 의존은 청크 사이에만 남는다.
              </ExplainerCard>
              <ExplainerCard
                index={2}
                eyebrow="qkv projection"
                title="토큰별 값은 전부 미리, 병렬로"
                style={{ position: 'absolute', inset: 0, opacity: cardO.project }}
              >
                q·k·v(그리고 g·β)는 이전 토큰에 의존하지 않는다 — 시퀀스 전체를 행렬곱 한 번으로
                계산해 둔다. 순차로 남는 건 상태 S 갱신뿐, 이게 청크 병렬화의 전제다.
              </ExplainerCard>
              <ExplainerCard
                index={3}
                eyebrow="summary_step"
                title="청크 = 상태에 대한 선형 변환 하나"
                style={{ position: 'absolute', inset: 0, opacity: cardO.summarize }}
              >
                청크 안 스캔이 k·v·g·β로 (A_g, B_g)를 누적한다 — A는 A_t의 곱, B는 감쇠
                누적합. 청크가 선형 변환 하나로 접혀, 청크끼리 G개 병렬.
              </ExplainerCard>
              <ExplainerCard
                index={4}
                eyebrow="chunk_step"
                title="청크 사이만 순차 — G 스텝"
                style={{ position: 'absolute', inset: 0, opacity: cardO.propagate }}
              >
                요약본을 순서대로 이어 붙이면 각 청크의 시작 상태가 나온다. 이 scan이 S_next가 아니라
                S_before를 돌려주는 이유 — 다음 단계가 초기값으로 쓰는 건 청크의 시작이기 때문.
              </ExplainerCard>
              <ExplainerCard
                index={5}
                eyebrow="scan_chunk"
                title="시작 상태에서 per-token 재계산"
                style={{ position: 'absolute', inset: 0, opacity: cardO.replay }}
              >
                step 함수는 recurrent_kda와 동일 — 시작 상태에서 vmap으로 병렬 재생하며 q_t로
                상태를 읽어 o_t를 낸다. 앞의 두 스캔은 청크 사이 통신이었을 뿐.
              </ExplainerCard>
              <ExplainerCard
                index={6}
                eyebrow="Sequential depth"
                tone="ok"
                title="순차 길이 T → C + G"
                style={{ position: 'absolute', inset: 0, opacity: cardO.cost }}
              >
                여기선 12 → 4+3, 실전 T=4096·C=64면 4096 → 128이다. per-token 수식은 한 글자도 바뀌지
                않았다 — 레퍼런스가 학습을 chunk 커널로만 지원하는 이유.
              </ExplainerCard>
            </div>
          </Stack>
        }
      />
    </SlideFrame>
  );
};

export const kdaChunkScene = defineScene(
  {
    id: '06-kda-chunk',
    title: '청크 병렬 KDA',
    steps: [
      step('chunking', 2.4),
      step('project', 2.6),
      step('summarize', 3.0),
      step('propagate', 2.8),
      step('replay', 3.0),
      step('cost', 2.6, { hold: 0.6 }),
    ],
  },
  Scene,
);

export default kdaChunkScene;
