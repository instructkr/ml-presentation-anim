import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Diagram } from '@/lib/diagram/schema';
import { useTheme } from '@/lib/theme';
import { FitScale } from '@/lib/kit/layout/FitScale';
import {
  DetailView,
  ExplorerCanvas,
  Hud,
  ScenePlayer,
  type Detail,
  type DetailsMap,
  type ScenePlayerHandle,
  type WeekManifest,
} from '@/lib/explorer';
import { weeks } from '@/weeks';

interface Level {
  diagram: Diagram;
  details: DetailsMap;
  title: string;
}

interface OpenDetail {
  nodeId: string;
  title: string;
  items: Detail[];
  tab: number;
  wasVisited: boolean;
}

const parseHash = (): { weekId: string | null; slides: boolean } => {
  const m = window.location.hash.match(/^#\/([^/]+)(\/slides)?/);
  return { weekId: m?.[1] ?? null, slides: Boolean(m?.[2]) };
};

const labelOf = (diagram: Diagram, id: string): string =>
  diagram.nodes.find((n) => n.id === id)?.label ??
  diagram.groups.find((g) => g.id === id)?.label ??
  id;

export const App: React.FC = () => {
  const t = useTheme();
  const [route, setRoute] = useState(parseHash);
  const week: WeekManifest | undefined = useMemo(
    () => weeks.find((w) => w.id === route.weekId),
    [route.weekId],
  );

  const [stack, setStack] = useState<Level[]>([]);
  const [open, setOpen] = useState<OpenDetail | null>(null);
  const [visited, setVisited] = useState<Set<string>>(new Set());
  const [pathIdx, setPathIdx] = useState(-1);
  const [openReq, setOpenReq] = useState<{ id: string; nonce: number } | null>(null);
  const [resetReq, setResetReq] = useState(0);
  const [hud, setHud] = useState(false);
  const [slideIdx, setSlideIdx] = useState(0);
  const playerHandleRef = useRef<ScenePlayerHandle | null>(null);

  useEffect(() => {
    const onHash = () => setRoute(parseHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  useEffect(() => {
    if (week) {
      setStack([{ diagram: week.explorable.root, details: week.explorable.details, title: week.title }]);
      setOpen(null);
      setVisited(new Set());
      setPathIdx(-1);
      setSlideIdx(0);
    }
  }, [week]);

  const level = stack[stack.length - 1];

  const handleOpen = useCallback(
    (nodeId: string) => {
      if (!level) return;
      const d = level.details[nodeId];
      if (!d) return;
      const items = Array.isArray(d) ? d : [d];
      const wasVisited = visited.has(nodeId);
      setVisited((v) => new Set(v).add(nodeId));
      const path = week?.explorable.path;
      if (path && stack.length === 1) {
        const i = path.indexOf(nodeId);
        if (i >= 0) setPathIdx(i);
      }
      const first = items[0]!;
      if (items.length === 1 && first.kind === 'diagram') {
        setStack((s) => [
          ...s,
          { diagram: first.diagram, details: first.details ?? {}, title: labelOf(level.diagram, nodeId) },
        ]);
      } else {
        setOpen({ nodeId, title: labelOf(level.diagram, nodeId), items, tab: 0, wasVisited });
      }
    },
    [level, visited, week, stack.length],
  );

  const closeDetail = useCallback(() => {
    playerHandleRef.current = null;
    setOpen(null);
    setResetReq((n) => n + 1);
  }, []);

  const goPath = useCallback(
    (dir: 1 | -1) => {
      const path = week?.explorable.path;
      if (!path || path.length === 0) return;
      const next = Math.min(path.length - 1, Math.max(0, pathIdx + dir));
      if (next === pathIdx && dir === 1 && pathIdx >= 0) return;
      if (open) closeDetail();
      if (stack.length > 1) setStack((s) => s.slice(0, 1));
      setPathIdx(next);
      setOpenReq({ id: path[next]!, nonce: Date.now() + Math.random() });
    },
    [week, pathIdx, open, closeDetail, stack.length],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!week) return;
      const inSlides = route.slides;
      switch (e.key) {
        case ' ': {
          e.preventDefault();
          const advanced = playerHandleRef.current?.advance();
          if (inSlides && advanced === false) {
            setSlideIdx((i) => Math.min((week.slides?.length ?? 1) - 1, i + 1));
          }
          break;
        }
        case 'ArrowRight':
          if (inSlides) setSlideIdx((i) => Math.min((week.slides?.length ?? 1) - 1, i + 1));
          break;
        case 'ArrowLeft':
          if (inSlides) setSlideIdx((i) => Math.max(0, i - 1));
          break;
        case 'ArrowUp':
        case 'Backspace':
          playerHandleRef.current?.back();
          break;
        case 'r':
          playerHandleRef.current?.restart();
          break;
        case 'Escape':
          if (open) closeDetail();
          else if (stack.length > 1) {
            setStack((s) => s.slice(0, -1));
            setResetReq((n) => n + 1);
          }
          break;
        case 'n':
          if (!inSlides) goPath(1);
          break;
        case 'p':
          if (!inSlides) goPath(-1);
          break;
        case 'f':
          if (document.fullscreenElement) void document.exitFullscreen();
          else void document.documentElement.requestFullscreen();
          break;
        case 'd':
          setHud((h) => !h);
          break;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [week, route.slides, open, stack.length, closeDetail, goPath]);

  if (!week) {
    return (
      <div
        style={{
          minHeight: '100%',
          background: t.palette.colors.page,
          color: t.palette.colors.text,
          fontFamily: t.fonts.sans,
          padding: 64,
        }}
      >
        <h1 style={{ fontSize: 44, marginBottom: 8 }}>ML Weekly — Explorer</h1>
        <p style={{ color: t.palette.colors.muted, marginBottom: 40 }}>
          주차를 선택하세요. (n/p: 가이드 경로 · Space: 다음 단계 · Esc: 뒤로 · f: 전체화면)
        </p>
        {weeks.map((w) => (
          <div key={w.id} style={{ marginBottom: 18, fontSize: 24 }}>
            <a href={`#/${w.id}`} style={{ color: t.palette.colors.accent, textDecoration: 'none' }}>
              {w.id} — {w.title}
            </a>
            {w.slides?.length ? (
              <a
                href={`#/${w.id}/slides`}
                style={{ color: t.palette.colors.muted, marginLeft: 20, fontSize: 18, textDecoration: 'none' }}
              >
                [slides]
              </a>
            ) : null}
          </div>
        ))}
      </div>
    );
  }

  if (route.slides && week.slides?.length) {
    const slide = week.slides[Math.min(slideIdx, week.slides.length - 1)]!;
    return (
      <div style={{ position: 'fixed', inset: 0, background: t.palette.colors.page }}>
        {slide.kind === 'scene' ? (
          <ScenePlayer
            key={slideIdx}
            ref={(h) => {
              playerHandleRef.current = h;
            }}
            scene={slide.scene}
          />
        ) : (
          <FitScale>
            <slide.component />
          </FitScale>
        )}
        <div
          style={{
            position: 'fixed',
            right: 18,
            bottom: 12,
            color: t.palette.colors.muted,
            fontFamily: t.fonts.mono,
            fontSize: 14,
          }}
        >
          {slideIdx + 1} / {week.slides.length}
        </div>
        {hud ? <Hud lines={[`week ${week.id}`, `slide ${slideIdx + 1}/${week.slides.length}`]} /> : null}
      </div>
    );
  }

  const path = week.explorable.path ?? [];

  return (
    <div style={{ position: 'fixed', inset: 0, background: t.palette.colors.page }}>
      {level ? (
        <ExplorerCanvas
          key={stack.length}
          diagram={level.diagram}
          details={level.details}
          visited={visited}
          onOpen={handleOpen}
          openRequest={stack.length === 1 ? openReq : null}
          resetRequest={resetReq}
        />
      ) : null}

      {stack.length > 1 && !open ? (
        <div
          style={{
            position: 'fixed',
            top: 16,
            left: 20,
            display: 'flex',
            gap: 10,
            alignItems: 'center',
            fontFamily: t.fonts.sans,
            fontSize: 19,
            color: t.palette.colors.textSecondary,
            background: 'rgba(13,13,13,0.8)',
            padding: '8px 16px',
            borderRadius: 10,
          }}
        >
          {stack.map((l, i) => (
            <React.Fragment key={i}>
              {i > 0 ? <span style={{ color: t.palette.colors.muted }}>▸</span> : null}
              <span
                onClick={i < stack.length - 1 ? () => setStack((s) => s.slice(0, i + 1)) : undefined}
                style={{ cursor: i < stack.length - 1 ? 'pointer' : 'default' }}
              >
                {l.title}
              </span>
            </React.Fragment>
          ))}
        </div>
      ) : null}

      {open && level ? (
        <DetailView
          title={open.title}
          breadcrumbs={[
            ...stack.map((l, i) => ({
              label: l.title,
              onClick: () => {
                closeDetail();
                setStack((s) => s.slice(0, i + 1));
              },
            })),
            { label: open.title },
          ]}
          items={open.items}
          activeTab={open.tab}
          onTab={(tab) => setOpen((o) => (o ? { ...o, tab } : o))}
          playerHandleRef={playerHandleRef}
          revealed={open.wasVisited}
        />
      ) : null}

      {path.length > 0 && !open ? (
        <div
          style={{
            position: 'fixed',
            left: 20,
            bottom: 14,
            display: 'flex',
            gap: 14,
            alignItems: 'center',
            fontFamily: t.fonts.sans,
            fontSize: 15,
            color: t.palette.colors.muted,
            background: 'rgba(13,13,13,0.8)',
            padding: '8px 16px',
            borderRadius: 10,
          }}
        >
          {path.map((id, i) => (
            <span
              key={id}
              onClick={() => {
                setPathIdx(i);
                if (stack.length > 1) setStack((s) => s.slice(0, 1));
                setOpenReq({ id, nonce: Date.now() + Math.random() });
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                cursor: 'pointer',
                color:
                  i === pathIdx
                    ? t.palette.colors.accent
                    : visited.has(id)
                      ? t.palette.colors.textSecondary
                      : t.palette.colors.muted,
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  background: visited.has(id) ? t.palette.colors.ok : t.palette.colors.baseline,
                }}
              />
              {labelOf(week.explorable.root, id)}
            </span>
          ))}
        </div>
      ) : null}

      {hud ? (
        <Hud
          lines={[
            `week  ${week.id}`,
            `depth ${stack.length}${open ? ` + detail:${open.nodeId}` : ''}`,
            `path  ${pathIdx + 1}/${path.length}`,
            `visited ${visited.size}`,
          ]}
        />
      ) : null}
    </div>
  );
};
