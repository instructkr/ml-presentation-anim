---
name: new-scene
description: Generate a step-animated explanation scene for a week from a description (e.g. "scene explaining GQA in this week's talk"). Use for any new animated explanation.
---

# New scene

Arguments: week id (or infer the latest week) + what to explain.

1. Read `CLAUDE.md` — follow the scene pattern and hard rules exactly.
2. Decide the **presentation beats** first: 3-5 named steps, each one thing the presenter says (`step(id, seconds, {hold})`). Name steps after concepts (`'scoring'`, `'topk'`), never mechanics (`'anim1'`).
3. If the explanation needs a diagram, write `diagrams/<name>.diagram.ts` first (`defineDiagram`, edge ids `e-<from>-<to>`), then drive it with `stepEffects` (reveal → highlight/pulse → dim 'others' is the usual arc).
4. For tensor/parallelism topics use `ThreeScene` + `TensorBox`/`GPUGrid` driven by `useStepProgress` — never `useFrame`, never drei `<Text>`.
5. Put formulas in `Tex` with `Appear` per step; Korean narration labels, English technical terms.
6. Wire into `manifest.ts`: add to `scenes: []` and attach as a `details` entry (which node does it explain?) or a slide.
7. `npm run check`; if Tex-heavy, render a still of the last frame to verify.
8. Report the composition id (`<weekId>--<sceneId>`) for Studio and where it's attached in the explorer.
