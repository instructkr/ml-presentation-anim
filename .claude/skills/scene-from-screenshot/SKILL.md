---
name: scene-from-screenshot
description: Recreate a paper's architecture figure as an explorable diagram + animated scenes from a screenshot. Use when the user provides an architecture figure image (or a path to one) from a paper.
---

# Scene from screenshot

Arguments: an image path (or the user drops an image) + optionally the week id (default: latest week in `src/weeks/index.ts`).

1. If the image isn't already under `public/assets/<week-id>/`, copy it there (keep the original name).
2. **Read the image and enumerate BEFORE writing any code** — list in your reasoning: every box (label, role → variant guess), every arrow (direction, dashed?, label), every grouping/container, and the overall flow direction (TB/LR). Count them. Missing elements are the #1 failure mode.
3. Read `CLAUDE.md` (diagram schema + variants reference). Map each box to a schema node:
   - variants: `attention | ffn | norm | route | embed | io | op | annotation | default` — pick by function, not color.
   - Block names stay in the paper's English; explanatory annotations in Korean.
   - Repeated stacks ("×N layers") → one representative block with the count in the label or an `annotation` node.
4. Write `src/weeks/<week>/diagrams/<slug>.diagram.ts` with `defineDiagram` (edge ids `e-<from>-<to>`). Run `npm run check` — the schema validates refs at import.
5. Wire it into the week's `manifest.ts`:
   - If this is the paper's main architecture → make it `explorable.root`.
   - Otherwise → attach as a `{ kind: 'diagram' }` detail on the relevant node.
6. For each major module a presenter would click (attention variant blocks, routers, novel components), add a stub entry to `explorable.details` — either generate the detail scene now (follow `/new-scene`) or leave a `{ kind: 'note' }` stub listing what to explain, and tell the user which stubs remain.
7. Suggest a `path` (guided presentation order following the figure's data flow).
8. Verify: `npm run check`, then render a still of the root via any scene using it, or tell the user to open the explorer (`npm run dev`, `#/<week-id>`) and compare side-by-side with the paper figure. Offer the editor (`/editor.html`) for position touch-ups.
9. Report: node/edge counts vs what you enumerated from the image, variant mapping table, and remaining stubs.
