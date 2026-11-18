import type { DependabotAlert } from "../../../src/core/security/types";
const state = "open" as const;
const packageInfo = { ecosystem: "npm", name: "lodash" };
const scope = "runtime" as const;
const dependency = {
  package: packageInfo,
  manifest_path: "package.json",
  scope: scope,
};
const packageInfo2 = { ecosystem: "npm", name: "lodash" };
const first_patched_version = { identifier: "4.17.21" };
const vulnerabilities = [
  {
    package: packageInfo2,
    vulnerable_version_range: "< 4.17.21",
    first_patched_version: first_patched_version,
  },
];
const security_advisory = {
  severity: "high",
  summary: "Mock vulnerability in lodash",
  description: "Mock description",
  vulnerabilities: vulnerabilities,
};
const packageInfo3 = { ecosystem: "npm", name: "lodash" };
const first_patched_version2 = { identifier: "4.17.21" };
const security_vulnerability = {
  package: packageInfo3,
  severity: "high",
  vulnerable_version_range: "< 4.17.21",
  first_patched_version: first_patched_version2,
};
export const MOCK_DEPENDABOT_ALERT_LODASH = {
  number: 1,
  state: state,
  url: "https://mock.url",
  html_url: "https://mock.url",
  created_at: "2021-01-01T00:00:00Z",
  updated_at: "2021-01-01T00:00:00Z",
  dependency: dependency,
  security_advisory: security_advisory,
  security_vulnerability: security_vulnerability,
} as DependabotAlert;
const state2 = "open" as const;
const packageInfo4 = { ecosystem: "npm", name: "minimist" };
const scope2 = "runtime" as const;
const dependency2 = {
  package: packageInfo4,
  manifest_path: "package.json",
  scope: scope2,
};
const packageInfo5 = { ecosystem: "npm", name: "minimist" };
const first_patched_version3 = { identifier: "1.2.6" };
const vulnerabilities2 = [
  {
    package: packageInfo5,
    vulnerable_version_range: "< 1.2.6",
    first_patched_version: first_patched_version3,
  },
];
const security_advisory2 = {
  severity: "medium",
  summary: "Mock vulnerability in minimist",
  description: "Mock description",
  vulnerabilities: vulnerabilities2,
};
const packageInfo6 = { ecosystem: "npm", name: "minimist" };
const first_patched_version4 = { identifier: "1.2.6" };
const security_vulnerability2 = {
  package: packageInfo6,
  severity: "medium",
  vulnerable_version_range: "< 1.2.6",
  first_patched_version: first_patched_version4,
};
export const MOCK_DEPENDABOT_ALERT_MINIMIST = {
  number: 2,
  state: state2,
  url: "https://mock.url",
  html_url: "https://mock.url",
  created_at: "2021-01-01T00:00:00Z",
  updated_at: "2021-01-01T00:00:00Z",
  dependency: dependency2,
  security_advisory: security_advisory2,
  security_vulnerability: security_vulnerability2,
} as DependabotAlert;
