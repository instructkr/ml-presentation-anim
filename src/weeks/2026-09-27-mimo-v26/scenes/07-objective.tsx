import React, { useMemo } from 'react';
import { interpolateColors } from 'remotion';
import { Appear, defineScene, step, useCurrentStepIndex, useStepProgress } from '@/lib/timeline';
import {
  Callout,
  ColumnBars,
  DiagramView,
  EqSteps,
  Fill,
  Grid,
  Label,
  SlideFrame,
  Spec,
  Stack,
  Tex,
  WalkthroughStage,
} from '@/lib/kit';
import { useTheme } from '@/lib/theme';
import { expectationDetail, expectationIds } from '../diagrams/obj-expectation.diagram';

/**
 * Eq. 1 (§4.1) read term by term as a weighted vote: 𝔼 says where the votes
 * come from (prompts drawn from every task dataset, 16 trajectories each,
 * written by the sampler μ_θold), every token of every trajectory votes to
 * raise or lower its own log-probability, A sets the direction and strength,
 * r re-weights each vote because the sampler, not π_θ, wrote the tokens, M
 * drops the votes whose correction cannot be trusted, and 1/Σ|oᵢ| gives
 * every prompt the same total say (prompt-mean aggregation, §5.1).
 *
 * The whole equation is the frame-0 anchor, so no part carries a `step`; each
 * part's colour is computed per frame instead (accent while its beat is
 * active, muted while another term has the floor). All worked numbers are
 * examples, computed below from the stated inputs:
 *   - next-token distribution after `return a`, one logit step of size 0.5 on log π(+)
 *   - 06's first prompt: one passing trajectory (A = +0.375), one failing (A = −0.625)
 *   - prompt-mean: the short group writes 16 × 10K tokens, the long group 16 × 150K
 */

// ── the equation, split into two rows; the math is Eq. 1 exactly ───────────────
// Row 1 is the expectation, row 2 the bracket it averages. \left[ … \right]
// cannot span two KaTeX renders, so the whole bracket lives on row 2; the
// delimiters themselves are unwrapped parts (a \left inside \htmlClass would
// be unbalanced), and the terms between them carry the per-beat colours.
type Term = 'shell' | 'logprob' | 'advantage' | 'ratio-mask' | 'prompt-mean' | 'whole';
const ROW_1: { tex: string; term?: Term }[] = [
  { tex: '\\mathcal{L}(\\theta) =' },
  // braces keep the minus unary, as in the paper
  { tex: '{-}', term: 'whole' },
  {
    tex: '\\mathbb{E}_{q\\sim\\bigcup_d \\mathcal{D}_d,\\ \\{o_i\\}_{i=1}^{G}\\sim\\mu_{\\theta_{\\mathrm{old}}}(\\cdot\\mid q)}',
    term: 'shell',
  },
];
const ROW_2: { tex: string; term?: Term; bare?: boolean }[] = [
  { tex: '\\left[', bare: true },
  { tex: '\\frac{1}{\\sum_{i=1}^{G}|o_i|}\\sum_{i=1}^{G}\\sum_{t=1}^{|o_i|}', term: 'prompt-mean' },
  { tex: 'r_{i,t}\\,M_{i,t}\\,', term: 'ratio-mask' },
  { tex: 'A_i\\,', term: 'advantage' },
  { tex: '\\log\\pi_\\theta(o_{i,t}\\mid q, o_{i,<t})', term: 'logprob' },
  { tex: '\\right]', bare: true },
];

// ── A: the next-token distribution after `return a` (예시) ─────────────────────
const CANDIDATES = ['+', '-', '*', '/', '%'];
const P_BEFORE = [0.55, 0.2, 0.15, 0.06, 0.04];
/** the token the model actually wrote */
const CHOSEN = 0;
/** one gradient step on log π(chosen) w.r.t. the logits: z_j += η(δ_j,chosen − p_j) */
const ETA = 0.5;
const P_AFTER = (() => {
  const raw = P_BEFORE.map((p, j) => p * Math.exp(ETA * ((j === CHOSEN ? 1 : 0) - p)));
  const s = raw.reduce((a, b) => a + b, 0);
  return raw.map((v) => v / s);
})();

// ── B: every token of a passing and a failing trajectory casts a vote (예시) ───
/** a blank column separates the two trajectories */
const GAP = 4;
const TOKENS = ['return', 'a', '+', 'b', '', 'return', 'a', '-', 'b'];
const A_TOKEN = TOKENS.map((_, i) => (i === GAP ? 0 : i < GAP ? 0.375 : -0.625));
/** r per token (예시); the failing trajectory's `-` sits outside the bounds 08 introduces, so M = 0 */
const R_TOKEN = [1.0, 0.9, 1.3, 1.1, 1, 0.9, 1.0, 6.0, 1.1];
const MASKED = [7];
const RMA_TOKEN = A_TOKEN.map((a, i) => (MASKED.includes(i) ? 0 : a * R_TOKEN[i]!));
const VOTE_LABELS = TOKENS.map((_, i) => i).filter((i) => i !== GAP);
const rList = (from: number, to: number) =>
  R_TOKEN.slice(from, to)
    .map((r) => r.toFixed(1))
    .join(' · ');

// ── C: prompt-mean vs batch token-mean (예시) ──────────────────────────────────
const TOKENS_SHORT = 16 * 10_000;
const TOKENS_LONG = 16 * 150_000;
const SHARE_TOKEN_MEAN = TOKENS_SHORT / (TOKENS_SHORT + TOKENS_LONG);
const SHARE_PROMPT_MEAN = 0.5;

/** kept on one line: no-break spaces around the equals sign */
const LOG_P_TEXT = `log\u00a0π\u00a0=\u00a0−${Math.abs(Math.log(P_BEFORE[CHOSEN]!)).toFixed(2)}`;

const signed = (v: number) => (Math.abs(v) < 5e-4 ? '0' : `${v > 0 ? '+' : '−'}${Math.abs(v).toFixed(3)}`);
const pct = (v: number) => `${Math.round(v * 100)}%`;

/** layers stacked in one cell so they crossfade without re-flowing the column */
const Swap: React.FC<{ layers: { opacity: number; node: React.ReactNode }[]; fill?: boolean }> = ({ layers, fill }) => (
  <div style={{ display: 'grid', ...(fill ? { height: '100%' } : {}) }}>
    {layers.map((l, i) => (
      <div key={i} style={{ gridArea: '1 / 1', opacity: l.opacity, minHeight: 0 }}>
        {l.node}
      </div>
    ))}
  </div>
);

/** math inside a caption line, sized to the caption text */
const Inline: React.FC<{ children: string }> = ({ children }) => (
  <Tex color="textSecondary" style={{ fontSize: '0.95em' }}>
    {children}
  </Tex>
);

/** one 100%-wide bar split between the short and the long group */
const ShareBar: React.FC<{ title: string; shareShort: number; opacity: number }> = ({ title, shareShort, opacity }) => {
  const t = useTheme();
  const c = t.palette.colors;
  return (
    <Stack gap={1} style={{ opacity }}>
      <Label size="sm" weight={600}>
        {title}
      </Label>
      <Stack direction="row" justify="space-between">
        <Label size="sm" mono color={t.palette.series[2]}>
          짧은 그룹 {pct(shareShort)}
        </Label>
        <Label size="sm" mono color={t.palette.series[3]}>
          긴 그룹 {pct(1 - shareShort)}
        </Label>
      </Stack>
      <div
        style={{
          display: 'flex',
          height: t.space(5),
          borderRadius: t.radius.sm,
          overflow: 'hidden',
          border: `1px solid ${c.border}`,
        }}
      >
        <div style={{ width: `${shareShort * 100}%`, background: t.palette.series[2] }} />
        <div style={{ flex: 1, background: t.palette.series[3], borderLeft: `2px solid ${c.bg}` }} />
      </div>
    </Stack>
  );
};

export const objectiveScene = defineScene(
  {
    id: '07-objective',
    title: 'Eq. 1: 토큰의 가중 투표',
    steps: [
      step('shell', 2.8),
      step('logprob', 3.0),
      step('advantage', 2.6),
      step('ratio-mask', 2.8),
      step('prompt-mean', 3.0),
      step('whole', 2.4, { hold: 0.6 }),
    ],
  },
  () => {
    const t = useTheme();
    const c = t.palette.colors;
    const idx = useCurrentStepIndex();

    // ── equation tint: accent on the active term, the rest muted while a term has the floor
    const on = (id: string, portion: [number, number] = [0, 0.2]) => useStepProgress(id, { portion });
    const enter = {
      // frame 0 shows the equation untinted; 𝔼 takes the floor a moment later
      shell: on('shell', [0.1, 0.3]),
      logprob: on('logprob'),
      advantage: on('advantage'),
      'ratio-mask': on('ratio-mask'),
      'prompt-mean': on('prompt-mean'),
      whole: on('whole'),
    };
    const active: Record<Term, number> = {
      shell: enter.shell * (1 - enter.logprob),
      logprob: enter.logprob * (1 - enter.advantage),
      advantage: enter.advantage * (1 - enter['ratio-mask']),
      'ratio-mask': enter['ratio-mask'] * (1 - enter['prompt-mean']),
      'prompt-mean': enter['prompt-mean'] * (1 - enter.whole),
      whole: enter.whole,
    };
    const reading = enter.shell * (1 - enter.whole);
    const base = interpolateColors(reading, [0, 1], [c.text, c.muted]);
    const tint = (term?: Term) => (term ? interpolateColors(active[term], [0, 1], [base, c.accent]) : base);
    // bare parts (the \left/\right pair) inherit the EqSteps container colour, set to `base` below
    const row = (parts: { tex: string; term?: Term; bare?: boolean }[]) =>
      parts.map((p) => (p.bare ? { tex: p.tex } : { tex: p.tex, color: tint(p.term) }));
    // EqSteps re-runs KaTeX whenever `parts` changes identity, so rebuild the rows only when a colour moves
    const colourKey = [base, ...(Object.keys(active) as Term[]).map((k) => tint(k))].join('|');
    const rows = useMemo(() => [row(ROW_1), row(ROW_2)], [colourKey]);
    const eqStyle: React.CSSProperties = { display: 'inline-block', color: base, fontSize: t.fontSize.lg };

    // ── chart A: grows in on logprob, then the chosen token rises
    const distGrow = useStepProgress('logprob', { portion: [0.15, 0.45] });
    const beforeLine = useStepProgress('logprob', { portion: [0.45, 0.55] });
    const rise = useStepProgress('logprob', { portion: [0.55, 0.92], easing: 'inOut' });
    // ── chart B: votes grow on advantage, r·M reshapes them on ratio-mask
    const voteGrow = useStepProgress('advantage', { portion: [0.25, 0.8] });
    const rmOut = useStepProgress('ratio-mask', { portion: [0, 0.12] });
    const rmMorph = useStepProgress('ratio-mask', { portion: [0.15, 0.7], easing: 'inOut' });
    const rmIn = useStepProgress('ratio-mask', { portion: [0.7, 0.9] });
    // ── chart C: token-mean first, then the prompt-mean bar rebalances to 50 : 50
    const tokenMeanIn = useStepProgress('prompt-mean', { portion: [0.12, 0.3] });
    const promptMeanIn = useStepProgress('prompt-mean', { portion: [0.4, 0.55] });
    const rebalance = useStepProgress('prompt-mean', { portion: [0.55, 0.95], easing: 'inOut' });
    // ── visual swaps: 𝔼 strip → distribution → votes → shares
    const toA = useStepProgress('logprob', { portion: [0, 0.15] });
    const toB = useStepProgress('advantage', { portion: [0, 0.2] });
    const toC = useStepProgress('prompt-mean', { portion: [0, 0.12] });
    const cap = (id: string) => useStepProgress(id, { portion: [0, 0.15] });
    const capIn = [1, cap('logprob'), cap('advantage'), cap('ratio-mask'), cap('prompt-mean'), cap('whole')];
    const capOpacity = (i: number) => capIn[i]! * (i + 1 < capIn.length ? 1 - capIn[i + 1]! : 1);

    const inRM = idx >= 3;
    const votes = inRM
      ? { values: RMA_TOKEN, from: A_TOKEN, morph: rmMorph, valueOpacity: rmOut < 1 ? 1 - rmOut : rmIn }
      : { values: A_TOKEN, from: undefined, morph: 1, valueOpacity: 1 };

    const caption = (text: React.ReactNode) => (
      <Label size="sm" color="textSecondary" weight={600}>
        {text}
      </Label>
    );

    return (
      <SlideFrame title="Eq. 1: 토큰마다 무게를 단 투표" footer="ML Weekly · MiMo-V2.6 §4.1, §5.1">
        <WalkthroughStage
          visual={
            <Stack gap={3} style={{ height: '100%' }}>
              {/* 식 전체가 frame-0 앵커 — 두 줄로 나눠 visual 열 안에 둔다 */}
              <Stack gap={1}>
                <Stack direction="row">
                  <EqSteps parts={rows[0]!} style={eqStyle} />
                </Stack>
                <Stack direction="row" justify="flex-end">
                  <EqSteps parts={rows[1]!} style={eqStyle} />
                </Stack>
              </Stack>
              <Swap
                layers={[
                  {
                    opacity: capOpacity(0),
                    node: caption(
                      <>
                        과제 데이터셋 전체에서 프롬프트 q를 뽑고, 롤아웃을 쓴 사본인 샘플러{' '}
                        <Inline>{'\\mu_{\\theta_{\\mathrm{old}}}'}</Inline>가 q마다 궤적 G = 16개를 쓴다.{' '}
                        <Inline>{'\\mathbb{E}'}</Inline>는 이렇게 뽑은 프롬프트와 궤적 전체에 걸친 평균이다.
                      </>,
                    ),
                  },
                  {
                    opacity: capOpacity(1),
                    node: caption(
                      <>
                        모델은 자리마다 다음 토큰 후보에 확률을 매긴다. ‘return a’ 다음에 실제로 쓴 +의 확률은{' '}
                        {P_BEFORE[CHOSEN]!.toFixed(2)}다 ({LOG_P_TEXT}). 이 토큰이 든 궤적이 좋았다면 학습 한 번에{' '}
                        {P_AFTER[CHOSEN]!.toFixed(2)}로 오른다 (예시).
                      </>,
                    ),
                  },
                  {
                    opacity: capOpacity(2),
                    node: caption(
                      <>
                        06편 첫 예시(16개 중 10개 통과)에서 통과한 궤적 하나와 실패한 궤적 하나의 토큰이다 (예시).
                        A의 부호는 방향을, 크기는 세기를 정하고, 한 궤적의 토큰은 모두 같은 A로 투표한다.
                      </>,
                    ),
                  },
                  {
                    opacity: capOpacity(3),
                    node: caption(
                      <>
                        궤적을 쓴 것은 학습 중인 <Inline>{'\\pi_\\theta'}</Inline>가 아니라 샘플러{' '}
                        <Inline>{'\\mu_{\\theta_{\\mathrm{old}}}'}</Inline>다. 그래서{' '}
                        <Inline>{'r = \\pi_\\theta/\\mu_{\\theta_{\\mathrm{old}}}'}</Inline>로 표의 무게를 고쳐 지금
                        모델이 직접 쓴 것처럼 맞춘다. 두 사본이 너무 달라 r이 1에서 멀면 이 보정을 믿기 어려우므로,
                        M = 0으로 그 표를 뺀다. 예시에서는 r = {R_TOKEN[MASKED[0]!]!.toFixed(1)}인 ‘-’가 빠진다
                        (자세히는 08편).
                      </>,
                    ),
                  },
                  {
                    opacity: capOpacity(4),
                    node: caption(
                      <>
                        짧은 그룹은 궤적마다 1만 토큰, 긴 그룹은 15만 토큰을 썼다 (예시). 토큰마다 똑같이 세면 긴
                        그룹이 무게의 {pct(1 - SHARE_TOKEN_MEAN)}를 가져간다.
                      </>,
                    ),
                  },
                  {
                    opacity: capOpacity(5),
                    node: (
                      <Stack gap={1}>
                        <Label size="sm" weight={600}>
                          한 문장으로: 샘플러가 프롬프트마다 쓴 궤적 16개에서, 평균보다 나은 궤적의 토큰은 확률을
                          올리고 못한 궤적의 토큰은 내리되, 표의 무게는 r로 보정하고 믿기 어려운 표는 M으로 빼며,
                          프롬프트마다 같은 몫을 준다.
                        </Label>
                        <Label size="sm" color="textSecondary">
                          앞의 마이너스 덕분에, 무게를 단 로그 확률의 평균을 키우는 일이 손실 L을 줄이는 일이 된다.
                        </Label>
                      </Stack>
                    ),
                  },
                ]}
              />
              <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
                {/* 𝔼 · 프롬프트와 궤적을 뽑는 과정 */}
                <div style={{ position: 'absolute', inset: 0, opacity: 1 - toA }}>
                  <DiagramView
                    diagram={expectationDetail}
                    stepEffects={{
                      // 데이터셋 상자들은 어떤 reveal에도 없음 — frame-0 앵커
                      shell: { reveal: expectationIds.shell },
                    }}
                  />
                </div>
                {/* A · 다음 토큰 분포 */}
                <div style={{ position: 'absolute', inset: 0, opacity: toA * (1 - toB) }}>
                  <Fill>
                    {({ width, height }) => (
                      <ColumnBars
                        width={width}
                        height={height}
                        values={P_AFTER}
                        from={P_BEFORE}
                        morph={rise}
                        progress={distGrow}
                        labels={CANDIDATES}
                        colors={CANDIDATES.map((_, i) => (i === CHOSEN ? undefined : 'muted'))}
                        highlight={idx >= 1 ? [CHOSEN] : []}
                        refLines={[{ value: P_BEFORE[CHOSEN]!, label: '학습 전', color: 'muted', opacity: beforeLine }]}
                        yDomain={[0, 0.8]}
                        yTicks={[0, 0.4, 0.8]}
                        yLabel="확률 π (예시)"
                        valueFormat={(v) => v.toFixed(2)}
                      />
                    )}
                  </Fill>
                </div>
                {/* B · 토큰별 투표 — r 자체는 두 궤적 위의 칩으로 */}
                <div style={{ position: 'absolute', inset: 0, opacity: toB * (1 - toC) }}>
                  <Stack gap={1} style={{ height: '100%' }}>
                    <Appear step="ratio-mask" effect="fade" delay={0.2}>
                      <Grid columns={2} gap={4}>
                        <Stack direction="row" justify="center">
                          <Spec label="통과 궤적의 r (예시)">{rList(0, GAP)}</Spec>
                        </Stack>
                        <Stack direction="row" justify="center">
                          <Spec label="실패 궤적의 r (예시)">{rList(GAP + 1, TOKENS.length)}</Spec>
                        </Stack>
                      </Grid>
                    </Appear>
                    <div style={{ flex: 1, minHeight: 0 }}>
                      <Fill>
                        {({ width, height }) => (
                          <ColumnBars
                            width={width}
                            height={height}
                            values={votes.values}
                            from={votes.from}
                            morph={votes.morph}
                            progress={voteGrow}
                            labels={TOKENS}
                            muted={inRM && rmMorph > 0.5 ? MASKED : []}
                            yDomain={[-0.75, 0.75]}
                            yTicks={[-0.5, 0, 0.5]}
                            yLabel="표의 무게"
                            // after r·M the only zero left is the masked token — name why it is zero
                            valueFormat={inRM ? (v) => (Math.abs(v) < 5e-4 ? 'M = 0' : signed(v)) : signed}
                            valueIndices={VOTE_LABELS}
                            valueOpacity={votes.valueOpacity}
                          />
                        )}
                      </Fill>
                    </div>
                  </Stack>
                </div>
                {/* C · 프롬프트 평균 */}
                <div style={{ position: 'absolute', inset: 0, opacity: toC }}>
                  <Stack gap={3} justify="center" style={{ height: '100%' }}>
                    <Stack direction="row" gap={2}>
                      <Spec label="짧은 그룹 (예시)">16 × 10K = 160K 토큰</Spec>
                      <Spec label="긴 그룹 (예시)">16 × 150K = 2.4M 토큰</Spec>
                    </Stack>
                    <ShareBar
                      title="토큰마다 똑같이 센다 (배치 전체의 토큰 평균)"
                      shareShort={SHARE_TOKEN_MEAN}
                      opacity={tokenMeanIn}
                    />
                    <ShareBar
                      title="프롬프트마다 똑같이 센다 (Eq. 1의 프롬프트 평균)"
                      shareShort={SHARE_TOKEN_MEAN + (SHARE_PROMPT_MEAN - SHARE_TOKEN_MEAN) * rebalance}
                      opacity={promptMeanIn}
                    />
                  </Stack>
                </div>
              </div>
            </Stack>
          }
          explanation={
            <Stack gap={2}>
              <Appear step="shell" effect="rise" delay={0.3}>
                <Callout title="목표: 좋은 궤적의 토큰을 더 자주">
                  나쁜 궤적의 토큰은 덜 자주 나오게 한다. 그래서 토큰마다 자기 확률을 올릴지 내릴지 투표하고,
                  표마다 무게를 단다.
                </Callout>
              </Appear>
              <Appear step="logprob" effect="rise" delay={0.3}>
                <Callout title="로그 확률: 실제로 쓴 토큰에 준 확률">
                  π는 앞 문맥이 주어졌을 때 모델이 바로 그 토큰을 고를 확률이다. 여기에 로그를 씌운 값이 투표
                  대상이고, 학습은 이 값을 올리거나 내린다.
                </Callout>
              </Appear>
              <Appear step="prompt-mean" effect="rise" delay={0.3}>
                <Callout tone="ok" title="프롬프트 평균: 문제마다 같은 몫">
                  1/Σ|o|는 한 프롬프트의 궤적 16개가 쓴 토큰 수로 나눈다. 그래서 그 안의 토큰은 무게가 같고
                  프롬프트마다 몫도 같다. 응답 길이가 너무 빨리 느는 것도 막는다.
                </Callout>
              </Appear>
            </Stack>
          }
        />
      </SlideFrame>
    );
  },
);

export default objectiveScene;
