import { execFile } from "child_process";
import { promisify } from "util";
import type {
  SecurityAlert,
  NpmAuditAdvisory,
  NpmAuditResult,
  NpmAuditVulnerability,
  YarnAuditAdvisory,
  YarnAuditLine,
} from "../types";
import { logger } from "../observability";
import { detectPackageManager } from "../core/package";
import {
  DEFAULT_AUDIT_TIMEOUT,
  SECURITY_PATCHED_VERSION_PATTERN,
  SEVERITY_MAP,
} from "../core/security/constants";

type SecurityAlerts = SecurityAlert[];
type AsyncSecurityAlerts = Promise<SecurityAlerts>;
type AdvisoryCvesField = Partial<Pick<SecurityAlert, "cves">>;

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
    options: { root?: string } = {},
  ): AsyncSecurityAlerts {
    const hasPackages = packages.length > 0;
    if (!hasPackages) {
      const alerts: SecurityAlerts = [];
      return alerts;
    }

    const root = options.root || process.cwd();
    const pm = detectPackageManager(root);

    try {
      const rawAlerts = await this.runAudit(pm, root);
      const alerts = this.enrichWithVersions(rawAlerts, packages);
      return alerts;
    } catch (error) {
      const alerts = this.handleAuditError(pm, error);
      return alerts;
    }
  }

  private handleAuditError(pm: string, error: unknown): SecurityAlerts {
    const isError = error instanceof Error;
    const reason = isError ? error.message : "Unknown error";
    if (this.strict) {
      throw new Error(
        `Package manager audit failed (${pm}). Reason: ${reason}. Failing due to --strict mode.`,
        { cause: error },
      );
    }
    this.log.warn(
      `Package manager audit failed (${pm}). Dependencies NOT checked via ${pm} audit. ` +
        `Reason: ${reason}. Run with --debug for details or --strict to fail on errors.`,
      "fetchAlerts",
    );
    const alerts: SecurityAlerts = [];
    return alerts;
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
  ): AsyncSecurityAlerts {
    const execOptions = { timeout: DEFAULT_AUDIT_TIMEOUT, cwd: root };

    const { stdout } = await this.exec(pm, ["audit", "--json"], execOptions).catch(
      this.recoverAuditOutput,
    );
    const isYarn = pm === "yarn";
    if (isYarn) {
      const result = this.parseYarnAuditOutput(stdout);
      return result;
    }

    const parsed = JSON.parse(stdout) as NpmAuditResult;
    const result = this.parseNpmCompatibleOutput(parsed);
    return result;
  }

  private recoverAuditOutput(error: Error & { stdout?: string }): { stdout: string } {
    const { stdout } = error;
    if (!stdout) throw error;
    const output = { stdout };
    return output;
  }

  private parseNpmCompatibleOutput(parsed: NpmAuditResult): SecurityAlerts {
    const hasVulnerabilities = Boolean(parsed?.vulnerabilities);
    if (!hasVulnerabilities) {
      const npmCompatibleOutput: SecurityAlerts = [];
      return npmCompatibleOutput;
    }

    const alerts = Object.values(parsed.vulnerabilities).flatMap((vuln) =>
      this.convertNpmVulnerability(vuln),
    );
    return alerts;
  }

  private getNpmAdvisories(vuln: NpmAuditVulnerability): NpmAuditAdvisory[] {
    const npmAdvisories = vuln.via.filter(
      (v): v is NpmAuditAdvisory => typeof v === "object" && v !== null,
    );
    return npmAdvisories;
  }

  private convertNpmAdvisory(
    vuln: NpmAuditVulnerability,
    advisory: NpmAuditAdvisory,
  ): SecurityAlert {
    const patchedVersion = this.extractNpmPatchedVersion(vuln.fixAvailable);
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

  private parseYarnAuditOutput(stdout: string): SecurityAlerts {
    const lines = stdout.split("\n").filter(Boolean);
    const advisories = lines
      .map(this.parseYarnAuditLine)
      .filter((line): line is YarnAuditLine => line?.type === "auditAdvisory");
    const alerts = advisories.flatMap(({ data }) => {
      const { advisory } = data;
      if (!advisory) {
        const result: SecurityAlerts = [];
        return result;
      }
      const result = [this.convertYarnAdvisory(advisory)];
      return result;
    });
    return alerts;
  }

  private parseYarnAuditLine(line: string): YarnAuditLine | null {
    try {
      const result = JSON.parse(line) as YarnAuditLine;
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
  ): string | undefined {
    const isObject = typeof fixAvailable === "object" && fixAvailable !== null;
    if (!isObject) return undefined;
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
