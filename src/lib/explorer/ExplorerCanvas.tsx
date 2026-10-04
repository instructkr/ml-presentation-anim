import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Background,
  BackgroundVariant,
  Handle,
  MiniMap,
  Position,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type Edge as RFEdge,
  type Node as RFNode,
  type NodeProps,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import type { Diagram, NodeShape } from '../diagram/schema';
import { groupLabelLeft, layoutDiagram } from '../diagram/layout';
import { resolveColor, useTheme } from '../theme';
import { Block } from '../kit/diagram/Block';
import { DiagramFlowEdge } from '../kit/diagram/DiagramFlowEdge';
import { GroupBox } from '../kit/diagram/GroupBox';
import type { DetailsMap } from './types';

export interface ExplorerCanvasProps {
  diagram: Diagram;
  details: DetailsMap;
  visited: Set<string>;
  onOpen: (nodeId: string) => void;
  /** bump nonce to zoom+open a node programmatically (guided path) */
  openRequest?: { id: string; nonce: number } | null;
  /** bump to reset the viewport (after closing a detail) */
  resetRequest?: number;
  /** ids kept visually active (used by the detail view's rail) */
  activeIds?: string[];
  /**
   * node or group ids the view frames instead of the whole diagram; it glides
   * to a new frame when they change. The rail frames the open module's group.
   */
  frameIds?: string[];
  /**
   * keeps the view parked on this node without animating. The deck passes the
   * open module while a detail covers the canvas, so closing the detail zooms
   * out from where the talk is, wherever it was opened from.
   */
  followId?: string | null;
  /** a click opens the module at once, without the zoom (the rail) */
  instantOpen?: boolean;
  /** disable opening modules while keeping pan/zoom available */
  interactive?: boolean;
  showMiniMap?: boolean;
  showBackground?: boolean;
}

type BlockNodeData = {
  label: string;
  tex?: string;
  kind: 'block' | 'op' | 'io' | 'annotation';
  variant: string;
  shape: NodeShape;
  math: boolean;
  muted: boolean;
  w: number;
  h: number;
  hasDetail: boolean;
  visited: boolean;
  active: boolean;
  defocused: boolean;
  /** outside the framed part of the diagram: kept mounted (and measured) but not drawn */
  hidden: boolean;
  direction: 'TB' | 'LR';
};

type GroupNodeData = {
  label?: string;
  labelLeft?: number;
  variant: string;
  dash: 'dashed' | 'dotted';
  w: number;
  h: number;
  hasDetail: boolean;
  visited: boolean;
  active: boolean;
  defocused: boolean;
  hidden: boolean;
};

const BlockNode: React.FC<NodeProps> = ({ data }) => {
  const d = data as BlockNodeData;
  const t = useTheme();
  const [hover, setHover] = useState(false);
  const targetPos = d.direction === 'LR' ? Position.Left : Position.Top;
  const sourcePos = d.direction === 'LR' ? Position.Right : Position.Bottom;
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        position: 'relative',
        cursor: d.hasDetail ? 'pointer' : 'default',
        opacity: d.hidden ? 0 : d.defocused ? 0.32 : 1,
        transform: d.active ? 'scale(1.035)' : 'scale(1)',
        borderRadius: t.radius.sm,
        boxShadow:
          d.active
            ? `0 0 0 4px ${t.palette.colors.accent}, 0 0 34px ${t.palette.colors.accent}66`
            : d.hasDetail && hover
            ? `0 0 0 4px ${t.palette.colors.accent}, 0 0 30px ${t.palette.colors.accent}88`
            : d.hasDetail
              ? `0 0 0 3px ${t.palette.colors.accentSoft}`
              : 'none',
        transition: 'box-shadow 180ms ease, opacity 220ms ease, transform 220ms ease',
      }}
    >
      <Handle type="target" position={targetPos} style={{ opacity: 0, pointerEvents: 'none' }} />
      <Block
        label={d.label}
        tex={d.tex}
        kind={d.kind}
        variant={d.variant}
        shape={d.shape}
        math={d.math}
        muted={d.muted}
        width={d.w}
        height={d.h}
      />
      <Handle type="source" position={sourcePos} style={{ opacity: 0, pointerEvents: 'none' }} />
      {d.hasDetail ? (
        <div
          style={{
            position: 'absolute',
            top: -12,
            right: -12,
            width: 26,
            height: 26,
            borderRadius: 13,
            background: d.visited ? t.palette.colors.ok : t.palette.colors.accent,
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 17,
            fontWeight: 700,
          }}
        >
          {d.visited ? '✓' : '+'}
        </div>
      ) : null}
    </div>
  );
};

const GroupNode: React.FC<NodeProps> = ({ data }) => {
  const d = data as GroupNodeData;
  const t = useTheme();
  const [hover, setHover] = useState(false);
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        position: 'relative',
        cursor: d.hasDetail ? 'pointer' : 'default',
        opacity: d.hidden ? 0 : d.defocused ? 0.32 : 1,
        transform: d.active ? 'scale(1.015)' : 'scale(1)',
        borderRadius: t.radius.lg,
        boxShadow:
          d.active || (d.hasDetail && hover) ? `0 0 0 4px ${t.palette.colors.accent}` : 'none',
        transition: 'box-shadow 180ms ease, opacity 220ms ease, transform 220ms ease',
      }}
    >
      {/* panels can be callout endpoints, so they need handles like any node */}
      <Handle type="target" position={Position.Top} style={{ opacity: 0, pointerEvents: 'none' }} />
      <GroupBox
        label={d.label}
        labelLeft={d.labelLeft}
        variant={d.variant}
        dash={d.dash}
        width={d.w}
        height={d.h}
      />
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0, pointerEvents: 'none' }} />
      {d.hasDetail ? (
        <div
          style={{
            position: 'absolute',
            top: -12,
            right: -12,
            width: 26,
            height: 26,
            borderRadius: 13,
            background: d.visited ? t.palette.colors.ok : t.palette.colors.accent,
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 17,
            fontWeight: 700,
          }}
        >
          {d.visited ? '✓' : '+'}
        </div>
      ) : null}
    </div>
  );
};

const nodeTypes = { kitBlock: BlockNode, kitGroup: GroupNode };
const edgeTypes = { kitEdge: DiagramFlowEdge };

const Inner: React.FC<ExplorerCanvasProps> = ({
  diagram,
  details,
  visited,
  onOpen,
  openRequest,
  resetRequest,
  activeIds = [],
  frameIds,
  followId,
  instantOpen = false,
  interactive = true,
  showMiniMap = true,
  showBackground = true,
}) => {
  const t = useTheme();
  const rf = useReactFlow();
  const layout = useMemo(() => layoutDiagram(diagram), [diagram]);
  const [transitionFocus, setTransitionFocus] = useState<string | null>(null);
  const openTimerRef = useRef<number | null>(null);
  const active = useMemo(() => new Set([...activeIds, ...(transitionFocus ? [transitionFocus] : [])]), [activeIds, transitionFocus]);

  const frameKey = frameIds?.join('|') ?? '';
  /** ids drawn while a part is framed: everything that overlaps the framed part's bounds (null = all) */
  const framed = useMemo(() => {
    if (!frameKey) return null;
    const ids = new Set(frameKey.split('|'));
    const groups = layout.groups.map((g) => ({ id: g.group.id, x: g.x, y: g.y, w: g.w, h: g.h }));
    const blocks = layout.nodes.map((n) => ({ id: n.node.id, x: n.x, y: n.y, w: n.w, h: n.h }));
    const all = [...groups, ...blocks];
    const part = all.filter((r) => ids.has(r.id));
    if (part.length === 0) return null;
    const x0 = Math.min(...part.map((r) => r.x));
    const y0 = Math.min(...part.map((r) => r.y));
    const x1 = Math.max(...part.map((r) => r.x + r.w));
    const y1 = Math.max(...part.map((r) => r.y + r.h));
    return new Set(
      all.filter((r) => r.x < x1 && r.x + r.w > x0 && r.y < y1 && r.y + r.h > y0).map((r) => r.id),
    );
  }, [frameKey, layout]);
  const isHidden = (id: string) => framed !== null && !framed.has(id);

  useEffect(
    () => () => {
      if (openTimerRef.current !== null) window.clearTimeout(openTimerRef.current);
    },
    [],
  );

  const nodes = useMemo<RFNode[]>(() => {
    const groups: RFNode[] = layout.groups.map((g) => ({
      id: g.group.id,
      type: 'kitGroup',
      position: { x: g.x, y: g.y },
      // above the edge layer (label chip must mask crossing edges); blocks come later in the array, so they stay on top
      zIndex: 0,
      draggable: false,
      connectable: false,
      selectable: false,
      style: isHidden(g.group.id) ? { pointerEvents: 'none' } : undefined,
      data: {
        label: g.group.label,
        labelLeft: g.group.label
          ? groupLabelLeft(
              { x: g.x, y: g.y, w: g.w, h: g.h },
              layout.nodes
                .filter((n) => n.node.parent === g.group.id)
                .map((n) => ({ x: n.x, y: n.y, w: n.w, h: n.h })),
              g.group.label,
            )
          : undefined,
        variant: g.group.variant,
        dash: g.group.dash,
        w: g.w,
        h: g.h,
        hasDetail: interactive && g.group.id in details,
        visited: visited.has(g.group.id),
        active: active.has(g.group.id),
        defocused: transitionFocus !== null && transitionFocus !== g.group.id,
        hidden: isHidden(g.group.id),
      } satisfies GroupNodeData,
    }));
    const blocks: RFNode[] = layout.nodes.map((n) => ({
      id: n.node.id,
      type: 'kitBlock',
      position: { x: n.x, y: n.y },
      draggable: false,
      connectable: false,
      selectable: false,
      style: isHidden(n.node.id) ? { pointerEvents: 'none' } : undefined,
      data: {
        label: n.node.label,
        tex: n.node.tex,
        kind: n.node.kind,
        variant: n.node.variant,
        shape: n.node.shape,
        math: n.node.math,
        muted: n.node.muted,
        w: n.w,
        h: n.h,
        hasDetail: interactive && n.node.id in details,
        visited: visited.has(n.node.id),
        active: active.has(n.node.id),
        defocused: transitionFocus !== null && transitionFocus !== n.node.id,
        hidden: isHidden(n.node.id),
        direction: diagram.direction,
      } satisfies BlockNodeData,
    }));
    return [...groups, ...blocks];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layout, details, visited, diagram.direction, interactive, active, transitionFocus, framed]);

  const edges = useMemo<RFEdge[]>(
    () =>
      layout.edges.map(({ edge: e, points }) => {
        const stroke = resolveColor(t, e.color, t.palette.colors.line);
        return {
          id: e.id,
          source: e.from,
          target: e.to,
          type: 'kitEdge',
          hidden: isHidden(e.from) || isHidden(e.to),
          // Dagre/manual layout owns routing. React Flow is the viewport, not a
          // second edge-layout engine with conflicting fixed handles.
          data: {
            label: e.label,
            labelPos: e.labelPos,
            points,
            color: stroke,
            dashed: e.style === 'dashed',
            dotted: e.style === 'dotted',
            arrow: e.arrow,
            strokeWidth: 2,
          },
        };
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [layout, t, framed],
  );

  const zoomThenOpen = (id: string) => {
    if (!interactive || openTimerRef.current !== null) return;
    setTransitionFocus(id);
    rf.fitView({ nodes: [{ id }], duration: 720, padding: 1.4, maxZoom: 1.18 });
    openTimerRef.current = window.setTimeout(() => {
      openTimerRef.current = null;
      onOpen(id);
    }, 800);
  };

  useEffect(() => {
    if (openRequest) zoomThenOpen(openRequest.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openRequest?.nonce]);

  useEffect(() => {
    if (resetRequest !== undefined) {
      setTransitionFocus(null);
      rf.fitView({ duration: 450, padding: 0.12 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetRequest]);

  useEffect(() => {
    if (!followId) return;
    setTransitionFocus(followId);
    rf.fitView({ nodes: [{ id: followId }], duration: 0, padding: 1.4, maxZoom: 1.18 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [followId]);

  const fitOptions = useMemo(
    () => ({ padding: 0.12, maxZoom: 1.05, nodes: frameKey ? frameKey.split('|').map((id) => ({ id })) : undefined }),
    [frameKey],
  );
  const framedRef = useRef(frameKey);
  useEffect(() => {
    // the first frame is the mount-time fit below; only a change glides
    if (framedRef.current === frameKey) return;
    framedRef.current = frameKey;
    rf.fitView({ ...fitOptions, duration: 450 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frameKey]);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      fitView
      fitViewOptions={fitOptions}
      minZoom={0.2}
      maxZoom={2.5}
      onNodeClick={(_, node) => {
        if (!interactive || !(node.id in details) || isHidden(node.id)) return;
        if (instantOpen) onOpen(node.id);
        else zoomThenOpen(node.id);
      }}
      nodesDraggable={false}
      nodesConnectable={false}
      elementsSelectable={false}
      zoomOnDoubleClick={false}
      style={{ background: t.palette.colors.bg }}
    >
      {showBackground ? (
        <Background variant={BackgroundVariant.Dots} color={t.palette.colors.grid} gap={28} size={2} />
      ) : null}
      {showMiniMap ? (
        <MiniMap
          style={{ background: t.palette.colors.surface }}
          maskColor="rgba(8, 8, 8, 0.78)"
          nodeColor={() => t.palette.colors.surfaceAlt}
          pannable
          zoomable
        />
      ) : null}
    </ReactFlow>
  );
};

export const ExplorerCanvas: React.FC<ExplorerCanvasProps> = (props) => (
  <ReactFlowProvider>
    <Inner {...props} />
  </ReactFlowProvider>
);
