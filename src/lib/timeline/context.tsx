import React, { createContext, useContext } from 'react';
import { useCurrentFrame } from 'remotion';
import type { SceneMeta, StepMeta } from './types';

const StepContext = createContext<SceneMeta | null>(null);

export const StepProvider: React.FC<React.PropsWithChildren<{ meta: SceneMeta }>> = ({
  meta,
  children,
}) => <StepContext.Provider value={meta}>{children}</StepContext.Provider>;

export const useSceneMeta = (): SceneMeta => {
  const meta = useContext(StepContext);
  if (!meta) {
    throw new Error(
      'useSceneMeta: no scene context. Components using steps must render inside a defineScene() component.',
    );
  }
  return meta;
};

export const useStep = (stepId: string): StepMeta => {
  const meta = useSceneMeta();
  const found = meta.steps.find((s) => s.id === stepId);
  if (!found) {
    throw new Error(
      `Unknown step "${stepId}" in scene "${meta.id}". Available steps: ${meta.steps
        .map((s) => s.id)
        .join(', ')}`,
    );
  }
  return found;
};

/** Index of the step the playhead is currently inside. */
export const useCurrentStepIndex = (): number => {
  const meta = useSceneMeta();
  const frame = useCurrentFrame();
  let idx = 0;
  for (const s of meta.steps) {
    if (frame >= s.startFrame) idx = s.index;
  }
  return idx;
};
