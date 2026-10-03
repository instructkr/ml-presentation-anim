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
        lineHeight: 1.45,
        color: resolveColor(t, color, t.palette.colors.text),
        fontFamily: mono ? t.fonts.mono : t.fonts.text,
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
        padding: `${t.space(4)}px ${t.space(5)}px`,
        fontSize: t.fontSize.sm,
        lineHeight: 1.6,
        color: t.palette.colors.textSecondary,
        ...style,
      }}
    >
      {title ? (
        <div style={{ color: t.palette.colors.text, fontWeight: 600, marginBottom: t.space(2) }}>{title}</div>
      ) : null}
      {children}
    </div>
  );
};

export const ExplainerCard: React.FC<{
  eyebrow?: React.ReactNode;
  index?: string | number;
  title: React.ReactNode;
  tone?: 'info' | 'ok' | 'warn';
  children?: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ eyebrow, index, title, tone = 'info', children, style }) => {
  const t = useTheme();
  const accent =
    tone === 'ok' ? t.palette.colors.ok : tone === 'warn' ? t.palette.colors.warn : t.palette.colors.accent;
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: index === undefined ? '1fr' : '68px 1fr',
        columnGap: t.space(3),
        padding: `${t.space(3)}px 0`,
        borderTop: `1px solid ${t.palette.colors.border}`,
        ...style,
      }}
    >
      {index !== undefined ? (
        <div
          style={{
            color: accent,
            fontFamily: t.fonts.mono,
            fontSize: t.fontSize.md,
            fontVariantNumeric: 'tabular-nums',
            lineHeight: 1,
          }}
        >
          {String(index).padStart(2, '0')}
        </div>
      ) : null}
      <div>
        {eyebrow ? (
          <div
            style={{
              color: accent,
              fontFamily: t.fonts.mono,
              fontSize: t.fontSize.xs,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              marginBottom: t.space(1),
            }}
          >
            {eyebrow}
          </div>
        ) : null}
        <div style={{ color: t.palette.colors.text, fontSize: t.fontSize.md, fontWeight: 600 }}>{title}</div>
        {children ? (
          <div
            style={{
              color: t.palette.colors.textSecondary,
              fontSize: t.fontSize.sm,
              lineHeight: 1.6,
              marginTop: t.space(1),
            }}
          >
            {children}
          </div>
        ) : null}
      </div>
    </div>
  );
};

/**
 * One implementation fact — a mono chip with a short eyebrow. Scenes keep the
 * prose conceptual and let these appear (inside `Appear`) on the beat where the
 * number or format actually matters.
 */
export const Spec: React.FC<{
  label?: React.ReactNode;
  tone?: 'info' | 'ok' | 'warn';
  style?: React.CSSProperties;
  children: React.ReactNode;
}> = ({ label, tone = 'info', style, children }) => {
  const t = useTheme();
  const accent =
    tone === 'ok' ? t.palette.colors.ok : tone === 'warn' ? t.palette.colors.warn : t.palette.colors.accent;
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'baseline',
        gap: t.space(2),
        padding: `${t.space(1)}px ${t.space(3)}px`,
        border: `1px solid ${t.palette.colors.border}`,
        borderRadius: t.radius.sm,
        background: t.palette.colors.surface,
        whiteSpace: 'nowrap',
        ...style,
      }}
    >
      {label ? (
        <span style={{ color: accent, fontSize: t.fontSize.xs, fontWeight: 600, letterSpacing: '0.04em' }}>
          {label}
        </span>
      ) : null}
      <span
        style={{
          color: t.palette.colors.text,
          fontFamily: t.fonts.mono,
          fontSize: t.fontSize.xs,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {children}
      </span>
    </div>
  );
};
