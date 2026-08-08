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

export const WalkthroughStage: React.FC<{
  visual: React.ReactNode;
  explanation: React.ReactNode;
  placement?: 'right' | 'bottom' | 'overlay';
  style?: React.CSSProperties;
}> = ({ visual, explanation, placement = 'right', style }) => {
  const t = useTheme();
  if (placement === 'overlay') {
    return (
      <div style={{ position: 'relative', width: '100%', height: '100%', ...style }}>
        <div style={{ position: 'absolute', inset: 0 }}>{visual}</div>
        <div
          style={{
            position: 'absolute',
            right: t.space(4),
            bottom: t.space(4),
            width: '38%',
            maxHeight: '74%',
            padding: t.space(4),
            borderRadius: t.radius.md,
            border: `1px solid ${t.palette.colors.border}`,
            background: `${t.palette.colors.surface}ee`,
          }}
        >
          {explanation}
        </div>
      </div>
    );
  }
  const bottom = placement === 'bottom';
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: bottom ? '1fr' : 'minmax(0, 1.6fr) minmax(390px, 0.72fr)',
        gridTemplateRows: bottom ? 'minmax(0, 1fr) auto' : '1fr',
        gap: t.space(5),
        width: '100%',
        height: '100%',
        minHeight: 0,
        ...style,
      }}
    >
      <div style={{ position: 'relative', minWidth: 0, minHeight: 0 }}>{visual}</div>
      <div style={{ minWidth: 0, minHeight: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        {explanation}
      </div>
    </div>
  );
};
