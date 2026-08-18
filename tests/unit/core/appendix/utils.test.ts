import { anyValue, assertHasProperty, assertLacksProperty, assertMatches } from "../../setup";
import { test } from "node:test";
import assert from "node:assert/strict";
import type { SecurityOverrideDetail, Appendix, AppendixItem } from "../../../../src/types";
import {
  mergeOverrideReasons,
  createSecurityLedger,
  buildAppendixItem,
  toCompactAppendix,
  findUnusedAppendixEntries,
  removeAppendixKeys,
  extractPackageNames,
  removeOverrideKeys,
  normalizeLedgerCveField,
  isKeptEntry,
  isKeepExpired,
  buildDependentInfo,
  parseOverridePackageName,
  hasDependenciesMatchingOverrides,
} from "../../../../src/core/appendix/utils";

test("mergeOverrideReasons - should return reason when provided", () => {
  const result = mergeOverrideReasons("lodash", "security fix", undefined, undefined);

  assert.strictEqual(result, "security fix");
});

test("mergeOverrideReasons - should return security reason when no reason provided", () => {
  const securityDetails: SecurityOverrideDetail[] = [
    {
      packageName: "lodash",
      reason: "CVE-2021-23337",
      cves: ["CVE-2021-23337"],
      severity: "high",
    },
  ];

  const result = mergeOverrideReasons("lodash", undefined, securityDetails, undefined);

  assert.strictEqual(result, "CVE-2021-23337");
});

test("mergeOverrideReasons - should return manual reason when no reason or security details", () => {
  const manualReasons = { lodash: "manual override" };

  const result = mergeOverrideReasons("lodash", undefined, undefined, manualReasons);

  assert.strictEqual(result, "manual override");
});

test("mergeOverrideReasons - preserves a structured per-dependency reason", () => {
  const reason = {
    type: "project" as const,
    summary: "Pinned for runtime compatibility",
    pin: "4.17.21",
    constraints: ["Node 20"],
  };

  const result = mergeOverrideReasons("lodash", undefined, undefined, { lodash: reason });

  assert.deepStrictEqual(result, reason);
});

test("mergeOverrideReasons - should return undefined when no reasons provided", () => {
  const result = mergeOverrideReasons("lodash", undefined, undefined, undefined);

  assert.strictEqual(result, undefined);
});

test("mergeOverrideReasons - should prioritize reason over security details", () => {
  const securityDetails: SecurityOverrideDetail[] = [
    {
      packageName: "lodash",
      reason: "CVE-2021-23337",
      cves: ["CVE-2021-23337"],
      severity: "high",
    },
  ];

  const result = mergeOverrideReasons("lodash", "manual fix", securityDetails, undefined);

  assert.strictEqual(result, "manual fix");
});

test("mergeOverrideReasons - should prioritize security details over manual reasons", () => {
  const securityDetails: SecurityOverrideDetail[] = [
    {
      packageName: "lodash",
      reason: "CVE-2021-23337",
      cves: ["CVE-2021-23337"],
      severity: "high",
    },
  ];
  const manualReasons = { lodash: "manual override" };

  const result = mergeOverrideReasons("lodash", undefined, securityDetails, manualReasons);

  assert.strictEqual(result, "CVE-2021-23337");
});

test("createSecurityLedger - should return empty object when no security details", () => {
  const result = createSecurityLedger("lodash", undefined, undefined);

  assert.deepStrictEqual(result, {});
});

test("createSecurityLedger - should return empty object when package not in security details", () => {
  const securityDetails: SecurityOverrideDetail[] = [
    {
      packageName: "axios",
      reason: "CVE-2021-1234",
      cves: ["CVE-2021-1234"],
      severity: "high",
    },
  ];

  const result = createSecurityLedger("lodash", securityDetails, undefined);

  assert.deepStrictEqual(result, {});
});

test("createSecurityLedger - should create basic security ledger", () => {
  const securityDetails: SecurityOverrideDetail[] = [
    {
      packageName: "lodash",
      reason: "CVE-2021-23337",
      cves: ["CVE-2021-23337"],
      severity: "high",
    },
  ];

  const result = createSecurityLedger("lodash", securityDetails, undefined);

  assertHasProperty(result, "securityChecked", true);
  assertHasProperty(result, "securityCheckDate");
});

test("createSecurityLedger - should include provider in ledger", () => {
  const securityDetails: SecurityOverrideDetail[] = [
    {
      packageName: "lodash",
      reason: "CVE-2021-23337",
      cves: ["CVE-2021-23337"],
      severity: "high",
    },
  ];

  const result = createSecurityLedger("lodash", securityDetails, "github");

  assertHasProperty(result, "securityProvider", "github");
});

test("createSecurityLedger - should include CVE in ledger", () => {
  const securityDetails: SecurityOverrideDetail[] = [
    {
      packageName: "lodash",
      reason: "CVE-2021-23337",
      cves: ["CVE-2021-23337"],
      severity: "high",
    },
  ];

  const result = createSecurityLedger("lodash", securityDetails, undefined);

  assertHasProperty(result, "cves", ["CVE-2021-23337"]);
});

test("createSecurityLedger - should include severity in ledger", () => {
  const securityDetails: SecurityOverrideDetail[] = [
    {
      packageName: "lodash",
      reason: "CVE-2021-23337",
      cves: ["CVE-2021-23337"],
      severity: "high",
    },
  ];

  const result = createSecurityLedger("lodash", securityDetails, undefined);

  assertHasProperty(result, "severity", "high");
});

test("createSecurityLedger - should include URL in ledger", () => {
  const securityDetails: SecurityOverrideDetail[] = [
    {
      packageName: "lodash",
      reason: "CVE-2021-23337",
      cves: ["CVE-2021-23337"],
      severity: "high",
      url: "https://nvd.nist.gov/vuln/detail/CVE-2021-23337",
    },
  ];

  const result = createSecurityLedger("lodash", securityDetails, undefined);

  assertHasProperty(result, "url", "https://nvd.nist.gov/vuln/detail/CVE-2021-23337");
});

test("createSecurityLedger - should include all fields when provided", () => {
  const securityDetails: SecurityOverrideDetail[] = [
    {
      packageName: "lodash",
      reason: "CVE-2021-23337",
      cves: ["CVE-2021-23337"],
      severity: "high",
      description: "Prototype pollution",
      url: "https://nvd.nist.gov/vuln/detail/CVE-2021-23337",
    },
  ];

  const result = createSecurityLedger("lodash", securityDetails, "github");

  assertMatches(result, {
    source: "security",
    securityChecked: true,
    securityCheckDate: anyValue(String),
    securityProvider: "github",
    cves: ["CVE-2021-23337"],
    cveDetails: [{ cve: "CVE-2021-23337", severity: "high" }],
    severity: "high",
    url: "https://nvd.nist.gov/vuln/detail/CVE-2021-23337",
  });
});

test("createSecurityLedger - should mark single-source security details as possible", () => {
  const securityDetails: SecurityOverrideDetail[] = [
    {
      packageName: "lodash",
      reason: "CVE-2021-23337",
      sources: ["osv"],
    },
  ];

  const result = createSecurityLedger("lodash", securityDetails, undefined);

  assertHasProperty(result, "confidence", "possible");
});

test("createSecurityLedger - should mark multi-source security details as confirmed", () => {
  const securityDetails: SecurityOverrideDetail[] = [
    {
      packageName: "lodash",
      reason: "CVE-2021-23337",
      sources: ["osv", "github"],
    },
  ];

  const result = createSecurityLedger("lodash", securityDetails, undefined);

  assertHasProperty(result, "confidence", "confirmed");
});

test("toCompactAppendix - should compact simple entries", () => {
  const appendix: Appendix = {
    "lodash@4.17.21": {
      dependents: { "my-app": "^4.17.0" },
      ledger: { addedDate: "2024-01-15" },
    },
  };

  const result = toCompactAppendix(appendix);

  assert.deepStrictEqual(result["lodash@4.17.21"], { addedDate: "2024-01-15" });
});

test("toCompactAppendix - should preserve entries with security info", () => {
  const appendix: Appendix = {
    "lodash@4.17.21": {
      dependents: { "my-app": "^4.17.0" },
      ledger: {
        addedDate: "2024-01-15",
        securityChecked: true,
        cves: ["CVE-2021-23337"],
      },
    },
  };

  const result = toCompactAppendix(appendix);

  assertHasProperty(result["lodash@4.17.21"], "ledger");
  assertHasProperty(result["lodash@4.17.21"], "dependents");
});

test("toCompactAppendix - should preserve entries with patches", () => {
  const appendix: Appendix = {
    "lodash@4.17.21": {
      dependents: { "my-app": "^4.17.0" },
      patches: ["patches/lodash+4.17.21.patch"],
      ledger: { addedDate: "2024-01-15" },
    },
  };

  const result = toCompactAppendix(appendix);

  assertHasProperty(result["lodash@4.17.21"], "patches");
});

test("toCompactAppendix - preserves entries with a reason", () => {
  const reason = {
    type: "project" as const,
    summary: "Pinned for compatibility",
    pin: "4.17.21",
  };
  const appendix: Appendix = {
    "lodash@4.17.21": {
      dependents: { "my-app": "^4.17.0" },
      ledger: { addedDate: "2024-01-01", reason },
    },
  };

  assert.deepStrictEqual(toCompactAppendix(appendix)["lodash@4.17.21"], appendix["lodash@4.17.21"]);
});

test("toCompactAppendix - should generate date if missing", () => {
  const appendix: Appendix = {
    "lodash@4.17.21": {
      dependents: { "my-app": "^4.17.0" },
    },
  };

  const result = toCompactAppendix(appendix);

  assertHasProperty(result["lodash@4.17.21"], "addedDate");
  assert.strictEqual(typeof result["lodash@4.17.21"].addedDate, "string");
});

test("toCompactAppendix - should use provided addedDate when ledger is missing", () => {
  const appendix: Appendix = {
    "lodash@4.17.21": {
      dependents: { "my-app": "^4.17.0" },
    },
  };
  const gitDate = "2023-03-15T12:00:00+00:00";

  const result = toCompactAppendix(appendix, gitDate);

  assert.strictEqual(result["lodash@4.17.21"].addedDate, gitDate);
});

test("toCompactAppendix - should prefer existing ledger addedDate over provided date", () => {
  const appendix: Appendix = {
    "lodash@4.17.21": {
      dependents: { "my-app": "^4.17.0" },
      ledger: { addedDate: "2024-01-15" },
    },
  };
  const gitDate = "2023-03-15T12:00:00+00:00";

  const result = toCompactAppendix(appendix, gitDate);

  assert.strictEqual(result["lodash@4.17.21"].addedDate, "2024-01-15");
});

test("buildAppendixItem - should use provided addedDate for new ledger", () => {
  const gitDate = "2023-06-01T10:00:00+00:00";

  const result = buildAppendixItem(
    { "my-app": "lodash@^4.17.0" },
    undefined,
    "security fix",
    {},
    gitDate,
  );

  assert.strictEqual(result.ledger?.addedDate, gitDate);
  assert.strictEqual(result.ledger?.reason, "security fix");
});

test("buildAppendixItem - writes a structured reason without moving CVEs into it", () => {
  const reason = {
    type: "best-case" as const,
    summary: "Selected as part of the lowest-risk dependency portfolio",
    decisionId: "best-case-abc123",
    policyHash: "def456",
    search: { evaluatedStates: 8, provenOptimal: true },
    impact: {
      fixedVulnerabilities: 2,
      introducedVulnerabilities: 0,
      remainingVulnerabilities: 0,
    },
  };

  const result = buildAppendixItem(
    { "my-app": "lodash@^4.17.0" },
    undefined,
    reason,
    { cves: ["CVE-2024-0001"] },
    "2024-01-01",
  );

  assert.deepStrictEqual(result.ledger?.reason, reason);
  assert.deepStrictEqual(result.ledger?.cves, ["CVE-2024-0001"]);
  assertLacksProperty(result.ledger?.reason, "cves");
});

test("buildAppendixItem - should fallback to current date when no addedDate provided", () => {
  const before = new Date().toISOString();

  const result = buildAppendixItem({ "my-app": "lodash@^4.17.0" }, undefined, undefined, {});

  const after = new Date().toISOString();
  const addedDate = result.ledger?.addedDate || "";
  const isInRange = addedDate >= before && addedDate <= after;
  assert.strictEqual(isInRange, true);
});

test("buildAppendixItem - should preserve existing ledger over provided addedDate", () => {
  const existingLedger = {
    addedDate: "2022-01-01T00:00:00.000Z",
    reason: "old reason",
  };
  const gitDate = "2023-06-01T10:00:00+00:00";

  const result = buildAppendixItem(
    { "my-app": "lodash@^4.17.0" },
    existingLedger,
    "new reason",
    {},
    gitDate,
  );

  assert.strictEqual(result.ledger?.addedDate, "2022-01-01T00:00:00.000Z");
  assert.strictEqual(result.ledger?.reason, "old reason");
});

test("findUnusedAppendixEntries - should find entries where all dependents are unused", () => {
  const appendix: Appendix = {
    "lodash@4.17.21": {
      dependents: { root: "lodash (unused override)" },
    },
    "axios@1.0.0": {
      dependents: { root: "axios@^1.0.0" },
    },
  };

  const result = findUnusedAppendixEntries(appendix);

  assert.deepStrictEqual(result, ["lodash@4.17.21"]);
});

test("findUnusedAppendixEntries - should return empty when no unused entries", () => {
  const appendix: Appendix = {
    "lodash@4.17.21": {
      dependents: { root: "lodash@^4.17.0" },
    },
  };

  const result = findUnusedAppendixEntries(appendix);

  assert.deepStrictEqual(result, []);
});

test("findUnusedAppendixEntries - should handle multiple dependents all unused", () => {
  const appendix: Appendix = {
    "lodash@4.17.21": {
      dependents: {
        "pkg-a": "lodash (unused override)",
        "pkg-b": "lodash (unused override)",
      },
    },
  };

  const result = findUnusedAppendixEntries(appendix);

  assert.deepStrictEqual(result, ["lodash@4.17.21"]);
});

test("findUnusedAppendixEntries - should not flag mixed dependents", () => {
  const appendix: Appendix = {
    "lodash@4.17.21": {
      dependents: {
        "pkg-a": "lodash (unused override)",
        "pkg-b": "lodash@^4.17.0",
      },
    },
  };

  const result = findUnusedAppendixEntries(appendix);

  assert.deepStrictEqual(result, []);
});

test("removeAppendixKeys - should remove specified keys", () => {
  const appendix: Appendix = {
    "lodash@4.17.21": { dependents: { root: "lodash (unused override)" } },
    "axios@1.0.0": { dependents: { root: "axios@^1.0.0" } },
  };

  const result = removeAppendixKeys(appendix, ["lodash@4.17.21"]);

  assert.strictEqual(result["lodash@4.17.21"], undefined);
  assert.notStrictEqual(result["axios@1.0.0"], undefined);
});

test("extractPackageNames - should extract names from appendix keys", () => {
  const result = extractPackageNames(["lodash@4.17.21", "axios@1.0.0"]);

  assert.deepStrictEqual(result, ["lodash", "axios"]);
});

test("extractPackageNames - should handle scoped packages", () => {
  const result = extractPackageNames(["@babel/core@7.20.0", "@scope/pkg@1.0.0"]);

  assert.deepStrictEqual(result, ["@babel/core", "@scope/pkg"]);
});

test("extractPackageNames - should handle mixed scoped and unscoped", () => {
  const result = extractPackageNames(["lodash@4.17.21", "@babel/core@7.20.0", "axios@1.0.0"]);

  assert.deepStrictEqual(result, ["lodash", "@babel/core", "axios"]);
});

test("removeOverrideKeys - should remove specified package names", () => {
  const overrides = { lodash: "4.17.21", axios: "1.0.0", react: "18.2.0" };

  const result = removeOverrideKeys(overrides, ["lodash"]);

  assert.deepStrictEqual(result, { axios: "1.0.0", react: "18.2.0" });
});

test("normalizeLedgerCveField - converts legacy cve string to cves array", () => {
  const ledger = {
    addedDate: "2024-01-01",
    cve: "CVE-2021-23337",
  } as NonNullable<AppendixItem["ledger"]> & { cve?: string };
  const result = normalizeLedgerCveField(ledger as NonNullable<AppendixItem["ledger"]>);
  assert.deepStrictEqual(result.cves, ["CVE-2021-23337"]);
  assert.strictEqual((result as { cve?: string }).cve, undefined);
});

test("normalizeLedgerCveField - merges legacy cve into existing cves", () => {
  const ledger = {
    addedDate: "2024-01-01",
    cves: ["CVE-2021-0001"],
    cve: "CVE-2021-0002",
  } as NonNullable<AppendixItem["ledger"]> & { cve?: string };
  const result = normalizeLedgerCveField(ledger as NonNullable<AppendixItem["ledger"]>);
  assert.deepStrictEqual(result.cves, ["CVE-2021-0001", "CVE-2021-0002"]);
});

test("normalizeLedgerCveField - returns ledger unchanged when no cve field", () => {
  const ledger: NonNullable<AppendixItem["ledger"]> = {
    addedDate: "2024-01-01",
    cves: ["CVE-2021-23337"],
  };
  const result = normalizeLedgerCveField(ledger);
  assert.deepStrictEqual(result, ledger);
});

test("normalizeLedgerCveField - deduplicates when cve is already in cves", () => {
  const ledger = {
    addedDate: "2024-01-01",
    cves: ["CVE-2021-23337"],
    cve: "CVE-2021-23337",
  } as NonNullable<AppendixItem["ledger"]> & { cve?: string };
  const result = normalizeLedgerCveField(ledger as NonNullable<AppendixItem["ledger"]>);
  assert.deepStrictEqual(result.cves, ["CVE-2021-23337"]);
});

test("createSecurityLedger - aggregates cves from multiple details for same package", () => {
  const securityDetails: SecurityOverrideDetail[] = [
    { packageName: "lodash", reason: "vuln 1", cves: ["CVE-2021-0001"] },
    { packageName: "lodash", reason: "vuln 2", cves: ["CVE-2021-0002"] },
  ];
  const result = createSecurityLedger("lodash", securityDetails, undefined);
  assert.deepStrictEqual(result.cves, ["CVE-2021-0001", "CVE-2021-0002"]);
});

test("createSecurityLedger - deduplicates cves across multiple details", () => {
  const securityDetails: SecurityOverrideDetail[] = [
    { packageName: "lodash", reason: "vuln 1", cves: ["CVE-2021-0001"] },
    {
      packageName: "lodash",
      reason: "vuln 2",
      cves: ["CVE-2021-0001", "CVE-2021-0002"],
    },
  ];
  const result = createSecurityLedger("lodash", securityDetails, undefined);
  assert.deepStrictEqual(result.cves, ["CVE-2021-0001", "CVE-2021-0002"]);
});

test("createSecurityLedger - deduplicates cveDetails when multiple details share the same CVE", () => {
  const securityDetails: SecurityOverrideDetail[] = [
    {
      packageName: "lodash",
      reason: "vuln 1",
      cves: ["CVE-2021-0001"],
      severity: "high",
    },
    {
      packageName: "lodash",
      reason: "vuln 2",
      cves: ["CVE-2021-0001", "CVE-2021-0002"],
      severity: "medium",
    },
  ];
  const result = createSecurityLedger("lodash", securityDetails, undefined);
  const cveIds = result.cveDetails?.map((d) => d.cve);
  assert.deepStrictEqual(cveIds, ["CVE-2021-0001", "CVE-2021-0002"]);
  assert.strictEqual(result.cveDetails?.filter((d) => d.cve === "CVE-2021-0001").length, 1);
});

test("isUnusedEntry via findUnusedAppendixEntries - skips entries with keep: true", () => {
  const appendix: Appendix = {
    "lodash@4.17.21": {
      dependents: { root: "lodash (unused override)" },
      ledger: { addedDate: "2024-01-01", keep: true },
    },
    "axios@1.0.0": {
      dependents: { root: "axios (unused override)" },
    },
  };

  const result = findUnusedAppendixEntries(appendix);

  assert.ok(!result.includes("lodash@4.17.21"));
  assert.ok(result.includes("axios@1.0.0"));
});

test("toCompactAppendix - preserves full ledger for kept entries", () => {
  const appendix: Appendix = {
    "lodash@4.17.21": {
      dependents: { root: "root@1.0.0" },
      ledger: { addedDate: "2024-01-01", keep: true, cves: ["CVE-2021-23337"] },
    },
  };

  const result = toCompactAppendix(appendix);

  assertHasProperty(result["lodash@4.17.21"], "ledger");
  assert.strictEqual((result["lodash@4.17.21"] as AppendixItem).ledger?.keep, true);
});

test("isKeptEntry - returns true for keep: true", () => {
  const item: AppendixItem = {
    ledger: { addedDate: "2024-01-01", keep: true },
  };
  assert.strictEqual(isKeptEntry(item), true);
});

test("isKeptEntry - returns true for KeepConstraint object", () => {
  const item: AppendixItem = {
    ledger: { addedDate: "2024-01-01", keep: { reason: "pending review" } },
  };
  assert.strictEqual(isKeptEntry(item), true);
});

test("isKeptEntry - returns false when keep is absent", () => {
  const item: AppendixItem = { ledger: { addedDate: "2024-01-01" } };
  assert.strictEqual(isKeptEntry(item), false);
});

test("isKeptEntry - returns false when no ledger", () => {
  const item: AppendixItem = { dependents: {} };
  assert.strictEqual(isKeptEntry(item), false);
});

test("isKeepExpired - returns false for keep: true (no expiry possible)", () => {
  const item: AppendixItem = {
    ledger: { addedDate: "2024-01-01", keep: true },
  };
  assert.strictEqual(isKeepExpired(item, "lodash", {}), false);
});

test("isKeepExpired - returns false when no keep", () => {
  const item: AppendixItem = { ledger: { addedDate: "2024-01-01" } };
  assert.strictEqual(isKeepExpired(item, "lodash", {}), false);
});

test("isKeepExpired - returns true when until date is in the past", () => {
  const item: AppendixItem = {
    ledger: {
      addedDate: "2024-01-01",
      keep: { reason: "temp", until: "2020-01-01" },
    },
  };
  assert.strictEqual(isKeepExpired(item, "lodash", {}), true);
});

test("isKeepExpired - returns false when until date is in the future", () => {
  const item: AppendixItem = {
    ledger: {
      addedDate: "2024-01-01",
      keep: { reason: "temp", until: "2099-01-01" },
    },
  };
  assert.strictEqual(isKeepExpired(item, "lodash", {}), false);
});

test("isKeepExpired - returns true when dep version meets untilVersion", () => {
  const item: AppendixItem = {
    ledger: {
      addedDate: "2024-01-01",
      keep: { reason: "patch pending", untilVersion: "4.18.0" },
    },
  };
  const rootDeps = { lodash: "^4.18.0" };
  assert.strictEqual(isKeepExpired(item, "lodash", rootDeps), true);
});

test("isKeepExpired - returns false when dep version is below untilVersion", () => {
  const item: AppendixItem = {
    ledger: {
      addedDate: "2024-01-01",
      keep: { reason: "patch pending", untilVersion: "4.18.0" },
    },
  };
  const rootDeps = { lodash: "^4.17.21" };
  assert.strictEqual(isKeepExpired(item, "lodash", rootDeps), false);
});

test("isKeepExpired - returns false when dep is missing from rootDeps", () => {
  const item: AppendixItem = {
    ledger: {
      addedDate: "2024-01-01",
      keep: { reason: "patch pending", untilVersion: "4.18.0" },
    },
  };
  assert.strictEqual(isKeepExpired(item, "lodash", {}), false);
});

test("findUnusedAppendixEntries - skips entries with KeepConstraint object", () => {
  const appendix: Appendix = {
    "lodash@4.17.21": {
      dependents: { root: "lodash (unused override)" },
      ledger: {
        addedDate: "2024-01-01",
        keep: { reason: "awaiting upstream fix" },
      },
    },
  };

  const result = findUnusedAppendixEntries(appendix);
  assert.ok(!result.includes("lodash@4.17.21"));
});

test("findUnusedAppendixEntries - includes expired KeepConstraint entries", () => {
  const appendix: Appendix = {
    "lodash@4.17.21": {
      dependents: { root: "lodash (unused override)" },
      ledger: {
        addedDate: "2024-01-01",
        keep: { reason: "expired keep", until: "2020-01-01" },
      },
    },
  };

  const result = findUnusedAppendixEntries(appendix);
  assert.ok(result.includes("lodash@4.17.21"));
});

test("findUnusedAppendixEntries - includes version-expired KeepConstraint entries", () => {
  const appendix: Appendix = {
    "lodash@4.17.21": {
      dependents: { root: "lodash (unused override)" },
      ledger: {
        addedDate: "2024-01-01",
        keep: { reason: "version-bounded keep", untilVersion: "4.18.0" },
      },
    },
  };

  const result = findUnusedAppendixEntries(appendix, { lodash: "^4.18.0" });
  assert.ok(result.includes("lodash@4.17.21"));
});

test("toCompactAppendix - preserves full ledger for KeepConstraint entries", () => {
  const appendix: Appendix = {
    "lodash@4.17.21": {
      dependents: { root: "root@1.0.0" },
      ledger: {
        addedDate: "2024-01-01",
        keep: { reason: "awaiting upstream fix", untilVersion: "4.18.0" },
      },
    },
  };

  const result = toCompactAppendix(appendix);
  assertHasProperty(result["lodash@4.17.21"], "ledger");
});

test("parseOverridePackageName - resolves pnpm selector and nested override keys to the real package name", () => {
  assert.strictEqual(parseOverridePackageName("minimatch"), "minimatch");
  assert.strictEqual(parseOverridePackageName("minimatch@<4"), "minimatch");
  assert.strictEqual(parseOverridePackageName("minimatch@>=9 <10"), "minimatch");
  assert.strictEqual(parseOverridePackageName("path-to-regexp@>=6 <7"), "path-to-regexp");
  assert.strictEqual(parseOverridePackageName("uuid@<11.1.1"), "uuid");
  assert.strictEqual(parseOverridePackageName("@scope/pkg@>=1 <2"), "@scope/pkg");
  assert.strictEqual(parseOverridePackageName("@protobufjs/utf8"), "@protobufjs/utf8");
  assert.strictEqual(parseOverridePackageName("gray-matter>js-yaml"), "js-yaml");
  assert.strictEqual(parseOverridePackageName("foo@1>@scope/bar@<2"), "@scope/bar");
});

test("buildDependentInfo - resolves selector-range key to real name for graph lookup", () => {
  const info = buildDependentInfo(false, "minimatch@>=9 <10", undefined, undefined, {
    minimatch: ["glob", "rimraf"],
  });
  assert.ok(info.includes("required by"));
  assert.ok(!info.includes("unused override"));
});

test("buildDependentInfo - resolves selector-range key to real name for tree lookup", () => {
  const info = buildDependentInfo(
    false,
    "minimatch@<4",
    undefined,
    { minimatch: "3.1.5" },
    undefined,
  );
  assert.ok(info.includes("transitive dependency"));
  assert.ok(!info.includes("unused override"));
});

test("buildDependentInfo - resolves nested parent>child key to the child name", () => {
  const info = buildDependentInfo(
    false,
    "gray-matter>js-yaml",
    undefined,
    { "js-yaml": "3.14.2" },
    undefined,
  );
  assert.ok(!info.includes("unused override"));
});

test("buildDependentInfo - still flags a genuinely unused selector override", () => {
  const info = buildDependentInfo(false, "minimatch@<4", undefined, {}, {});
  assert.ok(info.includes("unused override"));
});

test("hasDependenciesMatchingOverrides - matches bare dep name against selector-range override key", () => {
  assert.strictEqual(hasDependenciesMatchingOverrides(["minimatch"], ["minimatch@<4"]), true);
});

test("hasDependenciesMatchingOverrides - matches bare dep name against nested parent>child override key", () => {
  assert.strictEqual(hasDependenciesMatchingOverrides(["js-yaml"], ["gray-matter>js-yaml"]), true);
});

test("hasDependenciesMatchingOverrides - matches bare dep name against scoped selector-range override key", () => {
  assert.strictEqual(hasDependenciesMatchingOverrides(["@scope/pkg"], ["@scope/pkg@>=1 <2"]), true);
});

test("hasDependenciesMatchingOverrides - returns false when dep is genuinely absent", () => {
  assert.strictEqual(hasDependenciesMatchingOverrides(["express"], ["minimatch@<4"]), false);
});
