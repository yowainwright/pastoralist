import {
  carryExistingLedgers,
  dropSupersededUnusedDependents,
  findTopLevelDependents,
  hasOverrides,
  mergeAppendixDependents,
  mergeDependenciesForPackage,
  shouldWriteAppendix,
} from "../../../../src/core/appendix/utils";
import type { OverridesType, PastoralistJSON } from "../../../../src/types";

import assert from "node:assert/strict";
import { test } from "node:test";
import {
  buildAppendixItem,
  buildDependentInfo,
  createSecurityLedger,
  extractPackageNames,
  findUnusedAppendixEntries,
  hasDependenciesMatchingOverrides,
  isKeepExpired,
  isKeptEntry,
  isNestedOverride,
  mergeOverrideReasons,
  normalizeLedgerCveField,
  parseOverridePackageName,
  removeAppendixKeys,
  removeOverrideKeys,
  toCompactAppendix,
} from "../../../../src/core/appendix/utils";
import type { Appendix, AppendixItem, SecurityOverrideDetail } from "../../../../src/types";
import { anyValue, assertHasProperty, assertLacksProperty, assertMatches } from "../../setup";

test("mergeOverrideReasons - should return reason when provided", () => {
  const result = mergeOverrideReasons("lodash", "security fix", undefined, undefined);

  assert.strictEqual(result, "security fix");
});

const cves = ["CVE-2021-23337"];
test("mergeOverrideReasons - should return security reason when no reason provided", () => {
  const securityDetails: SecurityOverrideDetail[] = [
    {
      packageName: "lodash",
      reason: "CVE-2021-23337",
      cves,
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

const typeValue = "project" as const;
const constraints = ["Node 20"];
test("mergeOverrideReasons - preserves a structured per-dependency reason", () => {
  const reason = {
    type: typeValue,
    summary: "Pinned for runtime compatibility",
    pin: "4.17.21",
    constraints,
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
      cves,
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
      cves,
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

const securityDetailsCves = ["CVE-2021-1234"];
test("createSecurityLedger - should return empty object when package not in security details", () => {
  const securityDetails: SecurityOverrideDetail[] = [
    {
      packageName: "axios",
      reason: "CVE-2021-1234",
      cves: securityDetailsCves,
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
      cves,
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
      cves,
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
      cves,
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
      cves,
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
      cves,
      severity: "high",
      url: "https://nvd.nist.gov/vuln/detail/CVE-2021-23337",
    },
  ];

  const result = createSecurityLedger("lodash", securityDetails, undefined);

  assertHasProperty(result, "url", "https://nvd.nist.gov/vuln/detail/CVE-2021-23337");
});

const securityCheckDate = anyValue(String);
const cveDetails = [{ cve: "CVE-2021-23337", severity: "high" }];
const COMPLETE_LODASH_SECURITY_DETAIL: SecurityOverrideDetail = {
  packageName: "lodash",
  reason: "CVE-2021-23337",
  cves,
  severity: "high",
  description: "Prototype pollution",
  url: "https://nvd.nist.gov/vuln/detail/CVE-2021-23337",
};
const COMPLETE_LODASH_LEDGER = {
  source: "security",
  securityChecked: true,
  securityCheckDate,
  securityProvider: "github",
  cves,
  cveDetails,
  severity: "high",
  url: "https://nvd.nist.gov/vuln/detail/CVE-2021-23337",
};
test("createSecurityLedger - should include all fields when provided", () => {
  const securityDetails: SecurityOverrideDetail[] = [
    Object.assign({}, COMPLETE_LODASH_SECURITY_DETAIL),
  ];

  const result = createSecurityLedger("lodash", securityDetails, "github");

  assertMatches(result, COMPLETE_LODASH_LEDGER);
});

const sources = ["osv"];
test("createSecurityLedger - should mark single-source security details as possible", () => {
  const securityDetails: SecurityOverrideDetail[] = [
    {
      packageName: "lodash",
      reason: "CVE-2021-23337",
      sources,
    },
  ];

  const result = createSecurityLedger("lodash", securityDetails, undefined);

  assertHasProperty(result, "confidence", "possible");
});

const securityDetailsSources = ["osv", "github"];
test("createSecurityLedger - should mark multi-source security details as confirmed", () => {
  const securityDetails: SecurityOverrideDetail[] = [
    {
      packageName: "lodash",
      reason: "CVE-2021-23337",
      sources: securityDetailsSources,
    },
  ];

  const result = createSecurityLedger("lodash", securityDetails, undefined);

  assertHasProperty(result, "confidence", "confirmed");
});

const lodashEntryDependents = { "my-app": "^4.17.0" };
const lodashEntryLedger = { addedDate: "2024-01-15" };
const lodashEntry = {
  dependents: lodashEntryDependents,
  ledger: lodashEntryLedger,
};
test("toCompactAppendix - should compact simple entries", () => {
  const appendix: Appendix = {
    "lodash@4.17.21": lodashEntry,
  };

  const result = toCompactAppendix(appendix);

  assert.deepStrictEqual(result["lodash@4.17.21"], { addedDate: "2024-01-15" });
});

const appendixLodashEntryLedger = {
  addedDate: "2024-01-15",
  securityChecked: true,
  cves,
};
const appendixLodashEntry = {
  dependents: lodashEntryDependents,
  ledger: appendixLodashEntryLedger,
};
test("toCompactAppendix - should preserve entries with security info", () => {
  const appendix: Appendix = {
    "lodash@4.17.21": appendixLodashEntry,
  };

  const result = toCompactAppendix(appendix);

  assertHasProperty(result["lodash@4.17.21"], "ledger");
  assertHasProperty(result["lodash@4.17.21"], "dependents");
});

const patches = ["patches/lodash+4.17.21.patch"];
const lodashEntry2 = {
  dependents: lodashEntryDependents,
  patches,
  ledger: lodashEntryLedger,
};
test("toCompactAppendix - should preserve entries with patches", () => {
  const appendix: Appendix = {
    "lodash@4.17.21": lodashEntry2,
  };

  const result = toCompactAppendix(appendix);

  assertHasProperty(result["lodash@4.17.21"], "patches");
});

test("toCompactAppendix - preserves entries with a reason", () => {
  const reason = {
    type: typeValue,
    summary: "Pinned for compatibility",
    pin: "4.17.21",
  };
  const ledger = { addedDate: "2024-01-01", reason };
  const lodashEntry3 = {
    dependents: lodashEntryDependents,
    ledger,
  };
  const appendix: Appendix = {
    "lodash@4.17.21": lodashEntry3,
  };

  assert.deepStrictEqual(toCompactAppendix(appendix)["lodash@4.17.21"], appendix["lodash@4.17.21"]);
});

const lodashEntry4 = {
  dependents: lodashEntryDependents,
};
test("toCompactAppendix - should generate date if missing", () => {
  const appendix: Appendix = {
    "lodash@4.17.21": lodashEntry4,
  };

  const result = toCompactAppendix(appendix);

  assertHasProperty(result["lodash@4.17.21"], "addedDate");
  assert.strictEqual(typeof result["lodash@4.17.21"].addedDate, "string");
});

test("toCompactAppendix - should use provided addedDate when ledger is missing", () => {
  const appendix: Appendix = {
    "lodash@4.17.21": lodashEntry4,
  };
  const gitDate = "2023-03-15T12:00:00+00:00";

  const result = toCompactAppendix(appendix, gitDate);

  assert.strictEqual(result["lodash@4.17.21"].addedDate, gitDate);
});

test("toCompactAppendix - should prefer existing ledger addedDate over provided date", () => {
  const appendix: Appendix = {
    "lodash@4.17.21": lodashEntry,
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

const reasonTypeValue = "best-case" as const;
const search = { evaluatedStates: 8, provenOptimal: true };
const impact = {
  fixedVulnerabilities: 2,
  introducedVulnerabilities: 0,
  remainingVulnerabilities: 0,
};
const buildAppendixItemCves = ["CVE-2024-0001"];
test("buildAppendixItem - writes a structured reason without moving CVEs into it", () => {
  const reason = {
    type: reasonTypeValue,
    summary: "Selected as part of the lowest-risk dependency portfolio",
    decisionId: "best-case-abc123",
    policyHash: "def456",
    search,
    impact,
  };

  const result = buildAppendixItem(
    { "my-app": "lodash@^4.17.0" },
    undefined,
    reason,
    { cves: buildAppendixItemCves },
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

const lodashEntry5Dependents = { root: "lodash (unused override)" };
const lodashEntry5 = {
  dependents: lodashEntry5Dependents,
};
const axiosEntryDependents = { root: "axios@^1.0.0" };
const axiosEntry = {
  dependents: axiosEntryDependents,
};
test("findUnusedAppendixEntries - should find entries where all dependents are unused", () => {
  const appendix: Appendix = {
    "lodash@4.17.21": lodashEntry5,
    "axios@1.0.0": axiosEntry,
  };

  const result = findUnusedAppendixEntries(appendix);

  assert.deepStrictEqual(result, ["lodash@4.17.21"]);
});

const lodashEntry6Dependents = { root: "lodash@^4.17.0" };
const lodashEntry6 = {
  dependents: lodashEntry6Dependents,
};
test("findUnusedAppendixEntries - should return empty when no unused entries", () => {
  const appendix: Appendix = {
    "lodash@4.17.21": lodashEntry6,
  };

  const result = findUnusedAppendixEntries(appendix);

  assert.deepStrictEqual(result, []);
});

const lodashEntry7Dependents = {
  "pkg-a": "lodash (unused override)",
  "pkg-b": "lodash (unused override)",
};
const lodashEntry7 = {
  dependents: lodashEntry7Dependents,
};
test("findUnusedAppendixEntries - should handle multiple dependents all unused", () => {
  const appendix: Appendix = {
    "lodash@4.17.21": lodashEntry7,
  };

  const result = findUnusedAppendixEntries(appendix);

  assert.deepStrictEqual(result, ["lodash@4.17.21"]);
});

const lodashEntry8Dependents = {
  "pkg-a": "lodash (unused override)",
  "pkg-b": "lodash@^4.17.0",
};
const lodashEntry8 = {
  dependents: lodashEntry8Dependents,
};
test("findUnusedAppendixEntries - should not flag mixed dependents", () => {
  const appendix: Appendix = {
    "lodash@4.17.21": lodashEntry8,
  };

  const result = findUnusedAppendixEntries(appendix);

  assert.deepStrictEqual(result, []);
});

const lodashEntry9 = { dependents: lodashEntry5Dependents };
const appendixAxiosEntry = { dependents: axiosEntryDependents };
test("removeAppendixKeys - should remove specified keys", () => {
  const appendix: Appendix = {
    "lodash@4.17.21": lodashEntry9,
    "axios@1.0.0": appendixAxiosEntry,
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

const ledgerCves = ["CVE-2021-0001"];
test("normalizeLedgerCveField - merges legacy cve into existing cves", () => {
  const ledger = {
    addedDate: "2024-01-01",
    cves: ledgerCves,
    cve: "CVE-2021-0002",
  } as NonNullable<AppendixItem["ledger"]> & { cve?: string };
  const result = normalizeLedgerCveField(ledger as NonNullable<AppendixItem["ledger"]>);
  assert.deepStrictEqual(result.cves, ["CVE-2021-0001", "CVE-2021-0002"]);
});

test("normalizeLedgerCveField - returns ledger unchanged when no cve field", () => {
  const ledger: NonNullable<AppendixItem["ledger"]> = {
    addedDate: "2024-01-01",
    cves,
  };
  const result = normalizeLedgerCveField(ledger);
  assert.deepStrictEqual(result, ledger);
});

test("normalizeLedgerCveField - deduplicates when cve is already in cves", () => {
  const ledger = {
    addedDate: "2024-01-01",
    cves,
    cve: "CVE-2021-23337",
  } as NonNullable<AppendixItem["ledger"]> & { cve?: string };
  const result = normalizeLedgerCveField(ledger as NonNullable<AppendixItem["ledger"]>);
  assert.deepStrictEqual(result.cves, ["CVE-2021-23337"]);
});

const cves2 = ["CVE-2021-0002"];
test("createSecurityLedger - aggregates cves from multiple details for same package", () => {
  const securityDetails: SecurityOverrideDetail[] = [
    { packageName: "lodash", reason: "vuln 1", cves: ledgerCves },
    { packageName: "lodash", reason: "vuln 2", cves: cves2 },
  ];
  const result = createSecurityLedger("lodash", securityDetails, undefined);
  assert.deepStrictEqual(result.cves, ["CVE-2021-0001", "CVE-2021-0002"]);
});

const cves3 = ["CVE-2021-0001", "CVE-2021-0002"];
test("createSecurityLedger - deduplicates cves across multiple details", () => {
  const securityDetails: SecurityOverrideDetail[] = [
    { packageName: "lodash", reason: "vuln 1", cves: ledgerCves },
    {
      packageName: "lodash",
      reason: "vuln 2",
      cves: cves3,
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
      cves: ledgerCves,
      severity: "high",
    },
    {
      packageName: "lodash",
      reason: "vuln 2",
      cves: cves3,
      severity: "medium",
    },
  ];
  const result = createSecurityLedger("lodash", securityDetails, undefined);
  const cveIds = result.cveDetails?.map((d) => d.cve);
  assert.deepStrictEqual(cveIds, ["CVE-2021-0001", "CVE-2021-0002"]);
  assert.strictEqual(result.cveDetails?.filter((d) => d.cve === "CVE-2021-0001").length, 1);
});

const lodashEntry10Ledger = { addedDate: "2024-01-01", keep: true };
const lodashEntry10 = {
  dependents: lodashEntry5Dependents,
  ledger: lodashEntry10Ledger,
};
const axiosEntry2Dependents = { root: "axios (unused override)" };
const axiosEntry2 = {
  dependents: axiosEntry2Dependents,
};
test("isUnusedEntry via findUnusedAppendixEntries - skips entries with keep: true", () => {
  const appendix: Appendix = {
    "lodash@4.17.21": lodashEntry10,
    "axios@1.0.0": axiosEntry2,
  };

  const result = new Set(findUnusedAppendixEntries(appendix));

  assert.ok(!result.has("lodash@4.17.21"));
  assert.ok(result.has("axios@1.0.0"));
});

const lodashEntry11Dependents = { root: "root@1.0.0" };
const lodashEntry11Ledger = { addedDate: "2024-01-01", keep: true, cves };
const lodashEntry11 = {
  dependents: lodashEntry11Dependents,
  ledger: lodashEntry11Ledger,
};
test("toCompactAppendix - preserves full ledger for kept entries", () => {
  const appendix: Appendix = {
    "lodash@4.17.21": lodashEntry11,
  };

  const result = toCompactAppendix(appendix);

  assertHasProperty(result["lodash@4.17.21"], "ledger");
  assert.strictEqual((result["lodash@4.17.21"] as AppendixItem).ledger?.keep, true);
});

const itemLedger = { addedDate: "2024-01-01", keep: true };
test("isKeptEntry - returns true for keep: true", () => {
  const item: AppendixItem = {
    ledger: itemLedger,
  };
  assert.strictEqual(isKeptEntry(item), true);
});

const keep = { reason: "pending review" };
const ledger2 = { addedDate: "2024-01-01", keep };
test("isKeptEntry - returns true for KeepConstraint object", () => {
  const item: AppendixItem = {
    ledger: ledger2,
  };
  assert.strictEqual(isKeptEntry(item), true);
});

const ledger3 = { addedDate: "2024-01-01" };
test("isKeptEntry - returns false when keep is absent", () => {
  const item: AppendixItem = { ledger: ledger3 };
  assert.strictEqual(isKeptEntry(item), false);
});

const dependents = {};
test("isKeptEntry - returns false when no ledger", () => {
  const item: AppendixItem = { dependents };
  assert.strictEqual(isKeptEntry(item), false);
});

test("isKeepExpired - returns false for keep: true (no expiry possible)", () => {
  const item: AppendixItem = {
    ledger: itemLedger,
  };
  assert.strictEqual(isKeepExpired(item, "lodash", {}), false);
});

test("isKeepExpired - returns false when no keep", () => {
  const item: AppendixItem = { ledger: ledger3 };
  assert.strictEqual(isKeepExpired(item, "lodash", {}), false);
});

const ledger4Keep = { reason: "temp", until: "2020-01-01" };
const ledger4 = {
  addedDate: "2024-01-01",
  keep: ledger4Keep,
};
test("isKeepExpired - returns true when until date is in the past", () => {
  const item: AppendixItem = {
    ledger: ledger4,
  };
  assert.strictEqual(isKeepExpired(item, "lodash", {}), true);
});

const ledger5Keep = { reason: "temp", until: "2099-01-01" };
const ledger5 = {
  addedDate: "2024-01-01",
  keep: ledger5Keep,
};
test("isKeepExpired - returns false when until date is in the future", () => {
  const item: AppendixItem = {
    ledger: ledger5,
  };
  assert.strictEqual(isKeepExpired(item, "lodash", {}), false);
});

const ledger6Keep = { reason: "patch pending", untilVersion: "4.18.0" };
const ledger6 = {
  addedDate: "2024-01-01",
  keep: ledger6Keep,
};
test("isKeepExpired - returns true when dep version meets untilVersion", () => {
  const item: AppendixItem = {
    ledger: ledger6,
  };
  const rootDeps = { lodash: "^4.18.0" };
  assert.strictEqual(isKeepExpired(item, "lodash", rootDeps), true);
});

test("isKeepExpired - returns false when dep version is below untilVersion", () => {
  const item: AppendixItem = {
    ledger: ledger6,
  };
  const rootDeps = { lodash: "^4.17.21" };
  assert.strictEqual(isKeepExpired(item, "lodash", rootDeps), false);
});

test("isKeepExpired - reads the version from an npm alias, not the package name", () => {
  const item: AppendixItem = { ledger: ledger6 };
  const rootDeps = { lodash: "npm:foo99@4.17.0" };
  assert.strictEqual(isKeepExpired(item, "lodash", rootDeps), false);
});

test("isKeepExpired - returns false when dep is missing from rootDeps", () => {
  const item: AppendixItem = {
    ledger: ledger6,
  };
  assert.strictEqual(isKeepExpired(item, "lodash", {}), false);
});

const lodashEntry12LedgerKeep = { reason: "awaiting upstream fix" };
const lodashEntry12Ledger = {
  addedDate: "2024-01-01",
  keep: lodashEntry12LedgerKeep,
};
const lodashEntry12 = {
  dependents: lodashEntry5Dependents,
  ledger: lodashEntry12Ledger,
};
test("findUnusedAppendixEntries - skips entries with KeepConstraint object", () => {
  const appendix: Appendix = {
    "lodash@4.17.21": lodashEntry12,
  };

  const result = findUnusedAppendixEntries(appendix);
  assert.ok(!result.includes("lodash@4.17.21"));
});

const lodashEntry13LedgerKeep = { reason: "expired keep", until: "2020-01-01" };
const lodashEntry13Ledger = {
  addedDate: "2024-01-01",
  keep: lodashEntry13LedgerKeep,
};
const lodashEntry13 = {
  dependents: lodashEntry5Dependents,
  ledger: lodashEntry13Ledger,
};
test("findUnusedAppendixEntries - includes expired KeepConstraint entries", () => {
  const appendix: Appendix = {
    "lodash@4.17.21": lodashEntry13,
  };

  const result = findUnusedAppendixEntries(appendix);
  assert.ok(result.includes("lodash@4.17.21"));
});

const lodashEntry14LedgerKeep = { reason: "version-bounded keep", untilVersion: "4.18.0" };
const lodashEntry14Ledger = {
  addedDate: "2024-01-01",
  keep: lodashEntry14LedgerKeep,
};
const lodashEntry14 = {
  dependents: lodashEntry5Dependents,
  ledger: lodashEntry14Ledger,
};
test("findUnusedAppendixEntries - includes version-expired KeepConstraint entries", () => {
  const appendix: Appendix = {
    "lodash@4.17.21": lodashEntry14,
  };

  const result = findUnusedAppendixEntries(appendix, { lodash: "^4.18.0" });
  assert.ok(result.includes("lodash@4.17.21"));
});

const lodashEntry15LedgerKeep = { reason: "awaiting upstream fix", untilVersion: "4.18.0" };
const lodashEntry15Ledger = {
  addedDate: "2024-01-01",
  keep: lodashEntry15LedgerKeep,
};
const lodashEntry15 = {
  dependents: lodashEntry11Dependents,
  ledger: lodashEntry15Ledger,
};
test("toCompactAppendix - preserves full ledger for KeepConstraint entries", () => {
  const appendix: Appendix = {
    "lodash@4.17.21": lodashEntry15,
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

const minimatch = ["glob", "rimraf"];
test("buildDependentInfo - keeps range selectors without claiming version-specific consumers", () => {
  const info = buildDependentInfo(false, "minimatch@>=9 <10", undefined, undefined, {
    minimatch,
  });
  assert.strictEqual(info, "minimatch@>=9 <10 (transitive dependency)");
});

const undiciSelectors = ["undici@7.29.0", "release-it>undici", "release-it@21.0.3>undici@7.29.0"];
undiciSelectors.forEach((selector) => {
  const undici = ["@dotenvx/dotenvx", "jsdom", "release-it"];
  test(`buildDependentInfo - avoids unverified consumers for ${selector}`, () => {
    const graph = { undici };
    const info = buildDependentInfo(false, selector, undefined, undefined, graph);
    assert.strictEqual(info, `${selector} (transitive dependency)`);
  });
});

const graphUndici = ["jsdom", "release-it"];
test("buildDependentInfo - preserves consumer names for an unqualified package", () => {
  const graph = { undici: graphUndici };
  const info = buildDependentInfo(false, "undici", undefined, undefined, graph);
  assert.strictEqual(info, "undici (required by jsdom, release-it)");
});

const scopePkg = ["consumer"];
test("buildDependentInfo - preserves consumer names for a scoped package without a selector", () => {
  const graph = { "@scope/pkg": scopePkg };
  const info = buildDependentInfo(false, "@scope/pkg", undefined, undefined, graph);
  assert.strictEqual(info, "@scope/pkg (required by consumer)");
});

test("buildDependentInfo - resolves selector-range key to real name for tree lookup", () => {
  const info: string = buildDependentInfo(
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

test("isKeepExpired - returns false when dep version has no semver", () => {
  const item: AppendixItem = {
    ledger: ledger6,
  };
  assert.strictEqual(isKeepExpired(item, "lodash", { lodash: "workspace:*" }), false);
  assert.strictEqual(isKeepExpired(item, "lodash", { lodash: "latest" }), false);
});

test("isKeepExpired - extracts semver from range specifiers", () => {
  const item: AppendixItem = {
    ledger: ledger6,
  };
  assert.strictEqual(isKeepExpired(item, "lodash", { lodash: ">=4.18.1 <5" }), true);
  assert.strictEqual(isKeepExpired(item, "lodash", { lodash: "npm:lodash@4.17.0" }), false);
});

test("isNestedOverride - excludes null and strings", () => {
  assert.strictEqual(isNestedOverride(null), false);
  assert.strictEqual(isNestedOverride("1.0.0"), false);
  assert.strictEqual(isNestedOverride({ foo: "1.0.0" }), true);
});

const LODASH_KEY = "lodash@4.17.21";
const PACKAGE_BASE = { name: "test", version: "1.0.0" };

const buildAppendix = (key: string, dependents: Record<string, string>): Appendix => {
  const item: AppendixItem = { dependents };
  const appendix: Appendix = Object.fromEntries([[key, item]]);
  return appendix;
};

const buildItem = (dependents: Record<string, string>): AppendixItem => {
  const item: AppendixItem = { dependents };
  return item;
};

test("mergeDependenciesForPackage - merges all dependency types", () => {
  const dependencies = { lodash: "^4.17.20", express: "^4.18.0" };
  const devDependencies = { jest: "^29.0.0", typescript: "^5.0.0" };
  const peerDependencies = { react: "^18.0.0" };
  const packageConfig: PastoralistJSON = Object.assign({}, PACKAGE_BASE, {
    dependencies,
    devDependencies,
    peerDependencies,
  });

  const result = mergeDependenciesForPackage(packageConfig);

  assert.strictEqual(result.lodash, "^4.17.20");
  assert.strictEqual(result.express, "^4.18.0");
  assert.strictEqual(result.jest, "^29.0.0");
  assert.strictEqual(result.typescript, "^5.0.0");
  assert.strictEqual(result.react, "^18.0.0");
});

test("mergeDependenciesForPackage - handles missing dependency types", () => {
  const dependencies = { lodash: "^4.17.20" };
  const packageConfig: PastoralistJSON = Object.assign({}, PACKAGE_BASE, { dependencies });

  const result = mergeDependenciesForPackage(packageConfig);

  assert.strictEqual(result.lodash, "^4.17.20");
  assert.strictEqual(Object.keys(result).length, 1);
});

test("mergeDependenciesForPackage - handles undefined config", () => {
  const result = mergeDependenciesForPackage(undefined);

  assert.deepStrictEqual(result, {});
});

test("mergeDependenciesForPackage - handles empty dependencies", () => {
  const result = mergeDependenciesForPackage(PACKAGE_BASE);

  assert.deepStrictEqual(result, {});
});

test("hasDependenciesMatchingOverrides - returns true when match found", () => {
  const depList = ["lodash", "express", "react"];
  const overridesList = ["lodash", "typescript"];

  const result = hasDependenciesMatchingOverrides(depList, overridesList);

  assert.strictEqual(result, true);
});

test("hasDependenciesMatchingOverrides - returns false when no match", () => {
  const depList = ["lodash", "express"];
  const overridesList = ["react", "vue"];

  const result = hasDependenciesMatchingOverrides(depList, overridesList);

  assert.strictEqual(result, false);
});

test("hasDependenciesMatchingOverrides - returns false with empty depList", () => {
  const depList: string[] = [];
  const overridesList = ["lodash"];

  const result = hasDependenciesMatchingOverrides(depList, overridesList);

  assert.strictEqual(result, false);
});

test("hasDependenciesMatchingOverrides - returns false with empty overridesList", () => {
  const depList = ["lodash"];
  const overridesList: string[] = [];

  const result = hasDependenciesMatchingOverrides(depList, overridesList);

  assert.strictEqual(result, false);
});

test("hasDependenciesMatchingOverrides - handles multiple matches", () => {
  const depList = ["lodash", "express", "react"];
  const overridesList = ["lodash", "express", "typescript"];

  const result = hasDependenciesMatchingOverrides(depList, overridesList);

  assert.strictEqual(result, true);
});

test("shouldWriteAppendix - returns true with appendix and write flag", () => {
  const appendix = buildAppendix(LODASH_KEY, { app: "lodash@^4.17.0" });

  const result = shouldWriteAppendix(appendix, true);

  assert.strictEqual(result, true);
});

test("shouldWriteAppendix - returns false when write flag is false", () => {
  const appendix = buildAppendix(LODASH_KEY, { app: "lodash@^4.17.0" });

  const result = shouldWriteAppendix(appendix, false);

  assert.strictEqual(result, false);
});

test("shouldWriteAppendix - returns false when appendix is undefined", () => {
  const result = shouldWriteAppendix(undefined, true);

  assert.strictEqual(result, false);
});

test("shouldWriteAppendix - returns false when appendix is empty", () => {
  const appendix: Appendix = {};

  const result = shouldWriteAppendix(appendix, true);

  assert.strictEqual(result, false);
});

test("hasOverrides - returns true when overrides exist", () => {
  const overrides: OverridesType = { lodash: "4.17.21", express: "4.18.2" };

  const result = hasOverrides(overrides);

  assert.strictEqual(result, true);
});

test("hasOverrides - returns false when overrides is null", () => {
  const result = hasOverrides(null);

  assert.strictEqual(result, false);
});

test("hasOverrides - returns false when overrides is empty object", () => {
  const overrides: OverridesType = {};

  const result = hasOverrides(overrides);

  assert.strictEqual(result, false);
});

test("mergeAppendixDependents - merges dependents for existing key", () => {
  const currentAppendix = buildAppendix(LODASH_KEY, { app1: "lodash@^4.17.0" });
  const value = buildItem({ app2: "lodash@^4.17.20" });

  const result = mergeAppendixDependents(currentAppendix, LODASH_KEY, value);

  assert.strictEqual(result[LODASH_KEY].dependents.app1, "lodash@^4.17.0");
  assert.strictEqual(result[LODASH_KEY].dependents.app2, "lodash@^4.17.20");
});

test("mergeAppendixDependents - creates new entry for non-existing key", () => {
  const currentAppendix = buildAppendix(LODASH_KEY, { app1: "lodash@^4.17.0" });
  const key = "express@4.18.2";
  const value = buildItem({ app2: "express@^4.18.0" });

  const result = mergeAppendixDependents(currentAppendix, key, value);

  assert.notStrictEqual(result[LODASH_KEY], undefined);
  assert.notStrictEqual(result[key], undefined);
  assert.strictEqual(result[key].dependents.app2, "express@^4.18.0");
});

test("mergeAppendixDependents - handles empty currentAppendix", () => {
  const currentAppendix: Appendix = {};
  const key = "react@18.0.0";
  const value = buildItem({ frontend: "react@^18.0.0" });

  const result = mergeAppendixDependents(currentAppendix, key, value);

  assert.notStrictEqual(result[key], undefined);
  assert.strictEqual(result[key].dependents.frontend, "react@^18.0.0");
});

test("mergeAppendixDependents - overwrites duplicate dependent names", () => {
  const currentAppendix = buildAppendix(LODASH_KEY, { app: "lodash@^4.17.0" });
  const value = buildItem({ app: "lodash@^4.17.20" });

  const result = mergeAppendixDependents(currentAppendix, LODASH_KEY, value);

  assert.strictEqual(result[LODASH_KEY].dependents.app, "lodash@^4.17.20");
  assert.strictEqual(Object.keys(result[LODASH_KEY].dependents).length, 1);
});

test("mergeAppendixDependents - preserves other appendix entries", () => {
  const lodash = buildAppendix(LODASH_KEY, { app1: "lodash@^4.17.0" });
  const express = buildAppendix("express@4.18.2", { app2: "express@^4.18.0" });
  const currentAppendix = Object.assign({}, lodash, express);
  const value = buildItem({ app3: "lodash@^4.17.20" });

  const result = mergeAppendixDependents(currentAppendix, LODASH_KEY, value);

  assert.strictEqual(result[LODASH_KEY].dependents.app1, "lodash@^4.17.0");
  assert.strictEqual(result[LODASH_KEY].dependents.app3, "lodash@^4.17.20");
  assert.strictEqual(result["express@4.18.2"].dependents.app2, "express@^4.18.0");
});

const OLD_DATE = "2026-06-28T00:00:00.000Z";
const NEW_DATE = "2026-10-01T00:00:00.000Z";
const UNDICI_DEPENDENTS = { codependence: "undici (required by release-it)" };
const POSTCSS_DEPENDENTS = { codependence: "postcss (required by shadcn, vite)" };

const entry = (key: string, dependents: Record<string, string>, addedDate: string): Appendix => {
  const ledger = { addedDate };
  const item: AppendixItem = { dependents, ledger };
  const appendix: Appendix = Object.fromEntries([[key, item]]);
  return appendix;
};

test("carryExistingLedgers - drops keys no current override produces", () => {
  const fresh = entry("undici@7.30.0", UNDICI_DEPENDENTS, NEW_DATE);
  const stale = entry("undici@7.28.0", UNDICI_DEPENDENTS, OLD_DATE);
  const stale2 = entry("undici@7.29.0", UNDICI_DEPENDENTS, OLD_DATE);
  const live = entry("undici@7.30.0", UNDICI_DEPENDENTS, OLD_DATE);
  const existing = Object.assign({}, stale, stale2, live);
  const result = carryExistingLedgers(fresh, existing);
  assert.deepEqual(Object.keys(result), ["undici@7.30.0"]);
});

test("carryExistingLedgers - unchanged key keeps its original addedDate", () => {
  const fresh = entry("postcss@8.5.23", POSTCSS_DEPENDENTS, NEW_DATE);
  const existing = entry("postcss@8.5.23", POSTCSS_DEPENDENTS, OLD_DATE);
  const result = carryExistingLedgers(fresh, existing);
  assert.equal(result["postcss@8.5.23"].ledger?.addedDate, OLD_DATE);
});

test("carryExistingLedgers - new version key gets the fresh addedDate", () => {
  const fresh = entry("postcss@8.5.23", POSTCSS_DEPENDENTS, NEW_DATE);
  const existing = entry("postcss@8.5.18", POSTCSS_DEPENDENTS, OLD_DATE);
  const result = carryExistingLedgers(fresh, existing);
  assert.equal(result["postcss@8.5.23"].ledger?.addedDate, NEW_DATE);
  assert.equal(result["postcss@8.5.18"], undefined);
});

test("carryExistingLedgers - replaces stale dependents with current ones", () => {
  const current = { docs: "vite@^8.2.1" };
  const stale = { codependence: "vite (unused override)", docs: "old" };
  const fresh = entry("vite@8.2.1", current, NEW_DATE);
  const existing = entry("vite@8.2.1", stale, OLD_DATE);
  const result = carryExistingLedgers(fresh, existing);
  assert.deepEqual(result["vite@8.2.1"].dependents, current);
});

test("carryExistingLedgers - keeps entries marked keep even without an override", () => {
  const existing = entry("lodash@4.17.20", {}, OLD_DATE);
  const ledger = { addedDate: OLD_DATE, keep: true };
  const kept = Object.assign({}, existing["lodash@4.17.20"], { ledger });
  const keptAppendix = Object.fromEntries([["lodash@4.17.20", kept]]);
  const result = carryExistingLedgers({}, keptAppendix);
  assert.deepEqual(result["lodash@4.17.20"], kept);
});

const UNDICI_PARENTS = ["release-it", "shadcn"];
const NANOID_PARENTS = ["postcss"];
const POSTCSS_PARENTS = ["release-it", "shadcn", "vite"];
const VITE_PARENTS = ["shadcn"];
const CHAIN_GRAPH = {
  undici: UNDICI_PARENTS,
  nanoid: NANOID_PARENTS,
  postcss: POSTCSS_PARENTS,
  vite: VITE_PARENTS,
};

test("findTopLevelDependents - returns the direct dependency of one project", () => {
  const rootDeps = new Set(["release-it"]);
  const result = findTopLevelDependents("undici", CHAIN_GRAPH, rootDeps);
  assert.deepEqual(result, ["release-it"]);
});

test("findTopLevelDependents - returns every direct dependency that reaches the package", () => {
  const docsDeps = new Set(["shadcn", "vite"]);
  const result = findTopLevelDependents("postcss", CHAIN_GRAPH, docsDeps);
  assert.deepEqual(result, ["shadcn", "vite"]);
});

test("findTopLevelDependents - follows the whole chain up to the direct dependency", () => {
  const rootDeps = new Set(["release-it"]);
  const result = findTopLevelDependents("nanoid", CHAIN_GRAPH, rootDeps);
  assert.deepEqual(result, ["release-it"]);
});

test("findTopLevelDependents - ignores dependencies the project does not declare", () => {
  const unrelated = new Set(["left-pad"]);
  const result = findTopLevelDependents("undici", CHAIN_GRAPH, unrelated);
  assert.deepEqual(result, []);
});

test("findTopLevelDependents - survives cycles in the graph", () => {
  const aParents = ["b"];
  const bParents = ["a", "app"];
  const cyclic = { a: aParents, b: bParents };
  const appDeps = new Set(["app"]);
  const result = findTopLevelDependents("a", cyclic, appDeps);
  assert.deepEqual(result, ["app"]);
});

test("findTopLevelDependents - returns nothing without a graph", () => {
  const rootDeps = new Set(["release-it"]);
  const result = findTopLevelDependents("undici", undefined, rootDeps);
  assert.deepEqual(result, []);
});

test("buildDependentInfo - names the top-level dependency, not the immediate parent", () => {
  const rootDeps = new Set(["release-it"]);
  const tree = {};
  const info = buildDependentInfo(false, "nanoid", undefined, tree, CHAIN_GRAPH, rootDeps);
  assert.equal(info, "nanoid (required by release-it)");
});

test("buildDependentInfo - lists several top-level dependencies when several apply", () => {
  const docsDeps = new Set(["shadcn", "vite"]);
  const tree = {};
  const info = buildDependentInfo(false, "postcss", undefined, tree, CHAIN_GRAPH, docsDeps);
  assert.equal(info, "postcss (required by shadcn, vite)");
});

test("buildDependentInfo - marks an override the project does not reach as unused", () => {
  const rootDeps = new Set(["release-it"]);
  const info = buildDependentInfo(
    false,
    "vite",
    undefined,
    { vite: "8.2.1" },
    CHAIN_GRAPH,
    rootDeps,
  );
  assert.equal(info, "vite (unused override)");
});

test("buildDependentInfo - uses the dependency tree when no graph is available", () => {
  const rootDeps = new Set(["release-it"]);
  const dependencyTree = { vite: "8.2.1" };
  const info = buildDependentInfo(false, "vite", undefined, dependencyTree, undefined, rootDeps);
  assert.equal(info, "vite (transitive dependency)");
});

test("buildDependentInfo - ignores the tree when a graph has no matching path", () => {
  const rootDeps = new Set(["release-it"]);
  const releaseItParents = ["release-it"];
  const graph = { undici: releaseItParents };
  const dependencyTree = { vite: "8.2.1" };
  const info = buildDependentInfo(false, "vite", undefined, dependencyTree, graph, rootDeps);
  assert.equal(info, "vite (unused override)");
});

test("dropSupersededUnusedDependents - removes unused notes when another project uses it", () => {
  const dependents = { root: "vite (unused override)", docs: "vite@^8.2.1" };
  const item: AppendixItem = { dependents };
  const appendix: Appendix = { "vite@8.2.1": item };
  const result = dropSupersededUnusedDependents(appendix);
  assert.deepEqual(result["vite@8.2.1"].dependents, { docs: "vite@^8.2.1" });
});

test("dropSupersededUnusedDependents - keeps the note when nobody uses the override", () => {
  const dependents = { root: "vite (unused override)", docs: "vite (unused override)" };
  const item: AppendixItem = { dependents };
  const appendix: Appendix = { "vite@8.2.1": item };
  const result = dropSupersededUnusedDependents(appendix);
  assert.deepEqual(result["vite@8.2.1"].dependents, dependents);
});

const withLedger = (key: string, dependents: Record<string, string>, ledger: object): Appendix => {
  const fullLedger = Object.assign({ addedDate: OLD_DATE }, ledger);
  const item = { dependents, ledger: fullLedger };
  const appendix: Appendix = Object.fromEntries([[key, item]]);
  return appendix;
};

const refreshed = (key: string, dependents: Record<string, string>, ledger: object): Appendix => {
  const fullLedger = Object.assign({ addedDate: NEW_DATE }, ledger);
  const item = { dependents, ledger: fullLedger };
  const appendix: Appendix = Object.fromEntries([[key, item]]);
  return appendix;
};

const RELEASE_IT = { root: "undici (required by release-it)" };
const SHADCN = { root: "undici (required by shadcn)" };

test("carryExistingLedgers - bumps addedDate when the dependents change", () => {
  const existing = withLedger("undici@7.30.0", RELEASE_IT, {});
  const fresh = refreshed("undici@7.30.0", SHADCN, {});
  const result = carryExistingLedgers(fresh, existing);
  assert.equal(result["undici@7.30.0"].ledger?.addedDate, NEW_DATE);
});

test("carryExistingLedgers - keeps addedDate when dependents are only reordered", () => {
  const first = { a: "undici (required by a)", b: "undici (required by b)" };
  const reordered = { b: "undici (required by b)", a: "undici (required by a)" };
  const existing = withLedger("undici@7.30.0", first, {});
  const fresh = refreshed("undici@7.30.0", reordered, {});
  const result = carryExistingLedgers(fresh, existing);
  assert.equal(result["undici@7.30.0"].ledger?.addedDate, OLD_DATE);
});

test("carryExistingLedgers - bumps addedDate and takes the new reason when the reason changes", () => {
  const existing = withLedger("undici@7.30.0", RELEASE_IT, { reason: "old reason" });
  const fresh = refreshed("undici@7.30.0", RELEASE_IT, { reason: "new reason" });
  const ledger = carryExistingLedgers(fresh, existing)["undici@7.30.0"].ledger;
  assert.equal(ledger?.addedDate, NEW_DATE);
  assert.equal(ledger?.reason, "new reason");
});

test("carryExistingLedgers - bumps addedDate when a security finding changes", () => {
  const existing = withLedger("undici@7.30.0", RELEASE_IT, { patchedVersion: "7.29.1" });
  const fresh = refreshed("undici@7.30.0", RELEASE_IT, { patchedVersion: "7.30.0" });
  const ledger = carryExistingLedgers(fresh, existing)["undici@7.30.0"].ledger;
  assert.equal(ledger?.addedDate, NEW_DATE);
  assert.equal(ledger?.patchedVersion, "7.30.0");
});

test("carryExistingLedgers - refreshes security check date without changing addedDate", () => {
  const existing = withLedger("undici@7.30.0", RELEASE_IT, { securityCheckDate: OLD_DATE });
  const fresh = refreshed("undici@7.30.0", RELEASE_IT, { securityCheckDate: NEW_DATE });
  const ledger = carryExistingLedgers(fresh, existing)["undici@7.30.0"].ledger;
  assert.equal(ledger?.addedDate, OLD_DATE);
  assert.equal(ledger?.securityCheckDate, NEW_DATE);
});

test("carryExistingLedgers - keeps stored security info when this run reports none", () => {
  const cves = ["CVE-1"];
  const stored = { severity: "high", cves };
  const existing = withLedger("undici@7.30.0", RELEASE_IT, stored);
  const fresh = refreshed("undici@7.30.0", RELEASE_IT, {});
  const ledger = carryExistingLedgers(fresh, existing)["undici@7.30.0"].ledger;
  assert.equal(ledger?.addedDate, OLD_DATE);
  assert.equal(ledger?.severity, "high");
});

test("carryExistingLedgers - keeps the keep flag when an entry is updated", () => {
  const existing = withLedger("undici@7.30.0", RELEASE_IT, { keep: true });
  const fresh = refreshed("undici@7.30.0", SHADCN, {});
  const ledger = carryExistingLedgers(fresh, existing)["undici@7.30.0"].ledger;
  assert.equal(ledger?.addedDate, NEW_DATE);
  assert.equal(ledger?.keep, true);
});

test("carryExistingLedgers - keeps addedDate for a compact entry with no stored dependents", () => {
  const ledger = { addedDate: OLD_DATE };
  const compactItem: AppendixItem = { ledger };
  const compact: Appendix = { "undici@7.30.0": compactItem };
  const fresh = refreshed("undici@7.30.0", RELEASE_IT, {});
  const result = carryExistingLedgers(fresh, compact);
  assert.equal(result["undici@7.30.0"].ledger?.addedDate, OLD_DATE);
});

type Random = (limit: number) => number;

const CARRY_OLD_DATE = "2026-06-28T00:00:00.000Z";
const CARRY_NEW_DATE = "2026-10-02T00:00:00.000Z";
const KEYS = ["a@1.0.0", "b@2.0.0", "c@3.0.0", "d@4.0.0", "e@5.0.0"];
const DEPENDENT_NAMES = ["root", "docs", "app"];
const REQUIRED_BY = ["x", "y", "x, y"];
const REASONS = ["reason one", "reason two"];
const SEVERITIES = ["low", "high"] as const;
const LCG_MULTIPLIER = 1664525;
const LCG_INCREMENT = 1013904223;

const createRandom = (seed: number): Random => {
  let state = seed >>> 0;
  const random: Random = (limit) => {
    const product = Math.imul(state, LCG_MULTIPLIER);
    state = (product + LCG_INCREMENT) >>> 0;
    const value = state % limit;
    return value;
  };
  return random;
};

const pick = <T>(random: Random, values: readonly T[]): T => values[random(values.length)];

const randomDependents = (random: Random): Record<string, string> => {
  const names = DEPENDENT_NAMES.filter(() => random(2) === 0);
  const entries = names.map((name): [string, string] => [name, pick(random, REQUIRED_BY)]);
  const dependents = Object.fromEntries(entries);
  return dependents;
};

const sometimes = <T>(random: Random, limit: number, value: T): T | undefined => {
  const isChosen = random(limit) === 0;
  if (isChosen) return value;
  return undefined;
};

const randomLedgerFields = (random: Random) => {
  const reason = sometimes(random, 2, pick(random, REASONS));
  const severity = sometimes(random, 2, pick(random, SEVERITIES));
  const keep = sometimes(random, 5, true);
  const fields = { reason, severity, keep };
  return fields;
};

const withoutUndefined = <T extends object>(value: T): T => {
  const entries = Object.entries(value).filter(([, entry]) => entry !== undefined);
  const cleaned = Object.fromEntries(entries) as T;
  return cleaned;
};

const randomItem = (random: Random, addedDate: string, keepAllowed: boolean): AppendixItem => {
  const dependents = randomDependents(random);
  const fields = randomLedgerFields(random);
  const keep = keepAllowed ? fields.keep : undefined;
  const ledger = withoutUndefined(Object.assign({ addedDate }, fields, { keep }));
  const item: AppendixItem = { dependents, ledger };
  return item;
};

const randomAppendix = (random: Random, addedDate: string, keepAllowed: boolean): Appendix => {
  const keys = KEYS.filter(() => random(3) !== 0);
  const entries = keys.map((key): [string, AppendixItem] => [
    key,
    randomItem(random, addedDate, keepAllowed),
  ]);
  const appendix: Appendix = Object.fromEntries(entries);
  return appendix;
};

const isKept = (item: AppendixItem): boolean => item.ledger?.keep === true;

const assertKeys = (fresh: Appendix, existing: Appendix, result: Appendix): void => {
  const keptKeys = Object.entries(existing)
    .filter(([key, item]) => !fresh[key] && isKept(item))
    .map(([key]) => key);
  const expected = new Set(Object.keys(fresh).concat(keptKeys));
  assert.deepEqual(Object.keys(result).toSorted(), Array.from(expected).toSorted());
};

const sortedEntries = (dependents: Record<string, string> | undefined): string => {
  const entries = Object.entries(dependents ?? {}).toSorted(([a], [b]) => a.localeCompare(b));
  const text = JSON.stringify(entries);
  return text;
};

const changedField = (
  field: "reason" | "severity",
  fresh: AppendixItem,
  previous: AppendixItem,
) => {
  const next = fresh.ledger?.[field];
  const before = previous.ledger?.[field];
  const isChanged = next !== undefined && next !== before;
  return isChanged;
};

const expectedDate = (key: string, fresh: Appendix, existing: Appendix): string | undefined => {
  const previous = existing[key];
  if (!previous) return CARRY_NEW_DATE;
  const dependentsChanged =
    sortedEntries(fresh[key].dependents) !== sortedEntries(previous.dependents);
  const reasonChanged = changedField("reason", fresh[key], previous);
  const severityChanged = changedField("severity", fresh[key], previous);
  const isUpdated = dependentsChanged || reasonChanged || severityChanged;
  if (isUpdated) return CARRY_NEW_DATE;
  const storedDate = previous.ledger?.addedDate;
  return storedDate;
};

const assertDate = (key: string, fresh: Appendix, existing: Appendix, result: Appendix): void => {
  const expected = expectedDate(key, fresh, existing);
  assert.equal(result[key].ledger?.addedDate, expected, `${key} date`);
};

const assertKeepSurvives = (key: string, existing: Appendix, result: Appendix): void => {
  const wasKept = existing[key] ? isKept(existing[key]) : false;
  if (!wasKept) return;
  assert.equal(result[key].ledger?.keep, true, `${key} lost keep`);
};

const assertCase = (random: Random, trial: number): void => {
  const fresh = randomAppendix(random, CARRY_NEW_DATE, false);
  const existing = randomAppendix(random, CARRY_OLD_DATE, true);
  const result = carryExistingLedgers(fresh, existing);
  assertKeys(fresh, existing, result);
  const freshKeys = Object.keys(fresh);
  freshKeys.forEach((key) => assertDate(key, fresh, existing, result));
  freshKeys.forEach((key) => assertKeepSurvives(key, existing, result));
  assert.deepEqual(carryExistingLedgers(fresh, result), result, `trial ${trial} not stable`);
};

const trials = (count: number): number[] => Array.from({ length: count }, (_, index) => index);

test("carryExistingLedgers - random appendices keep every key accounted for", () => {
  const random = createRandom(20261002);
  trials(3000).forEach((trial) => assertCase(random, trial));
});

test("carryExistingLedgers - an entry with no previous version is returned untouched", () => {
  const random = createRandom(5);
  const fresh = randomAppendix(random, CARRY_NEW_DATE, false);
  const result = carryExistingLedgers(fresh, {});
  assert.deepEqual(result, fresh);
});

test("carryExistingLedgers - an identical run changes nothing", () => {
  const random = createRandom(11);
  const appendix = randomAppendix(random, CARRY_OLD_DATE, true);
  const result = carryExistingLedgers(appendix, appendix);
  assert.deepEqual(result, appendix);
});

test("carryExistingLedgers - does not mutate either input", () => {
  const random = createRandom(13);
  const fresh = randomAppendix(random, CARRY_NEW_DATE, false);
  const existing = randomAppendix(random, CARRY_OLD_DATE, true);
  const before = JSON.stringify([fresh, existing]);
  carryExistingLedgers(fresh, existing);
  assert.equal(JSON.stringify([fresh, existing]), before);
});

type Graph = Record<string, string[]>;
type GraphEntry = [string, string[]];

const graphFrom = (entries: GraphEntry[]): Graph => {
  const graph: Graph = Object.fromEntries(entries);
  return graph;
};

const nodeNames = (size: number): string[] => {
  const names = Array.from({ length: size }, (_, index) => `p${index}`);
  return names;
};

const randomParents = (random: Random, names: string[]): string[] => {
  const count = random(4);
  const parents = Array.from({ length: count }, () => names[random(names.length)]);
  return parents;
};

const randomGraph = (random: Random, size: number): Graph => {
  const names = nodeNames(size);
  const entries = names.map((name): GraphEntry => [name, randomParents(random, names)]);
  const graph = graphFrom(entries);
  return graph;
};

const randomDirectDeps = (random: Random, size: number): Set<string> => {
  const picked = nodeNames(size).filter(() => random(4) === 0);
  const directDeps = new Set(picked);
  return directDeps;
};

const parentsOf = (names: Set<string>, graph: Graph): string[] => {
  const parents = Array.from(names).flatMap((name) => graph[name] ?? []);
  return parents;
};

const expandUntilStable = (expanded: Set<string>, graph: Graph, directDeps: Set<string>) => {
  const indirect = parentsOf(expanded, graph).filter((parent) => !directDeps.has(parent));
  const grown = new Set(Array.from(expanded).concat(indirect));
  const isStable = grown.size === expanded.size;
  const next = isStable ? expanded : expandUntilStable(grown, graph, directDeps);
  return next;
};

const referenceTopLevel = (name: string, graph: Graph, directDeps: Set<string>): string[] => {
  const expanded = expandUntilStable(new Set([name]), graph, directDeps);
  const reached = parentsOf(expanded, graph).filter((parent) => directDeps.has(parent));
  const others = reached.filter((parent) => parent !== name);
  const sorted = Array.from(new Set(others)).toSorted();
  return sorted;
};

const assertAllNames = (trial: number, graph: Graph, directDeps: Set<string>): void => {
  Object.keys(graph).forEach((name) => {
    const actual = findTopLevelDependents(name, graph, directDeps);
    const expected = referenceTopLevel(name, graph, directDeps);
    assert.deepEqual(actual, expected, `trial ${trial} name ${name}`);
  });
};

const runRandomTrial = (random: Random, trial: number): void => {
  const size = 2 + random(40);
  const graph = randomGraph(random, size);
  const directDeps = randomDirectDeps(random, size);
  assertAllNames(trial, graph, directDeps);
};

const assertResultShape = (random: Random): void => {
  const size = 2 + random(30);
  const graph = randomGraph(random, size);
  const directDeps = randomDirectDeps(random, size);
  const result = findTopLevelDependents("p0", graph, directDeps);
  assert.deepEqual(result, result.toSorted());
  assert.equal(new Set(result).size, result.length);
  assert.ok(result.every((dependency) => directDeps.has(dependency)));
  assert.ok(!result.includes("p0"));
};

const topLevelTrials = (count: number): number[] =>
  Array.from({ length: count }, (_, index) => index);

test("findTopLevelDependents - matches a reference walk on 2000 random graphs", () => {
  const random = createRandom(20261002);
  topLevelTrials(2000).forEach((trial) => runRandomTrial(random, trial));
});

test("findTopLevelDependents - results are sorted, unique and only direct dependencies", () => {
  const random = createRandom(7);
  topLevelTrials(500).forEach(() => assertResultShape(random));
});

test("findTopLevelDependents - does not mutate its inputs", () => {
  const graph = graphFrom([
    ["a", ["b", "c"]],
    ["b", ["app"]],
    ["c", ["app", "b"]],
  ]);
  const before = JSON.stringify(graph);
  const directDeps = new Set(["app"]);
  findTopLevelDependents("a", graph, directDeps);
  assert.equal(JSON.stringify(graph), before);
  assert.deepEqual(Array.from(directDeps), ["app"]);
});

test("findTopLevelDependents - an unrelated direct dependency never changes the answer", () => {
  const graph = graphFrom([
    ["a", ["b"]],
    ["b", ["app"]],
  ]);
  const base = findTopLevelDependents("a", graph, new Set(["app"]));
  const extra = findTopLevelDependents("a", graph, new Set(["app", "other"]));
  assert.deepEqual(extra, base);
});

test("findTopLevelDependents - stops at the first direct dependency on each path", () => {
  const graph = graphFrom([
    ["leaf", ["mid"]],
    ["mid", ["outer"]],
    ["outer", ["top"]],
  ]);
  const result = findTopLevelDependents("leaf", graph, new Set(["mid", "top"]));
  assert.deepEqual(result, ["mid"]);
});

test("findTopLevelDependents - handles a diamond without duplicates", () => {
  const graph = graphFrom([
    ["leaf", ["left", "right"]],
    ["left", ["app"]],
    ["right", ["app"]],
  ]);
  const result = findTopLevelDependents("leaf", graph, new Set(["app"]));
  assert.deepEqual(result, ["app"]);
});

test("findTopLevelDependents - handles a package that depends on itself", () => {
  const graph = graphFrom([["loop", ["loop", "app"]]]);
  const result = findTopLevelDependents("loop", graph, new Set(["app"]));
  assert.deepEqual(result, ["app"]);
});

test("findTopLevelDependents - never reports the package itself", () => {
  const graph = graphFrom([
    ["a", ["b"]],
    ["b", ["a"]],
  ]);
  const result = findTopLevelDependents("a", graph, new Set(["a", "b"]));
  assert.deepEqual(result, ["b"]);
});

test("findTopLevelDependents - supports scoped package names", () => {
  const graph = graphFrom([
    ["@scope/leaf", ["@scope/mid"]],
    ["@scope/mid", ["@scope/app"]],
  ]);
  const result = findTopLevelDependents("@scope/leaf", graph, new Set(["@scope/app"]));
  assert.deepEqual(result, ["@scope/app"]);
});

test("findTopLevelDependents - returns nothing for an unknown package", () => {
  const graph = graphFrom([["a", ["b"]]]);
  assert.deepEqual(findTopLevelDependents("ghost", graph, new Set(["b"])), []);
});

test("findTopLevelDependents - returns nothing for an empty graph or no direct dependencies", () => {
  const graph = graphFrom([["a", ["b"]]]);
  assert.deepEqual(findTopLevelDependents("a", {}, new Set(["b"])), []);
  assert.deepEqual(findTopLevelDependents("a", graph, new Set()), []);
});

test("findTopLevelDependents - survives a 50000 package deep chain", () => {
  const entries = Array.from({ length: 50000 }, (_, index): GraphEntry => [
    `n${index}`,
    [`n${index + 1}`],
  ]);
  const result = findTopLevelDependents("n0", graphFrom(entries), new Set(["n50000"]));
  assert.deepEqual(result, ["n50000"]);
});

test("findTopLevelDependents - stays fast on a wide graph with many lookups", () => {
  const size = 5000;
  const graph = randomGraph(createRandom(99), size);
  const directDeps = new Set(nodeNames(size).filter((_, index) => index % 50 === 0));
  const started = Date.now();
  nodeNames(size)
    .slice(0, 500)
    .forEach((name) => findTopLevelDependents(name, graph, directDeps));
  const elapsed = Date.now() - started;
  assert.ok(elapsed < 5000, `500 lookups took ${elapsed}ms`);
});
