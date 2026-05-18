import type { KeepConstraint } from "../types";

export type Output = {
  write: (text: string) => void;
  writeLine: (text: string) => void;
  clearLine: () => void;
  hideCursor: () => void;
  showCursor: () => void;
};

export interface BoxOptions {
  width?: number;
  padding?: number;
  title?: string;
}

export interface ProgressOptions {
  width?: number;
  filled?: string;
  empty?: string;
  showPercent?: boolean;
}

export type PromptChoiceOption = {
  name: string;
  value: string;
};

export type HintCache = Record<string, number>;

export type RgbTuple = [number, number, number];

export type TruncateState = {
  result: string;
  visibleCount: number;
  hasOpenAnsi: boolean;
  isTruncated: boolean;
};

export type AnsiMatch = RegExpMatchArray & { index: number };

export type SpinnerState = {
  text: string;
  isSpinning: boolean;
  frameIndex: number;
  interval: NodeJS.Timeout | null;
};

export interface TerminalGraphOptions {
  out?: Output;
  quiet?: boolean;
}

export type Spinner = {
  start: () => Spinner;
  stop: () => Spinner;
  succeed: (text?: string) => Spinner;
  fail: (text?: string) => Spinner;
  info: (text?: string) => Spinner;
  warn: (text?: string) => Spinner;
  update: (text: string) => Spinner;
};

export type TerminalPhase =
  | "idle"
  | "banner"
  | "scanning"
  | "analyzing"
  | "resolving"
  | "writing"
  | "complete";

export type TerminalGraphState = {
  phase: TerminalPhase;
  ancestors: boolean[];
  spinner: {
    active: boolean;
    frame: number;
    text: string;
    interval: NodeJS.Timeout | null;
  };
  progress: {
    current: number;
    total: number;
  };
};

export type OverridesMap = Record<string, string>;

export type VulnerabilityInfo = {
  severity: string;
  packageName: string;
  currentVersion: string;
  title: string;
  cves?: string[];
  fixAvailable: boolean;
  patchedVersion?: string;
  url?: string;
};

export type OverrideInfo = {
  packageName: string;
  version: string;
  reason?: string;
  dependents?: Record<string, string>;
  patches?: string[];
  isSecurityFix?: boolean;
  cves?: string[];
  keep?: boolean | KeepConstraint;
  potentiallyFixedIn?: string;
};

export type SecurityFixInfo = {
  packageName: string;
  fromVersion: string;
  toVersion: string;
  cves?: string[];
  severity?: string;
  reason?: string;
};

export type RemovedOverrideInfo = {
  packageName: string;
  version: string;
  reason: string;
};

export interface ExecutiveSummaryData {
  vulnerabilitiesFixed?: number;
  staleOverridesRemoved?: number;
  packagesProtected?: number;
}

export interface CompactSummaryData {
  severityCritical: number;
  severityHigh: number;
  severityMedium: number;
  severityLow: number;
  overridesTracked: number;
  overridesRemoved: number;
  packagesScanned: number;
}

export type TerminalGraph = {
  banner: () => TerminalGraph;
  startPhase: (phase: TerminalPhase, text: string, isLast?: boolean) => TerminalGraph;
  progress: (current: number, total: number, item: string) => TerminalGraph;
  item: (text: string, isLast?: boolean) => TerminalGraph;
  vulnerability: (info: VulnerabilityInfo, isLast?: boolean) => TerminalGraph;
  override: (info: OverrideInfo, isLast?: boolean) => TerminalGraph;
  securityFix: (info: SecurityFixInfo, isLast?: boolean) => TerminalGraph;
  removedOverride: (info: RemovedOverrideInfo, isLast?: boolean) => TerminalGraph;
  endPhase: (text?: string) => TerminalGraph;
  summary: (overrides: OverridesMap, changes?: string[]) => TerminalGraph;
  executiveSummary: (data: ExecutiveSummaryData) => TerminalGraph;
  compactSummary: (data: CompactSummaryData) => TerminalGraph;
  complete: (text: string, suffix?: string) => TerminalGraph;
  notice: (text: string) => TerminalGraph;
  stop: () => TerminalGraph;
};
