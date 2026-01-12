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
  cve?: string;
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
  cve?: string;
};

export type SecurityFixInfo = {
  packageName: string;
  fromVersion: string;
  toVersion: string;
  cve?: string;
  severity?: string;
  reason?: string;
};

export type RemovedOverrideInfo = {
  packageName: string;
  version: string;
  reason: string;
};

export type TerminalGraph = {
  banner: () => TerminalGraph;
  startPhase: (phase: TerminalPhase, text: string) => TerminalGraph;
  progress: (current: number, total: number, item: string) => TerminalGraph;
  item: (text: string, isLast?: boolean) => TerminalGraph;
  vulnerability: (info: VulnerabilityInfo, isLast?: boolean) => TerminalGraph;
  override: (info: OverrideInfo, isLast?: boolean) => TerminalGraph;
  securityFix: (info: SecurityFixInfo, isLast?: boolean) => TerminalGraph;
  removedOverride: (
    info: RemovedOverrideInfo,
    isLast?: boolean,
  ) => TerminalGraph;
  endPhase: (text?: string) => TerminalGraph;
  summary: (overrides: OverridesMap, changes?: string[]) => TerminalGraph;
  complete: (text: string, suffix?: string) => TerminalGraph;
  notice: (text: string) => TerminalGraph;
  stop: () => TerminalGraph;
};
