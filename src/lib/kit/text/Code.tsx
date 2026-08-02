import React from 'react';
import { useTheme } from '../../theme';

export interface CodeProps {
  children: string;
  fontSize?: number;
  highlightLines?: number[];
  title?: string;
  style?: React.CSSProperties;
}

/** Simple code block — no syntax highlighting deps, just gutter + line highlight. */
export const Code: React.FC<CodeProps> = ({ children, fontSize = 24, highlightLines, title, style }) => {
  const t = useTheme();
  const lines = children.split('\n');
  const highlighted = new Set(highlightLines ?? []);
  const gutterWidth = `${String(lines.length).length + 1}ch`;

  return (
    <div
      style={{
        background: t.palette.colors.surface,
        borderRadius: t.radius.md,
        overflow: 'hidden',
        fontFamily: t.fonts.mono,
        ...style,
      }}
    >
      {title ? (
        <div
          style={{
            padding: `${t.space(2)}px ${t.space(3)}px`,
            fontSize: t.fontSize.sm,
            color: t.palette.colors.textSecondary,
            borderBottom: `1px solid ${t.palette.colors.border}`,
          }}
        >
          {title}
        </div>
      ) : null}
      <div style={{ padding: `${t.space(2)}px 0`, overflowX: 'hidden' }}>
        {lines.map((line, i) => {
          const n = i + 1;
          return (
            <div
              key={i}
              style={{
                display: 'flex',
                whiteSpace: 'pre',
                background: highlighted.has(n) ? t.palette.colors.accentSoft : 'transparent',
              }}
            >
              <div
                style={{
                  flexShrink: 0,
                  width: gutterWidth,
                  textAlign: 'right',
                  paddingRight: t.space(2),
                  color: t.palette.colors.muted,
                  fontSize,
                  userSelect: 'none',
                }}
              >
                {n}
              </div>
              <div style={{ paddingRight: t.space(3), color: t.palette.colors.text, fontSize }}>
                {line.length ? line : ' '}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
