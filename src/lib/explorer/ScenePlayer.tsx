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
  back(): void;
  restart(): void;
}

export interface ScenePlayerProps {
  scene: SceneModule;
  /** 'start': autoplay step 1 then pause · 'end': open fully revealed */
  initialMode?: 'start' | 'end';
}

/**
 * Remotion Player wrapped with the named-step controller: Space (via the
 * deck's keyboard router) plays exactly to the next step's endFrame - 1 and
 * pauses there. Never polls — rides the per-frame 'frameupdate' event.
 */
export const ScenePlayer = forwardRef<ScenePlayerHandle, ScenePlayerProps>(
  ({ scene, initialMode = 'start' }, ref) => {
    const t = useTheme();
    const playerRef = useRef<PlayerRef>(null);
    const targetRef = useRef<number | null>(null);
    const stepIdxRef = useRef(0);
    const [stepIdx, setStepIdx] = useState(0);
    const { meta } = scene;
    const lastIdx = meta.steps.length - 1;

    const settle = useCallback(
      (idx: number, frame: number) => {
        const p = playerRef.current;
        if (!p) return;
        p.pause();
        p.seekTo(frame);
        targetRef.current = null;
        stepIdxRef.current = idx;
        setStepIdx(idx);
      },
      [],
    );

    const playToStep = useCallback((idx: number) => {
      const p = playerRef.current;
      const stepMeta = meta.steps[idx];
      if (!p || !stepMeta) return;
      targetRef.current = stepMeta.endFrame - 1;
      stepIdxRef.current = idx;
      setStepIdx(idx);
      p.play();
    }, [meta]);

    useEffect(() => {
      const p = playerRef.current;
      if (!p) return;
      const onFrame = (e: { detail: { frame: number } }) => {
        const target = targetRef.current;
        if (target !== null && e.detail.frame >= target) {
          settle(stepIdxRef.current, target);
        }
      };
      p.addEventListener('frameupdate', onFrame);
      return () => p.removeEventListener('frameupdate', onFrame);
    }, [settle]);

    useEffect(() => {
      if (initialMode === 'end') {
        const last = meta.steps[lastIdx]!;
        settle(lastIdx, last.endFrame - 1);
      } else {
        playToStep(0);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [scene]);

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
            return;
          }
          const prev = Math.max(0, stepIdxRef.current - 1);
          settle(prev, meta.steps[prev]!.endFrame - 1);
        },
        restart: () => {
          playerRef.current?.seekTo(0);
          playToStep(0);
        },
      }),
      [playToStep, settle, lastIdx, meta],
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
              ref={playerRef}
              component={scene.Component}
              durationInFrames={meta.durationInFrames}
              compositionWidth={meta.width}
              compositionHeight={meta.height}
              fps={meta.fps}
              controls={false}
              clickToPlay={false}
              doubleClickToFullscreen={false}
              spaceKeyToPlayOrPause={false}
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
