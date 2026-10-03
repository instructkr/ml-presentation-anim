/**
 * The look-at-it step in one command: renders frame 0 and the last frame of
 * every beat of a scene, and tiles them into one sheet.
 *   npm run review -- <weekId>--<sceneId>     one scene
 *   npm run review -- <weekId>                every scene of the week
 * Output: out/review/<compId>/{00-first,NN-<stepId>}.png and sheet.png
 */
import fs from 'node:fs';
import path from 'node:path';
import { bundle } from '@remotion/bundler';
import { getCompositions, renderStill, selectComposition } from '@remotion/renderer';
import { contactSheet } from './contact-sheet.mjs';

const target = process.argv[2];
if (!target) {
  console.error('Usage: npm run review -- <weekId>[--<sceneId>]');
  process.exit(1);
}

const serveUrl = await bundle({
  entryPoint: path.resolve('src/remotion/index.ts'),
  webpackOverride: (config) => ({
    ...config,
    resolve: {
      ...config.resolve,
      alias: { ...(config.resolve?.alias ?? {}), '@': path.resolve('src') },
    },
  }),
});

const comps = (await getCompositions(serveUrl)).filter((c) => c.id === target || c.id.startsWith(`${target}--`));
if (comps.length === 0) {
  console.error(`No composition matches "${target}".`);
  process.exit(1);
}

for (const comp of comps) {
  const composition = await selectComposition({ serveUrl, id: comp.id });
  /** Root.tsx registers each scene's beats as `{id, last}` (last = the pause frame) */
  const beats = composition.defaultProps?.beats ?? [];
  const dir = path.resolve('out', 'review', comp.id);
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  const shots = [
    { name: '00-first', frame: 0 },
    ...beats.map((b, i) => ({ name: `${String(i + 1).padStart(2, '0')}-${b.id}`, frame: b.last })),
  ];
  const files = [];
  for (const shot of shots) {
    const output = path.join(dir, `${shot.name}.png`);
    await renderStill({ composition, serveUrl, output, frame: shot.frame, chromiumOptions: { gl: 'angle' } });
    files.push(output);
  }
  const sheet = await contactSheet(path.join(dir, 'sheet.png'), files, 2);
  console.log(`${comp.id}: ${shots.length} frames → ${path.relative(process.cwd(), sheet)}`);
}
