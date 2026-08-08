import React, { useEffect, useMemo } from 'react';
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
  type NodeChange,
  type NodeProps,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import type { Diagram, NodeShape } from '@/lib/diagram/schema';
import { groupLabelLeft, layoutDiagram, waypointPoints, type Rect } from '@/lib/diagram/layout';
import { Block } from '@/lib/kit/diagram/Block';
import { DiagramFlowEdge } from '@/lib/kit/diagram/DiagramFlowEdge';
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
  /** positions changed in the GUI, so routes must follow the live boxes */
  routeFromNodes: boolean;
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
  direction: 'TB' | 'LR';
};

type GroupNodeData = {
  label?: string;
  labelLeft?: number;
  variant: string;
  dash: 'dashed' | 'dotted';
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
    </div>
  );
};

const GroupNode: React.FC<NodeProps> = ({ data }) => {
  const d = data as GroupNodeData;
  return (
    <div style={{ position: 'relative', pointerEvents: 'none' }}>
      {/* panels can be callout endpoints, so they need handles like any node */}
      <Handle type="target" position={Position.Top} style={{ opacity: 0, pointerEvents: 'none' }} />
      <GroupBox label={d.label} labelLeft={d.labelLeft} variant={d.variant} dash={d.dash} width={d.w} height={d.h} />
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0, pointerEvents: 'none' }} />
    </div>
  );
};

const nodeTypes = { kitBlock: BlockNode, kitGroup: GroupNode };
const edgeTypes = { kitEdge: DiagramFlowEdge };

const Inner: React.FC<EditorCanvasProps> = ({ diagram, boxes, groups, onNodesChange, fitSignal, routeFromNodes }) => {
  const t = useTheme();
  const rf = useReactFlow();

  const nodes = useMemo<RFNode[]>(() => {
    const kindOf = new Map(diagram.nodes.map((n) => [n.id, n]));
    const boxById = new Map(boxes.map((b) => [b.id, b]));
    const groupNodes: RFNode[] = groups.map((g) => ({
      id: g.id,
      type: 'kitGroup',
      position: { x: g.x, y: g.y },
      zIndex: -1,
      draggable: false,
      connectable: false,
      selectable: false,
      data: {
        label: g.label,
        labelLeft: g.label
          ? groupLabelLeft(
              g,
              diagram.nodes
                .filter((n) => n.parent === g.id)
                .map((n) => boxById.get(n.id))
                .filter((b): b is NodeBox => Boolean(b)),
              g.label,
            )
          : undefined,
        variant: g.variant,
        dash: diagram.groups.find((x) => x.id === g.id)?.dash ?? 'dashed',
        w: g.w,
        h: g.h,
      } satisfies GroupNodeData,
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
            shape: node.shape,
            math: node.math,
            muted: node.muted,
            w: b.w,
            h: b.h,
            direction: diagram.direction,
          } satisfies BlockNodeData,
        },
      ];
    });
    return [...groupNodes, ...blockNodes];
  }, [diagram, boxes, groups]);

  const edges = useMemo<RFEdge[]>(() => {
    const layout = layoutDiagram(diagram);
    const laidEdges = new Map(layout.edges.map((e) => [e.edge.id, e.points]));
    const rects = new Map<string, Rect>([
      ...boxes.map((b): [string, Rect] => [b.id, b]),
      ...groups.map((g): [string, Rect] => [g.id, g]),
    ]);
    const manual = diagram.nodes.every((n) => n.position);
    return diagram.edges.map((e) => {
      const a = rects.get(e.from);
      const b = rects.get(e.to);
      const livePoints = a && b ? waypointPoints(a, b, e.waypoints ?? []) : [];
      const points = routeFromNodes || manual ? livePoints : (laidEdges.get(e.id) ?? livePoints);
      return {
        id: e.id,
        source: e.from,
        target: e.to,
        type: 'kitEdge',
        data: {
          points,
          label: e.label,
          labelPos: e.labelPos,
          color: e.color,
          dashed: e.style === 'dashed',
          dotted: e.style === 'dotted',
          arrow: e.arrow,
          strokeWidth: 2.5,
        },
      };
    });
  }, [diagram, boxes, groups, routeFromNodes]);

  useEffect(() => {
    rf.fitView({ padding: 0.14, duration: 400 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fitSignal]);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
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
