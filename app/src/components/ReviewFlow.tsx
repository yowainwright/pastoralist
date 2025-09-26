import React from "react";
import ReactFlow, { Background, Controls, Position } from "reactflow";
import type { Node, Edge } from "reactflow";
import "reactflow/dist/style.css";
import { nodeStyles, edgeStyles, flowProps } from "./architectures/styles";
import FlowModalProvider from "./architectures/FlowModalProvider";

const edges: Edge[] = [
  { animated: true, id: "1-2", source: "1", target: "2", type: "smoothstep", style: edgeStyles.animated },
  { animated: true, id: "2-3", source: "2", target: "3", type: "smoothstep", style: edgeStyles.animated },
  { animated: true, id: "2-4", source: "2", target: "4", type: "smoothstep", style: edgeStyles.animated },
];

const nodes: Node[] = [
  {
    id: "1",
    position: { x: 200, y: 50 },
    data: {
      label: (
        <div style={{ textAlign: "center" }}>
          <div style={{ fontWeight: 600 }}>Find</div>
          <div style={{ fontSize: "11px", opacity: 0.8, marginTop: "2px" }}>
            Finds overrides in package.json
          </div>
        </div>
      ),
    },
    sourcePosition: Position.Bottom,
    style: { ...nodeStyles.input, width: "250px", height: "60px", paddingBottom: "8px" },
  },
  {
    id: "2",
    position: { x: 200, y: 180 },
    data: {
      label: (
        <div style={{ textAlign: "center" }}>
          <div style={{ fontWeight: 600 }}>Review</div>
          <div style={{ fontSize: "11px", opacity: 0.8, marginTop: "2px" }}>
            Compares appendix vs overrides
          </div>
        </div>
      ),
    },
    targetPosition: Position.Top,
    sourcePosition: Position.Bottom,
    style: { ...nodeStyles.process, width: "250px", height: "60px", paddingBottom: "8px" },
  },
  {
    id: "3",
    position: { x: 50, y: 320 },
    data: {
      label: (
        <div style={{ textAlign: "center" }}>
          <div style={{ fontWeight: 600 }}>Update</div>
          <div style={{ fontSize: "11px", opacity: 0.8, marginTop: "2px" }}>
            Updates overrides in package.json
          </div>
        </div>
      ),
    },
    targetPosition: Position.Top,
    style: { ...nodeStyles.output, width: "250px", height: "60px", paddingBottom: "8px" },
  },
  {
    id: "4",
    position: { x: 350, y: 320 },
    data: {
      label: (
        <div style={{ textAlign: "center" }}>
          <div style={{ fontWeight: 600 }}>Add</div>
          <div style={{ fontSize: "11px", opacity: 0.8, marginTop: "2px" }}>
            Adds new items to appendix
          </div>
        </div>
      ),
    },
    targetPosition: Position.Top,
    style: { ...nodeStyles.info, width: "250px", height: "60px", paddingBottom: "8px" },
  },
];

const ReviewFlow = () => {
  return (
    <section className="flex justify-center mt-10">
      <div style={{ width: "100%", height: 450 }}>
        <FlowModalProvider
          nodes={nodes}
          edges={edges}
          height="450px"
          title="How Pastoralist Works"
        />
      </div>
    </section>
  );
};

export default ReviewFlow;
