import { execFile } from "child_process";
import { promisify } from "util";
import { SecurityAlert } from "./types";
import { logger } from "../scripts";
import { CLIInstaller } from "./cli-installer";

const execFileAsync = promisify(execFile);

export class SocketCLIProvider {
  private log: ReturnType<typeof logger>;
  private installer: CLIInstaller;
  private token?: string;

  constructor(options: { debug?: boolean; token?: string } = {}) {
    this.log = logger({ file: "security/socket.ts", isLogging: options.debug || false });
    this.installer = new CLIInstaller({ debug: options.debug });
    this.token = options.token || process.env.SOCKET_SECURITY_API_KEY;
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
      this.log.info("Socket CLI not available, skipping Socket scan", "validatePrerequisites");
      return false;
    }

    const isAuthed = await this.isAuthenticated();

    if (!isAuthed) {
      this.log.info(
        "Socket requires authentication. Set SOCKET_SECURITY_API_KEY or provide --securityProviderToken",
        "validatePrerequisites"
      );
      return false;
    }

    return true;
  }

  private async runSocketScan(): Promise<any> {
    const env = {
      ...process.env,
      SOCKET_SECURITY_API_KEY: this.token,
    };

    const { stdout } = await execFileAsync("socket", ["report", "create", "--format", "json"], {
      timeout: 60000,
      env,
    });

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
      return [];
    }
  }

  private convertSocketAlerts(socketResult: any): SecurityAlert[] {
    if (!socketResult?.packages) {
      return [];
    }

    return socketResult.packages
      .filter((pkg: any) => pkg.issues && pkg.issues.length > 0)
      .flatMap((pkg: any) =>
        pkg.issues.map((issue: any) => this.convertIssueToAlert(pkg, issue))
      );
  }

  private convertIssueToAlert(pkg: any, issue: any): SecurityAlert {
    const isCVE = issue.type === "vulnerability";
    const packageName = pkg.name;
    const currentVersion = pkg.version;
    const vulnerableVersions = isCVE ? `<= ${currentVersion}` : "";
    const patchedVersion = undefined;
    const severity = this.mapSocketSeverity(issue.severity);
    const title = issue.title || issue.type;
    const description = issue.description;
    const cve = isCVE ? issue.cve : undefined;
    const url = issue.url || `https://socket.dev/npm/package/${packageName}/overview/${currentVersion}`;
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
