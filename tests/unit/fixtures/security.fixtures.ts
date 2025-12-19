import type { SecurityAlert } from "../../../src/core/security/types";

export const BASE_SECURITY_ALERT = {
  packageName: "lodash",
  currentVersion: "4.17.20",
  vulnerableVersions: "< 4.17.21",
  patchedVersion: "4.17.21",
  severity: "high",
  title: "Prototype Pollution",
  fixAvailable: true,
} as const;

export const LODASH_CVE = "CVE-2021-23337";
export const LODASH_URL = "https://nvd.nist.gov/vuln/detail/CVE-2021-23337";
export const LODASH_DESCRIPTION =
  "Lodash versions before 4.17.21 are vulnerable";

export const AXIOS_ALERT_FIELDS = {
  packageName: "axios",
  currentVersion: "0.21.0",
  vulnerableVersions: "< 0.21.2",
  patchedVersion: "0.21.2",
  title: "SSRF vulnerability",
} as const;

export const NO_FIX_FIELDS = {
  patchedVersion: undefined,
  fixAvailable: false,
  title: "No fix available",
} as const;

export const BASE_DEPENDABOT_ALERT = {
  number: 1,
  state: "open" as const,
  url: "https://api.github.com/repos/owner/repo/dependabot/alerts/1",
  html_url: "https://github.com/owner/repo/security/dependabot/1",
  created_at: "2021-02-01T00:00:00Z",
  updated_at: "2021-02-01T00:00:00Z",
} as const;

export const LODASH_DEPENDENCY = {
  package: { ecosystem: "npm", name: "lodash" },
  manifest_path: "package.json",
  scope: "runtime" as const,
} as const;

export const LODASH_VULNERABILITY = {
  package: { ecosystem: "npm", name: "lodash" },
  vulnerable_version_range: "< 4.17.21",
  first_patched_version: { identifier: "4.17.21" },
} as const;

export const LODASH_ADVISORY = {
  severity: "high",
  summary: "Prototype Pollution in lodash",
  description:
    "Lodash versions before 4.17.21 are vulnerable to prototype pollution",
  cve_id: LODASH_CVE,
} as const;

export const BASE_SECURITY_OVERRIDE = {
  packageName: "lodash",
  fromVersion: "4.17.20",
  toVersion: "4.17.21",
  reason: "Security fix",
  severity: "high" as const,
} as const;

export const createAlert = (overrides = {}): SecurityAlert => ({
  ...BASE_SECURITY_ALERT,
  ...overrides,
});
