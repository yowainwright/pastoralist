import React from "react";
import { MarkerType, Position } from "reactflow";
import type { Node, Edge } from "reactflow";
import { nodeStyles, edgeStyles } from "./styles";
import FlowModalProvider from "./FlowModalProvider";

const nodes: Node[] = [
  {
    id: "project-group",
    type: "group",
    position: { x: 20, y: 50 },
    data: { label: "Project Files" },
    style: {
      background: "rgba(107, 114, 128, 0.05)",
      border: "1px dashed #6B7280",
      borderRadius: "0.75rem",
      padding: "16px",
      fontSize: "11px",
      fontWeight: 600,
      color: "#6B7280",
      width: 220,
      height: 200,
    },
  },
  {
    id: "package-json",
    position: { x: 10, y: 40 },
    data: { label: "package.json" },
    parentNode: "project-group",
    extent: "parent",
    sourcePosition: Position.Right,
    style: { ...nodeStyles.input, width: "180px", height: "40px" },
  },
  {
    id: "overrides",
    position: { x: 10, y: 120 },
    data: { label: "overrides/resolutions" },
    parentNode: "project-group",
    extent: "parent",
    sourcePosition: Position.Right,
    targetPosition: Position.Left,
    style: { ...nodeStyles.special, width: "180px", height: "40px" },
  },
  {
    id: "deps-group",
    type: "group",
    position: { x: 290, y: 20 },
    data: { label: "Dependencies" },
    style: {
      background: "rgba(107, 114, 128, 0.05)",
      border: "1px dashed #6B7280",
      borderRadius: "0.75rem",
      padding: "16px",
      fontSize: "11px",
      fontWeight: 600,
      color: "#6B7280",
      width: 240,
      height: 260,
    },
  },
  {
    id: "direct-deps",
    position: { x: 20, y: 40 },
    data: {
      label: (
        <div style={{ textAlign: "center" }}>
          <div style={{ fontWeight: 600 }}>Direct Dependencies</div>
          <div style={{ fontSize: "11px", opacity: 0.8, marginTop: "2px" }}>
            From package.json
          </div>
        </div>
      ),
    },
    parentNode: "deps-group",
    extent: "parent",
    sourcePosition: Position.Bottom,
    targetPosition: Position.Left,
    style: { ...nodeStyles.process, width: "200px", height: "65px", paddingBottom: "8px" },
  },
  {
    id: "transitive-deps",
    position: { x: 20, y: 140 },
    data: {
      label: (
        <div style={{ textAlign: "center" }}>
          <div style={{ fontWeight: 600 }}>Transitive Dependencies</div>
          <div style={{ fontSize: "11px", opacity: 0.8, marginTop: "2px" }}>
            Sub-dependencies
          </div>
        </div>
      ),
    },
    parentNode: "deps-group",
    extent: "parent",
    targetPosition: Position.Top,
    style: { ...nodeStyles.process, width: "200px", height: "65px", paddingBottom: "8px" },
  },
  {
    id: "pastoralist-group",
    type: "group",
    position: { x: 290, y: 320 },
    data: { label: "Pastoralist" },
    style: {
      background: "rgba(107, 114, 128, 0.05)",
      border: "1px dashed #6B7280",
      borderRadius: "0.75rem",
      padding: "16px",
      fontSize: "11px",
      fontWeight: 600,
      color: "#6B7280",
      width: 240,
      height: 200,
    },
  },
  {
    id: "appendix",
    position: { x: 20, y: 40 },
    data: {
      label: (
        <div style={{ textAlign: "center" }}>
          <div style={{ fontWeight: 600 }}>pastoralist.appendix</div>
          <div style={{ fontSize: "11px", opacity: 0.8, marginTop: "2px" }}>
            Tracking metadata
          </div>
        </div>
      ),
    },
    parentNode: "pastoralist-group",
    extent: "parent",
    sourcePosition: Position.Bottom,
    targetPosition: Position.Left,
    style: { ...nodeStyles.info, width: "200px", height: "65px", paddingBottom: "8px" },
  },
  {
    id: "tracking",
    position: { x: 20, y: 120 },
    data: { label: "Tracking & Documentation" },
    parentNode: "pastoralist-group",
    extent: "parent",
    targetPosition: Position.Top,
    style: { ...nodeStyles.output, width: "200px", height: "40px" },
  },
];

const edges: Edge[] = [
  {
    id: "pkg-direct",
    source: "package-json",
    target: "direct-deps",
    type: "smoothstep",
    style: edgeStyles.default,
  },
  {
    id: "direct-transitive",
    source: "direct-deps",
    target: "transitive-deps",
    type: "smoothstep",
    style: edgeStyles.default,
  },
  {
    id: "overrides-transitive",
    source: "overrides",
    target: "transitive-deps",
    type: "smoothstep",
    label: "Forces version",
    labelStyle: { fontSize: 12, fontWeight: 500 },
    style: edgeStyles.dashed,
    animated: true,
  },
  {
    id: "overrides-appendix",
    source: "overrides",
    target: "appendix",
    type: "smoothstep",
    style: edgeStyles.animated,
  },
  {
    id: "appendix-tracking",
    source: "appendix",
    target: "tracking",
    type: "smoothstep",
    style: edgeStyles.default,
  },
  {
    id: "tracking-overrides",
    source: "tracking",
    target: "overrides",
    type: "smoothstep",
    label: "Removes if unused",
    labelStyle: { fontSize: 12, fontWeight: 500 },
    style: edgeStyles.dashed,
    animated: true,
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: edgeStyles.dashed.stroke,
    },
  },
];

const SimpleProjectArchitecture: React.FC = () => {
  return <FlowModalProvider nodes={nodes} edges={edges} title="Simple Project Architecture" />;
};

export default SimpleProjectArchitecture;