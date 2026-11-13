import type {
  DependabotAlert,
  OSVBatchApiResult,
  OSVVulnerability,
  PatchableAlert,
  SnykResult,
  SocketIssue,
  SocketPackage,
  SocketResult,
  PastoralistJSON,
  OverrideUpdate,
  SecurityPackage,
  SecurityAlert,
  SecurityOverride,
  SecurityProviderType,
} from "../../types";
import { compareVersions, countBy, groupBy, isRecord, isString, omit } from "../../utils";
import {
  isExactVersion,
  isSameReleaseLine,
  isVersionRangeSupported,
  satisfiesVersionRange,
} from "../../utils/semver";
import { execFile } from "child_process";
import { parseNpmAlias } from "../../utils/npm";
import { promisify } from "util";
import { logger } from "../../observability";
import { red, yellow, cyan, gray } from "../../dx/utils";
import * as readline from "readline";
import {
  CONFIDENCE_WEIGHTS,
  DEFAULT_CLI_TIMEOUT,
  DEFAULT_INSTALL_TIMEOUT,
  DEFAULT_PROMPT_TIMEOUT,
  PROMPT_SELECT_MAX_ATTEMPTS,
  SECURITY_BOUNDED_MAXIMUM_PATTERN,
  SECURITY_BOUNDED_MINIMUM_PATTERN,
  SECURITY_EXACT_RANGE_PATTERN,
  SECURITY_RANGE_OR_SEPARATOR,
  SECURITY_REGISTRY_SPEC_PATTERN,
  SECURITY_ACTION_CHOICES,
  SECURITY_SEVERITY_SCORES,
  SECURITY_SUMMARY_SEVERITIES,
  SECURITY_VERSION_PREFIX_PATTERN,
  OSV_MALFORMED_BATCH_RESPONSE,
} from "./constants";
import type {
  SecurityFixContext,
  CLIInstallOptions,
  PromptFunctions,
  PromptChoice,
  PromptSelection,
  SecretPromptCharResult,
  SecretPromptSession,
} from "./types";
import type { ExecFileAsync } from "../types";

const execFileAsync = promisify(execFile);
const promptOutput = logger({ file: "security/utils.ts" });

export const getSeverityScore = (severity: string | undefined): number => {
  const normalizedSeverity = severity?.toLowerCase() ?? "";
  const severityScore = SECURITY_SEVERITY_SCORES[normalizedSeverity] || 0;
  return severityScore;
};

const mergeSources = (a: SecurityAlert, b: SecurityAlert): SecurityProviderType[] => {
  const combined = (a.sources || []).concat(b.sources || []);
  const sources = Array.from(new Set(combined));
  return sources;
};

const createCvesField = (cves: string[] | undefined): Partial<Pick<SecurityAlert, "cves">> => {
  if (!cves?.length) {
    const emptyField = {};
    return emptyField;
  }
  const cvesField = { cves };
  return cvesField;
};

const createSourcesField = (
  sources: SecurityProviderType[] | undefined,
): Partial<Pick<SecurityAlert, "sources">> => {
  if (!sources?.length) {
    const emptyField = {};
    return emptyField;
  }
  const sourcesField = { sources };
  return sourcesField;
};

const mergeAlert = (existing: SecurityAlert | undefined, alert: SecurityAlert): SecurityAlert => {
  if (!existing) {
    const newAlert = Object.assign({}, alert);
    return newAlert;
  }
  const isMoreSevere = getSeverityScore(alert.severity) > getSeverityScore(existing.severity);
  const preferred = isMoreSevere ? alert : existing;
  const allCves = (existing.cves || []).concat(alert.cves || []);
  const mergedCves = Array.from(new Set(allCves));
  const mergedSources = mergeSources(existing, alert);
  const withCves = createCvesField(mergedCves);
  const withSources = createSourcesField(mergedSources);
  const merged = Object.assign({}, preferred, withCves, withSources);
  return merged;
};

export const deduplicateAlerts = (alerts: SecurityAlert[]): SecurityAlert[] => {
  const seen = alerts.reduce((map, alert) => {
    const key = `${alert.packageName}@${alert.currentVersion}:${alert.cves?.[0] || alert.title}`;
    const existing = map.get(key);
    map.set(key, mergeAlert(existing, alert));
    return map;
  }, new Map<string, SecurityAlert>());
  const uniqueAlerts = Array.from(seen.values());
  return uniqueAlerts;
};

export const computeConfidence = (sources: SecurityProviderType[]): "confirmed" | "possible" => {
  const hasMultipleSources = sources.length >= 2;
  if (hasMultipleSources) return "confirmed";
  return "possible";
};

export const sortAlertsByPriority = (alerts: SecurityAlert[]): SecurityAlert[] =>
  alerts.toSorted((a, b) => {
    const sourcesA = a.sources ?? [];
    const sourcesB = b.sources ?? [];
    const weightA = CONFIDENCE_WEIGHTS[computeConfidence(sourcesA)];
    const weightB = CONFIDENCE_WEIGHTS[computeConfidence(sourcesB)];
    const priorityA = getSeverityScore(a.severity) * weightA;
    const priorityB = getSeverityScore(b.severity) * weightB;
    const result = priorityB - priorityA;
    return result;
  });

const normalizeSecurityPackageVersion = (version: string): string => {
  const normalizedVersion = version.trim();
  const match = normalizedVersion.match(SECURITY_REGISTRY_SPEC_PATTERN);
  if (!match) return normalizedVersion;
  const result = match[1];
  return result;
};

const getDirectDependencies = (config: PastoralistJSON) => {
  const { dependencies, devDependencies, peerDependencies } = config;
  const combined = Object.assign({}, dependencies, devDependencies, peerDependencies);
  return combined;
};

export const extractPackages = (
  config: PastoralistJSON,
  excludePackages: string[] = [],
): Array<{ name: string; version: string }> => {
  const allDeps = getDirectDependencies(config);
  const packages = Object.entries(allDeps)
    .filter(([name]) => !excludePackages.includes(name))
    .map(([name, version]) => {
      const packageVersion = normalizeSecurityPackageVersion(version);
      const result = { name, version: packageVersion };
      return result;
    });
  return packages;
};

const checkBoundedRange = (version: string, range: string): boolean | null => {
  const isRangeBounded = range.includes(">=") && range.includes("<");
  if (!isRangeBounded) return null;

  const [, minVersion] = range.match(SECURITY_BOUNDED_MINIMUM_PATTERN) || [];
  const [, upperOperator, maxVersion] = range.match(SECURITY_BOUNDED_MAXIMUM_PATTERN) || [];
  const hasValidBounds = Boolean(minVersion && maxVersion);
  if (!hasValidBounds) return null;

  const meetsMinVersion = compareVersions(version, minVersion) >= 0;
  if (!meetsMinVersion) return false;
  const maxComparison = compareVersions(version, maxVersion);
  const hasInclusiveMaximum = upperOperator === "<=";
  const isWithinInclusiveMaximum = maxComparison <= 0;
  const isWithinExclusiveMaximum = maxComparison < 0;
  if (hasInclusiveMaximum) return isWithinInclusiveMaximum;
  return isWithinExclusiveMaximum;
};

const checkExactVersion = (version: string, range: string): boolean | null => {
  const [, exactVersion] = range.match(SECURITY_EXACT_RANGE_PATTERN) || [];
  if (!exactVersion) return null;
  const matchesExact = compareVersions(version, exactVersion) === 0;
  return matchesExact;
};

const checkLessThanOrEqual = (version: string, range: string): boolean | null => {
  const isLessThanOrEqual = range.startsWith("<=");
  if (!isLessThanOrEqual) return null;

  const maxVersion = range.slice(2).trim();
  const result = compareVersions(version, maxVersion) <= 0;
  return result;
};

const checkLessThan = (version: string, range: string): boolean | null => {
  const isLessThan = range.startsWith("<") && !range.startsWith("<=");
  if (!isLessThan) return null;

  const maxVersion = range.slice(1).trim();
  const result = compareVersions(version, maxVersion) < 0;
  return result;
};

const checkGreaterThanOrEqual = (version: string, range: string): boolean | null => {
  const isOpenEnded = range.startsWith(">=") && !range.includes("<");
  if (!isOpenEnded) return null;

  const minVersion = range.slice(2).trim();
  const result = compareVersions(version, minVersion) >= 0;
  return result;
};

const isVersionInRangePart = (cleanVersion: string, vulnerableRange: string): boolean => {
  const boundedRange = checkBoundedRange(cleanVersion, vulnerableRange);
  if (boundedRange !== null) return boundedRange;

  const greaterThanOrEqual = checkGreaterThanOrEqual(cleanVersion, vulnerableRange);
  if (greaterThanOrEqual !== null) return greaterThanOrEqual;

  const lessThanOrEqual = checkLessThanOrEqual(cleanVersion, vulnerableRange);
  if (lessThanOrEqual !== null) return lessThanOrEqual;

  const exactVersion = checkExactVersion(cleanVersion, vulnerableRange);
  if (exactVersion !== null) return exactVersion;

  const result = checkLessThan(cleanVersion, vulnerableRange) ?? false;
  return result;
};

export const isVersionVulnerable = (currentVersion: string, vulnerableRange: string): boolean => {
  try {
    const cleanVersion = currentVersion.replace(SECURITY_VERSION_PREFIX_PATTERN, "");
    const rangeParts = vulnerableRange
      .split(SECURITY_RANGE_OR_SEPARATOR)
      .map((part) => part.trim())
      .filter(Boolean);
    const isVulnerable = rangeParts.some((part) => isVersionInRangePart(cleanVersion, part));
    return isVulnerable;
  } catch {
    return false;
  }
};

const countVulnerableVersions = (
  currentVersion: string,
  targetVersion: string,
  alerts: SecurityAlert[],
) => {
  const counts = alerts.reduce(
    (previous, alert) => {
      const current =
        previous.current + Number(isVersionVulnerable(currentVersion, alert.vulnerableVersions));
      const target =
        previous.target + Number(isVersionVulnerable(targetVersion, alert.vulnerableVersions));
      const next = { current, target };
      return next;
    },
    { current: 0, target: 0 },
  );
  return counts;
};

export const computeVulnerabilityReduction = (
  packageName: string,
  currentVersion: string,
  targetVersion: string,
  allAlerts: SecurityAlert[],
): { skip: boolean; targetStillVulnerable: boolean } => {
  const unchanged = { skip: false, targetStillVulnerable: false };
  const hasKnownCurrentVersion = Boolean(currentVersion) && currentVersion !== "unknown";
  if (!hasKnownCurrentVersion) return unchanged;
  const packageAlerts = allAlerts.filter(
    (a) => a.packageName === packageName && a.vulnerableVersions,
  );
  const hasVulnerableRanges = packageAlerts.length > 0;
  if (!hasVulnerableRanges) return unchanged;
  const { current, target } = countVulnerableVersions(currentVersion, targetVersion, packageAlerts);
  const skip = target >= current;
  const targetStillVulnerable = target > 0;
  const reduction = { skip, targetStillVulnerable };
  return reduction;
};

export const findVulnerablePackages = (
  config: PastoralistJSON,
  alerts: SecurityAlert[],
): SecurityAlert[] => {
  const allDeps = getDirectDependencies(config);

  const vulnerablePackages = alerts
    .filter((alert) => {
      const currentVersion = allDeps[alert.packageName];
      const hasDep = Boolean(currentVersion);
      const result = hasDep && isVersionVulnerable(currentVersion, alert.vulnerableVersions);
      return result;
    })
    .map((alert) => {
      const currentVersion = allDeps[alert.packageName];
      const installedAlert = Object.assign({}, alert, { currentVersion });
      return installedAlert;
    });
  return vulnerablePackages;
};

export class CLIInstaller {
  private log: ReturnType<typeof logger>;
  private execFileAsync: ExecFileAsync;

  constructor(options: { debug?: boolean; execFileAsync?: ExecFileAsync } = {}) {
    const { debug: isLogging } = options;
    this.log = logger({
      file: "security/cli-installer.ts",
      isLogging,
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
      const result = stdout.includes(packageName);
      return result;
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
      throw new Error(`Failed to install ${packageName}: ${error}`, { cause: error });
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

    const result = this.installMissingCommand(packageName, cliCommand);
    return result;
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
      const result = this.verifyInstalledCommand(packageName, cliCommand);
      return result;
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
      const version = stdout.trim();
      return version;
    } catch {
      return undefined;
    }
  }
}

export const createPromptInterface = () => {
  const { stdin: input, stdout: output } = process;
  const promptInterface = readline.createInterface({ input, output });
  return promptInterface;
};

const startPromptTimeout = (
  rl: readline.Interface,
  reject: (error: Error) => void,
  timeout: number,
) => {
  const timeoutId = setTimeout(() => {
    rl.close();
    reject(new Error("Prompt timed out"));
  }, timeout);
  return timeoutId;
};

const questionWithTimeout = (
  rl: readline.Interface,
  prompt: string,
  timeout: number,
): Promise<string> => {
  const pendingAnswer = new Promise<string>((resolve, reject) => {
    const timeoutId = startPromptTimeout(rl, reject, timeout);

    const resolveAnswer = (answer: string): void => {
      clearTimeout(timeoutId);
      resolve(answer);
    };

    try {
      rl.question(prompt, resolveAnswer);
    } catch (error) {
      clearTimeout(timeoutId);
      reject(error);
    }
  });
  return pendingAnswer;
};

const formatYesNo = (defaultValue: boolean): string => {
  if (defaultValue) {
    const yesDefault = `${cyan("Y")}/n`;
    return yesDefault;
  }
  const noDefault = `y/${cyan("N")}`;
  return noDefault;
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
  const selection = { choices, defaultChoice };
  const selectPrompt = `${gray("Select")} (1-${choices.length}): `;

  printSelectChoices(message, choices);
  const selectedValue = await promptForSelection(rl, selectPrompt, selection);

  rl.close();
  return selectedValue;
};

function printSelectChoices(message: string, choices: PromptChoice[]): void {
  promptOutput.print(`${cyan("?")} ${message}`);
  const lines = choices.map((choice, index) => `  ${cyan(`${index + 1})`)} ${choice.name}`);
  promptOutput.print(lines.join("\n"));
}

async function promptForSelection(
  rl: readline.Interface,
  selectPrompt: string,
  selection: PromptSelection,
  attempt = 1,
): Promise<string> {
  const { choices, defaultChoice } = selection;
  if (attempt > PROMPT_SELECT_MAX_ATTEMPTS) return defaultChoice;

  try {
    const input = await questionWithTimeout(rl, selectPrompt, DEFAULT_PROMPT_TIMEOUT);
    const selectedValue = getSelectedChoice(input, choices);

    if (selectedValue) return selectedValue;

    promptOutput.print("Invalid selection. Please try again.");
    const retry = promptForSelection(rl, selectPrompt, selection, attempt + 1);
    return retry;
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

  const selectedChoice = choices[num - 1].value;
  return selectedChoice;
}

const formatInputPrompt = (message: string, defaultValue: string): string => {
  const hasDefault = defaultValue !== "";
  if (hasDefault) {
    const promptWithDefault = `${cyan("?")} ${message} (${gray(defaultValue)}): `;
    return promptWithDefault;
  }
  const prompt = `${cyan("?")} ${message}: `;
  return prompt;
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

export const promptSecret = (message: string, defaultValue = ""): Promise<string> => {
  if (!isInteractiveSecretPrompt()) {
    const result = promptInput(message, defaultValue);
    return result;
  }

  const promptText = formatInputPrompt(message, defaultValue);
  const secret = readSecretPrompt(promptText, defaultValue);
  return secret;
};

function isInteractiveSecretPrompt(): boolean {
  const result = Boolean(process.stdin.isTTY && process.stdout.isTTY);
  return result;
}

function readSecretPrompt(promptText: string, defaultValue: string): Promise<string> {
  const result = new Promise<string>((resolvePrompt) => {
    const session = createSecretPromptSession(defaultValue, resolvePrompt);
    startSecretPromptSession(session, promptText);
  });
  return result;
}

function createSecretPromptSession(
  defaultValue: string,
  resolvePrompt: (value: string) => void,
): SecretPromptSession {
  const { stdin: input, stdout: output } = process;
  const { isRaw: wasRaw } = input;
  const secretPromptSession: SecretPromptSession = {
    input,
    output,
    wasRaw,
    defaultValue,
    resolvePrompt,
    value: "",
  };
  return secretPromptSession;
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
  const { value, output, done } = handleSecretChar(char, session.value, session.defaultValue);
  session.value = value;

  if (done) {
    finishSecretPrompt(session, output);
  }

  return done;
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
    const result: SecretPromptCharResult = { value, output: defaultValue, done: true };
    return result;
  }

  const isSubmitChar = char === "\r" || char === "\n";
  if (isSubmitChar) {
    const output = value.trim() || defaultValue;
    const submitted = { value, output, done: true };
    return submitted;
  }
  const edited = editSecretChar(char, value);
  return edited;
}

function editSecretChar(char: string, previous: string): SecretPromptCharResult {
  const isBackspaceChar = char === "\u007f" || char === "\b";
  if (isBackspaceChar) {
    const value = previous.slice(0, -1);
    const shortened = { value, output: "", done: false };
    return shortened;
  }
  const value = previous + char;
  const appended = { value, output: "", done: false };
  return appended;
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
    const empty: SecurityOverride[] = [];
    if (vulnerablePackages.length === 0) return empty;

    this.printSecurityReview(vulnerablePackages);
    const proceed = await this.confirmSecurityReview();

    if (!proceed) return empty;

    const selectedOverrides = await this.collectSelectedOverrides(
      vulnerablePackages,
      suggestedOverrides,
    );
    const confirmed = this.confirmSelectedOverrides(selectedOverrides);
    return confirmed;
  }

  async promptForBestCasePortfolio(
    vulnerablePackages: SecurityAlert[],
    suggestedOverrides: SecurityOverride[],
  ): Promise<SecurityOverride[]> {
    this.printSecurityReview(vulnerablePackages);
    this.printSelectedOverrides(suggestedOverrides);
    const message = "Apply this complete best-case portfolio without edits?";
    const accepted = await this.prompts.confirm(message, false);
    if (!accepted) {
      const result: SecurityOverride[] = [];
      return result;
    }
    return suggestedOverrides;
  }

  async promptForUserOwnedOverrides(updates: OverrideUpdate[]): Promise<OverrideUpdate[]> {
    const [update, ...remaining] = updates;
    if (!update) {
      const result: OverrideUpdate[] = [];
      return result;
    }
    const isUserOwned = await this.promptForUserOwnedOverride(update);
    const selected = await this.promptForUserOwnedOverrides(remaining);
    if (!isUserOwned) return selected;
    const updatesWithSelection = [update].concat(selected);
    return updatesWithSelection;
  }

  private promptForUserOwnedOverride(update: OverrideUpdate): Promise<boolean> {
    const addedDate = this.formatUserOwnedAddedDate(update);
    const subject = `${update.packageName}@${update.newerVersion}`;
    const message = `Mark ${subject} as user-owned and force it into the best-case portfolio?`;
    const prompt = message + addedDate;
    const result = this.prompts.confirm(prompt, false);
    return result;
  }

  private formatUserOwnedAddedDate(update: OverrideUpdate): string {
    if (!update.addedDate) return "";
    const userOwnedAddedDate = ` Existing override added ${update.addedDate}.`;
    return userOwnedAddedDate;
  }

  private printSecurityReview(vulnerablePackages: SecurityAlert[]): void {
    promptOutput.print("\nSecurity Vulnerabilities Found\n");
    promptOutput.print("═".repeat(50));
    promptOutput.print(this.generateSummary(vulnerablePackages));
  }

  private confirmSecurityReview(): Promise<boolean> {
    const result = this.prompts.confirm(
      "Would you like to review and apply security fixes?",
      false,
    );
    return result;
  }

  private collectSelectedOverrides(
    vulnerablePackages: SecurityAlert[],
    suggestedOverrides: SecurityOverride[],
  ): Promise<SecurityOverride[]> {
    const selections = suggestedOverrides.reduce(
      async (previousSelections, override) => {
        const previous = await previousSelections;
        const selected = await this.selectOverride(vulnerablePackages, override);
        const result = previous.concat(selected);
        return result;
      },
      Promise.resolve([] as SecurityOverride[]),
    );
    return selections;
  }

  private async selectOverride(
    vulnerablePackages: SecurityAlert[],
    override: SecurityOverride,
  ): Promise<SecurityOverride[]> {
    const empty: SecurityOverride[] = [];
    if (override.blocked) {
      promptOutput.print(`${override.packageName}: ${override.blocked}`);
      return empty;
    }
    const vulnerability = this.findVulnerability(vulnerablePackages, override);
    if (!vulnerability) return empty;

    this.printOverrideReview(override, vulnerability);
    const action = await this.prompts.select(
      "How would you like to handle this vulnerability?",
      this.getActionChoices(override),
    );
    const selectedOverride = await this.createSelectedOverride(action, override);
    const selection = this.getValidatedSelection(selectedOverride, vulnerablePackages);
    return selection;
  }

  private getValidatedSelection(
    fix: SecurityOverride | undefined,
    alerts: SecurityAlert[],
  ): SecurityOverride[] {
    const empty: SecurityOverride[] = [];
    if (!fix) return empty;
    if (!this.isSelectedVersionSafe(fix, alerts)) return empty;
    const selection = [fix];
    return selection;
  }

  private isSelectedVersionSafe(fix: SecurityOverride, alerts: SecurityAlert[]): boolean {
    const related = alerts.filter((alert) => alert.packageName === fix.packageName);
    const valid = isExactVersion(fix.toVersion) && isSecurityTargetSafe(fix.toVersion, related);
    if (!valid) promptOutput.print("Selected version does not resolve the known advisories.");
    return valid;
  }

  private findVulnerability(
    vulnerablePackages: SecurityAlert[],
    override: SecurityOverride,
  ): SecurityAlert | undefined {
    const vulnerability = vulnerablePackages.find((alert) => {
      const matches = alert.packageName === override.packageName;
      return matches;
    });
    return vulnerability;
  }

  private printOverrideReview(override: SecurityOverride, vulnerability: SecurityAlert): void {
    promptOutput.print(`\n${override.packageName}`);
    promptOutput.print(`   Current: ${override.fromVersion}`);
    if (override.approvalRequired) promptOutput.print(`   ${override.approvalRequired}`);
    if (override.dependencyFields?.length) {
      promptOutput.print("   Updates the manifest declaration and removes its direct override.");
    }
    promptOutput.print(
      `   ${this.getSeverityEmoji(vulnerability.severity)} ${vulnerability.title}`,
    );

    const cves = vulnerability.cves;
    const hasCves = cves && cves.length > 0;
    if (hasCves) {
      promptOutput.print(`   CVE: ${cves.join(", ")}`);
    }
  }

  private getActionChoices(override: SecurityOverride): PromptChoice[] {
    const choices = SECURITY_ACTION_CHOICES.map((choice) => {
      if (choice.value !== "apply") {
        return choice;
      }

      const destination = override.dependencyFields?.join(" and ") ?? "overrides";
      const name = `Apply fix: Update ${destination} to ${override.toVersion}`;
      const result = Object.assign({}, choice, { name });
      return result;
    });
    return choices;
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
      const selectedOverride = Object.assign({}, override, { toVersion: customVersion });
      return selectedOverride;
    }

    return undefined;
  }

  private async confirmSelectedOverrides(
    selectedOverrides: SecurityOverride[],
  ): Promise<SecurityOverride[]> {
    if (selectedOverrides.length === 0) {
      const result: SecurityOverride[] = [];
      return result;
    }

    this.printSelectedOverrides(selectedOverrides);
    const confirm = await this.prompts.confirm(
      "Apply these security fixes to your project?",
      false,
    );
    const confirmed = confirm
      ? selectedOverrides.map((fix) => Object.assign({}, fix, { approved: true }))
      : [];
    return confirmed;
  }

  private printSelectedOverrides(selectedOverrides: SecurityOverride[]): void {
    promptOutput.print("\nSelected Overrides:\n");
    selectedOverrides
      .map(
        (override) => `  ${override.packageName}: ${override.fromVersion} → ${override.toVersion}`,
      )
      .forEach((line) => promptOutput.print(line));
  }

  private generateSummary(vulnerablePackages: SecurityAlert[]): string {
    const counts = countBy(vulnerablePackages, (vulnerability) => vulnerability.severity);
    const severityLines = SECURITY_SUMMARY_SEVERITIES.map((severity) =>
      this.formatSeveritySummary(severity, counts.get(severity) ?? 0),
    ).filter(Boolean);
    const result = [`Found ${vulnerablePackages.length} vulnerable package(s):`]
      .concat(severityLines)
      .join("\n");
    return result;
  }

  private formatSeveritySummary(severity: SecurityAlert["severity"], count: number): string {
    if (count === 0) {
      return "";
    }

    const label = this.getSeverityLabel(severity);
    const severitySummary = `  ${label} ${count}`;
    return severitySummary;
  }

  private getSeverityLabel(severity: SecurityAlert["severity"]): string {
    if (severity === "critical") {
      const critical = red("[CRITICAL]");
      return critical;
    }

    if (severity === "high") {
      const high = red("[HIGH]    ");
      return high;
    }

    if (severity === "medium") {
      const medium = yellow("[MEDIUM]  ");
      return medium;
    }

    const low = cyan("[LOW]     ");
    return low;
  }

  private getSeverityEmoji(severity: string): string {
    switch (severity.toLowerCase()) {
      case "critical":
      case "high":
        const alert = red("[!]");
        return alert;
      case "medium":
        const warning = yellow("[*]");
        return warning;
      case "low":
        const info = cyan("[i]");
        return info;
      default:
        const unknown = gray("[*]");
        return unknown;
    }
  }
}

export const isDependabotAlert = (value: unknown): value is DependabotAlert => {
  if (!isRecord(value)) return false;
  const vulnerability = value.security_vulnerability;
  if (!isRecord(vulnerability)) return false;
  if (!isRecord(vulnerability.package)) return false;
  const hasAdvisory = isRecord(value.security_advisory);
  return hasAdvisory;
};

const NO_DEPENDABOT_ALERTS: DependabotAlert[] = [];

export const toDependabotAlerts = (value: unknown): DependabotAlert[] => {
  if (!Array.isArray(value)) return NO_DEPENDABOT_ALERTS;
  const alerts = value.filter(isDependabotAlert);
  return alerts;
};

const isOSVBatchApiResult = (value: unknown): value is OSVBatchApiResult => {
  if (!isRecord(value)) return false;
  const isVulnsMissing = value.vulns === undefined;
  const isVulnsArray = Array.isArray(value.vulns);
  const hasValidVulns = isVulnsMissing || isVulnsArray;
  return hasValidVulns;
};

const toOSVBatchApiResult = (value: unknown): OSVBatchApiResult => {
  if (!isOSVBatchApiResult(value)) throw new Error(OSV_MALFORMED_BATCH_RESPONSE);
  return value;
};

export const toOSVBatchApiResults = (value: unknown): OSVBatchApiResult[] => {
  const results = isRecord(value) ? value.results : undefined;
  if (!Array.isArray(results)) throw new Error(OSV_MALFORMED_BATCH_RESPONSE);
  const batchResults = results.map(toOSVBatchApiResult);
  return batchResults;
};

export const isOSVVulnerability = (value: unknown): value is OSVVulnerability => {
  if (!isRecord(value)) return false;
  const hasId = typeof value.id === "string";
  return hasId;
};

export const isSnykResult = (value: unknown): value is SnykResult => {
  if (!isRecord(value)) return false;
  const hasVulnerabilities = Array.isArray(value.vulnerabilities);
  const hasValidOk = typeof value.ok === "boolean";
  const dependencyCount = value.dependencyCount;
  const hasNumericDependencyCount = typeof dependencyCount === "number";
  const hasValidDependencyCount =
    hasNumericDependencyCount && Number.isInteger(dependencyCount) && dependencyCount >= 0;
  const hasValidOrg = isString(value.org);
  const hasValidPolicy = isString(value.policy);
  const hasValidPrivacy = typeof value.isPrivate === "boolean";
  const hasValidPackageManager = isString(value.packageManager);
  const hasScanMetadata = hasValidOk && hasValidDependencyCount && hasValidOrg;
  const hasProjectMetadata = hasValidPolicy && hasValidPrivacy && hasValidPackageManager;
  const hasRequiredMetadata = hasScanMetadata && hasProjectMetadata;
  const isValidResult = hasVulnerabilities && hasRequiredMetadata;
  return isValidResult;
};

const isSocketIssue = (value: unknown): value is SocketIssue => {
  if (!isRecord(value)) return false;
  const hasRequiredFields = isString(value.type) && isString(value.severity);
  return hasRequiredFields;
};

const isSocketIssueList = (value: unknown): value is SocketIssue[] => {
  if (!Array.isArray(value)) return false;
  const hasValidIssueEntries = value.every(isSocketIssue);
  return hasValidIssueEntries;
};

const isSocketPackage = (value: unknown): value is SocketPackage => {
  if (!isRecord(value)) return false;
  const hasNameAndVersion = isString(value.name) && isString(value.version);
  if (!hasNameAndVersion) return false;
  if (value.issues === undefined) return true;
  const hasValidIssues = isSocketIssueList(value.issues);
  return hasValidIssues;
};

export const isSocketResult = (value: unknown): value is SocketResult => {
  if (!isRecord(value)) return false;
  const hasPackages = Array.isArray(value.packages) && value.packages.every(isSocketPackage);
  return hasPackages;
};

export const isPatchable = (alert: SecurityAlert): alert is PatchableAlert => {
  const hasPatchedVersion = Boolean(alert.patchedVersion);
  return hasPatchedVersion;
};

const DIRECT_FIELDS = ["dependencies", "devDependencies"] as const;

const hasDeclaredRegistryAlias = (config: PastoralistJSON, name: string): boolean => {
  const groups = [
    config.dependencies,
    config.devDependencies,
    config.optionalDependencies,
    config.peerDependencies,
  ];
  const declarations = groups.flatMap((group) => Object.values(group ?? {}));
  const aliased = declarations.some((spec) => parseNpmAlias(spec)?.name === name);
  return aliased;
};

export const getDirectDependencyFields = (config: PastoralistJSON, name: string) => {
  const fields = DIRECT_FIELDS.filter((field) => Object.hasOwn(config[field] ?? {}, name));
  return fields;
};

const fixedCandidates = (alerts: SecurityAlert[], current: string): string[] => {
  const versions = alerts.flatMap(({ patchedVersion }) => (patchedVersion ? [patchedVersion] : []));
  const newer = versions.filter(
    (version) => isExactVersion(version) && compareVersions(version, current) > 0,
  );
  const candidates = Array.from(new Set(newer)).toSorted(compareVersions);
  return candidates;
};

export const selectPatchedVersion = (alert: SecurityAlert, alerts: SecurityAlert[]): string => {
  const related = alerts.filter((item) => item.packageName === alert.packageName);
  const candidates = fixedCandidates(related, alert.currentVersion);
  const safe = candidates.find((version) => isSecurityTargetSafe(version, related));
  const version = safe ?? alert.patchedVersion ?? "";
  return version;
};

export const normalizeSecurityRange = (range: string): string => {
  const normalized = range.replace(/,\s*/g, " ");
  return normalized;
};

export const isSecurityTargetSafe = (version: string, alerts: SecurityAlert[]): boolean => {
  const safe = alerts.every((alert) => {
    const range = normalizeSecurityRange(alert.vulnerableVersions);
    const supported = isVersionRangeSupported(range);
    const vulnerable = satisfiesVersionRange(version, range, true);
    const resolved = supported && !vulnerable;
    return resolved;
  });
  return safe;
};

const getInstalledFixBlocker = (
  fix: SecurityOverride,
  installed: SecurityPackage[],
): string | undefined => {
  const hasAlias = installed.some((pkg) => Boolean(pkg.registryName));
  if (hasAlias) return "Update npm alias dependency declarations manually";
  const blockers = installed.map((pkg) => {
    const differentLine = !isSameReleaseLine(pkg.version, fix.fromVersion);
    if (differentLine) return "Fix requires separate overrides for coexisting release lines";
    const downgrade = compareVersions(fix.toVersion, pkg.version) < 0;
    if (downgrade) return "Fix would downgrade an installed package";
    return undefined;
  });
  const blocker = blockers.find(Boolean);
  return blocker;
};

const getDirectFixBlocker = (fix: SecurityOverride, config: PastoralistJSON) => {
  const fields = getDirectDependencyFields(config, fix.packageName);
  const supported = fields.every((field) =>
    isVersionRangeSupported(config[field]?.[fix.packageName] ?? ""),
  );
  if (!supported) return "Update non-registry dependency declarations manually";
  return undefined;
};

const getGlobalFixBlocker = (
  fix: SecurityOverride,
  context: SecurityFixContext,
): string | undefined => {
  if (fix.targetStillVulnerable) return "No proposed version resolves all known advisories";
  const direct = getDirectDependencyFields(context.config, fix.packageName);
  if (direct.length) {
    const blocker = getDirectFixBlocker(fix, context.config);
    return blocker;
  }
  if (hasDeclaredRegistryAlias(context.config, fix.packageName))
    return "Update npm alias dependency declarations manually";
  if (context.workspace?.complete === false)
    return "Workspace dependency declarations require review";
  if (context.workspace?.names.has(fix.packageName))
    return "Update the declaring workspace manifest explicitly";
  const installed = context.inventory.filter((pkg) => pkg.name === fix.packageName);
  const blocker = getInstalledFixBlocker(fix, installed);
  return blocker;
};

const getApprovalReason = (
  fix: SecurityOverride,
  context: SecurityFixContext,
): string | undefined => {
  if (!isSameReleaseLine(fix.fromVersion, fix.toVersion)) return "Fix requires a major upgrade";
  const prerelease = fix.toVersion.split("+")[0].includes("-");
  if (prerelease) return "Fix requires a prerelease version";
  const direct = getDirectDependencyFields(context.config, fix.packageName);
  if (direct.length) return "Direct dependency update requires approval";
  const ranges = context.ranges.get(fix.packageName) ?? [];
  if (ranges.length === 0) return "Fix requires dependency range review";
  const compatible = ranges.every((range) => satisfiesVersionRange(fix.toVersion, range));
  if (!compatible) return "Fix falls outside a declared dependency range";
  return undefined;
};

export const classifySecurityFix = (
  fix: SecurityOverride,
  context: SecurityFixContext,
): SecurityOverride => {
  const fields = getDirectDependencyFields(context.config, fix.packageName);
  const dependencyFields = fields.length ? fields : undefined;
  const blocked = getGlobalFixBlocker(fix, context);
  const approvalRequired = getApprovalReason(fix, context);
  const alreadyConfigured = context.existingOverrides?.[fix.packageName] === fix.toVersion;
  const classified = Object.assign({}, fix, {
    dependencyFields,
    blocked,
    approvalRequired,
    alreadyConfigured,
  });
  return classified;
};

export const canApplySecurityFix = (fix: SecurityOverride): boolean => {
  if (!isExactVersion(fix.toVersion)) return false;
  const blocked = fix.blocked || fix.targetStillVulnerable;
  if (blocked) return false;
  if (fix.approved) return true;
  const needsApproval = fix.approvalRequired || fix.dependencyFields?.length;
  if (needsApproval) return false;
  const compatible = isSameReleaseLine(fix.fromVersion, fix.toVersion);
  return compatible;
};

export const createSecurityCandidateFilter =
  (context: SecurityFixContext) =>
  (packageName: string, fromVersion: string, toVersion: string): boolean => {
    const fix = { packageName, fromVersion, toVersion, reason: "", severity: "" };
    const classified = classifySecurityFix(fix, context);
    const allowed = canApplySecurityFix(classified);
    return allowed;
  };

export const getApplicableSecurityFixes = (
  fixes: SecurityOverride[],
  config: PastoralistJSON,
): SecurityOverride[] => {
  const classified = fixes.map((fix) => {
    const fields = getDirectDependencyFields(config, fix.packageName);
    if (!fields.length) return fix;
    const tagged = Object.assign({}, fix, { dependencyFields: fields });
    return tagged;
  });
  const applicable = classified.filter(canApplySecurityFix);
  return applicable;
};

const updateDependencyField = (
  config: PastoralistJSON,
  fix: SecurityOverride,
  field: "dependencies" | "devDependencies",
) => {
  const current = config[field]?.[fix.packageName] ?? "";
  const prefix = current.match(/^[~^]/)?.[0] ?? "";
  const version = `${prefix}${fix.toVersion}`;
  const dependencies = Object.assign({}, config[field], { [fix.packageName]: version });
  const updated = Object.assign({}, config, { [field]: dependencies });
  return updated;
};

const removeDirectRootOverride = (
  config: PastoralistJSON,
  name: string,
  field: "overrides" | "resolutions",
) => {
  const values = config[field];
  if (!values) return config;
  const remaining = omit(values, [name]);
  if (Object.keys(remaining).length === 0) {
    const cleaned = omit(config, [field]);
    return cleaned;
  }
  const updated = Object.assign({}, config, { [field]: remaining });
  return updated;
};

const removeDirectPnpmOverride = (config: PastoralistJSON, name: string): PastoralistJSON => {
  if (!config.pnpm?.overrides) return config;
  const overrides = omit(config.pnpm.overrides, [name]);
  const hasOverrides = Object.keys(overrides).length > 0;
  const pnpm = hasOverrides
    ? Object.assign({}, config.pnpm, { overrides })
    : omit(config.pnpm, ["overrides"]);
  if (Object.keys(pnpm).length === 0) {
    const cleaned = omit(config, ["pnpm"]);
    return cleaned;
  }
  const updated = Object.assign({}, config, { pnpm });
  return updated;
};

const applyDirectFix = (config: PastoralistJSON, fix: SecurityOverride): PastoralistJSON => {
  if (!fix.approved) return config;
  const fields = getDirectDependencyFields(config, fix.packageName);
  if (fields.length === 0) return config;
  const updated = fields.reduce(
    (current, field) => updateDependencyField(current, fix, field),
    config,
  );
  const withoutOverride = removeDirectRootOverride(updated, fix.packageName, "overrides");
  const withoutResolution = removeDirectRootOverride(
    withoutOverride,
    fix.packageName,
    "resolutions",
  );
  const cleaned = removeDirectPnpmOverride(withoutResolution, fix.packageName);
  return cleaned;
};

export const applyDirectDependencyUpdates = (
  config: PastoralistJSON,
  fixes: SecurityOverride[],
): PastoralistJSON => {
  const applicable = fixes.filter(canApplySecurityFix);
  const updated = applicable.reduce(applyDirectFix, config);
  return updated;
};

const getCompatibleGroup = (group: SecurityOverride[]): SecurityOverride[] => {
  const versions = new Set(group.map((fix) => fix.fromVersion));
  const [current] = versions;
  const sameLine = Array.from(versions).every((version) => isSameReleaseLine(current, version));
  if (!sameLine) {
    const empty: SecurityOverride[] = [];
    return empty;
  }
  const compatible = group.filter(
    (fix) => canApplySecurityFix(fix) && !fix.dependencyFields?.length,
  );
  return compatible;
};

export const getCompatibleGlobalFixes = (fixes: SecurityOverride[]): SecurityOverride[] => {
  const groups = groupBy(fixes, (fix) => fix.packageName);
  const compatible = Array.from(groups.values()).flatMap(getCompatibleGroup);
  return compatible;
};
