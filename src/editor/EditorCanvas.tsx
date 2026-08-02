import React, { useEffect, useMemo } from 'react';
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
  type NodeChange,
  type NodeProps,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import type { Diagram } from '@/lib/diagram/schema';
import { Block } from '@/lib/kit/diagram/Block';
import { GroupBox } from '@/lib/kit/diagram/GroupBox';
import { useTheme } from '@/lib/theme';
import type { GroupRect, NodeBox } from './geometry';

export interface EditorCanvasProps {
  diagram: Diagram;
  boxes: NodeBox[];
  groups: GroupRect[];
  onNodesChange: (changes: NodeChange[]) => void;
  /** bump to re-fit the viewport (diagram switch / auto-layout) */
  fitSignal: number;
}

type BlockNodeData = {
  label: string;
  tex?: string;
  kind: 'block' | 'op' | 'io' | 'annotation';
  variant: string;
  w: number;
  h: number;
  direction: 'TB' | 'LR';
};

type GroupNodeData = {
  label?: string;
  variant: string;
  w: number;
  h: number;
};

/** Same visual as the explorer's node, minus the detail badge, plus a drag cursor. */
const BlockNode: React.FC<NodeProps> = ({ data, selected }) => {
  const d = data as BlockNodeData;
  const t = useTheme();
  const targetPos = d.direction === 'LR' ? Position.Left : Position.Top;
  const sourcePos = d.direction === 'LR' ? Position.Right : Position.Bottom;
  return (
    <div
      style={{
        position: 'relative',
        cursor: 'grab',
        borderRadius: d.kind === 'io' ? 999 : t.radius.md,
        boxShadow: selected ? `0 0 0 3px ${t.palette.colors.accent}` : 'none',
      }}
    >
      <Handle type="target" position={targetPos} style={{ opacity: 0, pointerEvents: 'none' }} />
      <Block label={d.label} tex={d.tex} kind={d.kind} variant={d.variant} width={d.w} height={d.h} />
      <Handle type="source" position={sourcePos} style={{ opacity: 0, pointerEvents: 'none' }} />
    </div>
  );
};

const GroupNode: React.FC<NodeProps> = ({ data }) => {
  const d = data as GroupNodeData;
  return (
    <div style={{ position: 'relative', pointerEvents: 'none' }}>
      <GroupBox label={d.label} variant={d.variant} width={d.w} height={d.h} />
    </div>
  );
};

const nodeTypes = { kitBlock: BlockNode, kitGroup: GroupNode };

const Inner: React.FC<EditorCanvasProps> = ({ diagram, boxes, groups, onNodesChange, fitSignal }) => {
  const t = useTheme();
  const rf = useReactFlow();

  const nodes = useMemo<RFNode[]>(() => {
    const kindOf = new Map(diagram.nodes.map((n) => [n.id, n]));
    const groupNodes: RFNode[] = groups.map((g) => ({
      id: g.id,
      type: 'kitGroup',
      position: { x: g.x, y: g.y },
      zIndex: -1,
      draggable: false,
      connectable: false,
      selectable: false,
      data: { label: g.label, variant: g.variant, w: g.w, h: g.h } satisfies GroupNodeData,
    }));
    const blockNodes: RFNode[] = boxes.flatMap((b) => {
      const node = kindOf.get(b.id);
      if (!node) return [];
      return [
        {
          id: b.id,
          type: 'kitBlock',
          position: { x: b.x, y: b.y },
          draggable: true,
          connectable: false,
          data: {
            label: node.label,
            tex: node.tex,
            kind: node.kind,
            variant: node.variant,
            w: b.w,
            h: b.h,
            direction: diagram.direction,
          } satisfies BlockNodeData,
        },
      ];
    });
    return [...groupNodes, ...blockNodes];
  }, [diagram, boxes, groups]);

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

  useEffect(() => {
    rf.fitView({ padding: 0.14, duration: 400 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fitSignal]);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      onNodesChange={onNodesChange}
      fitView
      fitViewOptions={{ padding: 0.14, maxZoom: 1.05 }}
      minZoom={0.15}
      maxZoom={2.5}
      nodesDraggable
      nodesConnectable={false}
      zoomOnDoubleClick={false}
      selectNodesOnDrag={false}
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

export const EditorCanvas: React.FC<EditorCanvasProps> = (props) => (
  <ReactFlowProvider>
    <Inner {...props} />
  </ReactFlowProvider>
);
