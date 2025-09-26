import React from "react";
import { MarkerType } from "reactflow";
import type { Node, Edge } from "reactflow";
import { nodeStyles, edgeStyles } from "./styles";
import { NodeLabel } from "./NodeLabel";
import FlowWithModal from "./FlowWithModal";

const nodes: Node[] = [
  {
    id: "input-group",
    type: "group",
    position: { x: 20, y: 20 },
    data: { label: "Input" },
    style: { ...nodeStyles.group, width: 350, height: 200 },
  },
  {
    id: "pkg-json",
    position: { x: 40, y: 60 },
    data: { label: <NodeLabel title="package.json" type="input" /> },
    parentNode: "input-group",
    style: { background: "transparent", border: "none" },
  },
  {
    id: "node-modules",
    position: { x: 40, y: 120 },
    data: { label: <NodeLabel title="node_modules" type="input" /> },
    parentNode: "input-group",
    style: { background: "transparent", border: "none" },
  },
  {
    id: "patches",
    position: { x: 200, y: 90 },
    data: { label: <NodeLabel title="patches/" type="input" /> },
    parentNode: "input-group",
    style: { background: "transparent", border: "none" },
  },

  {
    id: "core-group",
    type: "group",
    position: { x: 20, y: 250 },
    data: { label: "Pastoralist Core" },
    style: { ...nodeStyles.group, width: 350, height: 260 },
  },
  {
    id: "parser",
    position: { x: 40, y: 60 },
    data: {
      label: <NodeLabel title="Override Parser" description="Parses overrides & resolutions" type="process" />,
    },
    parentNode: "core-group",
    style: { background: "transparent", border: "none" },
  },
  {
    id: "analyzer",
    position: { x: 200, y: 60 },
    data: {
      label: <NodeLabel title="Dependency Analyzer" description="Analyzes dependency tree" type="process" />,
    },
    parentNode: "core-group",
    style: { background: "transparent", border: "none" },
  },
  {
    id: "tracker",
    position: { x: 40, y: 130 },
    data: {
      label: <NodeLabel title="Usage Tracker" description="Tracks usage patterns" type="info" />,
    },
    parentNode: "core-group",
    style: { background: "transparent", border: "none" },
  },
  {
    id: "cleaner",
    position: { x: 200, y: 130 },
    data: {
      label: <NodeLabel title="Cleanup Engine" description="Removes unused items" type="error" />,
    },
    parentNode: "core-group",
    style: { background: "transparent", border: "none" },
  },
  {
    id: "security",
    position: { x: 120, y: 200 },
    data: {
      label: <NodeLabel title="Security Scanner" description="Scans for vulnerabilities" type="special" />,
    },
    parentNode: "core-group",
    style: { background: "transparent", border: "none" },
  },

  {
    id: "output-group",
    type: "group",
    position: { x: 20, y: 540 },
    data: { label: "Output" },
    style: { ...nodeStyles.group, width: 350, height: 140 },
  },
  {
    id: "updated-pkg",
    position: { x: 30, y: 60 },
    data: {
      label: <NodeLabel title="Updated package.json" type="output" />,
    },
    parentNode: "output-group",
    style: { background: "transparent", border: "none" },
  },
  {
    id: "appendix",
    position: { x: 200, y: 60 },
    data: {
      label: <NodeLabel title="pastoralist.appendix" type="output" />,
    },
    parentNode: "output-group",
    style: { background: "transparent", border: "none" },
  },
  {
    id: "report",
    position: { x: 115, y: 100 },
    data: {
      label: <NodeLabel title="Console Report" type="output" />,
    },
    parentNode: "output-group",
    style: { background: "transparent", border: "none" },
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

const CoreArchitecture: React.FC = () => {
  return <FlowWithModal nodes={nodes} edges={edges} title="Core Architecture" />;
};

export default CoreArchitecture;