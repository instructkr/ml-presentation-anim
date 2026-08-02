import React from 'react';
import { Easing, interpolate, useCurrentFrame } from 'remotion';
import { useSceneMeta, useStep } from './context';

export type AppearEffect = 'fade' | 'rise' | 'pop' | 'left' | 'none';

export interface AppearProps {
  step: string;
  effect?: AppearEffect;
  /** seconds after the step starts */
  delay?: number;
  /** seconds the entrance takes (keep delay+duration+stagger ≤ step seconds) */
  duration?: number;
  /** element index for staggered lists */
  index?: number;
  /** seconds between staggered siblings */
  stagger?: number;
  style?: React.CSSProperties;
  children: React.ReactNode;
}

const styleFor = (effect: AppearEffect, p: number): React.CSSProperties => {
  switch (effect) {
    case 'none':
      return { opacity: p > 0 ? 1 : 0 };
    case 'fade':
      return { opacity: p };
    case 'rise':
      return { opacity: p, transform: `translateY(${(1 - p) * 26}px)` };
    case 'left':
      return { opacity: p, transform: `translateX(${(1 - p) * -30}px)` };
    case 'pop':
      return { opacity: p, transform: `scale(${0.9 + 0.1 * p})` };
  }
};

/** Declarative entrance tied to a named step. */
export const Appear: React.FC<AppearProps> = ({
  step: stepId,
  effect = 'rise',
  delay = 0,
  duration = 0.5,
  index = 0,
  stagger = 0.12,
  style,
  children,
}) => {
  const frame = useCurrentFrame();
  const meta = useSceneMeta();
  const stepMeta = useStep(stepId);
  const start = stepMeta.startFrame + (delay + index * stagger) * meta.fps;
  const frames = Math.max(1, duration * meta.fps);
  const p = interpolate(frame, [start, start + frames], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });
  return <div style={{ ...styleFor(effect, p), ...style }}>{children}</div>;
};
