/**
 * Batch-render every scene of a week to MP4:
 *   npm run render:week -- 2026-08-05-moe-demo
 */
import path from 'node:path';
import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition, getCompositions } from '@remotion/renderer';

const weekId = process.argv[2];
if (!weekId) {
  console.error('Usage: npm run render:week -- <week-id>');
  process.exit(1);
}

const run = async () => {
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

  const comps = (await getCompositions(serveUrl)).filter((c) => c.id.startsWith(`${weekId}--`));
  if (comps.length === 0) {
    console.error(`No compositions found for week "${weekId}".`);
    process.exit(1);
  }

  for (const comp of comps) {
    const composition = await selectComposition({ serveUrl, id: comp.id });
    const out = path.resolve('out', weekId, `${comp.id.split('--')[1]}.mp4`);
    console.log(`Rendering ${comp.id} → ${out}`);
    await renderMedia({
      composition,
      serveUrl,
      codec: 'h264',
      outputLocation: out,
      chromiumOptions: { gl: 'angle' },
    });
  }
  console.log(`Done: ${comps.length} scene(s) rendered to out/${weekId}/`);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
