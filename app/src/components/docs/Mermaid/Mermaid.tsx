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
    if (!ref.current || !chart) {
      console.log("Mermaid: missing ref or chart", {
        hasRef: !!ref.current,
        chartLength: chart?.length,
      });
      return;
    }

    const id = `mermaid-${Math.random().toString(36).slice(2, 9)}`;

    console.log("Mermaid: rendering chart", { id, chart: chart.slice(0, 100) });

    mermaid
      .render(id, chart)
      .then(({ svg }) => {
        console.log("Mermaid: rendered successfully", svg.slice(0, 100));
        setSvg(svg);
      })
      .catch((error) => {
        console.error("Mermaid: render error", error);
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
