import type React from 'react';

export const FPS = 30;
export const WIDTH = 1920;
export const HEIGHT = 1080;

export interface StepDef {
  id: string;
  /** seconds of animation inside this step */
  seconds: number;
  /** extra static seconds after animations finish, so the pause frame is still */
  hold: number;
}

export interface StepMeta {
  id: string;
  index: number;
  /** first frame of the step */
  startFrame: number;
  /** frame by which all of this step's animations must be complete */
  animEndFrame: number;
  /** exclusive end; the presenter pause lands on endFrame - 1 */
  endFrame: number;
}

export interface SceneConfig {
  /** kebab-case, prefixed for ordering: '02-architecture' */
  id: string;
  /** shown in explorer detail header / slides */
  title: string;
  steps: StepDef[];
}

export interface SceneMeta {
  id: string;
  title: string;
  steps: StepMeta[];
  durationInFrames: number;
  fps: number;
  width: number;
  height: number;
}

export interface SceneModule {
  meta: SceneMeta;
  Component: React.FC;
}

export const step = (id: string, seconds: number, opts?: { hold?: number }): StepDef => ({
  id,
  seconds,
  hold: opts?.hold ?? 0,
});
