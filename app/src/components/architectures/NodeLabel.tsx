import React from "react";
import { nodeStyles } from "./styles";

export const NodeLabel = ({
  title,
  description,
  type = "default",
}: {
  title: string;
  description?: string;
  type?: keyof typeof nodeStyles;
}) => {
  const style = nodeStyles[type];
  const color = style.color;

  return (
    <article
      className="px-3 py-2 rounded transition-all hover:shadow-md flex flex-col items-center justify-center h-full"
      style={{
        border: style.border,
        background: style.background,
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      <p
        className="text-sm font-semibold leading-tight text-center"
        style={{ color, margin: 0 }}
      >
        {title}
      </p>
      {description && (
        <small className="text-xs opacity-75 leading-tight block mt-1 text-center"
          style={{ margin: 0 }}>
          {description}
        </small>
      )}
    </article>
  );
};