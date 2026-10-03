# Scene recipes

Five scene shapes (and the title scene) cover almost every explanation. Each recipe is an excerpt of a **real, rendered scene** in `src/weeks/2026-10-03-style-pilot/scenes/` — open the file, copy it, rename the beats. If a recipe and its file ever disagree, the file is right.

Every recipe already obeys the hard rules: slots do the layout, frame 0 shows an anchor, every step ends static, one colour per quantity, one spoken phrase per beat.

**Before any code** (the beat sheet — see `SKILL.md` step 2):

1. 3–6 beats as `step('idea', seconds)`, 2.0–3.0 s each, the last one with `{ hold: 0.6 }`.
2. For each beat: what the picture does · the phrase (합니다체, one line) · the note.
3. The frame-0 anchor, and the quantities with their inks.

See the six scenes side by side: `npm run review -- 2026-10-03-style-pilot`.

---

## 1 · Chart + equation — `01-group-advantage.tsx`

A chart in the wide `stack` cell, the equation above it, the phrase below. The equation is written on in beat 2 and then follows the chart: when the bars change, the equation morphs. The chart's empty axes are the frame-0 anchor.

```tsx
/** one colour per quantity — yellow stays free: it is the pointer colour */
const QUANTITIES = { R: 'blue', Rbar: 'gold', A: 'green', out: 'green' } as const;

const Scene: React.FC = () => {
  const t = useTheme();
  const idx = useCurrentStepIndex();
  const growP = useStepProgress('group', { portion: [0.1, 0.7] });
  const meanP = useStepProgress('mean', { portion: [0, 0.4] });
  const gapP = useStepProgress('gap', { portion: [0.15, 0.8], easing: 'inOut' });
  // … one progress per beat that moves the chart; `chart` picks {values, from, morph} by `idx`

  // bars are scores (blue) until the subtraction, then gaps: above average green, below red
  const colors = drawn.map((v) =>
    interpolateColors(toGap, [0, 1], [t.palette.ink.blue, v >= 0 ? t.palette.ink.green : t.palette.ink.red]),
  );

  return (
    <Quantities map={QUANTITIES}>
      <Board
        title="평소보다 얼마나 잘했을까?"
        source="MiMo-V2.6 §4.1, §4.3.2"
        formula={
          <Formula
            size="xl"
            write="mean"
            then={[
              { step: 'gap', tex: '\\q{A}{A_i} = \\q{R}{R_i} - \\q{Rbar}{\\bar R}' },
              { step: 'rare', tex: '\\q{A}{A_i} = \\q{R}{1} - \\q{Rbar}{0.125} = \\q{out}{+0.875}' },
              { step: 'flat', tex: '\\q{A}{A_i} = \\q{R}{1} - \\q{Rbar}{1} = \\q{out}{0}' },
            ]}
            brace={{ key: 'Rbar', step: 'mean', delay: 1.2, until: 'gap', label: '평소 점수', color: 'gold' }}
            indicate={{ key: 'out', step: 'rare', delay: 1.3 }}
            box={{ key: 'out', step: 'flat', delay: 1.3 }}
          >
            {'\\q{Rbar}{\\bar R} = \\frac{1}{16}\\sum_{i=1}^{16} \\q{R}{R_i}'}
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
                labels={LABELS}
                colors={colors}
                refLines={[{ value: meanLine, label: '평균', color: 'gold', opacity: meanP }]}
                yDomain={[-0.75, 1]}       // pinned, so morphs never rescale the axis
                yTicks={[-0.5, 0, 0.5, 1]}
                textSize={t.fontSize.sm}
              />
            )}
          </Fill>
        }
        caption={
          <Captions
            items={[
              { step: 'group', text: <>같은 문제를 16번 풀게 합니다. 통과하면 <Term of="R">1점</Term>, 실패하면 <Term of="R">0점</Term>입니다</> },
              { step: 'mean', text: <>16번 중 10번 통과했으니 <Term of="Rbar">평균은 0.625</Term>입니다</> },
              { step: 'gap', text: <><Term of="Rbar">평균</Term>보다 잘한 풀이는 <Term of="A">위로</Term>, 못한 풀이는 아래로 갑니다</> },
              { step: 'rare', text: <>어려운 문제일수록 드문 성공을 <Term of="A">더 크게 밀어 올립니다</Term></> },
              { step: 'flat', text: <>모두 통과하면 차이가 없어서 배울 것도 없습니다</> },
            ]}
          />
        }
      />
    </Quantities>
  );
};
```

- Substituting numbers into the equation (`R_i` → `1`, `\bar R` → `0.125`) with the **same tags** makes each number appear exactly where its symbol was.
- Keep `refLines` in the array from frame 0 and fade them with `opacity`, so the plot never re-flows.
- Every number on screen is computed from the example data at the top of the file — never typed in.
- `LineChart` / `BarChart` go in the same slot the same way.

## 2 · Figure walkthrough — `02-router-walk.tsx`

A left-to-right diagram in the wide `stack` cell, no equation. The picture does the work; the phrase says what just happened.

```tsx
<Board
  title="누가 이 토큰을 맡을까?"
  source="Mixture of Experts"
  figure={
    <DiagramView
      diagram={router}
      stepEffects={{
        // '토큰' and 'Router' are in no reveal → on screen from frame 0 (the anchor)
        score: {
          reveal: [...routerIds.experts, ...routerIds.scores],
          highlight: ['router'],
          pulse: routerIds.scores,
        },
        pick: { highlight: routerIds.chosen, dim: routerIds.skipped },
        mix: { reveal: routerIds.output, pulse: ['e-expert-1-mix', 'e-expert-3-mix'], dim: routerIds.skipped },
      }}
    />
  }
  caption={
    <Captions
      items={[
        { step: 'score', text: <>Router가 Expert마다 점수를 매깁니다</> },
        { step: 'pick', text: <>점수가 높은 Expert 두 개만 일을 합니다</> },
        { step: 'mix', text: <>두 Expert의 출력을 점수만큼 섞어서 내보냅니다</> },
      ]}
    />
  }
/>
```

- The diagram file (`diagrams/router.diagram.ts`) has names on its nodes and numbers on its edges — no formulas — and exports `routerIds` so the scene never hand-lists ids. `Router` and `Expert` keep their English names in the figure *and* in the phrases.
- Effect arc: `reveal` (it appears) → `highlight` (look here) → `pulse` (it flows) → `dim` (what is left out).
- On a large figure add `camera: { focus: [adjacent ids], maxScale: 1 }` to the beats, and pull back to the whole figure on the last one.

## 3 · Figure + equation — `03-attention-split.tsx`

A top-to-bottom diagram in the tall left cell of `layout="split"`; the equation grows beside it and the phrase sits under the equation. The diagram nodes use ink names as their `variant`, so Query is blue in the figure and in the equation.

```tsx
const QUANTITIES = { Q: 'blue', K: 'teal', V: 'green', A: 'gold' } as const;
const SCORES = '\\frac{\\q{Q}{Q}\\,\\q{K}{K}^{\\top}}{\\sqrt{d}}';

<Quantities map={QUANTITIES}>
  <Board
    title="어디를 얼마나 볼까?"
    source="Attention"
    layout="split"
    figure={
      <DiagramView
        diagram={attention}
        stepEffects={{
          // Query, Key and Value are in no reveal → the frame-0 anchor
          match: { reveal: ['e-q-scores', 'e-k-scores', 'scores'], highlight: ['q', 'k'] },
          weights: { reveal: ['e-scores-weights', 'weights'], highlight: ['weights'] },
          mix: { reveal: ['e-weights-mix', 'e-v-mix', 'mix', 'e-mix-out', 'out'], highlight: ['v'] },
        }}
      />
    }
    formula={
      <Formula
        size="lg"
        write="match"
        then={[
          { step: 'weights', tex: `\\q{A}{A} = \\mathrm{softmax}\\!\\left(${SCORES}\\right)` },
          { step: 'mix', tex: `\\mathrm{softmax}\\!\\left(${SCORES}\\right)\\q{V}{V}` },
        ]}
      >
        {SCORES}
      </Formula>
    }
    caption={
      <Captions
        items={[
          { step: 'match', text: <><Term of="Q">Query</Term>와 <Term of="K">Key</Term>가 얼마나 닮았는지 점수를 냅니다</> },
          { step: 'weights', text: <>softmax로 점수를 합이 1인 <Term of="A">비율</Term>로 바꿉니다</> },
          { step: 'mix', text: <>그 비율만큼 <Term of="V">Value</Term>를 섞으면 출력이 됩니다</> },
        ]}
      />
    }
  />
</Quantities>
```

```ts
// diagrams/attention.diagram.ts — quantity nodes wear their ink, the rest stay grey
nodes: [
  { id: 'q', label: 'Query', variant: 'blue' },
  { id: 'k', label: 'Key', variant: 'teal' },
  { id: 'v', label: 'Value', variant: 'green' },
  { id: 'scores', kind: 'op', label: '점수', variant: 'op' },          // a value: a short Korean noun is fine
  { id: 'weights', kind: 'op', label: 'softmax', variant: 'gold' },    // a module: its name, in English
  …
]
```

- Build the equation up: reuse the previous form as a sub-expression (`${SCORES}`) so its glyphs stay put while the new part is written around it.
- `split` gives the phrase ~20 characters per line; `lg` is the equation size that fits.

## 4 · Derivation — `04-sum-to-zero.tsx`

No figure: the equation has the board to itself (`size="2xl"`), one move per beat. The title asks the question the derivation answers; each phrase says *why* the move is made; the new form is what it hands you. The definition is on screen from frame 0 (no `write`) — it is the anchor.

```tsx
const QUANTITIES = { A: 'green', R: 'blue', Rbar: 'gold', sixteen: 'gold' } as const;
const SUM = '\\sum_{i=1}^{16}';
const LHS = `${SUM} \\q{A}{A_i} =`;

<Quantities map={QUANTITIES}>
  <Board
    title="차이를 모두 더하면?"
    source="평균을 뺀 값의 성질"
    formula={
      <Formula
        size="2xl"
        // every form's `=` stays put, so only the side being rewritten moves
        align="equals"
        then={[
          { step: 'sum', tex: `${LHS} ${SUM} \\left( \\q{R}{R_i} - \\q{Rbar}{\\bar R} \\right)` },
          // `total` wraps the whole sum so the brace can sit under all of it; the R inside keeps its own tag
          { step: 'split', tex: `${LHS} \\q{total}{${SUM} \\q{R}{R_i}} - 16\\,\\q{Rbar}{\\bar R}` },
          { step: 'swap', tex: `${LHS} \\q{sixteen}{16\\,\\bar R} - 16\\,\\q{Rbar}{\\bar R}` },
          { step: 'zero', tex: `${LHS} \\q{out}{0}` },
        ]}
        brace={{ key: 'total', step: 'split', delay: 1.3, until: 'swap', label: '평균의 16배' }}
        box={{ key: 'out', step: 'zero', delay: 1.2 }}
      >
        {'\\q{A}{A_i} = \\q{R}{R_i} - \\q{Rbar}{\\bar R}'}
      </Formula>
    }
    caption={
      <Captions
        items={[
          { step: 'sum', text: <>한 그룹의 <Term of="A">차이</Term>를 전부 더해 보겠습니다</> },
          { step: 'split', text: <><Term of="Rbar">평균</Term>은 16번 똑같이 빠집니다</> },
          { step: 'swap', text: <><Term of="R">점수</Term>를 다 더한 값이 바로 평균의 16배입니다</> },
          { step: 'zero', text: <>그래서 합은 늘 0입니다. 누군가 오르면 누군가는 내려갑니다</> },
        ]}
      />
    }
  />
</Quantities>
```

- **Tag for identity.** A term that should stay where it is across a step keeps the same key and occurrence (`\q{Rbar}{\bar R}` is the subtracted mean in every form). A term that is *new* gets a new key (`sixteen`), or it would steal the old one's identity and send it flying.
- A tag may wrap other tags (`total` around the sum and its `R`): the brace covers the whole group, the inner term keeps its own colour.
- A brace announces the next move (`평균의 16배` under the sum, one beat before the sum is replaced by it) and leaves with `until`.

## 5 · 3D — `05-tensor-shards.tsx`

`ThreeScene` always renders full-frame, so it goes in the Board's `backdrop`; the title and the phrase line keep their usual places on top. ALL motion comes from `useStepProgress` / `useCurrentFrame` (never `useFrame`, never drei `<Text>` — `BillboardLabel` instead).

```tsx
const Scene: React.FC = () => {
  const t = useTheme();
  const meta = useSceneMeta();
  const frame = useCurrentFrame();
  const namesP = useStepProgress('whole', { portion: [0.1, 0.6] });
  const splitP = useStepProgress('shard', { portion: [0.1, 0.8], easing: 'inOut' });
  const moveP = useStepProgress('place', { portion: [0.1, 0.8], easing: 'inOut' });
  // a slow turn that stops before the last pause, so the final frame is still
  const last = meta.steps[meta.steps.length - 1]!;
  const spin = 0.75 + (Math.min(frame, last.animEndFrame) / last.animEndFrame) * 0.3;
  // theme context does not reach into the 3D canvas — pass colours in as props
  const inks = [t.palette.ink.blue, t.palette.ink.teal, t.palette.ink.green, t.palette.ink.gold];

  return (
    <Board
      title="큰 행렬을 여러 GPU에 나누기"
      source="Tensor parallelism"
      backdrop={
        <ThreeScene camera={{ position: [11 * Math.sin(spin), 4.6, 11 * Math.cos(spin)], target: [0, -0.9, 0], fov: 38 }}>
          <TensorBox
            dims={[8, 512, 4096]} dimLabels={['B', 'S', 'H']} maxExtent={3.4}
            labelOpacity={namesP * (1 - moveP)} color={inks[0]}
            split={{ axis: 2, parts: 4, gap: 0.28, colors: inks }}
            splitProgress={splitP}
            partOffsets={Array.from({ length: 4 }, () => [0, -2.1, 0] as [number, number, number])}
            moveProgress={moveP}
          />
          <GPUGrid count={4} columns={1} cell={3.4 / 4} gap={0.28} position={[0, -2.75, 0]}
                   activeIndices={moveP > 0.5 ? [0, 1, 2, 3] : []} activeColor={t.palette.colors.ok}
                   opacity={Math.min(1, moveP * 2)} />
        </ThreeScene>
      }
      caption={
        <Captions
          items={[
            { step: 'whole', text: <>가중치 한 덩어리가 GPU 한 대에는 너무 큽니다</> },
            { step: 'shard', text: <>H 방향으로 네 조각을 냅니다</> },
            { step: 'place', text: <>조각마다 GPU 한 대씩 맡습니다</> },
          ]}
        />
      }
    />
  );
};
```

- The object is on screen from frame 0 (the anchor); beat 1 only names its sides.
- Aim the camera so the object sits in the upper two thirds — the phrase line owns the bottom.
- Communication pulses: `ParallelFlow {from, to, progress}` with a cycling frame-derived progress (`(frame % 40) / 40`).

## Title — `00-title.tsx`

The one scene that uses the Board's free-form `children`. The `Title` is static (the frame-0 anchor); only the agenda lines are wiped in.

```tsx
<Board source="ML Weekly · 2026-10-03">
  <Center>
    <Stack gap={8} align="center">
      <div style={{ textAlign: 'center' }}>
        <Title sub="장면 다섯 가지로 보는 새 스타일">칠판 방식 레퍼런스</Title>
      </div>
      <Stack gap={2} align="center">
        {AGENDA.map((item, i) => (
          <Phrase key={item} step="agenda" delay={i * 0.35} color="textSecondary">
            {i + 1}. {item}
          </Phrase>
        ))}
      </Stack>
    </Stack>
  </Center>
</Board>
```

---

## Notes go with every recipe — `notes.ts`

```ts
chart: '같은 문제를 16번 풀게 한 뒤, 각 풀이를 그 그룹의 평균과 비교하는 장면입니다. 세 그룹은 모두 예시이고, …',
'chart/mean':
  '16개의 점수를 평균 내면 0.625입니다. 이 값은 모델이 이 문제에서 평소에 받는 점수라고 볼 수 있습니다. 그래서 이 점선이 다음 비교의 기준선이 됩니다.',
```

Keys are `'<nodeId>'` and `'<nodeId>/<stepId>'` (the node the scene is attached to in `explorable.details`), one per beat.

**Verify (always):** `npm run check` → `npm run review -- <weekId>--<sceneId>` → look at `out/review/<compId>/sheet.png` against the fit rules in `CLAUDE.md`.
