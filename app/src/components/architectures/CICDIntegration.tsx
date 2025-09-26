import React from "react";
import { MarkerType, Position } from "reactflow";
import type { Node, Edge } from "reactflow";
import { nodeStyles, edgeStyles } from "./styles";
import FlowModalProvider from "./FlowModalProvider";

const nodes: Node[] = [
  {
    id: "ci-pipeline",
    type: "group",
    position: { x: 20, y: 100 },
    data: { label: "CI Pipeline" },
    style: {
      background: "rgba(107, 114, 128, 0.05)",
      border: "1px dashed #6B7280",
      borderRadius: "0.75rem",
      padding: "16px",
      fontSize: "11px",
      fontWeight: 600,
      color: "#6B7280",
      width: 220,
      height: 350,
    },
  },
  {
    id: "trigger",
    position: { x: 30, y: 40 },
    data: {
      label: (
        <div style={{ textAlign: "center" }}>
          <div style={{ fontWeight: 600 }}>Push/PR</div>
          <div style={{ fontSize: "11px", opacity: 0.8, marginTop: "2px" }}>
            Trigger
          </div>
        </div>
      ),
    },
    parentNode: "ci-pipeline",
    extent: "parent",
    sourcePosition: Position.Bottom,
    style: { ...nodeStyles.warning, width: "150px", height: "65px", paddingBottom: "8px" },
  },
  {
    id: "install",
    position: { x: 30, y: 115 },
    data: { label: "npm install" },
    parentNode: "ci-pipeline",
    extent: "parent",
    sourcePosition: Position.Bottom,
    targetPosition: Position.Top,
    style: { ...nodeStyles.default, width: "150px", height: "50px" },
  },
  {
    id: "run-pastoralist",
    position: { x: 30, y: 185 },
    data: {
      label: (
        <div style={{ textAlign: "center" }}>
          <div style={{ fontWeight: 600 }}>Run</div>
          <div style={{ fontSize: "11px", opacity: 0.8, marginTop: "2px" }}>
            pastoralist
          </div>
        </div>
      ),
    },
    parentNode: "ci-pipeline",
    extent: "parent",
    sourcePosition: Position.Bottom,
    targetPosition: Position.Top,
    style: { ...nodeStyles.info, width: "150px", height: "65px", paddingBottom: "8px" },
  },
  {
    id: "check-diff",
    position: { x: 30, y: 265 },
    data: {
      label: (
        <div style={{ textAlign: "center" }}>
          <div style={{ fontWeight: 600 }}>Changes</div>
          <div style={{ fontSize: "11px", opacity: 0.8, marginTop: "2px" }}>
            detected?
          </div>
        </div>
      ),
    },
    parentNode: "ci-pipeline",
    extent: "parent",
    sourcePosition: Position.Right,
    targetPosition: Position.Top,
    style: { ...nodeStyles.special, width: "150px", height: "65px", paddingBottom: "8px" },
  },
  {
    id: "actions-group",
    type: "group",
    position: { x: 280, y: 150 },
    data: { label: "Actions" },
    style: {
      background: "rgba(107, 114, 128, 0.05)",
      border: "1px dashed #6B7280",
      borderRadius: "0.75rem",
      padding: "16px",
      fontSize: "11px",
      fontWeight: 600,
      color: "#6B7280",
      width: 230,
      height: 250,
    },
  },
  {
    id: "fail-build",
    position: { x: 30, y: 40 },
    data: {
      label: (
        <div style={{ textAlign: "center" }}>
          <div style={{ fontWeight: 600 }}>Fail build</div>
          <div style={{ fontSize: "11px", opacity: 0.8, marginTop: "2px" }}>
            Uncommitted changes
          </div>
        </div>
      ),
    },
    parentNode: "actions-group",
    extent: "parent",
    sourcePosition: Position.Bottom,
    targetPosition: Position.Left,
    style: { ...nodeStyles.error, width: "170px", height: "65px", paddingBottom: "8px" },
  },
  {
    id: "pass-build",
    position: { x: 30, y: 115 },
    data: {
      label: (
        <div style={{ textAlign: "center" }}>
          <div style={{ fontWeight: 600 }}>Continue</div>
          <div style={{ fontSize: "11px", opacity: 0.8, marginTop: "2px" }}>
            pipeline
          </div>
        </div>
      ),
    },
    parentNode: "actions-group",
    extent: "parent",
    sourcePosition: Position.Bottom,
    targetPosition: Position.Left,
    style: { ...nodeStyles.success, width: "170px", height: "65px", paddingBottom: "8px" },
  },
  {
    id: "security-check",
    position: { x: 30, y: 190 },
    data: {
      label: (
        <div style={{ textAlign: "center" }}>
          <div style={{ fontWeight: 600 }}>Security</div>
          <div style={{ fontSize: "11px", opacity: 0.8, marginTop: "2px" }}>
            scan
          </div>
        </div>
      ),
    },
    parentNode: "actions-group",
    extent: "parent",
    sourcePosition: Position.Right,
    targetPosition: Position.Top,
    style: { ...nodeStyles.special, width: "170px", height: "65px", paddingBottom: "8px" },
  },
  {
    id: "notifications-group",
    type: "group",
    position: { x: 560, y: 120 },
    data: { label: "Notifications" },
    style: {
      background: "rgba(107, 114, 128, 0.05)",
      border: "1px dashed #6B7280",
      borderRadius: "0.75rem",
      padding: "16px",
      fontSize: "11px",
      fontWeight: 600,
      color: "#6B7280",
      width: 230,
      height: 180,
    },
  },
  {
    id: "alert",
    position: { x: 25, y: 40 },
    data: {
      label: (
        <div style={{ textAlign: "center" }}>
          <div style={{ fontWeight: 600 }}>Alert team:</div>
          <div style={{ fontSize: "11px", opacity: 0.8, marginTop: "2px" }}>
            Overrides need update
          </div>
        </div>
      ),
    },
    parentNode: "notifications-group",
    extent: "parent",
    targetPosition: Position.Left,
    style: { ...nodeStyles.warning, width: "180px", height: "65px", paddingBottom: "8px" },
  },
  {
    id: "report",
    position: { x: 25, y: 115 },
    data: {
      label: (
        <div style={{ textAlign: "center" }}>
          <div style={{ fontWeight: 600 }}>Generate</div>
          <div style={{ fontSize: "11px", opacity: 0.8, marginTop: "2px" }}>
            override report
          </div>
        </div>
      ),
    },
    parentNode: "notifications-group",
    extent: "parent",
    targetPosition: Position.Left,
    style: { ...nodeStyles.output, width: "180px", height: "65px", paddingBottom: "8px" },
  },
];

const edges: Edge[] = [
  {
    id: "trigger-install",
    source: "trigger",
    target: "install",
    type: "smoothstep",
    style: edgeStyles.default,
  },
  {
    id: "install-run",
    source: "install",
    target: "run-pastoralist",
    type: "smoothstep",
    style: edgeStyles.default,
  },
  {
    id: "run-check",
    source: "run-pastoralist",
    target: "check-diff",
    type: "smoothstep",
    style: edgeStyles.default,
  },
  {
    id: "check-fail",
    source: "check-diff",
    target: "fail-build",
    type: "smoothstep",
    label: "Yes",
    labelStyle: { fontSize: 11 },
    style: edgeStyles.default,
  },
  {
    id: "check-pass",
    source: "check-diff",
    target: "pass-build",
    type: "smoothstep",
    label: "No",
    labelStyle: { fontSize: 11 },
    style: edgeStyles.default,
  },
  {
    id: "fail-alert",
    source: "fail-build",
    target: "alert",
    type: "smoothstep",
    style: edgeStyles.default,
  },
  {
    id: "pass-security",
    source: "pass-build",
    target: "security-check",
    type: "smoothstep",
    style: edgeStyles.default,
  },
  {
    id: "security-report",
    source: "security-check",
    target: "report",
    type: "smoothstep",
    style: edgeStyles.default,
  },
];

const CICDIntegration: React.FC = () => {
  return <FlowModalProvider nodes={nodes} edges={edges} title="CI/CD Integration" />;
};

export default CICDIntegration;