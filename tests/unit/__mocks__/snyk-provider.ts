import type { SecurityAlert } from "../../../src/types";

export const mockSnykAlerts: SecurityAlert[] = [
  {
    package: "express",
    version: "4.17.0",
    severity: "critical",
    cve: "SNYK-JS-EXPRESS-1234567",
    title: "Path Traversal in express",
    description: "Path traversal vulnerability allowing access to restricted files",
    fixedVersion: "4.17.3",
  },
];

export const mockSnykResponse = {
  vulnerabilities: mockSnykAlerts.map(alert => ({
    packageName: alert.package,
    version: alert.version,
    severity: alert.severity,
    id: alert.cve,
    title: alert.title,
    description: alert.description,
    fixedIn: [alert.fixedVersion],
  })),
};

export class MockSnykProvider {
  async checkSecurity(): Promise<SecurityAlert[]> {
    return mockSnykAlerts;
  }

  isAvailable(): boolean {
    return false;
  }
}
