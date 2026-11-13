import { execFile } from "child_process";
import { promisify } from "util";
import type {
  SecurityAlert,
  SecurityProviderScanOptions,
  SocketPackage,
  SocketIssue,
  SocketResult,
  SecurityPackage,
} from "../../../types";
import { getStringField, isRecord } from "../../../utils";
import { logger } from "../../../observability";
import { CLIInstaller, isSocketResult } from "../utils";
import { AUTH_MESSAGES } from "../constants";
import type { ExecFileAsync } from "../../types";
import type { SocketCLIProviderOptions } from "../types";

const execFileAsync = promisify(execFile);
const SOCKET_SCAN_MAX_BUFFER = 10 * 1024 * 1024;
const SOCKET_CVE_SEVERITIES = new Map([
  ["cve", "high"],
  ["criticalCVE", "critical"],
  ["mediumCVE", "medium"],
  ["mildCVE", "low"],
]);

const toSocketIssue = (value: unknown): SocketIssue => {
  if (!isRecord(value)) throw new Error("Invalid Socket alert");
  const rawType = getStringField(value, "type");
  const rawSeverity = getStringField(value, "severity");
  const hasMetadata = rawType && rawSeverity;
  if (!hasMetadata) throw new Error("Invalid Socket alert metadata");
  const cveSeverity = SOCKET_CVE_SEVERITIES.get(rawType);
  const severity = cveSeverity ?? rawSeverity;
  const type = cveSeverity ? "vulnerability" : rawType;
  const title = getStringField(value, "title") ?? rawType;
  const description = getStringField(value, "description");
  const cve = getStringField(value.props, "cveId");
  const url = getStringField(value, "url");
  const issue = { type, severity, title, description, cve, url };
  return issue;
};

const toSocketPackage = (value: unknown): SocketPackage => {
  if (!isRecord(value)) throw new Error("Invalid Socket package");
  const packageName = getStringField(value, "name");
  const version = getStringField(value, "version");
  const hasIdentity = packageName && version;
  if (!hasIdentity) throw new Error("Invalid Socket package identity");
  const namespace = getStringField(value, "namespace");
  const isScoped = namespace && !packageName.startsWith(`${namespace}/`);
  const name = isScoped ? `${namespace}/${packageName}` : packageName;
  const alerts = value.alerts ?? [];
  if (!Array.isArray(alerts)) throw new Error("Invalid Socket package alerts");
  const issues = alerts.map(toSocketIssue);
  const pkg = { name, version, issues };
  return pkg;
};

const parseSocketPackages = (value: unknown, requested: SecurityPackage[]): SocketResult => {
  if (!isRecord(value)) throw new Error("Invalid Socket response");
  const succeeded = value.ok === true && Array.isArray(value.data);
  if (!succeeded) throw new Error("Socket package lookup did not complete");
  const packages = (value.data as unknown[]).map(toSocketPackage);
  const returned = new Set(packages.map((pkg) => `${pkg.name}@${pkg.version}`));
  const complete = requested.every((pkg) => returned.has(`${pkg.name}@${pkg.version}`));
  if (!complete) throw new Error("Socket returned an incomplete package inventory");
  const result = { packages };
  return result;
};

export class SocketCLIProvider {
  readonly providerType = "socket" as const;
  private log: ReturnType<typeof logger>;
  private installer: CLIInstaller;
  private token?: string;
  private strict: boolean;
  private execFileAsync: ExecFileAsync;

  constructor(options: SocketCLIProviderOptions = {}) {
    const { debug } = options;
    const isLogging = debug || false;
    this.log = logger({
      file: "security/socket.ts",
      isLogging,
    });
    this.installer = new CLIInstaller({ debug });
    this.token =
      options.token ||
      process.env.SOCKET_SECURITY_API_KEY ||
      process.env.SOCKET_CLI_API_TOKEN ||
      process.env.SOCKET_API_KEY;
    this.strict = options.strict || false;
    this.execFileAsync = options.execFileAsync ?? execFileAsync;
    this.log.warn(
      "Socket provider is EXPERIMENTAL. Report issues at https://github.com/yowainwright/pastoralist/issues",
      "constructor",
    );
  }

  ensureInstalled(): Promise<boolean> {
    const result = this.installer.ensureInstalled({
      packageName: "socket",
      cliCommand: "socket",
    });
    return result;
  }

  isAuthenticated(): boolean {
    const result = Boolean(this.token);
    return result;
  }

  private async validatePrerequisites(): Promise<boolean> {
    const isInstalled = await this.ensureInstalled();

    if (!isInstalled) {
      this.log.print("Socket CLI not available, skipping Socket scan");
      return false;
    }

    const isAuthed = this.isAuthenticated();

    if (!isAuthed) {
      this.log.print(AUTH_MESSAGES.SOCKET_AUTH_REQUIRED);
      return false;
    }

    return true;
  }

  private async runSocketScan(packages: SecurityPackage[], root?: string): Promise<unknown> {
    if (packages.length === 0) throw new Error("Socket requires a resolved package inventory");
    const { token: SOCKET_CLI_API_TOKEN } = this;
    const env = Object.assign({}, process.env, { SOCKET_CLI_API_TOKEN });
    const identifiers = packages.map((pkg) => `${pkg.name}@${pkg.version}`);
    const flags = ["--json", "--no-interactive", "--no-banner", "--no-spinner"];
    const args = ["package", "shallow", "npm"].concat(identifiers, flags);
    const options = { timeout: 60000, env, cwd: root, maxBuffer: SOCKET_SCAN_MAX_BUFFER };
    const { stdout } = await this.execFileAsync("socket", args, options);
    const result = parseSocketPackages(JSON.parse(stdout), packages);
    return result;
  }

  async fetchAlerts(
    packages: SecurityPackage[] = [],
    options: SecurityProviderScanOptions = {},
  ): Promise<SecurityAlert[]> {
    const isValid = await this.validatePrerequisites();

    if (!isValid) {
      const alerts = this.handleIncompleteScan("Socket prerequisites are unavailable", options);
      return alerts;
    }

    try {
      const result = await this.runSocketScan(packages, options.root);
      const socketResult = this.validateSocketResult(result);
      const alerts = this.convertSocketAlerts(socketResult);
      return alerts;
    } catch (error) {
      const alerts = this.handleScanError(error, options);
      return alerts;
    }
  }

  private handleScanError(error: unknown, options: SecurityProviderScanOptions): SecurityAlert[] {
    this.log.debug("Socket scan failed", "fetchAlerts", { error });
    const isError = error instanceof Error;
    const reason = isError ? error.message : "Unknown error";
    const shouldFail = this.strict || options.requireCompleteScan;
    if (shouldFail) {
      throw new Error(
        `Socket security check failed. Reason: ${reason}. Failing due to --strict mode.`,
        { cause: error },
      );
    }
    options.onIncomplete?.();
    this.log.warn(
      `Socket security check failed. Your dependencies were NOT checked. ` +
        `Reason: ${reason}. Run with --debug for details or --strict to fail on errors.`,
      "fetchAlerts",
    );
    const alerts: SecurityAlert[] = [];
    return alerts;
  }

  private convertSocketAlerts(socketResult: unknown): SecurityAlert[] {
    if (!isSocketResult(socketResult)) {
      const alerts: SecurityAlert[] = [];
      return alerts;
    }

    const alerts = socketResult.packages
      .filter((pkg) => pkg.issues && pkg.issues.length > 0)
      .flatMap((pkg) => this.convertPackageIssues(pkg));
    return alerts;
  }

  private validateSocketResult(result: unknown) {
    if (!isSocketResult(result)) throw new Error("Socket scan returned an invalid response");
    return result;
  }

  private handleIncompleteScan(
    reason: string,
    options: SecurityProviderScanOptions,
  ): SecurityAlert[] {
    options.onIncomplete?.();
    const shouldFail = this.strict || options.requireCompleteScan;
    if (shouldFail) throw new Error(reason);
    const alerts: SecurityAlert[] = [];
    return alerts;
  }

  private convertPackageIssues(pkg: SocketPackage): SecurityAlert[] {
    const issues = pkg.issues || [];
    const result = issues.map((issue) => this.convertIssueToAlert(pkg, issue));
    return result;
  }

  private convertIssueToAlert(pkg: SocketPackage, issue: SocketIssue): SecurityAlert {
    const base = this.createSocketAlertBase(pkg, issue);
    const hasCVE = issue.type === "vulnerability" && issue.cve;
    const cves = hasCVE ? [issue.cve!] : [];
    if (cves.length === 0) return base;
    const alert = Object.assign({}, base, { cves });
    return alert;
  }

  private createSocketAlertBase(pkg: SocketPackage, issue: SocketIssue): SecurityAlert {
    const isCVE = issue.type === "vulnerability";
    const { name: packageName, version: currentVersion } = pkg;
    const vulnerableVersions = isCVE ? `<= ${currentVersion}` : "";
    const severity = this.mapSocketSeverity(issue.severity);
    const title = issue.title || issue.type;
    const { description } = issue;
    const url =
      issue.url || `https://socket.dev/npm/package/${packageName}/overview/${currentVersion}`;
    const versions = { packageName, currentVersion, vulnerableVersions, patchedVersion: undefined };
    const advisory = { severity, title, description, url, fixAvailable: false };
    const alert = Object.assign({}, versions, advisory);
    return alert;
  }

  private mapSocketSeverity(severity: string): "low" | "medium" | "high" | "critical" {
    const normalized = severity.toLowerCase();

    switch (normalized) {
      case "critical":
        return "critical";
      case "high":
        return "high";
      case "medium":
      case "moderate":
      case "middle":
        return "medium";
      case "low":
      case "info":
        return "low";
      default:
        return "medium";
    }
  }
}
