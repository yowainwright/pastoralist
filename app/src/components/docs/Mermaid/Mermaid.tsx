import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue } from "framer-motion";
import { Dialog } from "@base-ui/react/dialog";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Hand,
  Maximize,
  Minimize,
  RotateCcw,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import mermaid from "mermaid";
import {
  fitDiagram,
  handleDiagramKey,
  moveDiagram,
  observeDiagram,
  panDiagram,
  zoomDiagram,
} from "./utils";
import type {
  DiagramButtonProps,
  DiagramCanvasProps,
  DiagramControls,
  DiagramMotion,
  DiagramToolbarProps,
  DiagramViewProps,
  MermaidProps,
} from "./types";

const isBrowser = typeof document !== "undefined";
const flowchart = { useMaxWidth: false };
const BACKWARD = -48;
const CANVAS_PROPS = { tabIndex: 0, role: "region", "aria-label": "Diagram canvas" } as const;
const MOVEMENT = [
  { label: "Move left", Icon: ArrowLeft, x: BACKWARD, y: 0 },
  { label: "Move right", Icon: ArrowRight, x: 48, y: 0 },
  { label: "Move up", Icon: ArrowUp, x: 0, y: BACKWARD },
  { label: "Move down", Icon: ArrowDown, x: 0, y: 48 },
];
if (isBrowser) {
  mermaid.initialize({
    startOnLoad: false,
    theme: "neutral",
    look: "classic",
    securityLevel: "loose",
    flowchart,
  });
}

export function Mermaid({ chart }: MermaidProps) {
  return (
    <Dialog.Root>
      <DiagramView chart={chart} />
      <ExpandedDiagram chart={chart} />
    </Dialog.Root>
  );
}

function ExpandedDiagram({ chart }: MermaidProps) {
  return (
    <Dialog.Portal>
      <Dialog.Backdrop className="fixed inset-0 z-[1100] bg-black/60 backdrop-blur-sm" />
      <Dialog.Viewport className="fixed inset-0 z-[1101] flex items-center justify-center p-4 sm:p-8">
        <Dialog.Popup className="h-[calc(100dvh-2rem)] w-full min-w-0 rounded-lg bg-base-100 outline-none sm:h-[calc(100dvh-4rem)]">
          <Dialog.Title className="sr-only">Expanded diagram</Dialog.Title>
          <Dialog.Description className="sr-only">
            Use the controls to move and zoom. Press Escape to close.
          </Dialog.Description>
          <DiagramView chart={chart} expanded />
        </Dialog.Popup>
      </Dialog.Viewport>
    </Dialog.Portal>
  );
}

function DiagramView({ chart, expanded = false }: DiagramViewProps) {
  const svg = useRenderedChart(chart);
  const controls = useDiagramControls(svg);
  const disabled = !svg;
  const className = cn(
    "m-0 flex h-80 min-w-0 flex-col overflow-hidden rounded-lg border border-base-content/15 bg-base-200/40 sm:h-96",
    expanded && "h-full sm:h-full",
  );
  return (
    <figure className={className} aria-label="Interactive diagram">
      <DiagramToolbar controls={controls} expanded={expanded} disabled={disabled} />
      <DiagramCanvas svg={svg} controls={controls} />
    </figure>
  );
}

function DiagramCanvas({ svg, controls }: DiagramCanvasProps) {
  const pan = useDiagramPan(controls);
  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) =>
    handleDiagramKey(event, controls);
  return (
    <div
      {...CANVAS_PROPS}
      {...pan}
      ref={controls.viewport}
      data-navigating={controls.navigate}
      onKeyDown={onKeyDown}
      className="relative min-h-0 flex-1 touch-pan-y overflow-hidden outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-navigation data-[navigating=true]:touch-none data-[navigating=true]:cursor-grab data-[navigating=true]:select-none data-[navigating=true]:active:cursor-grabbing"
    >
      <DiagramGraphic svg={svg} controls={controls} />
    </div>
  );
}

function useDiagramPan(controls: DiagramControls) {
  const previous = useRef({ x: 0, y: 0 });
  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    const primaryButton = event.isPrimary && event.button === 0;
    const canPan = controls.navigate && primaryButton;
    if (!canPan) return;
    const { clientX: x, clientY: y } = event;
    previous.current = { x, y };
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) =>
    panDiagram(event, controls, previous);
  const handlers = { onPointerDown, onPointerMove };
  return handlers;
}

function DiagramGraphic({ svg, controls }: DiagramCanvasProps) {
  const markup = { __html: svg };
  return (
    <motion.div
      style={controls.motion}
      dangerouslySetInnerHTML={markup}
      className="mermaid absolute top-0 left-0 m-0 w-max origin-top-left [&>svg]:block [&>svg]:max-w-none"
    />
  );
}

function DiagramToolbar({ controls, expanded, disabled }: DiagramToolbarProps) {
  return (
    <div
      role="toolbar"
      aria-label="Diagram controls"
      className="flex flex-wrap items-center gap-1 border-b border-base-content/10 bg-base-100/80 p-2"
    >
      <DiagramMovement controls={controls} disabled={disabled} />
      <DiagramViewControls controls={controls} expanded={expanded} disabled={disabled} />
    </div>
  );
}

function DiagramViewControls({ controls, expanded, disabled }: DiagramToolbarProps) {
  const zoomIn = () => controls.zoom(1.25);
  const zoomOut = () => controls.zoom(0.8);
  return (
    <div className="ml-auto flex items-center gap-1">
      <DiagramButton label="Zoom out" Icon={ZoomOut} onClick={zoomOut} disabled={disabled} />
      <DiagramButton label="Zoom in" Icon={ZoomIn} onClick={zoomIn} disabled={disabled} />
      <DiagramButton
        label="Fit diagram"
        Icon={RotateCcw}
        onClick={controls.fit}
        disabled={disabled}
      />
      <DiagramExpansion expanded={expanded} />
    </div>
  );
}

function DiagramMovement({
  controls,
  disabled,
}: Pick<DiagramToolbarProps, "controls" | "disabled">) {
  return (
    <div className="flex items-center gap-1">
      <DiagramButton
        label="Drag to navigate"
        Icon={Hand}
        onClick={controls.toggleNavigate}
        pressed={controls.navigate}
        disabled={disabled}
      >
        Navigate
      </DiagramButton>
      <DiagramMoveButtons controls={controls} disabled={disabled} />
    </div>
  );
}

function DiagramMoveButtons({
  controls,
  disabled,
}: Pick<DiagramToolbarProps, "controls" | "disabled">) {
  const buttons = MOVEMENT.map(({ label, Icon, x, y }) => {
    const onClick = () => controls.move(x, y);
    return (
      <DiagramButton key={label} label={label} Icon={Icon} onClick={onClick} disabled={disabled} />
    );
  });
  return <>{buttons}</>;
}

function DiagramExpansion({ expanded }: Pick<DiagramToolbarProps, "expanded">) {
  if (expanded) {
    return <DiagramButton label="Collapse diagram" Icon={Minimize} render={<Dialog.Close />} />;
  }
  return <DiagramButton label="Expand diagram" Icon={Maximize} render={<Dialog.Trigger />} />;
}

function DiagramButton({ label, Icon, pressed, children, ...trigger }: DiagramButtonProps) {
  const className = cn("btn btn-ghost btn-sm px-2", pressed && "bg-navigation/15 text-navigation");
  return (
    <Tooltip>
      <TooltipTrigger {...trigger} className={className} aria-label={label} aria-pressed={pressed}>
        <Icon className="size-4" />
        {children}
      </TooltipTrigger>
      <TooltipContent side="bottom">{label}</TooltipContent>
    </Tooltip>
  );
}

function useRenderedChart(chart: string) {
  const [svg, setSvg] = useState("");
  useEffect(() => {
    if (!chart) return;
    const cleanup = renderChart(chart, setSvg);
    return cleanup;
  }, [chart]);
  return svg;
}

function useDiagramControls(svg: string): DiagramControls {
  const viewport = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const scale = useMotionValue(1);
  const [navigate, setNavigate] = useState(false);
  const values = { x, y, scale };
  useDiagramFit(svg, viewport, values);
  const toggleNavigate = () => setNavigate((value) => !value);
  const fit = () => fitDiagram(viewport.current, values);
  const zoom = (factor: number) => zoomDiagram(viewport.current, values, factor);
  const move = (dx: number, dy: number) => moveDiagram(values, dx, dy);
  const controls = { viewport, motion: values, navigate, toggleNavigate, fit, zoom, move };
  return controls;
}

function useDiagramFit(
  svg: string,
  viewport: React.RefObject<HTMLDivElement | null>,
  { x, y, scale }: DiagramMotion,
) {
  useEffect(() => {
    const element = viewport.current;
    const canFit = element && svg;
    if (!canFit) return;
    const values = { x, y, scale };
    const cleanup = observeDiagram(element, values);
    return cleanup;
  }, [svg, viewport, x, y, scale]);
}

function renderChart(chart: string, setSvg: (svg: string) => void) {
  let cancelled = false;
  const id = `mermaid-${Math.random().toString(36).slice(2, 9)}`;
  setSvg("");
  const render = mermaid.render(id, chart);
  void render
    .then(({ svg: renderedSvg }) => {
      if (cancelled) return;
      setSvg(renderedSvg);
    })
    .catch((error) => {
      if (cancelled) return;
      console.error("Mermaid: render error", error);
    });
  return () => {
    cancelled = true;
  };
}
