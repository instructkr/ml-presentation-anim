import React from 'react';
import { Appear, defineScene, step, useCurrentStepIndex, useStepProgress } from '@/lib/timeline';
import { Callout, Label, SlideFrame, Spec, Stack, WalkthroughStage } from '@/lib/kit';
import { useTheme } from '@/lib/theme';

/**
 * Which parameters get which optimizer, stage by stage: pre-training (§3.1),
 * mid-training (§3.2) and RL (§5.1). The table skeleton (stage headers and
 * parameter groups) is the frame-0 anchor; each stage's column fills on its
 * beat and the cells that change are lit. The RL column's embedding/LM-head
 * cells stay AdamW because §5.1 reports only a Muon part and an Adam part and
 * never says §3.2's split changed, so those two cells carry a 추정 tag (notes
 * say so too). The midtrain callout gives only Muon's own design as the reason
 * (Jordan 2024, see notes), never a reason MiMo does not state. Every chip
 * value is from the paper: §3.1 token counts, §3.2 context lengths, §5.1
 * hyperparameters.
 */

type Kind = 'adamw' | 'muown' | 'frozen';

const STAGES = ['사전학습', '중간학습', 'RL'];
const PARAMS = ['임베딩', '어텐션 투영', 'MoE 전문가', '라우터', 'LM head'];
const MAP: Kind[][] = [
  ['adamw', 'adamw', 'adamw'],
  ['adamw', 'muown', 'muown'],
  ['adamw', 'muown', 'muown'],
  ['adamw', 'adamw', 'frozen'],
  ['adamw', 'adamw', 'adamw'],
];
const TEXT: Record<Kind, string> = { adamw: 'AdamW', muown: 'Muown', frozen: '고정' };
/** [row, col] cells the paper does not state: §5.1 never says §3.2's AdamW split changed, so these are read on */
const INFERRED = new Set(['0:2', '4:2']);

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

/** the stage × parameter map; `columnP[c]` fades column c in, `lit` cells glow in the accent */
const OptimizerMap: React.FC<{ columnP: number[]; lit: [number, number][] }> = ({ columnP, lit }) => {
  const t = useTheme();
  const c = t.palette.colors;
  const litSet = new Set(lit.map(([r, k]) => `${r}:${k}`));
  const look = (kind: Kind) =>
    kind === 'muown'
      ? { background: t.palette.diagram.proj!.fill, border: `2px solid ${t.palette.diagram.proj!.stroke}`, color: c.text }
      : kind === 'adamw'
        ? { background: t.palette.diagram.norm!.fill, border: `2px solid ${t.palette.diagram.norm!.stroke}`, color: c.text }
        : { background: 'transparent', border: `2px dashed ${c.muted}`, color: c.textSecondary };
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `auto repeat(${STAGES.length}, minmax(0, 1fr))`,
        columnGap: t.space(3),
        rowGap: t.space(1.5),
        alignItems: 'center',
      }}
    >
      <div />
      {STAGES.map((s) => (
        <div
          key={s}
          style={{
            textAlign: 'center',
            fontSize: t.fontSize.sm,
            fontWeight: 700,
            color: c.text,
            paddingBottom: t.space(1),
            borderBottom: `1px solid ${c.border}`,
          }}
        >
          {s}
        </div>
      ))}
      {PARAMS.map((p, r) => (
        <React.Fragment key={p}>
          <div style={{ fontSize: t.fontSize.sm, color: c.textSecondary, paddingRight: t.space(2) }}>{p}</div>
          {MAP[r]!.map((kind, k) => {
            const on = litSet.has(`${r}:${k}`);
            const p0 = columnP[k] ?? 0;
            return (
              <div
                key={k}
                style={{
                  height: t.space(8),
                  borderRadius: t.radius.sm,
                  border: `1px dashed ${c.border}`,
                  position: 'relative',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: t.radius.sm,
                    fontSize: t.fontSize.sm,
                    fontWeight: 600,
                    ...look(kind),
                    ...(on ? { boxShadow: `0 0 0 ${t.stroke.med}px ${c.accent}, 0 0 ${t.space(3)}px ${c.accent}66` } : {}),
                    opacity: p0,
                    transform: `translateY(${(1 - p0) * 10}px)`,
                  }}
                >
                  {TEXT[kind]}
                  {INFERRED.has(`${r}:${k}`) ? (
                    <span
                      style={{
                        position: 'absolute',
                        right: t.space(1.5),
                        fontSize: t.fontSize.xs,
                        fontWeight: 400,
                        color: c.muted,
                      }}
                    >
                      추정
                    </span>
                  ) : null}
                </div>
              </div>
            );
          })}
        </React.Fragment>
      ))}
    </div>
  );
};

/** a labelled row of chips; the label column keeps every row's chips aligned */
const ChipRow: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => {
  const t = useTheme();
  return (
    <div
      style={{ display: 'grid', gridTemplateColumns: `${t.space(19)}px 1fr`, alignItems: 'center', columnGap: t.space(2) }}
    >
      <Label size="xs" color="muted" weight={600}>
        {label}
      </Label>
      <Stack direction="row" gap={2} style={{ flexWrap: 'wrap' }}>
        {children}
      </Stack>
    </div>
  );
};

export const optimizerMapScene = defineScene(
  {
    id: '03-optimizer-map',
    title: '파라미터별 옵티마이저',
    steps: [
      step('pretrain', 2.4),
      step('midtrain', 3.0),
      step('mismatch', 2.6),
      step('rl-config', 3.0),
      step('init', 2.6, { hold: 0.6 }),
    ],
  },
  () => {
    const idx = useCurrentStepIndex();
    const colP = [
      useStepProgress('pretrain', { portion: [0.05, 0.4] }),
      useStepProgress('midtrain', { portion: [0.05, 0.35] }),
      useStepProgress('rl-config', { portion: [0.05, 0.35] }),
    ];
    // chip panel: pretrain → midtrain (stays through mismatch) → RL
    const preIn = useStepProgress('pretrain', { portion: [0.35, 0.65] });
    const midOut = useStepProgress('midtrain', { portion: [0, 0.12] });
    const midIn = useStepProgress('midtrain', { portion: [0.4, 0.65] });
    const rlOut = useStepProgress('rl-config', { portion: [0, 0.12] });
    const rlIn = useStepProgress('rl-config', { portion: [0.35, 0.55] });
    // rail: A = midtrain, B = mismatch, C = rl-config → init
    const railA = useStepProgress('midtrain', { portion: [0.4, 0.65] });
    const railB = useStepProgress('mismatch', { portion: [0.1, 0.35] });
    const railC1 = useStepProgress('rl-config', { portion: [0.55, 0.8] });
    const initOut = useStepProgress('init', { portion: [0, 0.15] });
    const railC2 = useStepProgress('init', { portion: [0.15, 0.4] });

    const lit: [number, number][] =
      idx === 1
        ? [
            [1, 1],
            [2, 1],
          ]
        : idx === 4
          ? [[3, 2]]
          : [];

    return (
      <SlideFrame title="어떤 파라미터에 어떤 옵티마이저를" footer="ML Weekly · MiMo-V2.6 §3.1, §3.2, §5.1">
        <WalkthroughStage
          visual={
            <Stack gap={6} style={{ height: '100%' }}>
              {/* stage headers + parameter rows are the frame-0 anchor; cells fill per stage */}
              <OptimizerMap columnP={colP} lit={lit} />
              <Swap
                layers={[
                  {
                    opacity: preIn * (1 - midOut),
                    node: (
                      <Stack gap={3}>
                        <Label size="sm" color="textSecondary" weight={600}>
                          사전학습 (§3.1)
                        </Label>
                        <ChipRow label="Flash">
                          <Spec label="토큰">48T = 텍스트 단계 26T + 옴니 단계 22T</Spec>
                        </ChipRow>
                        <ChipRow label="Pro">
                          <Spec label="토큰">30T = 텍스트 단계 27T + 옴니 단계 3T</Spec>
                        </ChipRow>
                        <ChipRow label="공통">
                          <Spec label="문맥 길이">32K → 256K</Spec>
                        </ChipRow>
                      </Stack>
                    ),
                  },
                  {
                    opacity: midIn * (1 - rlOut),
                    node: (
                      <Stack gap={3}>
                        <Label size="sm" color="textSecondary" weight={600}>
                          중간학습 (§3.2)
                        </Label>
                        <ChipRow label="함께 바뀌는 것">
                          <Spec label="문맥 길이">256K → 1M</Spec>
                          <Spec label="QAT">MXFP4</Spec>
                          <Spec label="데이터">보상 해킹 교정 예제 (§4.2.6)</Spec>
                        </ChipRow>
                        <Label size="sm" color="textSecondary">
                          QAT(양자화 인식 학습)는 MXFP4 같은 4비트 연산을 흉내 내며 학습해서, 모델이 저정밀 계산에 미리
                          적응하게 한다.
                        </Label>
                      </Stack>
                    ),
                  },
                  {
                    opacity: rlIn,
                    node: (
                      <Stack gap={3}>
                        <Label size="sm" color="textSecondary" weight={600}>
                          RL 옵티마이저 설정 (§5.1)
                        </Label>
                        <ChipRow label="공통">
                          <Spec label="학습률">3×10⁻⁶</Spec>
                          <Spec label="weight decay">없음</Spec>
                          <Spec label="warmup">없음</Spec>
                          <Spec label="grad clip">1.0</Spec>
                        </ChipRow>
                        <ChipRow label="Muon 부분">
                          <Spec label="momentum">0.95 · Nesterov</Spec>
                          <Spec label="Newton–Schulz">10회</Spec>
                          <Spec label="업데이트 스케일">0.5</Spec>
                        </ChipRow>
                        <ChipRow label="Adam 부분">
                          <Spec label="β₁ = β₂">0.95</Spec>
                          <Spec label="ε">10⁻⁸</Spec>
                        </ChipRow>
                        <Appear step="init" effect="fade" delay={0.5}>
                          <ChipRow label="출발점">
                            <Spec label="SFT에서" tone="ok">
                              FP32 마스터 가중치 + Muown 행 상태
                            </Spec>
                            <Spec label="목적" tone="ok">
                              MXFP4 학습 안정화
                            </Spec>
                          </ChipRow>
                        </Appear>
                      </Stack>
                    ),
                  },
                ]}
              />
            </Stack>
          }
          explanation={
            <Stack gap={3}>
              <div style={{ opacity: railA }}>
                <Callout title="은닉 행렬만 Muown으로">
                  Muon은 은닉층의 가중치 행렬을 위해 만든 옵티마이저다. MiMo도 Muon 저자들처럼 임베딩과 LM head는
                  AdamW에 둔다.
                </Callout>
              </div>
              <div style={{ opacity: railB }}>
                <Callout tone="warn" title="옵티마이저 불일치란">
                  Adam으로 사전학습한 모델을 Muon으로 이어 학습할 때 이미 배운 지식이 흐트러지는 현상이다. MiMo는
                  손실이 튀지 않았다.
                </Callout>
              </div>
              <Swap
                layers={[
                  {
                    opacity: railC1 * (1 - initOut),
                    node: (
                      <Callout title="설정 읽는 법">
                        grad clip 1.0은 기울기 전체의 크기가 1.0을 넘으면 1.0으로 줄인다. 업데이트 스케일 0.5는 Muon이
                        낸 업데이트에 한 번 더 곱하는 배수다.
                      </Callout>
                    ),
                  },
                  {
                    opacity: railC2,
                    node: (
                      <Callout tone="ok" title="RL의 출발점">
                        FP32 마스터 가중치는 저정밀 계산과 따로 두는 32비트 원본이다. RL은 이것과 행 상태를 SFT에서
                        이어받는다.
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

export default optimizerMapScene;
