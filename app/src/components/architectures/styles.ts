export const themeColors = {
  primary: "#1D4ED8", // Blue from the theme
  secondary: "#3B82F6",
  accent: "#60A5FA",
  success: "#10B981",
  warning: "#F59E0B",
  error: "#EF4444",
  info: "#06B6D4",
  neutral: "#6B7280",
} as const;

export const nodeStyles = {
  input: {
    background: "rgba(29, 78, 216, 0.1)", // primary with opacity
    border: `2px solid ${themeColors.primary}`,
    borderRadius: "0.5rem",
    padding: "8px 12px",
    fontSize: "13px",
    fontWeight: 500,
    color: themeColors.primary,
    textAlign: "center" as const,
    transition: "all 0.2s ease",
  },
  process: {
    background: "rgba(16, 185, 129, 0.1)", // success with opacity
    border: `2px solid ${themeColors.success}`,
    borderRadius: "0.5rem",
    padding: "8px 12px",
    fontSize: "13px",
    fontWeight: 500,
    color: themeColors.success,
    textAlign: "center" as const,
    transition: "all 0.2s ease",
  },
  output: {
    background: "rgba(245, 158, 11, 0.1)", // warning with opacity
    border: `2px solid ${themeColors.warning}`,
    borderRadius: "0.5rem",
    padding: "8px 12px",
    fontSize: "13px",
    fontWeight: 500,
    color: themeColors.warning,
    textAlign: "center" as const,
    transition: "all 0.2s ease",
  },
  error: {
    background: "rgba(239, 68, 68, 0.1)", // error with opacity
    border: `2px solid ${themeColors.error}`,
    borderRadius: "0.5rem",
    padding: "8px 12px",
    fontSize: "13px",
    fontWeight: 500,
    color: themeColors.error,
    textAlign: "center" as const,
    transition: "all 0.2s ease",
  },
  special: {
    background: "rgba(96, 165, 250, 0.1)", // accent with opacity
    border: `2px solid ${themeColors.accent}`,
    borderRadius: "0.5rem",
    padding: "8px 12px",
    fontSize: "13px",
    fontWeight: 500,
    color: themeColors.accent,
    textAlign: "center" as const,
    transition: "all 0.2s ease",
  },
  info: {
    background: "rgba(6, 182, 212, 0.1)", // info with opacity
    border: `2px solid ${themeColors.info}`,
    borderRadius: "0.5rem",
    padding: "8px 12px",
    fontSize: "13px",
    fontWeight: 500,
    color: themeColors.info,
    textAlign: "center" as const,
    transition: "all 0.2s ease",
  },
  default: {
    background: "transparent",
    border: `2px solid ${themeColors.neutral}`,
    borderRadius: "0.5rem",
    padding: "8px 12px",
    fontSize: "13px",
    fontWeight: 500,
    color: themeColors.neutral,
    textAlign: "center" as const,
    transition: "all 0.2s ease",
  },
  group: {
    background: "rgba(107, 114, 128, 0.05)",
    border: `1px dashed ${themeColors.neutral}`,
    borderRadius: "0.75rem",
    padding: "16px",
    fontSize: "11px",
    fontWeight: 600,
    color: themeColors.neutral,
    textAlign: "left" as const,
  },
};

export const edgeStyles = {
  default: {
    stroke: themeColors.neutral,
    strokeWidth: 1,
  },
  animated: {
    stroke: themeColors.primary,
    strokeWidth: 1,
    strokeDasharray: "5 5",
  },
  error: {
    stroke: themeColors.error,
    strokeWidth: 1,
  },
  success: {
    stroke: themeColors.success,
    strokeWidth: 1,
  },
  dashed: {
    stroke: themeColors.neutral,
    strokeWidth: 1,
    strokeDasharray: "5 5",
  },
};

export const containerStyle = {
  width: "100%",
  height: "700px",
  marginTop: "2rem",
  marginBottom: "2rem",
  borderRadius: "0.5rem",
  background: "transparent",
};

export const flowProps = {
  proOptions: { hideAttribution: true },
  zoomOnScroll: true,
  zoomOnDoubleClick: true,
  panOnScroll: true,
  preventScrolling: false,
  fitView: true,
  fitViewOptions: { padding: 0.2, minZoom: 0.3, maxZoom: 2 },
  nodesDraggable: true,
  nodesConnectable: false,
  elementsSelectable: true,
  defaultViewport: { x: 0, y: 0, zoom: 0.75 },
  panOnDrag: true,
  minZoom: 0.3,
  maxZoom: 2,
  connectionMode: "loose",
};