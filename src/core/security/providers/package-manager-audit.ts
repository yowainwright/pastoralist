import { execFile } from "child_process";
import { promisify } from "util";
import type {
  SecurityAlert,
  NpmAuditAdvisory,
  NpmAuditResult,
  YarnAuditLine,
} from "../../../types";
import { logger } from "../../../utils";
import { detectPackageManager } from "../../packageJSON";
import { SEVERITY_MAP } from "../constants";

const execFileAsync = promisify(execFile);

const DEFAULT_AUDIT_TIMEOUT = 120000;

export class PackageManagerAuditProvider {
  readonly providerType = "npm" as const;
  private log: ReturnType<typeof logger>;
  private strict: boolean;

  constructor(options: { debug?: boolean; strict?: boolean } = {}) {
    this.log = logger({
      file: "security/package-manager-audit.ts",
      isLogging: options.debug || false,
    });
    this.strict = options.strict || false;
  }

  async fetchAlerts(
    packages: Array<{ name: string; version: string }>,
  ): Promise<SecurityAlert[]> {
    if (packages.length === 0) return [];

    const pm = detectPackageManager();

    try {
      const rawAlerts = await this.runAudit(pm);
      return this.enrichWithVersions(rawAlerts, packages);
    } catch (error) {
      const reason = error instanceof Error ? error.message : "Unknown error";
      if (this.strict) {
        throw new Error(
          `Package manager audit failed (${pm}). Reason: ${reason}. Failing due to --strict mode.`,
        );
      }
      this.log.warn(
        `Package manager audit failed (${pm}). Dependencies NOT checked via ${pm} audit. ` +
          `Reason: ${reason}. Run with --debug for details or --strict to fail on errors.`,
        "fetchAlerts",
      );
      return [];
    }
  }

  private enrichWithVersions(
    alerts: SecurityAlert[],
    packages: Array<{ name: string; version: string }>,
  ): SecurityAlert[] {
    const packageMap = new Map(packages.map((p) => [p.name, p.version]));
    return alerts
      .map((alert) => {
        const version = packageMap.get(alert.packageName);
        return version ? { ...alert, currentVersion: version } : null;
      })
      .filter((alert): alert is SecurityAlert => alert !== null);
  }

  private async runAudit(
    pm: "npm" | "yarn" | "pnpm" | "bun",
  ): Promise<SecurityAlert[]> {
    const execOptions = { timeout: DEFAULT_AUDIT_TIMEOUT };

    if (pm === "yarn") {
      const { stdout } = await execFileAsync(
        "yarn",
        ["audit", "--json"],
        execOptions,
      ).catch((err: Error & { stdout?: string }) => {
        const hasOutput = Boolean(err.stdout);
        if (hasOutput) return { stdout: err.stdout! };
        throw err;
      });
      return this.parseYarnAuditOutput(stdout);
    }

    const cmd = pm === "bun" ? "bun" : pm;
    const { stdout } = await execFileAsync(
      cmd,
      ["audit", "--json"],
      execOptions,
    ).catch((err: Error & { stdout?: string }) => {
      const hasOutput = Boolean(err.stdout);
      if (hasOutput) return { stdout: err.stdout! };
      throw err;
    });

    const parsed = JSON.parse(stdout) as NpmAuditResult;
    return this.parseNpmCompatibleOutput(parsed);
  }

  private parseNpmCompatibleOutput(parsed: NpmAuditResult): SecurityAlert[] {
    const hasVulnerabilities = Boolean(parsed?.vulnerabilities);
    if (!hasVulnerabilities) return [];

    return Object.values(parsed.vulnerabilities).flatMap((vuln) => {
      const advisories = vuln.via.filter(
        (v): v is NpmAuditAdvisory => typeof v === "object" && v !== null,
      );
      return advisories.map((advisory) => {
        const patchedVersion = this.extractNpmPatchedVersion(vuln.fixAvailable);
        const base: SecurityAlert = {
          packageName: vuln.name,
          currentVersion: "",
          vulnerableVersions: advisory.range || vuln.range,
          patchedVersion,
          severity: this.normalizeSeverity(advisory.severity),
          title: advisory.title,
          url: advisory.url,
          fixAvailable: Boolean(patchedVersion),
        };
        return base;
      });
    });
  }

  private parseYarnAuditOutput(stdout: string): SecurityAlert[] {
    const lines = stdout.split("\n").filter(Boolean);
    return lines
      .map((line) => {
        try {
          return JSON.parse(line) as YarnAuditLine;
        } catch {
          return null;
        }
      })
      .filter((line): line is YarnAuditLine => line?.type === "auditAdvisory")
      .flatMap(({ data }) => {
        const { advisory } = data;
        if (!advisory) return [];
        const patchedVersion = this.extractYarnPatchedVersion(
          advisory.patched_versions,
        );
        const base: SecurityAlert = {
          packageName: advisory.module_name,
          currentVersion: "",
          vulnerableVersions: advisory.vulnerable_versions,
          patchedVersion,
          severity: this.normalizeSeverity(advisory.severity),
          title: advisory.title,
          url: advisory.url,
          fixAvailable: Boolean(patchedVersion),
        };
        const cvesField =
          advisory.cves && advisory.cves.length > 0
            ? { cves: advisory.cves }
            : {};
        return [{ ...base, ...cvesField }];
      });
  }

  private extractNpmPatchedVersion(
    fixAvailable:
      | boolean
      | { name: string; version: string; isSemVerMajor: boolean }
      | undefined,
  ): string | undefined {
    const isObject = typeof fixAvailable === "object" && fixAvailable !== null;
    if (!isObject) return undefined;
    return fixAvailable.version;
  }

  private extractYarnPatchedVersion(
    patchedVersions: string,
  ): string | undefined {
    const hasNoFix =
      !patchedVersions ||
      patchedVersions === "<0.0.0" ||
      patchedVersions === "No fix available";
    if (hasNoFix) return undefined;
    const match = patchedVersions.match(/>=\s*([\d.]+)/);
    return match?.[1];
  }

  private normalizeSeverity(
    severity: string,
  ): "low" | "medium" | "high" | "critical" {
    const normalized = SEVERITY_MAP[severity.toLowerCase()];
    return normalized || "medium";
  }
}
