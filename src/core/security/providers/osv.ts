import { SecurityAlert, OSVVulnerability } from "../../../types";
import { logger } from "../../../utils";
import { TEST_FIXTURES } from "../../../constants";

export class OSVProvider {
  protected debug: boolean;
  protected isIRLFix: boolean;
  protected isIRLCatch: boolean;
  protected log: ReturnType<typeof logger>;

  constructor(options: { debug?: boolean; isIRLFix?: boolean; isIRLCatch?: boolean } = {}) {
    this.debug = options.debug || false;
    this.isIRLFix = options.isIRLFix || false;
    this.isIRLCatch = options.isIRLCatch || false;
    this.log = logger({ file: "security/osv.ts", isLogging: this.debug });
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch("https://api.osv.dev/v1/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ package: { name: "test", ecosystem: "npm" } }),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  async fetchAlerts(
    packages: Array<{ name: string; version: string }>
  ): Promise<SecurityAlert[]> {
    this.log.debug(`OSV checking ${packages.length} packages`, "fetchAlerts");
    type FetchResult = {
      pkg: { name: string; version: string };
      vulns: OSVVulnerability[];
    } | null;

    const fetchPackageVulnerabilities = (
      pkg: { name: string; version: string }
    ): Promise<FetchResult> => {
      return fetch("https://api.osv.dev/v1/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          package: { name: pkg.name, ecosystem: "npm" },
          version: pkg.version,
        }),
      })
      .then(async (response) => {
        if (!response.ok) return null;

        const data = await response.json() as { vulns?: OSVVulnerability[] };
        const hasVulns = data.vulns && data.vulns.length > 0;

        return hasVulns ? { pkg, vulns: data.vulns! } : null;
      })
      .catch((error) => {
        this.log.debug(
          `Failed to check ${pkg.name}@${pkg.version}`,
          "fetchAlerts",
          { error }
        );
        return null;
      });
    };

    const isValidResult = (
      result: FetchResult
    ): result is NonNullable<FetchResult> => {
      return result !== null;
    };

    const results = await Promise.all(packages.map(fetchPackageVulnerabilities));

    const realAlerts = results
      .filter(isValidResult)
      .flatMap(result => this.convertOSVAlerts(result.pkg, result.vulns));

    const alertToResolve = this.isIRLFix ? [TEST_FIXTURES.ALERT_TO_RESOLVE] : [];
    const alertToCapture = this.isIRLCatch ? [TEST_FIXTURES.ALERT_TO_CAPTURE] : [];

    return realAlerts.concat(alertToResolve).concat(alertToCapture);
  }

  private convertOSVAlerts(pkg: { name: string; version: string }, vulns: OSVVulnerability[]): SecurityAlert[] {
    return vulns.map(vuln => ({
      packageName: pkg.name,
      currentVersion: pkg.version,
      vulnerableVersions: this.extractVersionRange(vuln),
      patchedVersion: this.extractPatchedVersion(vuln),
      severity: this.extractSeverity(vuln),
      title: vuln.summary || vuln.details || `Vulnerability in ${pkg.name}`,
      description: vuln.details,
      cve: this.extractCVE(vuln),
      url: vuln.references?.[0]?.url || `https://osv.dev/vulnerability/${vuln.id}`,
      fixAvailable: !!this.extractPatchedVersion(vuln),
    }));
  }

  private extractVersionRange(vuln: OSVVulnerability): string {
    const affected = vuln.affected?.[0];
    if (affected?.ranges?.[0]?.events) {
      const events = affected.ranges[0].events;
      const introduced = events.find(e => e.introduced)?.introduced || "0";
      const fixed = events.find(e => e.fixed)?.fixed;
      return fixed ? `>= ${introduced} < ${fixed}` : `>= ${introduced}`;
    }
    return "";
  }

  private extractPatchedVersion(vuln: OSVVulnerability): string | undefined {
    const affected = vuln.affected?.[0];
    const events = affected?.ranges?.[0]?.events || [];
    const fixed = events.find(e => e.fixed)?.fixed;
    return fixed;
  }

  private extractSeverity(vuln: OSVVulnerability & { database_specific?: { severity?: string } }): "low" | "medium" | "high" | "critical" {
    const severity = vuln.database_specific?.severity ||
                    vuln.severity?.[0]?.score ||
                    "medium";

    if (typeof severity === "string") {
      const s = severity.toLowerCase();
      if (["low", "medium", "high", "critical"].includes(s)) {
        return s as "low" | "medium" | "high" | "critical";
      }
    }

    return "medium";
  }

  private extractCVE(vuln: OSVVulnerability): string | undefined {
    return vuln.aliases?.find(a => a.startsWith("CVE-"));
  }
}
