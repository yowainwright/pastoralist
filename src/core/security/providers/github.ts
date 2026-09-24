import { execFile } from "child_process";
import { readFileSync } from "fs";
import { promisify } from "util";
import {
  type DependabotAlert,
  type SecurityAlert,
  type SecurityCheckOptions,
  type GithubApiError,
  SecurityProviderPermissionError,
} from "../../../types";
import { retry } from "../../../utils";
import { logger } from "../../../observability";
import { SECURITY_ENV_VARS } from "../../../constants";
import {
  DEFAULT_CLI_TIMEOUT,
  DEFAULT_FETCH_TIMEOUT,
  DEFAULT_GH_CLI_TIMEOUT,
  AUTH_MESSAGES,
  GITHUB_DEFAULT_MOCK_ALERTS,
  GITHUB_NEXT_LINK_PATTERN,
  GITHUB_OWNER_PATTERN,
  GITHUB_REPOSITORY_PATTERN,
  GITHUB_REPOSITORY_SUFFIX_PATTERN,
  GITHUB_VULNERABLE_LOWER_BOUND_PATTERN,
} from "../constants";

const defaultExecFileAsync = promisify(execFile);

export class GitHubSecurityProvider {
  readonly providerType = "github" as const;
  private owner: string;
  private repo: string;
  private token?: string;
  private log: ReturnType<typeof logger>;
  protected execFileAsync: typeof defaultExecFileAsync = defaultExecFileAsync;

  constructor(options: SecurityCheckOptions & { debug?: boolean }) {
    this.token = options.token || process.env.GITHUB_TOKEN;
    const { debug: isLogging } = options;
    this.log = logger({ file: "github.ts", isLogging });
    this.log.debug(
      `Token provided: ${this.token ? "yes (length: " + this.token.length + ")" : "no"}`,
      "constructor",
    );
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
    const execOptions = { timeout: DEFAULT_CLI_TIMEOUT };
    try {
      const args = ["config", "--get", "remote.origin.url"];
      const { stdout } = await this.execFileAsync("git", args, execOptions);
      const remoteUrl = stdout.trim();

      if (this.isGitHubUrl(remoteUrl)) {
        const match = remoteUrl.match(GITHUB_OWNER_PATTERN);
        if (match) {
          const repoOwner = match[1];
          return repoOwner;
        }
      }
    } catch {
      this.log.debug("Failed to get repo owner from git", "getRepoOwner");
    }
    throw new Error("Unable to determine GitHub repository owner");
  }

  private async getRepoName(): Promise<string> {
    const execOptions = { timeout: DEFAULT_CLI_TIMEOUT };
    try {
      const args = ["config", "--get", "remote.origin.url"];
      const { stdout } = await this.execFileAsync("git", args, execOptions);
      const remoteUrl = stdout.trim();

      if (this.isGitHubUrl(remoteUrl)) {
        const match = remoteUrl.match(GITHUB_REPOSITORY_PATTERN);
        if (match) {
          const repoName = match[1].replace(GITHUB_REPOSITORY_SUFFIX_PATTERN, "");
          return repoName;
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
      const result = parsed.hostname === "github.com";
      return result;
    } catch {
      return false;
    }
  }

  async fetchAlerts(
    packages: Array<{ name: string; version: string }> = [],
    _options: { root?: string } = {},
  ): Promise<SecurityAlert[]> {
    this.log.debug("Fetching GitHub Dependabot alerts", "fetchAlerts");
    const dependabotAlerts = await this.fetchDependabotAlerts();
    this.log.debug(`Found ${dependabotAlerts.length} Dependabot alerts`, "fetchAlerts");
    const securityAlerts = this.convertToSecurityAlerts(dependabotAlerts, packages);
    this.log.debug(`Converted to ${securityAlerts.length} security alerts`, "fetchAlerts");
    return securityAlerts;
  }

  async fetchDependabotAlerts(): Promise<DependabotAlert[]> {
    await this.initialize();

    if (this.isMockMode()) {
      const dependabotAlerts = this.fetchMockAlerts();
      return dependabotAlerts;
    }

    const alerts = this.fetchRealAlerts();
    return alerts;
  }

  private isMockMode(): boolean {
    const result = process.env[SECURITY_ENV_VARS.MOCK_MODE] === "true";
    return result;
  }

  private async fetchRealAlerts(): Promise<DependabotAlert[]> {
    if (this.token) {
      this.log.debug("Using GitHub API with provided token", "fetchRealAlerts");
      const realAlerts = this.fetchAlertsWithApi();
      return realAlerts;
    }

    const useGhCli = await this.isGhCliAvailable();

    if (useGhCli) {
      this.log.debug("Using gh CLI (no token provided)", "fetchRealAlerts");
      const alerts = this.fetchAlertsWithGhCli();
      return alerts;
    }

    throw new Error(AUTH_MESSAGES.GITHUB_CLI_NOT_FOUND);
  }

  private fetchMockAlerts(): DependabotAlert[] {
    this.log.debug("Using mock Dependabot alerts", "fetchMockAlerts");

    if (this.shouldForceVulnerable()) {
      const mockAlerts = this.getMockVulnerableAlerts();
      return mockAlerts;
    }

    const alerts: DependabotAlert[] = [];
    return alerts;
  }

  private shouldForceVulnerable(): boolean {
    const result = process.env[SECURITY_ENV_VARS.FORCE_VULNERABLE] === "true";
    return result;
  }

  private getMockVulnerableAlerts(): DependabotAlert[] {
    const mockFile = process.env[SECURITY_ENV_VARS.MOCK_FILE];

    if (mockFile) {
      const alerts = this.loadMockFile(mockFile);
      if (alerts) return alerts;
    }

    const mockVulnerableAlerts = this.getDefaultMockAlerts();
    return mockVulnerableAlerts;
  }

  private loadMockFile(filePath: string): DependabotAlert[] | null {
    try {
      const mockData = readFileSync(filePath, "utf-8");
      const result = JSON.parse(mockData);
      return result;
    } catch (error) {
      this.log.debug("Failed to read mock file", "loadMockFile", { error });
      return null;
    }
  }

  private getDefaultMockAlerts(): DependabotAlert[] {
    return GITHUB_DEFAULT_MOCK_ALERTS;
  }

  private async isGhCliAvailable(): Promise<boolean> {
    const execOptions = { timeout: DEFAULT_CLI_TIMEOUT };
    try {
      await this.execFileAsync("gh", ["--version"], execOptions);
      return true;
    } catch {
      return false;
    }
  }

  private async executeGhCli(): Promise<string> {
    const args = ["api", `repos/${this.owner}/${this.repo}/dependabot/alerts`, "--paginate"];
    this.log.debug(`Fetching alerts with gh CLI: gh ${args.join(" ")}`, "executeGhCli");

    const execOptions = { timeout: DEFAULT_GH_CLI_TIMEOUT };
    const { stdout } = await this.execFileAsync("gh", args, execOptions);
    this.log.debug(`gh CLI stdout length: ${stdout.length}`, "executeGhCli");
    return stdout;
  }

  private async fetchAlertsWithGhCli(): Promise<DependabotAlert[]> {
    try {
      const stdout = await this.retryGhCliFetch();
      const alertsWithGhCli = this.parseGhCliAlerts(stdout);
      return alertsWithGhCli;
    } catch (error) {
      this.handleGhCliFetchError(error);
    }
  }

  private retryGhCliFetch(): Promise<string> {
    const onFailedAttempt = this.handleGhCliRetryFailure.bind(this);
    const result = retry(() => this.executeGhCli(), {
      retries: 3,
      factor: 2,
      minTimeout: 1000,
      onFailedAttempt,
    });
    return result;
  }

  private handleGhCliRetryFailure(error: Error & { attemptNumber?: number }): void {
    const errorMessage = String(error);

    if (this.isPermissionError(errorMessage)) {
      throw new SecurityProviderPermissionError("GitHub CLI", errorMessage);
    }

    this.log.debug(`gh CLI attempt ${error.attemptNumber} failed`, "fetchAlertsWithGhCli");
  }

  private parseGhCliAlerts(stdout: string): DependabotAlert[] {
    const alerts = JSON.parse(stdout);
    const alertCount = Array.isArray(alerts) ? alerts.length : "non-array";
    this.log.debug(`Parsed ${alertCount} alerts`, "fetchAlertsWithGhCli");
    const ghCliAlerts = Array.isArray(alerts) ? alerts : [];
    return ghCliAlerts;
  }

  private handleGhCliFetchError(error: unknown): never {
    if (error instanceof SecurityProviderPermissionError) {
      throw error;
    }

    const errorMessage = String(error);
    if (this.isPermissionError(errorMessage)) {
      throw new SecurityProviderPermissionError("GitHub CLI", errorMessage);
    }

    this.log.error("Failed to fetch alerts with gh CLI", "fetchAlertsWithGhCli", { error });
    throw new Error(`Failed to fetch Dependabot alerts: ${error}`);
  }

  private isPermissionError(message: string): boolean {
    const permissionPatterns = [
      "Resource not accessible by integration",
      "Must have admin rights",
      "Not Found",
      "Dependabot alerts are not enabled",
      "vulnerability alerts are disabled",
    ];
    const result = permissionPatterns.some((pattern) =>
      message.toLowerCase().includes(pattern.toLowerCase()),
    );
    return result;
  }

  private async fetchFromGitHubAPI(
    url = `https://api.github.com/repos/${this.owner}/${this.repo}/dependabot/alerts?per_page=100`,
  ): Promise<DependabotAlert[]> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), DEFAULT_FETCH_TIMEOUT);

    try {
      const response = await this.requestDependabotAlerts(url, controller.signal);
      const alerts = await this.readDependabotResponse(response);
      const nextUrl = this.getNextPageUrl(response);
      if (!nextUrl) return alerts;
      const nextAlerts = await this.fetchFromGitHubAPI(nextUrl);
      const fromGitHubAPI = alerts.concat(nextAlerts);
      return fromGitHubAPI;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private getNextPageUrl(response: Response): string | undefined {
    const links = response.headers?.get("link");
    if (!links) return undefined;
    const nextLink = links.split(",").find((link) => link.includes('rel="next"'));
    if (!nextLink) return undefined;
    const match = GITHUB_NEXT_LINK_PATTERN.exec(nextLink);
    const nextPageUrl = match?.[1];
    return nextPageUrl;
  }

  private requestDependabotAlerts(url: string, signal: AbortSignal): Promise<Response> {
    const Authorization = `Bearer ${this.token}`;
    const headers = { Authorization, Accept: "application/vnd.github.v3+json" };
    const result = fetch(url, {
      headers,
      signal,
    });
    return result;
  }

  private async readDependabotResponse(response: Response): Promise<DependabotAlert[]> {
    if (!response.ok) {
      await this.throwDependabotResponseError(response);
    }

    const alerts = await response.json();
    const result = Array.isArray(alerts) ? alerts : [];
    return result;
  }

  private async throwDependabotResponseError(response: Response): Promise<never> {
    const error: GithubApiError = await response.json();
    const errorMessage = error.message || response.statusText;

    if (this.isPermissionError(errorMessage)) {
      throw new SecurityProviderPermissionError("GitHub", errorMessage);
    }

    throw new Error(`GitHub API error: ${errorMessage}`);
  }

  private async fetchAlertsWithApi(): Promise<DependabotAlert[]> {
    try {
      const alertsWithApi = await this.retryApiFetch();
      return alertsWithApi;
    } catch (error) {
      const isPermissionError = error instanceof SecurityProviderPermissionError;
      if (isPermissionError) {
        throw error;
      }
      this.log.error("Failed to fetch alerts with API", "fetchAlertsWithApi", {
        error,
      });
      throw new Error(`Failed to fetch Dependabot alerts: ${error}`, { cause: error });
    }
  }

  private retryApiFetch(): Promise<DependabotAlert[]> {
    const onFailedAttempt = this.handleApiRetryFailure.bind(this);
    const pending = retry(() => this.fetchFromGitHubAPI(), {
      retries: 3,
      factor: 2,
      minTimeout: 1000,
      onFailedAttempt,
    });
    return pending;
  }

  private handleApiRetryFailure(error: Error & { attemptNumber?: number }): void {
    const isPermissionError = error.name === "SecurityProviderPermissionError";
    if (isPermissionError) throw error;
    this.log.debug(`GitHub API attempt ${error.attemptNumber} failed`, "fetchAlertsWithApi");
  }

  convertToSecurityAlerts(
    dependabotAlerts: DependabotAlert[],
    packages: Array<{ name: string; version: string }> = [],
  ): SecurityAlert[] {
    const packageVersions = new Map(packages.map((pkg) => [pkg.name, pkg.version]));

    const result = dependabotAlerts
      .filter((alert) => this.shouldIncludeAlert(alert, packageVersions))
      .map((alert) => this.convertDependabotAlert(alert, packageVersions));
    return result;
  }

  private shouldIncludeAlert(
    alert: DependabotAlert,
    packageVersions: Map<string, string>,
  ): boolean {
    const { name: packageName } = alert.security_vulnerability.package;
    const matchesPackageFilter = packageVersions.size === 0 || packageVersions.has(packageName);
    if (alert.state !== "open") return false;
    if (!this.isNpmAlert(alert)) return false;
    return matchesPackageFilter;
  }

  private convertDependabotAlert(
    alert: DependabotAlert,
    packageVersions: Map<string, string>,
  ): SecurityAlert {
    const { cve_id: cve } = alert.security_advisory;
    const cves = cve ? [cve] : [];
    const base = this.createDependabotAlertBase(alert, packageVersions);
    if (cves.length === 0) return base;
    const result = Object.assign({}, base, { cves });
    return result;
  }

  private createDependabotAlertBase(
    alert: DependabotAlert,
    packageVersions: Map<string, string>,
  ): SecurityAlert {
    const { security_vulnerability: vulnerability, html_url: url } = alert;
    const { name: packageName } = vulnerability.package;
    const { vulnerable_version_range: vulnerableVersions } = vulnerability;
    const { summary: title, description } = alert.security_advisory;
    const currentVersion = packageVersions.get(packageName) || this.extractCurrentVersion(alert);
    const { identifier: patchedVersion } = vulnerability.first_patched_version ?? {};
    const severity = this.normalizeSeverity(vulnerability.severity);
    const fixAvailable = Boolean(vulnerability.first_patched_version);
    const versions = { packageName, currentVersion, vulnerableVersions, patchedVersion };
    const advisory = { severity, title, description, url, fixAvailable };
    const base = Object.assign({}, versions, advisory);
    return base;
  }

  private isNpmAlert(alert: DependabotAlert): boolean {
    const dependencyEcosystem = alert.dependency?.package?.ecosystem;
    const vulnerabilityEcosystem = alert.security_vulnerability?.package?.ecosystem;
    const hasEcosystem = dependencyEcosystem || vulnerabilityEcosystem;
    if (!hasEcosystem) return true;
    if (dependencyEcosystem === "npm") return true;
    const result = vulnerabilityEcosystem === "npm";
    return result;
  }

  private extractCurrentVersion(alert: DependabotAlert): string {
    const vulnerableRange = alert.security_vulnerability.vulnerable_version_range;
    const hasLowerBound = vulnerableRange.includes(">=");
    if (!hasLowerBound) return "unknown";
    const match = vulnerableRange.match(GITHUB_VULNERABLE_LOWER_BOUND_PATTERN);
    const currentVersion = match ? match[1] : "unknown";
    return currentVersion;
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
