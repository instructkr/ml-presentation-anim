import React from 'react';
import type { EdgeProps } from '@xyflow/react';
import { ArrowEdge } from './ArrowEdge';

/** Geometry passed from the diagram layout into React Flow. */
export interface DiagramFlowEdgeData extends Record<string, unknown> {
  points: { x: number; y: number }[];
  label?: string;
  labelPos?: number;
  color?: string;
  dashed?: boolean;
  dotted?: boolean;
  arrow?: boolean;
  strokeWidth?: number;
}

/**
 * React Flow adapter around the same ArrowEdge used by DiagramView.
 *
 * React Flow normally derives a new path from static node handles. That is
 * wrong for architecture diagrams: a TB graph may contain upward edges,
 * hand-routed rails may enter any face, and Dagre already computed the path.
 */
export const DiagramFlowEdge: React.FC<EdgeProps> = ({ sourceX, sourceY, targetX, targetY, data }) => {
  const d = data as DiagramFlowEdgeData | undefined;
  const points = d && d.points.length >= 2
    ? d.points
    : [{ x: sourceX, y: sourceY }, { x: targetX, y: targetY }];

  return (
    <ArrowEdge
      points={points}
      label={d?.label}
      labelPos={d?.labelPos}
      color={d?.color}
      dashed={d?.dashed}
      dotted={d?.dotted}
      arrow={d?.arrow}
      strokeWidth={d?.strokeWidth}
    />
  );
};
