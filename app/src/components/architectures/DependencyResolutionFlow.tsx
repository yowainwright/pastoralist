import React from "react";
import { MarkerType, Position } from "reactflow";
import type { Node, Edge } from "reactflow";
import { nodeStyles, edgeStyles } from "./styles";
import FlowModalProvider from "./FlowModalProvider";

const nodes: Node[] = [
  {
    id: "pkg-install",
    type: "group",
    position: { x: 50, y: 20 },
    data: { label: "Package Installation" },
    style: {
      background: "rgba(107, 114, 128, 0.05)",
      border: "1px dashed #6B7280",
      borderRadius: "0.75rem",
      padding: "16px",
      fontSize: "11px",
      fontWeight: 600,
      color: "#6B7280",
      width: 220,
      height: 250,
    },
  },
  {
    id: "npm-install",
    position: { x: 25, y: 40 },
    data: {
      label: (
        <div style={{ textAlign: "center" }}>
          <div style={{ fontWeight: 600 }}>npm/yarn/pnpm</div>
          <div style={{ fontSize: "11px", opacity: 0.8, marginTop: "2px" }}>
            install
          </div>
        </div>
      ),
    },
    parentNode: "pkg-install",
    extent: "parent",
    sourcePosition: Position.Bottom,
    style: { ...nodeStyles.warning, width: "170px", height: "65px", paddingBottom: "8px" },
  },
  {
    id: "read-pkg",
    position: { x: 25, y: 115 },
    data: {
      label: (
        <div style={{ textAlign: "center" }}>
          <div style={{ fontWeight: 600 }}>Read</div>
          <div style={{ fontSize: "11px", opacity: 0.8, marginTop: "2px" }}>
            package.json
          </div>
        </div>
      ),
    },
    parentNode: "pkg-install",
    extent: "parent",
    sourcePosition: Position.Bottom,
    targetPosition: Position.Top,
    style: { ...nodeStyles.default, width: "170px", height: "65px", paddingBottom: "8px" },
  },
  {
    id: "read-lock",
    position: { x: 25, y: 190 },
    data: {
      label: (
        <div style={{ textAlign: "center" }}>
          <div style={{ fontWeight: 600 }}>Read</div>
          <div style={{ fontSize: "11px", opacity: 0.8, marginTop: "2px" }}>
            lock file
          </div>
        </div>
      ),
    },
    parentNode: "pkg-install",
    extent: "parent",
    sourcePosition: Position.Right,
    targetPosition: Position.Top,
    style: { ...nodeStyles.default, width: "170px", height: "65px", paddingBottom: "8px" },
  },
  {
    id: "resolution-process",
    type: "group",
    position: { x: 320, y: 80 },
    data: { label: "Resolution Process" },
    style: {
      background: "rgba(107, 114, 128, 0.05)",
      border: "1px dashed #6B7280",
      borderRadius: "0.75rem",
      padding: "16px",
      fontSize: "11px",
      fontWeight: 600,
      color: "#6B7280",
      width: 220,
      height: 280,
    },
  },
  {
    id: "normal-res",
    position: { x: 25, y: 40 },
    data: {
      label: (
        <div style={{ textAlign: "center" }}>
          <div style={{ fontWeight: 600 }}>Normal</div>
          <div style={{ fontSize: "11px", opacity: 0.8, marginTop: "2px" }}>
            resolution
          </div>
        </div>
      ),
    },
    parentNode: "resolution-process",
    extent: "parent",
    sourcePosition: Position.Bottom,
    targetPosition: Position.Left,
    style: { ...nodeStyles.process, width: "170px", height: "65px", paddingBottom: "8px" },
  },
  {
    id: "check-overrides",
    position: { x: 25, y: 115 },
    data: {
      label: (
        <div style={{ textAlign: "center" }}>
          <div style={{ fontWeight: 600 }}>Has</div>
          <div style={{ fontSize: "11px", opacity: 0.8, marginTop: "2px" }}>
            overrides?
          </div>
        </div>
      ),
    },
    parentNode: "resolution-process",
    extent: "parent",
    sourcePosition: Position.Bottom,
    targetPosition: Position.Top,
    style: { ...nodeStyles.special, width: "170px", height: "65px", paddingBottom: "8px" },
  },
  {
    id: "apply-overrides",
    position: { x: 25, y: 190 },
    data: {
      label: (
        <div style={{ textAlign: "center" }}>
          <div style={{ fontWeight: 600 }}>Apply</div>
          <div style={{ fontSize: "11px", opacity: 0.8, marginTop: "2px" }}>
            overrides
          </div>
        </div>
      ),
    },
    parentNode: "resolution-process",
    extent: "parent",
    sourcePosition: Position.Right,
    targetPosition: Position.Top,
    style: { ...nodeStyles.special, width: "170px", height: "65px", paddingBottom: "8px" },
  },
  {
    id: "pastoralist-process",
    type: "group",
    position: { x: 320, y: 400 },
    data: { label: "Pastoralist Process" },
    style: {
      background: "rgba(107, 114, 128, 0.05)",
      border: "1px dashed #6B7280",
      borderRadius: "0.75rem",
      padding: "16px",
      fontSize: "11px",
      fontWeight: 600,
      color: "#6B7280",
      width: 450,
      height: 120,
    },
  },
  {
    id: "post-install",
    position: { x: 20, y: 40 },
    data: {
      label: (
        <div style={{ textAlign: "center" }}>
          <div style={{ fontWeight: 600 }}>postinstall</div>
          <div style={{ fontSize: "11px", opacity: 0.8, marginTop: "2px" }}>
            hook
          </div>
        </div>
      ),
    },
    parentNode: "pastoralist-process",
    extent: "parent",
    sourcePosition: Position.Right,
    targetPosition: Position.Top,
    style: { ...nodeStyles.info, width: "100px", height: "65px", paddingBottom: "8px" },
  },
  {
    id: "analyze-deps",
    position: { x: 130, y: 40 },
    data: {
      label: (
        <div style={{ textAlign: "center" }}>
          <div style={{ fontWeight: 600 }}>Analyze</div>
          <div style={{ fontSize: "11px", opacity: 0.8, marginTop: "2px" }}>
            dependencies
          </div>
        </div>
      ),
    },
    parentNode: "pastoralist-process",
    extent: "parent",
    sourcePosition: Position.Right,
    targetPosition: Position.Left,
    style: { ...nodeStyles.process, width: "100px", height: "65px", paddingBottom: "8px" },
  },
  {
    id: "update-appendix",
    position: { x: 240, y: 40 },
    data: {
      label: (
        <div style={{ textAlign: "center" }}>
          <div style={{ fontWeight: 600 }}>Update</div>
          <div style={{ fontSize: "11px", opacity: 0.8, marginTop: "2px" }}>
            appendix
          </div>
        </div>
      ),
    },
    parentNode: "pastoralist-process",
    extent: "parent",
    sourcePosition: Position.Right,
    targetPosition: Position.Left,
    style: { ...nodeStyles.success, width: "100px", height: "65px", paddingBottom: "8px" },
  },
  {
    id: "clean-unused",
    position: { x: 350, y: 40 },
    data: {
      label: (
        <div style={{ textAlign: "center" }}>
          <div style={{ fontWeight: 600 }}>Clean</div>
          <div style={{ fontSize: "11px", opacity: 0.8, marginTop: "2px" }}>
            unused
          </div>
        </div>
      ),
    },
    parentNode: "pastoralist-process",
    extent: "parent",
    sourcePosition: Position.Bottom,
    targetPosition: Position.Left,
    style: { ...nodeStyles.error, width: "80px", height: "65px", paddingBottom: "8px" },
  },
  {
    id: "final-state",
    type: "group",
    position: { x: 590, y: 180 },
    data: { label: "Final State" },
    style: {
      background: "rgba(107, 114, 128, 0.05)",
      border: "1px dashed #6B7280",
      borderRadius: "0.75rem",
      padding: "16px",
      fontSize: "11px",
      fontWeight: 600,
      color: "#6B7280",
      width: 200,
      height: 180,
    },
  },
  {
    id: "node-modules",
    position: { x: 20, y: 40 },
    data: {
      label: (
        <div style={{ textAlign: "center" }}>
          <div style={{ fontWeight: 600 }}>node_modules/</div>
          <div style={{ fontSize: "11px", opacity: 0.8, marginTop: "2px" }}>
            with overrides
          </div>
        </div>
      ),
    },
    parentNode: "final-state",
    extent: "parent",
    targetPosition: Position.Left,
    style: { ...nodeStyles.output, width: "150px", height: "65px", paddingBottom: "8px" },
  },
  {
    id: "updated-pkg",
    position: { x: 20, y: 115 },
    data: {
      label: (
        <div style={{ textAlign: "center" }}>
          <div style={{ fontWeight: 600 }}>Updated</div>
          <div style={{ fontSize: "11px", opacity: 0.8, marginTop: "2px" }}>
            package.json
          </div>
        </div>
      ),
    },
    parentNode: "final-state",
    extent: "parent",
    targetPosition: Position.Top,
    style: { ...nodeStyles.success, width: "150px", height: "65px", paddingBottom: "8px" },
  },
];

const edges: Edge[] = [
  {
    id: "install-read",
    source: "npm-install",
    target: "read-pkg",
    type: "smoothstep",
    style: edgeStyles.default,
  },
  {
    id: "read-lock",
    source: "read-pkg",
    target: "read-lock",
    type: "smoothstep",
    style: edgeStyles.default,
  },
  {
    id: "lock-normal",
    source: "read-lock",
    target: "normal-res",
    type: "smoothstep",
    style: edgeStyles.default,
  },
  {
    id: "normal-check",
    source: "normal-res",
    target: "check-overrides",
    type: "smoothstep",
    style: edgeStyles.default,
  },
  {
    id: "check-apply",
    source: "check-overrides",
    target: "apply-overrides",
    type: "smoothstep",
    label: "Yes",
    labelStyle: { fontSize: 11 },
    style: edgeStyles.default,
  },
  {
    id: "check-modules",
    source: "check-overrides",
    target: "node-modules",
    type: "smoothstep",
    label: "No",
    labelStyle: { fontSize: 11 },
    style: edgeStyles.default,
  },
  {
    id: "apply-modules",
    source: "apply-overrides",
    target: "node-modules",
    type: "smoothstep",
    style: edgeStyles.success,
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: edgeStyles.success.stroke,
    },
  },
  {
    id: "modules-post",
    source: "node-modules",
    target: "post-install",
    type: "smoothstep",
    style: edgeStyles.default,
  },
  {
    id: "post-analyze",
    source: "post-install",
    target: "analyze-deps",
    type: "smoothstep",
    style: edgeStyles.default,
  },
  {
    id: "analyze-update",
    source: "analyze-deps",
    target: "update-appendix",
    type: "smoothstep",
    style: edgeStyles.default,
  },
  {
    id: "update-clean",
    source: "update-appendix",
    target: "clean-unused",
    type: "smoothstep",
    style: edgeStyles.default,
  },
  {
    id: "clean-updated",
    source: "clean-unused",
    target: "updated-pkg",
    type: "smoothstep",
    style: edgeStyles.success,
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: edgeStyles.success.stroke,
    },
  },
];

const DependencyResolutionFlow: React.FC = () => {
  return <FlowModalProvider nodes={nodes} edges={edges} title="Dependency Resolution Flow" />;
};

export default DependencyResolutionFlow;