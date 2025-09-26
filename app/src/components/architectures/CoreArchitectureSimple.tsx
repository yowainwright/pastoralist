import React from "react";
import { MarkerType, Position } from "reactflow";
import type { Node, Edge } from "reactflow";
import { nodeStyles, edgeStyles } from "./styles";
import FlowModalProvider from "./FlowModalProvider";

const nodes: Node[] = [
  {
    id: "input-group",
    type: "group",
    position: { x: 20, y: 50 },
    data: { label: "Input" },
    style: {
      background: "rgba(107, 114, 128, 0.05)",
      border: "1px dashed #6B7280",
      borderRadius: "0.75rem",
      padding: "16px",
      fontSize: "11px",
      fontWeight: 600,
      color: "#6B7280",
      width: 220,
      height: 300,
    },
  },
  {
    id: "pkg-json",
    position: { x: 10, y: 40 },
    data: { label: "package.json" },
    parentNode: "input-group",
    extent: "parent",
    sourcePosition: Position.Right,
    style: { ...nodeStyles.input, width: "180px", height: "40px" },
  },
  {
    id: "node-modules",
    position: { x: 10, y: 120 },
    data: { label: "node_modules" },
    parentNode: "input-group",
    extent: "parent",
    sourcePosition: Position.Right,
    style: { ...nodeStyles.input, width: "180px", height: "40px" },
  },
  {
    id: "patches",
    position: { x: 10, y: 200 },
    data: { label: "patches/" },
    parentNode: "input-group",
    extent: "parent",
    sourcePosition: Position.Right,
    style: { ...nodeStyles.input, width: "180px", height: "40px" },
  },
  {
    id: "core-group",
    type: "group",
    position: { x: 290, y: 20 },
    data: { label: "Pastoralist Core" },
    style: {
      background: "rgba(107, 114, 128, 0.05)",
      border: "1px dashed #6B7280",
      borderRadius: "0.75rem",
      padding: "16px",
      fontSize: "11px",
      fontWeight: 600,
      color: "#6B7280",
      width: 520,
      height: 500,
    },
  },
  {
    id: "parser",
    position: { x: 20, y: 50 },
    data: {
      label: (
        <div style={{ textAlign: "center" }}>
          <div style={{ fontWeight: 600 }}>Override Parser</div>
          <div style={{ fontSize: "11px", opacity: 0.8, marginTop: "2px" }}>
            Parses overrides
          </div>
        </div>
      ),
    },
    parentNode: "core-group",
    extent: "parent",
    sourcePosition: Position.Right,
    targetPosition: Position.Left,
    style: { ...nodeStyles.process, width: "220px", height: "75px", paddingBottom: "8px" },
  },
  {
    id: "analyzer",
    position: { x: 280, y: 50 },
    data: {
      label: (
        <div style={{ textAlign: "center" }}>
          <div style={{ fontWeight: 600 }}>Dependency Analyzer</div>
          <div style={{ fontSize: "11px", opacity: 0.8, marginTop: "2px" }}>
            Analyzes tree
          </div>
        </div>
      ),
    },
    parentNode: "core-group",
    extent: "parent",
    sourcePosition: Position.Bottom,
    targetPosition: Position.Left,
    style: { ...nodeStyles.process, width: "220px", height: "75px", paddingBottom: "8px" },
  },
  {
    id: "tracker",
    position: { x: 20, y: 200 },
    data: {
      label: (
        <div style={{ textAlign: "center" }}>
          <div style={{ fontWeight: 600 }}>Usage Tracker</div>
          <div style={{ fontSize: "11px", opacity: 0.8, marginTop: "2px" }}>
            Tracks usage
          </div>
        </div>
      ),
    },
    parentNode: "core-group",
    extent: "parent",
    sourcePosition: Position.Right,
    targetPosition: Position.Left,
    style: { ...nodeStyles.info, width: "220px", height: "75px", paddingBottom: "8px" },
  },
  {
    id: "cleaner",
    position: { x: 280, y: 200 },
    data: {
      label: (
        <div style={{ textAlign: "center" }}>
          <div style={{ fontWeight: 600 }}>Cleanup Engine</div>
          <div style={{ fontSize: "11px", opacity: 0.8, marginTop: "2px" }}>
            Removes unused
          </div>
        </div>
      ),
    },
    parentNode: "core-group",
    extent: "parent",
    sourcePosition: Position.Right,
    targetPosition: Position.Left,
    style: { ...nodeStyles.error, width: "220px", height: "75px", paddingBottom: "8px" },
  },
  {
    id: "security",
    position: { x: 150, y: 350 },
    data: {
      label: (
        <div style={{ textAlign: "center" }}>
          <div style={{ fontWeight: 600 }}>Security Scanner</div>
          <div style={{ fontSize: "11px", opacity: 0.8, marginTop: "2px" }}>
            Scans vulnerabilities
          </div>
        </div>
      ),
    },
    parentNode: "core-group",
    extent: "parent",
    sourcePosition: Position.Right,
    targetPosition: Position.Top,
    style: { ...nodeStyles.special, width: "220px", height: "75px", paddingBottom: "8px" },
  },
  {
    id: "output-group",
    type: "group",
    position: { x: 860, y: 100 },
    data: { label: "Output" },
    style: {
      background: "rgba(107, 114, 128, 0.05)",
      border: "1px dashed #6B7280",
      borderRadius: "0.75rem",
      padding: "16px",
      fontSize: "11px",
      fontWeight: 600,
      color: "#6B7280",
      width: 320,
      height: 340,
    },
  },
  {
    id: "updated-pkg",
    position: { x: 10, y: 40 },
    data: { label: "Updated package.json" },
    parentNode: "output-group",
    extent: "parent",
    targetPosition: Position.Left,
    style: { ...nodeStyles.output, width: "280px", height: "50px" },
  },
  {
    id: "appendix",
    position: { x: 10, y: 120 },
    data: { label: "pastoralist.appendix" },
    parentNode: "output-group",
    extent: "parent",
    targetPosition: Position.Left,
    style: { ...nodeStyles.output, width: "280px", height: "50px" },
  },
  {
    id: "report",
    position: { x: 10, y: 240 },
    data: { label: "Console Report" },
    parentNode: "output-group",
    extent: "parent",
    targetPosition: Position.Left,
    style: { ...nodeStyles.output, width: "280px", height: "50px" },
  },
];

const edges: Edge[] = [
  {
    id: "pkg-parser",
    source: "pkg-json",
    target: "parser",
    type: "smoothstep",
    animated: true,
    style: edgeStyles.animated,
  },
  {
    id: "modules-analyzer",
    source: "node-modules",
    target: "analyzer",
    type: "smoothstep",
    animated: true,
    style: edgeStyles.animated,
  },
  {
    id: "patches-tracker",
    source: "patches",
    target: "tracker",
    type: "smoothstep",
    animated: true,
    style: edgeStyles.animated,
  },
  {
    id: "parser-analyzer",
    source: "parser",
    target: "analyzer",
    type: "smoothstep",
    style: edgeStyles.default,
  },
  {
    id: "analyzer-tracker",
    source: "analyzer",
    target: "tracker",
    type: "smoothstep",
    style: edgeStyles.default,
  },
  {
    id: "tracker-cleaner",
    source: "tracker",
    target: "cleaner",
    type: "smoothstep",
    style: edgeStyles.default,
  },
  {
    id: "analyzer-security",
    source: "analyzer",
    target: "security",
    type: "smoothstep",
    style: edgeStyles.default,
  },
  {
    id: "cleaner-updated",
    source: "cleaner",
    target: "updated-pkg",
    type: "smoothstep",
    style: edgeStyles.success,
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: edgeStyles.success.stroke,
    },
  },
  {
    id: "tracker-appendix",
    source: "tracker",
    target: "appendix",
    type: "smoothstep",
    style: edgeStyles.success,
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: edgeStyles.success.stroke,
    },
  },
  {
    id: "security-report",
    source: "security",
    target: "report",
    type: "smoothstep",
    style: edgeStyles.success,
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: edgeStyles.success.stroke,
    },
  },
  {
    id: "cleaner-report",
    source: "cleaner",
    target: "report",
    type: "smoothstep",
    style: edgeStyles.success,
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: edgeStyles.success.stroke,
    },
  },
];

const CoreArchitectureSimple: React.FC = () => {
  return <FlowModalProvider nodes={nodes} edges={edges} title="Core Architecture" />;
};

export default CoreArchitectureSimple;