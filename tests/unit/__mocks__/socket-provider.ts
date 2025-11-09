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

export const mockSocketResponse = {
  packages: mockSocketAlerts.map(alert => ({
    name: alert.package,
    version: alert.version,
    alerts: [
      {
        type: "vulnerability",
        severity: alert.severity,
        title: alert.title,
        description: alert.description,
      },
    ],
  })),
};

export class MockSocketProvider {
  async checkSecurity(): Promise<SecurityAlert[]> {
    return mockSocketAlerts;
  }

  isAvailable(): boolean {
    return false;
  }
}
