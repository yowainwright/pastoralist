import { useState, useEffect } from "react";

interface CodeLine {
  prefix?: string;
  content: string;
  className?: string;
  style?: React.CSSProperties;
  spotlight?: boolean;
  delay?: number;
}

const codeLines: CodeLine[] = [
  { prefix: "$", content: "bun add -g pastoralist", spotlight: true, delay: 0 },
  { prefix: "", content: "bun add v1.1.38", className: "text-base-content/60" },
  {
    prefix: "",
    content: "Resolving dependencies",
    className: "text-base-content/60",
  },
  {
    prefix: "",
    content: "Installed pastoralist with binaries:",
    className: "text-base-content/60",
  },
  { prefix: "", content: " - pastoralist", className: "text-success" },
  {
    prefix: "$",
    content: "cd my-awesome-project",
    className: "mt-4",
    spotlight: true,
    delay: 1500,
  },
  { prefix: "$", content: "pastoralist", spotlight: true, delay: 3000 },
  { prefix: "", content: "⚡ Pastoralist v1.4.0", className: "text-warning" },
  {
    prefix: "",
    content: "📦 Scanning package.json for overrides and resolutions...",
    className: "text-info",
    spotlight: true,
    delay: 4500,
  },
  { prefix: "", content: "" },
  {
    prefix: "",
    content: "Found overrides:",
    className: "text-base-content/80",
  },
  {
    prefix: "",
    content: "  • lodash@4.17.19 (latest: 4.17.21)",
    className: "text-base-content/60",
    spotlight: true,
    delay: 6000,
  },
  {
    prefix: "",
    content: "  • react@17.0.1 (latest: 17.0.2)",
    className: "text-base-content/60",
    spotlight: true,
    delay: 6000,
  },
  {
    prefix: "",
    content: "  • webpack@5.70.0 (latest: 5.91.0)",
    className: "text-base-content/60",
    spotlight: true,
    delay: 6000,
  },
  { prefix: "", content: "" },
  { prefix: "", content: "🔄 Updating overrides...", className: "text-info" },
  {
    prefix: "",
    content: "✓ Updated lodash: 4.17.19 → 4.17.21",
    className: "text-success",
    spotlight: true,
    delay: 7500,
  },
  {
    prefix: "",
    content: "✓ Updated react: 17.0.1 → 17.0.2",
    className: "text-success",
    spotlight: true,
    delay: 7500,
  },
  {
    prefix: "",
    content: "✓ Updated webpack: 5.70.0 → 5.91.0",
    className: "text-success",
    spotlight: true,
    delay: 7500,
  },
  { prefix: "", content: "" },
  {
    prefix: "",
    content: "✨ Successfully updated 3 overrides in package.json",
    style: { color: "#3d04d9" },
    spotlight: true,
    delay: 9000,
  },
  {
    prefix: "",
    content: "💡 Run 'bun install' to apply the changes",
    className: "text-base-content/60",
  },
];

export default function SpotlightCodeBlock() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  useEffect(() => {
    const spotlightLines = codeLines
      .map((line, index) => ({ ...line, index }))
      .filter((line) => line.spotlight);

    let currentSpotlight = 0;

    const cycleSpotlight = () => {
      const nextSpotlight = (currentSpotlight + 1) % spotlightLines.length;
      const nextLine = spotlightLines[nextSpotlight];

      setActiveIndex(nextLine.index);
      currentSpotlight = nextSpotlight;
    };

    // Start the cycle
    const interval = setInterval(cycleSpotlight, 1000);

    return () => clearInterval(interval);
  }, []);

  const getLineOpacity = (index: number) => {
    if (hoveredIndex !== null) {
      return hoveredIndex === index ? 1 : 0.4;
    }
    const line = codeLines[index];
    if (!line.spotlight) return 0.8;
    return activeIndex === index ? 1 : 0.5;
  };

  return (
    <div className="mockup-code text-xs sm:text-sm md:text-base relative overflow-hidden">
      {/* Spotlight gradient effect */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(600px circle at 50% ${(activeIndex / codeLines.length) * 100}%, rgba(61, 4, 217, 0.25), transparent 40%)`,
          transition: "all 0.5s ease-out",
        }}
      />

      {codeLines.map((line, index) => (
        <pre
          key={index}
          data-prefix={line.prefix}
          className={line.className}
          style={{
            ...line.style,
            opacity: getLineOpacity(index),
            transition: "opacity 0.5s ease-out",
            cursor: line.spotlight ? "pointer" : "default",
          }}
          onMouseEnter={() => line.spotlight && setHoveredIndex(index)}
          onMouseLeave={() => setHoveredIndex(null)}
          onClick={() => line.spotlight && setActiveIndex(index)}
        >
          <code>{line.content}</code>
        </pre>
      ))}
    </div>
  );
}
