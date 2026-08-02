---
name: new-scene
description: Generate a step-animated explanation scene for a week from a description (e.g. "scene explaining GQA in this week's talk"). Use for any new animated explanation.
---

# New scene

Arguments: week id (or infer the latest week) + what to explain.

1. Read `CLAUDE.md` — follow the scene pattern and hard rules exactly; compose from the kit, don't extend the framework.
2. Decide the **presentation beats** first: 3-5 named steps, each one thing the presenter says (`step(id, seconds, {hold})`). Name steps after concepts (`'scoring'`, `'topk'`), never mechanics (`'anim1'`).
3. Pick the medium per beat from the kit:
   - Diagram beats → `diagrams/<name>.diagram.ts` first (`defineDiagram`, edge ids `e-<from>-<to>`), then `stepEffects` (reveal → highlight/pulse → dim `'others'` is the usual arc; `move` for morphs). For a large diagram, reveal via **exported id bundles** from the diagram file (`k3Ids` pattern in `2026-08-12-kimi-k3`), never a hand-listed 70-id array. Check the sizing rule (scale 0.7–0.9) and fix any red unknown-id warning immediately.
   - Formula beats → `Tex` with `Appear`, or `EqSteps` when terms should light up step by step.
   - Benchmark/trend beats → `BarChart` / `LineChart` driven by `useStepProgress`.
   - Tensor/parallelism beats → `ThreeScene` + `TensorBox`/`GPUGrid`/`ParallelFlow` driven by `useStepProgress` — never `useFrame`, never drei `<Text>`.
4. Korean narration labels, English technical terms; LaTeX backslashes escaped.
5. Wire into `manifest.ts`: add to `scenes: []` and attach as a `details` entry (alias related ids to the same `Detail` const) or a slide. Add a `notes.ts` entry for the scene id (and `'<id>/<step>'` overrides for tricky beats).
6. `npm run check`; if Tex-heavy or diagram-dense, render a last-frame still and look at it.
7. Report the composition id (`<weekId>--<sceneId>`) for Studio and where it's attached in the explorer.
