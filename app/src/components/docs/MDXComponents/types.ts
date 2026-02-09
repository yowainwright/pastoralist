import type { ComponentProps, ReactNode } from "react";

export interface PreProps extends ComponentProps<"pre"> {
  children?: ReactNode;
  "data-language"?: string;
  "data-mermaid-content"?: string;
}

export interface AnchorProps extends ComponentProps<"a"> {}
