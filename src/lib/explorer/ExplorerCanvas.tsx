import React, { useEffect, useMemo, useState } from 'react';
import {
  Background,
  BackgroundVariant,
  BaseEdge,
  Handle,
  MarkerType,
  MiniMap,
  Position,
  ReactFlow,
  ReactFlowProvider,
  getSmoothStepPath,
  useReactFlow,
  type Edge as RFEdge,
  type EdgeProps,
  type Node as RFNode,
  type NodeProps,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import type { Diagram, NodeShape } from '../diagram/schema';
import { groupLabelLeft, layoutDiagram } from '../diagram/layout';
import { resolveColor, useTheme } from '../theme';
import { Block } from '../kit/diagram/Block';
import { roundedPath } from '../kit/diagram/ArrowEdge';
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
        borderRadius: t.radius.sm,
        boxShadow:
          d.hasDetail && hover
            ? `0 0 0 4px ${t.palette.colors.accent}, 0 0 30px ${t.palette.colors.accent}88`
            : d.hasDetail
              ? `0 0 0 3px ${t.palette.colors.accentSoft}`
              : 'none',
        transition: 'box-shadow 120ms ease',
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
        borderRadius: t.radius.lg,
        boxShadow:
          d.hasDetail && hover ? `0 0 0 4px ${t.palette.colors.accent}` : 'none',
        transition: 'box-shadow 120ms ease',
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

/**
 * Smoothstep edge with an intelligently placed label: React Flow's default
 * anchors labels at the path midpoint, which for fan-outs is the shared
 * corridor segment — every label lands on the same line. Instead the label
 * sits beside the segment that enters the target, just above the arrowhead,
 * which is unique per edge and always clear of the corridor.
 *
 * A hand-routed diagram supplies its own polyline (`data.points`, in the same
 * coordinate space React Flow lays nodes out in) — then the explorer traces
 * exactly the route DiagramView renders, instead of re-deriving one.
 */
const KitEdge: React.FC<EdgeProps> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style,
  markerEnd,
  data,
}) => {
  const t = useTheme();
  const d = data as { label?: string; points?: { x: number; y: number }[] } | undefined;
  const baked = d?.points;
  const [smooth] = getSmoothStepPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    borderRadius: 10,
  });
  const path = baked && baked.length >= 2 ? roundedPath(baked) : smooth;
  const label = d?.label;

  let lx = 0;
  let ly = 0;
  let anchor: 'start' | 'middle' | 'end' = 'start';
  if (baked && baked.length >= 2) {
    // beside the final approach segment, offset along its normal
    const end = baked[baked.length - 1]!;
    const prev = baked[baked.length - 2]!;
    const len = Math.hypot(end.x - prev.x, end.y - prev.y) || 1;
    const ux = (end.x - prev.x) / len;
    const uy = (end.y - prev.y) / len;
    const back = Math.min(len * 0.45, 26);
    lx = end.x - ux * back - uy * 14;
    ly = end.y - uy * back + ux * 14 + 6;
    anchor = 'middle';
  } else if (targetPosition === Position.Top) {
    // final approach is vertical at targetX — label to its right, just above the
    // arrowhead (below a parent group's top border, which sits 44px above members)
    const run = Math.max(0, targetY - (sourceY + targetY) / 2);
    const d = Math.min(24, Math.max(14, run * 0.4));
    lx = targetX + 11;
    ly = targetY - d;
  } else if (targetPosition === Position.Left) {
    // final approach is horizontal at targetY — label above it, before the arrowhead
    const run = Math.max(0, targetX - (sourceX + targetX) / 2);
    const d = Math.min(34, Math.max(18, run * 0.45));
    lx = targetX - d;
    ly = targetY - 11;
    anchor = 'end';
  } else if (targetPosition === Position.Bottom) {
    lx = targetX + 11;
    ly = targetY + 32;
  } else {
    lx = targetX + 32;
    ly = targetY - 11;
  }

  return (
    <>
      <BaseEdge id={id} path={path} style={style} markerEnd={markerEnd} />
      {label ? (
        <text
          x={lx}
          y={ly}
          textAnchor={anchor}
          style={{
            fontSize: 17,
            fontWeight: 500,
            fontFamily: t.fonts.sans,
            fill: t.palette.colors.textSecondary,
            stroke: t.palette.colors.bg,
            strokeWidth: 6,
            paintOrder: 'stroke',
          }}
        >
          {label}
        </text>
      ) : null}
    </>
  );
};

const nodeTypes = { kitBlock: BlockNode, kitGroup: GroupNode };
const edgeTypes = { kitEdge: KitEdge };

const Inner: React.FC<ExplorerCanvasProps> = ({
  diagram,
  details,
  visited,
  onOpen,
  openRequest,
  resetRequest,
}) => {
  const t = useTheme();
  const rf = useReactFlow();
  const layout = useMemo(() => layoutDiagram(diagram), [diagram]);

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
        hasDetail: g.group.id in details,
        visited: visited.has(g.group.id),
      } satisfies GroupNodeData,
    }));
    const blocks: RFNode[] = layout.nodes.map((n) => ({
      id: n.node.id,
      type: 'kitBlock',
      position: { x: n.x, y: n.y },
      draggable: false,
      connectable: false,
      selectable: false,
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
        hasDetail: n.node.id in details,
        visited: visited.has(n.node.id),
        direction: diagram.direction,
      } satisfies BlockNodeData,
    }));
    return [...groups, ...blocks];
  }, [layout, details, visited, diagram.direction]);

  const edges = useMemo<RFEdge[]>(
    () =>
      layout.edges.map(({ edge: e, points }) => {
        const stroke = resolveColor(t, e.color, t.palette.colors.line);
        return {
          id: e.id,
          source: e.from,
          target: e.to,
          type: 'kitEdge',
          // hand-routed diagrams ship their polyline; auto-layout ones let React Flow route
          data: { label: e.label, points: e.waypoints?.length ? points : undefined },
          style: {
            stroke,
            strokeWidth: 2,
            strokeDasharray: e.style === 'dashed' ? '8 6' : e.style === 'dotted' ? '2 7' : undefined,
            strokeLinecap: e.style === 'dotted' ? ('round' as const) : undefined,
          },
          markerEnd: e.arrow
            ? { type: MarkerType.ArrowClosed, width: 18, height: 18, color: stroke }
            : undefined,
        };
      }),
    [layout, t],
  );

  const zoomThenOpen = (id: string) => {
    rf.fitView({ nodes: [{ id }], duration: 550, padding: 0.9, maxZoom: 1.35 });
    window.setTimeout(() => onOpen(id), 590);
  };

  useEffect(() => {
    if (openRequest) zoomThenOpen(openRequest.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openRequest?.nonce]);

  useEffect(() => {
    if (resetRequest !== undefined) {
      rf.fitView({ duration: 450, padding: 0.12 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetRequest]);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      fitView
      fitViewOptions={{ padding: 0.12, maxZoom: 1.05 }}
      minZoom={0.2}
      maxZoom={2.5}
      onNodeClick={(_, node) => {
        if (node.id in details) zoomThenOpen(node.id);
      }}
      nodesDraggable={false}
      nodesConnectable={false}
      elementsSelectable={false}
      zoomOnDoubleClick={false}
      style={{ background: t.palette.colors.bg }}
    >
      <Background variant={BackgroundVariant.Dots} color={t.palette.colors.grid} gap={28} size={2} />
      <MiniMap
        style={{ background: t.palette.colors.surface }}
        maskColor="rgba(8, 8, 8, 0.78)"
        nodeColor={() => t.palette.colors.surfaceAlt}
        pannable
        zoomable
      />
    </ReactFlow>
  );
};

export const ExplorerCanvas: React.FC<ExplorerCanvasProps> = (props) => (
  <ReactFlowProvider>
    <Inner {...props} />
  </ReactFlowProvider>
);
