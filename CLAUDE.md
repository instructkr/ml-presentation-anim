# ML Presentation Animation System

Weekly LLM-paper presentations as an **interactive explorable**: the architecture diagram is the home screen; clicking a module zooms in and plays a step-animated explanation. Remotion renders scenes; React Flow drives the explorer; everything shares one component kit and one palette.

## Commands

| Command | What |
|---|---|
| `npm run dev` | explorer app (present from here) — http://localhost:5173 |
| `npm run studio` | Remotion Studio (scrub/tune scenes, visual props) |
| `npm run render -- <compId> out/x.mp4` | render one scene (`<compId>` = `<weekId>--<sceneId>`) |
| `npm run render:week -- <weekId>` | render every scene of a week to `out/<weekId>/` |
| `npm run still -- <compId> out/x.png --frame=N` | render one frame (Tex/font verification) |
| `npm run check` | typecheck — run after every generation |

## Hard rules

1. **Never `useFrame`** inside 3D — all animation derives from `useCurrentFrame()` / `useStepProgress()`. 3D kit components are pure functions of props; scenes compute progress and pass it down.
2. **Never `Math.random()` / `Date.now()`** in scenes — use `random(seed)` from remotion if needed.
3. **All colors/sizes from tokens** (`useTheme()`); never hardcode hex in scenes.
4. **Every step ends static**: animations must complete within the step's `seconds`; add `hold` for settle time. The presenter pause lands on the step's last frame.
5. **Register weeks only in `src/weeks/index.ts`** (no globs — dual bundlers).
6. Scene ids are `NN-kebab-name`; composition ids become `<weekId>--<sceneId>`.
7. Korean text: kit components already set `word-break: keep-all` — don't override.
8. For any Remotion API question fetch `https://remotion.dev/docs/<page>.md` (raw markdown) — do not guess.
9. LaTeX in TSX: escape backslashes — `{'\\mathrm{softmax}(W_g x)'}`.

## File layout

```
src/weeks/<YYYY-MM-DD-topic>/
  manifest.ts                 # WeekManifest: explorable {root, details, path}, slides?, scenes[]
  diagrams/*.diagram.ts       # defineDiagram(...) data files
  scenes/NN-name.tsx          # defineScene(...) animated explanations
  interactive/*.tsx           # live components (OrbitControls/state allowed — never rendered)
src/lib/{theme,timeline,diagram,kit,explorer}   # the framework — extend, don't fork
```

## Authoring a scene (the pattern)

```tsx
import React from 'react';
import { Appear, defineScene, step, useStepProgress } from '@/lib/timeline';
import { Callout, DiagramView, SlideFrame, Stack, Tex } from '@/lib/kit';
import { myDiagram } from '../diagrams/my.diagram';

export const myScene = defineScene(
  {
    id: '02-routing',
    title: '라우팅 동작',                       // explorer/breadcrumb label
    steps: [                                   // named after PRESENTATION BEATS
      step('arrive', 1.8),                     // seconds of animation
      step('score', 2.6),
      step('select', 2.8, { hold: 0.5 }),      // hold = static tail frames
    ],
  },
  () => (
    <SlideFrame title="Router" footer="ML Weekly">
      <Stack direction="row" gap={5} style={{ height: '100%' }}>
        <DiagramView
          diagram={myDiagram}
          width={1150}
          height={780}
          stepEffects={{
            arrive: { reveal: ['x', 'router', 'e-x-router'] },
            score:  { pulse: ['e-router-expert-1'], highlight: ['router'] },
            select: { highlight: ['expert-1'], dim: ['expert-2'] },
          }}
        />
        <Stack gap={4} justify="center" style={{ flex: 1 }}>
          <Appear step="score" effect="rise">
            <Tex display size="lg">{'g = \\mathrm{softmax}(W_g x)'}</Tex>
          </Appear>
          <Appear step="select" effect="fade" delay={0.4}>
            <Callout title="핵심">토큰당 Top-2만 활성화.</Callout>
          </Appear>
        </Stack>
      </Stack>
    </SlideFrame>
  ),
);
export default myScene;
```

`stepEffects` semantics: `reveal` is cumulative (ids hidden until revealed — ids never listed in any reveal are visible from frame 0); `highlight`/`pulse`/`dim` apply only while their step is active; `dim: 'others'` dims everything not referenced by the current step. `move: {nodeId: {dx, dy}}` glides nodes by diagram-px offsets — cumulative like `reveal`: the offset eases in over the owning step's animation window and persists afterwards (offsets from several steps sum); attached edges and group boxes follow every frame, and the view is pre-fitted to the union of all morph states so the scale never jumps. `move` takes node ids only. A `reveal` list can be arbitrarily long — the entrance stagger compresses so the last id still finishes by the step's `animEndFrame`. Unknown ids show a red on-canvas warning — fix immediately.

`camera: {focus: ['node-a', 'node-b'], padding?, maxScale?}` gives a step a Manim-style deterministic 2D camera move. The camera eases from the previous beat, frames the listed nodes/groups, and persists until another beat supplies a camera. Pair it with `highlight` for walkthroughs: camera establishes where to look; highlight explains what matters there.

## Kit reference (all from `@/lib/kit`)

- `SlideFrame {title?, footer?, children}` — 1920×1080 slide chrome.
- `Stack {direction?, gap?, align?, justify?}` · `Grid {columns, gap?}` · `Center` · `WalkthroughStage {visual, explanation, placement right|bottom|overlay}` — layout (gap in 8px units).
- `Title {sub?}` · `Label {size xs..xl, color?, weight?, mono?}` · `Callout {tone?, title?}` · `ExplainerCard {index?, eyebrow?, title, tone?}` — text; ko + inline English fine.
- `Tex {children: string, display?, size sm..xl, color?}` — KaTeX.
- `DiagramView {diagram, stepEffects?, width?, height?}` — step-driven diagram (scenes only).
- `Block/GroupBox/ArrowEdge` — diagram atoms (rarely used directly; DiagramView/explorer render them).
- `ThreeScene {camera?: {position, target, fov}, children}` — Remotion-safe 3D stage. Camera moves = frame-derived position.
- `TensorBox {dims:[a,b,c], dimLabels?, split?: {axis, parts, gap?, colors?}, splitProgress?, partOffsets?, moveProgress?, opacity?, labelOpacity?, maxExtent?, color?}` — pure props; drive with `useStepProgress`; fade `labelOpacity` to 0 once dim labels go stale (e.g. after shards land on GPUs).
- `TensorMatrix {values, rowLabels?, columnLabels?, highlight?, progress?, title?}` — crisp 2D tensor/matrix cells that can reveal beside a running diagram; numeric cells use tabular alignment.
- `GPUGrid {count, columns?, cell?, gap?, position?, activeIndices?, activeColor?, opacity?}`.
- `BillboardLabel {text, position, height?, color?}` — deterministic 3D text (never drei `<Text>`).
- `BarChart {data:[{label,value,color?}], progress?, width, height, maxValue?, valueFormat?, highlightIndex?}` — SVG horizontal bar chart for benchmark tables; single-hue by default (`palette.series[0]`), `progress` sweeps linearly (drive with `useStepProgress`), value labels fade in at the end.
- `LineChart {series:[{label,color?,points:[{x,y}]}], width, height, progress?, xScale?/yScale? linear|log, xTicks?/yTicks?, xFormat?/yFormat?, xLabel?/yLabel?, markers?, highlightSeries?}` — SVG line chart for trend/scaling plots; series colors follow `palette.series` in fixed order; direct end-of-line labels are the legend; `progress` sweeps all series together (drive with `useStepProgress`).
- `EqSteps {parts:[{tex, step?, color?}], display?, size sm..xl}` — one KaTeX equation revealed term by term: a part with `step` fades in at that step's start and is tinted (`color` ?? accent) while the step is active, then settles to text color; hidden terms keep their space, so nothing reflows. Scene-only; unknown step ids render a red inline warning.
- `Code {children: string, fontSize?, highlightLines?: number[], title?}` — mono code block, no highlighting deps; line numbers + `accentSoft` line highlight.
- `ParallelFlow {from:V3, to:V3, progress, color?, count?, size?, bidirectional?}` — pure-props 3D data-movement pulses (all-reduce/all-gather); drive with a cycling frame-derived `progress`.

Timeline (from `@/lib/timeline`): `defineScene`, `step(id, seconds, {hold?})`, `Appear {step, effect fade|rise|pop|left, delay?, duration?, index?, stagger?}`, `useStepProgress(stepId, {portion?, easing?}) → 0..1`, `useSceneMeta()`, `staggerProgress/lerp/lerp3`.

Theme (from `@/lib/theme`): `useTheme()` → `palette.colors.*`, `palette.series[]` (categorical, fixed order), `palette.diagram[variant]`, `fontSize`, `space(n)`. Diagram variants: `attention, ffn, norm, route, embed, io, op, annotation, default, group, proj` (maroon — learned projections), `expertShared` (green), `expertRouted` (navy).

## Diagram files

```ts
import { defineDiagram } from '@/lib/diagram';
export const myDiagram = defineDiagram({
  id: 'my-arch',
  direction: 'TB',                              // or 'LR'
  groups: [{ id: 'moe', label: 'MoE Layer' }],
  nodes: [
    { id: 'input', kind: 'io', label: '입력', variant: 'io' },
    { id: 'attn', label: 'Attention', variant: 'attention', tex: 'QK^{\\top}V' },
    { id: 'e1', label: 'Expert 1', variant: 'ffn', parent: 'moe' },
  ],
  edges: [{ id: 'e-input-attn', from: 'input', to: 'attn', style: 'dashed', label: 'g₁' }],
});
```

Validated at import (unknown refs/duplicate ids throw). Edge id convention: `e-<from>-<to>`. Edge labels are **plain text, never KaTeX** — use unicode (`hₗ`, `Wₒ`, `g₁`), not `h_l`. They render beside the line, never on it; `labelPos: 0..1` slides one along the shared layout path in scenes, the explorer, and the editor (widen `layout: {rankGap}` if a corridor is cramped). Group labels are solid-bg chips that auto-dodge member entry lines (`groupLabelLeft`) — don't hand-tune label collisions. Layout is automatic (dagre); `position` on every node skips auto-layout. Recreating a paper figure from a screenshot: enumerate every node and edge you see FIRST, then write the file; keep block names English, annotations Korean.

Node extras: `shape: 'rect' | 'circle' | 'pill' | 'trapUp' | 'trapDown' | 'hourglass' | 'bars'` (trapezoid slant shows which way the width changes — `trapUp` = narrow bottom → wide top = an up-projection in an upward-flowing figure; `hourglass` = a low-rank pair, drawn unlabelled), `math: true` to render the label through KaTeX (`\\alpha`, `\\sigma`, `N`), `muted: true` for elements that are present but inactive (unselected experts). Give circles/chips an explicit `size`. `title` names a node/group in the deck chrome (breadcrumb, guided path, overview) when `label` is unsuitable there — raw-KaTeX `math` labels or blank glyph nodes; falls back to `label`, then the id. Edge extras: `style` also takes `'dotted'`; `color` takes a token name (`'accent'`) or raw CSS.

**Hand-routed figures** (every node has `position`) unlock three more things, all rejected under auto-layout: `waypoints: [{x,y}, …]` on an edge for orthogonal elbows (endpoints automatically clip to the face they approach, including when a GUI leaves its last waypoint inside the target), `arrow: false` for rails that just carry a value, and edges whose `from`/`to` is a **group id**, for panel-to-panel callouts. Groups take `rect: {x,y,w,h}` (explicit box instead of member bounds) and `dash: 'dashed' | 'dotted'`. See `src/weeks/2026-08-12-kimi-k3/diagrams/kimi-k3-arch.diagram.ts` for a 70-node reconstruction using all of it, including the `k3Ids` pattern for deriving `stepEffects` reveal bundles instead of hand-listing ids.

Sizing rule of thumb: a diagram reads on a compressed livestream when `min(width/layout.width, height/layout.height)` lands near **0.7–0.9** (≈21–27px labels). Measure it before rendering rather than guessing — long `tex` strings inflate node width fast, and a dagre *cluster* (`parent` + `groups`) adds a lot of vertical padding, so a wide fan-in usually wants `direction: 'TB'` and no group box.

## Diagram editor (GUI position tuning)

`npm run dev` → `http://localhost:5173/editor.html`. Sidebar lists every diagram reachable from the weeks registry (roots + nested `diagram` details). Select one → drag nodes → **Export TS** (copies the full `.diagram.ts` source with `position: {x, y}` baked on every node) → paste over the week's diagram file. Once every node has `position`, runtime auto-layout is skipped everywhere (explorer + scenes). **Auto-layout** resets to fresh dagre positions. The editor preview uses the exact runtime edge paths, arrow flags, dotted/dashed styles, label positions, and explicit group rectangles, so exported geometry is WYSIWYG. Editing content (labels/edges/variants) stays code-first — the editor is for geometry only.

## Week manifest

```ts
export const weekX: WeekManifest = {
  id: 'YYYY-MM-DD-topic',
  title: '주제',
  explorable: {
    root: rootDiagram,
    details: {                                  // node/group id → what opens on click
      attn: { kind: 'scene', scene: attentionScene },
      moe: [                                     // array = tabs
        { kind: 'scene', scene: tpScene, label: 'Tensor Parallel' },
        { kind: 'interactive', component: Playground, label: 'Live 3D' },
      ],
      // { kind: 'diagram', diagram, details } — nested drill-down level
      // { kind: 'note', content: <>JSX</> }
    },
    path: ['attn', 'moe'],                       // N/P presenter order
  },
  slides: [{ kind: 'scene', scene: titleScene }],
  notes: presenterNotes,                         // speaker notes (see below); optional
  scenes: [titleScene, attentionScene, tpScene], // EVERY scene — drives Composition registration
};
```

**Aliases**: several ids may map to the *same* `Detail` object — hoist it to a `const` and reuse (`kda`, `'kda-core': kda`, `'kda-panel': kda` … see `2026-08-12-kimi-k3/manifest.ts`), so the block, its magnified panel and every related glyph open the same explanation whichever one the presenter clicks. The overview folds aliases into one card (put the preferred id in `path` — it names the card) and marks it visited once any alias was opened.

Register in `src/weeks/index.ts`. Presenter keys: click/N/P modules · Space next step · ↑ back-step · r restart · Esc back · f fullscreen · d debug HUD · o overview grid (click a card to jump) · s speaker-notes window.

Speaker notes live in a `notes.ts` per week (`Record<string, string>`): keys are node id (`'attn'`), scene id (`'00-title'`), per-step override (`'router/topk'`), `'_home'` for the root canvas — most-specific wins. The `s` key opens `notes.html` in a second window (presenter's monitor, never on stream); it follows the deck live over a BroadcastChannel, showing the current note, step position, next path item, elapsed timer and clock.

## After generating

1. `npm run check` — must be clean.
2. Point the user at Studio (`npm run studio`, composition `<weekId>--<sceneId>`) for scrubbing, and the explorer (`npm run dev`, `#/<weekId>`).
3. If the scene has heavy Tex or a new font usage, verify one frame: `npm run still -- <compId> out/check.png --frame=<last>`.
