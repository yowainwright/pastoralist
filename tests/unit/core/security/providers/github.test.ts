import { assertHasProperty, errorIncludes } from "../../../setup";
import { test } from "node:test";
import assert from "node:assert/strict";
import { GitHubSecurityProvider } from "../../../../../src/core/security/providers/github";
import type { DependabotAlert } from "../../../../../src/core/security/types";
import { SECURITY_ENV_VARS } from "../../../../../src/constants";
import {
  MOCK_DEPENDABOT_ALERT_LODASH,
  MOCK_DEPENDABOT_ALERT_MINIMIST,
} from "../../../fixtures/github";

const TEST_REPO_OPTIONS = { owner: "test-owner", repo: "test-repo", debug: false };
const TEST_REPO_TOKEN_OPTIONS = {
  owner: "test-owner",
  repo: "test-repo",
  token: "test-token",
  debug: false,
};

const execResolving = (stdout: string) => async () => ({ stdout, stderr: "" });
const execRejecting = (message: string) => async () => {
  throw new Error(message);
};

const restoreEnv = (name: string, value: string | undefined): void => {
  if (value) {
    process.env[name] = value;
    return;
  }
  delete process.env[name];
};

test("providerType - should be 'github'", () => {
  process.env.PASTORALIST_MOCK_SECURITY = "true";
  const provider = new GitHubSecurityProvider({ debug: false });
  assert.strictEqual(provider.providerType, "github");
});

test("constructor - initializes with token from environment", () => {
  process.env[SECURITY_ENV_VARS.MOCK_MODE] = "true";
  const originalToken = process.env.GITHUB_TOKEN;
  process.env.GITHUB_TOKEN = "test-token";

  const provider = new GitHubSecurityProvider({ debug: false });
  assert.notStrictEqual(provider, undefined);

  if (originalToken) {
    process.env.GITHUB_TOKEN = originalToken;
  } else {
    delete process.env.GITHUB_TOKEN;
  }
});

test("constructor - initializes with explicit token", () => {
  process.env[SECURITY_ENV_VARS.MOCK_MODE] = "true";
  const provider = new GitHubSecurityProvider({
    token: "explicit-token",
    debug: false,
  });
  assert.notStrictEqual(provider, undefined);
});

test("constructor - initializes with debug option", () => {
  process.env[SECURITY_ENV_VARS.MOCK_MODE] = "true";
  const provider = new GitHubSecurityProvider({ debug: true });
  assert.notStrictEqual(provider, undefined);
});

test("constructor - initializes with owner and repo", () => {
  process.env[SECURITY_ENV_VARS.MOCK_MODE] = "true";
  const provider = new GitHubSecurityProvider(TEST_REPO_OPTIONS);
  assert.notStrictEqual(provider, undefined);
});

test("convertToSecurityAlerts - converts Dependabot alerts to SecurityAlerts", () => {
  process.env[SECURITY_ENV_VARS.MOCK_MODE] = "true";
  const provider = new GitHubSecurityProvider({ debug: false });
  const dependabotAlerts: DependabotAlert[] = [MOCK_DEPENDABOT_ALERT_LODASH as DependabotAlert];

  const alerts = provider.convertToSecurityAlerts(dependabotAlerts);

  assert.strictEqual(alerts.length, 1);
  assert.strictEqual(alerts[0].packageName, "lodash");
  assert.strictEqual(alerts[0].severity, "high");
  assert.strictEqual(alerts[0].patchedVersion, "4.17.21");
});

test("convertToSecurityAlerts - filters out dismissed alerts", () => {
  process.env[SECURITY_ENV_VARS.MOCK_MODE] = "true";
  const provider = new GitHubSecurityProvider({ debug: false });
  const dismissedAlert: DependabotAlert = Object.assign(
    {},
    MOCK_DEPENDABOT_ALERT_LODASH as DependabotAlert,
    { state: "dismissed" },
  );

  const alerts = provider.convertToSecurityAlerts([dismissedAlert]);

  assert.strictEqual(alerts.length, 0);
});

test("convertToSecurityAlerts - filters out fixed alerts", () => {
  process.env[SECURITY_ENV_VARS.MOCK_MODE] = "true";
  const provider = new GitHubSecurityProvider({ debug: false });
  const fixedAlert: DependabotAlert = Object.assign(
    {},
    MOCK_DEPENDABOT_ALERT_LODASH as DependabotAlert,
    { state: "fixed" },
  );

  const alerts = provider.convertToSecurityAlerts([fixedAlert]);

  assert.strictEqual(alerts.length, 0);
});

test("convertToSecurityAlerts - only includes open alerts", () => {
  process.env[SECURITY_ENV_VARS.MOCK_MODE] = "true";
  const provider = new GitHubSecurityProvider({ debug: false });
  const alerts: DependabotAlert[] = [
    MOCK_DEPENDABOT_ALERT_LODASH as DependabotAlert,
    Object.assign({}, MOCK_DEPENDABOT_ALERT_MINIMIST as DependabotAlert, { state: "dismissed" }),
  ];

  const securityAlerts = provider.convertToSecurityAlerts(alerts);

  assert.strictEqual(securityAlerts.length, 1);
  assert.strictEqual(securityAlerts[0].packageName, "lodash");
});

const cveId = null as any;
test("convertToSecurityAlerts - handles alerts without CVE", () => {
  process.env[SECURITY_ENV_VARS.MOCK_MODE] = "true";
  const provider = new GitHubSecurityProvider({ debug: false });
  const securityAdvisory = Object.assign({}, MOCK_DEPENDABOT_ALERT_LODASH.security_advisory, {
    cve_id: cveId,
  });
  const alertWithoutCve: DependabotAlert = Object.assign(
    {},
    MOCK_DEPENDABOT_ALERT_LODASH as DependabotAlert,
    { security_advisory: securityAdvisory },
  );

  const alerts = provider.convertToSecurityAlerts([alertWithoutCve]);

  assert.strictEqual(alerts.length, 1);
  assert.ok(!alerts[0].cves?.length);
});

const firstPatchedVersion = null as any;
test("convertToSecurityAlerts - handles alerts without patched version", () => {
  process.env[SECURITY_ENV_VARS.MOCK_MODE] = "true";
  const provider = new GitHubSecurityProvider({ debug: false });
  const securityVulnerability = Object.assign(
    {},
    MOCK_DEPENDABOT_ALERT_LODASH.security_vulnerability,
    { first_patched_version: firstPatchedVersion },
  );
  const alertWithoutPatch: DependabotAlert = Object.assign(
    {},
    MOCK_DEPENDABOT_ALERT_LODASH as DependabotAlert,
    { security_vulnerability: securityVulnerability },
  );

  const alerts = provider.convertToSecurityAlerts([alertWithoutPatch]);

  assert.strictEqual(alerts.length, 1);
  assert.strictEqual(alerts[0].patchedVersion, undefined);
  assert.strictEqual(alerts[0].fixAvailable, false);
});

test("convertToSecurityAlerts - converts multiple alerts", () => {
  process.env[SECURITY_ENV_VARS.MOCK_MODE] = "true";
  const provider = new GitHubSecurityProvider({ debug: false });
  const alerts = provider.convertToSecurityAlerts([
    MOCK_DEPENDABOT_ALERT_LODASH as DependabotAlert,
    MOCK_DEPENDABOT_ALERT_MINIMIST as DependabotAlert,
  ]);

  assert.strictEqual(alerts.length, 2);
  assert.strictEqual(alerts[0].packageName, "lodash");
  assert.strictEqual(alerts[1].packageName, "minimist");
});

test("convertToSecurityAlerts - filters alerts to scanned npm packages", () => {
  process.env[SECURITY_ENV_VARS.MOCK_MODE] = "true";
  const provider = new GitHubSecurityProvider({ debug: false });
  const alerts = provider.convertToSecurityAlerts(
    [
      MOCK_DEPENDABOT_ALERT_LODASH as DependabotAlert,
      MOCK_DEPENDABOT_ALERT_MINIMIST as DependabotAlert,
    ],
    [{ name: "lodash", version: "4.17.20" }],
  );

  assert.strictEqual(alerts.length, 1);
  assert.strictEqual(alerts[0].packageName, "lodash");
  assert.strictEqual(alerts[0].currentVersion, "4.17.20");
});

const packageValue = { ecosystem: "pip", name: "lodash" };
const pipPackage = { package: packageValue };
const createPipAlert = (): DependabotAlert => {
  const lodashAlert = MOCK_DEPENDABOT_ALERT_LODASH as DependabotAlert;
  const dependency = Object.assign({}, lodashAlert.dependency, pipPackage);
  const securityVulnerability = Object.assign({}, lodashAlert.security_vulnerability, pipPackage);
  const pipAlert: DependabotAlert = Object.assign({}, lodashAlert, {
    dependency,
    security_vulnerability: securityVulnerability,
  });
  return pipAlert;
};
test("convertToSecurityAlerts - filters non-npm alerts when ecosystem is known", () => {
  process.env[SECURITY_ENV_VARS.MOCK_MODE] = "true";
  const provider = new GitHubSecurityProvider({ debug: false });
  const pipAlert = createPipAlert();

  const alerts = provider.convertToSecurityAlerts(
    [pipAlert],
    [{ name: "lodash", version: "4.17.20" }],
  );

  assert.strictEqual(alerts.length, 0);
});

const dependabotAlertsSecurityVulnerabilityPackageValue = { name: "test-pkg" };
const dependabotAlertsSecurityVulnerabilityFirstPatchedVersion = { identifier: "2.0.0" };
const dependabotAlertsSecurityVulnerability = {
  package: dependabotAlertsSecurityVulnerabilityPackageValue,
  vulnerable_version_range: "< 2.0.0",
  first_patched_version: dependabotAlertsSecurityVulnerabilityFirstPatchedVersion,
  severity: "critical",
};
const dependabotAlertsSecurityAdvisory = {
  summary: "Security Issue",
  description: "Detailed description",
  cve_id: "CVE-2024-1234",
};
const OPEN_TEST_PACKAGE_ALERT = {
  state: "open",
  security_vulnerability: dependabotAlertsSecurityVulnerability,
  security_advisory: dependabotAlertsSecurityAdvisory,
  html_url: "https://github.com/test/test/security/dependabot/1",
};
test("convertToSecurityAlerts - maps fields correctly", () => {
  const provider = new GitHubSecurityProvider(TEST_REPO_OPTIONS);
  const dependabotAlerts = [Object.assign({}, OPEN_TEST_PACKAGE_ALERT)];

  const alerts = provider.convertToSecurityAlerts(dependabotAlerts as any);

  assert.strictEqual(alerts[0].packageName, "test-pkg");
  assert.strictEqual(alerts[0].vulnerableVersions, "< 2.0.0");
  assert.strictEqual(alerts[0].patchedVersion, "2.0.0");
  assert.strictEqual(alerts[0].severity, "critical");
  assert.strictEqual(alerts[0].title, "Security Issue");
  assert.strictEqual(alerts[0].description, "Detailed description");
  assert.strictEqual(alerts[0].cves?.[0], "CVE-2024-1234");
  assert.strictEqual(alerts[0].url, "https://github.com/test/test/security/dependabot/1");
  assert.strictEqual(alerts[0].fixAvailable, true);
});

const alertsSecurityVulnerabilityPackageValue = { name: "pkg" };
const alertsSecurityVulnerabilityFirstPatchedVersion = { identifier: "4.17.21" };
const alertsSecurityVulnerability = {
  package: alertsSecurityVulnerabilityPackageValue,
  vulnerable_version_range: ">= 4.17.0, <= 4.17.20",
  first_patched_version: alertsSecurityVulnerabilityFirstPatchedVersion,
  severity: "high",
};
const alertsSecurityAdvisory = {
  summary: "Vuln",
  description: "Desc",
  cve_id: "CVE-2024-1",
};
test("convertToSecurityAlerts - extracts current version from range", () => {
  const provider = new GitHubSecurityProvider({
    owner: "test",
    repo: "test",
    debug: false,
  });

  const alerts = [
    {
      state: "open",
      security_vulnerability: alertsSecurityVulnerability,
      security_advisory: alertsSecurityAdvisory,
      html_url: "https://github.com/test/test/1",
    },
  ];

  const result = provider.convertToSecurityAlerts(alerts as any);

  assert.strictEqual(result[0].currentVersion, "4.17.0");
});

test("normalizeSeverity - normalizes low severity", () => {
  process.env[SECURITY_ENV_VARS.MOCK_MODE] = "true";
  const provider = new GitHubSecurityProvider({ debug: false });
  const result = (provider as any).normalizeSeverity("low");
  assert.strictEqual(result, "low");
});

test("normalizeSeverity - normalizes medium severity", () => {
  process.env[SECURITY_ENV_VARS.MOCK_MODE] = "true";
  const provider = new GitHubSecurityProvider({ debug: false });
  const result = (provider as any).normalizeSeverity("medium");
  assert.strictEqual(result, "medium");
});

test("normalizeSeverity - normalizes high severity", () => {
  process.env[SECURITY_ENV_VARS.MOCK_MODE] = "true";
  const provider = new GitHubSecurityProvider({ debug: false });
  const result = (provider as any).normalizeSeverity("high");
  assert.strictEqual(result, "high");
});

test("normalizeSeverity - normalizes critical severity", () => {
  process.env[SECURITY_ENV_VARS.MOCK_MODE] = "true";
  const provider = new GitHubSecurityProvider({ debug: false });
  const result = (provider as any).normalizeSeverity("critical");
  assert.strictEqual(result, "critical");
});

test("normalizeSeverity - handles uppercase severity", () => {
  process.env[SECURITY_ENV_VARS.MOCK_MODE] = "true";
  const provider = new GitHubSecurityProvider({ debug: false });
  assert.strictEqual((provider as any).normalizeSeverity("LOW"), "low");
  assert.strictEqual((provider as any).normalizeSeverity("MEDIUM"), "medium");
  assert.strictEqual((provider as any).normalizeSeverity("HIGH"), "high");
  assert.strictEqual((provider as any).normalizeSeverity("CRITICAL"), "critical");
});

test("normalizeSeverity - handles mixed case severity", () => {
  process.env[SECURITY_ENV_VARS.MOCK_MODE] = "true";
  const provider = new GitHubSecurityProvider({ debug: false });
  assert.strictEqual((provider as any).normalizeSeverity("Low"), "low");
  assert.strictEqual((provider as any).normalizeSeverity("Medium"), "medium");
  assert.strictEqual((provider as any).normalizeSeverity("High"), "high");
  assert.strictEqual((provider as any).normalizeSeverity("Critical"), "critical");
});

test("normalizeSeverity - defaults to medium for unknown severity", () => {
  process.env[SECURITY_ENV_VARS.MOCK_MODE] = "true";
  const provider = new GitHubSecurityProvider({ debug: false });
  const result = (provider as any).normalizeSeverity("unknown");
  assert.strictEqual(result, "medium");
});

test("normalizeSeverity - defaults to medium for invalid severity", () => {
  process.env[SECURITY_ENV_VARS.MOCK_MODE] = "true";
  const provider = new GitHubSecurityProvider({ debug: false });
  const result = (provider as any).normalizeSeverity("not-a-severity");
  assert.strictEqual(result, "medium");
});

test("isGitHubUrl - detects SSH GitHub URL", () => {
  process.env[SECURITY_ENV_VARS.MOCK_MODE] = "true";
  const provider = new GitHubSecurityProvider({ debug: false });
  const result = (provider as any).isGitHubUrl("git@github.com:user/repo.git");
  assert.strictEqual(result, true);
});

test("isGitHubUrl - detects HTTPS GitHub URL", () => {
  process.env[SECURITY_ENV_VARS.MOCK_MODE] = "true";
  const provider = new GitHubSecurityProvider({ debug: false });
  const result = (provider as any).isGitHubUrl("https://github.com/user/repo.git");
  assert.strictEqual(result, true);
});

test("isGitHubUrl - rejects non-GitHub URL", () => {
  process.env[SECURITY_ENV_VARS.MOCK_MODE] = "true";
  const provider = new GitHubSecurityProvider({ debug: false });
  const result = (provider as any).isGitHubUrl("https://gitlab.com/user/repo.git");
  assert.strictEqual(result, false);
});

test("isGitHubUrl - rejects invalid URL", () => {
  process.env[SECURITY_ENV_VARS.MOCK_MODE] = "true";
  const provider = new GitHubSecurityProvider({ debug: false });
  const result = (provider as any).isGitHubUrl("not-a-url");
  assert.strictEqual(result, false);
});

test("isGitHubUrl - handles HTTP GitHub URL", () => {
  process.env[SECURITY_ENV_VARS.MOCK_MODE] = "true";
  const provider = new GitHubSecurityProvider({ debug: false });
  const result = (provider as any).isGitHubUrl("http://github.com/user/repo.git");
  assert.strictEqual(result, true);
});

test("isGitHubUrl - rejects gitlab SSH URL", () => {
  const provider = new GitHubSecurityProvider(TEST_REPO_OPTIONS);

  assert.strictEqual(provider["isGitHubUrl"]("git@gitlab.com:owner/repo.git"), false);
});

test("isMockMode - returns true when mock mode is enabled", () => {
  process.env[SECURITY_ENV_VARS.MOCK_MODE] = "true";
  const provider = new GitHubSecurityProvider({ debug: false });
  const result = (provider as any).isMockMode();
  assert.strictEqual(result, true);
});

test("isMockMode - returns false when mock mode is disabled", () => {
  process.env[SECURITY_ENV_VARS.MOCK_MODE] = "false";
  const provider = new GitHubSecurityProvider({ debug: false });
  const result = (provider as any).isMockMode();
  assert.strictEqual(result, false);
  process.env[SECURITY_ENV_VARS.MOCK_MODE] = "true";
});

test("isMockMode - returns false when mock mode is not set", () => {
  delete process.env[SECURITY_ENV_VARS.MOCK_MODE];
  const provider = new GitHubSecurityProvider({ debug: false });
  const result = (provider as any).isMockMode();
  assert.strictEqual(result, false);
  process.env[SECURITY_ENV_VARS.MOCK_MODE] = "true";
});

test("shouldForceVulnerable - returns true when force vulnerable is enabled", () => {
  process.env[SECURITY_ENV_VARS.MOCK_MODE] = "true";
  process.env[SECURITY_ENV_VARS.FORCE_VULNERABLE] = "true";
  const provider = new GitHubSecurityProvider({ debug: false });
  const result = (provider as any).shouldForceVulnerable();
  assert.strictEqual(result, true);
  delete process.env[SECURITY_ENV_VARS.FORCE_VULNERABLE];
});

test("shouldForceVulnerable - returns false when force vulnerable is disabled", () => {
  process.env[SECURITY_ENV_VARS.MOCK_MODE] = "true";
  process.env[SECURITY_ENV_VARS.FORCE_VULNERABLE] = "false";
  const provider = new GitHubSecurityProvider({ debug: false });
  const result = (provider as any).shouldForceVulnerable();
  assert.strictEqual(result, false);
  delete process.env[SECURITY_ENV_VARS.FORCE_VULNERABLE];
});

test("shouldForceVulnerable - returns false when force vulnerable is not set", () => {
  process.env[SECURITY_ENV_VARS.MOCK_MODE] = "true";
  delete process.env[SECURITY_ENV_VARS.FORCE_VULNERABLE];
  const provider = new GitHubSecurityProvider({ debug: false });
  const result = (provider as any).shouldForceVulnerable();
  assert.strictEqual(result, false);
});

test("getDefaultMockAlerts - returns default mock alerts", () => {
  process.env[SECURITY_ENV_VARS.MOCK_MODE] = "true";
  const provider = new GitHubSecurityProvider({ debug: false });
  const alerts = (provider as any).getDefaultMockAlerts();
  assert.strictEqual(Array.isArray(alerts), true);
  assert.ok(alerts.length > 0);
});

test("getDefaultMockAlerts - includes lodash alert", () => {
  process.env[SECURITY_ENV_VARS.MOCK_MODE] = "true";
  const provider = new GitHubSecurityProvider({ debug: false });
  const alerts = (provider as any).getDefaultMockAlerts();
  const lodashAlert = alerts.find((a: DependabotAlert) => a.dependency.package.name === "lodash");
  assert.notStrictEqual(lodashAlert, undefined);
});

test("getDefaultMockAlerts - includes minimist alert", () => {
  process.env[SECURITY_ENV_VARS.MOCK_MODE] = "true";
  const provider = new GitHubSecurityProvider({ debug: false });
  const alerts = (provider as any).getDefaultMockAlerts();
  const minimistAlert = alerts.find(
    (a: DependabotAlert) => a.dependency.package.name === "minimist",
  );
  assert.notStrictEqual(minimistAlert, undefined);
});

test("fetchDependabotAlerts - returns empty array when not forcing vulnerable in mock mode", async () => {
  process.env[SECURITY_ENV_VARS.MOCK_MODE] = "true";
  process.env[SECURITY_ENV_VARS.FORCE_VULNERABLE] = "false";

  const provider = new GitHubSecurityProvider({
    owner: "test",
    repo: "test",
    debug: false,
  });

  const alerts = await provider.fetchDependabotAlerts();
  assert.deepStrictEqual(alerts, []);
  delete process.env[SECURITY_ENV_VARS.FORCE_VULNERABLE];
});

test("fetchDependabotAlerts - returns mock alerts when forcing vulnerable", async () => {
  process.env[SECURITY_ENV_VARS.MOCK_MODE] = "true";
  process.env[SECURITY_ENV_VARS.FORCE_VULNERABLE] = "true";

  const provider = new GitHubSecurityProvider({
    owner: "test",
    repo: "test",
    debug: false,
  });

  const alerts = await provider.fetchDependabotAlerts();
  assert.strictEqual(Array.isArray(alerts), true);
  assert.ok(alerts.length > 0);
  delete process.env[SECURITY_ENV_VARS.FORCE_VULNERABLE];
});

const withLiveGitHubFetch = async (fetchImpl: typeof fetch, run: () => Promise<void>) => {
  const originalMockMode = process.env[SECURITY_ENV_VARS.MOCK_MODE];
  const { fetch: originalFetch } = global;
  delete process.env[SECURITY_ENV_VARS.MOCK_MODE];
  global.fetch = fetchImpl;

  try {
    await run();
  } finally {
    global.fetch = originalFetch;
    restoreEnv(SECURITY_ENV_VARS.MOCK_MODE, originalMockMode);
  }
};

const jsonResponse = (body: unknown, headers: Headers): Response => {
  const json = async () => body;
  const response = { ok: true, headers, json } as Response;
  return response;
};

const NEXT_PAGE_LINK = { Link: '<https://api.github.com/alerts?page=2>; rel="next"' };

test("fetchDependabotAlerts - preserves dots in inferred repository names", async () => {
  let requestedUrl = "";
  const fetchImpl = async (input: string | URL | Request) => {
    requestedUrl = String(input);
    const response = jsonResponse([], new Headers());
    return response;
  };

  await withLiveGitHubFetch(fetchImpl, async () => {
    const token = ["test", "token"].join("-");
    const provider = new GitHubSecurityProvider({ token, debug: false });
    provider["execFileAsync"] = execResolving("https://github.com/vercel/next.js.git\n") as any;

    await provider.fetchDependabotAlerts();
    assert.ok(requestedUrl.includes("/vercel/next.js/dependabot/alerts"));
  });
});

test("fetchDependabotAlerts - follows GitHub API pagination", async () => {
  const firstAlert = MOCK_DEPENDABOT_ALERT_LODASH as DependabotAlert;
  const secondAlert = MOCK_DEPENDABOT_ALERT_MINIMIST as DependabotAlert;
  let requestCount = 0;
  const fetchImpl = async () => {
    requestCount += 1;
    const isFirstPage = requestCount === 1;
    const headers = isFirstPage ? new Headers(NEXT_PAGE_LINK) : new Headers();
    const alerts = isFirstPage ? [firstAlert] : [secondAlert];
    const response = jsonResponse(alerts, headers);
    return response;
  };

  await withLiveGitHubFetch(fetchImpl, async () => {
    const provider = new GitHubSecurityProvider(TEST_REPO_TOKEN_OPTIONS);
    const alerts = await provider.fetchDependabotAlerts();
    assert.deepStrictEqual(alerts, [firstAlert, secondAlert]);
    assert.strictEqual(requestCount, 2);
  });
});

test("fetchAlerts - converts Dependabot alerts to SecurityAlerts", async () => {
  process.env[SECURITY_ENV_VARS.MOCK_MODE] = "true";
  process.env[SECURITY_ENV_VARS.FORCE_VULNERABLE] = "true";

  const provider = new GitHubSecurityProvider({
    owner: "test",
    repo: "test",
    debug: false,
  });

  const alerts = await provider.fetchAlerts();
  assert.strictEqual(Array.isArray(alerts), true);

  if (alerts.length > 0) {
    assertHasProperty(alerts[0], "packageName");
    assertHasProperty(alerts[0], "severity");
    assertHasProperty(alerts[0], "vulnerableVersions");
  }
  delete process.env[SECURITY_ENV_VARS.FORCE_VULNERABLE];
});

test("extractCurrentVersion - extracts version from >= range", () => {
  process.env[SECURITY_ENV_VARS.MOCK_MODE] = "true";
  const provider = new GitHubSecurityProvider({ debug: false });
  const securityVulnerability = Object.assign(
    {},
    MOCK_DEPENDABOT_ALERT_LODASH.security_vulnerability,
    { vulnerable_version_range: ">= 4.0.0" },
  );
  const alert: DependabotAlert = Object.assign(
    {},
    MOCK_DEPENDABOT_ALERT_LODASH as DependabotAlert,
    { security_vulnerability: securityVulnerability },
  );

  const version = (provider as any).extractCurrentVersion(alert);
  assert.strictEqual(version, "4.0.0");
});

test("extractCurrentVersion - extracts version from >= <= range", () => {
  process.env[SECURITY_ENV_VARS.MOCK_MODE] = "true";
  const provider = new GitHubSecurityProvider({ debug: false });
  const securityVulnerability = Object.assign(
    {},
    MOCK_DEPENDABOT_ALERT_LODASH.security_vulnerability,
    { vulnerable_version_range: ">= 4.0.0, <= 4.17.20" },
  );
  const alert: DependabotAlert = Object.assign(
    {},
    MOCK_DEPENDABOT_ALERT_LODASH as DependabotAlert,
    { security_vulnerability: securityVulnerability },
  );

  const version = (provider as any).extractCurrentVersion(alert);
  assert.strictEqual(version, "4.0.0");
});

test("extractCurrentVersion - returns unknown for unparseable range", () => {
  process.env[SECURITY_ENV_VARS.MOCK_MODE] = "true";
  const provider = new GitHubSecurityProvider({ debug: false });
  const securityVulnerability = Object.assign(
    {},
    MOCK_DEPENDABOT_ALERT_LODASH.security_vulnerability,
    { vulnerable_version_range: "< 1.0.0" },
  );
  const alert: DependabotAlert = Object.assign(
    {},
    MOCK_DEPENDABOT_ALERT_LODASH as DependabotAlert,
    { security_vulnerability: securityVulnerability },
  );

  const version = (provider as any).extractCurrentVersion(alert);
  assert.strictEqual(version, "unknown");
});

const alertSecurityVulnerabilityPackageValue = { name: "test" };
const alertSecurityVulnerability = {
  package: alertSecurityVulnerabilityPackageValue,
  vulnerable_version_range: ">= 4.17.0",
  first_patched_version: alertsSecurityVulnerabilityFirstPatchedVersion,
  severity: "high",
};
const alertSecurityAdvisory = {
  summary: "Test",
  description: "Test",
  cve_id: "CVE-2024-TEST",
};
test("extractCurrentVersion - handles >= with single space", () => {
  const provider = new GitHubSecurityProvider({
    owner: "test",
    repo: "test",
    debug: false,
  });

  const alert = {
    state: "open",
    security_vulnerability: alertSecurityVulnerability,
    security_advisory: alertSecurityAdvisory,
    html_url: "https://github.com/test/test/1",
  } as any;

  const result = (provider as any).extractCurrentVersion(alert);
  assert.strictEqual(result, "4.17.0");
});

const securityVulnerability2FirstPatchedVersion = { identifier: "1.0.0" };
const securityVulnerability2 = {
  package: alertSecurityVulnerabilityPackageValue,
  vulnerable_version_range: "",
  first_patched_version: securityVulnerability2FirstPatchedVersion,
  severity: "low",
};
test("extractCurrentVersion - handles empty vulnerable range", () => {
  const provider = new GitHubSecurityProvider({
    owner: "test",
    repo: "test",
    debug: false,
  });

  const alert = {
    state: "open",
    security_vulnerability: securityVulnerability2,
    security_advisory: alertSecurityAdvisory,
    html_url: "https://github.com/test/test/1",
  } as any;

  const result = (provider as any).extractCurrentVersion(alert);
  assert.strictEqual(result, "unknown");
});

test("initialize - sets owner and repo when provided", async () => {
  const provider = new GitHubSecurityProvider({
    owner: "explicit-owner",
    repo: "explicit-repo",
    debug: false,
  });

  await provider.initialize();

  assert.strictEqual(provider["owner"], "explicit-owner");
  assert.strictEqual(provider["repo"], "explicit-repo");
});

test("fetchMockAlerts - returns empty when not forcing vulnerable", async () => {
  const originalMock = process.env[SECURITY_ENV_VARS.MOCK_MODE];
  const originalForce = process.env[SECURITY_ENV_VARS.FORCE_VULNERABLE];

  process.env[SECURITY_ENV_VARS.MOCK_MODE] = "true";
  delete process.env[SECURITY_ENV_VARS.FORCE_VULNERABLE];

  const provider = new GitHubSecurityProvider(TEST_REPO_OPTIONS);

  const alerts = await provider["fetchMockAlerts"]();
  assert.deepStrictEqual(alerts, []);

  if (originalMock) process.env[SECURITY_ENV_VARS.MOCK_MODE] = originalMock;
  else delete process.env[SECURITY_ENV_VARS.MOCK_MODE];

  if (originalForce) process.env[SECURITY_ENV_VARS.FORCE_VULNERABLE] = originalForce;
});

test("fetchMockAlerts - returns alerts when forcing vulnerable", async () => {
  const originalMock = process.env[SECURITY_ENV_VARS.MOCK_MODE];
  const originalForce = process.env[SECURITY_ENV_VARS.FORCE_VULNERABLE];

  process.env[SECURITY_ENV_VARS.MOCK_MODE] = "true";
  process.env[SECURITY_ENV_VARS.FORCE_VULNERABLE] = "true";

  const provider = new GitHubSecurityProvider(TEST_REPO_OPTIONS);

  const alerts = await provider["fetchMockAlerts"]();
  assert.strictEqual(Array.isArray(alerts), true);
  assert.ok(alerts.length > 0);

  if (originalMock) process.env[SECURITY_ENV_VARS.MOCK_MODE] = originalMock;
  else delete process.env[SECURITY_ENV_VARS.MOCK_MODE];

  if (originalForce) process.env[SECURITY_ENV_VARS.FORCE_VULNERABLE] = originalForce;
  else delete process.env[SECURITY_ENV_VARS.FORCE_VULNERABLE];
});

test("getMockVulnerableAlerts - uses default when no mock file", async () => {
  const originalMock = process.env[SECURITY_ENV_VARS.MOCK_MODE];
  const originalForce = process.env[SECURITY_ENV_VARS.FORCE_VULNERABLE];
  const originalFile = process.env[SECURITY_ENV_VARS.MOCK_FILE];

  process.env[SECURITY_ENV_VARS.MOCK_MODE] = "true";
  process.env[SECURITY_ENV_VARS.FORCE_VULNERABLE] = "true";
  delete process.env[SECURITY_ENV_VARS.MOCK_FILE];

  const provider = new GitHubSecurityProvider(TEST_REPO_OPTIONS);

  const alerts = await provider["getMockVulnerableAlerts"]();
  assert.strictEqual(Array.isArray(alerts), true);
  assert.ok(alerts.length > 0);

  if (originalMock) process.env[SECURITY_ENV_VARS.MOCK_MODE] = originalMock;
  else delete process.env[SECURITY_ENV_VARS.MOCK_MODE];

  if (originalForce) process.env[SECURITY_ENV_VARS.FORCE_VULNERABLE] = originalForce;
  else delete process.env[SECURITY_ENV_VARS.FORCE_VULNERABLE];

  if (originalFile) process.env[SECURITY_ENV_VARS.MOCK_FILE] = originalFile;
});

const mockDataSecurityVulnerabilityPackageValue = { name: "test-package" };
const mockDataSecurityVulnerability = {
  package: mockDataSecurityVulnerabilityPackageValue,
  vulnerable_version_range: "< 1.0.0",
  first_patched_version: securityVulnerability2FirstPatchedVersion,
  severity: "high",
};
const mockDataSecurityAdvisory = {
  summary: "Test Alert",
  description: "Test Description",
  cve_id: "CVE-2024-TEST",
};
test("loadMockFile - loads valid mock file", async () => {
  const { writeFileSync, unlinkSync } = await import("fs");
  const { resolve } = await import("path");

  const testFile = resolve(process.cwd(), "tests/unit/.test-mock-alerts.json");
  const mockData = [
    {
      state: "open",
      security_vulnerability: mockDataSecurityVulnerability,
      security_advisory: mockDataSecurityAdvisory,
      html_url: "https://github.com/test/test/security/1",
    },
  ];

  writeFileSync(testFile, JSON.stringify(mockData));

  const provider = new GitHubSecurityProvider(TEST_REPO_OPTIONS);

  const alerts = await provider["loadMockFile"](testFile);
  assert.notStrictEqual(alerts, undefined);
  assert.strictEqual(Array.isArray(alerts), true);
  assert.strictEqual(alerts?.length, 1);

  unlinkSync(testFile);
});

test("loadMockFile - returns null for invalid file", async () => {
  const provider = new GitHubSecurityProvider(TEST_REPO_OPTIONS);

  const alerts = await provider["loadMockFile"]("/nonexistent/path/file.json");
  assert.strictEqual(alerts, null);
});

test("loadMockFile - returns null for malformed JSON", async () => {
  const { writeFileSync, unlinkSync } = await import("fs");
  const { resolve } = await import("path");

  const testFile = resolve(process.cwd(), "tests/unit/.test-invalid-json.json");
  writeFileSync(testFile, "{ invalid json }");

  const provider = new GitHubSecurityProvider(TEST_REPO_OPTIONS);

  const alerts = await provider["loadMockFile"](testFile);
  assert.strictEqual(alerts, null);

  unlinkSync(testFile);
});

test("fetchRealAlerts - throws when no token and no gh CLI", async () => {
  const originalMock = process.env[SECURITY_ENV_VARS.MOCK_MODE];
  const originalToken = process.env.GITHUB_TOKEN;

  delete process.env[SECURITY_ENV_VARS.MOCK_MODE];
  delete process.env.GITHUB_TOKEN;

  const provider = new GitHubSecurityProvider(TEST_REPO_OPTIONS);

  provider["isGhCliAvailable"] = async () => false;

  await assert.rejects(
    provider["fetchRealAlerts"](),
    errorIncludes("GitHub CLI not found and no GITHUB_TOKEN provided"),
  );

  if (originalMock) process.env[SECURITY_ENV_VARS.MOCK_MODE] = originalMock;
  if (originalToken) process.env.GITHUB_TOKEN = originalToken;
});

test("fetchRealAlerts - uses API when token provided", async () => {
  const originalMock = process.env[SECURITY_ENV_VARS.MOCK_MODE];

  delete process.env[SECURITY_ENV_VARS.MOCK_MODE];

  const provider = new GitHubSecurityProvider(TEST_REPO_TOKEN_OPTIONS);

  let apiCalled = false;
  provider["fetchAlertsWithApi"] = async () => {
    apiCalled = true;
    const items = [];
    return items;
  };

  await provider["fetchRealAlerts"]();
  assert.strictEqual(apiCalled, true);

  if (originalMock) process.env[SECURITY_ENV_VARS.MOCK_MODE] = originalMock;
});

test("fetchRealAlerts - uses gh CLI when no token but CLI available", async () => {
  const originalMock = process.env[SECURITY_ENV_VARS.MOCK_MODE];
  const originalToken = process.env.GITHUB_TOKEN;

  delete process.env[SECURITY_ENV_VARS.MOCK_MODE];
  delete process.env.GITHUB_TOKEN;

  const provider = new GitHubSecurityProvider(TEST_REPO_OPTIONS);

  provider["isGhCliAvailable"] = async () => true;

  let cliCalled = false;
  provider["fetchAlertsWithGhCli"] = async () => {
    cliCalled = true;
    const items = [];
    return items;
  };

  await provider["fetchRealAlerts"]();
  assert.strictEqual(cliCalled, true);

  if (originalMock) process.env[SECURITY_ENV_VARS.MOCK_MODE] = originalMock;
  if (originalToken) process.env.GITHUB_TOKEN = originalToken;
});

test("fetchRealAlerts - API path throws wrapped error on failure", async () => {
  const originalMock = process.env[SECURITY_ENV_VARS.MOCK_MODE];
  delete process.env[SECURITY_ENV_VARS.MOCK_MODE];

  const provider = new GitHubSecurityProvider(TEST_REPO_TOKEN_OPTIONS);

  provider["fetchAlertsWithApi"] = async () => {
    throw new Error("Failed to fetch Dependabot alerts: API error");
  };

  await assert.rejects(
    provider["fetchRealAlerts"](),
    errorIncludes("Failed to fetch Dependabot alerts"),
  );

  if (originalMock) process.env[SECURITY_ENV_VARS.MOCK_MODE] = originalMock;
});

test("fetchRealAlerts - CLI path throws wrapped error on failure", async () => {
  const originalMock = process.env[SECURITY_ENV_VARS.MOCK_MODE];
  const originalToken = process.env.GITHUB_TOKEN;

  delete process.env[SECURITY_ENV_VARS.MOCK_MODE];
  delete process.env.GITHUB_TOKEN;

  const provider = new GitHubSecurityProvider(TEST_REPO_OPTIONS);

  provider["isGhCliAvailable"] = async () => true;
  provider["fetchAlertsWithGhCli"] = async () => {
    throw new Error("Failed to fetch Dependabot alerts: CLI error");
  };

  await assert.rejects(
    provider["fetchRealAlerts"](),
    errorIncludes("Failed to fetch Dependabot alerts"),
  );

  if (originalMock) process.env[SECURITY_ENV_VARS.MOCK_MODE] = originalMock;
  if (originalToken) process.env.GITHUB_TOKEN = originalToken;
});

const mockAlertsSecurityVulnerability = {
  package: dependabotAlertsSecurityVulnerabilityPackageValue,
  vulnerable_version_range: "< 1.0.0",
  first_patched_version: securityVulnerability2FirstPatchedVersion,
  severity: "high",
};
const mockAlertsSecurityAdvisory = {
  summary: "Test",
  description: "Test",
  cve_id: "CVE-2024-1234",
};
test("fetchAlertsWithGhCli - parses JSON response", async () => {
  const provider = new GitHubSecurityProvider(TEST_REPO_OPTIONS);

  const mockAlerts = [
    {
      state: "open",
      security_vulnerability: mockAlertsSecurityVulnerability,
      security_advisory: mockAlertsSecurityAdvisory,
      html_url: "https://github.com/test/test/1",
    },
  ];

  provider["executeGhCli"] = async () => JSON.stringify(mockAlerts);

  const alerts = await provider["fetchAlertsWithGhCli"]();
  assert.deepStrictEqual(alerts, mockAlerts);
});

test("fetchAlertsWithGhCli - handles non-array response", async () => {
  const provider = new GitHubSecurityProvider(TEST_REPO_OPTIONS);

  provider["executeGhCli"] = async () => JSON.stringify({ message: "error" });

  const alerts = await provider["fetchAlertsWithGhCli"]();
  assert.deepStrictEqual(alerts, []);
});

test("isPermissionError - detects 'Resource not accessible by integration' error", () => {
  const provider = new GitHubSecurityProvider(TEST_REPO_OPTIONS);

  assert.strictEqual(provider["isPermissionError"]("Resource not accessible by integration"), true);
});

test("isPermissionError - detects 'Must have admin rights' error", () => {
  const provider = new GitHubSecurityProvider(TEST_REPO_OPTIONS);

  assert.strictEqual(provider["isPermissionError"]("Must have admin rights"), true);
});

test("isPermissionError - detects 'Not Found' error", () => {
  const provider = new GitHubSecurityProvider(TEST_REPO_OPTIONS);

  assert.strictEqual(provider["isPermissionError"]("Not Found"), true);
});

test("isPermissionError - detects 'Dependabot alerts are not enabled' error", () => {
  const provider = new GitHubSecurityProvider(TEST_REPO_OPTIONS);

  assert.strictEqual(provider["isPermissionError"]("Dependabot alerts are not enabled"), true);
});

test("isPermissionError - detects 'vulnerability alerts are disabled' error", () => {
  const provider = new GitHubSecurityProvider(TEST_REPO_OPTIONS);

  assert.strictEqual(provider["isPermissionError"]("vulnerability alerts are disabled"), true);
});

test("isPermissionError - is case insensitive", () => {
  const provider = new GitHubSecurityProvider(TEST_REPO_OPTIONS);

  assert.strictEqual(provider["isPermissionError"]("RESOURCE NOT ACCESSIBLE BY INTEGRATION"), true);
  assert.strictEqual(provider["isPermissionError"]("resource not accessible by integration"), true);
});

test("isPermissionError - returns false for non-permission errors", () => {
  const provider = new GitHubSecurityProvider(TEST_REPO_OPTIONS);

  assert.strictEqual(provider["isPermissionError"]("Rate limit exceeded"), false);
  assert.strictEqual(provider["isPermissionError"]("Server error"), false);
  assert.strictEqual(provider["isPermissionError"]("Network timeout"), false);
});

test("fetchAlertsWithGhCli - throws SecurityProviderPermissionError for permission errors", async () => {
  const { SecurityProviderPermissionError } =
    await import("../../../../../src/core/security/types");
  const provider = new GitHubSecurityProvider(TEST_REPO_OPTIONS);

  provider["executeGhCli"] = async () => {
    throw new Error("Resource not accessible by integration");
  };

  await assert.rejects(provider["fetchAlertsWithGhCli"](), SecurityProviderPermissionError);
});

test("fetchAlertsWithApi - throws SecurityProviderPermissionError for permission errors", async () => {
  const { SecurityProviderPermissionError } =
    await import("../../../../../src/core/security/types");
  const provider = new GitHubSecurityProvider(TEST_REPO_TOKEN_OPTIONS);

  provider["fetchFromGitHubAPI"] = async () => {
    throw new SecurityProviderPermissionError("GitHub", "Resource not accessible by integration");
  };

  await assert.rejects(provider["fetchAlertsWithApi"](), SecurityProviderPermissionError);
});

test("SecurityProviderPermissionError - has correct message format", async () => {
  const { SecurityProviderPermissionError } =
    await import("../../../../../src/core/security/types");

  const error = new SecurityProviderPermissionError(
    "GitHub",
    "Resource not accessible by integration",
  );

  assert.strictEqual(error.name, "SecurityProviderPermissionError");
  assert.strictEqual(error.provider, "GitHub");
  assert.strictEqual(error.originalMessage, "Resource not accessible by integration");
  const message: string = error.message;
  assert.ok(message.includes("GitHub"));
  assert.ok(message.includes("Resource not accessible by integration"));
  assert.ok(message.includes("vulnerability-alerts: read"));
});

test("SecurityProviderPermissionError - provides guidance for disabled alerts", async () => {
  const { SecurityProviderPermissionError } =
    await import("../../../../../src/core/security/types");

  const error = new SecurityProviderPermissionError("GitHub", "Dependabot alerts are not enabled");
  const message: string = error.message;

  assert.ok(message.includes("Enable Dependabot alerts"));
  assert.ok(message.includes("Settings > Code security"));
});

test("SecurityProviderPermissionError - provides guidance for not found errors", async () => {
  const { SecurityProviderPermissionError } =
    await import("../../../../../src/core/security/types");

  const error = new SecurityProviderPermissionError("GitHub", "Not Found");

  assert.ok(error.message.includes("Verify the repository exists"));
});

test("SecurityProviderPermissionError - provides fallback guidance for unknown errors", async () => {
  const { SecurityProviderPermissionError } =
    await import("../../../../../src/core/security/types");

  const error = new SecurityProviderPermissionError("GitHub", "Some other error");

  assert.ok(error.message.includes("Check repository permissions"));
});

test("SecurityProviderPermissionError - extends Error", async () => {
  const { SecurityProviderPermissionError } =
    await import("../../../../../src/core/security/types");

  const error = new SecurityProviderPermissionError("GitHub CLI", "Not Found");

  assert.strictEqual(error instanceof Error, true);
  assert.notStrictEqual(error.stack, undefined);
});

test("fetchFromGitHubAPI - throws SecurityProviderPermissionError for permission error response", async () => {
  const { SecurityProviderPermissionError } =
    await import("../../../../../src/core/security/types");

  const provider = new GitHubSecurityProvider(TEST_REPO_TOKEN_OPTIONS);

  const mockResponse = {
    ok: false,
    statusText: "Forbidden",
    json: async () => ({ message: "Resource not accessible by integration" }),
  };

  const { fetch: originalFetch } = global;
  global.fetch = async () => mockResponse as Response;

  try {
    await assert.rejects(provider["fetchFromGitHubAPI"](), SecurityProviderPermissionError);
  } finally {
    global.fetch = originalFetch;
  }
});

test("fetchFromGitHubAPI - throws regular error for non-permission API errors", async () => {
  const provider = new GitHubSecurityProvider(TEST_REPO_TOKEN_OPTIONS);

  const mockResponse = {
    ok: false,
    statusText: "Internal Server Error",
    json: async () => ({ message: "Server error" }),
  };

  const { fetch: originalFetch } = global;
  global.fetch = async () => mockResponse as Response;

  try {
    await assert.rejects(
      provider["fetchFromGitHubAPI"](),
      errorIncludes("GitHub API error: Server error"),
    );
  } finally {
    global.fetch = originalFetch;
  }
});

test("fetchFromGitHubAPI - uses statusText when message is missing", async () => {
  const provider = new GitHubSecurityProvider(TEST_REPO_TOKEN_OPTIONS);

  const mockResponse = {
    ok: false,
    statusText: "Bad Request",
    json: async () => ({}),
  };

  const { fetch: originalFetch } = global;
  global.fetch = async () => mockResponse as Response;

  try {
    await assert.rejects(
      provider["fetchFromGitHubAPI"](),
      errorIncludes("GitHub API error: Bad Request"),
    );
  } finally {
    global.fetch = originalFetch;
  }
});

const securityVulnerability3 = {};
test("fetchFromGitHubAPI - returns alerts array on success", async () => {
  const provider = new GitHubSecurityProvider(TEST_REPO_TOKEN_OPTIONS);

  const mockAlerts = [{ state: "open", security_vulnerability: securityVulnerability3 }];
  const mockResponse = {
    ok: true,
    json: async () => mockAlerts,
  };

  const { fetch: originalFetch } = global;
  global.fetch = async () => mockResponse as Response;

  try {
    const result = await provider["fetchFromGitHubAPI"]();
    assert.deepStrictEqual(result, mockAlerts);
  } finally {
    global.fetch = originalFetch;
  }
});

test("fetchFromGitHubAPI - returns empty array for non-array response", async () => {
  const provider = new GitHubSecurityProvider(TEST_REPO_TOKEN_OPTIONS);

  const mockResponse = {
    ok: true,
    json: async () => ({ message: "unexpected format" }),
  };

  const { fetch: originalFetch } = global;
  global.fetch = async () => mockResponse as Response;

  try {
    const result = await provider["fetchFromGitHubAPI"]();
    assert.deepStrictEqual(result, []);
  } finally {
    global.fetch = originalFetch;
  }
});

test("fetchAlertsWithGhCli - does not retry on permission error", async () => {
  const { SecurityProviderPermissionError } =
    await import("../../../../../src/core/security/types");

  const provider = new GitHubSecurityProvider(TEST_REPO_OPTIONS);

  let callCount = 0;
  provider["executeGhCli"] = async () => {
    callCount++;
    throw new Error("Resource not accessible by integration");
  };

  await assert.rejects(provider["fetchAlertsWithGhCli"](), SecurityProviderPermissionError);

  assert.strictEqual(callCount, 1);
});

test("fetchAlertsWithApi - does not retry on permission error", async () => {
  const { SecurityProviderPermissionError } =
    await import("../../../../../src/core/security/types");

  const provider = new GitHubSecurityProvider(TEST_REPO_TOKEN_OPTIONS);

  let callCount = 0;
  provider["fetchFromGitHubAPI"] = async () => {
    callCount++;
    throw new SecurityProviderPermissionError("GitHub", "Resource not accessible by integration");
  };

  await assert.rejects(provider["fetchAlertsWithApi"](), SecurityProviderPermissionError);

  assert.strictEqual(callCount, 1);
});

test("isPermissionError - detects error in longer message", () => {
  const provider = new GitHubSecurityProvider(TEST_REPO_OPTIONS);

  const hasPermissionError = provider["isPermissionError"](
    "Error: GitHub API error: Resource not accessible by integration (status 403)",
  );

  assert.strictEqual(hasPermissionError, true);
});

test("isPermissionError - handles empty string", () => {
  const provider = new GitHubSecurityProvider(TEST_REPO_OPTIONS);

  assert.strictEqual(provider["isPermissionError"](""), false);
});

test("getRepoOwner - extracts owner from HTTPS GitHub URL", async () => {
  const provider = new GitHubSecurityProvider({ debug: false });

  provider["execFileAsync"] = execResolving(
    "https://github.com/yowainwright/pastoralist.git\n",
  ) as any;

  const owner = await provider["getRepoOwner"]();
  assert.strictEqual(owner, "yowainwright");
});

test("getRepoOwner - extracts owner from SSH GitHub URL", async () => {
  const provider = new GitHubSecurityProvider({ debug: false });

  provider["execFileAsync"] = execResolving("git@github.com:yowainwright/pastoralist.git\n") as any;

  const owner = await provider["getRepoOwner"]();
  assert.strictEqual(owner, "yowainwright");
});

test("getRepoOwner - throws for non-GitHub URL", async () => {
  const provider = new GitHubSecurityProvider({ debug: false });

  provider["execFileAsync"] = execResolving("https://gitlab.com/user/repo.git\n") as any;

  await assert.rejects(
    provider["getRepoOwner"](),
    errorIncludes("Unable to determine GitHub repository owner"),
  );
});

test("getRepoOwner - throws when git command fails", async () => {
  const provider = new GitHubSecurityProvider({ debug: false });

  provider["execFileAsync"] = execRejecting("git command failed") as any;

  await assert.rejects(
    provider["getRepoOwner"](),
    errorIncludes("Unable to determine GitHub repository owner"),
  );
});

test("getRepoName - extracts repo name from HTTPS GitHub URL", async () => {
  const provider = new GitHubSecurityProvider({ debug: false });

  provider["execFileAsync"] = execResolving(
    "https://github.com/yowainwright/pastoralist.git\n",
  ) as any;

  const repo = await provider["getRepoName"]();
  assert.strictEqual(repo, "pastoralist");
});

test("getRepoName - extracts repo name from SSH GitHub URL", async () => {
  const provider = new GitHubSecurityProvider({ debug: false });

  provider["execFileAsync"] = execResolving("git@github.com:yowainwright/pastoralist.git\n") as any;

  const repo = await provider["getRepoName"]();
  assert.strictEqual(repo, "pastoralist");
});

test("getRepoName - throws for non-GitHub URL", async () => {
  const provider = new GitHubSecurityProvider({ debug: false });

  provider["execFileAsync"] = execResolving("https://gitlab.com/user/repo.git\n") as any;

  await assert.rejects(
    provider["getRepoName"](),
    errorIncludes("Unable to determine GitHub repository name"),
  );
});

test("getRepoName - throws when git command fails", async () => {
  const provider = new GitHubSecurityProvider({ debug: false });

  provider["execFileAsync"] = execRejecting("git command failed") as any;

  await assert.rejects(
    provider["getRepoName"](),
    errorIncludes("Unable to determine GitHub repository name"),
  );
});

test("getRepoOwner - handles URL without .git suffix", async () => {
  const provider = new GitHubSecurityProvider({ debug: false });

  provider["execFileAsync"] = execResolving("https://github.com/yowainwright/pastoralist\n") as any;

  const owner = await provider["getRepoOwner"]();
  assert.strictEqual(owner, "yowainwright");
});

test("getRepoName - handles URL without .git suffix", async () => {
  const provider = new GitHubSecurityProvider({ debug: false });

  provider["execFileAsync"] = execResolving("https://github.com/yowainwright/pastoralist\n") as any;

  const repo = await provider["getRepoName"]();
  assert.strictEqual(repo, "pastoralist");
});

test("isGhCliAvailable - returns true when gh CLI is available", async () => {
  const provider = new GitHubSecurityProvider(TEST_REPO_OPTIONS);

  provider["execFileAsync"] = execResolving("gh version 2.40.0\n") as any;

  const isAvailable = await provider["isGhCliAvailable"]();
  assert.strictEqual(isAvailable, true);
});

test("isGhCliAvailable - returns false when gh CLI is not available", async () => {
  const provider = new GitHubSecurityProvider(TEST_REPO_OPTIONS);

  provider["execFileAsync"] = execRejecting("command not found: gh") as any;

  const isAvailable = await provider["isGhCliAvailable"]();
  assert.strictEqual(isAvailable, false);
});

test("executeGhCli - returns stdout from gh CLI", async () => {
  const provider = new GitHubSecurityProvider(TEST_REPO_OPTIONS);

  const mockAlerts = [{ state: "open" }];
  const mockExecFileAsync = async () => {
    const stdout = JSON.stringify(mockAlerts);
    const mockExecFileAsyncResult = {
      stdout,
      stderr: "",
    };
    return mockExecFileAsyncResult;
  };

  provider["execFileAsync"] = mockExecFileAsync as any;

  const result = await provider["executeGhCli"]();
  assert.strictEqual(result, JSON.stringify(mockAlerts));
});

test("executeGhCli - uses correct API endpoint", async () => {
  const provider = new GitHubSecurityProvider({
    owner: "yowainwright",
    repo: "pastoralist",
    debug: false,
  });

  let capturedArgs: string[] = [];
  const mockExecFileAsync = async (cmd: string, args: string[]) => {
    capturedArgs = args;
    const result = { stdout: "[]", stderr: "" };
    return result;
  };

  provider["execFileAsync"] = mockExecFileAsync as any;

  await provider["executeGhCli"]();
  const capturedArgSet = new Set(capturedArgs);

  assert.ok(capturedArgSet.has("api"));
  assert.ok(capturedArgSet.has("repos/yowainwright/pastoralist/dependabot/alerts"));
  assert.ok(capturedArgSet.has("--paginate"));
});

const securityAdvisory2 = { summary: "Broken" };
test("convertToSecurityAlerts - skips alerts missing security_vulnerability", () => {
  const provider = new GitHubSecurityProvider({
    owner: "test",
    repo: "test",
    debug: false,
  });
  const alerts = [
    { state: "open", security_advisory: securityAdvisory2 },
    {
      state: "open",
      security_vulnerability: securityVulnerability3,
      security_advisory: securityAdvisory2,
    },
  ] as unknown as DependabotAlert[];

  const result = provider.convertToSecurityAlerts(alerts);

  assert.deepStrictEqual(result, []);
});
