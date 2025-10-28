import { execFile } from "child_process";
import { promisify } from "util";
import {
  DependabotAlert,
  SecurityAlert,
  SecurityCheckOptions,
  GithubApiError,
} from "./types";
import { logger } from "../scripts";
import {
  SECURITY_ENV_VARS,
  MOCK_DEPENDABOT_ALERT_LODASH,
  MOCK_DEPENDABOT_ALERT_MINIMIST,
} from "../constants";

const execFileAsync = promisify(execFile);

export class GitHubSecurityProvider {
  private owner: string;
  private repo: string;
  private token?: string;
  private log: ReturnType<typeof logger>;

  constructor(options: SecurityCheckOptions & { debug?: boolean }) {
    this.token = options.token || process.env.GITHUB_TOKEN;
    this.log = logger({ file: "github.ts", isLogging: options.debug });
    this.owner = options.owner || "";
    this.repo = options.repo || "";
  }

  async initialize(): Promise<void> {
    if (!this.owner) {
      this.owner = await this.getRepoOwner();
    }
    if (!this.repo) {
      this.repo = await this.getRepoName();
    }
  }

  private async getRepoOwner(): Promise<string> {
    try {
      const { stdout } = await execFileAsync("git", ["config", "--get", "remote.origin.url"]);
      const remoteUrl = stdout.trim();
      
      if (this.isGitHubUrl(remoteUrl)) {
        const match = remoteUrl.match(/github\.com[:/]([^/]+)\//);
        if (match) {
          return match[1];
        }
      }
    } catch {
      this.log.debug("Failed to get repo owner from git", "getRepoOwner");
    }
    throw new Error("Unable to determine GitHub repository owner");
  }

  private async getRepoName(): Promise<string> {
    try {
      const { stdout } = await execFileAsync("git", ["config", "--get", "remote.origin.url"]);
      const remoteUrl = stdout.trim();
      
      if (this.isGitHubUrl(remoteUrl)) {
        const match = remoteUrl.match(/github\.com[:/][^/]+\/([^/.]+)/);
        if (match) {
          return match[1];
        }
      }
    } catch {
      this.log.debug("Failed to get repo name from git", "getRepoName");
    }
    throw new Error("Unable to determine GitHub repository name");
  }

  private isGitHubUrl(url: string): boolean {
    if (url.startsWith("git@github.com:")) {
      return true;
    }
    
    try {
      const parsed = new URL(url);
      return parsed.hostname === "github.com";
    } catch {
      return false;
    }
  }

  async fetchAlerts(): Promise<SecurityAlert[]> {
    const dependabotAlerts = await this.fetchDependabotAlerts();
    return this.convertToSecurityAlerts(dependabotAlerts);
  }

  async fetchDependabotAlerts(): Promise<DependabotAlert[]> {
    await this.initialize();

    if (this.isMockMode()) {
      return this.fetchMockAlerts();
    }

    return this.fetchRealAlerts();
  }

  private isMockMode(): boolean {
    return process.env[SECURITY_ENV_VARS.MOCK_MODE] === "true";
  }

  private async fetchRealAlerts(): Promise<DependabotAlert[]> {
    const useGhCli = await this.isGhCliAvailable();
    
    if (useGhCli) {
      return this.fetchAlertsWithGhCli();
    }
    
    if (this.token) {
      return this.fetchAlertsWithApi();
    }
    
    throw new Error(
      "GitHub CLI not found and no GITHUB_TOKEN provided. Please install gh CLI or set GITHUB_TOKEN environment variable."
    );
  }

  private async fetchMockAlerts(): Promise<DependabotAlert[]> {
    this.log.debug("Using mock Dependabot alerts", "fetchMockAlerts");
    
    if (this.shouldForceVulnerable()) {
      return this.getMockVulnerableAlerts();
    }
    
    return [];
  }

  private shouldForceVulnerable(): boolean {
    return process.env[SECURITY_ENV_VARS.FORCE_VULNERABLE] === "true";
  }

  private async getMockVulnerableAlerts(): Promise<DependabotAlert[]> {
    const mockFile = process.env[SECURITY_ENV_VARS.MOCK_FILE];
    
    if (mockFile) {
      const alerts = await this.loadMockFile(mockFile);
      if (alerts) return alerts;
    }
    
    return this.getDefaultMockAlerts();
  }

  private async loadMockFile(filePath: string): Promise<DependabotAlert[] | null> {
    try {
      const { readFileSync } = await import("fs");
      const mockData = readFileSync(filePath, "utf-8");
      return JSON.parse(mockData);
    } catch (error) {
      this.log.debug("Failed to read mock file", "loadMockFile", { error });
      return null;
    }
  }

  private getDefaultMockAlerts(): DependabotAlert[] {
    return [
      MOCK_DEPENDABOT_ALERT_LODASH as DependabotAlert,
      MOCK_DEPENDABOT_ALERT_MINIMIST as DependabotAlert,
    ];
  }

  private async isGhCliAvailable(): Promise<boolean> {
    try {
      await execFileAsync("gh", ["--version"]);
      return true;
    } catch {
      return false;
    }
  }

  private async fetchAlertsWithGhCli(): Promise<DependabotAlert[]> {
    try {
      const args = ["api", `repos/${this.owner}/${this.repo}/dependabot/alerts`, "--paginate"];
      this.log.debug(`Fetching alerts with gh CLI: gh ${args.join(" ")}`, "fetchAlertsWithGhCli");
      
      const { stdout } = await execFileAsync("gh", args);
      const alerts = JSON.parse(stdout);
      
      return Array.isArray(alerts) ? alerts : [];
    } catch (error) {
      this.log.error("Failed to fetch alerts with gh CLI", "fetchAlertsWithGhCli", { error });
      throw new Error(`Failed to fetch Dependabot alerts: ${error}`);
    }
  }

  private async fetchAlertsWithApi(): Promise<DependabotAlert[]> {
    const url = `https://api.github.com/repos/${this.owner}/${this.repo}/dependabot/alerts`;
    
    try {
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${this.token}`,
          Accept: "application/vnd.github.v3+json",
        },
      });

      if (!response.ok) {
        const error: GithubApiError = await response.json();
        throw new Error(
          `GitHub API error: ${error.message || response.statusText}`
        );
      }

      const alerts = await response.json();
      return Array.isArray(alerts) ? alerts : [];
    } catch (error) {
      this.log.error("Failed to fetch alerts with API", "fetchAlertsWithApi", { error });
      throw new Error(`Failed to fetch Dependabot alerts: ${error}`);
    }
  }

  convertToSecurityAlerts(dependabotAlerts: DependabotAlert[]): SecurityAlert[] {
    return dependabotAlerts
      .filter((alert) => alert.state === "open")
      .map((alert) => {
        const vulnerability = alert.security_vulnerability;
        const advisory = alert.security_advisory;
        
        return {
          packageName: vulnerability.package.name,
          currentVersion: "",
          vulnerableVersions: vulnerability.vulnerable_version_range,
          patchedVersion: vulnerability.first_patched_version?.identifier,
          severity: this.normalizeSeverity(vulnerability.severity),
          title: advisory.summary,
          description: advisory.description,
          cve: advisory.cve_id,
          url: alert.html_url,
          fixAvailable: !!vulnerability.first_patched_version,
        };
      });
  }

  private normalizeSeverity(
    severity: string
  ): "low" | "medium" | "high" | "critical" {
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