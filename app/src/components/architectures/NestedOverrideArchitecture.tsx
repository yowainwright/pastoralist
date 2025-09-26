import React from "react";
import { MarkerType, Position } from "reactflow";
import type { Node, Edge } from "reactflow";
import { nodeStyles, edgeStyles } from "./styles";
import FlowModalProvider from "./FlowModalProvider";

const nodes: Node[] = [
  {
    id: "your-proj",
    type: "group",
    position: { x: 250, y: 20 },
    data: { label: "Your Project" },
    style: {
      background: "rgba(107, 114, 128, 0.05)",
      border: "1px dashed #6B7280",
      borderRadius: "0.75rem",
      padding: "16px",
      fontSize: "11px",
      fontWeight: 600,
      color: "#6B7280",
      width: 200,
      height: 100,
    },
  },
  {
    id: "your-pkg",
    position: { x: 25, y: 40 },
    data: { label: "your-package" },
    parentNode: "your-proj",
    extent: "parent",
    sourcePosition: Position.Bottom,
    style: { ...nodeStyles.info, width: "150px", height: "50px" },
  },
  {
    id: "direct-dep",
    type: "group",
    position: { x: 50, y: 160 },
    data: { label: "Direct Dependency" },
    style: {
      background: "rgba(107, 114, 128, 0.05)",
      border: "1px dashed #6B7280",
      borderRadius: "0.75rem",
      padding: "16px",
      fontSize: "11px",
      fontWeight: 600,
      color: "#6B7280",
      width: 250,
      height: 180,
    },
  },
  {
    id: "express",
    position: { x: 30, y: 40 },
    data: { label: "express@4.18.0" },
    parentNode: "direct-dep",
    extent: "parent",
    sourcePosition: Position.Bottom,
    targetPosition: Position.Top,
    style: { ...nodeStyles.process, width: "180px", height: "50px" },
  },
  {
    id: "pg",
    position: { x: 30, y: 110 },
    data: { label: "pg@8.13.1" },
    parentNode: "direct-dep",
    extent: "parent",
    sourcePosition: Position.Bottom,
    targetPosition: Position.Top,
    style: { ...nodeStyles.process, width: "180px", height: "50px" },
  },
  {
    id: "transitive-deps",
    type: "group",
    position: { x: 350, y: 160 },
    data: { label: "Transitive Dependencies" },
    style: {
      background: "rgba(107, 114, 128, 0.05)",
      border: "1px dashed #6B7280",
      borderRadius: "0.75rem",
      padding: "16px",
      fontSize: "11px",
      fontWeight: 600,
      color: "#6B7280",
      width: 250,
      height: 180,
    },
  },
  {
    id: "cookie",
    position: { x: 30, y: 40 },
    data: { label: "cookie@0.4.0" },
    parentNode: "transitive-deps",
    extent: "parent",
    sourcePosition: Position.Bottom,
    targetPosition: Position.Top,
    style: { ...nodeStyles.default, width: "180px", height: "50px" },
  },
  {
    id: "pg-types",
    position: { x: 30, y: 110 },
    data: { label: "pg-types@3.0.0" },
    parentNode: "transitive-deps",
    extent: "parent",
    sourcePosition: Position.Bottom,
    targetPosition: Position.Top,
    style: { ...nodeStyles.default, width: "180px", height: "50px" },
  },
  {
    id: "nested-overrides",
    type: "group",
    position: { x: 50, y: 380 },
    data: { label: "Nested Overrides" },
    style: {
      background: "rgba(107, 114, 128, 0.05)",
      border: "1px dashed #6B7280",
      borderRadius: "0.75rem",
      padding: "16px",
      fontSize: "11px",
      fontWeight: 600,
      color: "#6B7280",
      width: 250,
      height: 120,
    },
  },
  {
    id: "nested-override",
    position: { x: 25, y: 35 },
    data: {
      label: (
        <div style={{ textAlign: "center" }}>
          <div style={{ fontWeight: 600 }}>Overrides:</div>
          <div style={{ fontSize: "11px", opacity: 0.8, marginTop: "2px" }}>
            express.cookie: 0.5.0
          </div>
          <div style={{ fontSize: "11px", opacity: 0.8 }}>
            pg.pg-types: 4.0.1
          </div>
        </div>
      ),
    },
    parentNode: "nested-overrides",
    extent: "parent",
    sourcePosition: Position.Right,
    style: { ...nodeStyles.special, width: "200px", height: "75px", paddingBottom: "8px" },
  },
  {
    id: "result",
    type: "group",
    position: { x: 350, y: 380 },
    data: { label: "Result" },
    style: {
      background: "rgba(107, 114, 128, 0.05)",
      border: "1px dashed #6B7280",
      borderRadius: "0.75rem",
      padding: "16px",
      fontSize: "11px",
      fontWeight: 600,
      color: "#6B7280",
      width: 250,
      height: 180,
    },
  },
  {
    id: "cookie-fixed",
    position: { x: 30, y: 40 },
    data: {
      label: (
        <div style={{ textAlign: "center" }}>
          <div style={{ fontWeight: 600 }}>cookie@0.5.0</div>
          <div style={{ fontSize: "11px", opacity: 0.8, marginTop: "2px" }}>
            Fixed
          </div>
        </div>
      ),
    },
    parentNode: "result",
    extent: "parent",
    targetPosition: Position.Left,
    style: { ...nodeStyles.success, width: "180px", height: "65px", paddingBottom: "8px" },
  },
  {
    id: "pg-types-fixed",
    position: { x: 30, y: 110 },
    data: {
      label: (
        <div style={{ textAlign: "center" }}>
          <div style={{ fontWeight: 600 }}>pg-types@4.0.1</div>
          <div style={{ fontSize: "11px", opacity: 0.8, marginTop: "2px" }}>
            Fixed
          </div>
        </div>
      ),
    },
    parentNode: "result",
    extent: "parent",
    targetPosition: Position.Left,
    style: { ...nodeStyles.success, width: "180px", height: "65px", paddingBottom: "8px" },
  },
];

const edges: Edge[] = [
  {
    id: "pkg-express",
    source: "your-pkg",
    target: "express",
    type: "smoothstep",
    style: edgeStyles.default,
  },
  {
    id: "pkg-pg",
    source: "your-pkg",
    target: "pg",
    type: "smoothstep",
    style: edgeStyles.default,
  },
  {
    id: "express-cookie",
    source: "express",
    target: "cookie",
    type: "smoothstep",
    style: edgeStyles.default,
  },
  {
    id: "pg-types",
    source: "pg",
    target: "pg-types",
    type: "smoothstep",
    style: edgeStyles.default,
  },
  {
    id: "override-cookie",
    source: "nested-override",
    target: "cookie",
    type: "smoothstep",
    label: "Overrides",
    labelStyle: { fontSize: 11 },
    style: edgeStyles.dashed,
    animated: true,
  },
  {
    id: "override-pg-types",
    source: "nested-override",
    target: "pg-types",
    type: "smoothstep",
    label: "Overrides",
    labelStyle: { fontSize: 11 },
    style: edgeStyles.dashed,
    animated: true,
  },
  {
    id: "cookie-fixed",
    source: "cookie",
    target: "cookie-fixed",
    type: "smoothstep",
    style: edgeStyles.success,
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: edgeStyles.success.stroke,
    },
  },
  {
    id: "pg-fixed",
    source: "pg-types",
    target: "pg-types-fixed",
    type: "smoothstep",
    style: edgeStyles.success,
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: edgeStyles.success.stroke,
    },
  },
];

const NestedOverrideArchitecture: React.FC = () => {
  return <FlowModalProvider nodes={nodes} edges={edges} title="Nested Override Architecture" />;
};

export default NestedOverrideArchitecture;