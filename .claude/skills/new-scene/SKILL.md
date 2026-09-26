---
name: new-scene
description: Generate a step-animated explanation scene for a week from a description (e.g. "scene explaining GQA in this week's talk"). Use for any new animated explanation.
---

# New scene

Arguments: week id (or infer the latest week) + what to explain.

1. Read `CLAUDE.md` (hard rules + kit reference), then **`recipes.md` in this directory** — four complete scene shapes (diagram walkthrough · diagram+equation band · chart · 3D tensor). Start from the closest recipe; compose from the kit, don't extend the framework.
2. Decide the **presentation beats** first: 3-6 named steps, each one thing the presenter says (`step(id, seconds, {hold})`, 1.6–3.0 s). Name steps after concepts (`'scoring'`, `'topk'`), never mechanics (`'anim1'`). Then pick the **frame-0 anchor** (hard rule 6): what's on screen before beat 1 plays — that element is never listed in any `reveal`/`Appear`.
3. Layout comes from presets, never pixel math (hard rule 5): `WalkthroughStage` right/bottom/overlay is the skeleton; size-less `DiagramView` fills its cell; charts get numbers from `<Fill>`. Per-beat media:
   - Diagram beats → `diagrams/<name>.diagram.ts` first (`defineDiagram`, edge ids `e-<from>-<to>`), then `stepEffects` (reveal → camera+highlight → pulse → dim `'others'`; `move` for morphs). Large figures reveal via **exported id bundles** (`k3Ids` pattern in `2026-08-12-kimi-k3`), never a hand-listed 70-id array. Fix any red unknown-id warning immediately.
   - Formula beats → `Tex` with `Appear`, or `EqSteps` when terms should light up per beat (step-less parts double as the frame-0 anchor).
   - Benchmark/trend beats → `BarChart` / `LineChart` inside `<Fill>`, swept by `useStepProgress`.
   - Tensor/parallelism beats → `ThreeScene` + `TensorBox`/`GPUGrid`/`ParallelFlow` driven by `useStepProgress` — never `useFrame`, never drei `<Text>`.
4. Korean narration labels, English technical terms; LaTeX backslashes escaped. For what the scene actually *says* — defining terms, performing derivations, Korean that reads as Korean — follow the **`write-explanation`** skill.
5. Wire into `manifest.ts`: add to `scenes: []` and attach as a `details` entry (alias related ids to the same `Detail` const) or a slide. Add a `notes.ts` entry for the scene id (and `'<id>/<step>'` overrides for tricky beats).
6. Verify: `npm run check`, then render BOTH boundary stills and look at them — `npm run still -- <compId> out/last.png --frame=-1` (fully-revealed layout: cramped text/overflow shows here) and `--frame=0` (anchor visible, never bare).
7. Report the composition id (`<weekId>--<sceneId>`) for Studio and where it's attached in the explorer.
