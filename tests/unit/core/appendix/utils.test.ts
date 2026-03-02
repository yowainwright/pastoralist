import { test, expect } from "bun:test";
import type { SecurityOverrideDetail, Appendix } from "../../../../src/types";
import {
  mergeOverrideReasons,
  createSecurityLedger,
  buildAppendixItem,
  toCompactAppendix,
  findUnusedAppendixEntries,
  removeAppendixKeys,
  extractPackageNames,
  removeOverrideKeys,
} from "../../../../src/core/appendix/utils";

test("mergeOverrideReasons - should return reason when provided", () => {
  const result = mergeOverrideReasons(
    "lodash",
    "security fix",
    undefined,
    undefined,
  );

  expect(result).toBe("security fix");
});

test("mergeOverrideReasons - should return security reason when no reason provided", () => {
  const securityDetails: SecurityOverrideDetail[] = [
    {
      packageName: "lodash",
      reason: "CVE-2021-23337",
      cve: "CVE-2021-23337",
      severity: "high",
    },
  ];

  const result = mergeOverrideReasons(
    "lodash",
    undefined,
    securityDetails,
    undefined,
  );

  expect(result).toBe("CVE-2021-23337");
});

test("mergeOverrideReasons - should return manual reason when no reason or security details", () => {
  const manualReasons = { lodash: "manual override" };

  const result = mergeOverrideReasons(
    "lodash",
    undefined,
    undefined,
    manualReasons,
  );

  expect(result).toBe("manual override");
});

test("mergeOverrideReasons - should return undefined when no reasons provided", () => {
  const result = mergeOverrideReasons(
    "lodash",
    undefined,
    undefined,
    undefined,
  );

  expect(result).toBeUndefined();
});

test("mergeOverrideReasons - should prioritize reason over security details", () => {
  const securityDetails: SecurityOverrideDetail[] = [
    {
      packageName: "lodash",
      reason: "CVE-2021-23337",
      cve: "CVE-2021-23337",
      severity: "high",
    },
  ];

  const result = mergeOverrideReasons(
    "lodash",
    "manual fix",
    securityDetails,
    undefined,
  );

  expect(result).toBe("manual fix");
});

test("mergeOverrideReasons - should prioritize security details over manual reasons", () => {
  const securityDetails: SecurityOverrideDetail[] = [
    {
      packageName: "lodash",
      reason: "CVE-2021-23337",
      cve: "CVE-2021-23337",
      severity: "high",
    },
  ];
  const manualReasons = { lodash: "manual override" };

  const result = mergeOverrideReasons(
    "lodash",
    undefined,
    securityDetails,
    manualReasons,
  );

  expect(result).toBe("CVE-2021-23337");
});

test("createSecurityLedger - should return empty object when no security details", () => {
  const result = createSecurityLedger("lodash", undefined, undefined);

  expect(result).toEqual({});
});

test("createSecurityLedger - should return empty object when package not in security details", () => {
  const securityDetails: SecurityOverrideDetail[] = [
    {
      packageName: "axios",
      reason: "CVE-2021-1234",
      cve: "CVE-2021-1234",
      severity: "high",
    },
  ];

  const result = createSecurityLedger("lodash", securityDetails, undefined);

  expect(result).toEqual({});
});

test("createSecurityLedger - should create basic security ledger", () => {
  const securityDetails: SecurityOverrideDetail[] = [
    {
      packageName: "lodash",
      reason: "CVE-2021-23337",
      cve: "CVE-2021-23337",
      severity: "high",
    },
  ];

  const result = createSecurityLedger("lodash", securityDetails, undefined);

  expect(result).toHaveProperty("securityChecked", true);
  expect(result).toHaveProperty("securityCheckDate");
});

test("createSecurityLedger - should include provider in ledger", () => {
  const securityDetails: SecurityOverrideDetail[] = [
    {
      packageName: "lodash",
      reason: "CVE-2021-23337",
      cve: "CVE-2021-23337",
      severity: "high",
    },
  ];

  const result = createSecurityLedger("lodash", securityDetails, "github");

  expect(result).toHaveProperty("securityProvider", "github");
});

test("createSecurityLedger - should include CVE in ledger", () => {
  const securityDetails: SecurityOverrideDetail[] = [
    {
      packageName: "lodash",
      reason: "CVE-2021-23337",
      cve: "CVE-2021-23337",
      severity: "high",
    },
  ];

  const result = createSecurityLedger("lodash", securityDetails, undefined);

  expect(result).toHaveProperty("cve", "CVE-2021-23337");
});

test("createSecurityLedger - should include severity in ledger", () => {
  const securityDetails: SecurityOverrideDetail[] = [
    {
      packageName: "lodash",
      reason: "CVE-2021-23337",
      cve: "CVE-2021-23337",
      severity: "high",
    },
  ];

  const result = createSecurityLedger("lodash", securityDetails, undefined);

  expect(result).toHaveProperty("severity", "high");
});

test("createSecurityLedger - should include URL in ledger", () => {
  const securityDetails: SecurityOverrideDetail[] = [
    {
      packageName: "lodash",
      reason: "CVE-2021-23337",
      cve: "CVE-2021-23337",
      severity: "high",
      url: "https://nvd.nist.gov/vuln/detail/CVE-2021-23337",
    },
  ];

  const result = createSecurityLedger("lodash", securityDetails, undefined);

  expect(result).toHaveProperty(
    "url",
    "https://nvd.nist.gov/vuln/detail/CVE-2021-23337",
  );
});

test("createSecurityLedger - should include all fields when provided", () => {
  const securityDetails: SecurityOverrideDetail[] = [
    {
      packageName: "lodash",
      reason: "CVE-2021-23337",
      cve: "CVE-2021-23337",
      severity: "high",
      description: "Prototype pollution",
      url: "https://nvd.nist.gov/vuln/detail/CVE-2021-23337",
    },
  ];

  const result = createSecurityLedger("lodash", securityDetails, "github");

  expect(result).toEqual({
    securityChecked: true,
    securityCheckDate: expect.any(String),
    securityProvider: "github",
    cve: "CVE-2021-23337",
    severity: "high",
    url: "https://nvd.nist.gov/vuln/detail/CVE-2021-23337",
  });
});

test("toCompactAppendix - should compact simple entries", () => {
  const appendix: Appendix = {
    "lodash@4.17.21": {
      dependents: { "my-app": "^4.17.0" },
      ledger: { addedDate: "2024-01-15" },
    },
  };

  const result = toCompactAppendix(appendix);

  expect(result["lodash@4.17.21"]).toEqual({ addedDate: "2024-01-15" });
});

test("toCompactAppendix - should preserve entries with security info", () => {
  const appendix: Appendix = {
    "lodash@4.17.21": {
      dependents: { "my-app": "^4.17.0" },
      ledger: {
        addedDate: "2024-01-15",
        securityChecked: true,
        cve: "CVE-2021-23337",
      },
    },
  };

  const result = toCompactAppendix(appendix);

  expect(result["lodash@4.17.21"]).toHaveProperty("ledger");
  expect(result["lodash@4.17.21"]).toHaveProperty("dependents");
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

  expect(result["lodash@4.17.21"]).toHaveProperty("patches");
});

test("toCompactAppendix - should generate date if missing", () => {
  const appendix: Appendix = {
    "lodash@4.17.21": {
      dependents: { "my-app": "^4.17.0" },
    },
  };

  const result = toCompactAppendix(appendix);

  expect(result["lodash@4.17.21"]).toHaveProperty("addedDate");
  expect(typeof result["lodash@4.17.21"].addedDate).toBe("string");
});

test("toCompactAppendix - should use provided addedDate when ledger is missing", () => {
  const appendix: Appendix = {
    "lodash@4.17.21": {
      dependents: { "my-app": "^4.17.0" },
    },
  };
  const gitDate = "2023-03-15T12:00:00+00:00";

  const result = toCompactAppendix(appendix, gitDate);

  expect(result["lodash@4.17.21"].addedDate).toBe(gitDate);
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

  expect(result["lodash@4.17.21"].addedDate).toBe("2024-01-15");
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

  expect(result.ledger?.addedDate).toBe(gitDate);
  expect(result.ledger?.reason).toBe("security fix");
});

test("buildAppendixItem - should fallback to current date when no addedDate provided", () => {
  const before = new Date().toISOString();

  const result = buildAppendixItem(
    { "my-app": "lodash@^4.17.0" },
    undefined,
    undefined,
    {},
  );

  const after = new Date().toISOString();
  const addedDate = result.ledger?.addedDate || "";
  const isInRange = addedDate >= before && addedDate <= after;
  expect(isInRange).toBe(true);
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

  expect(result.ledger?.addedDate).toBe("2022-01-01T00:00:00.000Z");
  expect(result.ledger?.reason).toBe("old reason");
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

  expect(result).toEqual(["lodash@4.17.21"]);
});

test("findUnusedAppendixEntries - should return empty when no unused entries", () => {
  const appendix: Appendix = {
    "lodash@4.17.21": {
      dependents: { root: "lodash@^4.17.0" },
    },
  };

  const result = findUnusedAppendixEntries(appendix);

  expect(result).toEqual([]);
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

  expect(result).toEqual(["lodash@4.17.21"]);
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

  expect(result).toEqual([]);
});

test("removeAppendixKeys - should remove specified keys", () => {
  const appendix: Appendix = {
    "lodash@4.17.21": { dependents: { root: "lodash (unused override)" } },
    "axios@1.0.0": { dependents: { root: "axios@^1.0.0" } },
  };

  const result = removeAppendixKeys(appendix, ["lodash@4.17.21"]);

  expect(result["lodash@4.17.21"]).toBeUndefined();
  expect(result["axios@1.0.0"]).toBeDefined();
});

test("extractPackageNames - should extract names from appendix keys", () => {
  const result = extractPackageNames(["lodash@4.17.21", "axios@1.0.0"]);

  expect(result).toEqual(["lodash", "axios"]);
});

test("extractPackageNames - should handle scoped packages", () => {
  const result = extractPackageNames([
    "@babel/core@7.20.0",
    "@scope/pkg@1.0.0",
  ]);

  expect(result).toEqual(["@babel/core", "@scope/pkg"]);
});

test("extractPackageNames - should handle mixed scoped and unscoped", () => {
  const result = extractPackageNames([
    "lodash@4.17.21",
    "@babel/core@7.20.0",
    "axios@1.0.0",
  ]);

  expect(result).toEqual(["lodash", "@babel/core", "axios"]);
});

test("removeOverrideKeys - should remove specified package names", () => {
  const overrides = { lodash: "4.17.21", axios: "1.0.0", react: "18.2.0" };

  const result = removeOverrideKeys(overrides, ["lodash"]);

  expect(result).toEqual({ axios: "1.0.0", react: "18.2.0" });
});
