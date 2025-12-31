import type { ComponentProps, ReactNode } from "react";

export interface PreProps extends ComponentProps<"pre"> {
  children?: ReactNode;
}

export interface AnchorProps extends ComponentProps<"a"> {}
