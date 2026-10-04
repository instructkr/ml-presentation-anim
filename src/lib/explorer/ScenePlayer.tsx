import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { Player, type PlayerRef } from '@remotion/player';
import { useTheme } from '../theme';
import type { SceneModule } from '../timeline/types';

export interface ScenePlayerHandle {
  /** play to the next step boundary; false when already at the last step */
  advance(): boolean;
  /** settle on the previous step; false when already on the first one */
  back(): boolean;
  restart(): void;
  playAll(): void;
  pause(): void;
}

export interface ScenePlayerProps {
  scene: SceneModule;
  /** 'start': autoplay step 1 then pause · 'end': open fully revealed */
  initialMode?: 'start' | 'end';
  /** fired whenever the current step changes or settles (incl. mount + restart) */
  onStepChange?: (stepIdx: number, stepId: string) => void;
  /** play the entire scene without pausing at beat boundaries */
  autoWalkthrough?: boolean;
  /** fired after a full walkthrough reaches the final frame */
  onComplete?: () => void;
}

/**
 * Remotion Player wrapped with the named-step controller: Space (via the
 * deck's keyboard router) plays exactly to the next step's endFrame - 1 and
 * pauses there. Never polls — rides the per-frame 'frameupdate' event.
 */
export const ScenePlayer = forwardRef<ScenePlayerHandle, ScenePlayerProps>(
  ({ scene, initialMode = 'start', onStepChange, autoWalkthrough = false, onComplete }, ref) => {
    const t = useTheme();
    const playerRef = useRef<PlayerRef>(null);
    const targetRef = useRef<number | null>(null);
    const walkthroughRef = useRef(false);
    const stepIdxRef = useRef(0);
    const [stepIdx, setStepIdx] = useState(0);
    const [playerReady, setPlayerReady] = useState(0);
    const { meta } = scene;
    const lastIdx = meta.steps.length - 1;

    const attachPlayer = useCallback((player: PlayerRef | null) => {
      if (playerRef.current === player) return;
      playerRef.current = player;
      if (player) setPlayerReady((n) => n + 1);
    }, []);

    // Kept in a ref so a changing callback identity never re-runs the
    // mount effect below (which would restart the scene mid-talk).
    const onStepChangeRef = useRef(onStepChange);
    useEffect(() => {
      onStepChangeRef.current = onStepChange;
    }, [onStepChange]);
    const onCompleteRef = useRef(onComplete);
    useEffect(() => {
      onCompleteRef.current = onComplete;
    }, [onComplete]);

    const emitStep = useCallback(
      (idx: number) => {
        const s = meta.steps[idx];
        if (s) onStepChangeRef.current?.(idx, s.id);
      },
      [meta],
    );

    const settle = useCallback(
      (idx: number, frame: number) => {
        const p = playerRef.current;
        if (!p) return;
        p.pause();
        p.seekTo(frame);
        targetRef.current = null;
        walkthroughRef.current = false;
        stepIdxRef.current = idx;
        setStepIdx(idx);
        emitStep(idx);
      },
      [emitStep],
    );

    const playToStep = useCallback((idx: number) => {
      const p = playerRef.current;
      const stepMeta = meta.steps[idx];
      if (!p || !stepMeta) return;
      targetRef.current = stepMeta.endFrame - 1;
      walkthroughRef.current = false;
      stepIdxRef.current = idx;
      setStepIdx(idx);
      emitStep(idx);
      p.play();
    }, [meta, emitStep]);

    const playAll = useCallback((fromStart = true) => {
      const p = playerRef.current;
      if (!p) return;
      if (fromStart) {
        p.seekTo(0);
        stepIdxRef.current = 0;
        setStepIdx(0);
        emitStep(0);
      }
      targetRef.current = meta.durationInFrames - 1;
      walkthroughRef.current = true;
      p.play();
    }, [emitStep, meta.durationInFrames]);

    useEffect(() => {
      const p = playerRef.current;
      if (!p) return;
      const onFrame = (e: { detail: { frame: number } }) => {
        let liveIdx = 0;
        for (const s of meta.steps) {
          if (e.detail.frame >= s.startFrame) liveIdx = s.index;
        }
        if (liveIdx !== stepIdxRef.current) {
          stepIdxRef.current = liveIdx;
          setStepIdx(liveIdx);
          emitStep(liveIdx);
        }
        const target = targetRef.current;
        if (target !== null && e.detail.frame >= target) {
          const completedWalkthrough = walkthroughRef.current;
          settle(completedWalkthrough ? lastIdx : stepIdxRef.current, target);
          if (completedWalkthrough) onCompleteRef.current?.();
        }
      };
      p.addEventListener('frameupdate', onFrame);
      return () => p.removeEventListener('frameupdate', onFrame);
    }, [emitStep, lastIdx, meta.steps, settle]);

    useEffect(() => {
      if (initialMode === 'end') {
        const last = meta.steps[lastIdx]!;
        settle(lastIdx, last.endFrame - 1);
      } else {
        playToStep(0);
      }
    }, [scene, playerReady, initialMode, lastIdx, meta.steps, playToStep, settle]);

    useEffect(() => {
      if (playerReady && autoWalkthrough) playAll(true);
    }, [autoWalkthrough, playAll, playerReady, scene]);

    useImperativeHandle(
      ref,
      () => ({
        advance: () => {
          if (targetRef.current !== null) {
            settle(stepIdxRef.current, targetRef.current);
            return true;
          }
          if (stepIdxRef.current < lastIdx) {
            playToStep(stepIdxRef.current + 1);
            return true;
          }
          return false;
        },
        back: () => {
          if (targetRef.current !== null) {
            settle(stepIdxRef.current, targetRef.current);
            return true;
          }
          if (stepIdxRef.current === 0) return false;
          const prev = stepIdxRef.current - 1;
          settle(prev, meta.steps[prev]!.endFrame - 1);
          return true;
        },
        restart: () => {
          playerRef.current?.seekTo(0);
          playToStep(0);
        },
        playAll: () => playAll(true),
        pause: () => {
          playerRef.current?.pause();
          targetRef.current = null;
          walkthroughRef.current = false;
        },
      }),
      [playAll, playToStep, settle, lastIdx, meta],
    );

    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
        <div style={{ flex: 1, minHeight: 0, display: 'flex', justifyContent: 'center' }}>
          <div
            style={{
              aspectRatio: '16 / 9',
              maxWidth: '100%',
              maxHeight: '100%',
              width: '100%',
              background: t.palette.colors.bg,
              borderRadius: 6,
              overflow: 'hidden',
            }}
          >
            <Player
              ref={attachPlayer}
              component={scene.Component}
              durationInFrames={meta.durationInFrames}
              compositionWidth={meta.width}
              compositionHeight={meta.height}
              fps={meta.fps}
              initialFrame={initialMode === 'end' ? meta.durationInFrames - 1 : 0}
              controls={false}
              clickToPlay={false}
              doubleClickToFullscreen={false}
              spaceKeyToPlayOrPause={false}
              // Scenes are silent. Without these, the Player syncs playback to an
              // AudioContext that browsers keep suspended until a user gesture —
              // play() then reports isPlaying while the frame stays frozen at 0
              // (a black slide when the deck opens or a detail auto-plays).
              initiallyMuted
              numberOfSharedAudioTags={0}
              acknowledgeRemotionLicense
              style={{ width: '100%', height: '100%' }}
            />
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            gap: 18,
            justifyContent: 'center',
            padding: '10px 0 2px',
            fontFamily: t.fonts.mono,
            fontSize: 15,
          }}
        >
          {meta.steps.map((s) => (
            <button
              key={s.id}
              onClick={() => settle(s.index, s.endFrame - 1)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                color:
                  s.index === stepIdx
                    ? t.palette.colors.accent
                    : s.index < stepIdx
                      ? t.palette.colors.textSecondary
                      : t.palette.colors.muted,
              }}
            >
              <span
                style={{
                  width: 9,
                  height: 9,
                  borderRadius: 5,
                  background: s.index <= stepIdx ? t.palette.colors.accent : t.palette.colors.baseline,
                }}
              />
              {s.id}
            </button>
          ))}
        </div>
      </div>
    );
  },
);
ScenePlayer.displayName = 'ScenePlayer';
