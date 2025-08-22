export const IS_DEBUGGING = process.env.DEBUG === "true" || false;

export const LOG_PREFIX = "🐑 👩🏽‍🌾 Pastoralist:";

export const SECURITY_ENV_VARS = {
  MOCK_MODE: "PASTORALIST_MOCK_SECURITY",
  FORCE_VULNERABLE: "MOCK_FORCE_VULNERABLE",
  MOCK_FILE: "MOCK_ALERTS_FILE",
  GITHUB_TOKEN: "GITHUB_TOKEN",
} as const;

export const MOCK_PACKAGE_LODASH = {
  ecosystem: "npm",
  name: "lodash",
};

export const MOCK_PACKAGE_MINIMIST = {
  ecosystem: "npm",
  name: "minimist",
};

export const MOCK_DEPENDENCY_LODASH = {
  package: MOCK_PACKAGE_LODASH,
  manifest_path: "package.json",
  scope: "runtime" as const,
};

export const MOCK_VULNERABILITY_LODASH = {
  package: MOCK_PACKAGE_LODASH,
  vulnerable_version_range: "< 4.17.21",
  first_patched_version: { identifier: "4.17.21" },
};

export const MOCK_VULNERABILITY_MINIMIST = {
  package: MOCK_PACKAGE_MINIMIST,
  vulnerable_version_range: "< 1.2.6",
  first_patched_version: { identifier: "1.2.6" },
};

export const MOCK_ADVISORY_LODASH = {
  severity: "high",
  summary: "Mock vulnerability in lodash",
  description: "Mock description",
  vulnerabilities: [MOCK_VULNERABILITY_LODASH],
};

export const MOCK_ADVISORY_MINIMIST = {
  severity: "medium",
  summary: "Mock vulnerability in minimist",
  description: "Mock description",
  vulnerabilities: [MOCK_VULNERABILITY_MINIMIST],
};

export const MOCK_SECURITY_VULNERABILITY_LODASH = {
  package: MOCK_PACKAGE_LODASH,
  severity: "high",
  vulnerable_version_range: "< 4.17.21",
  first_patched_version: { identifier: "4.17.21" },
};

export const MOCK_SECURITY_VULNERABILITY_MINIMIST = {
  package: MOCK_PACKAGE_MINIMIST,
  severity: "medium",
  vulnerable_version_range: "< 1.2.6",
  first_patched_version: { identifier: "1.2.6" },
};

export const MOCK_ALERT_METADATA = {
  url: "https://mock.url",
  html_url: "https://mock.url",
  created_at: "2021-01-01T00:00:00Z",
  updated_at: "2021-01-01T00:00:00Z",
};

export const MOCK_DEPENDABOT_ALERT_LODASH = {
  number: 1,
  state: "open" as const,
  dependency: MOCK_DEPENDENCY_LODASH,
  security_advisory: MOCK_ADVISORY_LODASH,
  security_vulnerability: MOCK_SECURITY_VULNERABILITY_LODASH,
  ...MOCK_ALERT_METADATA,
};

export const MOCK_DEPENDABOT_ALERT_MINIMIST = {
  number: 2,
  state: "open" as const,
  dependency: {
    package: MOCK_PACKAGE_MINIMIST,
    manifest_path: "package.json",
    scope: "runtime" as const,
  },
  security_advisory: MOCK_ADVISORY_MINIMIST,
  security_vulnerability: MOCK_SECURITY_VULNERABILITY_MINIMIST,
  ...MOCK_ALERT_METADATA,
};
