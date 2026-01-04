import { shouldHighlightLine, highlightJsonSyntax } from "./constants";

interface JsonLineProps {
  line: string;
  isAdded?: boolean;
  className?: string;
}

export const JsonLine: React.FC<JsonLineProps> = ({
  line,
  isAdded = false,
  className: extraClassName,
}) => {
  const baseClassName = isAdded ? "terminal-line json-added" : "terminal-line";
  const className = extraClassName
    ? `${baseClassName} ${extraClassName}`
    : baseClassName;
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
