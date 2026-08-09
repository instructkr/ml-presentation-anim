# Scene recipes

Four worked shapes cover almost every explanation. Pick the closest, copy it, rename the beats. Every recipe already obeys the hard rules: no pixel budgets (presets + fill do layout), frame 0 shows an anchor, every step ends static.

**Beat checklist (do this before any code):**

1. Write 3–6 beats as `step('concept', seconds)` — one per presenter sentence, 1.6–3.0 s each, last one gets `{ hold: 0.5 }`.
2. Decide the frame-0 anchor: what is on screen before beat 1 plays (input node, equation shell, empty GPU rack, chart frame). It must NOT appear in any `reveal`/`Appear`.
3. Map each beat to ONE medium: diagram effect · equation term · chart sweep · 3D motion. A beat that needs two media is two beats.

---

## 1 · Diagram walkthrough (the default)

Visual left, explanation rail right. `DiagramView` has no width/height — it fills the cell `WalkthroughStage` gives it.

```tsx
import React from 'react';
import { Appear, defineScene, step } from '@/lib/timeline';
import { Callout, DiagramView, SlideFrame, Stack, Tex, WalkthroughStage } from '@/lib/kit';
import { routerDetail } from '../diagrams/router-detail.diagram';

export const routerScene = defineScene(
  {
    id: '02-router',
    title: '라우터 동작',
    steps: [step('scoring', 2.2), step('topk', 2.6), step('dispatch', 2.8, { hold: 0.5 })],
  },
  () => (
    <SlideFrame title="Router: 점수에서 Top-K까지" footer="ML Weekly">
      <WalkthroughStage
        visual={
          <DiagramView
            diagram={routerDetail}
            stepEffects={{
              // 'x'와 'router'는 어떤 reveal에도 없음 → frame 0부터 보이는 앵커
              scoring: {
                reveal: ['e-x-router', 'scores'],
                highlight: ['router'],
                camera: { focus: ['x', 'router', 'scores'], padding: 70 },
              },
              topk: { reveal: ['expert-1', 'expert-2', 'e-router-expert-1', 'e-router-expert-2'],
                      pulse: ['e-router-expert-1'], camera: { focus: ['router', 'expert-1', 'expert-2'] } },
              dispatch: { highlight: ['expert-1'], dim: 'others' },
            }}
          />
        }
        explanation={
          <Stack gap={4}>
            <Appear step="scoring" effect="rise">
              <Tex display size="lg">{'g = \\mathrm{softmax}(W_g x)'}</Tex>
            </Appear>
            <Appear step="dispatch" effect="fade" delay={0.3}>
              <Callout title="핵심">토큰당 Top-2만 활성화.</Callout>
            </Appear>
          </Stack>
        }
      />
    </SlideFrame>
  ),
);
export default routerScene;
```

- Effect arc that reads well on stream: `reveal` (등장) → `camera`+`highlight` (여기를 봐라) → `pulse` (흐름) → `dim: 'others'` (결론만 남기기).
- Large figure? Reveal via exported id bundles from the diagram file (`k3Ids` pattern in `2026-08-12-kimi-k3`), never a 70-id hand list.

## 2 · Diagram + step-lit equation (bottom band)

The equation is the story; the diagram sits above it. `placement="bottom"` gives the visual the full width and the explanation a bottom band. `EqSteps` lights terms on the SAME beat ids as the diagram effects.

```tsx
<SlideFrame title="Delta rule" footer="ML Weekly">
  <WalkthroughStage
    placement="bottom"
    visual={<DiagramView diagram={kdaDetail} stepEffects={{ /* beats as in recipe 1 */ }} />}
    explanation={
      <Stack gap={3}>
        <EqSteps
          size="md"
          parts={[
            { tex: 'S_t =' },                                   // no step → 항상 보이는 뼈대
            { tex: '\\mathrm{Diag}(\\alpha_t)', step: 'decay' }, // 'decay' 비트에 점등
            { tex: 'S_{t-1}' },
            { tex: '+\\, \\beta_t k_t v_t^{\\top}', step: 'write' },
          ]}
        />
        <Grid columns={2} gap={4}>
          <Appear step="decay" effect="rise"><Callout title="감쇠">…</Callout></Appear>
          <Appear step="write" effect="rise"><Callout tone="ok" title="쓰기">…</Callout></Appear>
        </Grid>
      </Stack>
    }
  />
</SlideFrame>
```

- Step-less `parts` are the frame-0 anchor — the equation skeleton is on screen from the first frame.
- Hidden terms keep their space (no reflow); unknown step ids render a red inline warning — fix immediately.

## 3 · Benchmark / trend beat (charts)

Charts take numeric sizes — get them from `<Fill>`; never invent pixels. Drive the sweep with `useStepProgress`.

```tsx
const Scene: React.FC = () => {
  const sweep = useStepProgress('sweep');
  return (
    <SlideFrame title="Benchmarks" footer="ML Weekly">
      <WalkthroughStage
        visual={
          <Fill>
            {({ width, height }) => (
              <BarChart
                width={width}
                height={height}
                progress={sweep}
                highlightIndex={0}
                data={[
                  { label: 'K3', value: 71.2 },
                  { label: 'K2', value: 63.8 },
                ]}
              />
            )}
          </Fill>
        }
        explanation={
          <Stack gap={3}>
            <Appear step="sweep" effect="rise">
              <ExplainerCard index={1} eyebrow="MMLU-Pro" title="설정 동일, 데이터만 교체">…</ExplainerCard>
            </Appear>
          </Stack>
        }
      />
    </SlideFrame>
  );
};
```

- `LineChart` identical pattern (`series`, `xScale/yScale: 'log'` for scaling laws); direct end-of-line labels are the legend.
- The chart frame/axes draw at `progress=0` → the chart itself is a valid frame-0 anchor.

## 4 · 3D tensor / parallelism beat

`ThreeScene` + pure-props kit; ALL motion comes from `useStepProgress` / `useCurrentFrame` (never `useFrame`, never drei `<Text>` — `BillboardLabel` instead). Full-bleed 3D + overlay text.

```tsx
const Scene: React.FC = () => {
  const t = useTheme();
  const meta = useSceneMeta();
  const frame = useCurrentFrame();
  const appearP = useStepProgress('tensor');  // frame-0 앵커가 아니라면 opacity로 등장
  const splitP = useStepProgress('shard');
  const moveP = useStepProgress('place');
  const spin = 0.75 + (frame / meta.durationInFrames) * 0.3;   // 느린 상시 회전
  return (
    <AbsoluteFill style={{ background: t.palette.colors.bg }}>
      <ThreeScene camera={{ position: [11 * Math.sin(spin), 4.6, 11 * Math.cos(spin)], target: [0, -0.8, 0], fov: 38 }}>
        <TensorBox
          dims={[8, 512, 4096]} dimLabels={['B', 'S', 'H']} maxExtent={3.4}
          opacity={appearP} labelOpacity={appearP * (1 - moveP)} color={t.palette.series[0]}
          split={{ axis: 2, parts: 4, gap: 0.28, colors: t.palette.series.slice(0, 4) }}
          splitProgress={splitP}
          partOffsets={Array.from({ length: 4 }, () => [0, -2.1, 0] as [number, number, number])}
          moveProgress={moveP}
        />
        <GPUGrid count={4} columns={1} cell={3.4 / 4} gap={0.28} position={[0, -2.75, 0]}
                 activeIndices={moveP > 0.5 ? [0, 1, 2, 3] : []} activeColor={t.palette.colors.ok}
                 opacity={Math.min(1, moveP * 2)} />
      </ThreeScene>
      <AbsoluteFill style={{ pointerEvents: 'none', padding: 64, fontFamily: t.fonts.sans }}>
        <Label size="lg" weight={700}>Tensor Parallelism</Label>
        <div style={{ position: 'absolute', left: 64, bottom: 64, maxWidth: 900 }}>
          <Appear step="shard" effect="rise">
            <Tex display size="md" color="textSecondary">{'W = [\\,W_1 \\;|\\; W_2\\,]'}</Tex>
          </Appear>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
```

- Communication pulses: `ParallelFlow {from, to, progress}` with a cycling frame-derived progress (`(frame % 40) / 40`).
- Camera moves = frame-derived `position`; hold the last beat static (rule 4) — freeze `spin` by clamping if it fights the settle.

---

**Verify (always):** `npm run check` → `npm run still -- <compId> out/last.png --frame=-1` (fully-revealed layout: cramped text/overflow shows here) → `npm run still -- <compId> out/first.png --frame=0` (anchor visible, not bare) → look at both PNGs.

**Common failures:** id in `stepEffects` not in the diagram (red on-canvas warning) · entrance longer than the step (violates end-static: raise `seconds` or add `hold`) · everything wrapped in `Appear`/`reveal` (bare frame 0) · hand-passed `width={…}` where a preset would do · un-escaped LaTeX backslash · KaTeX in edge labels (plain unicode only).
