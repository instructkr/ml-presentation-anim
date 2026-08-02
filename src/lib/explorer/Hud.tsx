import React from 'react';
import { useTheme } from '../theme';

/** Debug overlay, toggled with 'd'. Hidden by default — stream-safe. */
export const Hud: React.FC<{ lines: string[] }> = ({ lines }) => {
  const t = useTheme();
  return (
    <div
      style={{
        position: 'fixed',
        top: 12,
        right: 12,
        background: 'rgba(0,0,0,0.72)',
        color: t.palette.colors.textSecondary,
        fontFamily: t.fonts.mono,
        fontSize: 13,
        padding: '10px 14px',
        borderRadius: 8,
        zIndex: 99,
        pointerEvents: 'none',
        whiteSpace: 'pre',
      }}
    >
      {lines.join('\n')}
    </div>
  );
};
