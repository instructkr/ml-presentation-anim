import React from 'react';
import { AbsoluteFill } from 'remotion';
import { useTheme } from '../../theme';

export interface SlideFrameProps {
  title?: React.ReactNode;
  /** small muted line at the bottom right (week/topic) */
  footer?: React.ReactNode;
  padding?: number;
  children: React.ReactNode;
}

/** Standard 1920×1080 slide chrome: background, title bar, content area. */
export const SlideFrame: React.FC<SlideFrameProps> = ({ title, footer, padding, children }) => {
  const t = useTheme();
  const pad = padding ?? t.space(9);
  return (
    <AbsoluteFill
      style={{
        background: t.palette.colors.bg,
        color: t.palette.colors.text,
        fontFamily: t.fonts.sans,
        wordBreak: 'keep-all',
        lineHeight: 1.5,
        padding: pad,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {title ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: t.space(3), marginBottom: t.space(5) }}>
          <div
            style={{
              width: 10,
              height: t.fontSize.lg + 10,
              borderRadius: 5,
              background: t.palette.colors.accent,
            }}
          />
          <div style={{ fontSize: t.fontSize.lg, fontWeight: 700 }}>{title}</div>
        </div>
      ) : null}
      <div style={{ flex: 1, position: 'relative', minHeight: 0 }}>{children}</div>
      {footer ? (
        <div
          style={{
            position: 'absolute',
            right: t.space(6),
            bottom: t.space(4),
            fontSize: t.fontSize.xs,
            color: t.palette.colors.muted,
          }}
        >
          {footer}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};
