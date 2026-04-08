import { SecurityAlert } from "../../../types";
import { logger } from "../../../utils";
import { SPEKTION_API, SEVERITY_MAP, Severity } from "../constants";

const mapSeverity = (severity: string): Severity =>
  SEVERITY_MAP[severity.toLowerCase()] ?? "medium";

const convertVulnerability = (vuln: unknown): SecurityAlert | null => {
  if (!vuln || typeof vuln !== "object") return null;
  const v = vuln as Record<string, unknown>;
  const patchedVersion = v.patchedVersion
    ? String(v.patchedVersion)
    : undefined;
  return {
    packageName: String(v.package ?? ""),
    currentVersion: String(v.version ?? ""),
    vulnerableVersions: v.vulnerableRange ? String(v.vulnerableRange) : "",
    patchedVersion,
    severity: mapSeverity(String(v.severity ?? "")),
    title: String(v.title ?? v.description ?? "Vulnerability"),
    description: v.description ? String(v.description) : undefined,
    cve: v.cve ? String(v.cve) : undefined,
    url: v.url ? String(v.url) : undefined,
    fixAvailable: Boolean(patchedVersion),
  };
};

const convertAlerts = (result: unknown): SecurityAlert[] => {
  if (!result || typeof result !== "object") return [];
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

  constructor(
    options: { debug?: boolean; token?: string; strict?: boolean } = {},
  ) {
    this.log = logger({
      file: "security/spektion.ts",
      isLogging: options.debug || false,
    });
    this.token = options.token || process.env.SPEKTION_API_KEY;
    this.strict = options.strict || false;
    this.log.debug(
      "SpektionProvider initialized (experimental)",
      "constructor",
    );
  }

  async isAuthenticated(): Promise<boolean> {
    return Boolean(this.token);
  }

  async fetchAlerts(
    packages: Array<{ name: string; version: string }>,
  ): Promise<SecurityAlert[]> {
    if (!this.token) {
      this.log.print(
        "Spektion requires authentication. Set SPEKTION_API_KEY or provide --securityProviderToken.",
      );
      return [];
    }

    try {
      return await scanPackages(this.token, packages);
    } catch (error) {
      const reason = error instanceof Error ? error.message : "Unknown error";
      if (this.strict) {
        throw new Error(
          `Spektion security check failed. Reason: ${reason}. Failing due to --strict mode.`,
        );
      }
      this.log.warn(
        `Spektion security check failed. Your dependencies were NOT checked. ` +
          `Reason: ${reason}. Run with --debug for details or --strict to fail on errors.`,
        "fetchAlerts",
      );
      return [];
    }
  }
}
