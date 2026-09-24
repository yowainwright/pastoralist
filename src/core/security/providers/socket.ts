import { execFile } from "child_process";
import { promisify } from "util";
import type { SecurityAlert, SocketResult, SocketPackage, SocketIssue } from "../../../types";
import { logger } from "../../../observability";
import { CLIInstaller } from "../utils";
import { AUTH_MESSAGES } from "../constants";
import type { ExecFileAsync } from "../../types";
import type { SocketCLIProviderOptions } from "../types";

const execFileAsync = promisify(execFile);

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
    this.token = options.token || process.env.SOCKET_SECURITY_API_KEY;
    this.strict = options.strict || false;
    this.execFileAsync = options.execFileAsync ?? execFileAsync;
    this.log.warn(
      "Socket provider is EXPERIMENTAL. Report issues at https://github.com/yowainwright/pastoralist/issues",
      "constructor",
    );
  }

  ensureInstalled(): Promise<boolean> {
    const result = this.installer.ensureInstalled({
      packageName: "@socketsecurity/cli",
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

  private async runSocketScan(root?: string): Promise<SocketResult> {
    const { token: SOCKET_SECURITY_API_KEY } = this;
    const env = Object.assign({}, process.env, { SOCKET_SECURITY_API_KEY });

    const { stdout } = await this.execFileAsync(
      "socket",
      ["report", "create", "--format", "json"],
      {
        timeout: 60000,
        env,
        cwd: root,
      },
    );

    const result = JSON.parse(stdout);
    return result;
  }

  async fetchAlerts(
    _packages: Array<{ name: string; version: string }> = [],
    options: { root?: string } = {},
  ): Promise<SecurityAlert[]> {
    const isValid = await this.validatePrerequisites();

    if (!isValid) {
      const alerts: SecurityAlert[] = [];
      return alerts;
    }

    try {
      const result = await this.runSocketScan(options.root);
      const alerts = this.convertSocketAlerts(result);
      return alerts;
    } catch (error) {
      const alerts = this.handleScanError(error);
      return alerts;
    }
  }

  private handleScanError(error: unknown): SecurityAlert[] {
    this.log.debug("Socket scan failed", "fetchAlerts", { error });
    const isError = error instanceof Error;
    const reason = isError ? error.message : "Unknown error";
    if (this.strict) {
      throw new Error(
        `Socket security check failed. Reason: ${reason}. Failing due to --strict mode.`,
        { cause: error },
      );
    }
    this.log.warn(
      `Socket security check failed. Your dependencies were NOT checked. ` +
        `Reason: ${reason}. Run with --debug for details or --strict to fail on errors.`,
      "fetchAlerts",
    );
    const alerts: SecurityAlert[] = [];
    return alerts;
  }

  private convertSocketAlerts(socketResult: SocketResult): SecurityAlert[] {
    if (!socketResult?.packages) {
      const result: SecurityAlert[] = [];
      return result;
    }

    const alerts = socketResult.packages
      .filter((pkg) => pkg.issues && pkg.issues.length > 0)
      .flatMap((pkg) => this.convertPackageIssues(pkg));
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
        return "medium";
      case "low":
      case "info":
        return "low";
      default:
        return "medium";
    }
  }
}
