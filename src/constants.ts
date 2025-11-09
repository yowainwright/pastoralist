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

export const TEST_FIXTURES = {
  OVERRIDE_TO_KEEP: {
    packageName: "fake-pastoralist-check-2",
    fromVersion: "1.0.0",
    toVersion: "2.1.0",
    key: "fake-pastoralist-check-2@2.1.0",
    dependents: {
      "fake-pastoralist-check-1": "1.0.0"
    },
    ledger: {
      addedDate: "2024-01-15T10:00:00.000Z",
      reason: "Security fix: Critical vulnerability in fake-pastoralist-check-1 transitive dependency (critical)",
      securityChecked: true,
      securityCheckDate: "2024-01-15T10:00:00.000Z",
      securityProvider: "osv" as const,
    }
  },
  OVERRIDE_TO_REMOVE: {
    packageName: "fake-pastoralist-check-3",
    fromVersion: "0.8.0",
    toVersion: "1.0.0",
    key: "fake-pastoralist-check-3@1.0.0",
    dependents: {},
    ledger: {
      addedDate: "2023-06-01T10:00:00.000Z",
      reason: "Manual override for compatibility testing",
    }
  },
  ALERT_TO_RESOLVE: {
    packageName: "fake-pastoralist-check-2",
    currentVersion: "1.0.0",
    vulnerableVersions: "< 2.1.0",
    patchedVersion: "2.1.0",
    severity: "critical" as const,
    title: "Critical vulnerability in fake-pastoralist-check-2 (transitive from fake-pastoralist-check-1)",
    cve: "CVE-FAKE-PASTORALIST-2024-0001",
    fixAvailable: true,
    description: "Fake critical security vulnerability in fake-pastoralist-check-2. Used by fake-pastoralist-check-1@1.0.0.",
    url: "https://example.com/fake-pastoralist-advisory-0001"
  },
  ALERT_TO_CAPTURE: {
    packageName: "fake-pastoralist-check-4",
    currentVersion: "0.5.0",
    vulnerableVersions: "< 1.0.0",
    patchedVersion: undefined,
    severity: "high" as const,
    title: "High severity issue in fake-pastoralist-check-4 with no patch available",
    cve: "CVE-FAKE-PASTORALIST-2024-0002",
    fixAvailable: false,
    description: "Fake high severity vulnerability with no available patch for testing alert capture functionality.",
    url: "https://example.com/fake-pastoralist-advisory-0002"
  }
} as const;
