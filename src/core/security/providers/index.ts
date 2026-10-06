export { OSVProvider } from "./osv";
export { GitHubSecurityProvider } from "./github";
export { SnykCLIProvider } from "./snyk";
export { SocketCLIProvider } from "./socket";
export { SpektionProvider } from "./spektion";

import { execFile } from "child_process";
import { promisify } from "util";
import type {
  SecurityAlert,
  NpmAuditAdvisory,
  NpmAuditResult,
  NpmAuditVulnerability,
  SecurityProviderScanOptions,
  YarnAuditAdvisory,
  YarnAuditLine,
} from "../../../types";
import { logger } from "../../../observability";
import { isRecord, isString } from "../../../utils";
import { detectPackageManager } from "../../../mgrs";
import {
  DEFAULT_AUDIT_TIMEOUT,
  SECURITY_PATCHED_VERSION_PATTERN,
  SEVERITY_MAP,
} from "../constants";

import type { SecurityAlerts, AsyncSecurityAlerts, AdvisoryCvesField } from "../types";

const isNpmAuditVulnerability = (value: unknown): value is NpmAuditVulnerability => {
  if (!isRecord(value)) return false;
  const hasStrings = [value.name, value.range, value.severity].every(isString);
  if (!hasStrings) return false;
  const hasValidVia = value.via === undefined || Array.isArray(value.via);
  return hasValidVia;
};

const isNpmAuditVulnerabilityEntry = (
  entry: [string, unknown],
): entry is [string, NpmAuditVulnerability] => isNpmAuditVulnerability(entry[1]);

const isYarnAuditLine = (value: unknown): value is YarnAuditLine => {
  if (!isRecord(value)) return false;
  if (!isString(value.type)) return false;
  if (!isRecord(value.data)) return false;
  const hasAdvisory = value.type !== "auditAdvisory" || isYarnAuditAdvisory(value.data.advisory);
  return hasAdvisory;
};

const isYarnAuditAdvisory = (value: unknown): value is YarnAuditAdvisory => {
  if (!isRecord(value)) return false;
  const requiredFields = [
    value.module_name,
    value.severity,
    value.title,
    value.url,
    value.vulnerable_versions,
    value.patched_versions,
  ];
  const areRequiredFieldsValid = requiredFields.every(isString);
  return areRequiredFieldsValid;
};

export class PackageManagerAuditProvider {
  readonly providerType = "npm" as const;
  private log: ReturnType<typeof logger>;
  private strict: boolean;
  private exec = promisify(execFile);

  constructor(options: { debug?: boolean; strict?: boolean } = {}) {
    const isLogging = options.debug || false;
    this.log = logger({
      file: "security/package-manager-audit.ts",
      isLogging,
    });
    this.strict = options.strict || false;
  }

  async fetchAlerts(
    packages: Array<{ name: string; version: string }>,
    options: SecurityProviderScanOptions = {},
  ): AsyncSecurityAlerts {
    const hasPackages = packages.length > 0;
    if (!hasPackages) {
      const alerts: SecurityAlerts = [];
      return alerts;
    }

    const root = options.root || process.cwd();
    const pm = detectPackageManager(root);

    try {
      const rawAlerts = await this.runAudit(pm, root, options);
      const alerts = this.enrichWithVersions(rawAlerts, packages);
      return alerts;
    } catch (error) {
      const alerts = this.handleAuditError(pm, error, options);
      return alerts;
    }
  }

  private handleAuditError(
    pm: string,
    error: unknown,
    options: SecurityProviderScanOptions,
  ): SecurityAlerts {
    const isError = error instanceof Error;
    const reason = isError ? error.message : "Unknown error";
    if (this.shouldFailAudit(options)) this.throwAuditError(pm, reason, error);
    options.onIncomplete?.();
    this.warnAuditError(pm, reason);
    const alerts: SecurityAlerts = [];
    return alerts;
  }

  private shouldFailAudit(options: SecurityProviderScanOptions): boolean {
    const shouldFail = this.strict || options.requireCompleteScan === true;
    return shouldFail;
  }

  private throwAuditError(pm: string, reason: string, error: unknown): never {
    const failureMode = this.strict ? "--strict mode" : "a required complete scan";
    const message = `Package manager audit failed (${pm}). Reason: ${reason}. Failing due to ${failureMode}.`;
    throw new Error(message, { cause: error });
  }

  private warnAuditError(pm: string, reason: string): void {
    const message =
      `Package manager audit failed (${pm}). Dependencies NOT checked via ${pm} audit. ` +
      `Reason: ${reason}. Run with --debug for details or --strict to fail on errors.`;
    this.log.warn(message, "fetchAlerts");
  }

  private enrichWithVersions(
    alerts: SecurityAlerts,
    packages: Array<{ name: string; version: string }>,
  ): SecurityAlerts {
    const packageMap = new Map(packages.map((p) => [p.name, p.version]));
    const enriched = alerts.map((alert) => {
      const version = packageMap.get(alert.packageName);
      if (version) {
        const result = Object.assign({}, alert, { currentVersion: version });
        return result;
      }
      const currentVersion = alert.currentVersion || "unknown";
      const result = Object.assign({}, alert, { currentVersion });
      return result;
    });
    return enriched;
  }

  private async runAudit(
    pm: "npm" | "yarn" | "pnpm" | "bun",
    root: string = process.cwd(),
    options: SecurityProviderScanOptions = {},
  ): AsyncSecurityAlerts {
    const execOptions = { timeout: DEFAULT_AUDIT_TIMEOUT, cwd: root };

    const { stdout } = await this.exec(pm, ["audit", "--json"], execOptions).catch(
      this.recoverAuditOutput,
    );
    const isYarn = pm === "yarn";
    if (isYarn) {
      const result = this.parseYarnAuditOutput(stdout, options);
      return result;
    }

    const parsed = this.parseNpmAuditJson(stdout, options);
    const result = this.parseNpmCompatibleOutput(parsed);
    return result;
  }

  private parseNpmAuditJson(
    stdout: string,
    options: SecurityProviderScanOptions = {},
  ): NpmAuditResult {
    const parsed = this.parseAuditJson(stdout);
    const isAuditRecord = isRecord(parsed);
    if (!isAuditRecord) {
      throw new Error("Package manager audit returned an invalid JSON response");
    }
    const rawVulnerabilities = parsed.vulnerabilities;
    const isVulnerabilityRecord = isRecord(rawVulnerabilities);
    if (!isVulnerabilityRecord) {
      throw new Error("Package manager audit returned an invalid JSON response");
    }
    const vulnerabilities = this.parseNpmVulnerabilities(rawVulnerabilities, options);
    const result: NpmAuditResult = { vulnerabilities };
    return result;
  }

  private parseNpmVulnerabilities(
    vulnerabilities: Record<string, unknown>,
    options: SecurityProviderScanOptions,
  ): Record<string, NpmAuditVulnerability> {
    const entries = Object.entries(vulnerabilities);
    const validEntries = entries.filter(isNpmAuditVulnerabilityEntry);
    if (validEntries.length !== entries.length) {
      const reason = "Package manager audit returned malformed vulnerability entries";
      if (this.shouldFailAudit(options)) throw new Error(reason);
      options.onIncomplete?.();
      this.log.warn(reason, "parseNpmAuditJson");
    }
    const validVulnerabilities = Object.fromEntries(validEntries);
    return validVulnerabilities;
  }

  private parseAuditJson(stdout: string): unknown {
    try {
      const parsed: unknown = JSON.parse(stdout);
      return parsed;
    } catch (error) {
      throw new Error("Package manager audit returned invalid JSON", { cause: error });
    }
  }

  private recoverAuditOutput(error: Error & { stdout?: string }): { stdout: string } {
    const { stdout } = error;
    if (!stdout) throw error;
    const output = { stdout };
    return output;
  }

  private parseNpmCompatibleOutput(parsed: NpmAuditResult | null): SecurityAlerts {
    const vulnerabilities = parsed?.vulnerabilities;
    if (!vulnerabilities) {
      const npmCompatibleOutput: SecurityAlerts = [];
      return npmCompatibleOutput;
    }

    const alerts = Object.values(vulnerabilities).flatMap((vuln) =>
      this.convertNpmVulnerability(vuln),
    );
    return alerts;
  }

  private getNpmAdvisories(vuln: NpmAuditVulnerability): NpmAuditAdvisory[] {
    const via = vuln.via ?? [];
    const npmAdvisories = via.filter(
      (v): v is NpmAuditAdvisory => typeof v === "object" && v !== null,
    );
    return npmAdvisories;
  }

  private convertNpmAdvisory(
    vuln: NpmAuditVulnerability,
    advisory: NpmAuditAdvisory,
  ): SecurityAlert {
    const patchedVersion = this.extractNpmPatchedVersion(vuln.fixAvailable, vuln.name);
    const { name: packageName } = vuln;
    const vulnerableVersions = advisory.range || vuln.range;
    const severity = this.normalizeSeverity(advisory.severity);
    const { title, url } = advisory;
    const fixAvailable = Boolean(patchedVersion);
    const versions = { packageName, currentVersion: "", vulnerableVersions, patchedVersion };
    const details = { severity, title, url, fixAvailable };
    const result: SecurityAlert = Object.assign({}, versions, details);
    return result;
  }

  private convertNpmVulnerability(vuln: NpmAuditVulnerability): SecurityAlerts {
    const advisories = this.getNpmAdvisories(vuln);
    const result = advisories.map((advisory) => this.convertNpmAdvisory(vuln, advisory));
    return result;
  }

  private parseYarnAuditOutput(
    stdout: string,
    options: SecurityProviderScanOptions = {},
  ): SecurityAlerts {
    const lines = stdout.split("\n").filter(Boolean);
    const parsedLines = lines.map(this.parseYarnAuditLine);
    const hasMalformedOutput = lines.length === 0 || parsedLines.some((line) => line === null);
    const hasMissingAdvisories = this.hasPositiveSummaryWithoutAdvisories(parsedLines);
    const isIncomplete = hasMalformedOutput || hasMissingAdvisories;
    if (isIncomplete) this.handleMalformedYarnOutput(options);
    const advisories = parsedLines.filter(this.isYarnAdvisoryLine);
    const alerts = advisories.flatMap((line) => this.convertYarnAdvisoryLine(line));
    return alerts;
  }

  private hasPositiveSummaryWithoutAdvisories(lines: Array<YarnAuditLine | null>): boolean {
    const hasAdvisory = lines.some((line) => line?.type === "auditAdvisory");
    const summary = lines.find((line) => line?.type === "auditSummary");
    const hasPositiveCount = Object.values(summary?.data.vulnerabilities ?? {}).some(
      (count) => typeof count === "number" && count > 0,
    );
    const isMissingAdvisories = !hasAdvisory && hasPositiveCount;
    return isMissingAdvisories;
  }

  private isYarnAdvisoryLine(line: YarnAuditLine | null): line is YarnAuditLine {
    const isAdvisory = line?.type === "auditAdvisory";
    return isAdvisory;
  }

  private convertYarnAdvisoryLine(line: YarnAuditLine): SecurityAlerts {
    const { data } = line;
    const { advisory } = data;
    if (!advisory) throw new Error("Yarn audit returned an advisory without details");
    const alerts = [this.convertYarnAdvisory(advisory)];
    return alerts;
  }

  private handleMalformedYarnOutput(options: SecurityProviderScanOptions): void {
    const reason = "Yarn audit returned empty, malformed, or incomplete JSON output";
    const shouldFail = this.strict || options.requireCompleteScan;
    if (shouldFail) throw new Error(reason);
    options.onIncomplete?.();
    this.log.warn(reason, "parseYarnAuditOutput");
  }

  private parseYarnAuditLine(line: string): YarnAuditLine | null {
    try {
      const parsed: unknown = JSON.parse(line);
      const result = isYarnAuditLine(parsed) ? parsed : null;
      return result;
    } catch {
      return null;
    }
  }

  private convertYarnAdvisory(advisory: YarnAuditAdvisory): SecurityAlert {
    const {
      module_name: packageName,
      vulnerable_versions: vulnerableVersions,
      title,
      url,
    } = advisory;
    const patchedVersion = this.extractYarnPatchedVersion(advisory.patched_versions);
    const severity = this.normalizeSeverity(advisory.severity);
    const fixAvailable = Boolean(patchedVersion);
    const versions = { packageName, currentVersion: "", vulnerableVersions, patchedVersion };
    const details = { severity, title, url, fixAvailable };
    const cvesField = this.createAdvisoryCvesField(advisory);
    const alert = Object.assign({}, versions, details, cvesField);
    return alert;
  }

  private createAdvisoryCvesField(advisory: YarnAuditAdvisory): AdvisoryCvesField {
    if (!advisory.cves?.length) {
      const advisoryCvesField: AdvisoryCvesField = {};
      return advisoryCvesField;
    }
    const { cves } = advisory;
    const cvesField: AdvisoryCvesField = { cves };
    return cvesField;
  }

  private extractNpmPatchedVersion(
    fixAvailable: boolean | { name: string; version: string; isSemVerMajor: boolean } | undefined,
    packageName: string,
  ): string | undefined {
    const isObject = typeof fixAvailable === "object" && fixAvailable !== null;
    if (!isObject) return undefined;
    const isSamePackage = fixAvailable.name === packageName;
    if (!isSamePackage) return undefined;
    const npmPatchedVersion = fixAvailable.version;
    return npmPatchedVersion;
  }

  private extractYarnPatchedVersion(patchedVersions: string): string | undefined {
    const hasPatchedVersions = Boolean(patchedVersions);
    if (!hasPatchedVersions) return undefined;
    const isAvailable = patchedVersions !== "<0.0.0" && patchedVersions !== "No fix available";
    if (!isAvailable) return undefined;
    const match = patchedVersions.match(SECURITY_PATCHED_VERSION_PATTERN);
    const yarnPatchedVersion = match?.[1];
    return yarnPatchedVersion;
  }

  private normalizeSeverity(severity: string): "low" | "medium" | "high" | "critical" {
    const normalized = SEVERITY_MAP[severity.toLowerCase()];
    const result = normalized || "medium";
    return result;
  }
}
