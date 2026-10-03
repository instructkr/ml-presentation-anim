---
name: module-detail
description: Generate the drill-down detail for a specific diagram node (scene, live playground, nested diagram, or tabs). Use when the user says e.g. "add a detail for the router node" or "explain what happens inside attention".
---

# Module detail

Arguments: week id (or infer latest) + node/group id (or resolve from the module name) + what to explain.

1. Read `CLAUDE.md` and the week's `manifest.ts`. Confirm the target id exists in the relevant diagram (root or a nested level) — if ambiguous, list candidates and pick the obvious one.
2. Choose the detail kind (combine as tabs when it helps the livestream):
   - `scene` — the default: a step-animated explanation. Follow `/new-scene` end to end (beat sheet → recipe → `Board` slots → notes → review sheet). One idea per scene; a module that needs more than six beats gets two scenes as tabs.
   - `interactive` — when live manipulation beats animation (3D orbiting, sliders). Component goes in `interactive/`; OrbitControls/React state allowed there ONLY. Colours and typefaces still come from `useTheme()`.
   - `diagram` — when the module itself contains clickable sub-structure (writes another `.diagram.ts`, recursively explorable). It is a map like the home diagram: colour blocks by role.
   - `note` — plain JSX text, fine as a stub or for a short aside.
   - Tabs: `details[id] = [sceneDetail, interactiveDetail]` — animated explanation first, playground second, with `label`s.
3. Wire into `explorable.details` under the node id, and **alias every related id to the same hoisted `Detail` const** (the block, its magnified panel, associated glyph nodes — see `2026-08-12-kimi-k3/manifest.ts`): whichever the presenter clicks opens the same explanation, and the overview folds them into one card. Add any new scene to the week's `scenes: []` array (Composition registration); consider appending the preferred id to `path` (path ids name the overview cards).
4. Chrome naming: if the target node's `label` is raw KaTeX (`math: true`) or blank, set `title` on the node so breadcrumb/guided-path/overview read cleanly.
5. Speaker notes in the week's `notes.ts`: one note for the id, and one `'<id>/<stepId>'` note for **every** beat of the scene — the slide only shows a phrase, so this is where the explanation lives (`write-explanation` §9).
6. `npm run check`; for scenes run `npm run review -- <weekId>--<sceneId>` and look at the sheet against the fit rules in `CLAUDE.md`.
7. Report: what opens on click, which ids alias to it, tab structure, composition id(s) for Studio, and whether `path`/`notes` were updated.
