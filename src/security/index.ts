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

export class SecurityChecker {
  private provider: GitHubSecurityProvider;
  private log: ReturnType<typeof logger>;

  constructor(options: SecurityCheckOptions & { debug?: boolean }) {
    this.provider = new GitHubSecurityProvider(options);
    this.log = logger({ file: "security/index.ts", isLogging: options.debug });
  }

  async checkSecurity(
    config: PastoralistJSON,
    options: SecurityCheckOptions & { depPaths?: string[]; root?: string } = {}
  ): Promise<SecurityOverride[]> {
    this.log.debug("Starting security check", "checkSecurity");

    try {
      const alerts = await this.provider.fetchDependabotAlerts();
      this.log.debug(`Found ${alerts.length} Dependabot alerts`, "checkSecurity");

      const securityAlerts = this.provider.convertToSecurityAlerts(alerts);
      
      let allVulnerablePackages = this.findVulnerablePackages(config, securityAlerts);
      
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