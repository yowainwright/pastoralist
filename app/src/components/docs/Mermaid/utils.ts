import type { KeyboardEvent, PointerEvent, RefObject } from "react";
import type { DiagramControls, DiagramMotion, DiagramSize, DiagramTransform } from "./types";

const DEFAULT_TRANSFORM: DiagramTransform = { x: 0, y: 0, scale: 1 };
const KEY_MOVEMENT = new Map<string, readonly [number, number]>([
  ["ArrowLeft", [-48, 0]],
  ["ArrowRight", [48, 0]],
  ["ArrowUp", [0, -48]],
  ["ArrowDown", [0, 48]],
]);

export function observeDiagram(viewport: HTMLDivElement, motion: DiagramMotion) {
  const fit = () => fitDiagram(viewport, motion);
  const observer = new ResizeObserver(fit);
  observer.observe(viewport);
  fit();
  const cleanup = observer.disconnect.bind(observer);
  return cleanup;
}

export function fitDiagram(viewport: HTMLDivElement | null, motion: DiagramMotion) {
  const svg = viewport?.querySelector<SVGSVGElement>("svg");
  const canFit = viewport && svg;
  if (!canFit) return;
  const diagram = svg.viewBox.baseVal;
  svg.style.width = `${diagram.width}px`;
  svg.style.height = `${diagram.height}px`;
  const transform = getFitTransform(viewport.getBoundingClientRect(), diagram);
  applyDiagramTransform(motion, transform);
}

export function zoomDiagram(
  viewport: HTMLDivElement | null,
  motion: DiagramMotion,
  factor: number,
) {
  if (!viewport) return;
  const x = motion.x.get();
  const y = motion.y.get();
  const scale = motion.scale.get();
  const current = { x, y, scale };
  const transform = getZoomTransform(current, viewport.getBoundingClientRect(), factor);
  applyDiagramTransform(motion, transform);
}

export function moveDiagram(motion: DiagramMotion, x: number, y: number) {
  motion.x.set(motion.x.get() + x);
  motion.y.set(motion.y.get() + y);
}

export function handleDiagramKey(event: KeyboardEvent<HTMLDivElement>, controls: DiagramControls) {
  if (!controls.navigate) return;
  const movement = KEY_MOVEMENT.get(event.key);
  if (!movement) return;
  event.preventDefault();
  controls.move(...movement);
}

export function panDiagram(
  event: PointerEvent<HTMLDivElement>,
  controls: Pick<DiagramControls, "navigate" | "move">,
  previous: RefObject<{ x: number; y: number }>,
) {
  const captured = event.currentTarget.hasPointerCapture(event.pointerId);
  const canPan = controls.navigate && captured;
  if (!canPan) return;
  const x = event.clientX;
  const y = event.clientY;
  controls.move(x - previous.current.x, y - previous.current.y);
  previous.current = { x, y };
}

export function getFitTransform(viewport: DiagramSize, diagram: DiagramSize): DiagramTransform {
  const hasViewport = viewport.width > 0 && viewport.height > 0;
  const hasDiagram = diagram.width > 0 && diagram.height > 0;
  const hasSize = hasViewport && hasDiagram;
  if (!hasSize) return DEFAULT_TRANSFORM;
  const widthScale = Math.max(1, viewport.width - 32) / diagram.width;
  const heightScale = Math.max(1, viewport.height - 32) / diagram.height;
  const scale = Math.min(widthScale, heightScale, 1);
  const x = (viewport.width - diagram.width * scale) / 2;
  const y = (viewport.height - diagram.height * scale) / 2;
  const transform = { x, y, scale };
  return transform;
}

export function getZoomTransform(current: DiagramTransform, viewport: DiagramSize, factor: number) {
  const scale = Math.min(8, Math.max(0.01, current.scale * factor));
  const ratio = scale / current.scale;
  const centerX = viewport.width / 2;
  const centerY = viewport.height / 2;
  const x = centerX - (centerX - current.x) * ratio;
  const y = centerY - (centerY - current.y) * ratio;
  const transform = { x, y, scale };
  return transform;
}

function applyDiagramTransform(motion: DiagramMotion, transform: DiagramTransform) {
  motion.x.set(transform.x);
  motion.y.set(transform.y);
  motion.scale.set(transform.scale);
}
