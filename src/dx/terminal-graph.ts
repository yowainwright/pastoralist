import type {
  TerminalGraphState,
  TerminalGraph,
  TerminalPhase,
  TerminalGraphOptions,
  ExecutiveSummaryData,
  OverridesMap,
  VulnerabilityInfo,
  OverrideInfo,
  SecurityFixInfo,
  RemovedOverrideInfo,
} from "./types";
import type { Output } from "./output";
import { defaultOutput } from "./output";
import { playShimmer } from "./shimmer";
import { FARMER, ANSI } from "../constants";
import { ICON } from "../utils/icons";
import { green } from "../utils/colors";
import { visibleLength } from "./format";

const { BOLD, RESET, FG_RED, FG_WHITE } = ANSI;

const FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

const TREE = {
  pipe: "│",
  branch: "├──",
  last: "└──",
  indent: "   ",
};

type StateContainer<T> = {
  get: () => T;
  set: (next: T) => void;
};

const createState = <T>(initial: T): StateContainer<T> => {
  let current = initial;
  return {
    get: () => current,
    set: (next: T) => {
      current = next;
    },
  };
};

const createInitialState = (): TerminalGraphState => ({
  phase: "idle",
  ancestors: [],
  spinner: {
    active: false,
    frame: 0,
    text: "",
    interval: null,
  },
  progress: {
    current: 0,
    total: 0,
  },
});

const buildPrefix = (ancestors: boolean[]): string =>
  ancestors
    .map((continues) => (continues ? `${TREE.pipe}${TREE.indent}` : `    `))
    .join("");

const buildConnector = (isLast: boolean): string =>
  isLast ? TREE.last : TREE.branch;

const composeLine = (...parts: (string | undefined)[]): string =>
  parts.filter(Boolean).join(" ");

const buildTreeLine = (
  ancestors: boolean[],
  isLast: boolean,
  ...content: (string | undefined)[]
): string =>
  composeLine(buildPrefix(ancestors) + buildConnector(isLast), ...content);

type TreeWriter = {
  line: (isLast: boolean, ...content: (string | undefined)[]) => void;
  open: () => void;
  close: () => void;
  nested: (isLast: boolean, fn: () => void) => void;
};

const createTreeWriter = (
  out: Output,
  state: StateContainer<TerminalGraphState>,
): TreeWriter => ({
  line: (isLast, ...content) => {
    const { ancestors } = state.get();
    out.writeLine(buildTreeLine(ancestors, isLast, ...content));
  },

  open: () => {
    const s = state.get();
    state.set({ ...s, ancestors: [...s.ancestors, true] });
  },

  close: () => {
    const s = state.get();
    state.set({ ...s, ancestors: s.ancestors.slice(0, -1) });
  },

  nested: (isLast, fn) => {
    const s = state.get();
    state.set({ ...s, ancestors: [...s.ancestors, !isLast] });
    fn();
    const after = state.get();
    state.set({ ...after, ancestors: after.ancestors.slice(0, -1) });
  },
});

type SpinnerControl = {
  start: (text: string) => void;
  stop: () => void;
  isActive: () => boolean;
  render: () => void;
};

const createSpinnerControl = (
  out: Output,
  state: StateContainer<TerminalGraphState>,
): SpinnerControl => {
  const render = () => {
    const s = state.get();
    const frame = FRAMES[s.spinner.frame];
    const prefix = buildPrefix(s.ancestors);
    out.clearLine();
    out.write(`${prefix}${frame} ${s.spinner.text}`);
  };

  const advanceFrame = () => {
    const s = state.get();
    const nextFrame = (s.spinner.frame + 1) % FRAMES.length;
    state.set({ ...s, spinner: { ...s.spinner, frame: nextFrame } });
  };

  return {
    start: (text) => {
      out.hideCursor();
      const s = state.get();
      const interval = setInterval(() => {
        render();
        advanceFrame();
      }, 80);
      state.set({
        ...s,
        spinner: { ...s.spinner, active: true, text, interval },
      });
    },

    stop: () => {
      const s = state.get();
      const interval = s.spinner.interval;
      if (interval !== null) {
        clearInterval(interval);
      }
      state.set({
        ...s,
        spinner: { ...s.spinner, active: false, interval: null },
      });
      out.clearLine();
      out.showCursor();
    },

    isActive: () => state.get().spinner.active,
    render,
  };
};

const withSpinnerPaused =
  (spinner: SpinnerControl) =>
  <T>(action: () => T): T => {
    spinner.stop();
    return action();
  };

type Completer = (text: string, prefix: string, suffix: string) => void;

const createShimmerCompleter =
  (out: Output): Completer =>
  (text, prefix, suffix) => {
    playShimmer(text, 50, out, prefix, suffix);
  };

const formatCve = (cve: string | undefined): string | undefined => {
  if (!cve) return undefined;
  return `CVE: ${cve}`;
};

const formatVulnFix = (
  fixAvailable: boolean,
  patchedVersion: string | undefined,
): string => {
  const canFix = fixAvailable && patchedVersion;
  if (!canFix) return "No fix available";
  return `Fix: upgrade to ${patchedVersion}`;
};

const buildVulnDetails = (info: VulnerabilityInfo): string[] => {
  const cve = formatCve(info.cve);
  const fix = formatVulnFix(info.fixAvailable, info.patchedVersion);
  return [info.title, cve, fix, info.url].filter(
    (x): x is string => x !== undefined,
  );
};

const selectVulnIcon = (fixAvailable: boolean): string => {
  if (fixAvailable) return ICON.warning;
  return ICON.error;
};

const formatPatches = (patches: string[] | undefined): string | undefined => {
  const hasPatches = patches && patches.length > 0;
  if (!hasPatches) return undefined;
  return `Patches: ${patches.join(", ")}`;
};

const formatDependentCount = (
  dependents: Record<string, string> | undefined,
): string | undefined => {
  const keys = Object.keys(dependents ?? {});
  const count = keys.length;
  if (count === 0) return undefined;
  const plural = count === 1 ? "" : "s";
  return `Used by: ${count} package${plural}`;
};

const buildOverrideDetails = (info: OverrideInfo): string[] => {
  const cve = formatCve(info.cve);
  const patches = formatPatches(info.patches);
  const dependents = formatDependentCount(info.dependents);
  return [info.reason, cve, patches, dependents].filter(
    (x): x is string => x !== undefined,
  );
};

const selectOverrideIcon = (isSecurityFix: boolean | undefined): string => {
  if (isSecurityFix) return ICON.warning;
  return ICON.success;
};

const buildSecurityFixDetails = (info: SecurityFixInfo): string[] => {
  const upgrade = `${info.fromVersion} → ${info.toVersion}`;
  const cve = info.cve ? `Blocks ${info.cve}` : undefined;
  return [upgrade, cve, info.reason].filter(
    (x): x is string => x !== undefined,
  );
};

const writeDetailLines = (tree: TreeWriter, details: string[]): void => {
  const lastIndex = details.length - 1;
  details.forEach((text, i) => tree.line(i === lastIndex, text));
};

const selectDashColor = (index: number): string => {
  const isEven = index % 2 === 0;
  return isEven ? FG_RED : FG_WHITE;
};

const buildDashedBorder = (width: number): string => {
  const indices = Array.from({ length: width }, (_, i) => i);
  const dashes = indices.map((i) => {
    const color = selectDashColor(i);
    return `${color}-${RESET}`;
  });
  return dashes.join("");
};

const buildNoticeBox = (text: string): string[] => {
  const padding = 2;
  const innerWidth = visibleLength(text) + padding * 2;
  const border = buildDashedBorder(innerWidth + 2);
  const paddedText = " ".repeat(padding) + text + " ".repeat(padding);
  const styledText = `${FG_RED}|${RESET}${BOLD}${FG_WHITE}${paddedText}${RESET}${FG_RED}|${RESET}`;
  return [border, styledText, border];
};

const noopOutput: Output = {
  write: () => {},
  writeLine: () => {},
  clearLine: () => {},
  hideCursor: () => {},
  showCursor: () => {},
};

export const createTerminalGraph = (
  options: TerminalGraphOptions = {},
): TerminalGraph => {
  const out = options.quiet ? noopOutput : options.out || defaultOutput;
  const state = createState(createInitialState());
  const tree = createTreeWriter(out, state);
  const spinner = createSpinnerControl(out, state);
  const paused = withSpinnerPaused(spinner);
  const completer = createShimmerCompleter(out);

  const methods: TerminalGraph = {
    banner: () => {
      paused(() => {
        // Batch output to avoid race condition
        const bannerOutput = ["", `${FARMER} ${green("Pastoralist")}`, ""].join(
          "\n",
        );
        out.writeLine(bannerOutput);
      });
      return methods;
    },

    startPhase: (phase: TerminalPhase, text: string) => {
      paused(() => {
        const s = state.get();
        state.set({ ...s, phase });
        tree.line(false, text);
        tree.open();
      });
      return methods;
    },

    progress: (current: number, total: number, item: string) => {
      const s = state.get();
      const text = `${item} (${current}/${total})`;
      state.set({
        ...s,
        spinner: { ...s.spinner, text },
        progress: { current, total },
      });

      const isFirstItem = current === 1;
      if (isFirstItem && !spinner.isActive()) {
        spinner.start(text);
      }

      return methods;
    },

    item: (text: string, isLast = false) => {
      paused(() => tree.line(isLast, ICON.success, text));
      return methods;
    },

    vulnerability: (info: VulnerabilityInfo, isLast = false) => {
      paused(() => {
        const icon = selectVulnIcon(info.fixAvailable);
        const severity = info.severity.toUpperCase();
        const header = `[${severity}] ${info.packageName}@${info.currentVersion}`;
        const details = buildVulnDetails(info);

        tree.line(isLast, icon, header);
        tree.nested(isLast, () => writeDetailLines(tree, details));
      });
      return methods;
    },

    override: (info: OverrideInfo, isLast = false) => {
      paused(() => {
        const icon = selectOverrideIcon(info.isSecurityFix);
        const header = `${info.packageName}@${info.version}`;
        const details = buildOverrideDetails(info);

        tree.line(isLast, icon, header);

        const hasDetails = details.length > 0;
        if (!hasDetails) return;

        tree.nested(isLast, () => writeDetailLines(tree, details));
      });
      return methods;
    },

    securityFix: (info: SecurityFixInfo, isLast = false) => {
      paused(() => {
        const header = `${info.packageName}@${info.toVersion}`;
        const details = buildSecurityFixDetails(info);

        tree.line(isLast, ICON.success, header);

        const hasDetails = details.length > 0;
        if (!hasDetails) return;

        tree.nested(isLast, () => writeDetailLines(tree, details));
      });
      return methods;
    },

    removedOverride: (info: RemovedOverrideInfo, isLast = false) => {
      paused(() => {
        const header = `${info.packageName}@${info.version}`;
        tree.line(isLast, ICON.info, header);
        tree.nested(isLast, () => tree.line(true, info.reason));
      });
      return methods;
    },

    endPhase: (text?: string) => {
      paused(() => {
        if (text) {
          tree.line(true, ICON.success, text);
        }
        tree.close();
      });
      return methods;
    },

    summary: (overrides: OverridesMap, changes?: string[]) => {
      paused(() => {
        const overrideKeys = Object.keys(overrides);
        const hasOverrides = overrideKeys.length > 0;
        const hasChanges = changes && changes.length > 0;

        if (hasOverrides) {
          tree.line(!hasChanges, "Overrides");
          tree.nested(!hasChanges, () => {
            overrideKeys.forEach((key, i) => {
              const isLastOverride = i === overrideKeys.length - 1;
              tree.line(isLastOverride, `${key}: ${overrides[key]}`);
            });
          });
        }

        if (hasChanges) {
          tree.line(true, "Changes");
          tree.nested(true, () => {
            changes.forEach((change, i) => {
              const isLastChange = i === changes.length - 1;
              tree.line(isLastChange, change);
            });
          });
        }
      });
      return methods;
    },

    executiveSummary: (data: ExecutiveSummaryData) => {
      paused(() => {
        const hasVulnFixes =
          data.vulnerabilitiesFixed && data.vulnerabilitiesFixed > 0;
        const hasStaleRemoved =
          data.staleOverridesRemoved && data.staleOverridesRemoved > 0;
        const hasProtected =
          data.packagesProtected && data.packagesProtected > 0;

        out.writeLine("");
        if (hasVulnFixes) {
          const plural = data.vulnerabilitiesFixed === 1 ? "y" : "ies";
          out.writeLine(
            `${ICON.CHECK} ${data.vulnerabilitiesFixed} vulnerabilit${plural} fixed`,
          );
        }
        if (hasStaleRemoved) {
          const plural = data.staleOverridesRemoved === 1 ? "" : "s";
          out.writeLine(
            `${ICON.CHECK} ${data.staleOverridesRemoved} stale override${plural} removed`,
          );
        }
        if (hasProtected) {
          const plural = data.packagesProtected === 1 ? "" : "s";
          out.writeLine(
            `${ICON.SHIELD} ${data.packagesProtected} package${plural} protected`,
          );
        }
      });
      return methods;
    },

    complete: (text: string, suffix: string = "") => {
      paused(() => {
        const s = state.get();
        state.set({ ...s, phase: "complete", ancestors: [] });
        const prefix = buildPrefix([]) + buildConnector(true);
        completer(text, prefix, suffix);
      });
      return methods;
    },

    notice: (text: string) => {
      paused(() => {
        const lines = buildNoticeBox(text);
        out.writeLine("");
        lines.forEach((line) => out.writeLine(line));
        out.writeLine("");
      });
      return methods;
    },

    stop: () => {
      spinner.stop();
      return methods;
    },
  };

  return methods;
};

export default createTerminalGraph;
