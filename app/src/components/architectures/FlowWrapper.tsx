import React, { useState, useRef } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  ConnectionMode,
} from "reactflow";
import type { Node, Edge } from "reactflow";
import "reactflow/dist/style.css";
import { containerStyle, flowProps } from "./styles";

interface FlowWrapperProps {
  nodes: Node[];
  edges: Edge[];
  height?: string;
}

const FlowWrapper: React.FC<FlowWrapperProps> = ({ nodes, edges, height }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const wrapperStyle = isFullscreen
    ? {
        position: "fixed" as const,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: "100vw",
        height: "100vh",
        zIndex: 9999,
        background: "white",
      }
    : {
        ...containerStyle,
        height: height || containerStyle.height,
      };

  return (
    <div ref={containerRef} style={wrapperStyle}>
      <button
        onClick={toggleFullscreen}
        className="absolute top-4 right-4 z-10 px-3 py-1 bg-white border border-gray-300 rounded shadow-sm hover:bg-gray-50 text-sm font-medium"
        style={{ zIndex: 10 }}
      >
        {isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
      </button>
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
    </div>
  );
};

export default FlowWrapper;