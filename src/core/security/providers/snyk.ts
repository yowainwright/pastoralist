import { execFile } from "child_process";
import { promisify } from "util";
import type {
  SecurityAlert,
  SnykAlertVulnerability,
  SnykErrorWithStdout,
  SnykResult,
} from "../../../types";
import { logger } from "../../../utils";
import { CLIInstaller } from "../utils";
import { DEFAULT_CLI_TIMEOUT, DEFAULT_SNYK_SCAN_TIMEOUT, AUTH_MESSAGES } from "../constants";

const execFileAsync = promisify(execFile);

export class SnykCLIProvider {
  readonly providerType = "snyk" as const;
  private log: ReturnType<typeof logger>;
  private installer: CLIInstaller;
  private token?: string;
  private strict: boolean;

  constructor(options: { debug?: boolean; token?: string; strict?: boolean } = {}) {
    this.log = logger({
      file: "security/snyk.ts",
      isLogging: options.debug || false,
    });
    this.installer = new CLIInstaller({ debug: options.debug });
    this.token = options.token || process.env.SNYK_TOKEN;
    this.strict = options.strict || false;
    this.log.warn(
      "Snyk provider is EXPERIMENTAL. Report issues at https://github.com/yowainwright/pastoralist/issues",
      "constructor",
    );
  }

  async ensureInstalled(): Promise<boolean> {
    return this.installer.ensureInstalled({
      packageName: "snyk",
      cliCommand: "snyk",
    });
  }

  async isAuthenticated(): Promise<boolean> {
    if (!this.token) {
      const execOptions = { timeout: DEFAULT_CLI_TIMEOUT };
      try {
        await execFileAsync("snyk", ["config", "get", "api"], execOptions);
        return true;
      } catch {
        return false;
      }
    }
    return true;
  }

  async authenticate(): Promise<void> {
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
        await this.authenticate();
        return true;
      } catch {
        this.log.print("Snyk authentication failed, skipping Snyk scan");
        return false;
      }
    }

    return true;
  }

  private async runSnykScan(): Promise<SnykResult> {
    const env = this.token ? { ...process.env, SNYK_TOKEN: this.token } : process.env;
    const execOptions = { timeout: DEFAULT_SNYK_SCAN_TIMEOUT, env };
    const { stdout } = await execFileAsync("snyk", ["test", "--json"], execOptions);

    return JSON.parse(stdout);
  }

  async fetchAlerts(
    _packages: Array<{ name: string; version: string }> = [],
    _options: { root?: string } = {},
  ): Promise<SecurityAlert[]> {
    if (!(await this.validatePrerequisites())) {
      return [];
    }

    try {
      return await this.fetchSnykAlerts();
    } catch (error: unknown) {
      return this.handleSnykScanError(error);
    }
  }

  private async fetchSnykAlerts(): Promise<SecurityAlert[]> {
    const result = await this.runSnykScan();
    return this.convertSnykVulnerabilities(result);
  }

  private handleSnykScanError(error: unknown): SecurityAlert[] {
    const parsedAlerts = this.parseAlertsFromError(error);

    if (parsedAlerts) {
      return parsedAlerts;
    }

    this.log.debug("Snyk scan failed", "fetchAlerts", { error });
    const reason = error instanceof Error ? error.message : "Unknown error";

    if (this.strict) {
      throw new Error(
        `Snyk security check failed. Reason: ${reason}. Failing due to --strict mode.`,
      );
    }

    this.log.warn(this.createScanWarning(reason), "fetchAlerts");
    return [];
  }

  private parseAlertsFromError(error: unknown): SecurityAlert[] | undefined {
    const stdout = (error as SnykErrorWithStdout).stdout;

    if (!stdout) {
      return undefined;
    }

    try {
      return this.convertSnykVulnerabilities(JSON.parse(stdout));
    } catch {
      this.log.debug("Failed to parse Snyk error output", "fetchAlerts", { error });
      return undefined;
    }
  }

  private createScanWarning(reason: string): string {
    return (
      `Snyk security check failed. Your dependencies were NOT checked. ` +
      `Reason: ${reason}. Run with --debug for details or --strict to fail on errors.`
    );
  }

  private convertSnykVulnerabilities(snykResult: SnykResult): SecurityAlert[] {
    if (!snykResult.vulnerabilities || !Array.isArray(snykResult.vulnerabilities)) {
      return [];
    }

    return snykResult.vulnerabilities.map((vuln) => this.convertVulnToAlert(vuln));
  }

  private convertVulnToAlert(vuln: SnykAlertVulnerability): SecurityAlert {
    const cves = vuln.identifiers?.CVE || [];
    const base = this.createSnykAlertBase(vuln);
    return cves.length > 0 ? { ...base, cves } : base;
  }

  private createSnykAlertBase(vuln: SnykAlertVulnerability) {
    const patchedVersion = this.extractPatchedVersion(vuln);

    return {
      packageName: vuln.packageName || vuln.name || "",
      currentVersion: vuln.version,
      vulnerableVersions: vuln.semver?.vulnerable || "",
      patchedVersion,
      severity: this.normalizeSeverity(vuln.severity),
      title: vuln.title,
      description: vuln.description,
      url: vuln.url || `https://snyk.io/vuln/${vuln.id}`,
      fixAvailable: !!patchedVersion,
    };
  }

  private extractPatchedVersion(vuln: SnykAlertVulnerability): string | undefined {
    if (vuln.fixedIn && vuln.fixedIn.length > 0) {
      return vuln.fixedIn[0];
    }

    if (vuln.upgradePath && vuln.upgradePath.length > 1) {
      const lastItem = vuln.upgradePath[vuln.upgradePath.length - 1];
      if (typeof lastItem === "string") {
        return lastItem.split("@")[1];
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
