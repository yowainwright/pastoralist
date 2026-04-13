import { SecurityAlert, OSVVulnerability } from "../../../types";
import { logger, retry, type RetryOptions } from "../../../utils";
import { OSV_API } from "../constants";

export class OSVProvider {
  readonly providerType = "osv" as const;
  protected debug: boolean;
  protected isIRLFix: boolean;
  protected isIRLCatch: boolean;
  protected strict: boolean;
  protected log: ReturnType<typeof logger>;
  protected retryOptions: RetryOptions;

  constructor(
    options: {
      debug?: boolean;
      isIRLFix?: boolean;
      isIRLCatch?: boolean;
      strict?: boolean;
      retryOptions?: RetryOptions;
    } = {},
  ) {
    this.debug = options.debug || false;
    this.isIRLFix = options.isIRLFix || false;
    this.isIRLCatch = options.isIRLCatch || false;
    this.strict = options.strict || false;
    this.log = logger({ file: "security/osv.ts", isLogging: this.debug });
    this.retryOptions = options.retryOptions || {
      retries: 3,
      factor: 2,
      minTimeout: 1000,
    };
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(OSV_API.QUERY, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ package: { name: "test", ecosystem: "npm" } }),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  private async fetchFromOSVBatchAPI(
    packages: Array<{ name: string; version: string }>,
  ): Promise<Array<{ vulns?: OSVVulnerability[] }>> {
    const queries = packages.map((pkg) => ({
      package: { name: pkg.name, ecosystem: "npm" },
      version: pkg.version,
    }));

    const response = await fetch(OSV_API.QUERY_BATCH, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ queries }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    const batchResults = data.results || [];

    const enrichedResults = await Promise.all(
      batchResults.map(async (result: { vulns?: Array<{ id: string }> }) => {
        const vulns = result?.vulns;
        const hasVulns = vulns && vulns.length > 0;
        if (!hasVulns) return result;

        const fullVulns = await this.fetchFullVulnerabilityDetails(vulns);
        return { vulns: fullVulns };
      }),
    );

    return enrichedResults;
  }

  private async fetchSingleVulnerability(vuln: {
    id: string;
  }): Promise<OSVVulnerability> {
    const response = await fetch(OSV_API.VULN(vuln.id));
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return response.json();
  }

  private async fetchFullVulnerabilityDetails(
    partialVulns: Array<{ id: string }>,
  ): Promise<OSVVulnerability[]> {
    const concurrency = 5;
    const batches = partialVulns.reduce<Array<Array<{ id: string }>>>(
      (acc, vuln, i) => {
        const batchIndex = Math.floor(i / concurrency);
        acc[batchIndex] = acc[batchIndex] || [];
        acc[batchIndex].push(vuln);
        return acc;
      },
      [],
    );

    const processBatch = async (
      batch: Array<{ id: string }>,
    ): Promise<OSVVulnerability[]> => {
      const results = await Promise.allSettled(
        batch.map((vuln) => this.fetchSingleVulnerability(vuln)),
      );

      return results.map((result, i) => {
        const isFulfilled = result.status === "fulfilled";
        if (isFulfilled) return result.value;

        const errorMsg = `Failed to fetch ${batch[i].id}: ${result.reason}`;

        if (this.strict) {
          throw new Error(errorMsg);
        }

        this.log.debug(errorMsg, "fetchFullVulnerabilityDetails");
        return batch[i] as OSVVulnerability;
      });
    };

    const batchResults = await batches.reduce<Promise<OSVVulnerability[]>>(
      async (accPromise, batch) => {
        const acc = await accPromise;
        const results = await processBatch(batch);
        return acc.concat(results);
      },
      Promise.resolve([]),
    );

    return batchResults;
  }

  async fetchAlerts(
    packages: Array<{ name: string; version: string }>,
  ): Promise<SecurityAlert[]> {
    this.log.debug(`OSV checking ${packages.length} packages`, "fetchAlerts");

    if (packages.length === 0) {
      return [];
    }

    const batchResults = await retry(
      async () => {
        return this.fetchFromOSVBatchAPI(packages);
      },
      {
        ...this.retryOptions,
        onFailedAttempt: (error) => {
          this.log.debug(
            `Batch API attempt ${error.attemptNumber} failed`,
            "fetchAlerts",
          );
        },
      },
    ).catch((error) => {
      this.log.debug(
        "Failed to fetch batch results after retries",
        "fetchAlerts",
        { error },
      );
      const reason = error instanceof Error ? error.message : "Unknown error";
      if (this.strict) {
        throw new Error(
          `OSV security check failed after ${this.retryOptions.retries} retries. ` +
            `Reason: ${reason}. Failing due to --strict mode.`,
        );
      }
      this.log.warn(
        `OSV security check failed after ${this.retryOptions.retries} retries. ` +
          `Your dependencies were NOT checked for vulnerabilities. ` +
          `Reason: ${reason}. Run with --debug for details or --strict to fail on errors.`,
        "fetchAlerts",
      );
      return [];
    });

    const realAlerts = packages
      .map((pkg, index) => {
        const result = batchResults[index];
        const hasVulns = result?.vulns && result.vulns.length > 0;
        if (!hasVulns) return [];
        return this.convertOSVAlerts(pkg, result.vulns!);
      })
      .flat();

    const alertToResolve = this.isIRLFix
      ? [
          {
            packageName: "fake-pastoralist-check-2",
            currentVersion: "1.0.0",
            vulnerableVersions: "< 2.1.0",
            patchedVersion: "2.1.0",
            severity: "critical" as const,
            title:
              "Critical vulnerability in fake-pastoralist-check-2 (transitive from fake-pastoralist-check-1)",
            cves: ["CVE-FAKE-PASTORALIST-2024-0001"],
            fixAvailable: true,
            description:
              "Fake critical security vulnerability in fake-pastoralist-check-2. Used by fake-pastoralist-check-1@1.0.0.",
            url: "https://example.com/fake-pastoralist-advisory-0001",
          },
        ]
      : [];
    const alertToCapture = this.isIRLCatch
      ? [
          {
            packageName: "fake-pastoralist-check-4",
            currentVersion: "0.5.0",
            vulnerableVersions: "< 1.0.0",
            patchedVersion: undefined,
            severity: "high" as const,
            title:
              "High severity issue in fake-pastoralist-check-4 with no patch available",
            cves: ["CVE-FAKE-PASTORALIST-2024-0002"],
            fixAvailable: false,
            description:
              "Fake high severity vulnerability with no available patch for testing alert capture functionality.",
            url: "https://example.com/fake-pastoralist-advisory-0002",
          },
        ]
      : [];

    return realAlerts.concat(alertToResolve).concat(alertToCapture);
  }

  private convertOSVAlerts(
    pkg: { name: string; version: string },
    vulns: OSVVulnerability[],
  ): SecurityAlert[] {
    return vulns.map((vuln) => {
      const cves = this.extractCVEs(vuln);
      const base = {
        packageName: pkg.name,
        currentVersion: pkg.version,
        vulnerableVersions: this.extractVersionRange(vuln),
        patchedVersion: this.extractPatchedVersion(vuln),
        severity: this.extractSeverity(vuln),
        title: vuln.summary || vuln.details || `Vulnerability in ${pkg.name}`,
        description: vuln.details,
        url:
          vuln.references?.[0]?.url ||
          `https://osv.dev/vulnerability/${vuln.id}`,
        fixAvailable: !!this.extractPatchedVersion(vuln),
      };
      return cves.length > 0 ? { ...base, cves } : base;
    });
  }

  private extractVersionRange(vuln: OSVVulnerability): string {
    const affected = vuln.affected?.[0];
    const events = affected?.ranges?.[0]?.events;
    if (!events) return "";

    const introduced = events.find((e) => e.introduced)?.introduced || "0";
    const fixed = events.find((e) => e.fixed)?.fixed;
    const range = fixed ? `>= ${introduced} < ${fixed}` : `>= ${introduced}`;
    return range;
  }

  private extractPatchedVersion(vuln: OSVVulnerability): string | undefined {
    const affected = vuln.affected?.[0];
    const events = affected?.ranges?.[0]?.events || [];
    const fixed = events.find((e) => e.fixed)?.fixed;
    return fixed;
  }

  private extractSeverity(
    vuln: OSVVulnerability & { database_specific?: { severity?: string } },
  ): "low" | "medium" | "high" | "critical" {
    const severity =
      vuln.database_specific?.severity || vuln.severity?.[0]?.score || "medium";

    if (typeof severity === "string") {
      const s = severity.toLowerCase();
      const isLabel = ["low", "medium", "high", "critical"].includes(s);
      if (isLabel) return s as "low" | "medium" | "high" | "critical";

      const numScore = parseFloat(s);
      const isNumericScore = !isNaN(numScore);
      if (isNumericScore) return this.cvssScoreToSeverity(numScore);
    }

    const isNumber = typeof severity === "number";
    if (isNumber) return this.cvssScoreToSeverity(severity as number);

    return "medium";
  }

  private cvssScoreToSeverity(
    score: number,
  ): "low" | "medium" | "high" | "critical" {
    const isCritical = score >= 9.0;
    const isHigh = score >= 7.0;
    const isMedium = score >= 4.0;
    if (isCritical) return "critical";
    if (isHigh) return "high";
    if (isMedium) return "medium";
    return "low";
  }

  private extractCVEs(vuln: OSVVulnerability): string[] {
    return vuln.aliases?.filter((a) => a.startsWith("CVE-")) || [];
  }
}
