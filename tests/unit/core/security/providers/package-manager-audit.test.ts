import { test, expect, mock, spyOn, afterEach } from "bun:test";
import { PackageManagerAuditProvider } from "../../../../../src/core/security/providers/package-manager-audit";
import type { NpmAuditResult, YarnAuditLine } from "../../../../../src/types";

afterEach(() => {
  mock.restore();
});

// =============================================================================
// construction
// =============================================================================

test("providerType - should be 'npm'", () => {
  const provider = new PackageManagerAuditProvider();
  expect(provider.providerType).toBe("npm");
});

test("construction - initializes with debug option", () => {
  const provider = new PackageManagerAuditProvider({ debug: true });
  expect(provider).toBeDefined();
});

test("construction - initializes with strict option", () => {
  const provider = new PackageManagerAuditProvider({ strict: true });
  expect((provider as any).strict).toBe(true);
});

// =============================================================================
// normalizeSeverity
// =============================================================================

test("normalizeSeverity - maps 'moderate' to 'medium'", () => {
  const provider = new PackageManagerAuditProvider();
  expect((provider as any).normalizeSeverity("moderate")).toBe("medium");
});

test("normalizeSeverity - maps 'critical' to 'critical'", () => {
  const provider = new PackageManagerAuditProvider();
  expect((provider as any).normalizeSeverity("critical")).toBe("critical");
});

test("normalizeSeverity - maps 'high' to 'high'", () => {
  const provider = new PackageManagerAuditProvider();
  expect((provider as any).normalizeSeverity("high")).toBe("high");
});

test("normalizeSeverity - maps unknown to 'medium'", () => {
  const provider = new PackageManagerAuditProvider();
  expect((provider as any).normalizeSeverity("unknown")).toBe("medium");
});

test("normalizeSeverity - is case insensitive", () => {
  const provider = new PackageManagerAuditProvider();
  expect((provider as any).normalizeSeverity("CRITICAL")).toBe("critical");
  expect((provider as any).normalizeSeverity("HIGH")).toBe("high");
});

// =============================================================================
// extractNpmPatchedVersion
// =============================================================================

test("extractNpmPatchedVersion - returns version from object", () => {
  const provider = new PackageManagerAuditProvider();
  const fixAvailable = {
    name: "lodash",
    version: "4.17.21",
    isSemVerMajor: false,
  };
  expect((provider as any).extractNpmPatchedVersion(fixAvailable)).toBe(
    "4.17.21",
  );
});

test("extractNpmPatchedVersion - returns undefined for boolean true", () => {
  const provider = new PackageManagerAuditProvider();
  expect((provider as any).extractNpmPatchedVersion(true)).toBeUndefined();
});

test("extractNpmPatchedVersion - returns undefined for boolean false", () => {
  const provider = new PackageManagerAuditProvider();
  expect((provider as any).extractNpmPatchedVersion(false)).toBeUndefined();
});

test("extractNpmPatchedVersion - returns undefined for undefined", () => {
  const provider = new PackageManagerAuditProvider();
  expect((provider as any).extractNpmPatchedVersion(undefined)).toBeUndefined();
});

// =============================================================================
// extractYarnPatchedVersion
// =============================================================================

test("extractYarnPatchedVersion - extracts version from >=range", () => {
  const provider = new PackageManagerAuditProvider();
  expect((provider as any).extractYarnPatchedVersion(">=4.17.21")).toBe(
    "4.17.21",
  );
});

test("extractYarnPatchedVersion - extracts version with space", () => {
  const provider = new PackageManagerAuditProvider();
  expect((provider as any).extractYarnPatchedVersion(">= 2.0.0")).toBe("2.0.0");
});

test("extractYarnPatchedVersion - returns undefined for no-fix sentinel", () => {
  const provider = new PackageManagerAuditProvider();
  expect((provider as any).extractYarnPatchedVersion("<0.0.0")).toBeUndefined();
});

test("extractYarnPatchedVersion - returns undefined for empty string", () => {
  const provider = new PackageManagerAuditProvider();
  expect((provider as any).extractYarnPatchedVersion("")).toBeUndefined();
});

test("extractYarnPatchedVersion - returns undefined for 'No fix available'", () => {
  const provider = new PackageManagerAuditProvider();
  expect(
    (provider as any).extractYarnPatchedVersion("No fix available"),
  ).toBeUndefined();
});

// =============================================================================
// parseNpmCompatibleOutput
// =============================================================================

test("parseNpmCompatibleOutput - returns empty array when no vulnerabilities key", () => {
  const provider = new PackageManagerAuditProvider();
  const result = (provider as any).parseNpmCompatibleOutput({});
  expect(result).toEqual([]);
});

test("parseNpmCompatibleOutput - converts npm v2 vulnerability to SecurityAlert", () => {
  const provider = new PackageManagerAuditProvider();
  const parsed: NpmAuditResult = {
    auditReportVersion: 2,
    vulnerabilities: {
      lodash: {
        name: "lodash",
        severity: "high",
        via: [
          {
            source: 1179,
            name: "lodash",
            dependency: "lodash",
            title: "Prototype Pollution in lodash",
            url: "https://github.com/advisories/GHSA-xxxx",
            severity: "high",
            range: ">=3.0.0 <4.17.21",
          },
        ],
        range: ">=3.0.0 <4.17.21",
        fixAvailable: {
          name: "lodash",
          version: "4.17.21",
          isSemVerMajor: false,
        },
      },
    },
  };

  const alerts = (provider as any).parseNpmCompatibleOutput(parsed);

  expect(alerts).toHaveLength(1);
  expect(alerts[0].packageName).toBe("lodash");
  expect(alerts[0].severity).toBe("high");
  expect(alerts[0].title).toBe("Prototype Pollution in lodash");
  expect(alerts[0].patchedVersion).toBe("4.17.21");
  expect(alerts[0].fixAvailable).toBe(true);
  expect(alerts[0].vulnerableVersions).toBe(">=3.0.0 <4.17.21");
});

test("parseNpmCompatibleOutput - skips string entries in via array", () => {
  const provider = new PackageManagerAuditProvider();
  const parsed: NpmAuditResult = {
    vulnerabilities: {
      "some-package": {
        name: "some-package",
        severity: "high",
        via: ["transitive-dep"],
        range: ">=1.0.0 <2.0.0",
        fixAvailable: false,
      },
    },
  };

  const alerts = (provider as any).parseNpmCompatibleOutput(parsed);
  expect(alerts).toHaveLength(0);
});

test("parseNpmCompatibleOutput - fixAvailable false yields no patchedVersion", () => {
  const provider = new PackageManagerAuditProvider();
  const parsed: NpmAuditResult = {
    vulnerabilities: {
      "vuln-pkg": {
        name: "vuln-pkg",
        severity: "critical",
        via: [
          {
            source: 999,
            name: "vuln-pkg",
            dependency: "vuln-pkg",
            title: "No fix",
            url: "https://example.com",
            severity: "critical",
            range: ">=0.0.0",
          },
        ],
        range: ">=0.0.0",
        fixAvailable: false,
      },
    },
  };

  const alerts = (provider as any).parseNpmCompatibleOutput(parsed);
  expect(alerts[0].patchedVersion).toBeUndefined();
  expect(alerts[0].fixAvailable).toBe(false);
});

test("parseNpmCompatibleOutput - maps moderate severity to medium", () => {
  const provider = new PackageManagerAuditProvider();
  const parsed: NpmAuditResult = {
    vulnerabilities: {
      "mod-pkg": {
        name: "mod-pkg",
        severity: "moderate",
        via: [
          {
            source: 100,
            name: "mod-pkg",
            dependency: "mod-pkg",
            title: "Moderate issue",
            url: "https://example.com",
            severity: "moderate",
            range: "<2.0.0",
          },
        ],
        range: "<2.0.0",
        fixAvailable: {
          name: "mod-pkg",
          version: "2.0.0",
          isSemVerMajor: false,
        },
      },
    },
  };

  const alerts = (provider as any).parseNpmCompatibleOutput(parsed);
  expect(alerts[0].severity).toBe("medium");
});

// =============================================================================
// parseYarnAuditOutput
// =============================================================================

test("parseYarnAuditOutput - parses advisory line", () => {
  const provider = new PackageManagerAuditProvider();
  const line: YarnAuditLine = {
    type: "auditAdvisory",
    data: {
      resolution: { id: 1, path: "lodash", dev: false },
      advisory: {
        module_name: "lodash",
        severity: "high",
        title: "Prototype Pollution",
        url: "https://npmjs.com/advisories/1179",
        cves: ["CVE-2021-23337"],
        vulnerable_versions: "<4.17.21",
        patched_versions: ">=4.17.21",
      },
    },
  };

  const alerts = (provider as any).parseYarnAuditOutput(JSON.stringify(line));

  expect(alerts).toHaveLength(1);
  expect(alerts[0].packageName).toBe("lodash");
  expect(alerts[0].severity).toBe("high");
  expect(alerts[0].cves).toContain("CVE-2021-23337");
  expect(alerts[0].patchedVersion).toBe("4.17.21");
});

test("parseYarnAuditOutput - skips auditSummary lines", () => {
  const provider = new PackageManagerAuditProvider();
  const summaryLine = JSON.stringify({
    type: "auditSummary",
    data: { vulnerabilities: { total: 1 } },
  });

  const alerts = (provider as any).parseYarnAuditOutput(summaryLine);
  expect(alerts).toHaveLength(0);
});

test("parseYarnAuditOutput - handles multiple lines", () => {
  const provider = new PackageManagerAuditProvider();
  const line1: YarnAuditLine = {
    type: "auditAdvisory",
    data: {
      advisory: {
        module_name: "pkg-a",
        severity: "critical",
        title: "Issue A",
        url: "https://example.com/a",
        vulnerable_versions: "<2.0.0",
        patched_versions: ">=2.0.0",
      },
    },
  };
  const line2: YarnAuditLine = {
    type: "auditAdvisory",
    data: {
      advisory: {
        module_name: "pkg-b",
        severity: "low",
        title: "Issue B",
        url: "https://example.com/b",
        vulnerable_versions: "<1.0.0",
        patched_versions: "<0.0.0",
      },
    },
  };

  const stdout = [JSON.stringify(line1), JSON.stringify(line2)].join("\n");
  const alerts = (provider as any).parseYarnAuditOutput(stdout);

  expect(alerts).toHaveLength(2);
  expect(alerts[0].packageName).toBe("pkg-a");
  expect(alerts[1].patchedVersion).toBeUndefined();
});

test("parseYarnAuditOutput - skips malformed JSON lines", () => {
  const provider = new PackageManagerAuditProvider();
  const stdout =
    "not-json\n" + JSON.stringify({ type: "auditSummary", data: {} });
  const alerts = (provider as any).parseYarnAuditOutput(stdout);
  expect(alerts).toHaveLength(0);
});

// =============================================================================
// enrichWithVersions
// =============================================================================

test("enrichWithVersions - fills currentVersion from packages map", () => {
  const provider = new PackageManagerAuditProvider();
  const alerts = [
    {
      packageName: "lodash",
      currentVersion: "",
      vulnerableVersions: "<4.17.21",
      severity: "high" as const,
      title: "Test",
      fixAvailable: true,
    },
  ];
  const packages = [{ name: "lodash", version: "4.17.20" }];

  const result = (provider as any).enrichWithVersions(alerts, packages);
  expect(result[0].currentVersion).toBe("4.17.20");
});

test("enrichWithVersions - filters alerts for unknown packages", () => {
  const provider = new PackageManagerAuditProvider();
  const alerts = [
    {
      packageName: "unknown-pkg",
      currentVersion: "",
      vulnerableVersions: "<1.0.0",
      severity: "low" as const,
      title: "Test",
      fixAvailable: false,
    },
  ];
  const packages = [{ name: "lodash", version: "4.17.20" }];

  const result = (provider as any).enrichWithVersions(alerts, packages);
  expect(result).toHaveLength(0);
});

// =============================================================================
// fetchAlerts
// =============================================================================

test("fetchAlerts - returns empty array when packages is empty", async () => {
  const provider = new PackageManagerAuditProvider();
  const alerts = await provider.fetchAlerts([]);
  expect(alerts).toEqual([]);
});

test("fetchAlerts - returns enriched alerts from runAudit", async () => {
  const provider = new PackageManagerAuditProvider();
  const spy = spyOn(provider as any, "runAudit").mockResolvedValue([
    {
      packageName: "lodash",
      currentVersion: "",
      vulnerableVersions: ">=3.0.0 <4.17.21",
      patchedVersion: "4.17.21",
      severity: "high" as const,
      title: "Prototype Pollution",
      url: "https://example.com",
      fixAvailable: true,
    },
  ]);

  const alerts = await provider.fetchAlerts([
    { name: "lodash", version: "4.17.20" },
  ]);

  expect(alerts).toHaveLength(1);
  expect(alerts[0].packageName).toBe("lodash");
  expect(alerts[0].currentVersion).toBe("4.17.20");

  spy.mockRestore();
});

test("fetchAlerts - returns empty array on error when not strict", async () => {
  const provider = new PackageManagerAuditProvider({ strict: false });
  const spy = spyOn(provider as any, "runAudit").mockRejectedValue(
    new Error("command not found"),
  );

  const alerts = await provider.fetchAlerts([
    { name: "lodash", version: "4.17.20" },
  ]);

  expect(alerts).toEqual([]);
  spy.mockRestore();
});

test("fetchAlerts - throws in strict mode on error", async () => {
  const provider = new PackageManagerAuditProvider({ strict: true });
  const spy = spyOn(provider as any, "runAudit").mockRejectedValue(
    new Error("command not found"),
  );

  await expect(
    provider.fetchAlerts([{ name: "lodash", version: "4.17.20" }]),
  ).rejects.toThrow("Package manager audit failed");

  spy.mockRestore();
});

test("fetchAlerts - strict mode error includes reason", async () => {
  const provider = new PackageManagerAuditProvider({ strict: true });
  const spy = spyOn(provider as any, "runAudit").mockRejectedValue(
    new Error("ENOENT: bun not found"),
  );

  try {
    await provider.fetchAlerts([{ name: "pkg", version: "1.0.0" }]);
    expect(true).toBe(false);
  } catch (error) {
    const msg = (error as Error).message;
    expect(msg).toContain("ENOENT: bun not found");
    expect(msg).toContain("--strict mode");
  }

  spy.mockRestore();
});
