import type { DependabotAlert } from "../../../src/core/security/types";

export const MOCK_DEPENDABOT_ALERT_LODASH = {
  number: 1,
  state: "open" as const,
  url: "https://mock.url",
  html_url: "https://mock.url",
  created_at: "2021-01-01T00:00:00Z",
  updated_at: "2021-01-01T00:00:00Z",
  dependency: {
    package: { ecosystem: "npm", name: "lodash" },
    manifest_path: "package.json",
    scope: "runtime" as const,
  },
  security_advisory: {
    severity: "high",
    summary: "Mock vulnerability in lodash",
    description: "Mock description",
    vulnerabilities: [
      {
        package: { ecosystem: "npm", name: "lodash" },
        vulnerable_version_range: "< 4.17.21",
        first_patched_version: { identifier: "4.17.21" },
      },
    ],
  },
  security_vulnerability: {
    package: { ecosystem: "npm", name: "lodash" },
    severity: "high",
    vulnerable_version_range: "< 4.17.21",
    first_patched_version: { identifier: "4.17.21" },
  },
} as DependabotAlert;

export const MOCK_DEPENDABOT_ALERT_MINIMIST = {
  number: 2,
  state: "open" as const,
  url: "https://mock.url",
  html_url: "https://mock.url",
  created_at: "2021-01-01T00:00:00Z",
  updated_at: "2021-01-01T00:00:00Z",
  dependency: {
    package: { ecosystem: "npm", name: "minimist" },
    manifest_path: "package.json",
    scope: "runtime" as const,
  },
  security_advisory: {
    severity: "medium",
    summary: "Mock vulnerability in minimist",
    description: "Mock description",
    vulnerabilities: [
      {
        package: { ecosystem: "npm", name: "minimist" },
        vulnerable_version_range: "< 1.2.6",
        first_patched_version: { identifier: "1.2.6" },
      },
    ],
  },
  security_vulnerability: {
    package: { ecosystem: "npm", name: "minimist" },
    severity: "medium",
    vulnerable_version_range: "< 1.2.6",
    first_patched_version: { identifier: "1.2.6" },
  },
} as DependabotAlert;
