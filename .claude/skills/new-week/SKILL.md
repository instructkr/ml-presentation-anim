---
name: new-week
description: Scaffold a new weekly presentation (week folder, manifest, title scene, registration). Use when the user starts a new week/topic, e.g. "new week on DeepSeek-V4".
---

# New week scaffold

Arguments: a topic slug and/or paper name. Today's date forms the id: `YYYY-MM-DD-<slug>`.

1. Read `CLAUDE.md` (kit/timeline/manifest reference) if not already in context. The model to copy is `src/weeks/2026-10-03-style-pilot/` — manifest, `notes.ts`, title scene.
2. Create `src/weeks/<id>/`:
   - `scenes/00-title.tsx` — copy `2026-10-03-style-pilot/scenes/00-title.tsx`: a `Board` with a centred static `Title` (frame 0 must show it — hard rule 6) and the agenda as `Phrase` lines wiped in on one step. Agenda items are short names of what the talk covers, from what the user says about the paper.
   - `diagrams/` — empty for now unless the user already described the architecture.
   - `notes.ts` — `export const presenterNotes: Record<string, string>` with `'_home'` and `'00-title'` notes, spoken sentences in 합니다체.
   - `manifest.ts` — `WeekManifest` with an explorable stub: if no architecture is known yet, a minimal 2–3 node placeholder root diagram; `slides: [titleScene]`; `scenes: [titleScene]`; `notes: presenterNotes`. **Do not set `palette`** — a new week gets the current look; only weeks authored in an earlier look pin one.
3. Source material (paper PDF, figure screenshots) goes in `public/assets/<id>/` — move it there if the user dropped it elsewhere.
4. Register the week in `src/weeks/index.ts` (one import + one array entry — newest first).
5. `npm run check` must pass; `npm run review -- <id>--00-title` and look at the sheet.
6. Report: the week id, explorer URL `http://localhost:5173/#/<id>`, and suggest next actions: `/scene-from-screenshot` for the paper's architecture figure, or describing modules to animate.
