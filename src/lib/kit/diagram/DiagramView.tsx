import React, { useMemo } from 'react';
import { Easing, interpolate, useCurrentFrame } from 'remotion';
import type { Diagram } from '../../diagram/schema';
import { layoutDiagram } from '../../diagram/layout';
import { useSceneMeta } from '../../timeline/context';
import { useTheme } from '../../theme';
import { ArrowEdge } from './ArrowEdge';
import { Block } from './Block';
import { GroupBox } from './GroupBox';

export interface StepEffect {
  /** ids become visible at this step and stay visible (cumulative) */
  reveal?: string[];
  /** ids glow while this step is active */
  highlight?: string[];
  /** edge ids get a marching-dash flow while this step is active */
  pulse?: string[];
  /** ids fade back while this step is active; 'others' = everything not otherwise referenced this step */
  dim?: string[] | 'others';
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

  const { revealAt, unknownIds, anyReveals } = useMemo(() => {
    const revealAt = new Map<string, { startFrame: number; order: number }>();
    const unknownIds: string[] = [];
    let anyReveals = false;
    for (const [stepId, fx] of Object.entries(stepEffects ?? {})) {
      const stepMeta = meta.steps.find((s) => s.id === stepId);
      if (!stepMeta) {
        unknownIds.push(`step:${stepId}`);
        continue;
      }
      for (const list of [fx.reveal, fx.highlight, fx.pulse, Array.isArray(fx.dim) ? fx.dim : []]) {
        for (const id of list ?? []) {
          if (!knownIds.has(id)) unknownIds.push(id);
        }
      }
      (fx.reveal ?? []).forEach((id, order) => {
        anyReveals = true;
        if (!revealAt.has(id)) revealAt.set(id, { startFrame: stepMeta.startFrame, order });
      });
    }
    return { revealAt, unknownIds, anyReveals };
  }, [stepEffects, meta, knownIds]);

  const appearProgress = (id: string): number => {
    if (!anyReveals) return 1;
    const at = revealAt.get(id);
    if (!at) return 1;
    const start = at.startFrame + at.order * STAGGER_SECONDS * meta.fps;
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

  const scale = Math.min(width / layout.width, height / layout.height, maxScale);
  const offsetX = (width - layout.width * scale) / 2;
  const offsetY = (height - layout.height * scale) / 2;
  const pulsePhase = (frame % 24) / 24;

  return (
    <div style={{ position: 'relative', width, height }}>
      <div
        style={{
          position: 'absolute',
          left: offsetX,
          top: offsetY,
          width: layout.width,
          height: layout.height,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
        }}
      >
        {layout.groups.map((g) => {
          const p = appearProgress(g.group.id);
          return (
            <GroupBox
              key={g.group.id}
              label={g.group.label}
              variant={g.group.variant}
              width={g.w}
              height={g.h}
              highlighted={current.highlight.has(g.group.id)}
              dimmed={current.dim.has(g.group.id)}
              style={{ position: 'absolute', left: g.x, top: g.y, opacity: p }}
            />
          );
        })}
        <svg
          style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}
          width={layout.width}
          height={layout.height}
        >
          {layout.edges.map((e) => (
            <ArrowEdge
              key={e.edge.id}
              points={e.points}
              dashed={e.edge.style === 'dashed'}
              label={e.edge.label}
              color={e.edge.color}
              draw={appearProgress(e.edge.id)}
              pulse={current.pulse.has(e.edge.id)}
              pulsePhase={pulsePhase}
              highlighted={current.highlight.has(e.edge.id)}
              dimmed={current.dim.has(e.edge.id)}
            />
          ))}
        </svg>
        {layout.nodes.map((n) => {
          const p = appearProgress(n.node.id);
          return (
            <div
              key={n.node.id}
              style={{
                position: 'absolute',
                left: n.x,
                top: n.y,
                opacity: p,
                transform: `translateY(${(1 - p) * 14}px)`,
              }}
            >
              <Block
                label={n.node.label}
                tex={n.node.tex}
                kind={n.node.kind}
                variant={n.node.variant}
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
