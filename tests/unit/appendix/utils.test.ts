import { describe, test, expect } from "bun:test";
import type { SecurityOverrideDetail } from "../../../src/interfaces";
import {
  mergeOverrideReasons,
  createSecurityLedger,
} from "../../../src/appendix/utils";

describe("appendix/utils", () => {
  describe("mergeOverrideReasons", () => {
    test("should return reason when provided", () => {
      const result = mergeOverrideReasons(
        "lodash",
        "security fix",
        undefined,
        undefined
      );

      expect(result).toBe("security fix");
    });

    test("should return security reason when no reason provided", () => {
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
        undefined
      );

      expect(result).toBe("CVE-2021-23337");
    });

    test("should return manual reason when no reason or security details", () => {
      const manualReasons = { lodash: "manual override" };

      const result = mergeOverrideReasons(
        "lodash",
        undefined,
        undefined,
        manualReasons
      );

      expect(result).toBe("manual override");
    });

    test("should return undefined when no reasons provided", () => {
      const result = mergeOverrideReasons(
        "lodash",
        undefined,
        undefined,
        undefined
      );

      expect(result).toBeUndefined();
    });

    test("should prioritize reason over security details", () => {
      const securityDetails: SecurityOverrideDetail[] = [
        { packageName: "lodash", reason: "CVE-2021-23337", cve: "CVE-2021-23337", severity: "high" },
      ];

      const result = mergeOverrideReasons(
        "lodash",
        "manual fix",
        securityDetails,
        undefined
      );

      expect(result).toBe("manual fix");
    });

    test("should prioritize security details over manual reasons", () => {
      const securityDetails: SecurityOverrideDetail[] = [
        { packageName: "lodash", reason: "CVE-2021-23337", cve: "CVE-2021-23337", severity: "high" },
      ];
      const manualReasons = { lodash: "manual override" };

      const result = mergeOverrideReasons(
        "lodash",
        undefined,
        securityDetails,
        manualReasons
      );

      expect(result).toBe("CVE-2021-23337");
    });
  });

  describe("createSecurityLedger", () => {
    test("should return empty object when no security details", () => {
      const result = createSecurityLedger("lodash", undefined, undefined);

      expect(result).toEqual({});
    });

    test("should return empty object when package not in security details", () => {
      const securityDetails: SecurityOverrideDetail[] = [
        { packageName: "axios", reason: "CVE-2021-1234", cve: "CVE-2021-1234", severity: "high" },
      ];

      const result = createSecurityLedger("lodash", securityDetails, undefined);

      expect(result).toEqual({});
    });

    test("should create basic security ledger", () => {
      const securityDetails: SecurityOverrideDetail[] = [
        { packageName: "lodash", reason: "CVE-2021-23337", cve: "CVE-2021-23337", severity: "high" },
      ];

      const result = createSecurityLedger("lodash", securityDetails, undefined);

      expect(result).toHaveProperty("securityChecked", true);
      expect(result).toHaveProperty("securityCheckDate");
    });

    test("should include provider in ledger", () => {
      const securityDetails: SecurityOverrideDetail[] = [
        { packageName: "lodash", reason: "CVE-2021-23337", cve: "CVE-2021-23337", severity: "high" },
      ];

      const result = createSecurityLedger("lodash", securityDetails, "github");

      expect(result).toHaveProperty("securityProvider", "github");
    });

    test("should include CVE in ledger", () => {
      const securityDetails: SecurityOverrideDetail[] = [
        { packageName: "lodash", reason: "CVE-2021-23337", cve: "CVE-2021-23337", severity: "high" },
      ];

      const result = createSecurityLedger("lodash", securityDetails, undefined);

      expect(result).toHaveProperty("cve", "CVE-2021-23337");
    });

    test("should include severity in ledger", () => {
      const securityDetails: SecurityOverrideDetail[] = [
        { packageName: "lodash", reason: "CVE-2021-23337", cve: "CVE-2021-23337", severity: "high" },
      ];

      const result = createSecurityLedger("lodash", securityDetails, undefined);

      expect(result).toHaveProperty("severity", "high");
    });

    test("should include description in ledger", () => {
      const securityDetails: SecurityOverrideDetail[] = [
        {
          packageName: "lodash",
          reason: "CVE-2021-23337",
          cve: "CVE-2021-23337",
          severity: "high",
          description: "Prototype pollution",
        },
      ];

      const result = createSecurityLedger("lodash", securityDetails, undefined);

      expect(result).toHaveProperty("description", "Prototype pollution");
    });

    test("should include URL in ledger", () => {
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

      expect(result).toHaveProperty("url", "https://nvd.nist.gov/vuln/detail/CVE-2021-23337");
    });

    test("should include all fields when provided", () => {
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
        description: "Prototype pollution",
        url: "https://nvd.nist.gov/vuln/detail/CVE-2021-23337",
      });
    });
  });
});
