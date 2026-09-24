import type { KeepConstraint } from "../../types";
import { ANSI, FARMER } from "../../constants";
import { gray, green, defaultOutput, playShimmer } from "../utils";
import { ICON } from "../../constants";
import type { Output, TerminalGraphOptions } from "../types";
import { visibleLength } from "../format";
import {
  SHIMMER_DEFAULT_FRAME_INTERVAL_MS,
  SPINNER_FRAMES,
  SPINNER_INTERVAL_MS,
} from "../constants";
import { EMPTY_TREE_PREFIX, NOTICE_BOX_PADDING, TREE_CHARS } from "./constants";
import type {
  CompactSummaryData,
  Completer,
  ExecutiveSummaryData,
  OverrideInfo,
  OverridesMap,
  RemovedOverrideInfo,
  SecurityFixInfo,
  SpinnerControl,
  SpinnerPausedRunner,
  StateContainer,
  TerminalGraphState,
  TerminalTreeContext,
  TreeWriter,
  VulnerabilityInfo,
} from "./types";

const { BOLD, RESET, FG_RED, FG_WHITE } = ANSI;

const isDefined = <T>(value: T | undefined): value is T => value !== undefined;

export const noopOutput: Output = {
  write: () => {},
  writeLine: () => {},
  clearLine: () => {},
  hideCursor: () => {},
  showCursor: () => {},
};

const resolveOutput = (options: TerminalGraphOptions): Output => {
  if (options.quiet) return noopOutput;
  const output = options.out || defaultOutput;
  return output;
};

export const createState = <T>(initial: T): StateContainer<T> => {
  let current = initial;
  const state: StateContainer<T> = {
    get: () => current,
    set: (next: T) => {
      current = next;
    },
  };
  return state;
};

export const createInitialState = (): TerminalGraphState => {
  const ancestors: boolean[] = [];
  const spinner = {
    active: false,
    frame: 0,
    text: "",
    interval: null,
  };
  const progress = { current: 0, total: 0 };
  const state: TerminalGraphState = { phase: "idle", ancestors, spinner, progress };
  return state;
};

export const buildPrefix = (ancestors: boolean[]): string =>
  ancestors
    .map((continues) => {
      if (continues) {
        const result = `${TREE_CHARS.pipe}${TREE_CHARS.indent}`;
        return result;
      }
      return EMPTY_TREE_PREFIX;
    })
    .join("");

export const buildConnector = (isLast: boolean): string => {
  if (isLast) {
    const connector = TREE_CHARS.last;
    return connector;
  }
  const connector2 = TREE_CHARS.branch;
  return connector2;
};

export const composeLine = (...parts: (string | undefined)[]): string =>
  parts.filter(Boolean).join(" ");

export const buildTreeLine = (
  ancestors: boolean[],
  isLast: boolean,
  ...content: (string | undefined)[]
): string => composeLine(buildPrefix(ancestors) + buildConnector(isLast), ...content);

const pushAncestor = (state: StateContainer<TerminalGraphState>, continues: boolean): void => {
  const current = state.get();
  const ancestors = current.ancestors.concat(continues);
  state.set(Object.assign({}, current, { ancestors }));
};

const popAncestor = (state: StateContainer<TerminalGraphState>): void => {
  const current = state.get();
  const ancestors = current.ancestors.slice(0, -1);
  state.set(Object.assign({}, current, { ancestors }));
};

export const createTreeWriter = (
  out: Output,
  state: StateContainer<TerminalGraphState>,
): TreeWriter => ({
  line: (isLast, ...content) => {
    const { ancestors } = state.get();
    out.writeLine(buildTreeLine(ancestors, isLast, ...content));
  },

  open: (continues = true) => pushAncestor(state, continues),

  close: () => popAncestor(state),

  nested: (isLast, fn) => {
    pushAncestor(state, !isLast);
    try {
      fn();
    } finally {
      popAncestor(state);
    }
  },
});

const setSpinnerFrame = (state: StateContainer<TerminalGraphState>, frame: number): void => {
  const current = state.get();
  const spinner = Object.assign({}, current.spinner, { frame });
  state.set(Object.assign({}, current, { spinner }));
};

const advanceFrame = (state: StateContainer<TerminalGraphState>): void => {
  const current = state.get();
  const nextFrame = (current.spinner.frame + 1) % SPINNER_FRAMES.length;
  setSpinnerFrame(state, nextFrame);
};

const startSpinnerInterval = (render: () => void, advance: () => void): NodeJS.Timeout =>
  setInterval(() => {
    render();
    advance();
  }, SPINNER_INTERVAL_MS);

const clearSpinnerInterval = (interval: NodeJS.Timeout | null): void => {
  if (interval === null) return;
  clearInterval(interval);
};

const renderTreeSpinner = (out: Output, state: StateContainer<TerminalGraphState>): void => {
  const current = state.get();
  const frame = SPINNER_FRAMES[current.spinner.frame];
  const prefix = buildPrefix(current.ancestors);
  out.clearLine();
  out.write(`${prefix}${frame} ${current.spinner.text}`);
};

const setSpinnerActive = (
  state: StateContainer<TerminalGraphState>,
  text: string,
  interval: NodeJS.Timeout,
): void => {
  const current = state.get();
  const spinner = Object.assign({}, current.spinner, { active: true, text, interval });
  state.set(Object.assign({}, current, { spinner }));
};

const setSpinnerInactive = (state: StateContainer<TerminalGraphState>): void => {
  const current = state.get();
  const spinner = Object.assign({}, current.spinner, { active: false, interval: null });
  state.set(Object.assign({}, current, { spinner }));
};

const createSpinnerStarter =
  (
    out: Output,
    state: StateContainer<TerminalGraphState>,
    render: () => void,
  ): SpinnerControl["start"] =>
  (text) => {
    out.hideCursor();
    const interval = startSpinnerInterval(render, () => advanceFrame(state));
    setSpinnerActive(state, text, interval);
  };

const createSpinnerStopper =
  (out: Output, state: StateContainer<TerminalGraphState>): SpinnerControl["stop"] =>
  () => {
    clearSpinnerInterval(state.get().spinner.interval);
    setSpinnerInactive(state);
    out.clearLine();
    out.showCursor();
  };

const createSpinnerActiveReader =
  (state: StateContainer<TerminalGraphState>): SpinnerControl["isActive"] =>
  () =>
    state.get().spinner.active;

export const createSpinnerControl = (
  out: Output,
  state: StateContainer<TerminalGraphState>,
): SpinnerControl => {
  const render = () => renderTreeSpinner(out, state);
  const start = createSpinnerStarter(out, state, render);
  const stop = createSpinnerStopper(out, state);
  const isActive = createSpinnerActiveReader(state);
  const spinnerControl: SpinnerControl = {
    start,
    stop,
    isActive,
    render,
  };
  return spinnerControl;
};

export const withSpinnerPaused =
  (spinner: SpinnerControl): SpinnerPausedRunner =>
  <T>(action: () => T): T => {
    spinner.stop();
    const result = action();
    return result;
  };

export const createShimmerCompleter =
  (out: Output): Completer =>
  (text, prefix, suffix) =>
    playShimmer(text, SHIMMER_DEFAULT_FRAME_INTERVAL_MS, out, prefix, suffix);

export const createTerminalTreeContext = (options: TerminalGraphOptions): TerminalTreeContext => {
  const out = resolveOutput(options);
  const state = createState(createInitialState());
  const tree = createTreeWriter(out, state);
  const spinner = createSpinnerControl(out, state);
  const paused = withSpinnerPaused(spinner);
  const completer = createShimmerCompleter(out);

  const terminalTreeContext: TerminalTreeContext = { out, state, tree, spinner, paused, completer };
  return terminalTreeContext;
};

export const buildBannerOutput = (): string =>
  ["", `${FARMER} ${green("Pastoralist")}`, ""].join("\n");

export const buildProgressText = (current: number, total: number, item: string): string =>
  `${item} (${current}/${total})`;

export const buildVulnerabilityHeader = (info: VulnerabilityInfo): string => {
  const severity = info.severity.toUpperCase();
  const vulnerabilityHeader = `[${severity}] ${info.packageName}@${info.currentVersion}`;
  return vulnerabilityHeader;
};

export const selectVulnerabilityIcon = (fixAvailable: boolean): string => {
  if (fixAvailable) {
    const result = ICON.warning;
    return result;
  }
  const result2 = ICON.error;
  return result2;
};

export const formatCves = (cves: string[] | undefined): string | undefined => {
  if (!cves) return undefined;
  if (cves.length === 0) return undefined;
  const cves2 = `CVE: ${cves.join(", ")}`;
  return cves2;
};

export const formatVulnerabilityFix = (
  fixAvailable: boolean,
  patchedVersion: string | undefined,
): string => {
  if (!fixAvailable) return "No fix available";
  if (!patchedVersion) return "No fix available";
  const vulnerabilityFix = `Fix: upgrade to ${patchedVersion}`;
  return vulnerabilityFix;
};

export const buildVulnerabilityDetails = (info: VulnerabilityInfo): string[] => {
  const cve = formatCves(info.cves);
  const fix = formatVulnerabilityFix(info.fixAvailable, info.patchedVersion);
  const vulnerabilityDetails = [info.title, cve, fix, info.url].filter(isDefined);
  return vulnerabilityDetails;
};

export const buildOverrideHeader = (info: OverrideInfo): string =>
  `${info.packageName}@${info.version}`;

export const selectOverrideIcon = (
  isSecurityFix: boolean | undefined,
  keep: boolean | KeepConstraint | undefined,
): string => {
  if (keep) {
    const result = ICON.info;
    return result;
  }
  if (isSecurityFix) {
    const result2 = ICON.warning;
    return result2;
  }
  const result3 = ICON.success;
  return result3;
};

export const formatPatches = (patches: string[] | undefined): string | undefined => {
  if (!patches) return undefined;
  if (patches.length === 0) return undefined;
  const patches2 = `Patches: ${patches.join(", ")}`;
  return patches2;
};

export const formatDependentCount = (
  dependents: Record<string, string> | undefined,
): string | undefined => {
  const count = Object.keys(dependents ?? {}).length;
  if (count === 0) return undefined;
  const isSingle = count === 1;
  const plural = isSingle ? "" : "s";
  const dependentCount = `Used by: ${count} package${plural}`;
  return dependentCount;
};

export const formatKeepStatus = (
  keep: boolean | KeepConstraint | undefined,
): string | undefined => {
  if (!keep) return undefined;
  const hasKeepReason = typeof keep === "object" && keep.reason;
  if (hasKeepReason) {
    const keepStatus = `Kept: ${keep.reason}`;
    return keepStatus;
  }
  return "Kept by user";
};

export const formatPotentiallyFixedIn = (version: string | undefined): string | undefined => {
  if (!version) return undefined;
  const potentiallyFixedIn = `Potentially fixed in ${version}, maybe removable`;
  return potentiallyFixedIn;
};

type StructuredLedgerReason = Extract<NonNullable<OverrideInfo["reason"]>, object>;

const formatReasonValue = (label: string, value: string | undefined): string | undefined => {
  if (!value) return undefined;
  const reasonValue = `${label}: ${value}`;
  return reasonValue;
};

const formatReasonList = (label: string, values: string[] | undefined): string | undefined => {
  if (!values?.length) return undefined;
  const reasonList = `${label}: ${values.join(", ")}`;
  return reasonList;
};

const formatProjectReason = (reason: StructuredLedgerReason): string[] => {
  if (reason.type !== "project") {
    const projectReason: string[] = [];
    return projectReason;
  }
  const pin = formatReasonValue("Pin", reason.pin);
  const patch = formatReasonValue("Patch", reason.patch);
  const constraints = formatReasonList("Constraints", reason.constraints);
  const references = formatReasonList("References", reason.references);
  const projectReason2 = [reason.summary, pin, patch, constraints, references].filter(isDefined);
  return projectReason2;
};

const getOptimalityLabel = (provenOptimal: boolean): string => {
  if (provenOptimal) return "optimal";
  return "bounded";
};

const formatBestCaseReason = (reason: StructuredLedgerReason): string[] => {
  if (reason.type !== "best-case") {
    const bestCaseReason: string[] = [];
    return bestCaseReason;
  }
  const optimality = getOptimalityLabel(reason.search.provenOptimal);
  const { evaluatedStates: states } = reason.search;
  const search = `Decision: ${reason.decisionId} (${optimality}, ${states} states)`;
  const impact = reason.impact;
  const impactText = `Impact: ${impact.fixedVulnerabilities} fixed, ${impact.introducedVulnerabilities} introduced, ${impact.remainingVulnerabilities} remaining`;
  const bestCaseReason2: string[] = [reason.summary, search, impactText];
  return bestCaseReason2;
};

export const formatLedgerReason = (reason: OverrideInfo["reason"]): string[] => {
  if (!reason) {
    const ledgerReason: string[] = [];
    return ledgerReason;
  }
  if (typeof reason === "string") {
    const ledgerReason2: string[] = [reason];
    return ledgerReason2;
  }
  if (reason.type === "project") {
    const ledgerReason3 = formatProjectReason(reason);
    return ledgerReason3;
  }
  const ledgerReason4 = formatBestCaseReason(reason);
  return ledgerReason4;
};

export const buildOverrideDetails = (info: OverrideInfo): string[] => {
  const cve = formatCves(info.cves);
  const patches = formatPatches(info.patches);
  const dependents = formatDependentCount(info.dependents);
  const kept = formatKeepStatus(info.keep);
  const fixedIn = formatPotentiallyFixedIn(info.potentiallyFixedIn);
  const reason = formatLedgerReason(info.reason);
  const otherDetails = [cve, patches, dependents, kept, fixedIn].filter(isDefined);
  const overrideDetails = reason.concat(otherDetails);
  return overrideDetails;
};

export const buildSecurityFixHeader = (info: SecurityFixInfo): string =>
  `${info.packageName}@${info.toVersion}`;

export const formatBlockedCves = (cves: string[] | undefined): string | undefined => {
  if (!cves) return undefined;
  if (cves.length === 0) return undefined;
  const blockedCves = `Blocks ${cves.join(", ")}`;
  return blockedCves;
};

export const buildSecurityFixDetails = (info: SecurityFixInfo): string[] => {
  const upgrade = `${info.fromVersion} → ${info.toVersion}`;
  const cves = formatBlockedCves(info.cves);
  const securityFixDetails = [upgrade, cves, info.reason].filter(isDefined);
  return securityFixDetails;
};

export const buildRemovedOverrideHeader = (info: RemovedOverrideInfo): string =>
  `${info.packageName}@${info.version}`;

const pluralize = (count: number, singular: string, plural: string): string => {
  if (count === 1) return singular;
  return plural;
};

const buildVulnerabilityFixedLine = (count: number): string => {
  const suffix = pluralize(count, "y", "ies");
  const vulnerabilityFixedLine = `${ICON.CHECK} ${count} vulnerabilit${suffix} fixed`;
  return vulnerabilityFixedLine;
};

const buildStaleRemovedLine = (count: number): string => {
  const suffix = pluralize(count, "", "s");
  const staleRemovedLine = `${ICON.CHECK} ${count} stale override${suffix} removed`;
  return staleRemovedLine;
};

const buildPackagesProtectedLine = (count: number): string => {
  const suffix = pluralize(count, "", "s");
  const packagesProtectedLine = `${ICON.SHIELD} ${count} package${suffix} protected`;
  return packagesProtectedLine;
};

export const buildExecutiveSummaryLines = (data: ExecutiveSummaryData): string[] =>
  [
    data.vulnerabilitiesFixed ? buildVulnerabilityFixedLine(data.vulnerabilitiesFixed) : undefined,
    data.staleOverridesRemoved ? buildStaleRemovedLine(data.staleOverridesRemoved) : undefined,
    data.packagesProtected ? buildPackagesProtectedLine(data.packagesProtected) : undefined,
  ].filter(isDefined);

export const buildCompactSummaryLine = (data: CompactSummaryData): string => {
  const sep = gray(" . ");
  const parts = [
    `${ICON.error} ${data.severityCritical} crit`,
    `${ICON.warning} ${data.severityHigh} high`,
    `${ICON.info} ${data.severityMedium} med`,
    `${ICON.check} ${data.severityLow} low`,
    `${ICON.arrow} ${data.overridesTracked} tracked`,
    `${ICON.skip} ${data.overridesRemoved} removed`,
    `${data.packagesScanned} scanned`,
  ];
  const compactSummaryLine = parts.join(sep);
  return compactSummaryLine;
};

export const writeDetailLines = (tree: TreeWriter, details: string[]): void => {
  const lastIndex = details.length - 1;
  details.forEach((text, index) => tree.line(index === lastIndex, text));
};

export const writeOptionalDetails = (
  tree: TreeWriter,
  isLast: boolean,
  details: string[],
): void => {
  if (details.length === 0) return;
  tree.nested(isLast, () => writeDetailLines(tree, details));
};

const writeOverrideRows = (tree: TreeWriter, overrides: OverridesMap): void => {
  const keys = Object.keys(overrides);
  const lastIndex = keys.length - 1;
  keys.forEach((key, index) => {
    tree.line(index === lastIndex, `${key}: ${overrides[key]}`);
  });
};

export const writeOverridesSection = (
  tree: TreeWriter,
  overrides: OverridesMap,
  isLast: boolean,
): void => {
  const keys = Object.keys(overrides);
  if (keys.length === 0) return;
  tree.line(isLast, "Overrides");
  tree.nested(isLast, () => writeOverrideRows(tree, overrides));
};

export const writeChangesSection = (tree: TreeWriter, changes: string[] | undefined): void => {
  if (!changes) return;
  if (changes.length === 0) return;
  const lastIndex = changes.length - 1;
  tree.line(true, "Changes");
  tree.nested(true, () => {
    changes.forEach((change, index) => {
      tree.line(index === lastIndex, change);
    });
  });
};

const selectDashColor = (index: number): string => {
  if (index % 2 === 0) return FG_RED;
  return FG_WHITE;
};

const buildDashedBorder = (width: number): string =>
  Array.from({ length: width }, (_, index) => {
    const color = selectDashColor(index);
    const result = `${color}-${RESET}`;
    return result;
  }).join("");

const padNoticeText = (text: string): string => {
  const padding = " ".repeat(NOTICE_BOX_PADDING);
  const paddedText = padding + text + padding;
  return paddedText;
};

const styleNoticeText = (text: string): string =>
  `${FG_RED}|${RESET}${BOLD}${FG_WHITE}${text}${RESET}${FG_RED}|${RESET}`;

export const buildNoticeBox = (text: string): string[] => {
  const innerWidth = visibleLength(text) + NOTICE_BOX_PADDING * 2;
  const border = buildDashedBorder(innerWidth + 2);
  const styledText = styleNoticeText(padNoticeText(text));
  const noticeBox: string[] = [border, styledText, border];
  return noticeBox;
};
