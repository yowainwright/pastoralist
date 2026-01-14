import { SecurityAlert, OSVVulnerability } from "../../../types";
import { logger, retry, type RetryOptions } from "../../../utils";
import { TEST_FIXTURES } from "../../../constants";
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
        if (result.status === "fulfilled") return result.value;
        this.log.debug(
          `Failed to fetch ${batch[i].id}: ${result.reason}`,
          "fetchFullVulnerabilityDetails",
        );
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
      ? [TEST_FIXTURES.ALERT_TO_RESOLVE]
      : [];
    const alertToCapture = this.isIRLCatch
      ? [TEST_FIXTURES.ALERT_TO_CAPTURE]
      : [];

    return realAlerts.concat(alertToResolve).concat(alertToCapture);
  }

  private convertOSVAlerts(
    pkg: { name: string; version: string },
    vulns: OSVVulnerability[],
  ): SecurityAlert[] {
    return vulns.map((vuln) => ({
      packageName: pkg.name,
      currentVersion: pkg.version,
      vulnerableVersions: this.extractVersionRange(vuln),
      patchedVersion: this.extractPatchedVersion(vuln),
      severity: this.extractSeverity(vuln),
      title: vuln.summary || vuln.details || `Vulnerability in ${pkg.name}`,
      description: vuln.details,
      cve: this.extractCVE(vuln),
      url:
        vuln.references?.[0]?.url || `https://osv.dev/vulnerability/${vuln.id}`,
      fixAvailable: !!this.extractPatchedVersion(vuln),
    }));
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
      if (["low", "medium", "high", "critical"].includes(s)) {
        return s as "low" | "medium" | "high" | "critical";
      }
    }

    return "medium";
  }

  private extractCVE(vuln: OSVVulnerability): string | undefined {
    return vuln.aliases?.find((a) => a.startsWith("CVE-"));
  }
}
