import React from 'react';
import { Composition } from 'remotion';
import type { WeekManifest } from '@/lib/explorer/types';
import { ThemeProvider } from '@/lib/theme';
import type { SceneModule } from '@/lib/timeline/types';
import { weeks } from '@/weeks';

/** a week that pins a look gets every scene wrapped in it; built once so the component identity is stable */
const inWeekLook = (week: WeekManifest, scene: SceneModule): React.FC => {
  if (!week.palette) return scene.Component;
  const { palette } = week;
  const Pinned: React.FC = () => (
    <ThemeProvider palette={palette}>
      <scene.Component />
    </ThemeProvider>
  );
  Pinned.displayName = `${palette.name}(${scene.meta.id})`;
  return Pinned;
};

const compositions = weeks.flatMap((week) =>
  week.scenes.map((scene) => ({
    id: `${week.id}--${scene.meta.id}`,
    component: inWeekLook(week, scene),
    meta: scene.meta,
  })),
);

/**
 * Every scene of every week becomes a Composition with id
 * `<weekId>--<sceneId>` — durations derive from the scene's steps.
 */
export const RemotionRoot: React.FC = () => (
  <>
    {compositions.map((c) => (
      <Composition
        key={c.id}
        id={c.id}
        component={c.component as React.FC<Record<string, unknown>>}
        // read by scripts/review.mjs: the pause frame of every beat
        defaultProps={{ beats: c.meta.steps.map((s) => ({ id: s.id, last: s.endFrame - 1 })) }}
        durationInFrames={c.meta.durationInFrames}
        fps={c.meta.fps}
        width={c.meta.width}
        height={c.meta.height}
      />
    ))}
  </>
);
