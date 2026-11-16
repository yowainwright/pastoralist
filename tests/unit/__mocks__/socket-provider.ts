import type { SecurityAlert } from "../../../src/types";
export const mockSocketAlerts: SecurityAlert[] = [
  {
    package: "react",
    version: "17.0.0",
    severity: "low",
    cve: "SOCKET-2024-0001",
    title: "Deprecated version of react",
    description: "Using deprecated version with known issues",
    fixedVersion: "18.0.0",
  },
];
const packages = mockSocketAlerts.map((alert) => {
  const { package: name, version, severity, title, description } = alert;
  const alerts = [{ type: "vulnerability", severity, title, description }];
  const packageInfo = { name, version, alerts };
  return packageInfo;
});
export const mockSocketResponse = {
  packages: packages,
};
export class MockSocketProvider {
  async checkSecurity(): Promise<SecurityAlert[]> {
    return mockSocketAlerts;
  }
  isAvailable(): boolean {
    return false;
  }
}
