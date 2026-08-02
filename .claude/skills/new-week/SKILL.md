---
name: new-week
description: Scaffold a new weekly presentation (week folder, manifest, title scene, registration). Use when the user starts a new week/topic, e.g. "new week on DeepSeek-V4".
---

# New week scaffold

Arguments: a topic slug and/or paper name. Today's date forms the id: `YYYY-MM-DD-<slug>`.

1. Read `CLAUDE.md` (kit/timeline/manifest reference) if not already in context.
2. Create `src/weeks/<id>/`:
   - `scenes/00-title.tsx` — defineScene with `title` + `agenda` steps (copy the pattern from an existing week's `00-title.tsx`; agenda items from what the user says about the paper).
   - `diagrams/` — empty for now unless the user already described the architecture.
   - `notes.ts` — `export const presenterNotes: Record<string, string>` with `'_home'` and `'00-title'` stubs.
   - `manifest.ts` — WeekManifest with an explorable stub: if no architecture known yet, a minimal 2-3 node placeholder root diagram; `slides: [titleScene]`; `scenes: [titleScene]`; `notes: presenterNotes`.
3. Source material (paper PDF, figure screenshots) goes in `public/assets/<id>/` — move it there if the user dropped it elsewhere.
4. Register the week in `src/weeks/index.ts` (one import + one array entry — keep chronological order).
5. `npm run check` must pass.
6. Report: the week id, explorer URL `http://localhost:5173/#/<id>`, and suggest next actions: `/scene-from-screenshot` for the paper's architecture figure, or describing modules to animate.
