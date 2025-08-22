import { SecurityOverride, SecurityAlert } from "./types";

export interface InteractivePrompt {
  type: string;
  name: string;
  message: string;
  choices?: Array<{ name: string; value: any }>;
  default?: any;
}

export class InteractiveSecurityManager {
  private inquirer: any;

  constructor() {
    // Lazy load inquirer only when needed
    this.inquirer = null;
  }

  private async loadInquirer() {
    if (!this.inquirer) {
      try {
        this.inquirer = await import("inquirer");
      } catch {
        console.warn(
          "⚠️  Inquirer not installed. Run 'npm install inquirer' to enable interactive mode."
        );
        throw new Error("Interactive mode requires inquirer to be installed");
      }
    }
    return this.inquirer;
  }

  async promptForSecurityActions(
    vulnerablePackages: SecurityAlert[],
    suggestedOverrides: SecurityOverride[]
  ): Promise<SecurityOverride[]> {
    const inquirer = await this.loadInquirer();

    if (vulnerablePackages.length === 0) {
      return [];
    }

    console.log("\n🔒 Security Vulnerabilities Found\n");
    console.log("═".repeat(50));

    // Show summary
    const summary = this.generateSummary(vulnerablePackages);
    console.log(summary);

    // Ask if user wants to proceed
    const { proceed } = await inquirer.default.prompt([
      {
        type: "confirm",
        name: "proceed",
        message: "Would you like to review and apply security fixes?",
        default: true,
      },
    ]);

    if (!proceed) {
      return [];
    }

    // Ask about each suggested override
    const selectedOverrides: SecurityOverride[] = [];

    for (const override of suggestedOverrides) {
      const vuln = vulnerablePackages.find(
        (v) => v.packageName === override.packageName
      );

      if (!vuln) continue;

      console.log(`\n📦 ${override.packageName}`);
      console.log(`   Current: ${override.fromVersion}`);
      console.log(`   ${this.getSeverityEmoji(vuln.severity)} ${vuln.title}`);
      if (vuln.cve) {
        console.log(`   CVE: ${vuln.cve}`);
      }

      const { action } = await inquirer.default.prompt([
        {
          type: "list",
          name: "action",
          message: `How would you like to handle this vulnerability?`,
          choices: [
            {
              name: `✅ Apply fix: Update to ${override.toVersion}`,
              value: "apply",
            },
            {
              name: "⏭️  Skip this vulnerability",
              value: "skip",
            },
            {
              name: "📝 Enter custom version",
              value: "custom",
            },
          ],
        },
      ]);

      if (action === "apply") {
        selectedOverrides.push(override);
      } else if (action === "custom") {
        const { customVersion } = await inquirer.default.prompt([
          {
            type: "input",
            name: "customVersion",
            message: "Enter the version to use:",
            default: override.toVersion,
          },
        ]);

        selectedOverrides.push({
          ...override,
          toVersion: customVersion,
        });
      }
    }

    // Ask for confirmation
    if (selectedOverrides.length > 0) {
      console.log("\n📋 Selected Overrides:\n");
      for (const override of selectedOverrides) {
        console.log(
          `  ${override.packageName}: ${override.fromVersion} → ${override.toVersion}`
        );
      }

      const { confirm } = await inquirer.default.prompt([
        {
          type: "confirm",
          name: "confirm",
          message: "Apply these overrides to your package.json?",
          default: true,
        },
      ]);

      if (!confirm) {
        return [];
      }
    }

    return selectedOverrides;
  }

  private generateSummary(vulnerablePackages: SecurityAlert[]): string {
    const bySeverity = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
    };

    for (const pkg of vulnerablePackages) {
      bySeverity[pkg.severity]++;
    }

    let summary = `Found ${vulnerablePackages.length} vulnerable package(s):\n`;

    if (bySeverity.critical > 0) {
      summary += `  🚨 Critical: ${bySeverity.critical}\n`;
    }
    if (bySeverity.high > 0) {
      summary += `  🔥 High: ${bySeverity.high}\n`;
    }
    if (bySeverity.medium > 0) {
      summary += `  ⚠️  Medium: ${bySeverity.medium}\n`;
    }
    if (bySeverity.low > 0) {
      summary += `  ℹ️  Low: ${bySeverity.low}\n`;
    }

    return summary;
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

export default InteractiveSecurityManager;