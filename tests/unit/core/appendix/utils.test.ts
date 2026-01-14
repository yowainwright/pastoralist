import { test, expect } from "bun:test";
import type { SecurityOverrideDetail, Appendix } from "../../../../src/types";
import {
  mergeOverrideReasons,
  createSecurityLedger,
  toCompactAppendix,
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
