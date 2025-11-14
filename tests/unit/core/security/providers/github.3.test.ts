import { test, expect } from "bun:test";
import { GitHubSecurityProvider } from "../../../../../src/core/security/providers/github";
import type { DependabotAlert } from "../../../../../src/core/security/types";

test("extractCurrentVersion - handles >= and <= range", () => {
  const provider = new GitHubSecurityProvider({
    owner: "test",
    repo: "test",
    debug: false,
  });

  const alert: DependabotAlert = {
    state: "open",
    security_vulnerability: {
      package: { name: "test" },
      vulnerable_version_range: ">= 1.0.0, <= 2.0.0",
      first_patched_version: { identifier: "2.0.1" },
      severity: "high",
    },
    security_advisory: {
      summary: "Test",
      description: "Test",
      cve_id: "CVE-2024-TEST",
    },
    html_url: "https://github.com/test/test/1",
  } as any;

  const result = (provider as any).extractCurrentVersion(alert);
  expect(result).toBe("1.0.0");
});

test("extractCurrentVersion - handles >= only range", () => {
  const provider = new GitHubSecurityProvider({
    owner: "test",
    repo: "test",
    debug: false,
  });

  const alert: DependabotAlert = {
    state: "open",
    security_vulnerability: {
      package: { name: "test" },
      vulnerable_version_range: ">= 3.5.0",
      first_patched_version: { identifier: "4.0.0" },
      severity: "medium",
    },
    security_advisory: {
      summary: "Test",
      description: "Test",
      cve_id: "CVE-2024-TEST",
    },
    html_url: "https://github.com/test/test/1",
  } as any;

  const result = (provider as any).extractCurrentVersion(alert);
  expect(result).toBe("3.5.0");
});

test("extractCurrentVersion - handles >= with single space", () => {
  const provider = new GitHubSecurityProvider({
    owner: "test",
    repo: "test",
    debug: false,
  });

  const alert: DependabotAlert = {
    state: "open",
    security_vulnerability: {
      package: { name: "test" },
      vulnerable_version_range: ">= 4.17.0",
      first_patched_version: { identifier: "4.17.21" },
      severity: "high",
    },
    security_advisory: {
      summary: "Test",
      description: "Test",
      cve_id: "CVE-2024-TEST",
    },
    html_url: "https://github.com/test/test/1",
  } as any;

  const result = (provider as any).extractCurrentVersion(alert);
  expect(result).toBe("4.17.0");
});

test("extractCurrentVersion - returns unknown for other formats", () => {
  const provider = new GitHubSecurityProvider({
    owner: "test",
    repo: "test",
    debug: false,
  });

  const alert: DependabotAlert = {
    state: "open",
    security_vulnerability: {
      package: { name: "test" },
      vulnerable_version_range: "< 2.0.0",
      first_patched_version: { identifier: "2.0.0" },
      severity: "low",
    },
    security_advisory: {
      summary: "Test",
      description: "Test",
      cve_id: "CVE-2024-TEST",
    },
    html_url: "https://github.com/test/test/1",
  } as any;

  const result = (provider as any).extractCurrentVersion(alert);
  expect(result).toBe("unknown");
});

test("extractCurrentVersion - handles complex range with >= and <=", () => {
  const provider = new GitHubSecurityProvider({
    owner: "test",
    repo: "test",
    debug: false,
  });

  const alert: DependabotAlert = {
    state: "open",
    security_vulnerability: {
      package: { name: "test" },
      vulnerable_version_range: ">= 1.2.3, <= 1.5.0",
      first_patched_version: { identifier: "1.5.1" },
      severity: "critical",
    },
    security_advisory: {
      summary: "Test",
      description: "Test",
      cve_id: "CVE-2024-TEST",
    },
    html_url: "https://github.com/test/test/1",
  } as any;

  const result = (provider as any).extractCurrentVersion(alert);
  expect(result).toBe("1.2.3");
});

test("extractCurrentVersion - handles empty vulnerable range", () => {
  const provider = new GitHubSecurityProvider({
    owner: "test",
    repo: "test",
    debug: false,
  });

  const alert: DependabotAlert = {
    state: "open",
    security_vulnerability: {
      package: { name: "test" },
      vulnerable_version_range: "",
      first_patched_version: { identifier: "1.0.0" },
      severity: "low",
    },
    security_advisory: {
      summary: "Test",
      description: "Test",
      cve_id: "CVE-2024-TEST",
    },
    html_url: "https://github.com/test/test/1",
  } as any;

  const result = (provider as any).extractCurrentVersion(alert);
  expect(result).toBe("unknown");
});

test("initialize - sets owner and repo when not provided", async () => {
  const provider = new GitHubSecurityProvider({
    owner: "explicit-owner",
    repo: "explicit-repo",
    debug: false,
  });

  await provider.initialize();

  expect(provider["owner"]).toBe("explicit-owner");
  expect(provider["repo"]).toBe("explicit-repo");
});

test("convertToSecurityAlerts - handles null CVE", () => {
  const provider = new GitHubSecurityProvider({
    owner: "test",
    repo: "test",
    debug: false,
  });

  const alerts = [
    {
      state: "open",
      security_vulnerability: {
        package: { name: "pkg" },
        vulnerable_version_range: "< 1.0.0",
        first_patched_version: { identifier: "1.0.0" },
        severity: "medium",
      },
      security_advisory: {
        summary: "Issue",
        description: "Description",
        cve_id: null,
      },
      html_url: "https://github.com/test/test/1",
    },
  ];

  const result = provider.convertToSecurityAlerts(alerts as any);

  expect(result.length).toBe(1);
  expect(result[0].cve).toBeNull();
});

test("convertToSecurityAlerts - extracts current version from range", () => {
  const provider = new GitHubSecurityProvider({
    owner: "test",
    repo: "test",
    debug: false,
  });

  const alerts = [
    {
      state: "open",
      security_vulnerability: {
        package: { name: "pkg" },
        vulnerable_version_range: ">= 4.17.0, <= 4.17.20",
        first_patched_version: { identifier: "4.17.21" },
        severity: "high",
      },
      security_advisory: {
        summary: "Vuln",
        description: "Desc",
        cve_id: "CVE-2024-1",
      },
      html_url: "https://github.com/test/test/1",
    },
  ];

  const result = provider.convertToSecurityAlerts(alerts as any);

  expect(result[0].currentVersion).toBe("4.17.0");
});
