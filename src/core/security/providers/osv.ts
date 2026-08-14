import type {
  SecurityAlert,
  OSVBatchApiResult,
  OSVBatchResult,
  OSVPackageQuery,
  OSVPartialVulnerability,
  OSVSeverityVulnerability,
  OSVVersionEvent,
  OSVVersionInterval,
  OSVVersionIntervalState,
  OSVVersionRange,
  OSVVulnerability,
  SecurityProviderScanOptions,
} from "../../../types";
import { compareVersions, logger, retry, type RetryError, type RetryOptions } from "../../../utils";
import {
  OSV_API,
  OSV_CACHE_MAX_ENTRIES,
  OSV_DETAIL_CONCURRENCY,
  OSV_IRL_CATCH_ALERT,
  OSV_IRL_FIX_ALERT,
} from "../constants";
import {
  DiskCache,
  resolveCacheDir,
  CACHE_NAMESPACES,
  CACHE_TTLS,
  CACHE_NS_VERSIONS,
} from "../../../utils/cache";

export const clearOSVCache = (): void => {
  const cache = new DiskCache<OSVVulnerability>(CACHE_NAMESPACES.OSV, {
    dir: resolveCacheDir(),
    ttl: CACHE_TTLS.OSV,
    version: CACHE_NS_VERSIONS.OSV,
  });
  cache.clear();
};

export class OSVProvider {
  readonly providerType = "osv" as const;
  protected debug: boolean;
  protected isIRLFix: boolean;
  protected isIRLCatch: boolean;
  protected strict: boolean;
  protected log: ReturnType<typeof logger>;
  protected retryOptions: RetryOptions;
  private readonly osvCache: DiskCache<OSVVulnerability>;

  constructor(
    options: {
      debug?: boolean;
      isIRLFix?: boolean;
      isIRLCatch?: boolean;
      strict?: boolean;
      retryOptions?: RetryOptions;
      cacheDir?: string;
      cacheTtl?: number;
      noCache?: boolean;
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

    const cacheTtl = options.cacheTtl;
    const hasCustomCacheTtl = cacheTtl !== undefined;
    const cacheTtlMs = hasCustomCacheTtl ? cacheTtl * 1000 : CACHE_TTLS.OSV;
    const noCache = options.noCache ?? false;
    const cacheEnabled = !noCache;

    this.osvCache = new DiskCache<OSVVulnerability>(CACHE_NAMESPACES.OSV, {
      dir: options.cacheDir ?? resolveCacheDir(),
      ttl: cacheTtlMs,
      version: CACHE_NS_VERSIONS.OSV,
      maxEntries: OSV_CACHE_MAX_ENTRIES,
      enabled: cacheEnabled,
    });
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
    options: SecurityProviderScanOptions,
  ): Promise<OSVBatchResult[]> {
    const response = await this.requestOSVBatch(this.createOSVQueries(packages));
    const data = await response.json();
    return this.enrichBatchResults(data.results || [], options);
  }

  private createOSVQueries(packages: Array<{ name: string; version: string }>): OSVPackageQuery[] {
    return packages.map((pkg) => ({
      package: { name: pkg.name, ecosystem: "npm" },
      version: pkg.version,
    }));
  }

  private async requestOSVBatch(queries: OSVPackageQuery[]): Promise<Response> {
    const response = await fetch(OSV_API.QUERY_BATCH, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ queries }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return response;
  }

  private enrichBatchResults(
    batchResults: OSVBatchApiResult[],
    options: SecurityProviderScanOptions,
  ): Promise<OSVBatchResult[]> {
    return Promise.all(
      batchResults.map(async (result) => {
        const vulns = await this.fetchBatchVulnerabilities(result, options);
        return { vulns };
      }),
    );
  }

  private fetchBatchVulnerabilities(
    result: OSVBatchApiResult,
    options: SecurityProviderScanOptions,
  ): OSVVulnerability[] | undefined | Promise<OSVVulnerability[]> {
    const vulns = result?.vulns;

    const hasNoVulnerabilities = !vulns || vulns.length === 0;
    if (hasNoVulnerabilities) {
      return vulns;
    }

    return this.fetchFullVulnerabilityDetails(vulns, options);
  }

  private async fetchSingleVulnerability(vuln: OSVPartialVulnerability): Promise<OSVVulnerability> {
    const cacheKey = `osv:${vuln.id}`;
    const cached = this.osvCache.get(cacheKey);
    if (cached) return cached;

    const response = await fetch(OSV_API.VULN(vuln.id));
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const result = (await response.json()) as OSVVulnerability;
    this.osvCache.set(cacheKey, result);
    return result;
  }

  private fetchFullVulnerabilityDetails(
    partialVulns: OSVPartialVulnerability[],
    options: SecurityProviderScanOptions,
  ): Promise<OSVVulnerability[]> {
    return this.createVulnerabilityBatches(partialVulns).reduce<Promise<OSVVulnerability[]>>(
      async (accPromise, batch) => {
        const acc = await accPromise;
        const results = await this.fetchVulnerabilityBatch(batch, options);
        return acc.concat(results);
      },
      Promise.resolve([]),
    );
  }

  private createVulnerabilityBatches(
    partialVulns: OSVPartialVulnerability[],
  ): OSVPartialVulnerability[][] {
    return partialVulns.reduce<OSVPartialVulnerability[][]>((batches, vuln, index) => {
      const batchIndex = Math.floor(index / OSV_DETAIL_CONCURRENCY);
      const batch = batches[batchIndex] || [];
      return Object.assign(batches.slice(), { [batchIndex]: batch.concat(vuln) });
    }, []);
  }

  private async fetchVulnerabilityBatch(
    batch: OSVPartialVulnerability[],
    options: SecurityProviderScanOptions,
  ): Promise<OSVVulnerability[]> {
    const results = await Promise.allSettled(
      batch.map((vuln) => this.fetchSingleVulnerability(vuln)),
    );

    return results.map((result, index) => {
      return this.resolveVulnerabilityResult(result, batch[index], options);
    });
  }

  private resolveVulnerabilityResult(
    result: PromiseSettledResult<OSVVulnerability>,
    fallback: OSVPartialVulnerability,
    options: SecurityProviderScanOptions,
  ): OSVVulnerability {
    if (result.status === "fulfilled") {
      return result.value;
    }

    return this.resolveRejectedVulnerability(result.reason, fallback, options);
  }

  private resolveRejectedVulnerability(
    reason: unknown,
    fallback: OSVPartialVulnerability,
    options: SecurityProviderScanOptions,
  ): OSVVulnerability {
    const errorMsg = `Failed to fetch ${fallback.id}: ${reason}`;
    const shouldFail = this.strict || options.requireCompleteScan;

    if (shouldFail) throw new Error(errorMsg);

    options.onIncomplete?.();
    this.log.warn(
      `${errorMsg}. Using partial vulnerability data.`,
      "fetchFullVulnerabilityDetails",
    );
    return fallback as OSVVulnerability;
  }

  async fetchAlerts(
    packages: Array<{ name: string; version: string }>,
    options: SecurityProviderScanOptions = {},
  ): Promise<SecurityAlert[]> {
    this.log.debug(`OSV checking ${packages.length} packages`, "fetchAlerts");

    if (packages.length === 0) {
      return [];
    }

    const batchResults = await this.fetchBatchResults(packages, options);
    const realAlerts = this.convertBatchResultsToAlerts(packages, batchResults);
    return realAlerts.concat(this.getIRLFixtureAlerts());
  }

  private fetchBatchResults(
    packages: Array<{ name: string; version: string }>,
    options: SecurityProviderScanOptions,
  ): Promise<OSVBatchResult[]> {
    const retryOptions: RetryOptions = Object.assign({}, this.retryOptions, {
      onFailedAttempt: (error: RetryError) => {
        this.log.debug(`Batch API attempt ${error.attemptNumber} failed`, "fetchAlerts");
      },
    });
    return retry(() => this.fetchFromOSVBatchAPI(packages, options), retryOptions).catch((error) =>
      this.handleBatchFetchError(error, options),
    );
  }

  private handleBatchFetchError(
    error: unknown,
    options: SecurityProviderScanOptions,
  ): OSVBatchResult[] {
    this.log.debug("Failed to fetch batch results after retries", "fetchAlerts", { error });
    const reason = error instanceof Error ? error.message : "Unknown error";
    const shouldFail = this.strict || options.requireCompleteScan;

    if (shouldFail) {
      throw new Error(
        `OSV security check failed after ${this.retryOptions.retries} retries. ` +
          `Reason: ${reason}. Failing due to --strict mode.`,
      );
    }

    options.onIncomplete?.();
    this.log.warn(this.createBatchWarning(reason), "fetchAlerts");
    return [];
  }

  private createBatchWarning(reason: string): string {
    const warning =
      `OSV security check failed after ${this.retryOptions.retries} retries. ` +
      `Your dependencies were NOT checked for vulnerabilities. ` +
      `Reason: ${reason}. Run with --debug for details or --strict to fail on errors.`;
    return warning;
  }

  private convertBatchResultsToAlerts(
    packages: Array<{ name: string; version: string }>,
    batchResults: OSVBatchResult[],
  ): SecurityAlert[] {
    return packages.flatMap((pkg, index) => {
      const vulns = batchResults[index]?.vulns;
      if (!vulns?.length) return [];
      return this.convertOSVAlerts(pkg, vulns);
    });
  }

  private getIRLFixtureAlerts(): SecurityAlert[] {
    const alerts = [
      this.isIRLFix ? OSV_IRL_FIX_ALERT : undefined,
      this.isIRLCatch ? OSV_IRL_CATCH_ALERT : undefined,
    ].filter((alert): alert is SecurityAlert => Boolean(alert));
    return alerts;
  }

  private convertOSVAlerts(
    pkg: { name: string; version: string },
    vulns: OSVVulnerability[],
  ): SecurityAlert[] {
    return vulns.map((vuln) => {
      const cves = this.extractCVEs(vuln);
      const interval = this.findVersionInterval(vuln, pkg.version);
      const patchedVersion = interval?.fixed;
      const title = vuln.summary || vuln.details || `Vulnerability in ${pkg.name}`;
      const fixAvailable = Boolean(patchedVersion);
      const base = {
        packageName: pkg.name,
        currentVersion: pkg.version,
        vulnerableVersions: this.formatVersionInterval(interval),
        patchedVersion,
        severity: this.extractSeverity(vuln),
        title,
        description: vuln.details,
        url: vuln.references?.[0]?.url || `https://osv.dev/vulnerability/${vuln.id}`,
        fixAvailable,
      };
      if (cves.length === 0) return base;
      return Object.assign({}, base, { cves });
    });
  }

  private getVersionIntervals(vuln: OSVVulnerability): OSVVersionInterval[] {
    const ranges = vuln.affected?.flatMap((affected) => affected.ranges || []) || [];
    return ranges.flatMap((range) => this.toVersionIntervals(range));
  }

  private applyVersionEvent(
    state: OSVVersionIntervalState,
    event: OSVVersionEvent,
  ): OSVVersionIntervalState {
    if (event.introduced !== undefined) {
      return Object.assign({}, state, { currentIntroduced: event.introduced });
    }
    const fixed = event.fixed;
    if (!fixed) return state;
    const introduced = state.currentIntroduced;
    if (introduced === undefined) return state;
    const interval = { introduced, fixed };
    return { intervals: state.intervals.concat(interval) };
  }

  private toVersionIntervals(range: OSVVersionRange): OSVVersionInterval[] {
    const initial: OSVVersionIntervalState = { currentIntroduced: "0", intervals: [] };
    const state = range.events.reduce<OSVVersionIntervalState>(
      (current, event) => this.applyVersionEvent(current, event),
      initial,
    );
    if (state.currentIntroduced === undefined) return state.intervals;
    const openInterval = { introduced: state.currentIntroduced };
    return state.intervals.concat(openInterval);
  }

  private findVersionInterval(
    vuln: OSVVulnerability,
    version: string,
  ): OSVVersionInterval | undefined {
    return this.getVersionIntervals(vuln).find((interval) => {
      const meetsLowerBound = compareVersions(version, interval.introduced) >= 0;
      const meetsUpperBound = !interval.fixed || compareVersions(version, interval.fixed) < 0;
      return meetsLowerBound && meetsUpperBound;
    });
  }

  private formatVersionInterval(interval: OSVVersionInterval | undefined): string {
    if (!interval) return "";
    if (!interval.fixed) return `>= ${interval.introduced}`;
    return `>= ${interval.introduced} < ${interval.fixed}`;
  }

  private extractSeverity(vuln: OSVSeverityVulnerability): "low" | "medium" | "high" | "critical" {
    const severity = vuln.database_specific?.severity || vuln.severity?.[0]?.score || "medium";

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

  private cvssScoreToSeverity(score: number): "low" | "medium" | "high" | "critical" {
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
