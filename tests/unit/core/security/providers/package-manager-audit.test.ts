import { assertMatches, errorIncludes, mock, objectContaining, spyOn } from "../../../setup";
import { test, describe, afterEach } from "node:test";
import assert from "node:assert/strict";
import { PackageManagerAuditProvider } from "../../../../../src/providers";
import type { NpmAuditResult, YarnAuditLine } from "../../../../../src/types";

afterEach(() => {
  mock.restore();
});

test("providerType - should be 'npm'", () => {
  const provider = new PackageManagerAuditProvider();
  assert.strictEqual(provider.providerType, "npm");
});

test("construction - initializes with debug option", () => {
  const provider = new PackageManagerAuditProvider({ debug: true });
  assert.notStrictEqual(provider, undefined);
});

test("construction - initializes with strict option", () => {
  const provider = new PackageManagerAuditProvider({ strict: true });
  assert.strictEqual((provider as any).strict, true);
});

test("normalizeSeverity - maps 'moderate' to 'medium'", () => {
  const provider = new PackageManagerAuditProvider();
  assert.strictEqual((provider as any).normalizeSeverity("moderate"), "medium");
});

test("normalizeSeverity - maps 'critical' to 'critical'", () => {
  const provider = new PackageManagerAuditProvider();
  assert.strictEqual((provider as any).normalizeSeverity("critical"), "critical");
});

test("normalizeSeverity - maps 'high' to 'high'", () => {
  const provider = new PackageManagerAuditProvider();
  assert.strictEqual((provider as any).normalizeSeverity("high"), "high");
});

test("normalizeSeverity - maps unknown to 'medium'", () => {
  const provider = new PackageManagerAuditProvider();
  assert.strictEqual((provider as any).normalizeSeverity("unknown"), "medium");
});

test("normalizeSeverity - is case insensitive", () => {
  const provider = new PackageManagerAuditProvider();
  assert.strictEqual((provider as any).normalizeSeverity("CRITICAL"), "critical");
  assert.strictEqual((provider as any).normalizeSeverity("HIGH"), "high");
});

test("extractNpmPatchedVersion - returns version from object", () => {
  const provider = new PackageManagerAuditProvider();
  const fixAvailable = {
    name: "lodash",
    version: "4.17.21",
    isSemVerMajor: false,
  };
  assert.strictEqual((provider as any).extractNpmPatchedVersion(fixAvailable), "4.17.21");
});

test("extractNpmPatchedVersion - returns undefined for boolean true", () => {
  const provider = new PackageManagerAuditProvider();
  assert.strictEqual((provider as any).extractNpmPatchedVersion(true), undefined);
});

test("extractNpmPatchedVersion - returns undefined for boolean false", () => {
  const provider = new PackageManagerAuditProvider();
  assert.strictEqual((provider as any).extractNpmPatchedVersion(false), undefined);
});

test("extractNpmPatchedVersion - returns undefined for undefined", () => {
  const provider = new PackageManagerAuditProvider();
  assert.strictEqual((provider as any).extractNpmPatchedVersion(undefined), undefined);
});

test("extractYarnPatchedVersion - extracts version from >=range", () => {
  const provider = new PackageManagerAuditProvider();
  assert.strictEqual((provider as any).extractYarnPatchedVersion(">=4.17.21"), "4.17.21");
});

test("extractYarnPatchedVersion - extracts version with space", () => {
  const provider = new PackageManagerAuditProvider();
  assert.strictEqual((provider as any).extractYarnPatchedVersion(">= 2.0.0"), "2.0.0");
});

test("extractYarnPatchedVersion - returns undefined for no-fix sentinel", () => {
  const provider = new PackageManagerAuditProvider();
  assert.strictEqual((provider as any).extractYarnPatchedVersion("<0.0.0"), undefined);
});

test("extractYarnPatchedVersion - returns undefined for empty string", () => {
  const provider = new PackageManagerAuditProvider();
  assert.strictEqual((provider as any).extractYarnPatchedVersion(""), undefined);
});

test("extractYarnPatchedVersion - returns undefined for 'No fix available'", () => {
  const provider = new PackageManagerAuditProvider();
  assert.strictEqual((provider as any).extractYarnPatchedVersion("No fix available"), undefined);
});

test("parseNpmCompatibleOutput - returns empty array when no vulnerabilities key", () => {
  const provider = new PackageManagerAuditProvider();
  const result = (provider as any).parseNpmCompatibleOutput({});
  assert.deepStrictEqual(result, []);
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

  assert.strictEqual(alerts.length, 1);
  assert.strictEqual(alerts[0].packageName, "lodash");
  assert.strictEqual(alerts[0].severity, "high");
  assert.strictEqual(alerts[0].title, "Prototype Pollution in lodash");
  assert.strictEqual(alerts[0].patchedVersion, "4.17.21");
  assert.strictEqual(alerts[0].fixAvailable, true);
  assert.strictEqual(alerts[0].vulnerableVersions, ">=3.0.0 <4.17.21");
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
  assert.strictEqual(alerts.length, 0);
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
  assert.strictEqual(alerts[0].patchedVersion, undefined);
  assert.strictEqual(alerts[0].fixAvailable, false);
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
  assert.strictEqual(alerts[0].severity, "medium");
});

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

  assert.strictEqual(alerts.length, 1);
  assert.strictEqual(alerts[0].packageName, "lodash");
  assert.strictEqual(alerts[0].severity, "high");
  assert.ok(alerts[0].cves.includes("CVE-2021-23337"));
  assert.strictEqual(alerts[0].patchedVersion, "4.17.21");
});

test("parseYarnAuditOutput - skips auditSummary lines", () => {
  const provider = new PackageManagerAuditProvider();
  const summaryLine = JSON.stringify({
    type: "auditSummary",
    data: { vulnerabilities: { total: 1 } },
  });

  const alerts = (provider as any).parseYarnAuditOutput(summaryLine);
  assert.strictEqual(alerts.length, 0);
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

  assert.strictEqual(alerts.length, 2);
  assert.strictEqual(alerts[0].packageName, "pkg-a");
  assert.strictEqual(alerts[1].patchedVersion, undefined);
});

test("parseYarnAuditOutput - skips malformed JSON lines", () => {
  const provider = new PackageManagerAuditProvider();
  const stdout = "not-json\n" + JSON.stringify({ type: "auditSummary", data: {} });
  const alerts = (provider as any).parseYarnAuditOutput(stdout);
  assert.strictEqual(alerts.length, 0);
});

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
  assert.strictEqual(result[0].currentVersion, "4.17.20");
});

test("enrichWithVersions - keeps transitive alerts for unknown direct packages", () => {
  const provider = new PackageManagerAuditProvider();
  const alerts = [
    {
      packageName: "transitive-pkg",
      currentVersion: "",
      vulnerableVersions: "<1.0.0",
      severity: "low" as const,
      title: "Test",
      fixAvailable: false,
    },
  ];
  const packages = [{ name: "lodash", version: "4.17.20" }];

  const result = (provider as any).enrichWithVersions(alerts, packages);
  assert.strictEqual(result.length, 1);
  assert.strictEqual(result[0].packageName, "transitive-pkg");
  assert.strictEqual(result[0].currentVersion, "unknown");
});

test("fetchAlerts - returns empty array when packages is empty", async () => {
  const provider = new PackageManagerAuditProvider();
  const alerts = await provider.fetchAlerts([]);
  assert.deepStrictEqual(alerts, []);
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

  const alerts = await provider.fetchAlerts([{ name: "lodash", version: "4.17.20" }]);

  assert.strictEqual(alerts.length, 1);
  assert.strictEqual(alerts[0].packageName, "lodash");
  assert.strictEqual(alerts[0].currentVersion, "4.17.20");

  spy.mockRestore();
});

test("fetchAlerts - passes root to package-manager detection and audit cwd", async () => {
  const provider = new PackageManagerAuditProvider();
  let capturedRoot: string | undefined;
  const spy = spyOn(provider as any, "runAudit").mockImplementation(
    async (_pm: string, root: string) => {
      capturedRoot = root;
      return [];
    },
  );

  await provider.fetchAlerts([{ name: "lodash", version: "4.17.20" }], {
    root: "/repo/app",
  });

  assert.strictEqual(capturedRoot, "/repo/app");
  spy.mockRestore();
});

test("fetchAlerts - returns empty array on error when not strict", async () => {
  const provider = new PackageManagerAuditProvider({ strict: false });
  const spy = spyOn(provider as any, "runAudit").mockRejectedValue(new Error("command not found"));

  const alerts = await provider.fetchAlerts([{ name: "lodash", version: "4.17.20" }]);

  assert.deepStrictEqual(alerts, []);
  spy.mockRestore();
});

test("fetchAlerts - throws in strict mode on error", async () => {
  const provider = new PackageManagerAuditProvider({ strict: true });
  const spy = spyOn(provider as any, "runAudit").mockRejectedValue(new Error("command not found"));

  await assert.rejects(
    provider.fetchAlerts([{ name: "lodash", version: "4.17.20" }]),
    errorIncludes("Package manager audit failed"),
  );

  spy.mockRestore();
});

test("fetchAlerts - strict mode error includes reason", async () => {
  const provider = new PackageManagerAuditProvider({ strict: true });
  const spy = spyOn(provider as any, "runAudit").mockRejectedValue(
    new Error("ENOENT: bun not found"),
  );

  try {
    await provider.fetchAlerts([{ name: "pkg", version: "1.0.0" }]);
    assert.strictEqual(true, false);
  } catch (error) {
    const msg = (error as Error).message;
    assert.ok(msg.includes("ENOENT: bun not found"));
    assert.ok(msg.includes("--strict mode"));
  }

  spy.mockRestore();
});

const makeNpmResult = (pkgName: string): NpmAuditResult => ({
  vulnerabilities: {
    [pkgName]: {
      name: pkgName,
      severity: "high",
      via: [
        {
          source: 1,
          name: pkgName,
          dependency: pkgName,
          title: "Test vuln",
          url: "https://example.com",
          severity: "high",
          range: "<2.0.0",
        },
      ],
      range: "<2.0.0",
      fixAvailable: false,
    },
  },
});

const makeYarnLine = (pkgName: string): string =>
  JSON.stringify({
    type: "auditAdvisory",
    data: {
      resolution: { id: 1, path: pkgName, dev: false },
      advisory: {
        module_name: pkgName,
        severity: "high",
        title: "Test vuln",
        url: "https://example.com",
        vulnerable_versions: "<2.0.0",
        patched_versions: ">=2.0.0",
      },
    },
  } as YarnAuditLine);

type ExecAsync = (cmd: string, args: string[], opts: object) => Promise<{ stdout: string }>;

const withExec = (impl: ExecAsync) => {
  const provider = new PackageManagerAuditProvider();
  (provider as any).exec = impl;
  return provider;
};

describe("runAudit", () => {
  test("npm - returns parsed alerts from stdout", async () => {
    const provider = withExec(async () => ({
      stdout: JSON.stringify(makeNpmResult("lodash")),
    }));
    const result = await (provider as any).runAudit("npm");
    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0].packageName, "lodash");
  });

  test("npm - runs audit in provided root", async () => {
    let capturedOptions: object | undefined;
    const provider = withExec(async (_cmd, _args, opts) => {
      capturedOptions = opts;
      return { stdout: JSON.stringify({ vulnerabilities: {} }) };
    });

    await (provider as any).runAudit("npm", "/repo/app");

    assertMatches(capturedOptions, objectContaining({ cwd: "/repo/app" }));
  });

  test("npm - recovers stdout from non-zero exit error", async () => {
    const provider = withExec(async () => {
      throw Object.assign(new Error("exit 1"), {
        stdout: JSON.stringify(makeNpmResult("axios")),
      });
    });
    const result = await (provider as any).runAudit("npm");
    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0].packageName, "axios");
  });

  test("npm - rethrows error with no stdout", async () => {
    const provider = withExec(async () => {
      throw new Error("npm: command not found");
    });
    await assert.rejects(
      (provider as any).runAudit("npm"),
      errorIncludes("npm: command not found"),
    );
  });

  test("bun - uses bun command path", async () => {
    const provider = withExec(async () => ({
      stdout: JSON.stringify({ vulnerabilities: {} }),
    }));
    const result = await (provider as any).runAudit("bun");
    assert.deepStrictEqual(result, []);
  });

  test("pnpm - uses pnpm command path", async () => {
    const provider = withExec(async () => ({
      stdout: JSON.stringify({ vulnerabilities: {} }),
    }));
    const result = await (provider as any).runAudit("pnpm");
    assert.deepStrictEqual(result, []);
  });

  test("yarn - returns parsed alerts from stdout", async () => {
    const provider = withExec(async () => ({
      stdout: makeYarnLine("lodash"),
    }));
    const result = await (provider as any).runAudit("yarn");
    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0].packageName, "lodash");
  });

  test("yarn - recovers stdout from non-zero exit error", async () => {
    const provider = withExec(async () => {
      throw Object.assign(new Error("yarn audit exit 16"), {
        stdout: makeYarnLine("react"),
      });
    });
    const result = await (provider as any).runAudit("yarn");
    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0].packageName, "react");
  });

  test("yarn - rethrows error with no stdout", async () => {
    const provider = withExec(async () => {
      throw new Error("yarn: command not found");
    });
    await assert.rejects(
      (provider as any).runAudit("yarn"),
      errorIncludes("yarn: command not found"),
    );
  });
});
