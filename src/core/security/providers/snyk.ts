import { execFile } from "child_process";
import { promisify } from "util";
import type {
  SecurityAlert,
  SecurityProviderScanOptions,
  SnykAlertVulnerability,
} from "../../../types";
import { logger } from "../../../observability";
import { getStringField } from "../../../utils";
import { CLIInstaller, isSnykResult } from "../utils";
import {
  DEFAULT_CLI_TIMEOUT,
  DEFAULT_SNYK_SCAN_TIMEOUT,
  AUTH_MESSAGES,
  SNYK_RANGE_JOINER,
  SNYK_VERSION_SEPARATOR,
} from "../constants";
import type { ExecFileAsync, SnykCLIProviderOptions } from "../../types";

const execFileAsync = promisify(execFile);

export class SnykCLIProvider {
  readonly providerType = "snyk" as const;
  private log: ReturnType<typeof logger>;
  private installer: CLIInstaller;
  private execFileAsync: ExecFileAsync;
  private token?: string;
  private strict: boolean;

  constructor(options: SnykCLIProviderOptions = {}) {
    const { debug } = options;
    const isLogging = debug || false;
    this.log = logger({
      file: "security/snyk.ts",
      isLogging,
    });
    this.installer = new CLIInstaller({ debug });
    this.execFileAsync = options.execFileAsync ?? execFileAsync;
    this.token = options.token || process.env.SNYK_TOKEN;
    this.strict = options.strict || false;
    this.log.warn(
      "Snyk provider is EXPERIMENTAL. Report issues at https://github.com/yowainwright/pastoralist/issues",
      "constructor",
    );
  }

  ensureInstalled(): Promise<boolean> {
    const result = this.installer.ensureInstalled({
      packageName: "snyk",
      cliCommand: "snyk",
    });
    return result;
  }

  async isAuthenticated(): Promise<boolean> {
    if (!this.token) {
      const execOptions = { timeout: DEFAULT_CLI_TIMEOUT };
      try {
        await this.execFileAsync("snyk", ["config", "get", "api"], execOptions);
        return true;
      } catch {
        return false;
      }
    }
    return true;
  }

  authenticate(): void {
    const hasToken = Boolean(this.token);
    if (!hasToken) {
      throw new Error(AUTH_MESSAGES.SNYK_AUTH_REQUIRED);
    }
    this.log.debug("Authenticated with Snyk using environment variable", "authenticate");
  }

  private async validatePrerequisites(): Promise<boolean> {
    const isInstalled = await this.ensureInstalled();

    if (!isInstalled) {
      this.log.print("Snyk CLI not available, skipping Snyk scan");
      return false;
    }

    const isAuthed = await this.isAuthenticated();

    if (!isAuthed) {
      try {
        this.authenticate();
        return true;
      } catch {
        this.log.print("Snyk authentication failed, skipping Snyk scan");
        return false;
      }
    }

    return true;
  }

  private async runSnykScan(root?: string): Promise<unknown> {
    const { token: SNYK_TOKEN } = this;
    const env = SNYK_TOKEN ? Object.assign({}, process.env, { SNYK_TOKEN }) : process.env;
    const execOptions = { timeout: DEFAULT_SNYK_SCAN_TIMEOUT, env, cwd: root };
    const { stdout } = await this.execFileAsync("snyk", ["test", "--json"], execOptions);

    const result: unknown = JSON.parse(stdout);
    return result;
  }

  async fetchAlerts(
    _packages: Array<{ name: string; version: string }> = [],
    options: SecurityProviderScanOptions = {},
  ): Promise<SecurityAlert[]> {
    if (!(await this.validatePrerequisites())) {
      const alerts = this.handleIncompleteScan("Snyk prerequisites are unavailable", options);
      return alerts;
    }

    try {
      const alerts = await this.fetchSnykAlerts(options.root);
      return alerts;
    } catch (error: unknown) {
      const alerts = this.handleSnykScanError(error, options);
      return alerts;
    }
  }

  private async fetchSnykAlerts(root?: string): Promise<SecurityAlert[]> {
    const result = await this.runSnykScan(root);
    if (!isSnykResult(result)) throw new Error("Snyk scan returned an invalid response");
    const snykAlerts = this.convertSnykVulnerabilities(result);
    return snykAlerts;
  }

  private handleSnykScanError(
    error: unknown,
    options: SecurityProviderScanOptions,
  ): SecurityAlert[] {
    const parsedAlerts = this.parseAlertsFromError(error);

    if (parsedAlerts) {
      return parsedAlerts;
    }

    this.log.debug("Snyk scan failed", "fetchAlerts", { error });
    const isError = error instanceof Error;
    const reason = isError ? error.message : "Unknown error";

    const shouldFail = this.strict || options.requireCompleteScan;
    if (shouldFail) {
      this.throwScanError(reason);
    }

    options.onIncomplete?.();
    this.log.warn(this.createScanWarning(reason), "fetchAlerts");
    const result: SecurityAlert[] = [];
    return result;
  }

  private throwScanError(reason: string): never {
    const message = `Snyk security check failed. Reason: ${reason}. Failing due to --strict mode.`;
    throw new Error(message);
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

  private parseAlertsFromError(error: unknown): SecurityAlert[] | undefined {
    const stdout = getStringField(error, "stdout");

    if (!stdout) {
      return undefined;
    }

    try {
      const parsed: unknown = JSON.parse(stdout);
      if (!isSnykResult(parsed)) return undefined;
      const alertsFromError = this.convertSnykVulnerabilities(parsed);
      return alertsFromError;
    } catch {
      this.log.debug("Failed to parse Snyk error output", "fetchAlerts", { error });
      return undefined;
    }
  }

  private createScanWarning(reason: string): string {
    const scanWarning =
      `Snyk security check failed. Your dependencies were NOT checked. ` +
      `Reason: ${reason}. Run with --debug for details or --strict to fail on errors.`;
    return scanWarning;
  }

  private convertSnykVulnerabilities(snykResult: unknown): SecurityAlert[] {
    if (!isSnykResult(snykResult)) {
      const result: SecurityAlert[] = [];
      return result;
    }

    const alerts = snykResult.vulnerabilities.map((vuln) => this.convertVulnToAlert(vuln));
    return alerts;
  }

  private convertVulnToAlert(vuln: SnykAlertVulnerability): SecurityAlert {
    const cves = vuln.identifiers?.CVE || [];
    const base = this.createSnykAlertBase(vuln);
    if (cves.length === 0) return base;
    const result = Object.assign({}, base, { cves });
    return result;
  }

  private createSnykAlertBase(vuln: SnykAlertVulnerability) {
    const patchedVersion = this.extractPatchedVersion(vuln);
    const packageName = vuln.packageName || vuln.name || "";
    const fixAvailable = Boolean(patchedVersion);
    const { version: currentVersion, title, description } = vuln;
    const vulnerableVersions = this.formatVulnerableVersions(vuln.semver?.vulnerable);
    const severity = this.normalizeSeverity(vuln.severity);
    const url = vuln.url || `https://snyk.io/vuln/${vuln.id}`;
    const versions = { packageName, currentVersion, vulnerableVersions, patchedVersion };
    const advisory = { severity, title, description, url, fixAvailable };
    const snykAlertBase = Object.assign({}, versions, advisory);
    return snykAlertBase;
  }

  private formatVulnerableVersions(vulnerable: string | string[] | undefined): string {
    const ranges = [vulnerable ?? []].flat();
    const formatted = ranges.join(SNYK_RANGE_JOINER);
    return formatted;
  }

  private extractPatchedVersion(vuln: SnykAlertVulnerability): string | undefined {
    const fixedIn = vuln.fixedIn;
    const hasFixedVersion = fixedIn && fixedIn.length > 0;
    if (hasFixedVersion) {
      const patchedVersion = fixedIn[0];
      return patchedVersion;
    }
    const upgradePath = vuln.upgradePath ?? [];
    const hasUpgradeTarget = upgradePath.length > 1;
    const lastItem = upgradePath.at(-1);
    if (!hasUpgradeTarget) return undefined;
    if (typeof lastItem !== "string") return undefined;
    const packageName = vuln.packageName || vuln.name || "";
    const upgradeVersion = this.parseUpgradeVersion(lastItem, packageName);
    return upgradeVersion;
  }

  private parseUpgradeVersion(item: string, packageName: string): string | undefined {
    const separatorIndex = item.lastIndexOf(SNYK_VERSION_SEPARATOR);
    if (separatorIndex <= 0) return undefined;
    const name = item.slice(0, separatorIndex);
    if (name !== packageName) return undefined;
    const version = item.slice(separatorIndex + 1);
    if (!version) return undefined;
    return version;
  }

  private normalizeSeverity(severity: string): "low" | "medium" | "high" | "critical" {
    const normalized = severity.toLowerCase();
    switch (normalized) {
      case "low":
      case "medium":
      case "high":
      case "critical":
        return normalized;
      default:
        return "medium";
    }
  }
}
