# ML Presentation Animation System

Weekly LLM-paper presentations as an **interactive explorable**: the architecture diagram is the home screen; clicking a module zooms in and plays a step-animated explanation. Remotion renders scenes; React Flow drives the explorer; everything shares one component kit and one look.

The look is the **blackboard look** — 3Blue1Brown's: a black canvas, one colour per quantity, equations that are written on and morph, one short spoken phrase per beat, nothing in a box. Its job is to build intuition; the presenter's voice carries the detail. The reference is the week `src/weeks/2026-10-03-style-pilot/` — one scene per recipe, all rendered and checked. **Start every new scene from the closest one.**

## Commands

| Command | What |
|---|---|
| `npm run dev` | explorer app (present from here) — http://localhost:5173 |
| `npm run studio` | Remotion Studio (scrub/tune scenes, visual props) |
| `npm run render -- <compId> out/x.mp4` | render one scene (`<compId>` = `<weekId>--<sceneId>`) |
| `npm run render:week -- <weekId>` | render every scene of a week to `out/<weekId>/` |
| `npm run still -- <compId> out/x.png --frame=N` | render one frame (negative N counts from the end) |
| `npm run review -- <compId>` (or `<weekId>`) | render frame 0 + the pause frame of every beat and tile them → `out/review/<compId>/sheet.png` |
| `node scripts/contact-sheet.mjs out/sheet.png out/a.png out/b.png …` | tile any stills into one image |
| `npm run check` | typecheck — run after every generation |

## Hard rules

1. **Never `useFrame`** inside 3D — all animation derives from `useCurrentFrame()` / `useStepProgress()`. 3D kit components are pure functions of props; scenes compute progress and pass it down.
2. **Never `Math.random()` / `Date.now()`** in scenes — use `random(seed)` from remotion if needed.
3. **All colors, sizes and typefaces from tokens** (`useTheme()`, ink names); never hardcode a hex or a font family in a scene.
4. **Every step ends static**: animations must complete within the step's `seconds`; add `hold` for settle time. The presenter pause lands on the step's last frame.
5. **Never position or size anything by hand** — a scene fills the slots of `Board` (formula · figure · caption). `DiagramView` with no width/height fills its slot; components that need numbers (charts) get them from `<Fill>`.
6. **Frame 0 is never bare**: keep the figure's anchor (input nodes, chart axes, an equation's first form) out of every `reveal`/`write` so it shows from the first frame; beat 1 draws the rest.
7. **One colour per quantity**: declare the scene's quantities once with `Quantities`; every equation term, word, chart mark and diagram node that shows a quantity reads its colour from there. **Yellow is the pointer colour** (box, flash, pulse) and never names a quantity.
8. **One phrase per beat, nothing boxed**: on-screen text is a `Captions` line in the presenter's voice (합니다체 — never `…한다`, a noun fragment, or `…해요`), short, no jargon. **Module names stay in the paper's English** (`Router`, `Query`, `softmax`) on nodes, in phrases and in notes — never translated or transliterated. The explanation itself goes in `notes.ts`. No cards, chips or callouts. Follow the `write-explanation` skill for every word.
9. **Register weeks only in `src/weeks/index.ts`** (no globs — dual bundlers).
10. Scene ids are `NN-kebab-name`; composition ids become `<weekId>--<sceneId>`.
11. Korean text: kit components already set `word-break: keep-all` — don't override.
12. For any Remotion API question fetch `https://remotion.dev/docs/<page>.md` (raw markdown) — do not guess.
13. LaTeX in TSX: escape backslashes — `{'\\q{R}{R_i} - \\bar R'}`. Write such files with the Write/Edit tools, not shell heredocs.
14. A red warning anywhere on a rendered frame (unknown step, unknown diagram id, a mark whose `delay` outlasts its step) is a bug — fix it before anything else.

## File layout

```
src/weeks/<YYYY-MM-DD-topic>/
  manifest.ts                 # WeekManifest: explorable {root, details, path}, slides?, notes, scenes[]
  notes.ts                    # speaker notes — where the explanation lives
  diagrams/*.diagram.ts       # defineDiagram(...) data files
  scenes/NN-name.tsx          # defineScene(...) animated explanations
  interactive/*.tsx           # live components (OrbitControls/state allowed — never rendered)
src/lib/{theme,timeline,diagram,kit,explorer}   # the framework — extend, don't fork
src/weeks/2026-10-03-style-pilot/               # the reference scenes (one per recipe)
```

## Authoring a scene (the pattern)

Beats first: 3–6 named steps, each one thing the presenter says, 2.0–3.0 s each. For each beat decide three things before any code — what the **picture** does, the **phrase** on screen, the **note** the presenter says. Then pick the recipe whose shape matches (`.claude/skills/new-scene/recipes.md`) and fill the `Board` slots.

```tsx
import React from 'react';
import { defineScene, step } from '@/lib/timeline';
import { Board, Captions, DiagramView, Formula, Quantities, Term } from '@/lib/kit';
import { attention } from '../diagrams/attention.diagram';

// one colour per quantity — the diagram nodes use the same ink names as their `variant`
const QUANTITIES = { Q: 'blue', K: 'teal', V: 'green', A: 'gold' } as const;
const SCORES = '\\frac{\\q{Q}{Q}\\,\\q{K}{K}^{\\top}}{\\sqrt{d}}';

export const attentionScene = defineScene(
  {
    id: '03-attention',
    title: '어디를 얼마나 볼까?',              // a name or the question the scene answers
    steps: [step('match', 2.6), step('weights', 2.6), step('mix', 2.8, { hold: 0.6 })],
  },
  () => (
    <Quantities map={QUANTITIES}>
      <Board
        title="어디를 얼마나 볼까?"
        source="Attention"
        layout="split"                          // tall figure left, equation + phrase right
        figure={
          <DiagramView
            diagram={attention}
            stepEffects={{
              // Query/Key/Value are in no reveal → on screen from frame 0 (the anchor)
              match: { reveal: ['e-q-scores', 'e-k-scores', 'scores'], highlight: ['q', 'k'] },
              weights: { reveal: ['e-scores-weights', 'weights'], highlight: ['weights'] },
              mix: { reveal: ['e-weights-mix', 'e-v-mix', 'mix', 'e-mix-out', 'out'], highlight: ['v'] },
            }}
          />
        }
        formula={
          <Formula
            size="lg"
            write="match"                        // written on stroke by stroke in this beat
            then={[                              // later forms morph out of the previous one
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
  ),
);
export default attentionScene;
```

### Fit rules (they only show up in the rendered still — start from them)

1. **Pick the layout from the figure's shape.** Wide figure (an `LR` diagram, a chart) → `stack` (figure cell ≈ 1560 px wide, 530–760 px tall). Tall figure (a `TB` diagram) → `layout="split"` (figure cell ≈ 850 × 900 px). Equation alone → no `figure`, `size="2xl"`. 3D → `backdrop`. An `LR` strip in the `split` cell, or a `TB` tower in the `stack` cell, renders tiny.
2. **A phrase is one line.** `stack`: up to ~32 Korean characters. `split`: ~20 per line, two lines at most. Longer means two beats, not smaller type.
3. **An equation never overflows — it shrinks**, and a shrunk equation is unreadable. If a form looks smaller than the phrase text in the still, break it into two forms or drop one `size`. `xl` in `stack`, `lg` in `split`, `2xl` alone.
4. **Diagram node labels stay under ~16 Korean characters and carry no `tex`** in scene diagrams. A node is a name; formulas belong to `Formula`, sentences to `notes.ts`. One long label wrecks the whole figure's scale.
5. **`camera: {focus: [...]}` lists only adjacent nodes** — one far id shrinks the whole beat. The last beat pulls back to the whole figure (that frame is the thumbnail); pass `maxScale: 1` when the surrounding context should stay visible.
6. **Brace labels are a few words (≤ ~8 characters).** A brace dodges tall neighbours on its own, but a long label drags it far from its term.
7. **A mark's `delay` must be shorter than its step's `seconds`**, and should let the morph land first (≥ 1.2 s after a form change).
8. **JSX eats the space before a tag on a new line.** Keep `<Term …>` on the same line as the word before it, or the sentence loses a space.
9. **A group with an explicit `rect` needs ~40 units of headroom above its members**, or its label chip covers the first row.
10. **Diagram scale**: `min(cellWidth/layout.width, cellHeight/layout.height)` should land near **0.7–1.0**. Restructure (fewer nodes, the other direction, the other layout) rather than shrink.

`stepEffects` semantics: `reveal` is cumulative (ids hidden until revealed — ids never listed in any reveal are visible from frame 0); `highlight`/`pulse`/`dim` apply only while their step is active; `dim: 'others'` dims everything not referenced by the current step. `move: {nodeId: {dx, dy}}` glides nodes by diagram-px offsets — cumulative like `reveal`: the offset eases in over the owning step's animation window and persists afterwards (offsets from several steps sum); attached edges and group boxes follow every frame, and the view is pre-fitted to the union of all morph states so the scale never jumps. `move` takes node ids only. A `reveal` list can be arbitrarily long — the entrance stagger compresses so the last id still finishes by the step's `animEndFrame`. Export id bundles from the diagram file (`routerIds` in the reference week, `k3Ids` in K3) instead of hand-listing ids in scenes. Unknown ids show a red on-canvas warning — fix immediately.

`camera: {focus: ['node-a', 'node-b'], padding?, maxScale?}` gives a step a Manim-style deterministic 2D camera move. The camera eases from the previous beat, frames the listed nodes/groups, and persists until another beat supplies a camera. Pair it with `highlight`: camera establishes where to look; highlight explains what matters there.

## Kit reference (all from `@/lib/kit`)

### The blackboard kit — what new scenes are made of

- `Board {title?, source?, formula?, figure?, caption?, layout? 'stack'|'split', backdrop?, children?}` — the 1920×1080 scene frame. Three fixed slots on one centre line: equation, figure, phrase. `stack` (default) puts the formula above the figure and the phrase below; `split` puts the figure on the left and formula + phrase on the right; with no `figure` the equation is centred on its own. `backdrop` is a full-frame layer behind the slots (a `ThreeScene`). `children` replaces the slots — title scenes only.
- `Formula {children: tex, write?, then?: [{step, tex}], size sm..2xl, colors?, align? center|equals|left, box?, brace?, indicate?}` — one equation as glyph outlines. `write="step"` traces it on stroke by stroke in that step; without `write` it is on screen from frame 0 (a valid anchor). Each `then` form **morphs** out of the previous one: a term tagged `\\q{key}{…}` travels to its new place and keeps its colour, a tagged term whose content changed (`R_i` → `1`) cross-fades in place, untagged glyphs pair up by shape and nearness, the rest fade out or are written in. All forms share one frame sized to their union, so the slot never reflows; `align="equals"` keeps every form's `=` in one place (derivations). Marks point at a tagged term (`key`, or `key#1` for its second occurrence; a tag may wrap other tags): `box {key, step, delay?, until?, color?}` draws an outline, `brace {…, label, side?}` a brace with a few words, `indicate {key, step, delay?}` a brief swell-and-glow. Scene-only.
- `Quantities {map: {key: inkName}}` — the scene's colour list. `Formula` tags, `Term`, and `useQuantityColors()` read it. Ink names: `blue teal green gold red maroon purple grey white` (and `yellow`, reserved for pointing).
- `Term {of: key}` — a word in a phrase that names a quantity; takes its colour.
- `Captions {items: [{step, text}], size?, align?}` — the phrase line: one phrase at a time, each wipes in on its step and leaves when the next arrives; a step without an item keeps the previous phrase. All phrases share one cell, so nothing moves. Scene-only.
- `Phrase {step?, delay?, size sm|md|lg, color?, align?}` — a single line of plain text on the background, wiped in on `step` (or static). For title scenes and one-off labels; a scene's running text is `Captions`.
- `Title {sub?}` — the big heading of a title scene (static: it is that scene's frame-0 anchor).
- `Label {size xs..xl, color?, weight?, mono?}` — a bare text label, for overlays on interactive components.

### Media (figure slot)

- `DiagramView {diagram, stepEffects?, width?, height?}` — step-driven diagram (scenes only). Omit width AND height to fill the slot (always, in new scenes).
- `Block/GroupBox/ArrowEdge` — diagram atoms (rarely used directly; DiagramView/explorer render them).
- `Fill {children: ({width, height}) => node}` — measures the slot and hands exact pixels to the render prop; how charts go into a slot without pixel math. Transform-safe (offsetWidth), deterministic in renders.
- `ColumnBars {values, from?, morph?, progress?, labels?, colors?, muted?, highlight?, refLines?:[{value,label?,color?,dashed?,opacity?}], bands?:[{from,to,label?,color?,opacity?}], yDomain?, yScale? linear|log, valueFormat?, valueOpacity?, valueIndices?, yTicks?, yFormat?, yLabel?, textSize?, width, height}` — vertical columns on a zero baseline (1 under log) for groups, per-item gaps and ratios. `progress` grows columns in, `morph` glides `from` → `values` (pin `yDomain` so nothing rescales); pass `colors` per bar from the quantity inks; `valueIndices` limits value labels in dense groups; keep refLines/bands in the array from frame 0 and fade them with `opacity` so the plot never re-flows. In a `Board`, pass `textSize={t.fontSize.sm}`.
- `BarChart {data:[{label,value,color?}], progress?, width, height, maxValue?, valueFormat?, highlightIndex?}` — horizontal bars for benchmark tables; `progress` sweeps linearly, value labels fade in at the end.
- `LineChart {series:[{label,color?,points:[{x,y}]}], width, height, progress?, xScale?/yScale? linear|log, xTicks?/yTicks?, xFormat?/yFormat?, xLabel?/yLabel?, markers?, highlightSeries?}` — trend/scaling plots; direct end-of-line labels are the legend; `progress` sweeps all series together.
- `TensorMatrix {values, rowLabels?, columnLabels?, highlight?, progress?, title?}` — crisp 2D matrix cells for a worked numeric example; numeric cells use tabular alignment.
- `Tex {children: string, display?, size sm..xl, color?}` — static KaTeX, for math inside a label. An equation the scene talks about is a `Formula`.
- `Code {children: string, fontSize?, highlightLines?: number[], title?}` — mono code block with line numbers.
- `Stack {direction?, gap?, align?, justify?}` · `Grid {columns, gap?}` · `Center` — for arranging two figures inside the figure slot (before | after), never for laying out the slide.

### 3D (backdrop slot)

- `ThreeScene {camera?: {position, target, fov}, children}` — Remotion-safe 3D stage, always full-frame; put it in `Board backdrop`. Camera moves = frame-derived position; stop the motion at the last step's `animEndFrame`.
- `TensorBox {dims:[a,b,c], dimLabels?, split?: {axis, parts, gap?, colors?}, splitProgress?, partOffsets?, moveProgress?, opacity?, labelOpacity?, maxExtent?, color?}` — pure props; drive with `useStepProgress`; fade `labelOpacity` to 0 once dim labels go stale.
- `GPUGrid {count, columns?, cell?, gap?, position?, activeIndices?, activeColor?, opacity?}`.
- `ParallelFlow {from:V3, to:V3, progress, color?, count?, size?, bidirectional?}` — data-movement pulses; drive with a cycling frame-derived `progress`.
- `BillboardLabel {text, position, height?, color?}` — deterministic 3D text (never drei `<Text>`). Theme context does not cross into the 3D canvas: pass colours in as props (`t.palette.ink.blue`).

### Classic kit — only in weeks pinned to `palette: darkDefault`

`SlideFrame`, `WalkthroughStage`, `Callout`, `ExplainerCard`, `Spec`, `EqSteps`. They draw cards, chips and a text rail — the look of the weeks up to 2026-09-27. Keep them working; do not use them in a new scene.

Timeline (from `@/lib/timeline`): `defineScene`, `step(id, seconds, {hold?})`, `Appear {step, effect fade|rise|pop|left|wipe, delay?, duration?, index?, stagger?}`, `useStepProgress(stepId, {portion?, easing?}) → 0..1`, `useCurrentStepIndex()`, `useSceneMeta()`, `staggerProgress/lerp/lerp3`.

Theme (from `@/lib/theme`): `useTheme()` → `palette.colors.*`, `palette.ink.*` (quantity hues), `palette.series[]`, `palette.diagram[variant]`, `fonts.text` (Korean serif + Computer Modern latin), `fonts.num` (digits), `fonts.mono`, `fontSize`, `space(n)`. The default palette is `manimDark`; a week keeps an earlier look by setting `palette: darkDefault` in its manifest (the deck, the home diagram and every scene of that week follow it). Diagram variants by block role: `attention` (blue), `ffn` (green), `route` (gold), `proj` (maroon — learned projections), `embed` (purple), `expertShared` (green), `expertRouted` (deep blue), `norm`/`io`/`op`/`default` (greys), `annotation`, `group`. **A node's `variant` may also be an ink name** (`'blue'`): in a scene diagram, a node that stands for a quantity wears that quantity's colour.

## Diagram files

```ts
import { defineDiagram } from '@/lib/diagram';
export const myDiagram = defineDiagram({
  id: 'my-arch',
  direction: 'TB',                              // or 'LR'
  groups: [{ id: 'moe', label: 'MoE Layer' }],
  nodes: [
    { id: 'input', kind: 'io', label: '입력', variant: 'io' },
    { id: 'attn', label: 'Attention', variant: 'attention' },
    { id: 'e1', label: 'Expert 1', variant: 'ffn', parent: 'moe' },
  ],
  edges: [{ id: 'e-input-attn', from: 'input', to: 'attn', style: 'dashed', label: '0.62' }],
});
```

Validated at import (unknown refs/duplicate ids throw). Edge id convention: `e-<from>-<to>`. Edge labels are **plain text, never KaTeX** — use unicode (`hₗ`, `Wₒ`, `g₁`), not `h_l`. They render beside the line, never on it; `labelPos: 0..1` slides one along the shared layout path in scenes, the explorer, and the editor (widen `layout: {rankGap}` if a corridor is cramped). Group labels are solid-bg chips that auto-dodge member entry lines (`groupLabelLeft`) — don't hand-tune label collisions. Layout is automatic (dagre); `position` on every node skips auto-layout. Recreating a paper figure from a screenshot: enumerate every node and edge you see FIRST, then write the file; keep block names English, annotations Korean.

Two kinds of diagram, two colour rules. The **home (architecture) diagram** colours blocks by role (`variant: 'attention'`) — it is a map. A **scene diagram** colours the nodes that stand for quantities with ink names and leaves the rest grey (`op`, `io`), so the figure and the equation agree.

Node extras: `shape: 'rect' | 'circle' | 'pill' | 'trapUp' | 'trapDown' | 'hourglass' | 'bars'` (trapezoid slant shows which way the width changes — `trapUp` = narrow bottom → wide top = an up-projection in an upward-flowing figure; `hourglass` = a low-rank pair, drawn unlabelled), `math: true` to render the label through KaTeX (`\\alpha`, `\\sigma`, `N`), `tex` for a formula line under the label (home diagrams and faithful paper figures only), `muted: true` for elements that are present but inactive (unselected experts). Give circles/chips an explicit `size`. `title` names a node/group in the deck chrome (breadcrumb, guided path, overview) when `label` is unsuitable there — raw-KaTeX `math` labels or blank glyph nodes; falls back to `label`, then the id. Edge extras: `style` also takes `'dotted'`; `color` takes a token or ink name or raw CSS.

**Hand-routed figures** (every node has `position`) unlock three more things, all rejected under auto-layout: `waypoints: [{x,y}, …]` on an edge for orthogonal elbows (endpoints automatically clip to the face they approach, including when a GUI leaves its last waypoint inside the target), `arrow: false` for rails that just carry a value, and edges whose `from`/`to` is a **group id**, for panel-to-panel callouts. Groups take `rect: {x,y,w,h}` (explicit box instead of member bounds) and `dash: 'dashed' | 'dotted'`. See `src/weeks/2026-08-12-kimi-k3/diagrams/kimi-k3-arch.diagram.ts` for a 70-node reconstruction using all of it, including the `k3Ids` pattern for deriving `stepEffects` reveal bundles instead of hand-listing ids.

## Diagram editor (GUI position tuning)

`npm run dev` → `http://localhost:5173/editor.html`. Sidebar lists every diagram reachable from the weeks registry (roots + nested `diagram` details). Select one → drag nodes → **Export TS** (copies the full `.diagram.ts` source with `position: {x, y}` baked on every node) → paste over the week's diagram file. Once every node has `position`, runtime auto-layout is skipped everywhere (explorer + scenes). **Auto-layout** resets to fresh dagre positions. The editor preview uses the exact runtime edge paths, arrow flags, dotted/dashed styles, label positions, and explicit group rectangles, so exported geometry is WYSIWYG. Editing content (labels/edges/variants) stays code-first — the editor is for geometry only.

## Week manifest

```ts
export const weekX: WeekManifest = {
  id: 'YYYY-MM-DD-topic',
  title: '주제',
  // palette: darkDefault,                     // only to keep an earlier week in its old look
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
  notes: presenterNotes,                         // speaker notes (see below)
  scenes: [titleScene, attentionScene, tpScene], // EVERY scene — drives Composition registration
};
```

**Aliases**: several ids may map to the *same* `Detail` object — hoist it to a `const` and reuse (`kda`, `'kda-core': kda`, `'kda-panel': kda` … see `2026-08-12-kimi-k3/manifest.ts`), so the block, its magnified panel and every related glyph open the same explanation whichever one the presenter clicks. The overview folds aliases into one card (put the preferred id in `path` — it names the card) and marks it visited once any alias was opened.

Register in `src/weeks/index.ts`. Presenter keys: click/N/P modules · Space next step · ↑ back-step · r restart · Esc back · f fullscreen · d debug HUD · o overview grid (click a card to jump) · s speaker-notes window.

**Speaker notes are where the explanation lives.** The slide shows a picture and one phrase; `notes.ts` (`Record<string, string>`) holds what the presenter says. Keys are node id (`'attn'`), scene id (`'00-title'`), per-step (`'attn/score'`), `'_home'` for the root canvas — most-specific wins. **Every beat of every scene gets its own `'<nodeId>/<stepId>'` note**: two or three spoken sentences that define the terms and say why the beat's move is made. The `s` key opens `notes.html` in a second window (presenter's monitor, never on stream); it follows the deck live over a BroadcastChannel, showing the current note, step position, next path item, elapsed timer and clock.

## After generating

1. `npm run check` — must be clean.
2. For any new/changed scene run `npm run review -- <weekId>--<sceneId>` and **look at the sheet** (`out/review/<compId>/sheet.png`): frame 0 and the pause frame of every beat, side by side. Check it against the fit rules — frame 0 not bare, each phrase on one line, the equation not shrunk, labels readable, nothing overlapping, the same things in the same place from beat to beat, no red warning. For a transition that looks suspicious, render a mid-frame with `npm run still -- <compId> out/x.png --frame=N`.
3. Point the user at the explorer (`npm run dev`, `#/<weekId>`) to watch the motion — stills cannot judge timing — and at Studio (`npm run studio`, composition `<weekId>--<sceneId>`) for scrubbing.
