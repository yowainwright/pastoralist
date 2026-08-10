import type { SecurityAlert, SecurityProviderScanOptions } from "../../../types";
import { logger } from "../../../utils";
import { SPEKTION_API, SEVERITY_MAP } from "../constants";
import type { Severity } from "../types";

const mapSeverity = (severity: string): Severity =>
  SEVERITY_MAP[severity.toLowerCase()] ?? "medium";

const convertVulnerability = (vuln: unknown): SecurityAlert | null => {
  const isInvalidVulnerability = !vuln || typeof vuln !== "object";
  if (isInvalidVulnerability) return null;
  const v = vuln as Record<string, unknown>;
  const patchedVersion = v.patchedVersion ? String(v.patchedVersion) : undefined;
  const title = String(v.title ?? v.description ?? "Vulnerability");
  return {
    packageName: String(v.package ?? ""),
    currentVersion: String(v.version ?? ""),
    vulnerableVersions: v.vulnerableRange ? String(v.vulnerableRange) : "",
    patchedVersion,
    severity: mapSeverity(String(v.severity ?? "")),
    title,
    description: v.description ? String(v.description) : undefined,
    cves: v.cve ? [String(v.cve)] : undefined,
    url: v.url ? String(v.url) : undefined,
    fixAvailable: Boolean(patchedVersion),
  };
};

const convertAlerts = (result: unknown): SecurityAlert[] => {
  const isInvalidResult = !result || typeof result !== "object";
  if (isInvalidResult) return [];
  const data = result as Record<string, unknown>;
  if (!Array.isArray(data.vulnerabilities)) return [];
  return data.vulnerabilities
    .map(convertVulnerability)
    .filter((a): a is SecurityAlert => a !== null);
};

const scanPackages = async (
  token: string,
  packages: Array<{ name: string; version: string }>,
): Promise<SecurityAlert[]> => {
  const response = await fetch(SPEKTION_API.SCAN, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ packages }),
  });

  if (!response.ok) throw new Error(`HTTP ${response.status}`);

  const result = await response.json();
  return convertAlerts(result);
};

export class SpektionProvider {
  readonly providerType = "spektion" as const;
  private log: ReturnType<typeof logger>;
  private token?: string;
  private strict: boolean;

  constructor(options: { debug?: boolean; token?: string; strict?: boolean } = {}) {
    this.log = logger({
      file: "security/spektion.ts",
      isLogging: options.debug || false,
    });
    this.token = options.token || process.env.SPEKTION_API_KEY;
    this.strict = options.strict || false;
    this.log.debug("SpektionProvider initialized (experimental)", "constructor");
  }

  isAuthenticated(): boolean {
    return Boolean(this.token);
  }

  async fetchAlerts(
    packages: Array<{ name: string; version: string }>,
    options: SecurityProviderScanOptions = {},
  ): Promise<SecurityAlert[]> {
    if (!this.token) {
      return this.handleMissingToken(options);
    }

    try {
      return await scanPackages(this.token, packages);
    } catch (error) {
      return this.handleScanError(error, options);
    }
  }

  private handleMissingToken(options: SecurityProviderScanOptions): SecurityAlert[] {
    const message =
      "Spektion requires authentication. Set SPEKTION_API_KEY or provide --securityProviderToken.";
    if (options.requireCompleteScan) throw new Error(message);
    options.onIncomplete?.();
    this.log.print(message);
    return [];
  }

  private handleScanError(error: unknown, options: SecurityProviderScanOptions): SecurityAlert[] {
    const reason = error instanceof Error ? error.message : "Unknown error";
    const shouldFail = this.strict || options.requireCompleteScan;
    if (shouldFail) {
      throw new Error(`Spektion security check failed. Reason: ${reason}.`);
    }
    options.onIncomplete?.();
    const message =
      `Spektion security check failed. Your dependencies were NOT checked. ` +
      `Reason: ${reason}. Run with --debug for details or --strict to fail on errors.`;
    this.log.warn(message, "fetchAlerts");
    return [];
  }
}
