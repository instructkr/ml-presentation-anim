import React from 'react';
import { resolveColor, useTheme } from '../../theme';

export interface TensorMatrixProps {
  values: (string | number)[][];
  rowLabels?: string[];
  columnLabels?: string[];
  title?: string;
  /** cells to emphasize, expressed as [row, column] */
  highlight?: [number, number][];
  /** deterministic 0..1 entrance progress */
  progress?: number;
  color?: string;
  width?: number;
  cellHeight?: number;
}

/**
 * Presentation-scale tensor/matrix notation that can live beside a diagram.
 * Unlike a screenshot of a table, every cell can reveal and highlight from a
 * Remotion step progress value while retaining crisp, aligned typography.
 */
export const TensorMatrix: React.FC<TensorMatrixProps> = ({
  values,
  rowLabels,
  columnLabels,
  title,
  highlight = [],
  progress = 1,
  color = 'accent',
  width = 430,
  cellHeight = 58,
}) => {
  const t = useTheme();
  const accent = resolveColor(t, color, t.palette.colors.accent);
  const columns = Math.max(1, ...values.map((row) => row.length));
  const hasRows = Boolean(rowLabels?.length);
  const active = new Set(highlight.map(([r, c]) => `${r}:${c}`));
  const total = Math.max(1, values.length * columns);

  return (
    <div style={{ width, fontFamily: t.fonts.text }}>
      {title ? (
        <div
          style={{
            marginBottom: 12,
            color: t.palette.colors.textSecondary,
            fontSize: 18,
            fontWeight: 600,
            letterSpacing: '0.04em',
          }}
        >
          {title}
        </div>
      ) : null}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `${hasRows ? '74px ' : ''}repeat(${columns}, 1fr)`,
          gap: 5,
          alignItems: 'center',
        }}
      >
        {columnLabels ? (
          <>
            {hasRows ? <div /> : null}
            {Array.from({ length: columns }, (_, c) => (
              <div
                key={`col-${c}`}
                style={{
                  textAlign: 'center',
                  color: t.palette.colors.muted,
                  fontFamily: t.fonts.mono,
                  fontSize: 14,
                  paddingBottom: 4,
                }}
              >
                {columnLabels[c] ?? ''}
              </div>
            ))}
          </>
        ) : null}
        {values.map((row, r) => (
          <React.Fragment key={`row-${r}`}>
            {hasRows ? (
              <div
                style={{
                  paddingRight: 9,
                  textAlign: 'right',
                  color: t.palette.colors.muted,
                  fontFamily: t.fonts.mono,
                  fontSize: 15,
                }}
              >
                {rowLabels?.[r] ?? ''}
              </div>
            ) : null}
            {Array.from({ length: columns }, (_, c) => {
              const order = r * columns + c;
              const cellProgress = Math.max(0, Math.min(1, progress * 1.35 - order / total * 0.35));
              const isActive = active.has(`${r}:${c}`);
              return (
                <div
                  key={`${r}:${c}`}
                  style={{
                    height: cellHeight,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: t.radius.sm,
                    border: `1px solid ${isActive ? accent : t.palette.colors.border}`,
                    background: isActive ? `${accent}26` : t.palette.colors.surface,
                    color: isActive ? t.palette.colors.text : t.palette.colors.textSecondary,
                    boxShadow: isActive ? `0 0 24px ${accent}35` : 'none',
                    fontFamily: t.fonts.mono,
                    fontVariantNumeric: 'tabular-nums',
                    fontSize: 21,
                    fontWeight: isActive ? 600 : 400,
                    opacity: cellProgress,
                    transform: `translateY(${(1 - cellProgress) * 10}px)`,
                  }}
                >
                  {row[c] ?? ''}
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};
