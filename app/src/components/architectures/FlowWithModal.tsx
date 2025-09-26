import React, { useState } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  ConnectionMode,
} from "reactflow";
import type { Node, Edge } from "reactflow";
import "reactflow/dist/style.css";
import { flowProps } from "./styles";

interface FlowWithModalProps {
  nodes: Node[];
  edges: Edge[];
  height?: string;
  title?: string;
}

const FlowWithModal: React.FC<FlowWithModalProps> = ({
  nodes,
  edges,
  height = "600px",
  title = "Architecture Diagram"
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  const containerStyle = {
    width: "100%",
    height,
    position: "relative" as const,
    borderRadius: "0.5rem",
    background: "transparent",
  };

  const FlowContent = () => (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      connectionMode={ConnectionMode.Loose}
      {...flowProps}
    >
      <Background color="#e5e7eb" gap={16} />
      <Controls showInteractive={false} />
      <MiniMap
        nodeColor={(node) => {
          const nodeStyle = node.style as any;
          return nodeStyle?.background || "#fafafa";
        }}
        pannable
        zoomable
        style={{
          backgroundColor: "#fafafa",
          maskColor: "rgba(29, 78, 216, 0.1)",
        }}
      />
    </ReactFlow>
  );

  return (
    <>
      <div style={containerStyle}>
        <button
          onClick={openModal}
          className="absolute top-4 right-4 z-10 btn btn-sm btn-primary"
          style={{ zIndex: 10 }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-4 h-4"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15"
            />
          </svg>
          Expand
        </button>
        <FlowContent />
      </div>

      {isModalOpen && (
        <dialog className="modal modal-open">
          <div className="modal-box max-w-full w-11/12 h-5/6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">{title}</h3>
              <button
                className="btn btn-sm btn-circle btn-ghost"
                onClick={closeModal}
              >
                ✕
              </button>
            </div>
            <div className="w-full h-full" style={{ height: "calc(100% - 4rem)" }}>
              <FlowContent />
            </div>
          </div>
          <form method="dialog" className="modal-backdrop" onClick={closeModal}>
            <button>close</button>
          </form>
        </dialog>
      )}
    </>
  );
};

export default FlowWithModal;