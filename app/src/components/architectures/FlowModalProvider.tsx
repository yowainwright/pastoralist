import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  ConnectionMode,
} from "reactflow";
import type { Node, Edge } from "reactflow";
import "reactflow/dist/style.css";
import { flowProps } from "./styles";

interface FlowModalProviderProps {
  nodes: Node[];
  edges: Edge[];
  height?: string;
  title?: string;
}

const FlowModalProvider: React.FC<FlowModalProviderProps> = ({
  nodes,
  edges,
  height = "600px",
  title = "Architecture Diagram"
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [portalRoot, setPortalRoot] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (typeof document !== "undefined") {
      let root = document.getElementById("flow-modal-root");
      if (!root) {
        root = document.createElement("div");
        root.id = "flow-modal-root";
        document.body.appendChild(root);
      }
      setPortalRoot(root);
    }
  }, []);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  const containerStyle = {
    width: "100%",
    height,
    position: "relative" as const,
    borderRadius: "0.5rem",
    background: "transparent",
  };

  const modalFlowProps = {
    ...flowProps,
    fitView: true,
    fitViewOptions: { padding: 0.1, minZoom: 0.3, maxZoom: 2 },
  };

  const FlowContent = ({ inModal = false }) => (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      connectionMode={ConnectionMode.Loose}
      {...(inModal ? modalFlowProps : flowProps)}
    >
      <Background color="#e5e7eb" gap={16} />
      <Controls showInteractive={false} />
      {inModal && (
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
      )}
    </ReactFlow>
  );

  const Modal = () => {
    if (!portalRoot) return null;

    return ReactDOM.createPortal(
      <div
        className="fixed inset-0 z-50 overflow-hidden"
        style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
      >
        <div className="fixed inset-4 bg-base-100 rounded-lg shadow-2xl flex flex-col">
          <div className="flex justify-between items-center p-4 border-b">
            <h3 className="font-bold text-xl">{title}</h3>
            <button
              className="btn btn-sm btn-circle btn-ghost"
              onClick={closeModal}
            >
              ✕
            </button>
          </div>
          <div className="flex-1 overflow-hidden">
            <FlowContent inModal={true} />
          </div>
        </div>
      </div>,
      portalRoot
    );
  };

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
        <FlowContent inModal={false} />
      </div>
      {isModalOpen && <Modal />}
    </>
  );
};

export default FlowModalProvider;