import { shouldHighlightLine, highlightJsonSyntax } from "./constants";

interface JsonLineProps {
  line: string;
  isAdded?: boolean;
}

export const JsonLine: React.FC<JsonLineProps> = ({
  line,
  isAdded = false,
}) => {
  const className = isAdded ? "terminal-line json-added" : "terminal-line";
  const needsHighlighting = shouldHighlightLine(line);

  if (!needsHighlighting) {
    return <div className={className}>{line}</div>;
  }

  const highlighted = highlightJsonSyntax(line);

  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{ __html: highlighted }}
    />
  );
};
