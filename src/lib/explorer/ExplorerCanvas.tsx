import React, { useEffect, useMemo, useState } from 'react';
import {
  Background,
  BackgroundVariant,
  Handle,
  MarkerType,
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
import type { Diagram } from '../diagram/schema';
import { layoutDiagram } from '../diagram/layout';
import { useTheme } from '../theme';
import { Block } from '../kit/diagram/Block';
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
  w: number;
  h: number;
  hasDetail: boolean;
  visited: boolean;
  direction: 'TB' | 'LR';
};

type GroupNodeData = {
  label?: string;
  variant: string;
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
        borderRadius: d.kind === 'io' ? 999 : t.radius.md,
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
      <Block label={d.label} tex={d.tex} kind={d.kind} variant={d.variant} width={d.w} height={d.h} />
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
      <GroupBox label={d.label} variant={d.variant} width={d.w} height={d.h} />
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
      zIndex: -1,
      draggable: false,
      connectable: false,
      selectable: false,
      data: {
        label: g.group.label,
        variant: g.group.variant,
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
      diagram.edges.map((e) => ({
        id: e.id,
        source: e.from,
        target: e.to,
        type: 'smoothstep',
        label: e.label,
        labelStyle: { fill: t.palette.colors.textSecondary, fontSize: 15, fontFamily: t.fonts.sans },
        labelBgStyle: { fill: t.palette.colors.bg, fillOpacity: 0.9 },
        style: {
          stroke: e.color ?? '#8a8a84',
          strokeWidth: 2.5,
          strokeDasharray: e.style === 'dashed' ? '8 6' : undefined,
        },
        markerEnd: { type: MarkerType.ArrowClosed, width: 20, height: 20, color: e.color ?? '#8a8a84' },
      })),
    [diagram, t],
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
        maskColor="rgba(13, 13, 13, 0.75)"
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
