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
    const isMissingRenderTarget = !ref.current || !chart;
    if (isMissingRenderTarget) return;

    let cancelled = false;
    const id = `mermaid-${Math.random().toString(36).slice(2, 9)}`;
    setSvg("");

    mermaid
      .render(id, chart)
      .then(({ svg }) => {
        if (cancelled) return;
        setSvg(svg);
      })
      .catch((error) => {
        if (cancelled) return;
        console.error("Mermaid: render error", error);
      });

    return () => {
      cancelled = true;
    };
  }, [chart]);

  return (
    <figure
      ref={ref}
      className="mermaid my-6 flex justify-center"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
