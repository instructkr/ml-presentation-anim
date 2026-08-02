import React, { useId, useMemo } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { Easing, interpolate, interpolateColors, useCurrentFrame } from 'remotion';
import { useSceneMeta } from '../../timeline/context';
import type { StepMeta } from '../../timeline/types';
import { resolveColor, useTheme } from '../../theme';

export interface EqPart {
  /** raw LaTeX for this term — remember to escape backslashes */
  tex: string;
  /** step this term arrives on; omit to have it visible from frame 0 */
  step?: string;
  /** tint while the term's step is active (default `accent`); it still settles to text color after */
  color?: string;
}

export interface EqStepsProps {
  parts: EqPart[];
  display?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  style?: React.CSSProperties;
}

/** mirrors Tex's scale — same numbers so an EqSteps and a Tex at the same size match */
const SIZES = { sm: 28, md: 38, lg: 50, xl: 66 } as const;

const FADE_SECONDS = 0.5;
/** how long the accent tint takes to fall back to text color once the step is over */
const DECAY_SECONDS = 0.45;
const GLOW_PX = 14;

/**
 * A leading +/− is the first atom of its own group once wrapped in \htmlClass,
 * so TeX renders it unary and drops the binary spacing. An empty ord group in
 * front restores it.
 */
const LEADING_BINARY = /^\s*([+\-*]|\\pm|\\mp|\\cdot|\\times|\\div)/;

const katexOptions = (display: boolean) =>
  ({
    displayMode: display,
    throwOnError: false,
    strict: 'ignore',
    trust: (ctx: { command: string }) => ctx.command === '\\htmlClass',
  }) as const;

/**
 * One display equation revealed term by term. Every part is laid out in a
 * single KaTeX pass — hidden terms keep their space, so nothing reflows as the
 * equation fills in — and per-part opacity/color come from the frame via a
 * generated scoped stylesheet.
 *
 * Must render inside a defineScene() component (it reads the scene's steps).
 */
export const EqSteps: React.FC<EqStepsProps> = ({ parts, display = true, size = 'lg', style }) => {
  const t = useTheme();
  const meta = useSceneMeta();
  const frame = useCurrentFrame();
  const prefix = `eq-${useId().replace(/[^a-zA-Z0-9]/g, '')}`;

  const html = useMemo(() => {
    const latex = parts
      .map((p, i) =>
        p.step || p.color
          ? `\\htmlClass{${prefix}-${i}}{${LEADING_BINARY.test(p.tex) ? `{}${p.tex}` : p.tex}}`
          : p.tex,
      )
      .join(' ');
    return katex.renderToString(latex, katexOptions(display));
  }, [parts, display, prefix]);

  const unknownSteps = useMemo(
    () => [
      ...new Set(
        parts
          .map((p) => p.step)
          .filter((id): id is string => !!id && !meta.steps.some((s) => s.id === id)),
      ),
    ],
    [parts, meta],
  );

  const rest = t.palette.colors.text;

  /** 0 before the step, 1 while it is the current step, eased back to 0 during the next one */
  const activation = (s: StepMeta): number => {
    if (frame < s.startFrame) return 0;
    if (frame < s.endFrame) return 1;
    const next = meta.steps[s.index + 1];
    if (!next) return 1;
    const decayEnd = Math.min(s.endFrame + DECAY_SECONDS * meta.fps, next.animEndFrame);
    return interpolate(frame, [s.endFrame, Math.max(decayEnd, s.endFrame + 1)], [1, 0], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.out(Easing.cubic),
    });
  };

  const css = parts
    .map((p, i) => {
      if (!p.step && !p.color) return '';
      const s = p.step ? meta.steps.find((x) => x.id === p.step) : undefined;
      if (p.step && !s) return '';
      const hi = resolveColor(t, p.color, t.palette.colors.accent);
      if (!s) return `.${prefix}-${i}{color:${hi};}`;

      const span = s.animEndFrame - s.startFrame;
      const fade = Math.max(1, Math.min(FADE_SECONDS * meta.fps, span));
      const opacity = interpolate(frame, [s.startFrame, s.startFrame + fade], [0, 1], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
        easing: Easing.out(Easing.cubic),
      });
      const a = activation(s);
      const color = interpolateColors(a, [0, 1], [rest, hi]);
      const glow = a > 0.02 ? `text-shadow:0 0 ${(a * GLOW_PX).toFixed(1)}px ${color};` : '';
      return `.${prefix}-${i}{opacity:${opacity.toFixed(3)};color:${color};${glow}}`;
    })
    .join('\n');

  return (
    <span
      className={prefix}
      style={{
        fontSize: SIZES[size],
        color: rest,
        display: display ? 'block' : 'inline-block',
        position: 'relative',
        ...style,
      }}
    >
      {/* the scene's Stack owns the spacing; KaTeX's 1em display margin would fight it */}
      <style dangerouslySetInnerHTML={{ __html: `.${prefix} .katex-display{margin:0;}\n${css}` }} />
      <span dangerouslySetInnerHTML={{ __html: html }} />
      {unknownSteps.length > 0 ? (
        <span
          style={{
            display: 'inline-block',
            marginLeft: t.space(2),
            background: t.palette.colors.danger,
            color: '#fff',
            fontSize: 22,
            fontFamily: t.fonts.mono,
            padding: '6px 12px',
            borderRadius: 8,
            verticalAlign: 'middle',
          }}
        >
          EqSteps: unknown steps: {unknownSteps.join(', ')}
        </span>
      ) : null}
    </span>
  );
};
