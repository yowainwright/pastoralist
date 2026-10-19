import type { RefObject, ReactElement, ReactNode } from "react";
import type { MotionValue } from "framer-motion";
import type { LucideIcon } from "lucide-react";

export interface MermaidProps {
  chart: string;
}

export interface DiagramViewProps extends MermaidProps {
  expanded?: boolean;
}

export interface DiagramSize {
  width: number;
  height: number;
}

export interface DiagramTransform {
  x: number;
  y: number;
  scale: number;
}

export interface DiagramMotion {
  x: MotionValue<number>;
  y: MotionValue<number>;
  scale: MotionValue<number>;
}

export interface DiagramControls {
  viewport: RefObject<HTMLDivElement | null>;
  motion: DiagramMotion;
  navigate: boolean;
  toggleNavigate: () => void;
  fit: () => void;
  zoom: (factor: number) => void;
  move: (x: number, y: number) => void;
}

export interface DiagramCanvasProps {
  svg: string;
  controls: DiagramControls;
}

export interface DiagramToolbarProps {
  controls: DiagramControls;
  expanded: boolean;
  disabled: boolean;
}

export interface DiagramButtonProps {
  label: string;
  Icon: LucideIcon;
  onClick?: () => void;
  pressed?: boolean;
  disabled?: boolean;
  render?: ReactElement;
  children?: ReactNode;
}
