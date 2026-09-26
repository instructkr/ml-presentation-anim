import React from 'react';
import { Appear, defineScene, step, useCurrentStepIndex, useStepProgress } from '@/lib/timeline';
import { Callout, DiagramView, EqSteps, Grid, Label, SlideFrame, Spec, Stack, WalkthroughStage } from '@/lib/kit';
import { useTheme } from '@/lib/theme';
import { muownSplit } from '../diagrams/opt-muown-split.diagram';
import { BOUND, G, LONGEST, R_EXAMPLE, R_NORMS, SPECTRAL, W_EXAMPLE } from '../data/opt-muown-example';

/**
 * §3.2 names Muown in one sentence; the mechanism is from the Muown paper
 * (Lion et al., 2026, arXiv 2605.10797). Spectral norm first, then how row
 * lengths bound it (max row ≤ ‖W‖₂ ≤ √m · max row, checkable on the 3 × 3
 * example; that row length is what drifts is Muown's analysis, credited as
 * such), then Muown's split W = Diag(g/‖R‖_row) · R with g stepped by Adam and
 * R by Muon. The stored form shows R with its own row lengths next to the
 * cached row norms, as Muown keeps them. Every number in the tables comes from
 * data/opt-muown-example.ts.
 */

/** up to two decimals, trailing zeros dropped, true minus sign */
const num = (v: number) => {
  const s = String(Number(Math.abs(v).toFixed(2)));
  return v <= -0.005 ? `−${s}` : s;
};

const W_ROWS = W_EXAMPLE.map((row, i) => [...row.map(num), num(G[i]!)]);
const SPLIT_ROWS = R_EXAMPLE.map((row, i) => [...row.map(num), num(R_NORMS[i]!), num(G[i]!)]);
const ROW_LABELS = W_EXAMPLE.map((_, i) => `행 ${i + 1}`);
const LENGTH_COL = W_EXAMPLE[0]!.length;
/** in the stored form: R's cached row norm, then g */
const NORM_COL = LENGTH_COL;
const G_COL = LENGTH_COL + 1;

interface RowTableProps {
  head: { label: string; span: number }[];
  rows: string[][];
  rowLabels: string[];
  /** [row, col] cells drawn in the accent */
  highlight?: [number, number][];
}

/** a small numeric table whose labels stay at readable sizes (≥ 20 px) */
const RowTable: React.FC<RowTableProps> = ({ head, rows, rowLabels, highlight = [] }) => {
  const t = useTheme();
  const c = t.palette.colors;
  const cols = rows[0]!.length;
  const lit = new Set(highlight.map(([r, k]) => `${r}:${k}`));
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `auto repeat(${cols}, minmax(0, 1fr))`,
        gap: t.space(1),
        alignItems: 'center',
      }}
    >
      <div />
      {head.map((h) => (
        <div
          key={h.label}
          style={{
            gridColumn: `span ${h.span}`,
            textAlign: 'center',
            color: c.muted,
            fontSize: t.fontSize.xs,
            borderBottom: `1px solid ${c.border}`,
            paddingBottom: t.space(0.5),
          }}
        >
          {h.label}
        </div>
      ))}
      {rows.map((row, r) => (
        <React.Fragment key={r}>
          <div style={{ color: c.textSecondary, fontSize: t.fontSize.xs, paddingRight: t.space(1) }}>
            {rowLabels[r]}
          </div>
          {row.map((cell, k) => {
            const on = lit.has(`${r}:${k}`);
            return (
              <div
                key={k}
                style={{
                  height: t.space(6),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: t.radius.sm,
                  border: `1px solid ${on ? c.accent : c.border}`,
                  background: on ? c.accentSoft : c.surface,
                  color: on ? c.text : c.textSecondary,
                  fontFamily: t.fonts.mono,
                  fontSize: t.fontSize.sm,
                  fontVariantNumeric: 'tabular-nums',
                  fontWeight: on ? 600 : 400,
                }}
              >
                {cell}
              </div>
            );
          })}
        </React.Fragment>
      ))}
    </div>
  );
};

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

const column = (k: number): [number, number][] => G.map((_, r) => [r, k]);
const lengthCol = () => column(LENGTH_COL);
const longestRow = (): [number, number][] => [...W_EXAMPLE[LONGEST]!.map((_, k): [number, number] => [LONGEST, k]), [LONGEST, LENGTH_COL]];

export const muownScene = defineScene(
  {
    id: '02-muown',
    title: 'Muown: 행 길이 따로',
    steps: [
      step('spectral', 2.6),
      step('rows', 2.8),
      step('split', 2.8),
      step('two-optimizers', 2.8),
      step('state', 2.6, { hold: 0.6 }),
    ],
  },
  () => {
    const t = useTheme();
    const idx = useCurrentStepIndex();
    const specIn = useStepProgress('spectral', { portion: [0.1, 0.35] });
    const rowsIn = useStepProgress('rows', { portion: [0.1, 0.35] });
    const splitOut = useStepProgress('split', { portion: [0, 0.15] });
    const splitIn = useStepProgress('split', { portion: [0.15, 0.4] });
    const twoIn = useStepProgress('two-optimizers', { portion: [0.1, 0.35] });
    const stateOut = useStepProgress('state', { portion: [0, 0.15] });
    const stateIn = useStepProgress('state', { portion: [0.15, 0.4] });
    const tableIn = useStepProgress('split', { portion: [0.2, 0.5] });
    const twoChips = useStepProgress('two-optimizers', { portion: [0.5, 0.75] });
    const stateChips = useStepProgress('state', { portion: [0.4, 0.65] });

    const wHighlight = idx === 1 ? [...longestRow(), ...lengthCol()] : [];
    // split: g is the new variable; state: the row state is g plus R's cached row norms
    const splitHighlight = idx === 2 ? column(G_COL) : idx === 4 ? [...column(NORM_COL), ...column(G_COL)] : [];

    return (
      <SlideFrame title="Muown: 행의 길이를 따로 다룬다" footer="ML Weekly · MiMo-V2.6 §3.2, §5.1 · Muown (Lion et al., 2026)">
        <WalkthroughStage
          visual={
            <Grid
              columns={2}
              gap={6}
              style={{ height: '100%', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)' }}
            >
              <Stack gap={3} style={{ minHeight: 0 }}>
                <div style={{ flex: 1, minHeight: 0 }}>
                  <DiagramView
                    diagram={muownSplit}
                    stepEffects={{
                      // 'w' is never revealed: the weight matrix is the frame-0 anchor
                      spectral: { highlight: ['w'] },
                      rows: { highlight: ['w'] },
                      split: { reveal: ['e-w-g', 'e-w-r', 'g', 'r'], highlight: ['g', 'r'] },
                      'two-optimizers': {
                        reveal: ['e-g-adam', 'e-r-muon', 'adam', 'muon', 'e-adam-w-next', 'e-muon-w-next', 'w-next'],
                        highlight: ['adam', 'muon'],
                      },
                      state: {
                        highlight: ['g', 'adam'],
                        dim: ['r', 'muon', 'e-w-r', 'e-r-muon', 'e-muon-w-next'],
                      },
                    }}
                  />
                </div>
                <EqSteps
                  size="md"
                  parts={[{ tex: 'W = \\mathrm{Diag}\\!\\left(\\frac{g}{\\|R\\|_{\\mathrm{row}}}\\right) R', step: 'split' }]}
                />
                <Swap
                  layers={[
                    {
                      opacity: twoChips * (1 - stateOut),
                      node: (
                        <Stack gap={2} align="flex-start">
                          <Spec label="§3.2" tone="ok">
                            스펙트럼 노름 드리프트 완화
                          </Spec>
                          <Spec label="§3.2" tone="ok">
                            weight decay 민감도 감소
                          </Spec>
                        </Stack>
                      ),
                    },
                    {
                      opacity: stateChips,
                      node: (
                        <Stack gap={2} align="flex-start">
                          <Spec label="행 상태">g · 행 노름 · Adam 모멘트 2개</Spec>
                          <Spec label="§5.1">SFT → RL로 그대로 넘김</Spec>
                        </Stack>
                      ),
                    },
                  ]}
                />
              </Stack>
              <Stack gap={3}>
                <Label size="sm" color="textSecondary" weight={600}>
                  예시: 3×3 가중치 W
                </Label>
                <RowTable
                  head={[
                    { label: 'W의 원소', span: LENGTH_COL },
                    { label: '행 길이', span: 1 },
                  ]}
                  rows={W_ROWS}
                  rowLabels={ROW_LABELS}
                  highlight={wHighlight}
                />
                <Appear step="spectral" effect="fade" delay={0.8}>
                  <Spec label="스펙트럼 노름">‖W‖₂ = σ₁ = {SPECTRAL.toFixed(2)}</Spec>
                </Appear>
                <Stack direction="row" gap={3} align="center">
                  <EqSteps
                    size="sm"
                    parts={[
                      {
                        tex: '\\max_i \\|w_i\\| \\;\\le\\; \\|W\\|_2 \\;\\le\\; \\sqrt{m}\\,\\max_i \\|w_i\\|',
                        step: 'rows',
                      },
                    ]}
                  />
                </Stack>
                <Appear step="rows" effect="fade" delay={1.2}>
                  <Stack direction="row" gap={3} align="center">
                    <Spec label="이 예시">
                      {num(BOUND.lo)} ≤ {SPECTRAL.toFixed(2)} ≤ {BOUND.hi.toFixed(2)}
                    </Spec>
                    <Label size="xs" color="muted">
                      m: 행 개수
                    </Label>
                  </Stack>
                </Appear>
                <div style={{ opacity: tableIn, marginTop: t.space(1) }}>
                  <Stack gap={3}>
                    <Label size="sm" color="textSecondary" weight={600}>
                      Muown이 저장하는 형태
                    </Label>
                    <RowTable
                      head={[
                        { label: '방향 변수 R', span: LENGTH_COL },
                        { label: '행 노름', span: 1 },
                        { label: '길이 g', span: 1 },
                      ]}
                      rows={SPLIT_ROWS}
                      rowLabels={ROW_LABELS}
                      highlight={splitHighlight}
                    />
                  </Stack>
                </div>
              </Stack>
            </Grid>
          }
          explanation={
            <Stack gap={3}>
              <Swap
                layers={[
                  {
                    opacity: specIn,
                    node: (
                      <Callout title="스펙트럼 노름 = 가장 큰 특이값">
                        행렬이 어떤 입력이든 가장 크게 늘리는 배율이다. Muon으로 오래 학습하면 이 값이 서서히 커지는
                        드리프트가 생긴다.
                      </Callout>
                    ),
                  },
                ]}
              />
              <Swap
                layers={[
                  {
                    opacity: rowsIn * (1 - splitOut),
                    node: (
                      <Callout tone="warn" title="행 하나 = 길이 × 방향">
                        스펙트럼 노름은 가장 긴 행의 길이보다 작을 수 없다. Muown 논문은 드리프트가 주로 이 행 길이가
                        자라서 생긴다고 분석한다.
                      </Callout>
                    ),
                  },
                  {
                    opacity: splitIn,
                    node: (
                      <Callout title="Muown: 길이와 방향을 따로 둔다">
                        옵티마이저 안에서 행 길이 g와 방향 R을 따로 학습한다. 순전파는 R의 각 행을 제 길이로 나누고
                        g를 곱해 같은 W를 만든다.
                      </Callout>
                    ),
                  },
                ]}
              />
              <Swap
                layers={[
                  {
                    opacity: twoIn * (1 - stateOut),
                    node: (
                      <Callout tone="ok" title="길이는 Adam, 방향은 Muon">
                        R은 Muon이, g는 Adam이 맡고 가중치 감쇠(weight decay)는 R에만 건다. Adam은 g를 조금씩만
                        옮기므로 행 길이가 튀지 않는다.
                      </Callout>
                    ),
                  },
                  {
                    opacity: stateIn,
                    node: (
                      <Callout tone="ok" title="추가 상태: 행마다 숫자 네 개">
                        Muown이 더 저장하는 것은 길이 m짜리 벡터 넷(g, 행 노름, g의 Adam 모멘트 둘)뿐이다. MiMo는
                        이 행 상태를 SFT에서 RL로 넘긴다.
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

export default muownScene;
