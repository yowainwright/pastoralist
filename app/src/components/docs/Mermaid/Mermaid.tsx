import { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";
import type { MermaidProps } from "./types";

mermaid.initialize({
  startOnLoad: false,
  theme: "neutral",
  securityLevel: "loose",
});

export function Mermaid({ chart }: MermaidProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>("");

  useEffect(() => {
    if (!ref.current || !chart) return;

    const id = `mermaid-${Math.random().toString(36).slice(2, 9)}`;

    mermaid.render(id, chart).then(({ svg }) => {
      setSvg(svg);
    });
  }, [chart]);

  return (
    <figure
      ref={ref}
      className="mermaid my-6 flex justify-center"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
