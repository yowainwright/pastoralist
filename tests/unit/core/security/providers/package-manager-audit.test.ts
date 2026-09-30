import { assertMatches, errorIncludes, mock, objectContaining, spyOn } from "../../../setup";
import { test, describe, afterEach } from "node:test";
import assert from "node:assert/strict";
import { PackageManagerAuditProvider } from "../../../../../src/providers";
import type { NpmAuditResult, SecurityAlert, YarnAuditLine } from "../../../../../src/types";

type NpmAuditFixture = {
  name: string;
  severity: string;
  source: number;
  title: string;
  url: string;
  range: string;
  fixAvailable: unknown;
};

const createNpmAuditResult = (fixture: NpmAuditFixture) => {
  const { name, severity, source, title, url, range, fixAvailable } = fixture;
  const advisory = { source, name, dependency: name, title, url, severity, range };
  const via = [advisory];
  const vulnerability = { name, severity, via, range, fixAvailable };
  const vulnerabilities = Object.fromEntries([[name, vulnerability]]);
  const result = { vulnerabilities } as NpmAuditResult;
  return result;
};

const createYarnLine = (data: object) => {
  const line = { type: "auditAdvisory", data } as YarnAuditLine;
  return line;
};

const rawStdout = (stdout: string) => ({ stdout });

const stdoutOf = (value: unknown) => rawStdout(JSON.stringify(value));

const MKDIRP_MAJOR_FIX = { name: "mkdirp", version: "1.0.4", isSemVerMajor: true };
const LODASH_FIX = { name: "lodash", version: "4.17.21", isSemVerMajor: false };
const MOD_PKG_FIX = { name: "mod-pkg", version: "2.0.0", isSemVerMajor: false };

const MINIMIST_PARENT_FIX_RESULT = createNpmAuditResult({
  name: "minimist",
  severity: "high",
  source: 1,
  title: "Prototype Pollution",
  url: "https://example.com",
  range: "<1.2.6",
  fixAvailable: MKDIRP_MAJOR_FIX,
});

const LODASH_NPM_RESULT = Object.assign(
  { auditReportVersion: 2 },
  createNpmAuditResult({
    name: "lodash",
    severity: "high",
    source: 1179,
    title: "Prototype Pollution in lodash",
    url: "https://github.com/advisories/GHSA-xxxx",
    range: ">=3.0.0 <4.17.21",
    fixAvailable: LODASH_FIX,
  }),
);

const NO_FIX_NPM_RESULT = createNpmAuditResult({
  name: "vuln-pkg",
  severity: "critical",
  source: 999,
  title: "No fix",
  url: "https://example.com",
  range: ">=0.0.0",
  fixAvailable: false,
});

const MODERATE_NPM_RESULT = createNpmAuditResult({
  name: "mod-pkg",
  severity: "moderate",
  source: 100,
  title: "Moderate issue",
  url: "https://example.com",
  range: "<2.0.0",
  fixAvailable: MOD_PKG_FIX,
});

const BROKEN_VULNERABILITY = {
  name: "broken",
  severity: "high",
  range: "<1.0.0",
  fixAvailable: false,
};
const BROKEN_VULNERABILITIES = { broken: BROKEN_VULNERABILITY };
const MISSING_VIA_RESULT = { vulnerabilities: BROKEN_VULNERABILITIES };

const TRANSITIVE_VIA = ["transitive-dep"];
const STRING_VIA_VULNERABILITY = {
  name: "some-package",
  severity: "high",
  via: TRANSITIVE_VIA,
  range: ">=1.0.0 <2.0.0",
  fixAvailable: false,
};
const STRING_VIA_VULNERABILITIES = { "some-package": STRING_VIA_VULNERABILITY };
const STRING_VIA_RESULT: NpmAuditResult = { vulnerabilities: STRING_VIA_VULNERABILITIES };

const EMPTY_VULNERABILITIES = {};
const EMPTY_NPM_RESULT = { vulnerabilities: EMPTY_VULNERABILITIES };

const LODASH_RESOLUTION = { id: 1, path: "lodash", dev: false };
const LODASH_CVES = ["CVE-2021-23337"];
const LODASH_YARN_ADVISORY = {
  module_name: "lodash",
  severity: "high",
  title: "Prototype Pollution",
  url: "https://npmjs.com/advisories/1179",
  cves: LODASH_CVES,
  vulnerable_versions: "<4.17.21",
  patched_versions: ">=4.17.21",
};
const LODASH_YARN_DATA = { resolution: LODASH_RESOLUTION, advisory: LODASH_YARN_ADVISORY };

const PKG_A_ADVISORY = {
  module_name: "pkg-a",
  severity: "critical",
  title: "Issue A",
  url: "https://example.com/a",
  vulnerable_versions: "<2.0.0",
  patched_versions: ">=2.0.0",
};
const PKG_B_ADVISORY = {
  module_name: "pkg-b",
  severity: "low",
  title: "Issue B",
  url: "https://example.com/b",
  vulnerable_versions: "<1.0.0",
  patched_versions: "<0.0.0",
};
const PKG_A_DATA = { advisory: PKG_A_ADVISORY };
const PKG_B_DATA = { advisory: PKG_B_ADVISORY };

const SUMMARY_TOTALS = { total: 1 };
const SUMMARY_DATA = { vulnerabilities: SUMMARY_TOTALS };
const SUMMARY_LINE = { type: "auditSummary", data: SUMMARY_DATA };
const EMPTY_DATA = {};
const EMPTY_SUMMARY_LINE = { type: "auditSummary", data: EMPTY_DATA };

const LODASH_PENDING_ALERTS: SecurityAlert[] = [
  {
    packageName: "lodash",
    currentVersion: "",
    vulnerableVersions: "<4.17.21",
    severity: "high",
    title: "Test",
    fixAvailable: true,
  },
];

const TRANSITIVE_PENDING_ALERTS: SecurityAlert[] = [
  {
    packageName: "transitive-pkg",
    currentVersion: "",
    vulnerableVersions: "<1.0.0",
    severity: "low",
    title: "Test",
    fixAvailable: false,
  },
];

const LODASH_AUDIT_ALERTS: SecurityAlert[] = [
  {
    packageName: "lodash",
    currentVersion: "",
    vulnerableVersions: ">=3.0.0 <4.17.21",
    patchedVersion: "4.17.21",
    severity: "high",
    title: "Prototype Pollution",
    url: "https://example.com",
    fixAvailable: true,
  },
];

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
  assert.strictEqual((provider as any).extractNpmPatchedVersion(fixAvailable, "lodash"), "4.17.21");
});

test("extractNpmPatchedVersion - ignores fix for a different package", () => {
  const provider = new PackageManagerAuditProvider();
  const fixAvailable = {
    name: "parent-pkg",
    version: "9.0.0",
    isSemVerMajor: true,
  };
  assert.strictEqual((provider as any).extractNpmPatchedVersion(fixAvailable, "lodash"), undefined);
});

test("parseNpmCompatibleOutput - does not use parent fix version as patched version", () => {
  const provider = new PackageManagerAuditProvider();
  const alerts = (provider as any).parseNpmCompatibleOutput(MINIMIST_PARENT_FIX_RESULT);
  assert.strictEqual(alerts[0].patchedVersion, undefined);
  assert.strictEqual(alerts[0].fixAvailable, false);
});

test("parseNpmCompatibleOutput - tolerates missing via", () => {
  const provider = new PackageManagerAuditProvider();
  assert.deepStrictEqual((provider as any).parseNpmCompatibleOutput(MISSING_VIA_RESULT), []);
});

const EMPTY_VIA: unknown[] = [];
const MISSING_RANGE_VULNERABILITY = { name: "no-range", severity: "high", via: EMPTY_VIA };
const MISSING_SEVERITY_VULNERABILITY = { name: "no-severity", range: "<1.0.0", via: EMPTY_VIA };
const STRING_VIA_FIELD_VULNERABILITY = {
  name: "string-via",
  severity: "high",
  range: "<1.0.0",
  via: "lodash",
};
const MALFORMED_VULNERABILITIES = {
  broken: BROKEN_VULNERABILITY,
  "no-range": MISSING_RANGE_VULNERABILITY,
  "no-severity": MISSING_SEVERITY_VULNERABILITY,
  "string-via": STRING_VIA_FIELD_VULNERABILITY,
};
const MALFORMED_AUDIT_OUTPUT = JSON.stringify({ vulnerabilities: MALFORMED_VULNERABILITIES });

test("parseNpmAuditJson - drops entries missing range, severity, or array via", () => {
  const provider = new PackageManagerAuditProvider();
  const parsed = (provider as any).parseNpmAuditJson(MALFORMED_AUDIT_OUTPUT);
  assert.deepStrictEqual(Object.keys(parsed.vulnerabilities), ["broken"]);
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
  const alerts = (provider as any).parseNpmCompatibleOutput(LODASH_NPM_RESULT);

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
  const alerts = (provider as any).parseNpmCompatibleOutput(STRING_VIA_RESULT);
  assert.strictEqual(alerts.length, 0);
});

test("parseNpmCompatibleOutput - fixAvailable false yields no patchedVersion", () => {
  const provider = new PackageManagerAuditProvider();
  const alerts = (provider as any).parseNpmCompatibleOutput(NO_FIX_NPM_RESULT);
  assert.strictEqual(alerts[0].patchedVersion, undefined);
  assert.strictEqual(alerts[0].fixAvailable, false);
});

test("parseNpmCompatibleOutput - maps moderate severity to medium", () => {
  const provider = new PackageManagerAuditProvider();
  const alerts = (provider as any).parseNpmCompatibleOutput(MODERATE_NPM_RESULT);
  assert.strictEqual(alerts[0].severity, "medium");
});

test("parseYarnAuditOutput - parses advisory line", () => {
  const provider = new PackageManagerAuditProvider();
  const line = createYarnLine(LODASH_YARN_DATA);

  const alerts = (provider as any).parseYarnAuditOutput(JSON.stringify(line));

  assert.strictEqual(alerts.length, 1);
  assert.strictEqual(alerts[0].packageName, "lodash");
  assert.strictEqual(alerts[0].severity, "high");
  assert.ok(alerts[0].cves.includes("CVE-2021-23337"));
  assert.strictEqual(alerts[0].patchedVersion, "4.17.21");
});

test("parseYarnAuditOutput - skips auditSummary lines", () => {
  const provider = new PackageManagerAuditProvider();
  const summaryLine = JSON.stringify(SUMMARY_LINE);

  const alerts = (provider as any).parseYarnAuditOutput(summaryLine);
  assert.strictEqual(alerts.length, 0);
});

test("parseYarnAuditOutput - handles multiple lines", () => {
  const provider = new PackageManagerAuditProvider();
  const line1 = createYarnLine(PKG_A_DATA);
  const line2 = createYarnLine(PKG_B_DATA);

  const stdout = [JSON.stringify(line1), JSON.stringify(line2)].join("\n");
  const alerts = (provider as any).parseYarnAuditOutput(stdout);

  assert.strictEqual(alerts.length, 2);
  assert.strictEqual(alerts[0].packageName, "pkg-a");
  assert.strictEqual(alerts[1].patchedVersion, undefined);
});

test("parseYarnAuditOutput - skips malformed JSON lines", () => {
  const provider = new PackageManagerAuditProvider();
  const stdout = "not-json\n" + JSON.stringify(EMPTY_SUMMARY_LINE);
  const alerts = (provider as any).parseYarnAuditOutput(stdout);
  assert.strictEqual(alerts.length, 0);
});

test("enrichWithVersions - fills currentVersion from packages map", () => {
  const provider = new PackageManagerAuditProvider();
  const packages = [{ name: "lodash", version: "4.17.20" }];

  const result = (provider as any).enrichWithVersions(LODASH_PENDING_ALERTS, packages);
  assert.strictEqual(result[0].currentVersion, "4.17.20");
});

test("enrichWithVersions - keeps transitive alerts for unknown direct packages", () => {
  const provider = new PackageManagerAuditProvider();
  const packages = [{ name: "lodash", version: "4.17.20" }];

  const result = (provider as any).enrichWithVersions(TRANSITIVE_PENDING_ALERTS, packages);
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
  const spy = spyOn(provider as any, "runAudit").mockResolvedValue(LODASH_AUDIT_ALERTS);

  const alerts = await provider.fetchAlerts([{ name: "lodash", version: "4.17.20" }]);

  assert.strictEqual(alerts.length, 1);
  assert.strictEqual(alerts[0].packageName, "lodash");
  assert.strictEqual(alerts[0].currentVersion, "4.17.20");

  spy.mockRestore();
});

test("fetchAlerts - passes root to package-manager detection and audit cwd", async () => {
  const provider = new PackageManagerAuditProvider();
  const noAlerts: SecurityAlert[] = [];
  const spy = spyOn(provider as any, "runAudit").mockResolvedValue(noAlerts);

  await provider.fetchAlerts([{ name: "lodash", version: "4.17.20" }], {
    root: "/repo/app",
  });

  assert.strictEqual(spy.mock.calls[0].arguments[1], "/repo/app");
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

  await assert.rejects(
    () => provider.fetchAlerts([{ name: "pkg", version: "1.0.0" }]),
    /Reason: ENOENT: bun not found\. Failing due to --strict mode\./,
  );

  spy.mockRestore();
});

const makeNpmResult = (pkgName: string) =>
  createNpmAuditResult({
    name: pkgName,
    severity: "high",
    source: 1,
    title: "Test vuln",
    url: "https://example.com",
    range: "<2.0.0",
    fixAvailable: false,
  });

const makeYarnLine = (pkgName: string): string => {
  const resolution = { id: 1, path: pkgName, dev: false };
  const advisory = {
    module_name: pkgName,
    severity: "high",
    title: "Test vuln",
    url: "https://example.com",
    vulnerable_versions: "<2.0.0",
    patched_versions: ">=2.0.0",
  };
  const serialized = JSON.stringify(createYarnLine({ resolution, advisory }));
  return serialized;
};

type ExecAsync = (cmd: string, args: string[], opts: object) => Promise<{ stdout: string }>;

const withExec = (impl: ExecAsync) => {
  const provider = new PackageManagerAuditProvider();
  (provider as any).exec = impl;
  return provider;
};

const registerRunAuditTestsPart1 = () => {
  test("npm - returns parsed alerts from stdout", async () => {
    const provider = withExec(async () => stdoutOf(makeNpmResult("lodash")));
    const result = await (provider as any).runAudit("npm");
    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0].packageName, "lodash");
  });

  test("npm - runs audit in provided root", async () => {
    const exec = mock(async (_cmd: string, _args: string[], _opts: object) =>
      stdoutOf(EMPTY_NPM_RESULT),
    );
    const provider = withExec(exec);

    await (provider as any).runAudit("npm", "/repo/app");

    assertMatches(exec.mock.calls[0].arguments[2], objectContaining({ cwd: "/repo/app" }));
  });
};

const registerRunAuditTestsPart2 = () => {
  test("npm - recovers stdout from non-zero exit error", async () => {
    const provider = withExec(async () => {
      const failure = Object.assign(new Error("exit 1"), stdoutOf(makeNpmResult("axios")));
      throw failure;
    });
    const result = await (provider as any).runAudit("npm");
    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0].packageName, "axios");
  });
};

const registerRunAuditTestsPart3 = () => {
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
    const provider = withExec(async () => stdoutOf(EMPTY_NPM_RESULT));
    const result = await (provider as any).runAudit("bun");
    assert.deepStrictEqual(result, []);
  });
};

const registerRunAuditTestsPart4 = () => {
  test("pnpm - uses pnpm command path", async () => {
    const provider = withExec(async () => stdoutOf(EMPTY_NPM_RESULT));
    const result = await (provider as any).runAudit("pnpm");
    assert.deepStrictEqual(result, []);
  });

  test("yarn - returns parsed alerts from stdout", async () => {
    const provider = withExec(async () => rawStdout(makeYarnLine("lodash")));
    const result = await (provider as any).runAudit("yarn");
    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0].packageName, "lodash");
  });
};

const registerRunAuditTestsPart5 = () => {
  test("yarn - recovers stdout from non-zero exit error", async () => {
    const provider = withExec(async () => {
      const failure = Object.assign(
        new Error("yarn audit exit 16"),
        rawStdout(makeYarnLine("react")),
      );
      throw failure;
    });
    const result = await (provider as any).runAudit("yarn");
    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0].packageName, "react");
  });
};

const registerRunAuditTestsPart6 = () => {
  test("yarn - rethrows error with no stdout", async () => {
    const provider = withExec(async () => {
      throw new Error("yarn: command not found");
    });
    await assert.rejects(
      (provider as any).runAudit("yarn"),
      errorIncludes("yarn: command not found"),
    );
  });
};

const registerRunAuditTests = () => {
  registerRunAuditTestsPart1();
  registerRunAuditTestsPart2();
  registerRunAuditTestsPart3();
  registerRunAuditTestsPart4();
  registerRunAuditTestsPart5();
  registerRunAuditTestsPart6();
};

describe("runAudit", registerRunAuditTests);
