import React from 'react';
import { Composition } from 'remotion';
import { weeks } from '@/weeks';

/**
 * Every scene of every week becomes a Composition with id
 * `<weekId>--<sceneId>` — durations derive from the scene's steps.
 */
export const RemotionRoot: React.FC = () => (
  <>
    {weeks.flatMap((week) =>
      week.scenes.map((scene) => (
        <Composition
          key={`${week.id}--${scene.meta.id}`}
          id={`${week.id}--${scene.meta.id}`}
          component={scene.Component}
          durationInFrames={scene.meta.durationInFrames}
          fps={scene.meta.fps}
          width={scene.meta.width}
          height={scene.meta.height}
        />
      )),
    )}
  </>
);
