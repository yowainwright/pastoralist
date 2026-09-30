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
  isNestedOverride,
} from "../../../../src/core/appendix/utils";

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
