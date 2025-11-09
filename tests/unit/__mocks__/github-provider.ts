import type { SecurityAlert } from "../../../src/types";

export const mockGitHubAlerts: SecurityAlert[] = [
  {
    package: "lodash",
    version: "4.17.20",
    severity: "high",
    cve: "CVE-2021-23337",
    title: "Command Injection in lodash",
    description: "Prototype pollution vulnerability",
    fixedVersion: "4.17.21",
  },
  {
    package: "axios",
    version: "0.21.0",
    severity: "medium",
    cve: "CVE-2021-3749",
    title: "SSRF in axios",
    description: "Server-side request forgery vulnerability",
    fixedVersion: "0.21.4",
  },
];

export const mockGitHubResponse = {
  data: {
    repository: {
      vulnerabilityAlerts: {
        nodes: mockGitHubAlerts.map(alert => ({
          securityVulnerability: {
            package: { name: alert.package },
            vulnerableVersionRange: `< ${alert.fixedVersion}`,
            severity: alert.severity.toUpperCase(),
          },
          securityAdvisory: {
            ghsaId: alert.cve,
            summary: alert.title,
            description: alert.description,
          },
        })),
      },
    },
  },
};

export class MockGitHubProvider {
  async checkSecurity(): Promise<SecurityAlert[]> {
    return mockGitHubAlerts;
  }

  isAvailable(): boolean {
    return true;
  }
}
