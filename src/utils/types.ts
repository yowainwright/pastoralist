export type SpinnerState = {
  text: string;
  isSpinning: boolean;
  frameIndex: number;
  interval: NodeJS.Timeout | null;
};

export type Spinner = {
  start: () => Spinner;
  stop: () => Spinner;
  succeed: (text?: string) => Spinner;
  fail: (text?: string) => Spinner;
  info: (text?: string) => Spinner;
  warn: (text?: string) => Spinner;
};

export type RGB = {
  r: number;
  g: number;
  b: number;
};

export type GradientFunction = (text: string) => string;
