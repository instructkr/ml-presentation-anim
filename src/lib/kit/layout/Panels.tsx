import React from 'react';
import { useTheme } from '../../theme';
import { Fill, type FillSize } from './Fill';

export interface PanelsProps {
  /** a short heading over each panel — a name, never a sentence */
  titles?: React.ReactNode[];
  /** space between panels, 8px units */
  gap?: number;
  /** relative widths (default: equal) */
  weights?: number[];
  /** one render prop per panel; each receives the exact pixels of its own cell */
  children: ((size: FillSize) => React.ReactNode)[];
}

/**
 * Two or three figures side by side in a Board's figure slot (before | after,
 * or the panels of one paper figure). Every panel is measured like `Fill`, so
 * charts get exact pixels and the row never needs hand-computed widths. The
 * headings share one line and one size, so the panels' plots line up.
 */
export const Panels: React.FC<PanelsProps> = ({ titles, gap = 6, weights, children }) => {
  const t = useTheme();
  const hasTitles = !!titles?.some(Boolean);
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: children.map((_, i) => `minmax(0, ${weights?.[i] ?? 1}fr)`).join(' '),
        gridTemplateRows: 'minmax(0, 1fr)',
        columnGap: t.space(gap),
        width: '100%',
        height: '100%',
      }}
    >
      {children.map((render, i) => (
        <div key={i} style={{ display: 'flex', flexDirection: 'column', minWidth: 0, minHeight: 0 }}>
          {hasTitles ? (
            <div
              style={{
                fontFamily: t.fonts.text,
                fontSize: t.fontSize.sm,
                lineHeight: 1.3,
                // an empty heading still holds its line, so every plot starts at the same height
                minHeight: t.fontSize.sm * 1.3,
                color: t.palette.colors.textSecondary,
                textAlign: 'center',
                marginBottom: t.space(2),
              }}
            >
              {titles?.[i]}
            </div>
          ) : null}
          <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
            <Fill>{render}</Fill>
          </div>
        </div>
      ))}
    </div>
  );
};
