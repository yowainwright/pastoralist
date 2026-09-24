import type { SecurityAlert, SecurityProviderScanOptions } from "../../../types";
import { logger } from "../../../observability";
import { SPEKTION_API, SEVERITY_MAP } from "../constants";
import type { Severity } from "../types";

const mapSeverity = (severity: string): Severity =>
  SEVERITY_MAP[severity.toLowerCase()] ?? "medium";

const convertVulnerability = (vuln: unknown): SecurityAlert | null => {
  const isInvalidVulnerability = !vuln || typeof vuln !== "object";
  if (isInvalidVulnerability) return null;
  const v = vuln as Record<string, unknown>;
  const versions = getVulnerabilityVersions(v);
  const advisory = getVulnerabilityAdvisory(v, versions.patchedVersion);
  const alert = Object.assign({}, versions, advisory);
  return alert;
};

const getVulnerabilityVersions = (v: Record<string, unknown>) => {
  const packageName = String(v.package ?? "");
  const currentVersion = String(v.version ?? "");
  const vulnerableVersions = v.vulnerableRange ? String(v.vulnerableRange) : "";
  const patchedVersion = v.patchedVersion ? String(v.patchedVersion) : undefined;
  const versions = { packageName, currentVersion, vulnerableVersions, patchedVersion };
  return versions;
};

const getVulnerabilityAdvisory = (
  v: Record<string, unknown>,
  patchedVersion: string | undefined,
) => {
  const severity = mapSeverity(String(v.severity ?? ""));
  const title = String(v.title ?? v.description ?? "Vulnerability");
  const description = v.description ? String(v.description) : undefined;
  const cves = v.cve ? [String(v.cve)] : undefined;
  const url = v.url ? String(v.url) : undefined;
  const fixAvailable = Boolean(patchedVersion);
  const advisory = { severity, title, description, cves, url, fixAvailable };
  return advisory;
};

const convertAlerts = (result: unknown): SecurityAlert[] => {
  const isInvalidResult = !result || typeof result !== "object";
  if (isInvalidResult) {
    const alerts: SecurityAlert[] = [];
    return alerts;
  }
  const data = result as Record<string, unknown>;
  if (!Array.isArray(data.vulnerabilities)) {
    const alerts: SecurityAlert[] = [];
    return alerts;
  }
  const alerts = data.vulnerabilities
    .map(convertVulnerability)
    .filter((a): a is SecurityAlert => a !== null);
  return alerts;
};

const scanPackages = async (
  token: string,
  packages: Array<{ name: string; version: string }>,
): Promise<SecurityAlert[]> => {
  const Authorization = `Bearer ${token}`;
  const headers = { "Content-Type": "application/json", Authorization };
  const body = JSON.stringify({ packages });
  const response = await fetch(SPEKTION_API.SCAN, {
    method: "POST",
    headers,
    body,
  });

  if (!response.ok) throw new Error(`HTTP ${response.status}`);

  const result = await response.json();
  const alerts = convertAlerts(result);
  return alerts;
};

export class SpektionProvider {
  readonly providerType = "spektion" as const;
  private log: ReturnType<typeof logger>;
  private token?: string;
  private strict: boolean;

  constructor(options: { debug?: boolean; token?: string; strict?: boolean } = {}) {
    const isLogging = options.debug || false;
    this.log = logger({
      file: "security/spektion.ts",
      isLogging,
    });
    this.token = options.token || process.env.SPEKTION_API_KEY;
    this.strict = options.strict || false;
    this.log.debug("SpektionProvider initialized (experimental)", "constructor");
  }

  isAuthenticated(): boolean {
    const result = Boolean(this.token);
    return result;
  }

  async fetchAlerts(
    packages: Array<{ name: string; version: string }>,
    options: SecurityProviderScanOptions = {},
  ): Promise<SecurityAlert[]> {
    if (!this.token) {
      const alerts = this.handleMissingToken(options);
      return alerts;
    }

    try {
      const alerts = await scanPackages(this.token, packages);
      return alerts;
    } catch (error) {
      const alerts = this.handleScanError(error, options);
      return alerts;
    }
  }

  private handleMissingToken(options: SecurityProviderScanOptions): SecurityAlert[] {
    const message =
      "Spektion requires authentication. Set SPEKTION_API_KEY or provide --securityProviderToken.";
    if (options.requireCompleteScan) throw new Error(message);
    options.onIncomplete?.();
    this.log.print(message);
    const result: SecurityAlert[] = [];
    return result;
  }

  private handleScanError(error: unknown, options: SecurityProviderScanOptions): SecurityAlert[] {
    const isError = error instanceof Error;
    const reason = isError ? error.message : "Unknown error";
    const shouldFail = this.strict || options.requireCompleteScan;
    if (shouldFail) {
      throw new Error(`Spektion security check failed. Reason: ${reason}.`);
    }
    options.onIncomplete?.();
    const message =
      `Spektion security check failed. Your dependencies were NOT checked. ` +
      `Reason: ${reason}. Run with --debug for details or --strict to fail on errors.`;
    this.log.warn(message, "fetchAlerts");
    const result: SecurityAlert[] = [];
    return result;
  }
}
