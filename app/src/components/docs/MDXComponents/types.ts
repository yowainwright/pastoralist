import type { ComponentProps, ReactNode } from "react";

export type HeadingLevel = "h1" | "h2" | "h3" | "h4" | "h5" | "h6";

export interface HeadingProps extends ComponentProps<"h2"> {
  level: HeadingLevel;
}

export interface PreProps extends ComponentProps<"pre"> {
  children?: ReactNode;
  "data-language"?: string;
  "data-mermaid-content"?: string;
}

export interface AnchorProps extends ComponentProps<"a"> {}
