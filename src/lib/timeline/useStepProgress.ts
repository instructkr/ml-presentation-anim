import { Easing, interpolate, useCurrentFrame } from 'remotion';
import { useStep } from './context';

export type EasingName = 'linear' | 'in' | 'out' | 'inOut';

const EASINGS: Record<EasingName, (t: number) => number> = {
  linear: (t) => t,
  in: Easing.in(Easing.cubic),
  out: Easing.out(Easing.cubic),
  inOut: Easing.inOut(Easing.cubic),
};

export interface StepProgressOptions {
  /** window inside the step's animation span, as fractions: [0.2, 0.8] */
  portion?: [number, number];
  easing?: EasingName;
}

/**
 * 0 before the step, eased 0→1 across (a portion of) the step's animation
 * span, 1 afterwards — including in every later step. Feed it to any
 * progress-driven prop (splitProgress, draw, camera lerps…).
 */
export const useStepProgress = (stepId: string, opts?: StepProgressOptions): number => {
  const frame = useCurrentFrame();
  const stepMeta = useStep(stepId);
  const span = stepMeta.animEndFrame - stepMeta.startFrame;
  const [p0, p1] = opts?.portion ?? [0, 1];
  const from = stepMeta.startFrame + p0 * span;
  const to = stepMeta.startFrame + p1 * span;
  const raw = interpolate(frame, [from, Math.max(to, from + 1)], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return EASINGS[opts?.easing ?? 'out'](raw);
};
