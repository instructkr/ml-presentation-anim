import React from 'react';
import { useTheme } from '../../theme';

export interface StackProps {
  direction?: 'row' | 'column';
  /** 8px units */
  gap?: number;
  align?: React.CSSProperties['alignItems'];
  justify?: React.CSSProperties['justifyContent'];
  style?: React.CSSProperties;
  children: React.ReactNode;
}

export const Stack: React.FC<StackProps> = ({
  direction = 'column',
  gap = 3,
  align = 'stretch',
  justify = 'flex-start',
  style,
  children,
}) => {
  const t = useTheme();
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: direction,
        gap: t.space(gap),
        alignItems: align,
        justifyContent: justify,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

export const Grid: React.FC<{
  columns: number;
  gap?: number;
  style?: React.CSSProperties;
  children: React.ReactNode;
}> = ({ columns, gap = 3, style, children }) => {
  const t = useTheme();
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap: t.space(gap),
        ...style,
      }}
    >
      {children}
    </div>
  );
};

export const Center: React.FC<{ style?: React.CSSProperties; children: React.ReactNode }> = ({
  style,
  children,
}) => (
  <div
    style={{
      position: 'absolute',
      inset: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      ...style,
    }}
  >
    {children}
  </div>
);
