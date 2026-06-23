"use client";

import { getBezierPath, EdgeProps, EdgeLabelRenderer } from 'reactflow';
import { useBriefingStore } from "@/store/useBriefingStore";
import { Zap } from "lucide-react";

export function OAKOCEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data,
}: EdgeProps) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const isAttackPath = data?.isAttackPath;

  const onEdgeClick = (evt: React.MouseEvent) => {
    evt.stopPropagation();

    // Toggle the adversary-route flag in the store; the path styles off `data`.
    useBriefingStore.getState().setEdges((edges) =>
      edges.map((e) =>
        e.id === id
          ? { ...e, data: { ...e.data, isAttackPath: !isAttackPath }, animated: !isAttackPath }
          : e,
      ),
    );
  };

  return (
    <>
      <path
        id={id}
        style={{
          ...style,
          stroke: isAttackPath ? '#ef4444' : 'var(--border-strong)',
          strokeWidth: isAttackPath ? 2.5 : 1.5,
          strokeDasharray: isAttackPath ? '5,5' : 'none',
        }}
        className="react-flow__edge-path transition-all duration-300"
        d={edgePath}
        markerEnd={markerEnd}
      />
      <path
        d={edgePath}
        style={{ strokeWidth: 20, stroke: 'transparent', cursor: 'pointer' }}
        className="react-flow__edge-interaction"
        onClick={onEdgeClick}
      />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
          }}
          className="nodrag nopan"
        >
          <button
            onClick={onEdgeClick}
            className={`flex items-center justify-center w-5 h-5 rounded-full border transition-colors ${
              isAttackPath
                ? 'bg-[#ef4444] border-[#ef4444] text-white'
                : 'bg-[var(--bg-surface)] border-[var(--border-default)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
            title="Toggle adversary route vs. telemetry link"
          >
            <Zap className={`w-3 h-3 ${isAttackPath ? 'fill-current' : ''}`} />
          </button>
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
