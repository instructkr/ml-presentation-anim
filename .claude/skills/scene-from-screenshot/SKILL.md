---
name: scene-from-screenshot
description: Recreate a paper's architecture figure as an explorable diagram + animated scenes from a screenshot. Use when the user provides an architecture figure image (or a path to one) from a paper.
---

# Scene from screenshot

Arguments: an image path (or the user drops an image) + optionally the week id (default: latest week in `src/weeks/index.ts`).

**Reference implementation**: `src/weeks/2026-08-12-kimi-k3/diagrams/kimi-k3-arch.diagram.ts` — a 70-node/88-edge faithful reconstruction using every schema feature below. Skim it before writing a figure-scale diagram; compose from this API instead of extending the framework.

1. If the image isn't already under `public/assets/<week-id>/`, copy it there (keep the original name).
2. **Read the image and enumerate BEFORE writing any code** — list in your reasoning: every box (label, role → variant, silhouette → shape), every arrow (direction, solid/dashed/dotted, arrowhead or bare rail, label), every grouping/panel (and panel-to-panel connectors), and the overall flow direction. Count them. Missing elements are the #1 failure mode.
3. Read `CLAUDE.md` (diagram schema reference). Map each element:
   - **variant** (pick by function, not by the paper's color): `attention | ffn | norm | route | embed | io | op | annotation | default | proj` (learned projections, maroon) `| expertShared` (green) `| expertRouted` (navy).
   - **shape**: `trapUp`/`trapDown` for projections (slant shows which way width changes), `hourglass` for a low-rank pair, `circle` for element-wise ops (⊕ ⊗ σ — give an explicit `size`), `bars` for a router-score glyph, `pill`, default `rect`.
   - `math: true` for KaTeX labels (`\\alpha`, `w`, `\\sigma`); then set `title` (Korean/English chrome name) so breadcrumb/overview don't show raw TeX. `muted: true` for present-but-inactive elements (unselected experts).
   - Block names stay in the paper's English; explanatory annotations Korean. Edge labels are plain unicode text (`g₁`, `hₗ`), never TeX; `labelPos` nudges one off a crowded midpoint.
   - Repeated stacks ("×N layers") → one representative block + an `annotation` node, or a vertical-dots node like the exemplar's `vdots`.
4. **Choose the layout mode.** Simple figures: let dagre lay it out (`layout: {nodeGap, rankGap}` to breathe). Faithful figure reproductions: hand-position **every** node (auto-layout is then skipped), which unlocks `waypoints` on edges (orthogonal elbows — put the last waypoint *outside* the target face or the arrowhead flips), `arrow: false` rails, edges between **group ids** (panel callouts), and groups with explicit `rect` + `dash: 'dashed' | 'dotted'`. Derive coordinates from a few shared consts (see the exemplar's `Y`/`ALPHA_X` pattern) so later edits stay coherent.
5. Write `src/weeks/<week>/diagrams/<slug>.diagram.ts` with `defineDiagram` (edge ids `e-<from>-<to>`). Also export **id bundles** for scenes (`export const <slug>Ids = { spine: [...], panelA: [...] }`, derived with helpers like `membersOf`/`withEdges` — see `k3Ids`) so `stepEffects` reveals never hand-list 70 ids.
6. `npm run check`, then **verify the scale**: `min(width/layout.width, height/layout.height)` should land near 0.7–0.9 for stream legibility — restructure (TB fan-in, drop group boxes) rather than shrink.
7. Wire into `manifest.ts`: main architecture → `explorable.root`; otherwise a `{ kind: 'diagram' }` detail. For each module a presenter would click, add `explorable.details` entries — and **alias** every related id (block, its magnified panel, glyph circles) to the same hoisted `Detail` const so any click opens the explanation. Generate detail scenes now (follow `/new-scene` + its `recipes.md` — size-less `DiagramView` inside `WalkthroughStage`, frame-0 anchor kept out of reveals) or leave `{ kind: 'note' }` stubs and say which remain. Suggest a `path` following the figure's data flow (path ids name the overview cards).
8. Verify visually: render a still of a scene using the diagram (or open `npm run dev` `#/<week-id>`) and compare side-by-side with the paper figure; for geometry touch-ups use the editor (`/editor.html` → drag → Export TS — it round-trips shapes, waypoints, group rects, everything).
9. Report: node/edge counts vs the enumeration, variant/shape mapping table, aliases wired, and remaining stubs.
