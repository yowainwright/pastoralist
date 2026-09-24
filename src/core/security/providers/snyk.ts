import { execFile } from "child_process";
import { promisify } from "util";
import type {
  SecurityAlert,
  SnykAlertVulnerability,
  SnykErrorWithStdout,
  SnykResult,
} from "../../../types";
import { logger } from "../../../observability";
import { CLIInstaller } from "../utils";
import { DEFAULT_CLI_TIMEOUT, DEFAULT_SNYK_SCAN_TIMEOUT, AUTH_MESSAGES } from "../constants";
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

  private async runSnykScan(root?: string): Promise<SnykResult> {
    const { token: SNYK_TOKEN } = this;
    const env = SNYK_TOKEN ? Object.assign({}, process.env, { SNYK_TOKEN }) : process.env;
    const execOptions = { timeout: DEFAULT_SNYK_SCAN_TIMEOUT, env, cwd: root };
    const { stdout } = await this.execFileAsync("snyk", ["test", "--json"], execOptions);

    const result = JSON.parse(stdout);
    return result;
  }

  async fetchAlerts(
    _packages: Array<{ name: string; version: string }> = [],
    options: { root?: string } = {},
  ): Promise<SecurityAlert[]> {
    if (!(await this.validatePrerequisites())) {
      const alerts: SecurityAlert[] = [];
      return alerts;
    }

    try {
      const alerts = await this.fetchSnykAlerts(options.root);
      return alerts;
    } catch (error: unknown) {
      const alerts = this.handleSnykScanError(error);
      return alerts;
    }
  }

  private async fetchSnykAlerts(root?: string): Promise<SecurityAlert[]> {
    const result = await this.runSnykScan(root);
    const snykAlerts = this.convertSnykVulnerabilities(result);
    return snykAlerts;
  }

  private handleSnykScanError(error: unknown): SecurityAlert[] {
    const parsedAlerts = this.parseAlertsFromError(error);

    if (parsedAlerts) {
      return parsedAlerts;
    }

    this.log.debug("Snyk scan failed", "fetchAlerts", { error });
    const isError = error instanceof Error;
    const reason = isError ? error.message : "Unknown error";

    if (this.strict) {
      throw new Error(
        `Snyk security check failed. Reason: ${reason}. Failing due to --strict mode.`,
      );
    }

    this.log.warn(this.createScanWarning(reason), "fetchAlerts");
    const result: SecurityAlert[] = [];
    return result;
  }

  private parseAlertsFromError(error: unknown): SecurityAlert[] | undefined {
    const stdout = (error as SnykErrorWithStdout).stdout;

    if (!stdout) {
      return undefined;
    }

    try {
      const alertsFromError = this.convertSnykVulnerabilities(JSON.parse(stdout));
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

  private convertSnykVulnerabilities(snykResult: SnykResult): SecurityAlert[] {
    const hasInvalidVulnerabilities =
      !snykResult.vulnerabilities || !Array.isArray(snykResult.vulnerabilities);
    if (hasInvalidVulnerabilities) {
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
    const vulnerableVersions = vuln.semver?.vulnerable || "";
    const severity = this.normalizeSeverity(vuln.severity);
    const url = vuln.url || `https://snyk.io/vuln/${vuln.id}`;
    const versions = { packageName, currentVersion, vulnerableVersions, patchedVersion };
    const advisory = { severity, title, description, url, fixAvailable };
    const snykAlertBase = Object.assign({}, versions, advisory);
    return snykAlertBase;
  }

  private extractPatchedVersion(vuln: SnykAlertVulnerability): string | undefined {
    const fixedIn = vuln.fixedIn;
    const hasFixedVersion = fixedIn && fixedIn.length > 0;
    if (hasFixedVersion) {
      const patchedVersion = fixedIn[0];
      return patchedVersion;
    }

    const upgradePath = vuln.upgradePath;
    const hasUpgradeTarget = upgradePath && upgradePath.length > 1;
    if (hasUpgradeTarget) {
      const lastItem = upgradePath[upgradePath.length - 1];
      if (typeof lastItem === "string") {
        const upgradeVersion = lastItem.split("@")[1];
        return upgradeVersion;
      }
    }

    return undefined;
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
