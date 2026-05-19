import type {
  PastoralistJSON,
  SecurityAlert,
  SecurityOverride,
  SecurityProviderType,
} from "../../types";
import { compareVersions } from "../../utils/semver";
import { execFile } from "child_process";
import { promisify } from "util";
import { logger } from "../../utils";
import { red, yellow, cyan, gray } from "../../utils/colors";
import * as readline from "readline/promises";
import {
  CONFIDENCE_WEIGHTS,
  DEFAULT_CLI_TIMEOUT,
  DEFAULT_INSTALL_TIMEOUT,
  DEFAULT_PROMPT_TIMEOUT,
  PROMPT_SELECT_MAX_ATTEMPTS,
  SECURITY_ACTION_CHOICES,
  SECURITY_SUMMARY_SEVERITIES,
} from "./constants";
import type {
  CLIInstallOptions,
  PromptFunctions,
  PromptChoice,
  SecretPromptCharResult,
  SecretPromptSession,
} from "./types";

const execFileAsync = promisify(execFile);
type ExecFileAsync = typeof execFileAsync;

export const getSeverityScore = (severity: string): number => {
  const scores: Record<string, number> = {
    low: 1,
    medium: 2,
    high: 3,
    critical: 4,
  };
  return scores[severity.toLowerCase()] || 0;
};

const mergeSources = (a: SecurityAlert, b: SecurityAlert): SecurityProviderType[] => {
  const combined = (a.sources || []).concat(b.sources || []);
  return Array.from(new Set(combined)) as SecurityProviderType[];
};

const createCvesField = (cves: string[] | undefined): Partial<Pick<SecurityAlert, "cves">> => {
  if (!cves?.length) return {};
  return { cves };
};

const createSourcesField = (
  sources: SecurityProviderType[] | undefined,
): Partial<Pick<SecurityAlert, "sources">> => {
  if (!sources?.length) return {};
  return { sources };
};

export const deduplicateAlerts = (alerts: SecurityAlert[]): SecurityAlert[] => {
  const seen = alerts.reduce((map, alert) => {
    const key = `${alert.packageName}@${alert.currentVersion}:${alert.cves?.[0] || alert.title}`;
    const existing = map.get(key);
    const shouldReplace =
      !existing || getSeverityScore(alert.severity) > getSeverityScore(existing.severity);

    if (shouldReplace) {
      const mergedCves = existing
        ? Array.from(new Set((existing.cves || []).concat(alert.cves || [])))
        : alert.cves;
      const mergedSources = existing ? mergeSources(existing, alert) : alert.sources;
      const withCves = createCvesField(mergedCves);
      const withSources = createSourcesField(mergedSources);
      map.set(key, Object.assign({}, alert, withCves, withSources));
    } else if (existing) {
      const allCves = (existing.cves || []).concat(alert.cves || []);
      const mergedCves = Array.from(new Set(allCves));
      const mergedSources = mergeSources(existing, alert);
      const withCves = createCvesField(mergedCves);
      const withSources = createSourcesField(mergedSources);
      map.set(key, Object.assign({}, existing, withCves, withSources));
    }

    return map;
  }, new Map<string, SecurityAlert>());

  return Array.from(seen.values());
};

export const computeConfidence = (sources: SecurityProviderType[]): "confirmed" | "possible" =>
  sources.length >= 2 ? "confirmed" : "possible";

export const sortAlertsByPriority = (alerts: SecurityAlert[]): SecurityAlert[] =>
  alerts.slice().sort((a, b) => {
    const sourcesA = a.sources ?? [];
    const sourcesB = b.sources ?? [];
    const weightA = CONFIDENCE_WEIGHTS[computeConfidence(sourcesA)];
    const weightB = CONFIDENCE_WEIGHTS[computeConfidence(sourcesB)];
    const priorityA = getSeverityScore(a.severity) * weightA;
    const priorityB = getSeverityScore(b.severity) * weightB;
    return priorityB - priorityA;
  });

export const extractPackages = (
  config: PastoralistJSON,
  excludePackages: string[] = [],
): Array<{ name: string; version: string }> => {
  const allDeps = Object.assign(
    {},
    config.dependencies,
    config.devDependencies,
    config.peerDependencies,
  );

  return Object.entries(allDeps)
    .filter(([name]) => !excludePackages.includes(name))
    .map(([name, version]) => ({
      name,
      version: version.replace(/^[\^~]/, ""),
    }));
};

const checkBoundedRange = (version: string, range: string): boolean | null => {
  const isRangeBounded = range.includes(">=") && range.includes("<");
  if (!isRangeBounded) return null;

  const [, minVersion] = range.match(/>= ?([^\s,]+)/) || [];
  const [, maxVersion] = range.match(/< ?([^\s,]+)/) || [];
  const hasValidBounds = Boolean(minVersion && maxVersion);
  if (!hasValidBounds) return null;

  const meetsMinVersion = compareVersions(version, minVersion) >= 0;
  if (!meetsMinVersion) return false;
  return compareVersions(version, maxVersion) < 0;
};

const checkLessThanOrEqual = (version: string, range: string): boolean | null => {
  const isLessThanOrEqual = range.startsWith("<=");
  if (!isLessThanOrEqual) return null;

  const maxVersion = range.replace(/<= ?/, "");
  return compareVersions(version, maxVersion) <= 0;
};

const checkLessThan = (version: string, range: string): boolean | null => {
  const isLessThan = range.startsWith("<") && !range.startsWith("<=");
  if (!isLessThan) return null;

  const maxVersion = range.replace(/< ?/, "");
  return compareVersions(version, maxVersion) < 0;
};

const checkGreaterThanOrEqual = (version: string, range: string): boolean | null => {
  // Matches open-ended ranges like ">= 1.0.0" with no upper bound
  const isOpenEnded = range.startsWith(">=") && !range.includes("<");
  if (!isOpenEnded) return null;

  const minVersion = range.replace(/>= ?/, "");
  return compareVersions(version, minVersion) >= 0;
};

export const isVersionVulnerable = (currentVersion: string, vulnerableRange: string): boolean => {
  try {
    const cleanVersion = currentVersion.replace(/^[\^~]/, "");
    const boundedRange = checkBoundedRange(cleanVersion, vulnerableRange);
    if (boundedRange !== null) return boundedRange;

    const greaterThanOrEqual = checkGreaterThanOrEqual(cleanVersion, vulnerableRange);
    if (greaterThanOrEqual !== null) return greaterThanOrEqual;

    const lessThanOrEqual = checkLessThanOrEqual(cleanVersion, vulnerableRange);
    if (lessThanOrEqual !== null) return lessThanOrEqual;

    return checkLessThan(cleanVersion, vulnerableRange) ?? false;
  } catch {
    return false;
  }
};

export const computeVulnerabilityReduction = (
  packageName: string,
  currentVersion: string,
  targetVersion: string,
  allAlerts: SecurityAlert[],
): { skip: boolean; targetStillVulnerable: boolean } => {
  const hasKnownCurrentVersion = Boolean(currentVersion) && currentVersion !== "unknown";
  if (!hasKnownCurrentVersion) {
    return { skip: false, targetStillVulnerable: false };
  }

  const packageAlerts = allAlerts.filter(
    (a) => a.packageName === packageName && a.vulnerableVersions,
  );
  const hasVulnerableRanges = packageAlerts.length > 0;
  if (!hasVulnerableRanges) return { skip: false, targetStillVulnerable: false };

  const currentCount = packageAlerts.filter((a) =>
    isVersionVulnerable(currentVersion, a.vulnerableVersions!),
  ).length;
  const targetCount = packageAlerts.filter((a) =>
    isVersionVulnerable(targetVersion, a.vulnerableVersions!),
  ).length;

  return {
    skip: targetCount >= currentCount,
    targetStillVulnerable: targetCount > 0,
  };
};

export const findVulnerablePackages = (
  config: PastoralistJSON,
  alerts: SecurityAlert[],
): SecurityAlert[] => {
  const allDeps = Object.assign(
    {},
    config.dependencies,
    config.devDependencies,
    config.peerDependencies,
  );

  return alerts
    .filter((alert) => {
      const currentVersion = allDeps[alert.packageName];
      const hasDep = Boolean(currentVersion);
      return hasDep && isVersionVulnerable(currentVersion, alert.vulnerableVersions);
    })
    .map((alert) => Object.assign({}, alert, { currentVersion: allDeps[alert.packageName] }));
};

export class CLIInstaller {
  private log: ReturnType<typeof logger>;
  private execFileAsync: ExecFileAsync;

  constructor(options: { debug?: boolean; execFileAsync?: ExecFileAsync } = {}) {
    this.log = logger({
      file: "security/cli-installer.ts",
      isLogging: options.debug,
    });
    this.execFileAsync = options.execFileAsync ?? execFileAsync;
  }

  async isInstalled(command: string): Promise<boolean> {
    const execOptions = { timeout: DEFAULT_CLI_TIMEOUT };
    try {
      await this.execFileAsync("which", [command], execOptions);
      return true;
    } catch {
      return false;
    }
  }

  async isInstalledGlobally(packageName: string): Promise<boolean> {
    const execOptions = { timeout: DEFAULT_CLI_TIMEOUT };
    const args = ["list", "-g", packageName, "--depth=0"];
    try {
      const { stdout } = await this.execFileAsync("npm", args, execOptions);
      return stdout.includes(packageName);
    } catch {
      return false;
    }
  }

  async installGlobally(packageName: string): Promise<void> {
    this.log.print(`Installing ${packageName} globally...`);
    const execOptions = { timeout: DEFAULT_INSTALL_TIMEOUT };

    try {
      await this.execFileAsync("npm", ["install", "-g", packageName], execOptions);
      this.log.print(`Successfully installed ${packageName}`);
    } catch (error) {
      this.log.error(`Failed to install ${packageName}`, "installGlobally", {
        error,
      });
      throw new Error(`Failed to install ${packageName}: ${error}`);
    }
  }

  async ensureInstalled(options: CLIInstallOptions): Promise<boolean> {
    const { packageName, cliCommand } = options;
    const hasCommand = await this.hasAvailableCommand(cliCommand);

    if (hasCommand) {
      return true;
    }

    const hasGlobalPackage = await this.hasGlobalPackage(packageName);
    if (hasGlobalPackage) {
      return true;
    }

    return this.installMissingCommand(packageName, cliCommand);
  }

  private async hasAvailableCommand(cliCommand: string): Promise<boolean> {
    const isCommandAvailable = await this.isInstalled(cliCommand);

    if (isCommandAvailable) {
      this.log.debug(`${cliCommand} is already installed`, "ensureInstalled");
    }

    return isCommandAvailable;
  }

  private async hasGlobalPackage(packageName: string): Promise<boolean> {
    const isGloballyInstalled = await this.isInstalledGlobally(packageName);

    if (isGloballyInstalled) {
      this.log.debug(
        `${packageName} is installed globally but command not in PATH`,
        "ensureInstalled",
      );
    }

    return isGloballyInstalled;
  }

  private async installMissingCommand(packageName: string, cliCommand: string): Promise<boolean> {
    this.log.print(`${cliCommand} not found, installing ${packageName}...`);
    try {
      await this.installGlobally(packageName);
      return this.verifyInstalledCommand(packageName, cliCommand);
    } catch (error) {
      this.log.error(`Could not install ${packageName}`, "ensureInstalled", { error });
      return false;
    }
  }

  private async verifyInstalledCommand(packageName: string, cliCommand: string): Promise<boolean> {
    const isNowInstalled = await this.isInstalled(cliCommand);

    if (!isNowInstalled) {
      this.log.print(
        `${packageName} was installed but ${cliCommand} is still not available. Please ensure it's in your PATH.`,
      );
      return false;
    }

    return true;
  }

  async getVersion(command: string): Promise<string | undefined> {
    const execOptions = { timeout: DEFAULT_CLI_TIMEOUT };
    try {
      const { stdout } = await this.execFileAsync(command, ["--version"], execOptions);
      return stdout.trim();
    } catch {
      return undefined;
    }
  }
}

export const createPromptInterface = () => {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
};

const questionWithTimeout = async (
  rl: readline.Interface,
  prompt: string,
  timeout: number,
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      rl.close();
      reject(new Error("Prompt timed out"));
    }, timeout);

    rl.question(prompt)
      .then((answer) => {
        clearTimeout(timeoutId);
        resolve(answer);
      })
      .catch((err) => {
        clearTimeout(timeoutId);
        reject(err);
      });
  });
};

const formatYesNo = (defaultValue: boolean): string => {
  if (defaultValue) {
    return `${cyan("Y")}/n`;
  }
  return `y/${cyan("N")}`;
};

export const promptConfirm = async (message: string, defaultValue = true): Promise<boolean> => {
  const rl = createPromptInterface();
  const defaultText = formatYesNo(defaultValue);
  const promptText = `${cyan("?")} ${message} (${defaultText}): `;

  try {
    const answer = await questionWithTimeout(rl, promptText, DEFAULT_PROMPT_TIMEOUT);
    rl.close();

    const trimmedAnswer = answer.trim();
    if (trimmedAnswer === "") {
      return defaultValue;
    }

    const isYes = trimmedAnswer.toLowerCase().startsWith("y");
    return isYes;
  } catch {
    rl.close();
    return defaultValue;
  }
};

export const promptSelect = async (message: string, choices: PromptChoice[]): Promise<string> => {
  const rl = createPromptInterface();
  const defaultChoice = choices[0]?.value || "";
  const selectPrompt = `${gray("Select")} (1-${choices.length}): `;

  printSelectChoices(message, choices);
  const selectedValue = await promptForSelection(rl, selectPrompt, choices, defaultChoice);

  rl.close();
  return selectedValue;
};

function printSelectChoices(message: string, choices: PromptChoice[]): void {
  console.log(`${cyan("?")} ${message}`);
  const lines = choices.map((choice, index) => `  ${cyan(`${index + 1})`)} ${choice.name}`);
  console.log(lines.join("\n"));
}

async function promptForSelection(
  rl: readline.Interface,
  selectPrompt: string,
  choices: PromptChoice[],
  defaultChoice: string,
  attempt = 1,
): Promise<string> {
  if (attempt > PROMPT_SELECT_MAX_ATTEMPTS) {
    return defaultChoice;
  }

  try {
    const input = await questionWithTimeout(rl, selectPrompt, DEFAULT_PROMPT_TIMEOUT);
    const selectedValue = getSelectedChoice(input, choices);

    if (selectedValue) {
      return selectedValue;
    }

    console.log("Invalid selection. Please try again.");
    return promptForSelection(rl, selectPrompt, choices, defaultChoice, attempt + 1);
  } catch {
    return defaultChoice;
  }
}

function getSelectedChoice(input: string, choices: PromptChoice[]): string | undefined {
  const num = parseInt(input.trim(), 10);
  const isValidSelection = num >= 1 && num <= choices.length;

  if (!isValidSelection) {
    return undefined;
  }

  return choices[num - 1].value;
}

const formatInputPrompt = (message: string, defaultValue: string): string => {
  const hasDefault = defaultValue !== "";
  if (hasDefault) {
    return `${cyan("?")} ${message} (${gray(defaultValue)}): `;
  }
  return `${cyan("?")} ${message}: `;
};

export const promptInput = async (message: string, defaultValue = ""): Promise<string> => {
  const rl = createPromptInterface();
  const promptText = formatInputPrompt(message, defaultValue);

  try {
    const answer = await questionWithTimeout(rl, promptText, DEFAULT_PROMPT_TIMEOUT);
    rl.close();

    const trimmedAnswer = answer.trim();
    const finalValue = trimmedAnswer || defaultValue;
    return finalValue;
  } catch {
    rl.close();
    return defaultValue;
  }
};

export const promptSecret = async (message: string, defaultValue = ""): Promise<string> => {
  if (!isInteractiveSecretPrompt()) {
    return promptInput(message, defaultValue);
  }

  const promptText = formatInputPrompt(message, defaultValue);
  return readSecretPrompt(promptText, defaultValue);
};

function isInteractiveSecretPrompt(): boolean {
  return Boolean(process.stdin.isTTY && process.stdout.isTTY);
}

function readSecretPrompt(promptText: string, defaultValue: string): Promise<string> {
  return new Promise((resolvePrompt) => {
    const session = createSecretPromptSession(defaultValue, resolvePrompt);
    startSecretPromptSession(session, promptText);
  });
}

function createSecretPromptSession(
  defaultValue: string,
  resolvePrompt: (value: string) => void,
): SecretPromptSession {
  return {
    input: process.stdin,
    output: process.stdout,
    wasRaw: process.stdin.isRaw,
    defaultValue,
    resolvePrompt,
    value: "",
  };
}

function startSecretPromptSession(session: SecretPromptSession, promptText: string): void {
  session.onData = createSecretDataHandler(session);
  session.output.write(promptText);
  session.input.setRawMode(true);
  session.input.resume();
  session.input.on("data", session.onData);
  session.timeout = createSecretPromptTimeout(session);
}

function createSecretDataHandler(session: SecretPromptSession): (chunk: Buffer) => void {
  return (chunk: Buffer) => {
    Array.from(chunk.toString("utf8")).some((char) => handleSecretDataChar(session, char));
  };
}

function handleSecretDataChar(session: SecretPromptSession, char: string): boolean {
  const result = handleSecretChar(char, session.value, session.defaultValue);
  session.value = result.value;

  if (result.done) {
    finishSecretPrompt(session, result.output);
  }

  return result.done;
}

function createSecretPromptTimeout(session: SecretPromptSession): ReturnType<typeof setTimeout> {
  const timeout = setTimeout(
    () => finishSecretPrompt(session, session.defaultValue),
    DEFAULT_PROMPT_TIMEOUT,
  );
  timeout.unref();
  return timeout;
}

function finishSecretPrompt(session: SecretPromptSession, nextValue: string): void {
  cleanupSecretPrompt(session);
  session.output.write("\n");
  session.resolvePrompt(nextValue);
}

function cleanupSecretPrompt(session: SecretPromptSession): void {
  if (session.timeout) {
    clearTimeout(session.timeout);
  }

  if (session.onData) {
    session.input.off("data", session.onData);
  }

  session.input.setRawMode(session.wasRaw);
  session.input.pause();
}

function handleSecretChar(
  char: string,
  value: string,
  defaultValue: string,
): SecretPromptCharResult {
  if (char === "\u0003") {
    return { value, output: defaultValue, done: true };
  }

  const isSubmitChar = char === "\r" || char === "\n";
  if (isSubmitChar) {
    return { value, output: value.trim() || defaultValue, done: true };
  }

  const isBackspaceChar = char === "\u007f" || char === "\b";
  if (isBackspaceChar) {
    return { value: value.slice(0, -1), output: "", done: false };
  }

  return { value: value + char, output: "", done: false };
}

export class InteractiveSecurityManager {
  private prompts: PromptFunctions;

  constructor(
    prompts: PromptFunctions = {
      confirm: promptConfirm,
      select: promptSelect,
      input: promptInput,
    },
  ) {
    this.prompts = prompts;
  }

  async promptForSecurityActions(
    vulnerablePackages: SecurityAlert[],
    suggestedOverrides: SecurityOverride[],
  ): Promise<SecurityOverride[]> {
    if (vulnerablePackages.length === 0) {
      return [];
    }

    this.printSecurityReview(vulnerablePackages);
    const proceed = await this.confirmSecurityReview();

    if (!proceed) {
      return [];
    }

    const selectedOverrides = await this.collectSelectedOverrides(
      vulnerablePackages,
      suggestedOverrides,
    );
    return this.confirmSelectedOverrides(selectedOverrides);
  }

  private printSecurityReview(vulnerablePackages: SecurityAlert[]): void {
    console.log("\nSecurity Vulnerabilities Found\n");
    console.log("═".repeat(50));
    console.log(this.generateSummary(vulnerablePackages));
  }

  private confirmSecurityReview(): Promise<boolean> {
    return this.prompts.confirm("Would you like to review and apply security fixes?", true);
  }

  private collectSelectedOverrides(
    vulnerablePackages: SecurityAlert[],
    suggestedOverrides: SecurityOverride[],
  ): Promise<SecurityOverride[]> {
    return suggestedOverrides.reduce(
      async (previousSelections, override) => {
        const previous = await previousSelections;
        const selected = await this.selectOverride(vulnerablePackages, override);
        return previous.concat(selected);
      },
      Promise.resolve([] as SecurityOverride[]),
    );
  }

  private async selectOverride(
    vulnerablePackages: SecurityAlert[],
    override: SecurityOverride,
  ): Promise<SecurityOverride[]> {
    const vulnerability = this.findVulnerability(vulnerablePackages, override);

    if (!vulnerability) {
      return [];
    }

    this.printOverrideReview(override, vulnerability);
    const action = await this.prompts.select(
      "How would you like to handle this vulnerability?",
      this.getActionChoices(override),
    );
    const selectedOverride = await this.createSelectedOverride(action, override);
    return selectedOverride ? [selectedOverride] : [];
  }

  private findVulnerability(
    vulnerablePackages: SecurityAlert[],
    override: SecurityOverride,
  ): SecurityAlert | undefined {
    return vulnerablePackages.find((vulnerability) => {
      return vulnerability.packageName === override.packageName;
    });
  }

  private printOverrideReview(override: SecurityOverride, vulnerability: SecurityAlert): void {
    console.log(`\n${override.packageName}`);
    console.log(`   Current: ${override.fromVersion}`);
    console.log(`   ${this.getSeverityEmoji(vulnerability.severity)} ${vulnerability.title}`);

    const cves = vulnerability.cves;
    const hasCves = cves && cves.length > 0;
    if (hasCves) {
      console.log(`   CVE: ${cves.join(", ")}`);
    }
  }

  private getActionChoices(override: SecurityOverride): PromptChoice[] {
    return SECURITY_ACTION_CHOICES.map((choice) => {
      if (choice.value !== "apply") {
        return choice;
      }

      return Object.assign({}, choice, { name: `Apply fix: Update to ${override.toVersion}` });
    });
  }

  private async createSelectedOverride(
    action: string,
    override: SecurityOverride,
  ): Promise<SecurityOverride | undefined> {
    if (action === "apply") {
      return override;
    }

    if (action === "custom") {
      const customVersion = await this.prompts.input(
        "Enter the version to use:",
        override.toVersion,
      );
      return Object.assign({}, override, { toVersion: customVersion });
    }

    return undefined;
  }

  private async confirmSelectedOverrides(
    selectedOverrides: SecurityOverride[],
  ): Promise<SecurityOverride[]> {
    if (selectedOverrides.length === 0) {
      return [];
    }

    this.printSelectedOverrides(selectedOverrides);
    const confirm = await this.prompts.confirm("Apply these overrides to your package.json?", true);
    return confirm ? selectedOverrides : [];
  }

  private printSelectedOverrides(selectedOverrides: SecurityOverride[]): void {
    console.log("\nSelected Overrides:\n");
    selectedOverrides
      .map(
        (override) => `  ${override.packageName}: ${override.fromVersion} → ${override.toVersion}`,
      )
      .forEach((line) => console.log(line));
  }

  private generateSummary(vulnerablePackages: SecurityAlert[]): string {
    const counts = this.countBySeverity(vulnerablePackages);
    const severityLines = SECURITY_SUMMARY_SEVERITIES.map((severity) =>
      this.formatSeveritySummary(severity, counts[severity]),
    ).filter(Boolean);
    return [`Found ${vulnerablePackages.length} vulnerable package(s):`]
      .concat(severityLines)
      .join("\n");
  }

  private countBySeverity(vulnerablePackages: SecurityAlert[]) {
    return vulnerablePackages.reduce(
      (counts, vulnerability) =>
        Object.assign({}, counts, {
          [vulnerability.severity]: counts[vulnerability.severity] + 1,
        }),
      { critical: 0, high: 0, medium: 0, low: 0 },
    );
  }

  private formatSeveritySummary(severity: SecurityAlert["severity"], count: number): string {
    if (count === 0) {
      return "";
    }

    const label = this.getSeverityLabel(severity);
    return `  ${label} ${count}`;
  }

  private getSeverityLabel(severity: SecurityAlert["severity"]): string {
    if (severity === "critical") {
      return red("[CRITICAL]");
    }

    if (severity === "high") {
      return red("[HIGH]    ");
    }

    if (severity === "medium") {
      return yellow("[MEDIUM]  ");
    }

    return cyan("[LOW]     ");
  }

  private getSeverityEmoji(severity: string): string {
    switch (severity.toLowerCase()) {
      case "critical":
        return red("[!]");
      case "high":
        return red("[!]");
      case "medium":
        return yellow("[*]");
      case "low":
        return cyan("[i]");
      default:
        return gray("[*]");
    }
  }
}
