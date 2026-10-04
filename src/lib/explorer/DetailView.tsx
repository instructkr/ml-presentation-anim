import React, { useCallback, useEffect, useState } from 'react';
import type { Diagram } from '../diagram/schema';
import { useTheme } from '../theme';
import { FitScale } from '../kit/layout/FitScale';
import { ExplorerCanvas } from './ExplorerCanvas';
import { ScenePlayer, type ScenePlayerHandle } from './ScenePlayer';
import type { Detail, DetailsMap } from './types';

export interface DetailViewProps {
  title: string;
  breadcrumbs: { label: string; onClick?: () => void }[];
  items: Detail[];
  activeTab: number;
  onTab: (i: number) => void;
  playerHandleRef: React.MutableRefObject<ScenePlayerHandle | null>;
  /** open fully revealed (already visited) instead of building in */
  revealed?: boolean;
  /** forwarded to ScenePlayer so App can broadcast step position to the notes window */
  onStepChange?: (stepIdx: number, stepId: string) => void;
  /** the diagram this module was opened from, kept visible in the rail while the explanation plays */
  contextDiagram?: Diagram;
  /** module highlighted in the rail */
  contextNodeId?: string;
  /** what the rail frames: the open module's group (its chapter); omit for the whole diagram */
  contextFrameIds?: string[];
  /** the level's details and visited set — with `onOpenNode`, the rail's modules open on a click */
  contextDetails?: DetailsMap;
  contextVisited?: Set<string>;
  onOpenNode?: (nodeId: string) => void;
  /** where this module sits in the guided path (1-based), shown above the rail */
  position?: { index: number; total: number };
}

const NO_DETAILS: DetailsMap = {};
const NONE_VISITED = new Set<string>();
const noop = () => undefined;

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

/** Contextual workspace shown after the overview camera settles on a module. */
export const DetailView: React.FC<DetailViewProps> = ({
  title,
  breadcrumbs,
  items,
  activeTab,
  onTab,
  playerHandleRef,
  revealed = false,
  onStepChange,
  contextDiagram,
  contextNodeId,
  contextFrameIds,
  contextDetails,
  contextVisited,
  onOpenNode,
  position,
}) => {
  const t = useTheme();
  const item = items[Math.min(activeTab, items.length - 1)]!;
  const [walking, setWalking] = useState(false);

  // the walkthrough belongs to the module it was started in
  useEffect(() => setWalking(false), [contextNodeId]);

  const stopWalkthrough = useCallback(() => {
    setWalking(false);
    playerHandleRef.current?.pause();
  }, [playerHandleRef]);

  const handleComplete = useCallback(() => {
    const nextScene = items.findIndex((candidate, i) => i > activeTab && candidate.kind === 'scene');
    if (walking && nextScene >= 0) onTab(nextScene);
    else setWalking(false);
  }, [activeTab, items, onTab, walking]);

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: t.palette.colors.page,
        display: 'flex',
        flexDirection: 'column',
        zIndex: 10,
        animation: 'detail-enter 420ms cubic-bezier(0.2, 0.8, 0.2, 1) both',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 18,
          padding: '14px 26px',
          borderBottom: `1px solid ${t.palette.colors.border}`,
          fontFamily: t.fonts.text,
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
                onClick={() => {
                  stopWalkthrough();
                  onTab(i);
                }}
                style={{
                  background: i === activeTab ? t.palette.colors.accentSoft : 'transparent',
                  color: i === activeTab ? t.palette.colors.text : t.palette.colors.muted,
                  border: `1px solid ${i === activeTab ? t.palette.colors.accent : t.palette.colors.border}`,
                  borderRadius: 8,
                  padding: '7px 16px',
                  fontSize: 16,
                  fontFamily: t.fonts.text,
                  cursor: 'pointer',
                }}
              >
                <span style={{ opacity: 0.62, marginRight: 7, fontFamily: t.fonts.mono }}>
                  {String(i + 1).padStart(2, '0')}
                </span>
                {tabLabel(d, i)}
              </button>
            ))}
          </div>
        ) : null}
        {item.kind === 'scene' ? (
          <button
            onClick={() => {
              if (walking) stopWalkthrough();
              else setWalking(true);
            }}
            aria-label={walking ? '워크스루 일시정지' : '전체 워크스루 재생'}
            style={{
              border: `1px solid ${walking ? t.palette.colors.accent : t.palette.colors.border}`,
              borderRadius: 999,
              background: walking ? t.palette.colors.accentSoft : t.palette.colors.surface,
              color: t.palette.colors.text,
              padding: '8px 15px',
              cursor: 'pointer',
              fontFamily: t.fonts.text,
              whiteSpace: 'nowrap',
            }}
          >
            {walking ? 'Ⅱ  멈춤' : '▶  전체 워크스루'}
          </button>
        ) : null}
        <div style={{ color: t.palette.colors.muted, fontSize: 15, fontFamily: t.fonts.mono }}>
          Space 다음 · ← 이전 · Esc 돌아가기 · o 개요
        </div>
      </div>

      <div
        style={{
          flex: 1,
          minHeight: 0,
          display: 'grid',
          gridTemplateColumns: contextDiagram ? 'minmax(250px, 20vw) minmax(0, 1fr)' : '1fr',
        }}
      >
        {contextDiagram ? (
          <aside
            style={{
              minWidth: 0,
              minHeight: 0,
              display: 'flex',
              flexDirection: 'column',
              borderRight: `1px solid ${t.palette.colors.border}`,
              background: t.palette.colors.bg,
            }}
          >
            {position ? (
              <div
                style={{
                  padding: '16px 18px 0',
                  fontFamily: t.fonts.num,
                  fontSize: 17,
                  color: t.palette.colors.muted,
                }}
              >
                {position.index} / {position.total}
              </div>
            ) : null}
            <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
              <ExplorerCanvas
                diagram={contextDiagram}
                details={onOpenNode ? (contextDetails ?? NO_DETAILS) : NO_DETAILS}
                visited={contextVisited ?? NONE_VISITED}
                onOpen={onOpenNode ?? noop}
                activeIds={contextNodeId ? [contextNodeId] : []}
                frameIds={contextFrameIds}
                interactive={Boolean(onOpenNode)}
                instantOpen
                showMiniMap={false}
              />
            </div>
          </aside>
        ) : null}

        <div style={{ minWidth: 0, minHeight: 0, position: 'relative', padding: 18 }}>
          {item.kind === 'scene' ? (
            <ScenePlayer
              key={`${contextNodeId ?? title}-${activeTab}`}
              ref={(h) => {
                playerHandleRef.current = h;
              }}
              scene={item.scene}
              initialMode={walking ? 'start' : revealed ? 'end' : 'start'}
              autoWalkthrough={walking}
              onComplete={handleComplete}
              onStepChange={onStepChange}
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
                fontFamily: t.fonts.text,
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
    </div>
  );
};

export { FitScale };
