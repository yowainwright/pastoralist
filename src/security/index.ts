import { GitHubSecurityProvider } from "./github";
import {
  SecurityAlert,
  SecurityCheckOptions,
  SecurityOverride,
} from "./types";
import { PastoralistJSON, OverridesType } from "../interfaces";
import { logger } from "../scripts";
import { compareVersions } from "compare-versions";
import { InteractiveSecurityManager } from "./interactive";

abstract class SecurityProvider {
  protected debug: boolean;
  protected log: ReturnType<typeof logger>;
  
  constructor(options: { debug?: boolean } = {}) {
    this.debug = options.debug || false;
    this.log = logger({ file: `security/${this.name}.ts`, isLogging: this.debug });
  }
  
  abstract get name(): string;
  abstract get requiresAuth(): boolean;
  abstract isAvailable(): Promise<boolean>;
  abstract fetchAlerts(packages: Array<{ name: string; version: string }>): Promise<SecurityAlert[]>;
}

class OSVProvider extends SecurityProvider {
  get name() { return "osv"; }
  get requiresAuth() { return false; }
  
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
  
  async fetchAlerts(packages: Array<{ name: string; version: string }>): Promise<SecurityAlert[]> {
    const alerts: SecurityAlert[] = [];
    
    for (const pkg of packages) {
      try {
        const response = await fetch("https://api.osv.dev/v1/query", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            package: { name: pkg.name, ecosystem: "npm" },
            version: pkg.version,
          }),
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.vulns && data.vulns.length > 0) {
            alerts.push(...this.convertOSVAlerts(pkg, data.vulns));
          }
        }
      } catch (error) {
        this.log.debug(`Failed to check ${pkg.name}@${pkg.version}`, "fetchAlerts", { error });
      }
    }
    
    return alerts;
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
  private provider: SecurityProvider;
  private log: ReturnType<typeof logger>;
  private useGitHubFallback: boolean = false;

  constructor(options: SecurityCheckOptions & { debug?: boolean }) {
    this.log = logger({ file: "security/index.ts", isLogging: options.debug });
    this.provider = this.createProvider(options);
  }

  private createProvider(options: SecurityCheckOptions & { debug?: boolean }): SecurityProvider {
    const providerType = options.provider || "osv";
    
    switch (providerType) {
      case "osv":
        return new OSVProvider({ debug: options.debug });
      case "github":
        this.useGitHubFallback = true;
        return new OSVProvider({ debug: options.debug });
      default:
        this.log.debug(`Provider ${providerType} not yet implemented, using OSV`, "createProvider");
        return new OSVProvider({ debug: options.debug });
    }
  }

  async checkSecurity(
    config: PastoralistJSON,
    options: SecurityCheckOptions & { depPaths?: string[]; root?: string } = {}
  ): Promise<SecurityOverride[]> {
    this.log.debug("Starting security check", "checkSecurity");

    try {
      const packages = this.extractPackages(config);
      
      if (packages.length === 0) {
        this.log.debug("No packages to check", "checkSecurity");
        return [];
      }
      
      const alerts = await this.provider.fetchAlerts(packages);
      this.log.debug(`Found ${alerts.length} security alerts`, "checkSecurity");
      
      let allVulnerablePackages = alerts;
      
      if (options.depPaths && options.depPaths.length > 0) {
        this.log.debug("Scanning workspace packages for vulnerabilities", "checkSecurity");
        const workspaceVulnerable = await this.findWorkspaceVulnerabilities(
          options.depPaths,
          options.root || "./",
          securityAlerts
        );
        allVulnerablePackages = [...allVulnerablePackages, ...workspaceVulnerable];
      }

      this.log.debug(
        `Found ${allVulnerablePackages.length} vulnerable packages in dependencies`,
        "checkSecurity"
      );

      let overrides = this.generateOverrides(allVulnerablePackages);

      if (options.interactive && allVulnerablePackages.length > 0) {
        const interactiveManager = new InteractiveSecurityManager();
        overrides = await interactiveManager.promptForSecurityActions(
          allVulnerablePackages,
          overrides
        );
      }

      return overrides;
    } catch (error) {
      this.log.error("Security check failed", "checkSecurity", { error });
      throw error;
    }
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
          const pkgJson = JSON.parse(content) as PastoralistJSON;
          
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

  private generateOverrides(vulnerablePackages: SecurityAlert[]): SecurityOverride[] {
    return vulnerablePackages
      .filter((pkg) => pkg.fixAvailable && pkg.patchedVersion)
      .map((pkg) => ({
        packageName: pkg.packageName,
        fromVersion: pkg.currentVersion,
        toVersion: pkg.patchedVersion!,
        reason: `Security fix: ${pkg.title} (${pkg.severity})`,
        severity: pkg.severity,
      }));
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
    let report = "\n🔒 Security Check Report\n";
    report += "═".repeat(50) + "\n\n";

    if (vulnerablePackages.length === 0) {
      report += "✅ No vulnerable packages found!\n";
      return report;
    }

    report += `Found ${vulnerablePackages.length} vulnerable package(s):\n\n`;

    for (const pkg of vulnerablePackages) {
      const severity = this.getSeverityEmoji(pkg.severity);
      report += `${severity} ${pkg.packageName}@${pkg.currentVersion}\n`;
      report += `   ${pkg.title}\n`;
      
      if (pkg.cve) {
        report += `   CVE: ${pkg.cve}\n`;
      }
      
      if (pkg.fixAvailable && pkg.patchedVersion) {
        report += `   ✅ Fix available: ${pkg.patchedVersion}\n`;
      } else {
        report += `   ❌ No fix available yet\n`;
      }
      
      if (pkg.url) {
        report += `   🔗 ${pkg.url}\n`;
      }
      
      report += "\n";
    }

    if (securityOverrides.length > 0) {
      report += `\n📝 Generated ${securityOverrides.length} override(s):\n\n`;
      
      for (const override of securityOverrides) {
        report += `  "${override.packageName}": "${override.toVersion}" // ${override.reason}\n`;
      }
    }

    return report;
  }

  private getSeverityEmoji(severity: string): string {
    switch (severity.toLowerCase()) {
      case "critical":
        return "🚨";
      case "high":
        return "🔥";
      case "medium":
        return "⚠️";
      case "low":
        return "ℹ️";
      default:
        return "⚠️";
    }
  }
}

export * from "./types";
export { GitHubSecurityProvider };