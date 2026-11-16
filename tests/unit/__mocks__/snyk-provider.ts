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
const vulnerabilities = mockSnykAlerts.map((alert) => {
  const {
    package: packageName,
    version,
    severity,
    cve: id,
    title,
    description,
    fixedVersion,
  } = alert;
  const fixedIn = [fixedVersion];
  const vulnerability = { packageName, version, severity, id, title, description, fixedIn };
  return vulnerability;
});
export const mockSnykResponse = {
  vulnerabilities: vulnerabilities,
};
export class MockSnykProvider {
  async checkSecurity(): Promise<SecurityAlert[]> {
    return mockSnykAlerts;
  }
  isAvailable(): boolean {
    return false;
  }
}
