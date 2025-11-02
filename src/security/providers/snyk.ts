import { execFile } from "child_process";
import { promisify } from "util";
import { SecurityAlert, SnykResult, SnykVulnerability } from "../types";
import { logger } from "../../utils";
import { CLIInstaller } from "../cli-installer";

const execFileAsync = promisify(execFile);

export class SnykCLIProvider {
  private log: ReturnType<typeof logger>;
  private installer: CLIInstaller;
  private token?: string;

  constructor(options: { debug?: boolean; token?: string } = {}) {
    this.log = logger({ file: "security/snyk.ts", isLogging: options.debug || false });
    this.installer = new CLIInstaller({ debug: options.debug });
    this.token = options.token || process.env.SNYK_TOKEN;
  }

  async ensureInstalled(): Promise<boolean> {
    return this.installer.ensureInstalled({
      packageName: "snyk",
      cliCommand: "snyk",
    });
  }

  async isAuthenticated(): Promise<boolean> {
    if (!this.token) {
      try {
        await execFileAsync("snyk", ["config", "get", "api"]);
        return true;
      } catch {
        return false;
      }
    }
    return true;
  }

  async authenticate(): Promise<void> {
    if (this.token) {
      await execFileAsync("snyk", ["config", "set", `api=${this.token}`]);
      this.log.debug("Authenticated with Snyk using provided token", "authenticate");
    } else {
      throw new Error("Snyk requires authentication. Set SNYK_TOKEN or provide --securityProviderToken");
    }
  }

  private async validatePrerequisites(): Promise<boolean> {
    const isInstalled = await this.ensureInstalled();

    if (!isInstalled) {
      this.log.info("Snyk CLI not available, skipping Snyk scan", "validatePrerequisites");
      return false;
    }

    const isAuthed = await this.isAuthenticated();

    if (!isAuthed) {
      try {
        await this.authenticate();
        return true;
      } catch (error) {
        this.log.info("Snyk authentication failed, skipping Snyk scan", "validatePrerequisites", { error });
        return false;
      }
    }

    return true;
  }

  private async runSnykScan(): Promise<any> {
    const { stdout } = await execFileAsync("snyk", ["test", "--json"], {
      timeout: 60000,
    });

    return JSON.parse(stdout);
  }

  async fetchAlerts(): Promise<SecurityAlert[]> {
    const isValid = await this.validatePrerequisites();

    if (!isValid) {
      return [];
    }

    try {
      const result = await this.runSnykScan();
      return this.convertSnykVulnerabilities(result);
    } catch (error: unknown) {
      const err = error as { stdout?: string };
      if (err.stdout) {
        try {
          const result = JSON.parse(err.stdout);
          return this.convertSnykVulnerabilities(result);
        } catch {
          this.log.debug("Failed to parse Snyk error output", "fetchAlerts", { error });
        }
      }

      this.log.debug("Snyk scan failed", "fetchAlerts", { error });
      return [];
    }
  }

  private convertSnykVulnerabilities(snykResult: SnykResult): SecurityAlert[] {
    if (!snykResult.vulnerabilities || !Array.isArray(snykResult.vulnerabilities)) {
      return [];
    }

    return snykResult.vulnerabilities.map(vuln => this.convertVulnToAlert(vuln));
  }

  private convertVulnToAlert(vuln: SnykVulnerability & { semver?: { vulnerable?: string }; fixedIn?: string[]; url?: string; name?: string }): SecurityAlert {
    const packageName = vuln.packageName || vuln.name || "";
    const currentVersion = vuln.version;
    const vulnerableVersions = vuln.semver?.vulnerable || "";
    const patchedVersion = this.extractPatchedVersion(vuln);
    const severity = this.normalizeSeverity(vuln.severity);
    const title = vuln.title;
    const description = vuln.description;
    const cve = vuln.identifiers?.CVE?.[0];
    const url = vuln.url || `https://snyk.io/vuln/${vuln.id}`;
    const fixAvailable = !!patchedVersion;

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

  private extractPatchedVersion(vuln: SnykVulnerability & { fixedIn?: string[] }): string | undefined {
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
