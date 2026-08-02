import React from 'react';
import { useTheme } from '../theme';
import { FitScale } from '../kit/layout/FitScale';
import { ExplorerCanvas } from './ExplorerCanvas';
import { ScenePlayer, type ScenePlayerHandle } from './ScenePlayer';
import type { Detail } from './types';

export interface DetailViewProps {
  title: string;
  breadcrumbs: { label: string; onClick?: () => void }[];
  items: Detail[];
  activeTab: number;
  onTab: (i: number) => void;
  playerHandleRef: React.MutableRefObject<ScenePlayerHandle | null>;
  /** open fully revealed (already visited) instead of building in */
  revealed?: boolean;
}

const tabLabel = (d: Detail, i: number): string => {
  if (d.label) return d.label;
  switch (d.kind) {
    case 'scene':
      return d.scene.meta.title;
    case 'interactive':
      return 'Live';
    case 'diagram':
      return 'Diagram';
    case 'note':
      return 'Note';
    default:
      return `Tab ${i + 1}`;
  }
};

/** Full-screen takeover shown after zooming into a module. */
export const DetailView: React.FC<DetailViewProps> = ({
  title,
  breadcrumbs,
  items,
  activeTab,
  onTab,
  playerHandleRef,
  revealed = false,
}) => {
  const t = useTheme();
  const item = items[Math.min(activeTab, items.length - 1)]!;

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: t.palette.colors.page,
        display: 'flex',
        flexDirection: 'column',
        zIndex: 10,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 18,
          padding: '14px 26px',
          borderBottom: `1px solid ${t.palette.colors.border}`,
          fontFamily: t.fonts.sans,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 19, flex: 1, minWidth: 0 }}>
          {breadcrumbs.map((b, i) => (
            <React.Fragment key={i}>
              {i > 0 ? <span style={{ color: t.palette.colors.muted }}>▸</span> : null}
              <span
                onClick={b.onClick}
                style={{
                  color: b.onClick ? t.palette.colors.textSecondary : t.palette.colors.text,
                  cursor: b.onClick ? 'pointer' : 'default',
                  fontWeight: b.onClick ? 400 : 600,
                  whiteSpace: 'nowrap',
                }}
              >
                {b.label}
              </span>
            </React.Fragment>
          ))}
        </div>
        {items.length > 1 ? (
          <div style={{ display: 'flex', gap: 8 }}>
            {items.map((d, i) => (
              <button
                key={i}
                onClick={() => onTab(i)}
                style={{
                  background: i === activeTab ? t.palette.colors.accentSoft : 'transparent',
                  color: i === activeTab ? t.palette.colors.text : t.palette.colors.muted,
                  border: `1px solid ${i === activeTab ? t.palette.colors.accent : t.palette.colors.border}`,
                  borderRadius: 8,
                  padding: '7px 16px',
                  fontSize: 16,
                  fontFamily: t.fonts.sans,
                  cursor: 'pointer',
                }}
              >
                {tabLabel(d, i)}
              </button>
            ))}
          </div>
        ) : null}
        <div style={{ color: t.palette.colors.muted, fontSize: 15, fontFamily: t.fonts.mono }}>
          Space: 다음 단계 · Esc: 돌아가기
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 0, position: 'relative', padding: 18 }}>
        {item.kind === 'scene' ? (
          <ScenePlayer
            key={`${title}-${activeTab}`}
            ref={(h) => {
              playerHandleRef.current = h;
            }}
            scene={item.scene}
            initialMode={revealed ? 'end' : 'start'}
          />
        ) : null}
        {item.kind === 'interactive' ? <item.component /> : null}
        {item.kind === 'note' ? (
          <div
            style={{
              maxWidth: 1150,
              margin: '40px auto',
              fontSize: t.fontSize.sm,
              lineHeight: 1.7,
              color: t.palette.colors.textSecondary,
              fontFamily: t.fonts.sans,
              wordBreak: 'keep-all',
            }}
          >
            {item.content}
          </div>
        ) : null}
        {item.kind === 'diagram' ? (
          <div style={{ position: 'absolute', inset: 18 }}>
            <ExplorerCanvas
              diagram={item.diagram}
              details={item.details ?? {}}
              visited={new Set()}
              onOpen={() => undefined}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
};

export { FitScale };
