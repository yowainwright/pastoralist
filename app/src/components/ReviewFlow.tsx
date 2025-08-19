import React from "react";
import ReactFlow, { Background } from "reactflow";
import "reactflow/dist/style.css";

const edges = [
  { animated: true, id: "1-2", source: "1", target: "2", type: "smoothstep" },
  { animated: true, id: "2-3", source: "2", target: "3", type: "smoothstep" },
  { animated: true, id: "2-4", source: "2", target: "4", type: "smoothstep" },
];

const Label = ({
  description,
  metaDescription,
}: {
  description: string;
  metaDescription?: string;
}) => (
  <article className="border-[#1D4ED8] border-2 p-3 rounded">
    <p className="text-[#1D4ED8] text-base my-1 leading-tight">{description}</p>
    {metaDescription && (
      <small className="text-xs text-base-content/60 leading-tight my-0">
        {metaDescription}
      </small>
    )}
  </article>
);

const style = {
  background: "transparent",
  border: 0,
  borderRadius: ".25rem",
  padding: 0,
  width: "300px",
};

const nodes = [
  {
    id: "1",
    position: { x: 160, y: 0 },
    data: {
      label: (
        <Label
          description="find"
          metaDescription="Pastoralist finds overrides/resolutions in a repo's root package.json"
        />
      ),
    },
    style,
  },
  {
    id: "2",
    position: { x: 160, y: 150 },
    data: {
      label: (
        <Label
          description="review"
          metaDescription="Pastoralist compares pastoralist.appendix against overrides/resolutions"
        />
      ),
    },
    style,
  },
  {
    id: "3",
    position: { x: 0, y: 340 },
    data: {
      label: (
        <Label
          description="update"
          metaDescription="Pastoralist updates a repo's overrides and resolutions in package.json"
        />
      ),
    },
    style,
  },
  {
    id: "4",
    position: { x: 320, y: 340 },
    data: {
      label: (
        <Label
          description="add"
          metaDescription="Pastoralist adds new overrides/resolutions to the appendix"
        />
      ),
    },
    style,
  },
];

const ReviewFlow = () => {
  return (
    <section className="flex justify-center mt-10">
      <div style={{ width: 620, height: 550 }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          proOptions={{ hideAttribution: true }}
          zoomOnScroll={false}
          zoomOnDoubleClick={false}
          panOnScroll={false}
          preventScrolling={false}
        >
          <Background />
        </ReactFlow>
      </div>
    </section>
  );
};

export default ReviewFlow;
