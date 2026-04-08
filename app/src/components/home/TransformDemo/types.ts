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

export interface BeforeTerminalProps {
  isActive: boolean;
}

export interface CLITerminalProps {
  isActive: boolean;
  typedCommand: string;
  phase: AnimationPhase;
  showSpinner: boolean;
  showSuccess: boolean;
}

export interface AfterTerminalProps {
  isActive: boolean;
  appendixLines: number;
}

export interface JsonLineProps {
  line: string;
  isAdded?: boolean;
  className?: string;
}

export interface TransformDemoProps {
  shouldAnimate?: boolean;
  onComplete?: () => void;
}

export interface StepIndicatorProps {
  activeStep: number;
  phase: AnimationPhase;
  onStepClick: (step: number) => void;
}
