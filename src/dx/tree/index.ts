import { ICON } from "../../constants";
import type {
  CompactSummaryData,
  ExecutiveSummaryData,
  OverrideInfo,
  OverridesMap,
  RemovedOverrideInfo,
  SecurityFixInfo,
  TerminalGraph,
  TerminalGraphOptions,
  TerminalPhase,
  TerminalTreeContext,
  VulnerabilityInfo,
} from "./types";
import {
  buildBannerOutput,
  buildCompactSummaryLine,
  buildConnector,
  buildExecutiveSummaryLines,
  buildOverrideDetails,
  buildOverrideHeader,
  buildPrefix,
  buildProgressText,
  buildRemovedOverrideHeader,
  buildSecurityFixDetails,
  buildSecurityFixHeader,
  buildVulnerabilityDetails,
  buildVulnerabilityHeader,
  buildNoticeBox,
  createTerminalTreeContext,
  selectOverrideIcon,
  selectVulnerabilityIcon,
  writeChangesSection,
  writeDetailLines,
  writeOptionalDetails,
  writeOverridesSection,
} from "./utils";

class TerminalTree implements TerminalGraph {
  constructor(private readonly context: TerminalTreeContext) {}

  banner(): TerminalGraph {
    this.context.paused(() => this.context.out.writeLine(buildBannerOutput()));
    return this;
  }

  startPhase(phase: TerminalPhase, text: string, isLast = false): TerminalGraph {
    this.context.paused(() => {
      const current = this.context.state.get();
      this.context.state.set(Object.assign({}, current, { phase }));
      this.context.tree.line(isLast, text);
      this.context.tree.open(!isLast);
    });
    return this;
  }

  progress(current: number, total: number, item: string): TerminalGraph {
    const text = buildProgressText(current, total, item);
    this.updateProgressState(current, total, text);
    const shouldStartSpinner = current === 1 && !this.context.spinner.isActive();
    if (shouldStartSpinner) {
      this.context.spinner.start(text);
    }
    return this;
  }

  item(text: string, isLast = false): TerminalGraph {
    this.context.paused(() => this.context.tree.line(isLast, ICON.success, text));
    return this;
  }

  vulnerability(info: VulnerabilityInfo, isLast = false): TerminalGraph {
    this.context.paused(() => {
      const icon = selectVulnerabilityIcon(info.fixAvailable);
      const header = buildVulnerabilityHeader(info);
      const details = buildVulnerabilityDetails(info);
      this.context.tree.line(isLast, icon, header);
      this.context.tree.nested(isLast, () => writeDetailLines(this.context.tree, details));
    });
    return this;
  }

  override(info: OverrideInfo, isLast = false): TerminalGraph {
    this.context.paused(() => {
      const icon = selectOverrideIcon(info.isSecurityFix, info.keep);
      const header = buildOverrideHeader(info);
      const details = buildOverrideDetails(info);
      this.context.tree.line(isLast, icon, header);
      writeOptionalDetails(this.context.tree, isLast, details);
    });
    return this;
  }

  securityFix(info: SecurityFixInfo, isLast = false): TerminalGraph {
    this.context.paused(() => {
      const header = buildSecurityFixHeader(info);
      const details = buildSecurityFixDetails(info);
      this.context.tree.line(isLast, ICON.success, header);
      writeOptionalDetails(this.context.tree, isLast, details);
    });
    return this;
  }

  removedOverride(info: RemovedOverrideInfo, isLast = false): TerminalGraph {
    this.context.paused(() => {
      const header = buildRemovedOverrideHeader(info);
      this.context.tree.line(isLast, ICON.info, header);
      this.context.tree.nested(isLast, () => this.context.tree.line(true, info.reason));
    });
    return this;
  }

  endPhase(text?: string): TerminalGraph {
    this.context.paused(() => {
      if (text) this.context.tree.line(true, ICON.success, text);
      this.context.tree.close();
    });
    return this;
  }

  summary(overrides: OverridesMap, changes?: string[]): TerminalGraph {
    this.context.paused(() => {
      const hasChanges = Boolean(changes && changes.length > 0);
      writeOverridesSection(this.context.tree, overrides, !hasChanges);
      writeChangesSection(this.context.tree, changes);
    });
    return this;
  }

  executiveSummary(data: ExecutiveSummaryData): TerminalGraph {
    this.context.paused(() => {
      const lines = buildExecutiveSummaryLines(data);
      lines.forEach((line) => this.context.out.writeLine(line));
    });
    return this;
  }

  compactSummary(data: CompactSummaryData): TerminalGraph {
    this.context.paused(() => {
      this.context.out.writeLine(buildCompactSummaryLine(data));
    });
    return this;
  }

  complete(text: string, suffix = ""): TerminalGraph {
    this.context.paused(() => {
      const current = this.context.state.get();
      this.context.state.set(Object.assign({}, current, { phase: "complete", ancestors: [] }));
      const prefix = buildPrefix([]) + buildConnector(true);
      this.context.completer(text, prefix, suffix);
    });
    return this;
  }

  notice(text: string): TerminalGraph {
    this.context.paused(() => {
      const lines = buildNoticeBox(text);
      this.context.out.writeLine("");
      lines.forEach((line) => this.context.out.writeLine(line));
      this.context.out.writeLine("");
    });
    return this;
  }

  stop(): TerminalGraph {
    this.context.spinner.stop();
    return this;
  }

  private updateProgressState(current: number, total: number, text: string): void {
    const state = this.context.state.get();
    const spinner = Object.assign({}, state.spinner, { text });
    this.context.state.set(Object.assign({}, state, { spinner, progress: { current, total } }));
  }
}

export const createTerminalGraph = (options: TerminalGraphOptions = {}): TerminalGraph =>
  new TerminalTree(createTerminalTreeContext(options));

export default createTerminalGraph;
