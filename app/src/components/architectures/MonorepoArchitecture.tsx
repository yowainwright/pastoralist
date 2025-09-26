import React from "react";
import { MarkerType, Position } from "reactflow";
import type { Node, Edge } from "reactflow";
import { nodeStyles, edgeStyles } from "./styles";
import FlowModalProvider from "./FlowModalProvider";

const nodes: Node[] = [
  {
    id: "root-group",
    type: "group",
    position: { x: 225, y: 20 },
    data: { label: "Root Level" },
    style: {
      background: "rgba(107, 114, 128, 0.05)",
      border: "1px dashed #6B7280",
      borderRadius: "0.75rem",
      padding: "16px",
      fontSize: "11px",
      fontWeight: 600,
      color: "#6B7280",
      width: 250,
      height: 150,
    },
  },
  {
    id: "root-pkg",
    position: { x: 25, y: 40 },
    data: { label: "Root package.json" },
    parentNode: "root-group",
    extent: "parent",
    sourcePosition: Position.Bottom,
    style: { ...nodeStyles.input, width: "200px", height: "40px" },
  },
  {
    id: "global-overrides",
    position: { x: 25, y: 90 },
    data: { label: "Global Overrides" },
    parentNode: "root-group",
    extent: "parent",
    sourcePosition: Position.Bottom,
    targetPosition: Position.Top,
    style: { ...nodeStyles.special, width: "200px", height: "40px" },
  },
  {
    id: "workspace-a",
    type: "group",
    position: { x: 20, y: 200 },
    data: { label: "Workspace A" },
    style: {
      background: "rgba(107, 114, 128, 0.05)",
      border: "1px dashed #6B7280",
      borderRadius: "0.75rem",
      padding: "16px",
      fontSize: "11px",
      fontWeight: 600,
      color: "#6B7280",
      width: 200,
      height: 200,
    },
  },
  {
    id: "pkg-a",
    position: { x: 10, y: 40 },
    data: {
      label: (
        <div style={{ textAlign: "center" }}>
          <div style={{ fontWeight: 600 }}>packages/app-a</div>
          <div style={{ fontSize: "11px", opacity: 0.8, marginTop: "2px" }}>
            package.json
          </div>
        </div>
      ),
    },
    parentNode: "workspace-a",
    extent: "parent",
    sourcePosition: Position.Bottom,
    targetPosition: Position.Top,
    style: { ...nodeStyles.process, width: "170px", height: "70px", paddingBottom: "8px" },
  },
  {
    id: "deps-a",
    position: { x: 10, y: 130 },
    data: { label: "Dependencies" },
    parentNode: "workspace-a",
    extent: "parent",
    sourcePosition: Position.Bottom,
    targetPosition: Position.Top,
    style: { ...nodeStyles.default, width: "170px", height: "40px" },
  },
  {
    id: "workspace-b",
    type: "group",
    position: { x: 250, y: 200 },
    data: { label: "Workspace B" },
    style: {
      background: "rgba(107, 114, 128, 0.05)",
      border: "1px dashed #6B7280",
      borderRadius: "0.75rem",
      padding: "16px",
      fontSize: "11px",
      fontWeight: 600,
      color: "#6B7280",
      width: 200,
      height: 200,
    },
  },
  {
    id: "pkg-b",
    position: { x: 10, y: 40 },
    data: {
      label: (
        <div style={{ textAlign: "center" }}>
          <div style={{ fontWeight: 600 }}>packages/app-b</div>
          <div style={{ fontSize: "11px", opacity: 0.8, marginTop: "2px" }}>
            package.json
          </div>
        </div>
      ),
    },
    parentNode: "workspace-b",
    extent: "parent",
    sourcePosition: Position.Bottom,
    targetPosition: Position.Top,
    style: { ...nodeStyles.process, width: "170px", height: "70px", paddingBottom: "8px" },
  },
  {
    id: "deps-b",
    position: { x: 10, y: 130 },
    data: { label: "Dependencies" },
    parentNode: "workspace-b",
    extent: "parent",
    sourcePosition: Position.Bottom,
    targetPosition: Position.Top,
    style: { ...nodeStyles.default, width: "170px", height: "40px" },
  },
  {
    id: "workspace-c",
    type: "group",
    position: { x: 480, y: 200 },
    data: { label: "Workspace C" },
    style: {
      background: "rgba(107, 114, 128, 0.05)",
      border: "1px dashed #6B7280",
      borderRadius: "0.75rem",
      padding: "16px",
      fontSize: "11px",
      fontWeight: 600,
      color: "#6B7280",
      width: 200,
      height: 200,
    },
  },
  {
    id: "pkg-c",
    position: { x: 10, y: 40 },
    data: {
      label: (
        <div style={{ textAlign: "center" }}>
          <div style={{ fontWeight: 600 }}>packages/lib</div>
          <div style={{ fontSize: "11px", opacity: 0.8, marginTop: "2px" }}>
            package.json
          </div>
        </div>
      ),
    },
    parentNode: "workspace-c",
    extent: "parent",
    sourcePosition: Position.Bottom,
    targetPosition: Position.Top,
    style: { ...nodeStyles.process, width: "170px", height: "70px", paddingBottom: "8px" },
  },
  {
    id: "deps-c",
    position: { x: 10, y: 130 },
    data: { label: "Dependencies" },
    parentNode: "workspace-c",
    extent: "parent",
    sourcePosition: Position.Bottom,
    targetPosition: Position.Top,
    style: { ...nodeStyles.default, width: "170px", height: "40px" },
  },
  {
    id: "tracking-group",
    type: "group",
    position: { x: 225, y: 430 },
    data: { label: "Pastoralist Tracking" },
    style: {
      background: "rgba(107, 114, 128, 0.05)",
      border: "1px dashed #6B7280",
      borderRadius: "0.75rem",
      padding: "16px",
      fontSize: "11px",
      fontWeight: 600,
      color: "#6B7280",
      width: 350,
      height: 200,
    },
  },
  {
    id: "override-paths",
    position: { x: 25, y: 40 },
    data: { label: "overridePaths" },
    parentNode: "tracking-group",
    extent: "parent",
    targetPosition: Position.Bottom,
    style: { ...nodeStyles.info, width: "300px", height: "50px" },
  },
  {
    id: "appendix-a",
    position: { x: 10, y: 120 },
    data: { label: "Appendix for app-a" },
    parentNode: "tracking-group",
    extent: "parent",
    sourcePosition: Position.Top,
    targetPosition: Position.Top,
    style: { ...nodeStyles.output, width: "90px", height: "50px", fontSize: "11px" },
  },
  {
    id: "appendix-b",
    position: { x: 120, y: 120 },
    data: { label: "Appendix for app-b" },
    parentNode: "tracking-group",
    extent: "parent",
    sourcePosition: Position.Top,
    targetPosition: Position.Top,
    style: { ...nodeStyles.output, width: "90px", height: "50px", fontSize: "11px" },
  },
  {
    id: "appendix-c",
    position: { x: 230, y: 120 },
    data: { label: "Appendix for lib" },
    parentNode: "tracking-group",
    extent: "parent",
    sourcePosition: Position.Top,
    targetPosition: Position.Top,
    style: { ...nodeStyles.output, width: "90px", height: "50px", fontSize: "11px" },
  },
];

const edges: Edge[] = [
  {
    id: "root-overrides",
    source: "root-pkg",
    target: "global-overrides",
    type: "straight",
    style: edgeStyles.default,
  },
  {
    id: "overrides-pkg-a",
    source: "global-overrides",
    target: "pkg-a",
    type: "smoothstep",
    label: "Applies to",
    labelStyle: { fontSize: 11 },
    style: edgeStyles.dashed,
    animated: true,
  },
  {
    id: "overrides-pkg-b",
    source: "global-overrides",
    target: "pkg-b",
    type: "smoothstep",
    label: "Applies to",
    labelStyle: { fontSize: 11 },
    style: edgeStyles.dashed,
    animated: true,
  },
  {
    id: "overrides-pkg-c",
    source: "global-overrides",
    target: "pkg-c",
    type: "smoothstep",
    label: "Applies to",
    labelStyle: { fontSize: 11 },
    style: edgeStyles.dashed,
    animated: true,
  },
  {
    id: "pkg-a-deps",
    source: "pkg-a",
    target: "deps-a",
    type: "straight",
    style: edgeStyles.default,
  },
  {
    id: "pkg-b-deps",
    source: "pkg-b",
    target: "deps-b",
    type: "straight",
    style: edgeStyles.default,
  },
  {
    id: "pkg-c-deps",
    source: "pkg-c",
    target: "deps-c",
    type: "straight",
    style: edgeStyles.default,
  },
  {
    id: "deps-a-appendix",
    source: "deps-a",
    target: "appendix-a",
    type: "smoothstep",
    style: edgeStyles.animated,
  },
  {
    id: "deps-b-appendix",
    source: "deps-b",
    target: "appendix-b",
    type: "smoothstep",
    style: edgeStyles.animated,
  },
  {
    id: "deps-c-appendix",
    source: "deps-c",
    target: "appendix-c",
    type: "smoothstep",
    style: edgeStyles.animated,
  },
  {
    id: "appendix-a-paths",
    source: "appendix-a",
    target: "override-paths",
    type: "smoothstep",
    style: edgeStyles.success,
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: edgeStyles.success.stroke,
    },
  },
  {
    id: "appendix-b-paths",
    source: "appendix-b",
    target: "override-paths",
    type: "smoothstep",
    style: edgeStyles.success,
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: edgeStyles.success.stroke,
    },
  },
  {
    id: "appendix-c-paths",
    source: "appendix-c",
    target: "override-paths",
    type: "smoothstep",
    style: edgeStyles.success,
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: edgeStyles.success.stroke,
    },
  },
];

const MonorepoArchitecture: React.FC = () => {
  return <FlowModalProvider nodes={nodes} edges={edges} title="Monorepo Architecture" />;
};

export default MonorepoArchitecture;