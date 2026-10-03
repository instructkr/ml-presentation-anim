---
name: new-scene
description: Generate a step-animated explanation scene for a week from a description (e.g. "scene explaining GQA in this week's talk"). Use for any new animated explanation.
---

# New scene

Arguments: week id (or infer the latest week) + what to explain.

A scene in the blackboard look is a picture that changes, one equation line, and one short spoken phrase per beat. The explanation itself is in the speaker notes. Every scene starts from a reference scene in `src/weeks/2026-10-03-style-pilot/scenes/` — they compile, they were rendered, and their layout is already right.

1. **Read** `CLAUDE.md` (hard rules, fit rules, kit reference), then `recipes.md` in this directory, then open the reference scene closest to what you are building.

2. **Write the beat sheet before any code** — in your reply, as a table. 3–6 beats, 2.0–3.0 s each, named after ideas (`'mean'`, `'gap'`), never mechanics (`'anim1'`):

   | beat | the picture does | phrase on screen | note (what the presenter says) |
   |---|---|---|---|
   | `mean` | average line appears; equation is written | 16번 중 10번 통과했으니 평균은 0.625입니다 | 평균은 이 문제에서 평소에 받는 점수입니다. … |

   One beat = one change in the picture + one phrase + one note. A beat that needs two phrases is two beats. The words follow the **`write-explanation`** skill — read it now if you have not.

3. **Pick the frame-0 anchor** (hard rule 6): what is on screen before beat 1 — chart axes, the diagram's input nodes, the equation's first form. It is never in a `reveal`, and the anchoring `Formula` has no `write`.

4. **List the quantities and give each one ink** (hard rule 7): at most four per scene, from `blue teal green gold red maroon purple`. Never yellow — yellow is the pointer (box, flash, pulse). The same key goes in `Quantities`, in the equation as `\\q{key}{…}`, in the phrase as `<Term of="key">`, on chart marks (`t.palette.ink.*`) and on scene-diagram nodes (`variant: 'blue'`).

5. **Pick the recipe by the figure's shape** and fill the `Board` slots — never position anything by hand:

   | the figure is | recipe | layout |
   |---|---|---|
   | a chart (with or without an equation) | 1 · chart + equation | `stack` |
   | a wide (`LR`) diagram | 2 · figure walkthrough | `stack` |
   | a tall (`TB`) diagram with an equation | 3 · figure + equation | `split` |
   | no figure — the equation is the story | 4 · derivation | (no `figure`), `size="2xl"`, `align="equals"` |
   | a 3D object | 5 · 3D | `backdrop` |

   - Diagram beats → write `diagrams/<name>.diagram.ts` first (`defineDiagram`, edge ids `e-<from>-<to>`, labels that are names, **no `tex` on nodes**), export id bundles next to it, then `stepEffects`: `reveal` → `highlight` (+ `camera` on a big figure) → `pulse` → `dim`.
   - Equation beats → one `Formula`; each beat that changes it is a `then` form. Tag every term that survives a step with the same `\\q{key}{…}` so it travels instead of being redrawn. Point with `brace` (what a term means, a few words), `indicate` (look here) or `box` (the result).
   - Chart beats → the chart inside `<Fill>`, swept by `useStepProgress`, colours from the quantity inks, `textSize={t.fontSize.sm}`.
   - 3D beats → `ThreeScene` in `backdrop`; motion from `useStepProgress`, never `useFrame`.

6. **Write the notes**: in the week's `notes.ts`, one `'<nodeId>'` note for the scene and one `'<nodeId>/<stepId>'` note for **every** beat (2–3 spoken sentences each — `write-explanation` §9).

7. **Wire into `manifest.ts`**: add to `scenes: []` and attach as a `details` entry (alias related ids to the same hoisted `Detail` const) or a slide.

8. **Verify**: `npm run check`, then `npm run review -- <weekId>--<sceneId>` and look at `out/review/<compId>/sheet.png` — frame 0 and the pause frame of every beat. Go down the fit rules in `CLAUDE.md`: frame 0 not bare · each phrase on one line · the equation not shrunk · labels readable · nothing overlapping · the same thing in the same place from beat to beat · no red warning. Fix and re-run until the sheet is clean.

9. **Report** the composition id (`<weekId>--<sceneId>`), where it opens in the explorer, the beat sheet as built, and ask the user to watch it play — stills cannot judge timing.

**Common failures:** a phrase ending in `…한다`/`…이다`, a noun, or `…해요` (the voice is 합니다체) · jargon on screen · a module name translated or transliterated into Korean (`전문가`, `라우터`) · two ideas in one beat · a quantity in two colours (or yellow used for a quantity) · `tex` or a sentence on a diagram node · a `TB` diagram in `stack` / an `LR` diagram in `split` (renders tiny) · a term not tagged with `\\q`, so it fades out and is redrawn instead of travelling · a mark `delay` longer than its step · everything inside a `reveal`/`write` (bare frame 0) · a classic component (`Callout`, `Spec`, `SlideFrame`, `WalkthroughStage`, `EqSteps`) in a new scene · un-escaped LaTeX backslash · KaTeX in an edge label (plain unicode only) · beats without notes.
