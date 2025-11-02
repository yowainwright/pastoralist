import { GitHubSecurityProvider } from "./github";
import { SnykCLIProvider } from "./snyk";
import { SocketCLIProvider } from "./socket";
import {
  SecurityAlert,
  SecurityCheckOptions,
  SecurityOverride,
  SecurityProvider,
  OverrideUpdate,
} from "./types";
import { PastoralistJSON, OverridesType } from "../interfaces";
import { logger } from "../scripts";
import { compareVersions } from "../utils/semver";
import { InteractiveSecurityManager } from "./interactive";


export class OSVProvider {
  protected debug: boolean;
  protected log: ReturnType<typeof logger>;

  constructor(options: { debug?: boolean } = {}) {
    this.debug = options.debug || false;
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
    type OSVVuln = unknown;
    type FetchResult = {
      pkg: { name: string; version: string };
      vulns: OSVVuln[]
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

        const data = await response.json();
        const hasVulns = data.vulns && data.vulns.length > 0;

        return hasVulns ? { pkg, vulns: data.vulns } : null;
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

    return results
      .filter(isValidResult)
      .flatMap(result => this.convertOSVAlerts(result.pkg, result.vulns));
  }
  
  private convertOSVAlerts(pkg: { name: string; version: string }, vulns: any[]): SecurityAlert[] {
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
  
  private extractVersionRange(vuln: any): string {
    const affected = vuln.affected?.[0];
    if (affected?.ranges?.[0]?.events) {
      const events = affected.ranges[0].events;
      const introduced = events.find((e: any) => e.introduced)?.introduced || "0";
      const fixed = events.find((e: any) => e.fixed)?.fixed;
      return fixed ? `>= ${introduced} < ${fixed}` : `>= ${introduced}`;
    }
    return "";
  }
  
  private extractPatchedVersion(vuln: any): string | undefined {
    const affected = vuln.affected?.[0];
    const events = affected?.ranges?.[0]?.events || [];
    const fixed = events.find((e: any) => e.fixed)?.fixed;
    return fixed;
  }
  
  private extractSeverity(vuln: any): "low" | "medium" | "high" | "critical" {
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
  
  private extractCVE(vuln: any): string | undefined {
    return vuln.aliases?.find((a: string) => a.startsWith("CVE-"));
  }
}

export class SecurityChecker {
  private providers: SecurityProvider[];
  private log: ReturnType<typeof logger>;

  constructor(options: SecurityCheckOptions & { debug?: boolean }) {
    this.log = logger({ file: "security/index.ts", isLogging: options.debug });
    this.providers = this.createProviders(options);
  }

  private createProviders(options: SecurityCheckOptions & { debug?: boolean }): SecurityProvider[] {
    const providerTypes = Array.isArray(options.provider)
      ? options.provider
      : [options.provider || "osv"];

    return providerTypes.map(providerType => this.createProvider(providerType, options));
  }

  private createProvider(
    providerType: string,
    options: SecurityCheckOptions & { debug?: boolean }
  ): SecurityProvider {
    switch (providerType) {
      case "osv":
        return new OSVProvider({ debug: options.debug });
      case "github":
        return new GitHubSecurityProvider({
          debug: options.debug,
          token: options.token
        });
      case "snyk":
        return new SnykCLIProvider({
          debug: options.debug,
          token: options.token
        });
      case "socket":
        return new SocketCLIProvider({
          debug: options.debug,
          token: options.token
        });
      default:
        this.log.debug(`Provider ${providerType} not yet implemented, using OSV`, "createProvider");
        return new OSVProvider({ debug: options.debug });
    }
  }

  async checkSecurity(
    config: PastoralistJSON,
    options: SecurityCheckOptions & { depPaths?: string[]; root?: string; packageJsonPath?: string } = {}
  ): Promise<{ alerts: SecurityAlert[]; overrides: SecurityOverride[]; updates: OverrideUpdate[] }> {
    this.log.debug("Starting security check", "checkSecurity");

    try {
      const packages = this.extractPackages(config);

      if (packages.length === 0) {
        this.log.debug("No packages to check", "checkSecurity");
        return { alerts: [], overrides: [], updates: [] };
      }

      const allAlerts = await Promise.all(
        this.providers.map(provider => provider.fetchAlerts(packages))
      );
      const alerts = allAlerts.flat();

      this.log.debug(`Found ${alerts.length} security alerts from ${this.providers.length} provider(s)`, "checkSecurity");

      let allVulnerablePackages = this.deduplicateAlerts(alerts);

      if (options.depPaths && options.depPaths.length > 0) {
        this.log.debug("Scanning workspace packages for vulnerabilities", "checkSecurity");
        const workspaceVulnerable = await this.findWorkspaceVulnerabilities(
          options.depPaths,
          options.root || "./",
          alerts
        );
        allVulnerablePackages = [...allVulnerablePackages, ...workspaceVulnerable];
      }

      this.log.debug(
        `Found ${allVulnerablePackages.length} vulnerable packages in dependencies`,
        "checkSecurity"
      );

      let overrides = this.generateOverrides(allVulnerablePackages);

      // Check for updates to existing overrides
      const updates = await this.checkOverrideUpdates(config, alerts);

      if (options.interactive && allVulnerablePackages.length > 0) {
        const interactiveManager = new InteractiveSecurityManager();
        overrides = await interactiveManager.promptForSecurityActions(
          allVulnerablePackages,
          overrides
        );
      }

      if (options.autoFix && overrides.length > 0) {
        await this.applyAutoFix(overrides, options.packageJsonPath);
      }

      return { alerts: allVulnerablePackages, overrides, updates };
    } catch (error) {
      this.log.error("Security check failed", "checkSecurity", { error });
      throw error;
    }
  }

  private deduplicateAlerts(alerts: SecurityAlert[]): SecurityAlert[] {
    const seen = alerts.reduce((map, alert) => {
      const key = `${alert.packageName}@${alert.currentVersion}:${alert.cve || alert.title}`;
      const existing = map.get(key);
      const shouldReplace = !existing || this.getSeverityScore(alert.severity) > this.getSeverityScore(existing.severity);

      if (shouldReplace) {
        map.set(key, alert);
      }

      return map;
    }, new Map<string, SecurityAlert>());

    return Array.from(seen.values());
  }

  private getSeverityScore(severity: string): number {
    const scores: Record<string, number> = {
      low: 1,
      medium: 2,
      high: 3,
      critical: 4
    };
    return scores[severity.toLowerCase()] || 0;
  }

  private extractPackages(config: PastoralistJSON): Array<{ name: string; version: string }> {
    const packages: Array<{ name: string; version: string }> = [];
    const allDeps = {
      ...config.dependencies,
      ...config.devDependencies,
      ...config.peerDependencies,
    };

    for (const [name, version] of Object.entries(allDeps)) {
      const cleanVersion = version.replace(/^[\^~]/, "");
      packages.push({ name, version: cleanVersion });
    }

    return packages;
  }

  private findVulnerablePackages(
    config: PastoralistJSON,
    alerts: SecurityAlert[]
  ): SecurityAlert[] {
    const allDeps = {
      ...config.dependencies,
      ...config.devDependencies,
      ...config.peerDependencies,
    };

    return alerts.filter((alert) => {
      const currentVersion = allDeps[alert.packageName];
      if (!currentVersion) {
        return false;
      }

      alert.currentVersion = currentVersion;

      return this.isVersionVulnerable(currentVersion, alert.vulnerableVersions);
    });
  }

  private async findWorkspaceVulnerabilities(
    depPaths: string[],
    root: string,
    alerts: SecurityAlert[]
  ): Promise<SecurityAlert[]> {
    const vulnerablePackages: SecurityAlert[] = [];
    
    try {
      const fg = await import("fast-glob");
      const { readFileSync } = await import("fs");
      const { resolve } = await import("path");

      const patterns = depPaths.map(p => resolve(root, p));
      const packageFiles = await fg.default(patterns, {
        ignore: ["**/node_modules/**"],
        absolute: true,
      });
      
      for (const packageFile of packageFiles) {
        try {
          const content = readFileSync(packageFile, "utf-8");
          const parsed = JSON.parse(content);

          const isValidObject = parsed && typeof parsed === 'object';
          if (!isValidObject) {
            this.log.debug(
              `Invalid package.json format in ${packageFile}`,
              "findWorkspaceVulnerabilities"
            );
            continue;
          }

          const pkgJson = parsed as PastoralistJSON;
          const pkgVulnerable = this.findVulnerablePackages(pkgJson, alerts);
          
          for (const vuln of pkgVulnerable) {
            const existing = vulnerablePackages.find(
              v => v.packageName === vuln.packageName && 
                   v.currentVersion === vuln.currentVersion
            );
            
            if (!existing) {
              vulnerablePackages.push(vuln);
            }
          }
        } catch (error) {
          this.log.debug(
            `Failed to check ${packageFile}`,
            "findWorkspaceVulnerabilities",
            { error }
          );
        }
      }
    } catch (error) {
      this.log.error(
        "Failed to find workspace vulnerabilities",
        "findWorkspaceVulnerabilities",
        { error }
      );
    }
    
    return vulnerablePackages;
  }

  private isVersionVulnerable(
    currentVersion: string,
    vulnerableRange: string
  ): boolean {
    try {
      const cleanVersion = currentVersion.replace(/^[\^~]/, "");

      if (vulnerableRange.includes(">=") && vulnerableRange.includes("<")) {
        const [, minVersion] = vulnerableRange.match(/>= ?([^\s,]+)/) || [];
        const [, maxVersion] = vulnerableRange.match(/< ?([^\s,]+)/) || [];

        if (minVersion && maxVersion) {
          return (
            compareVersions(cleanVersion, minVersion) >= 0 &&
            compareVersions(cleanVersion, maxVersion) < 0
          );
        }
      }

      if (vulnerableRange.startsWith("<")) {
        const maxVersion = vulnerableRange.replace(/< ?/, "");
        return compareVersions(cleanVersion, maxVersion) < 0;
      }

      if (vulnerableRange.startsWith("<=")) {
        const maxVersion = vulnerableRange.replace(/<= ?/, "");
        return compareVersions(cleanVersion, maxVersion) <= 0;
      }

      return false;
    } catch (error) {
      this.log.debug(
        `Error comparing versions ${currentVersion} vs ${vulnerableRange}`,
        "isVersionVulnerable",
        { error }
      );
      return false;
    }
  }

  private async checkOverrideUpdates(
    config: PastoralistJSON,
    alerts: SecurityAlert[]
  ): Promise<OverrideUpdate[]> {
    const existingOverrides = config.overrides || config.pnpm?.overrides || config.resolutions || {};
    const appendix = config.pastoralist?.appendix || {};

    const overrideEntries = Object.entries(existingOverrides).filter(([_, version]) => typeof version === 'string');

    const updates = overrideEntries
      .map(([packageName, version]) => {
        const key = `${packageName}@${version}`;
        const entry = appendix[key];
        const isSecurityOverride = entry?.ledger?.securityChecked;

        if (!isSecurityOverride) return null;

        const alertsForPackage = alerts.filter(a => a.packageName === packageName && a.patchedVersion);
        const newerAlert = alertsForPackage.find(a => compareVersions(a.patchedVersion!, version as string) > 0);
        const hasNewer = !!newerAlert;

        if (!hasNewer) return null;

        const update: OverrideUpdate = {
          packageName,
          currentOverride: version as string,
          newerVersion: newerAlert.patchedVersion!,
          reason: `Newer security patch available: ${newerAlert.title}`,
          addedDate: entry.ledger?.addedDate,
        };

        return update;
      })
      .filter((update): update is OverrideUpdate => update !== null);

    const hasUpdates = updates.length > 0;
    if (hasUpdates) {
      this.log.debug(`Found ${updates.length} override updates available`, "checkOverrideUpdates");
    }

    return updates;
  }

  private generateOverrides(vulnerablePackages: SecurityAlert[]): SecurityOverride[] {
    return vulnerablePackages
      .filter((pkg) => pkg.fixAvailable && pkg.patchedVersion)
      .map((pkg) => {
        const base = {
          packageName: pkg.packageName,
          fromVersion: pkg.currentVersion,
          toVersion: pkg.patchedVersion!,
          reason: `Security fix: ${pkg.title} (${pkg.severity})`,
          severity: pkg.severity,
        };

        const cveField = pkg.cve ? { cve: pkg.cve } : {};
        const descriptionField = pkg.description ? { description: pkg.description } : {};
        const urlField = pkg.url ? { url: pkg.url } : {};

        return Object.assign({}, base, cveField, descriptionField, urlField);
      });
  }

  generatePackageOverrides(securityOverrides: SecurityOverride[]): OverridesType {
    const overrides: OverridesType = {};

    for (const override of securityOverrides) {
      overrides[override.packageName] = override.toVersion;
    }

    return overrides;
  }

  formatSecurityReport(
    vulnerablePackages: SecurityAlert[],
    securityOverrides: SecurityOverride[]
  ): string {
    let report = "\nSecurity Check Report\n";
    report += "=".repeat(50) + "\n\n";

    if (vulnerablePackages.length === 0) {
      report += "No vulnerable packages found\n";
      return report;
    }

    report += `Found ${vulnerablePackages.length} vulnerable package(s):\n\n`;

    for (const pkg of vulnerablePackages) {
      report += `[${pkg.severity.toUpperCase()}] ${pkg.packageName}@${pkg.currentVersion}\n`;
      report += `   ${pkg.title}\n`;

      if (pkg.cve) {
        report += `   CVE: ${pkg.cve}\n`;
      }

      if (pkg.fixAvailable && pkg.patchedVersion) {
        report += `   Fix available: ${pkg.patchedVersion}\n`;
      } else {
        report += `   No fix available yet\n`;
      }

      if (pkg.url) {
        report += `   ${pkg.url}\n`;
      }

      report += "\n";
    }

    if (securityOverrides.length > 0) {
      report += `\nGenerated ${securityOverrides.length} override(s):\n\n`;

      for (const override of securityOverrides) {
        report += `  "${override.packageName}": "${override.toVersion}"\n`;
      }
    }

    return report;
  }

  async applyAutoFix(
    overrides: SecurityOverride[],
    packageJsonPath?: string
  ): Promise<void> {
    try {
      const { readFileSync, writeFileSync, existsSync, copyFileSync } = await import("fs");
      const { resolve } = await import("path");
      
      const pkgPath = packageJsonPath || resolve(process.cwd(), "package.json");
      
      if (!existsSync(pkgPath)) {
        throw new Error(`package.json not found at ${pkgPath}`);
      }

      const backupPath = `${pkgPath}.backup-${Date.now()}`;
      copyFileSync(pkgPath, backupPath);
      this.log.debug(`Created backup at ${backupPath}`, "applyAutoFix");

      const packageJson = JSON.parse(readFileSync(pkgPath, "utf-8"));

      const packageManager = await this.detectPackageManager();
      const newOverrides = this.generatePackageOverrides(overrides);

      if (packageManager === "pnpm") {
        if (!packageJson.pnpm) {
          packageJson.pnpm = {};
        }
        if (!packageJson.pnpm.overrides) {
          packageJson.pnpm.overrides = {};
        }
        packageJson.pnpm.overrides = { ...packageJson.pnpm.overrides, ...newOverrides };
      } else {
        const overrideField = this.getOverrideField(packageManager);
        if (!packageJson[overrideField]) {
          packageJson[overrideField] = {};
        }
        const existingOverrides = packageJson[overrideField];
        packageJson[overrideField] = { ...existingOverrides, ...newOverrides };
      }
      
      writeFileSync(pkgPath, JSON.stringify(packageJson, null, 2) + "\n");
      
      console.log(`\n✅ Auto-fix applied successfully!`);
      console.log(`📝 Updated ${pkgPath} with ${Object.keys(newOverrides).length} security override(s)`);
      console.log(`💾 Backup saved to ${backupPath}`);
      
      if (Object.keys(newOverrides).length > 0) {
        console.log(`\n📋 Applied overrides:`);
        for (const [pkg, version] of Object.entries(newOverrides)) {
          const override = overrides.find(o => o.packageName === pkg);
          console.log(`   ${pkg}: ${version} (${override?.severity || "unknown"} severity)`);
        }
      }
      
      console.log(`\n⚠️  Don't forget to run your package manager install command:`);
      switch (packageManager) {
        case "yarn":
          console.log(`   yarn install`);
          break;
        case "pnpm":
          console.log(`   pnpm install`);
          break;
        case "bun":
          console.log(`   bun install`);
          break;
        default:
          console.log(`   npm install`);
      }
      
    } catch (error) {
      this.log.error("Failed to apply auto-fix", "applyAutoFix", { error });
      throw new Error(`Auto-fix failed: ${error}`);
    }
  }

  private async detectPackageManager(): Promise<"npm" | "yarn" | "pnpm" | "bun"> {
    try {
      const { existsSync } = await import("fs");
      const { resolve } = await import("path");
      
      const cwd = process.cwd();
      
      if (existsSync(resolve(cwd, "bun.lockb"))) {
        return "bun";
      }
      if (existsSync(resolve(cwd, "yarn.lock"))) {
        return "yarn";
      }
      if (existsSync(resolve(cwd, "pnpm-lock.yaml"))) {
        return "pnpm";
      }
      
      return "npm";
    } catch {
      return "npm";
    }
  }

  private getOverrideField(packageManager: "npm" | "yarn" | "pnpm" | "bun"): string {
    switch (packageManager) {
      case "yarn":
        return "resolutions";
      case "pnpm":
      case "npm":
      case "bun":
      default:
        return "overrides";
    }
  }

  async rollbackAutoFix(backupPath: string): Promise<void> {
    try {
      const { copyFileSync, existsSync } = await import("fs");
      
      if (!existsSync(backupPath)) {
        throw new Error(`Backup file not found at ${backupPath}`);
      }
      
      const packageJsonPath = backupPath.replace(/\.backup-\d+$/, "");
      copyFileSync(backupPath, packageJsonPath);
      
      console.log(`✅ Rolled back to ${backupPath}`);
    } catch (error) {
      this.log.error("Failed to rollback", "rollbackAutoFix", { error });
      throw new Error(`Rollback failed: ${error}`);
    }
  }
}

export * from "./types";
export { GitHubSecurityProvider };
