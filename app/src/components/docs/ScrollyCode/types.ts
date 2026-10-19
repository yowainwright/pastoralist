import type { walkthroughs } from "./constants";
import type more from "./more-examples.json";
import type { ReactNode, RefObject } from "react";

export type Frame = {
  id: string;
  title: string;
  code: string;
  lang: "bash" | "json" | "text" | "ansi";
  filename: string;
  note: string;
  calloutTarget?: string;
};

export type Walkthrough = readonly [command: Frame, result: Frame];
export type ScrollyCodeProps = { example: keyof typeof walkthroughs };
export type CalloutScopeProps = { contentRef: RefObject<HTMLElement | null> };
export type ScrollyCodeProviderProps = CalloutScopeProps & { children: ReactNode };
export type CalloutCandidate = { id: string; distance: number };
export type CalloutBounds = { id: string; top: number; bottom: number };
export type CalloutEvent = { type: "viewport"; candidates: CalloutCandidate[] };
export type FramesProps = { frames: readonly Frame[] };
export type PanelFrameProps = { frame: Frame; position: string };
export type AnimatedCodeProps = { html: string };
export type CodeFrameProps = { frame: Frame };
export type CalloutProps = CodeFrameProps & {
  panel?: HTMLElement | null;
  visible: boolean;
  descriptionId: string;
};
export type CalloutContentProps = Pick<CalloutProps, "frame" | "panel" | "descriptionId">;
export type SummaryReport = typeof more.doctorReport;
export type TokenAnimationOptions = { selector: string; duration: number };

export type LinkProps = {
  frame: Frame;
  index: number;
  selectedIndex: number;
  onSelect: (index: number) => void;
};
