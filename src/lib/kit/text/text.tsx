import React from 'react';
import { resolveColor, useTheme } from '../../theme';

export const Title: React.FC<{ sub?: React.ReactNode; children: React.ReactNode }> = ({
  sub,
  children,
}) => {
  const t = useTheme();
  return (
    <div>
      <div style={{ fontSize: t.fontSize.title, fontWeight: 700, lineHeight: 1.2 }}>{children}</div>
      {sub ? (
        <div
          style={{
            fontSize: t.fontSize.md,
            color: t.palette.colors.textSecondary,
            marginTop: t.space(3),
          }}
        >
          {sub}
        </div>
      ) : null}
    </div>
  );
};

export interface LabelProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  color?: string;
  weight?: 400 | 600 | 700;
  mono?: boolean;
  style?: React.CSSProperties;
  children: React.ReactNode;
}

export const Label: React.FC<LabelProps> = ({
  size = 'md',
  color,
  weight = 400,
  mono = false,
  style,
  children,
}) => {
  const t = useTheme();
  return (
    <div
      style={{
        fontSize: t.fontSize[size],
        fontWeight: weight,
        color: resolveColor(t, color, t.palette.colors.text),
        fontFamily: mono ? t.fonts.mono : t.fonts.sans,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

export const Callout: React.FC<{
  tone?: 'info' | 'ok' | 'warn';
  title?: React.ReactNode;
  style?: React.CSSProperties;
  children: React.ReactNode;
}> = ({ tone = 'info', title, style, children }) => {
  const t = useTheme();
  const edge =
    tone === 'ok' ? t.palette.colors.ok : tone === 'warn' ? t.palette.colors.warn : t.palette.colors.accent;
  return (
    <div
      style={{
        background: t.palette.colors.surface,
        borderLeft: `6px solid ${edge}`,
        borderRadius: t.radius.sm,
        padding: `${t.space(3)}px ${t.space(4)}px`,
        fontSize: t.fontSize.sm,
        color: t.palette.colors.textSecondary,
        ...style,
      }}
    >
      {title ? (
        <div style={{ color: t.palette.colors.text, fontWeight: 600, marginBottom: t.space(1) }}>{title}</div>
      ) : null}
      {children}
    </div>
  );
};
