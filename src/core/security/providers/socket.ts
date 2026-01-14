import { execFile } from "child_process";
import { promisify } from "util";
import {
  SecurityAlert,
  SocketResult,
  SocketPackage,
  SocketIssue,
} from "../../../types";
import { logger } from "../../../utils";
import { CLIInstaller } from "../utils";
import { AUTH_MESSAGES } from "../constants";

const execFileAsync = promisify(execFile);

export class SocketCLIProvider {
  private log: ReturnType<typeof logger>;
  private installer: CLIInstaller;
  private token?: string;
  private strict: boolean;

  constructor(
    options: { debug?: boolean; token?: string; strict?: boolean } = {},
  ) {
    this.log = logger({
      file: "security/socket.ts",
      isLogging: options.debug || false,
    });
    this.installer = new CLIInstaller({ debug: options.debug });
    this.token = options.token || process.env.SOCKET_SECURITY_API_KEY;
    this.strict = options.strict || false;
    this.log.warn(
      "Socket provider is EXPERIMENTAL. Report issues at https://github.com/yowainwright/pastoralist/issues",
      "constructor",
    );
  }

  async ensureInstalled(): Promise<boolean> {
    return this.installer.ensureInstalled({
      packageName: "@socketsecurity/cli",
      cliCommand: "socket",
    });
  }

  async isAuthenticated(): Promise<boolean> {
    return !!this.token;
  }

  private async validatePrerequisites(): Promise<boolean> {
    const isInstalled = await this.ensureInstalled();

    if (!isInstalled) {
      this.log.print("Socket CLI not available, skipping Socket scan");
      return false;
    }

    const isAuthed = await this.isAuthenticated();

    if (!isAuthed) {
      this.log.print(AUTH_MESSAGES.SOCKET_AUTH_REQUIRED);
      return false;
    }

    return true;
  }

  private async runSocketScan(): Promise<any> {
    const env = {
      ...process.env,
      SOCKET_SECURITY_API_KEY: this.token,
    };

    const { stdout } = await execFileAsync(
      "socket",
      ["report", "create", "--format", "json"],
      {
        timeout: 60000,
        env,
      },
    );

    return JSON.parse(stdout);
  }

  async fetchAlerts(): Promise<SecurityAlert[]> {
    const isValid = await this.validatePrerequisites();

    if (!isValid) {
      return [];
    }

    try {
      const result = await this.runSocketScan();
      return this.convertSocketAlerts(result);
    } catch (error) {
      this.log.debug("Socket scan failed", "fetchAlerts", { error });
      const reason = error instanceof Error ? error.message : "Unknown error";
      if (this.strict) {
        throw new Error(
          `Socket security check failed. Reason: ${reason}. Failing due to --strict mode.`,
        );
      }
      this.log.warn(
        `Socket security check failed. Your dependencies were NOT checked. ` +
          `Reason: ${reason}. Run with --debug for details or --strict to fail on errors.`,
        "fetchAlerts",
      );
      return [];
    }
  }

  private convertSocketAlerts(socketResult: SocketResult): SecurityAlert[] {
    if (!socketResult?.packages) {
      return [];
    }

    return socketResult.packages
      .filter((pkg) => pkg.issues && pkg.issues.length > 0)
      .flatMap((pkg) =>
        pkg.issues!.map((issue) => this.convertIssueToAlert(pkg, issue)),
      );
  }

  private convertIssueToAlert(
    pkg: SocketPackage,
    issue: SocketIssue,
  ): SecurityAlert {
    const isCVE = issue.type === "vulnerability";
    const packageName = pkg.name;
    const currentVersion = pkg.version;
    const vulnerableVersions = isCVE ? `<= ${currentVersion}` : "";
    const patchedVersion = undefined;
    const severity = this.mapSocketSeverity(issue.severity);
    const title = issue.title || issue.type;
    const description = issue.description;
    const cve = isCVE ? issue.cve : undefined;
    const url =
      issue.url ||
      `https://socket.dev/npm/package/${packageName}/overview/${currentVersion}`;
    const fixAvailable = false;

    return {
      packageName,
      currentVersion,
      vulnerableVersions,
      patchedVersion,
      severity,
      title,
      description,
      cve,
      url,
      fixAvailable,
    };
  }

  private mapSocketSeverity(
    severity: string,
  ): "low" | "medium" | "high" | "critical" {
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
