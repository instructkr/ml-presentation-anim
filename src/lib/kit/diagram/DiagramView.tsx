import React, { useMemo } from 'react';
import { Easing, interpolate, useCurrentFrame } from 'remotion';
import type { Diagram } from '../../diagram/schema';
import {
  groupBounds,
  groupLabelLeft,
  layoutDiagram,
  waypointPoints,
  type LaidOutNode,
  type Rect,
} from '../../diagram/layout';
import { useSceneMeta } from '../../timeline/context';
import { useTheme } from '../../theme';
import { ArrowEdge } from './ArrowEdge';
import { Block } from './Block';
import { GroupBox } from './GroupBox';

/** Offset in diagram pixels, applied on top of the node's laid-out position. */
export interface NodeOffset {
  dx: number;
  dy: number;
}

export interface DiagramCamera {
  /** node/group ids the 2D camera should frame for this beat */
  focus: string[];
  /** breathing room in diagram pixels around the focused elements */
  padding?: number;
  /** optional tighter/looser cap than the DiagramView-level maxScale */
  maxScale?: number;
}

export interface StepEffect {
  /** ids become visible at this step and stay visible (cumulative) */
  reveal?: string[];
  /** ids glow while this step is active */
  highlight?: string[];
  /** edge ids get a marching-dash flow while this step is active */
  pulse?: string[];
  /** ids fade back while this step is active; 'others' = everything not otherwise referenced this step */
  dim?: string[] | 'others';
  /**
   * A deterministic, frame-derived 2D camera move. The most recent camera
   * persists into later beats until another step supplies one.
   */
  camera?: DiagramCamera;
  /**
   * node id → offset in diagram px (FLIP-style glide). Cumulative like `reveal`:
   * the offset eases in across this step's animation window and persists for every
   * later step; offsets from several steps sum. Attached edges and group boxes
   * follow the displaced node every frame.
   */
  move?: Record<string, NodeOffset>;
}

export interface DiagramViewProps {
  diagram: Diagram;
  /** step id → effects. Ids not listed in any `reveal` are visible from the start. */
  stepEffects?: Record<string, StepEffect>;
  width?: number;
  height?: number;
  maxScale?: number;
}

const APPEAR_SECONDS = 0.55;
const STAGGER_SECONDS = 0.1;
/** breathing room added around the union of all morph states, matching the layout margin */
const EXTENT_PAD = 24;

const ZERO: NodeOffset = { dx: 0, dy: 0 };

const rectOf = (n: LaidOutNode, o: NodeOffset = ZERO): Rect => ({
  x: n.x + o.dx,
  y: n.y + o.dy,
  w: n.w,
  h: n.h,
});

/**
 * Frame-driven renderer for a Diagram. Must render inside a defineScene()
 * component (it reads the scene's step timing).
 */
export const DiagramView: React.FC<DiagramViewProps> = ({
  diagram,
  stepEffects,
  width = 1760,
  height = 800,
  maxScale = 1.4,
}) => {
  const t = useTheme();
  const meta = useSceneMeta();
  const frame = useCurrentFrame();
  const layout = useMemo(() => layoutDiagram(diagram), [diagram]);

  const knownIds = useMemo(() => {
    const s = new Set<string>();
    for (const n of diagram.nodes) s.add(n.id);
    for (const e of diagram.edges) s.add(e.id);
    for (const g of diagram.groups) s.add(g.id);
    return s;
  }, [diagram]);
  const nodeIds = useMemo(() => new Set(diagram.nodes.map((n) => n.id)), [diagram]);

  const { revealAt, unknownIds, anyReveals } = useMemo(() => {
    /** id → the exact frame its entrance starts, stagger already folded in */
    const revealAt = new Map<string, number>();
    const unknownIds: string[] = [];
    let anyReveals = false;
    for (const [stepId, fx] of Object.entries(stepEffects ?? {})) {
      const stepMeta = meta.steps.find((s) => s.id === stepId);
      if (!stepMeta) {
        unknownIds.push(`step:${stepId}`);
        continue;
      }
      for (const list of [
        fx.reveal,
        fx.highlight,
        fx.pulse,
        Array.isArray(fx.dim) ? fx.dim : [],
        fx.camera?.focus,
      ]) {
        for (const id of list ?? []) {
          if (!knownIds.has(id)) unknownIds.push(id);
        }
      }
      // `move` takes node ids only — an edge or group id here is a mistake.
      for (const id of Object.keys(fx.move ?? {})) {
        if (!nodeIds.has(id)) unknownIds.push(`move:${id}`);
      }
      // A whole figure panel can be one reveal list, so the stagger compresses
      // to whatever room the step has left after the last entrance — the step
      // must still end static.
      const list = fx.reveal ?? [];
      const appearFrames = APPEAR_SECONDS * meta.fps;
      const room = Math.max(0, stepMeta.animEndFrame - stepMeta.startFrame - appearFrames);
      const stagger = list.length > 1 ? Math.min(STAGGER_SECONDS * meta.fps, room / (list.length - 1)) : 0;
      list.forEach((id, order) => {
        anyReveals = true;
        if (!revealAt.has(id)) revealAt.set(id, stepMeta.startFrame + order * stagger);
      });
    }
    return { revealAt, unknownIds, anyReveals };
  }, [stepEffects, meta, knownIds, nodeIds]);

  /** Steps that move nodes, in step order, with only the valid node ids kept. */
  const moveSteps = useMemo(() => {
    const out: { startFrame: number; animEndFrame: number; moves: [string, NodeOffset][] }[] = [];
    for (const s of meta.steps) {
      const moves = Object.entries(stepEffects?.[s.id]?.move ?? {}).filter(([id]) => nodeIds.has(id));
      if (moves.length > 0) {
        out.push({ startFrame: s.startFrame, animEndFrame: s.animEndFrame, moves });
      }
    }
    return out;
  }, [meta, stepEffects, nodeIds]);

  const movedIds = useMemo(
    () => new Set(moveSteps.flatMap((s) => s.moves.map(([id]) => id))),
    [moveSteps],
  );

  /** Cumulative offset per moved node at this frame (eased over each owning step's animation window). */
  const offsets = useMemo(() => {
    const acc = new Map<string, NodeOffset>();
    for (const s of moveSteps) {
      const p = interpolate(frame, [s.startFrame, s.animEndFrame], [0, 1], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
        easing: Easing.inOut(Easing.cubic),
      });
      for (const [id, off] of s.moves) {
        const cur = acc.get(id) ?? { dx: 0, dy: 0 };
        acc.set(id, { dx: cur.dx + off.dx * p, dy: cur.dy + off.dy * p });
      }
    }
    return acc;
  }, [moveSteps, frame]);

  /** Live rects for this frame — the single source of truth for nodes, edges and group boxes. */
  const rects = useMemo(() => {
    const m = new Map<string, Rect>();
    for (const n of layout.nodes) m.set(n.node.id, rectOf(n, offsets.get(n.node.id)));
    return m;
  }, [layout, offsets]);

  const groupRects = useMemo(
    () =>
      layout.groups.map((g) => {
        const members = layout.nodes.filter((n) => n.node.parent === g.group.id);
        const moves = members.some((n) => movedIds.has(n.node.id));
        return moves ? groupBounds(members.map((n) => rects.get(n.node.id)!)) : { x: g.x, y: g.y, w: g.w, h: g.h };
      }),
    [layout, rects, movedIds],
  );

  /** Nodes and groups share one live endpoint map during morphs. */
  const endpointRects = useMemo(() => {
    const m = new Map(rects);
    layout.groups.forEach((g, i) => m.set(g.group.id, groupRects[i]!));
    return m;
  }, [layout.groups, rects, groupRects]);

  const movedEndpoints = useMemo(() => {
    const ids = new Set(movedIds);
    for (const g of layout.groups) {
      if (layout.nodes.some((n) => n.node.parent === g.group.id && movedIds.has(n.node.id))) {
        ids.add(g.group.id);
      }
    }
    return ids;
  }, [layout.groups, layout.nodes, movedIds]);

  /**
   * Fit the view to the union of every morph state so the scale never jumps
   * mid-move and displaced nodes stay inside the frame. With no `move` this is
   * exactly the laid-out size.
   */
  const extent = useMemo(() => {
    if (moveSteps.length === 0) {
      return { w: layout.width, h: layout.height, shiftX: 0, shiftY: 0 };
    }
    let minX = 0;
    let minY = 0;
    let maxX = 0;
    let maxY = 0;
    const acc = new Map<string, NodeOffset>();
    const visit = () => {
      const nodeRects = layout.nodes.map((n) => rectOf(n, acc.get(n.node.id)));
      const byId = new Map(layout.nodes.map((n, i) => [n.node.id, nodeRects[i]!]));
      const boxes = [
        ...nodeRects,
        ...layout.groups.map((g) =>
          groupBounds(
            layout.nodes.filter((n) => n.node.parent === g.group.id).map((n) => byId.get(n.node.id)!),
          ),
        ),
      ];
      for (const b of boxes) {
        minX = Math.min(minX, b.x);
        minY = Math.min(minY, b.y);
        maxX = Math.max(maxX, b.x + b.w);
        maxY = Math.max(maxY, b.y + b.h);
      }
    };
    visit();
    for (const s of moveSteps) {
      for (const [id, off] of s.moves) {
        const cur = acc.get(id) ?? { dx: 0, dy: 0 };
        acc.set(id, { dx: cur.dx + off.dx, dy: cur.dy + off.dy });
      }
      visit();
    }
    const shiftX = Math.max(0, -minX);
    const shiftY = Math.max(0, -minY);
    return {
      w: Math.max(layout.width + shiftX, maxX + shiftX + EXTENT_PAD),
      h: Math.max(layout.height + shiftY, maxY + shiftY + EXTENT_PAD),
      shiftX,
      shiftY,
    };
  }, [layout, moveSteps]);

  const appearProgress = (id: string): number => {
    if (!anyReveals) return 1;
    const start = revealAt.get(id);
    if (start === undefined) return 1;
    return interpolate(frame, [start, start + APPEAR_SECONDS * meta.fps], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.out(Easing.cubic),
    });
  };

  const current = useMemo(() => {
    let active: StepEffect = {};
    for (const s of meta.steps) {
      if (frame >= s.startFrame && frame < s.endFrame) {
        active = stepEffects?.[s.id] ?? {};
      }
    }
    const highlight = new Set(active.highlight ?? []);
    const pulse = new Set(active.pulse ?? []);
    let dim = new Set<string>();
    if (active.dim === 'others') {
      const keep = new Set([...(active.reveal ?? []), ...highlight, ...pulse]);
      dim = new Set([...knownIds].filter((id) => !keep.has(id)));
    } else if (Array.isArray(active.dim)) {
      dim = new Set(active.dim);
    }
    return { highlight, pulse, dim };
  }, [frame, meta, stepEffects, knownIds]);

  type View = { scale: number; x: number; y: number };

  const cameraForStep = (stepIndex: number): DiagramCamera | undefined => {
    for (let i = stepIndex; i >= 0; i--) {
      const camera = stepEffects?.[meta.steps[i]!.id]?.camera;
      if (camera) return camera;
    }
    return undefined;
  };

  const viewFor = (camera?: DiagramCamera): View => {
    const focusRects = camera?.focus
      .map((id) => {
        const node = rects.get(id);
        if (node) return node;
        const gi = layout.groups.findIndex((g) => g.group.id === id);
        return gi >= 0 ? groupRects[gi] : undefined;
      })
      .filter((r): r is Rect => Boolean(r));
    const pad = camera?.padding ?? 36;
    const bounds = focusRects?.length
      ? {
          x: Math.min(...focusRects.map((r) => r.x)) - pad,
          y: Math.min(...focusRects.map((r) => r.y)) - pad,
          w:
            Math.max(...focusRects.map((r) => r.x + r.w)) -
            Math.min(...focusRects.map((r) => r.x)) +
            pad * 2,
          h:
            Math.max(...focusRects.map((r) => r.y + r.h)) -
            Math.min(...focusRects.map((r) => r.y)) +
            pad * 2,
        }
      : { x: -extent.shiftX, y: -extent.shiftY, w: extent.w, h: extent.h };
    const scale = Math.min(
      width / Math.max(1, bounds.w),
      height / Math.max(1, bounds.h),
      camera?.maxScale ?? maxScale,
    );
    return {
      scale,
      x: (width - bounds.w * scale) / 2 - (bounds.x + extent.shiftX) * scale,
      y: (height - bounds.h * scale) / 2 - (bounds.y + extent.shiftY) * scale,
    };
  };

  let stepIndex = 0;
  for (const s of meta.steps) {
    if (frame >= s.startFrame) stepIndex = s.index;
  }
  const activeStep = meta.steps[stepIndex]!;
  const cameraSpan = Math.max(1, Math.min(activeStep.animEndFrame - activeStep.startFrame, meta.fps * 0.8));
  const cameraProgress = interpolate(
    frame,
    [activeStep.startFrame, activeStep.startFrame + cameraSpan],
    [0, 1],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.inOut(Easing.cubic),
    },
  );
  const fromView = viewFor(stepIndex > 0 ? cameraForStep(stepIndex - 1) : undefined);
  const toView = viewFor(cameraForStep(stepIndex));
  const cameraView = {
    scale: fromView.scale + (toView.scale - fromView.scale) * cameraProgress,
    x: fromView.x + (toView.x - fromView.x) * cameraProgress,
    y: fromView.y + (toView.y - fromView.y) * cameraProgress,
  };
  const pulsePhase = (frame % 24) / 24;

  return (
    <div style={{ position: 'relative', width, height, overflow: 'hidden' }}>
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: extent.w,
          height: extent.h,
          transform: `translate(${cameraView.x}px, ${cameraView.y}px) scale(${cameraView.scale}) translate(${extent.shiftX}px, ${extent.shiftY}px)`,
          transformOrigin: 'top left',
        }}
      >
        <svg
          style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}
          width={extent.w}
          height={extent.h}
        >
          {layout.edges.map((e) => {
            // Re-clip both straight and hand-routed paths while an endpoint
            // moves. Elbows stay fixed; the node-facing segment follows the
            // live node or group box.
            const morphing =
              (movedEndpoints.has(e.edge.from) || movedEndpoints.has(e.edge.to)) &&
              endpointRects.has(e.edge.from) &&
              endpointRects.has(e.edge.to);
            const points = morphing
              ? waypointPoints(
                  endpointRects.get(e.edge.from)!,
                  endpointRects.get(e.edge.to)!,
                  e.edge.waypoints ?? [],
                )
              : e.points;
            return (
              <ArrowEdge
                key={e.edge.id}
                points={points}
                dashed={e.edge.style === 'dashed'}
                dotted={e.edge.style === 'dotted'}
                arrow={e.edge.arrow}
                label={e.edge.label}
                labelPos={e.edge.labelPos}
                color={e.edge.color}
                draw={appearProgress(e.edge.id)}
                pulse={current.pulse.has(e.edge.id)}
                pulsePhase={pulsePhase}
                highlighted={current.highlight.has(e.edge.id)}
                dimmed={current.dim.has(e.edge.id)}
              />
            );
          })}
        </svg>
        {/* groups sit above the edges so their label chips mask crossing lines */}
        {layout.groups.map((g, i) => {
          const p = appearProgress(g.group.id);
          const box = groupRects[i]!;
          const memberRects = layout.nodes
            .filter((n) => n.node.parent === g.group.id)
            .map((n) => rects.get(n.node.id)!);
          return (
            <GroupBox
              key={g.group.id}
              label={g.group.label}
              labelLeft={g.group.label ? groupLabelLeft(box, memberRects, g.group.label) : undefined}
              variant={g.group.variant}
              dash={g.group.dash}
              width={box.w}
              height={box.h}
              highlighted={current.highlight.has(g.group.id)}
              dimmed={current.dim.has(g.group.id)}
              style={{ position: 'absolute', left: box.x, top: box.y, opacity: p }}
            />
          );
        })}
        {layout.nodes.map((n) => {
          const p = appearProgress(n.node.id);
          const r = rects.get(n.node.id)!;
          return (
            <div
              key={n.node.id}
              style={{
                position: 'absolute',
                left: n.x,
                top: n.y,
                opacity: p,
                transform: `translate(${r.x - n.x}px, ${r.y - n.y + (1 - p) * 14}px)`,
              }}
            >
              <Block
                label={n.node.label}
                tex={n.node.tex}
                kind={n.node.kind}
                variant={n.node.variant}
                shape={n.node.shape}
                math={n.node.math}
                muted={n.node.muted}
                width={n.w}
                height={n.h}
                highlighted={current.highlight.has(n.node.id)}
                dimmed={current.dim.has(n.node.id)}
              />
            </div>
          );
        })}
      </div>
      {unknownIds.length > 0 ? (
        <div
          style={{
            position: 'absolute',
            left: 12,
            bottom: 12,
            background: '#d03b3b',
            color: '#fff',
            fontSize: 22,
            fontFamily: t.fonts.mono,
            padding: '8px 14px',
            borderRadius: 8,
          }}
        >
          stepEffects references unknown ids: {[...new Set(unknownIds)].join(', ')}
        </div>
      ) : null}
    </div>
  );
};
