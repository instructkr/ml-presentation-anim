import React, { useEffect, useState } from 'react';
import { AbsoluteFill, continueRender, delayRender } from 'remotion';
import { ThemeProvider } from '../theme/ThemeProvider';
import { ensureFontsLoaded, fontsReady } from '../theme/fonts';
import { StepProvider } from './context';
import { FPS, HEIGHT, WIDTH, type SceneConfig, type SceneMeta, type SceneModule, type StepMeta } from './types';

/** Blocks the render until webfonts are in, so no frame captures fallback glyphs. */
const FontGate: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [ready, setReady] = useState(fontsReady);
  const [handle] = useState(() => (fontsReady() ? null : delayRender('loading fonts')));
  useEffect(() => {
    if (handle !== null) {
      ensureFontsLoaded().then(() => {
        setReady(true);
        continueRender(handle);
      });
    }
  }, [handle]);
  return ready ? <>{children}</> : <AbsoluteFill />;
};

/**
 * The core authoring entry point. Sums step durations into the composition
 * duration and absolute frame ranges — duration is derived, never
 * hand-maintained. The presenter pause of each step lands on `endFrame - 1`,
 * so every animation must finish by `animEndFrame` (add `hold` if a spring
 * needs settle time).
 */
export const defineScene = (config: SceneConfig, Component: React.FC): SceneModule => {
  if (config.steps.length === 0) {
    throw new Error(`Scene "${config.id}" needs at least one step.`);
  }
  let cursor = 0;
  const steps: StepMeta[] = config.steps.map((s, index) => {
    const animFrames = Math.max(1, Math.round(s.seconds * FPS));
    const holdFrames = Math.round(s.hold * FPS);
    const meta: StepMeta = {
      id: s.id,
      index,
      startFrame: cursor,
      animEndFrame: cursor + animFrames,
      endFrame: cursor + animFrames + holdFrames,
    };
    cursor = meta.endFrame;
    return meta;
  });
  const ids = new Set(steps.map((s) => s.id));
  if (ids.size !== steps.length) {
    throw new Error(`Scene "${config.id}" has duplicate step ids.`);
  }

  const meta: SceneMeta = {
    id: config.id,
    title: config.title,
    steps,
    durationInFrames: cursor,
    fps: FPS,
    width: WIDTH,
    height: HEIGHT,
  };

  const Wrapped: React.FC = () => (
    <FontGate>
      <ThemeProvider>
        <StepProvider meta={meta}>
          <Component />
        </StepProvider>
      </ThemeProvider>
    </FontGate>
  );
  Wrapped.displayName = `Scene(${config.id})`;

  return { meta, Component: Wrapped };
};
