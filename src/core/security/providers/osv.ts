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
  OSVProviderOptions,
  Severity,
} from "../../../types";
import { compareVersions, retry, type RetryError, type RetryOptions } from "../../../utils";
import { logger } from "../../../observability";
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
  const dir = resolveCacheDir();
  const { OSV: ttl } = CACHE_TTLS;
  const { OSV: version } = CACHE_NS_VERSIONS;
  const cache = new DiskCache<OSVVulnerability>(CACHE_NAMESPACES.OSV, {
    dir,
    ttl,
    version,
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

  constructor(options: OSVProviderOptions = {}) {
    this.debug = options.debug || false;
    this.isIRLFix = options.isIRLFix || false;
    this.isIRLCatch = options.isIRLCatch || false;
    this.strict = options.strict || false;
    const { debug: isLogging } = this;
    this.log = logger({ file: "security/osv.ts", isLogging });
    this.retryOptions = options.retryOptions || {
      retries: 3,
      factor: 2,
      minTimeout: 1000,
    };
    this.osvCache = this.createCache(options);
  }

  private createCache(options: OSVProviderOptions): DiskCache<OSVVulnerability> {
    const cacheTtl = options.cacheTtl;
    const hasCustomCacheTtl = cacheTtl !== undefined;
    const cacheTtlMs = hasCustomCacheTtl ? cacheTtl * 1000 : CACHE_TTLS.OSV;
    const isCacheDisabled = options.noCache ?? false;
    const cacheEnabled = !isCacheDisabled;
    const dir = options.cacheDir ?? resolveCacheDir();
    const { OSV: version } = CACHE_NS_VERSIONS;
    const cache = new DiskCache<OSVVulnerability>(CACHE_NAMESPACES.OSV, {
      dir,
      ttl: cacheTtlMs,
      version,
      maxEntries: OSV_CACHE_MAX_ENTRIES,
      enabled: cacheEnabled,
    });
    return cache;
  }

  async isAvailable(): Promise<boolean> {
    try {
      const pkg = { name: "test", ecosystem: "npm" };
      const body = JSON.stringify({ package: pkg });
      const headers = { "Content-Type": "application/json" };
      const response = await fetch(OSV_API.QUERY, {
        method: "POST",
        headers,
        body,
      });
      const result = response.ok;
      return result;
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
    const fromOSVBatchAPI = this.enrichBatchResults(data.results || [], options);
    return fromOSVBatchAPI;
  }

  private createOSVQueries(packages: Array<{ name: string; version: string }>): OSVPackageQuery[] {
    const queries = packages.map(({ name, version }): OSVPackageQuery => {
      const pkg: OSVPackageQuery["package"] = { name, ecosystem: "npm" };
      const query = { package: pkg, version };
      return query;
    });
    return queries;
  }

  private async requestOSVBatch(queries: OSVPackageQuery[]): Promise<Response> {
    const headers = { "Content-Type": "application/json" };
    const body = JSON.stringify({ queries });
    const response = await fetch(OSV_API.QUERY_BATCH, {
      method: "POST",
      headers,
      body,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return response;
  }

  private async enrichBatchResults(
    batchResults: OSVBatchApiResult[],
    options: SecurityProviderScanOptions,
  ): Promise<OSVBatchResult[]> {
    const results = await Promise.allSettled(
      batchResults.map(async (result) => {
        const vulns = await this.fetchBatchVulnerabilities(result, options);
        const enriched = { vulns };
        return enriched;
      }),
    );
    const enriched = results.map((result) => {
      if (result.status === "rejected") throw result.reason;
      const { value } = result;
      return value;
    });
    return enriched;
  }

  private fetchBatchVulnerabilities(
    result: OSVBatchApiResult,
    options: SecurityProviderScanOptions,
  ): OSVVulnerability[] | undefined | Promise<OSVVulnerability[]> {
    const vulns = result?.vulns;

    const hasVulnerabilities = vulns && vulns.length > 0;
    if (!hasVulnerabilities) {
      return vulns;
    }

    const batchVulnerabilities = this.fetchFullVulnerabilityDetails(vulns, options);
    return batchVulnerabilities;
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
    const details = this.createVulnerabilityBatches(partialVulns).reduce<
      Promise<OSVVulnerability[]>
    >(async (accPromise, batch) => {
      const acc = await accPromise;
      const results = await this.fetchVulnerabilityBatch(batch, options);
      const result = acc.concat(results);
      return result;
    }, Promise.resolve([]));
    return details;
  }

  private createVulnerabilityBatches(
    partialVulns: OSVPartialVulnerability[],
  ): OSVPartialVulnerability[][] {
    const batchCount = Math.ceil(partialVulns.length / OSV_DETAIL_CONCURRENCY);
    const batches = Array.from({ length: batchCount }, (_, index) => {
      const start = index * OSV_DETAIL_CONCURRENCY;
      const result = partialVulns.slice(start, start + OSV_DETAIL_CONCURRENCY);
      return result;
    });
    return batches;
  }

  private async fetchVulnerabilityBatch(
    batch: OSVPartialVulnerability[],
    options: SecurityProviderScanOptions,
  ): Promise<OSVVulnerability[]> {
    const results = await Promise.allSettled(
      batch.map((vuln) => this.fetchSingleVulnerability(vuln)),
    );

    const vulnerabilities = results.map((result, index) => {
      const vulnerability = this.resolveVulnerabilityResult(result, batch[index], options);
      return vulnerability;
    });
    return vulnerabilities;
  }

  private resolveVulnerabilityResult(
    result: PromiseSettledResult<OSVVulnerability>,
    fallback: OSVPartialVulnerability,
    options: SecurityProviderScanOptions,
  ): OSVVulnerability {
    if (result.status === "fulfilled") {
      const vulnerabilityResult = result.value;
      return vulnerabilityResult;
    }

    const partialVulnerability = this.resolveRejectedVulnerability(
      result.reason,
      fallback,
      options,
    );
    return partialVulnerability;
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
    const rejectedVulnerability = fallback as OSVVulnerability;
    return rejectedVulnerability;
  }

  async fetchAlerts(
    packages: Array<{ name: string; version: string }>,
    options: SecurityProviderScanOptions = {},
  ): Promise<SecurityAlert[]> {
    this.log.debug(`OSV checking ${packages.length} packages`, "fetchAlerts");

    if (packages.length === 0) {
      const alerts: SecurityAlert[] = [];
      return alerts;
    }

    const batchResults = await this.fetchBatchResults(packages, options);
    const realAlerts = this.convertBatchResultsToAlerts(packages, batchResults);
    const alerts = realAlerts.concat(this.getIRLFixtureAlerts());
    return alerts;
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
    const batchResults = retry(
      () => this.fetchFromOSVBatchAPI(packages, options),
      retryOptions,
    ).catch((error) => this.handleBatchFetchError(error, options));
    return batchResults;
  }

  private handleBatchFetchError(
    error: unknown,
    options: SecurityProviderScanOptions,
  ): OSVBatchResult[] {
    this.log.debug("Failed to fetch batch results after retries", "fetchAlerts", { error });
    const isError = error instanceof Error;
    const reason = isError ? error.message : "Unknown error";
    const shouldFail = this.strict || options.requireCompleteScan;

    if (shouldFail) {
      throw new Error(
        `OSV security check failed after ${this.retryOptions.retries} retries. ` +
          `Reason: ${reason}. Failing due to --strict mode.`,
      );
    }

    options.onIncomplete?.();
    this.log.warn(this.createBatchWarning(reason), "fetchAlerts");
    const result: OSVBatchResult[] = [];
    return result;
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
    const alerts = packages.flatMap((pkg, index) => {
      const vulns = batchResults[index]?.vulns;
      if (!vulns?.length) {
        const result: SecurityAlert[] = [];
        return result;
      }
      const packageAlerts = this.convertOSVAlerts(pkg, vulns);
      return packageAlerts;
    });
    return alerts;
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
    const alerts = vulns.map((vuln) => this.convertOSVAlert(pkg, vuln));
    return alerts;
  }

  private convertOSVAlert(
    pkg: { name: string; version: string },
    vuln: OSVVulnerability,
  ): SecurityAlert {
    const cves = this.extractCVEs(vuln);
    const base = this.buildOSVAlert(pkg, vuln);
    if (cves.length === 0) return base;
    const alert = Object.assign({}, base, { cves });
    return alert;
  }

  private buildOSVAlert(
    pkg: { name: string; version: string },
    vuln: OSVVulnerability,
  ): SecurityAlert {
    const { name: packageName, version: currentVersion } = pkg;
    const interval = this.findVersionInterval(vuln, currentVersion);
    const patchedVersion = interval?.fixed;
    const vulnerableVersions = this.formatVersionInterval(interval);
    const severity = this.extractSeverity(vuln);
    const title = vuln.summary || vuln.details || `Vulnerability in ${packageName}`;
    const { details: description } = vuln;
    const url = vuln.references?.[0]?.url || `https://osv.dev/vulnerability/${vuln.id}`;
    const fixAvailable = Boolean(patchedVersion);
    const versions = { packageName, currentVersion, vulnerableVersions, patchedVersion };
    const advisory = { severity, title, description, url, fixAvailable };
    const alert = Object.assign({}, versions, advisory);
    return alert;
  }

  private getVersionIntervals(vuln: OSVVulnerability): OSVVersionInterval[] {
    const ranges = vuln.affected?.flatMap((affected) => affected.ranges || []) || [];
    const versionIntervals = ranges.flatMap((range) => this.toVersionIntervals(range));
    return versionIntervals;
  }

  private applyVersionEvent(
    state: OSVVersionIntervalState,
    event: OSVVersionEvent,
  ): OSVVersionIntervalState {
    const { introduced: currentIntroduced } = event;
    if (currentIntroduced !== undefined) {
      const versionEvent = Object.assign({}, state, { currentIntroduced });
      return versionEvent;
    }
    const fixed = event.fixed;
    if (!fixed) return state;
    const introduced = state.currentIntroduced;
    if (introduced === undefined) return state;
    const interval = { introduced, fixed };
    const intervals = state.intervals.concat(interval);
    const closed = { intervals };
    return closed;
  }

  private toVersionIntervals(range: OSVVersionRange): OSVVersionInterval[] {
    const intervals: OSVVersionInterval[] = [];
    const initial: OSVVersionIntervalState = { currentIntroduced: "0", intervals };
    const state = range.events.reduce<OSVVersionIntervalState>(
      (current, event) => this.applyVersionEvent(current, event),
      initial,
    );
    if (state.currentIntroduced === undefined) {
      const result = state.intervals;
      return result;
    }
    const { currentIntroduced: introduced } = state;
    const openInterval = { introduced };
    const complete = state.intervals.concat(openInterval);
    return complete;
  }

  private findVersionInterval(
    vuln: OSVVulnerability,
    version: string,
  ): OSVVersionInterval | undefined {
    const matched = this.getVersionIntervals(vuln).find((interval) => {
      const meetsLowerBound = compareVersions(version, interval.introduced) >= 0;
      const meetsUpperBound = !interval.fixed || compareVersions(version, interval.fixed) < 0;
      const result = meetsLowerBound && meetsUpperBound;
      return result;
    });
    return matched;
  }

  private formatVersionInterval(interval: OSVVersionInterval | undefined): string {
    if (!interval) return "";
    if (!interval.fixed) {
      const versionInterval = `>= ${interval.introduced}`;
      return versionInterval;
    }
    const boundedInterval = `>= ${interval.introduced} < ${interval.fixed}`;
    return boundedInterval;
  }

  private extractSeverity(vuln: OSVSeverityVulnerability): Severity {
    const severity = vuln.database_specific?.severity || vuln.severity?.[0]?.score || "medium";

    if (typeof severity === "string") {
      const parsed = this.parseSeverity(severity);
      return parsed;
    }

    const isNumber = typeof severity === "number";
    if (isNumber) {
      const scoreSeverity = this.cvssScoreToSeverity(severity as number);
      return scoreSeverity;
    }

    return "medium";
  }

  private parseSeverity(value: string): Severity {
    const normalized = value.toLowerCase();
    const isLabel = ["low", "medium", "high", "critical"].includes(normalized);
    if (isLabel) {
      const severity = normalized as Severity;
      return severity;
    }
    const score = parseFloat(normalized);
    const isNumericScore = !isNaN(score);
    if (!isNumericScore) return "medium";
    const severity = this.cvssScoreToSeverity(score);
    return severity;
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
    const cVEs = vuln.aliases?.filter((a) => a.startsWith("CVE-")) || [];
    return cVEs;
  }
}
