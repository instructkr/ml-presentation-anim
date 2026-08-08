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
  /** ids kept visually active (used by the persistent architecture rail) */
  activeIds?: string[];
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
        opacity: d.defocused ? 0.32 : 1,
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
        opacity: d.defocused ? 0.32 : 1,
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
        hasDetail: interactive && n.node.id in details,
        visited: visited.has(n.node.id),
        active: active.has(n.node.id),
        defocused: transitionFocus !== null && transitionFocus !== n.node.id,
        direction: diagram.direction,
      } satisfies BlockNodeData,
    }));
    return [...groups, ...blocks];
  }, [layout, details, visited, diagram.direction, interactive, active, transitionFocus]);

  const edges = useMemo<RFEdge[]>(
    () =>
      layout.edges.map(({ edge: e, points }) => {
        const stroke = resolveColor(t, e.color, t.palette.colors.line);
        return {
          id: e.id,
          source: e.from,
          target: e.to,
          type: 'kitEdge',
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
    [layout, t],
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
        if (interactive && node.id in details) zoomThenOpen(node.id);
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
