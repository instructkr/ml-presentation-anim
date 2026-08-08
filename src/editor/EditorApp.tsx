import React, { useCallback, useMemo, useRef, useState } from 'react';
import type { NodeChange } from '@xyflow/react';
import { layoutDiagram } from '@/lib/diagram/layout';
import { useTheme, type Theme } from '@/lib/theme';
import { EditorCanvas } from './EditorCanvas';
import { collectDiagrams, type DiagramEntry } from './diagrams';
import { exportDiagramTs } from './exportTs';
import { groupRects, layoutPositions, nodeBoxes, stripPositions, type Positions } from './geometry';

const ENTRIES = collectDiagrams();

const byWeek = (): [string, DiagramEntry[]][] => {
  const m = new Map<string, DiagramEntry[]>();
  for (const e of ENTRIES) {
    const list = m.get(e.weekId);
    if (list) list.push(e);
    else m.set(e.weekId, [e]);
  }
  return [...m.entries()];
};
const WEEK_GROUPS = byWeek();

const buttonStyle = (t: Theme, primary = false): React.CSSProperties => ({
  padding: '9px 16px',
  borderRadius: t.radius.sm,
  border: `1px solid ${primary ? t.palette.colors.accent : t.palette.colors.border}`,
  background: primary ? t.palette.colors.accent : t.palette.colors.surfaceAlt,
  color: t.palette.colors.text,
  fontSize: 14,
  fontWeight: 600,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
  flexShrink: 0,
});

export const EditorApp: React.FC = () => {
  const t = useTheme();
  const [selected, setSelected] = useState<string | null>(ENTRIES[0]?.key ?? null);
  const [dragged, setDragged] = useState<Positions>({});
  const [source, setSource] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [fitSignal, setFitSignal] = useState(0);
  const textRef = useRef<HTMLTextAreaElement>(null);

  const entry = useMemo(() => ENTRIES.find((e) => e.key === selected) ?? null, [selected]);
  const diagram = entry?.diagram ?? null;
  const layout = useMemo(() => (diagram ? layoutDiagram(diagram) : null), [diagram]);
  const flattened = useMemo(() => (diagram ? stripPositions(diagram) : null), [diagram]);
  const boxes = useMemo(
    () => (diagram && layout ? nodeBoxes(diagram, layout, dragged) : []),
    [diagram, layout, dragged],
  );
  const groups = useMemo(() => (diagram ? groupRects(diagram, boxes) : []), [diagram, boxes]);

  const onNodesChange = useCallback((changes: NodeChange[]) => {
    setDragged((prev) => {
      let next = prev;
      for (const c of changes) {
        if (c.type === 'position' && c.position) {
          if (next === prev) next = { ...prev };
          next[c.id] = { x: c.position.x, y: c.position.y };
        }
      }
      return next;
    });
  }, []);

  const select = (key: string) => {
    setSelected(key);
    setDragged({});
    setSource(null);
    setStatus(null);
    setFitSignal((n) => n + 1);
  };

  const autoLayout = () => {
    if (!flattened) return;
    setDragged(layoutPositions(layoutDiagram(flattened)));
    setFitSignal((n) => n + 1);
  };

  const copy = (text: string) => {
    navigator.clipboard.writeText(text).then(
      () => setStatus('copied to clipboard'),
      () => {
        setStatus('clipboard blocked — select the text and copy manually');
        textRef.current?.select();
      },
    );
  };

  const exportTs = () => {
    if (!diagram) return;
    const text = exportDiagramTs(
      diagram,
      Object.fromEntries(boxes.map((b) => [b.id, { x: b.x, y: b.y }])),
    );
    setSource(text);
    copy(text);
  };

  const baked = Boolean(diagram && diagram.nodes.every((n) => n.position));

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        background: t.palette.colors.page,
        color: t.palette.colors.text,
        fontFamily: t.fonts.sans,
      }}
    >
      <aside
        style={{
          width: 280,
          flexShrink: 0,
          borderRight: `1px solid ${t.palette.colors.border}`,
          background: t.palette.colors.page,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div style={{ padding: '20px 20px 14px' }}>
          <div style={{ fontSize: 19, fontWeight: 700 }}>Diagram Editor</div>
          <div style={{ fontSize: 13, color: t.palette.colors.muted, marginTop: 4 }}>
            drag nodes → Export TS → paste
          </div>
        </div>
        <div style={{ overflowY: 'auto', flex: 1, padding: '0 12px 12px' }}>
          {WEEK_GROUPS.map(([weekId, list]) => (
            <div key={weekId} style={{ marginBottom: 18 }}>
              <div
                style={{
                  fontSize: 12,
                  fontFamily: t.fonts.mono,
                  color: t.palette.colors.muted,
                  padding: '0 8px 6px',
                }}
              >
                {weekId}
              </div>
              {list.map((e) => {
                const active = e.key === selected;
                return (
                  <button
                    key={e.key}
                    onClick={() => select(e.key)}
                    style={{
                      display: 'block',
                      width: '100%',
                      textAlign: 'left',
                      padding: '9px 10px',
                      marginBottom: 3,
                      borderRadius: t.radius.sm,
                      border: '1px solid transparent',
                      borderColor: active ? t.palette.colors.accent : 'transparent',
                      background: active ? t.palette.colors.accentSoft : 'transparent',
                      color: active ? t.palette.colors.text : t.palette.colors.textSecondary,
                      cursor: 'pointer',
                      fontSize: 14,
                    }}
                  >
                    <span style={{ fontFamily: t.fonts.mono }}>{e.diagram.id}</span>
                    <span style={{ display: 'block', fontSize: 12, color: t.palette.colors.muted, marginTop: 2 }}>
                      {e.trail.length ? `↳ ${e.trail.join(' ▸ ')}` : e.weekTitle}
                    </span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </aside>

      <main style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <div
          style={{
            height: 58,
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '0 18px',
            borderBottom: `1px solid ${t.palette.colors.border}`,
          }}
        >
          {diagram ? (
            <>
              <span style={{ fontFamily: t.fonts.mono, fontSize: 15, whiteSpace: 'nowrap' }}>
                {diagram.id}
              </span>
              <span style={{ fontSize: 13, color: t.palette.colors.muted, whiteSpace: 'nowrap' }}>
                {diagram.nodes.length} nodes · {diagram.edges.length} edges · {diagram.direction}
              </span>
              {baked ? (
                <span
                  style={{
                    fontSize: 12,
                    color: t.palette.colors.ok,
                    border: `1px solid ${t.palette.colors.ok}`,
                    borderRadius: 999,
                    padding: '2px 9px',
                    whiteSpace: 'nowrap',
                  }}
                >
                  positions baked
                </span>
              ) : null}
              <div style={{ flex: 1, minWidth: 12 }} />
              {status ? (
                <span
                  style={{
                    fontSize: 13,
                    color: t.palette.colors.textSecondary,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {status}
                </span>
              ) : null}
              <button onClick={autoLayout} style={buttonStyle(t)}>
                Auto-layout
              </button>
              <button onClick={exportTs} style={buttonStyle(t, true)}>
                Export TS
              </button>
            </>
          ) : (
            <span style={{ color: t.palette.colors.muted, fontSize: 14 }}>
              no diagrams registered in src/weeks/index.ts
            </span>
          )}
        </div>

        <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
          {diagram ? (
            <EditorCanvas
              key={entry?.key}
              diagram={diagram}
              boxes={boxes}
              groups={groups}
              onNodesChange={onNodesChange}
              fitSignal={fitSignal}
              routeFromNodes={Object.keys(dragged).length > 0}
            />
          ) : null}
        </div>
      </main>

      {source !== null ? (
        <section
          style={{
            width: 540,
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            borderLeft: `1px solid ${t.palette.colors.border}`,
            background: t.palette.colors.surface,
          }}
        >
          <div
            style={{
              height: 58,
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '0 16px',
              borderBottom: `1px solid ${t.palette.colors.border}`,
            }}
          >
            <span style={{ fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap' }}>
              {diagram ? `${diagram.id}.diagram.ts` : 'export'}
            </span>
            <div style={{ flex: 1 }} />
            <button onClick={() => copy(source)} style={buttonStyle(t)}>
              Copy
            </button>
            <button onClick={() => setSource(null)} style={buttonStyle(t)}>
              Close
            </button>
          </div>
          <textarea
            ref={textRef}
            value={source}
            readOnly
            spellCheck={false}
            wrap="off"
            onClick={() => copy(source)}
            style={{
              flex: 1,
              resize: 'none',
              border: 'none',
              outline: 'none',
              padding: 16,
              background: t.palette.colors.bg,
              color: t.palette.colors.textSecondary,
              fontFamily: t.fonts.mono,
              fontSize: 12,
              lineHeight: 1.6,
            }}
          />
          <div
            style={{
              padding: '10px 16px',
              fontSize: 12,
              color: t.palette.colors.muted,
              borderTop: `1px solid ${t.palette.colors.border}`,
            }}
          >
            paste over the week's <code style={{ fontFamily: t.fonts.mono }}>.diagram.ts</code> file
          </div>
        </section>
      ) : null}
    </div>
  );
};
