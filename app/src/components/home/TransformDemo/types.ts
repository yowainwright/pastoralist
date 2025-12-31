export type AnimationPhase =
  | "idle"
  | "step1"
  | "step2"
  | "checking"
  | "step3"
  | "complete";

export interface PopoverProps {
  stepNumber: number;
  title: string;
  description: string;
  visible: boolean;
  showEmoji?: boolean;
  verticalCenter?: boolean;
}
