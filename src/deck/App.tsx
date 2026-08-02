import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Diagram } from '@/lib/diagram/schema';
import type { SceneModule } from '@/lib/timeline/types';
import { useTheme } from '@/lib/theme';
import { FitScale } from '@/lib/kit/layout/FitScale';
import {
  DetailView,
  ExplorerCanvas,
  Hud,
  Overview,
  ScenePlayer,
  openPresenterBus,
  type Detail,
  type DetailsMap,
  type OverviewItem,
  type OverviewSection,
  type OverviewTarget,
  type PresenterBus,
  type PresenterState,
  type ScenePlayerHandle,
  type SlideDef,
  type WeekManifest,
} from '@/lib/explorer';
import { weeks } from '@/weeks';

interface Level {
  diagram: Diagram;
  details: DetailsMap;
  title: string;
  /** the node that opened this level ('' for the week root) — drives the notes key */
  nodeId: string;
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

const slideLabelOf = (s: SlideDef): string => (s.kind === 'scene' ? s.scene.meta.title : s.title);

const kindTagOf = (d: Detail): string => {
  switch (d.kind) {
    case 'scene':
      return 'Scene';
    case 'interactive':
      return '3D';
    case 'diagram':
      return 'Diagram';
    default:
      return 'Note';
  }
};

const moduleSubOf = (items: Detail[]): string | undefined => {
  if (items.length > 1) return items.map((d) => d.label ?? kindTagOf(d)).join(' · ');
  const d = items[0];
  if (!d) return undefined;
  switch (d.kind) {
    case 'scene':
      return `${d.scene.meta.title} · ${d.scene.meta.steps.length}단계`;
    case 'diagram':
      return '하위 다이어그램';
    case 'interactive':
      return '인터랙티브';
    default:
      return '노트';
  }
};

const toggleFullscreen = () => {
  if (document.fullscreenElement) void document.exitFullscreen();
  else void document.documentElement.requestFullscreen();
};

/** Same origin+path as the deck, minus hash/query — works under dev and preview. */
const openNotesWindow = () => {
  const url = new URL('notes.html', window.location.href);
  url.hash = '';
  url.search = '';
  const w = window.open(url.toString(), 'ml-anim-notes', 'width=980,height=680');
  w?.focus();
};

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
  const [overview, setOverview] = useState(false);
  const [slideIdx, setSlideIdx] = useState(0);
  const playerHandleRef = useRef<ScenePlayerHandle | null>(null);

  useEffect(() => {
    const onHash = () => setRoute(parseHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  useEffect(() => {
    if (week) {
      setStack([
        {
          diagram: week.explorable.root,
          details: week.explorable.details,
          title: week.title,
          nodeId: '',
        },
      ]);
      setOpen(null);
      setVisited(new Set());
      setPathIdx(-1);
      setSlideIdx(0);
      setOverview(false);
    }
  }, [week]);

  const level = stack[stack.length - 1];
  const guidePath = useMemo(() => week?.explorable.path ?? [], [week]);
  const slides = useMemo(() => week?.slides ?? [], [week]);

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
          {
            diagram: first.diagram,
            details: first.details ?? {},
            title: labelOf(level.diagram, nodeId),
            nodeId,
          },
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

  // ── presenter state ────────────────────────────────────────────────────────
  const activeItem: Detail | null = open
    ? (open.items[Math.min(open.tab, open.items.length - 1)] ?? null)
    : null;
  const activeSlide: SlideDef | undefined = route.slides
    ? slides[Math.min(slideIdx, Math.max(0, slides.length - 1))]
    : undefined;
  const activeScene: SceneModule | null = route.slides
    ? activeSlide?.kind === 'scene'
      ? activeSlide.scene
      : null
    : activeItem?.kind === 'scene'
      ? activeItem.scene
      : null;

  /** identifies "where the deck is" — step reports from a stale scene are ignored */
  const locKey = route.slides
    ? `slides:${slideIdx}`
    : open
      ? `detail:${stack.length}:${open.nodeId}:${open.tab}`
      : `level:${stack.length}:${level?.nodeId ?? ''}`;
  const locKeyRef = useRef(locKey);
  locKeyRef.current = locKey;

  const [stepInfo, setStepInfo] = useState<{ loc: string; idx: number; id: string } | null>(null);
  const handleStepChange = useCallback((idx: number, id: string) => {
    setStepInfo({ loc: locKeyRef.current, idx, id });
  }, []);
  const step = stepInfo && stepInfo.loc === locKey ? stepInfo : null;

  const noteKey = route.slides
    ? activeSlide?.kind === 'scene'
      ? activeSlide.scene.meta.id
      : '_slides'
    : open
      ? open.nodeId
      : level?.nodeId || '_home';

  const locTitle = route.slides
    ? (activeSlide ? slideLabelOf(activeSlide) : (week?.title ?? ''))
    : open
      ? open.title
      : (level?.title ?? week?.title ?? '');

  const breadcrumb = route.slides
    ? [week?.title ?? '', '슬라이드', locTitle]
    : [
        ...stack.map((l) => l.title),
        ...(open ? [open.title] : []),
        ...(open && open.items.length > 1 && activeItem?.label ? [activeItem.label] : []),
      ];

  const nextLabel = ((): string | undefined => {
    if (!week) return undefined;
    if (route.slides) {
      const next = slides[slideIdx + 1];
      return next ? slideLabelOf(next) : undefined;
    }
    const nextId = guidePath[pathIdx + 1];
    if (nextId) return labelOf(week.explorable.root, nextId);
    const firstSlide = slides[0];
    return firstSlide ? `슬라이드 · ${slideLabelOf(firstSlide)}` : undefined;
  })();

  const [bus, setBus] = useState<PresenterBus | null>(null);
  const lastStateRef = useRef<PresenterState | null>(null);

  useEffect(() => {
    const b = openPresenterBus();
    const un = b.subscribe((m) => {
      // A notes window that opened mid-talk asks for the current position.
      if (m.type === 'hello' && lastStateRef.current) b.post(lastStateRef.current);
    });
    setBus(b);
    return () => {
      un();
      b.close();
    };
  }, []);

  const stateMsg: PresenterState | null = week
    ? {
        type: 'state',
        weekId: week.id,
        view: route.slides ? 'slides' : open ? 'detail' : 'home',
        noteKey,
        title: locTitle,
        breadcrumb,
        stepId: step?.id,
        stepIdx: step?.idx,
        stepCount: activeScene?.meta.steps.length,
        nextLabel,
        at: 0,
      }
    : null;
  const stateKey = stateMsg ? JSON.stringify(stateMsg) : '';

  useEffect(() => {
    if (!bus || !stateMsg) return;
    const msg: PresenterState = { ...stateMsg, at: Date.now() };
    lastStateRef.current = msg;
    bus.post(msg);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bus, stateKey]);

  // ── overview ───────────────────────────────────────────────────────────────
  const overviewSections = useMemo<OverviewSection[]>(() => {
    if (!week) return [];
    const root = week.explorable.root;
    const details = week.explorable.details;
    const pathIds = week.explorable.path ?? [];
    const ids = [...pathIds, ...Object.keys(details).filter((id) => !pathIds.includes(id))];
    const here =
      open?.nodeId ??
      (stack.length > 1 ? stack[stack.length - 1]?.nodeId : undefined) ??
      (pathIdx >= 0 ? pathIds[pathIdx] : undefined);

    const modules: OverviewItem[] = ids.map((id, i) => {
      const d = details[id];
      const items = Array.isArray(d) ? d : d ? [d] : [];
      return {
        key: `m:${id}`,
        ordinal: i + 1,
        label: labelOf(root, id),
        kindTag: items.map(kindTagOf).join(' + ') || 'Module',
        sub: moduleSubOf(items),
        visited: visited.has(id),
        current: !route.slides && id === here,
        target: { kind: 'module', nodeId: id },
      };
    });

    const slideItems: OverviewItem[] = slides.map((s, i) => ({
      key: `s:${i}`,
      ordinal: i + 1,
      label: slideLabelOf(s),
      kindTag: s.kind === 'scene' ? 'Slide' : 'Live',
      sub: s.kind === 'scene' ? `${s.scene.meta.steps.length}단계` : undefined,
      visited: route.slides && i < slideIdx,
      current: route.slides && i === slideIdx,
      target: { kind: 'slide', index: i },
    }));

    return [
      { title: '가이드 경로', items: modules, empty: '모듈이 없습니다' },
      { title: '슬라이드', items: slideItems, empty: '슬라이드가 없습니다' },
    ];
  }, [week, visited, open, stack, pathIdx, route.slides, slideIdx, slides]);

  const handleOverviewSelect = useCallback(
    (target: OverviewTarget) => {
      setOverview(false);
      if (!week) return;
      if (target.kind === 'slide') {
        setSlideIdx(target.index);
        if (!route.slides) window.location.hash = `#/${week.id}/slides`;
        return;
      }
      if (route.slides) window.location.hash = `#/${week.id}`;
      if (open) closeDetail();
      if (stack.length > 1) setStack((s) => s.slice(0, 1));
      const i = (week.explorable.path ?? []).indexOf(target.nodeId);
      if (i >= 0) setPathIdx(i);
      setOpenReq({ id: target.nodeId, nonce: Date.now() + Math.random() });
    },
    [week, route.slides, open, closeDetail, stack.length],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!week) return;
      // Never swallow browser shortcuts (Cmd+R reload, Cmd+F find, …).
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      // Physical key, so a Korean IME (which rewrites e.key) still drives the deck.
      const key = /^Key[A-Z]$/.test(e.code) ? e.code.slice(3).toLowerCase() : e.key;

      if (overview) {
        // Space must not advance a scene hidden behind the overlay.
        switch (key) {
          case 'Escape':
          case 'o':
            e.preventDefault();
            setOverview(false);
            break;
          case 's':
            openNotesWindow();
            break;
          case 'f':
            toggleFullscreen();
            break;
          case 'd':
            setHud((h) => !h);
            break;
        }
        return;
      }

      const inSlides = route.slides;
      switch (key) {
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
        case 'o':
          setOverview(true);
          break;
        case 's':
          openNotesWindow();
          break;
        case 'f':
          toggleFullscreen();
          break;
        case 'd':
          setHud((h) => !h);
          break;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [week, route.slides, open, stack.length, closeDetail, goPath, overview]);

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
          주차를 선택하세요. (n/p: 가이드 경로 · Space: 다음 단계 · o: 개요 · s: 발표자 노트 · Esc:
          뒤로 · f: 전체화면)
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

  const overviewOverlay = overview ? (
    <Overview
      weekTitle={week.title}
      sections={overviewSections}
      onSelect={handleOverviewSelect}
      onClose={() => setOverview(false)}
    />
  ) : null;

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
            onStepChange={handleStepChange}
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
        {overviewOverlay}
        {hud ? (
          <Hud
            lines={[
              `week  ${week.id}`,
              `slide ${slideIdx + 1}/${week.slides.length}`,
              `note  ${noteKey}${step ? `/${step.id}` : ''}`,
              `keys  o overview · s notes`,
            ]}
          />
        ) : null}
      </div>
    );
  }

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
          onStepChange={handleStepChange}
        />
      ) : null}

      {guidePath.length > 0 && !open ? (
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
          {guidePath.map((id, i) => (
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

      {overviewOverlay}

      {hud ? (
        <Hud
          lines={[
            `week  ${week.id}`,
            `depth ${stack.length}${open ? ` + detail:${open.nodeId}` : ''}`,
            `path  ${pathIdx + 1}/${guidePath.length}`,
            `visited ${visited.size}`,
            `note  ${noteKey}${step ? `/${step.id}` : ''}`,
            `keys  o overview · s notes`,
          ]}
        />
      ) : null}
    </div>
  );
};
