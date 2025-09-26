import React from "react";
import { MarkerType, Position } from "reactflow";
import type { Node, Edge } from "reactflow";
import { nodeStyles, edgeStyles } from "./styles";
import FlowModalProvider from "./FlowModalProvider";

const nodes: Node[] = [
  {
    id: "patch-sources",
    type: "group",
    position: { x: 20, y: 100 },
    data: { label: "Patch Sources" },
    style: {
      background: "rgba(107, 114, 128, 0.05)",
      border: "1px dashed #6B7280",
      borderRadius: "0.75rem",
      padding: "16px",
      fontSize: "11px",
      fontWeight: 600,
      color: "#6B7280",
      width: 200,
      height: 250,
    },
  },
  {
    id: "patch-pkg",
    position: { x: 20, y: 40 },
    data: { label: "patch-package" },
    parentNode: "patch-sources",
    extent: "parent",
    sourcePosition: Position.Right,
    style: { ...nodeStyles.info, width: "150px", height: "50px" },
  },
  {
    id: "manual",
    position: { x: 20, y: 100 },
    data: { label: "Manual patches" },
    parentNode: "patch-sources",
    extent: "parent",
    sourcePosition: Position.Right,
    style: { ...nodeStyles.default, width: "150px", height: "50px" },
  },
  {
    id: "generated",
    position: { x: 20, y: 160 },
    data: {
      label: (
        <div style={{ textAlign: "center" }}>
          <div style={{ fontWeight: 600 }}>Generated</div>
          <div style={{ fontSize: "11px", opacity: 0.8, marginTop: "2px" }}>
            patches
          </div>
        </div>
      ),
    },
    parentNode: "patch-sources",
    extent: "parent",
    sourcePosition: Position.Right,
    style: { ...nodeStyles.default, width: "150px", height: "65px", paddingBottom: "8px" },
  },
  {
    id: "patch-files-group",
    type: "group",
    position: { x: 260, y: 120 },
    data: { label: "Patch Files" },
    style: {
      background: "rgba(107, 114, 128, 0.05)",
      border: "1px dashed #6B7280",
      borderRadius: "0.75rem",
      padding: "16px",
      fontSize: "11px",
      fontWeight: 600,
      color: "#6B7280",
      width: 180,
      height: 170,
    },
  },
  {
    id: "patch-dir",
    position: { x: 20, y: 40 },
    data: { label: "patches/" },
    parentNode: "patch-files-group",
    extent: "parent",
    sourcePosition: Position.Right,
    targetPosition: Position.Left,
    style: { ...nodeStyles.warning, width: "140px", height: "50px" },
  },
  {
    id: "patch-files",
    position: { x: 20, y: 100 },
    data: { label: "*.patch files" },
    parentNode: "patch-files-group",
    extent: "parent",
    sourcePosition: Position.Right,
    targetPosition: Position.Top,
    style: { ...nodeStyles.default, width: "140px", height: "50px" },
  },
  {
    id: "pastoralist-track",
    type: "group",
    position: { x: 480, y: 80 },
    data: { label: "Pastoralist Tracking" },
    style: {
      background: "rgba(107, 114, 128, 0.05)",
      border: "1px dashed #6B7280",
      borderRadius: "0.75rem",
      padding: "16px",
      fontSize: "11px",
      fontWeight: 600,
      color: "#6B7280",
      width: 200,
      height: 250,
    },
  },
  {
    id: "detect-patches",
    position: { x: 20, y: 40 },
    data: { label: "Detect patches" },
    parentNode: "pastoralist-track",
    extent: "parent",
    sourcePosition: Position.Right,
    targetPosition: Position.Left,
    style: { ...nodeStyles.info, width: "150px", height: "50px" },
  },
  {
    id: "link-patches",
    position: { x: 20, y: 100 },
    data: {
      label: (
        <div style={{ textAlign: "center" }}>
          <div style={{ fontWeight: 600 }}>Link to</div>
          <div style={{ fontSize: "11px", opacity: 0.8, marginTop: "2px" }}>
            dependencies
          </div>
        </div>
      ),
    },
    parentNode: "pastoralist-track",
    extent: "parent",
    sourcePosition: Position.Right,
    targetPosition: Position.Top,
    style: { ...nodeStyles.process, width: "150px", height: "65px", paddingBottom: "8px" },
  },
  {
    id: "track-usage",
    position: { x: 20, y: 170 },
    data: { label: "Track usage" },
    parentNode: "pastoralist-track",
    extent: "parent",
    sourcePosition: Position.Right,
    targetPosition: Position.Top,
    style: { ...nodeStyles.success, width: "150px", height: "50px" },
  },
  {
    id: "appendix-group",
    type: "group",
    position: { x: 720, y: 100 },
    data: { label: "Appendix" },
    style: {
      background: "rgba(107, 114, 128, 0.05)",
      border: "1px dashed #6B7280",
      borderRadius: "0.75rem",
      padding: "16px",
      fontSize: "11px",
      fontWeight: 600,
      color: "#6B7280",
      width: 200,
      height: 210,
    },
  },
  {
    id: "appendix-entry",
    position: { x: 20, y: 40 },
    data: { label: "Package entry" },
    parentNode: "appendix-group",
    extent: "parent",
    sourcePosition: Position.Bottom,
    targetPosition: Position.Left,
    style: { ...nodeStyles.special, width: "150px", height: "50px" },
  },
  {
    id: "patch-ref",
    position: { x: 20, y: 100 },
    data: { label: "Patch references" },
    parentNode: "appendix-group",
    extent: "parent",
    targetPosition: Position.Top,
    style: { ...nodeStyles.output, width: "150px", height: "50px" },
  },
  {
    id: "dependents",
    position: { x: 20, y: 155 },
    data: { label: "Dependent packages" },
    parentNode: "appendix-group",
    extent: "parent",
    targetPosition: Position.Top,
    style: { ...nodeStyles.output, width: "150px", height: "50px" },
  },
];

const edges: Edge[] = [
  {
    id: "pkg-dir",
    source: "patch-pkg",
    target: "patch-dir",
    type: "smoothstep",
    style: edgeStyles.default,
  },
  {
    id: "manual-dir",
    source: "manual",
    target: "patch-dir",
    type: "smoothstep",
    style: edgeStyles.default,
  },
  {
    id: "generated-dir",
    source: "generated",
    target: "patch-dir",
    type: "smoothstep",
    style: edgeStyles.default,
  },
  {
    id: "dir-files",
    source: "patch-dir",
    target: "patch-files",
    type: "smoothstep",
    style: edgeStyles.default,
  },
  {
    id: "files-detect",
    source: "patch-files",
    target: "detect-patches",
    type: "smoothstep",
    style: edgeStyles.default,
  },
  {
    id: "detect-link",
    source: "detect-patches",
    target: "link-patches",
    type: "smoothstep",
    style: edgeStyles.default,
  },
  {
    id: "link-track",
    source: "link-patches",
    target: "track-usage",
    type: "smoothstep",
    style: edgeStyles.default,
  },
  {
    id: "track-appendix",
    source: "track-usage",
    target: "appendix-entry",
    type: "smoothstep",
    style: edgeStyles.default,
  },
  {
    id: "appendix-ref",
    source: "appendix-entry",
    target: "patch-ref",
    type: "smoothstep",
    style: edgeStyles.default,
  },
  {
    id: "appendix-deps",
    source: "appendix-entry",
    target: "dependents",
    type: "smoothstep",
    style: edgeStyles.default,
  },
];

const PatchManagementArchitecture: React.FC = () => {
  return <FlowModalProvider nodes={nodes} edges={edges} title="Patch Management Architecture" />;
};

export default PatchManagementArchitecture;