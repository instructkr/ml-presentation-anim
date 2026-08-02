---
name: module-detail
description: Generate the drill-down detail for a specific diagram node (scene, live playground, nested diagram, or tabs). Use when the user says e.g. "add a detail for the router node" or "explain what happens inside attention".
---

# Module detail

Arguments: week id (or infer latest) + node/group id (or resolve from the module name) + what to explain.

1. Read `CLAUDE.md` and the week's `manifest.ts`. Confirm the target id exists in the relevant diagram (root or a nested level) — if ambiguous, list candidates and pick the obvious one.
2. Choose the detail kind (combine as tabs when it helps the livestream):
   - `scene` — the default: a step-animated explanation (follow `/new-scene`; steps named after presentation beats).
   - `interactive` — when live manipulation beats animation (3D orbiting, sliders). Component goes in `interactive/`; OrbitControls/React state allowed there ONLY.
   - `diagram` — when the module itself contains clickable sub-structure (writes another `.diagram.ts`, recursively explorable).
   - Tabs: `details[id] = [sceneDetail, interactiveDetail]` — animated explanation first, playground second, with `label`s.
3. Wire into `explorable.details` under the node id; add any new scene to the week's `scenes: []` array (Composition registration); consider appending the id to `path`.
4. `npm run check`; for scenes verify the composition appears via `npm run compositions` and (if Tex/3D-heavy) render a last-frame still.
5. Report: what opens on click, tab structure, composition id(s) for Studio, and whether `path` was updated.
