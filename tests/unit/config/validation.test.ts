import { test, expect } from "bun:test";
import {
  validateConfig,
  safeValidateConfig,
} from "../../../src/config/constants";

test("validateConfig - should reject non-object", () => {
  expect(() => validateConfig(null)).toThrow("Invalid config structure");
  expect(() => validateConfig(undefined)).toThrow("Invalid config structure");
  expect(() => validateConfig("string")).toThrow("Invalid config structure");
  expect(() => validateConfig(123)).toThrow("Invalid config structure");
  expect(() => validateConfig([])).toThrow("Invalid config structure");
});

test("safeValidateConfig - should return undefined for non-object", () => {
  expect(safeValidateConfig(null)).toBeUndefined();
  expect(safeValidateConfig(undefined)).toBeUndefined();
  expect(safeValidateConfig("string")).toBeUndefined();
  expect(safeValidateConfig(123)).toBeUndefined();
  expect(safeValidateConfig([])).toBeUndefined();
});

test("validateConfig - should accept valid appendix with ledger", () => {
  const config = {
    appendix: {
      "lodash@4.17.21": {
        rootDeps: ["express"],
        dependents: { app: "lodash@^4.17.0" },
        patches: ["patches/lodash.patch"],
        ledger: {
          addedDate: "2024-01-01",
          reason: "Security fix",
          securityChecked: true,
          securityCheckDate: "2024-01-02",
          securityProvider: "osv",
        },
      },
    },
  };

  const result = validateConfig(config);
  expect(result).toEqual(config);
});

test("validateConfig - should reject appendix item with invalid ledger (missing addedDate)", () => {
  const config = {
    appendix: {
      "lodash@4.17.21": {
        ledger: {
          reason: "Security fix",
        },
      },
    },
  };

  expect(() => validateConfig(config)).toThrow("Invalid config structure");
});

test("validateConfig - should reject appendix item with invalid ledger fields", () => {
  const invalidConfigs = [
    {
      appendix: {
        "pkg@1.0.0": {
          ledger: {
            addedDate: "2024-01-01",
            reason: 123,
          },
        },
      },
    },
    {
      appendix: {
        "pkg@1.0.0": {
          ledger: {
            addedDate: "2024-01-01",
            securityChecked: "true",
          },
        },
      },
    },
    {
      appendix: {
        "pkg@1.0.0": {
          ledger: {
            addedDate: "2024-01-01",
            securityProvider: "invalid",
          },
        },
      },
    },
  ];

  invalidConfigs.forEach((config) => {
    expect(() => validateConfig(config)).toThrow("Invalid config structure");
  });
});

test("validateConfig - should reject appendix item with invalid fields", () => {
  const invalidConfigs = [
    {
      appendix: {
        "pkg@1.0.0": {
          rootDeps: "not-an-array",
        },
      },
    },
    {
      appendix: {
        "pkg@1.0.0": {
          rootDeps: [123, 456],
        },
      },
    },
    {
      appendix: {
        "pkg@1.0.0": {
          dependents: "not-an-object",
        },
      },
    },
    {
      appendix: {
        "pkg@1.0.0": {
          patches: "not-an-array",
        },
      },
    },
    {
      appendix: {
        "pkg@1.0.0": {
          patches: [123],
        },
      },
    },
  ];

  invalidConfigs.forEach((config) => {
    expect(() => validateConfig(config)).toThrow("Invalid config structure");
  });
});

test("validateConfig - should accept valid security config", () => {
  const config = {
    security: {
      enabled: true,
      provider: "github",
      autoFix: false,
      interactive: true,
      securityProviderToken: "token123",
      severityThreshold: "high",
      excludePackages: ["pkg1", "pkg2"],
      hasWorkspaceSecurityChecks: true,
    },
  };

  const result = validateConfig(config);
  expect(result).toEqual(config);
});

test("validateConfig - should accept security provider array", () => {
  const config = {
    security: {
      provider: ["github", "osv", "snyk"],
    },
  };

  const result = validateConfig(config);
  expect(result).toEqual(config);
});

test("validateConfig - should reject invalid security provider", () => {
  const invalidConfigs = [
    { security: { provider: "invalid" } },
    { security: { provider: ["github", "invalid"] } },
    { security: { provider: 123 } },
  ];

  invalidConfigs.forEach((config) => {
    expect(() => validateConfig(config)).toThrow("Invalid config structure");
  });
});

test("validateConfig - should reject invalid severity threshold", () => {
  const config = {
    security: {
      severityThreshold: "invalid",
    },
  };

  expect(() => validateConfig(config)).toThrow("Invalid config structure");
});

test("validateConfig - should reject invalid security config fields", () => {
  const invalidConfigs = [
    { security: { enabled: "true" } },
    { security: { autoFix: "false" } },
    { security: { interactive: 1 } },
    { security: { securityProviderToken: 123 } },
    { security: { excludePackages: "not-array" } },
    { security: { excludePackages: [123] } },
    { security: { hasWorkspaceSecurityChecks: "true" } },
  ];

  invalidConfigs.forEach((config) => {
    expect(() => validateConfig(config)).toThrow("Invalid config structure");
  });
});

test("validateConfig - should accept valid depPaths values", () => {
  const configs = [
    { depPaths: "workspace" },
    { depPaths: "workspaces" },
    { depPaths: ["packages/*/package.json", "apps/*/package.json"] },
  ];

  configs.forEach((config) => {
    const result = validateConfig(config);
    expect(result).toEqual(config);
  });
});

test("validateConfig - should reject invalid depPaths", () => {
  const invalidConfigs = [
    { depPaths: "invalid" },
    { depPaths: ["valid", 123] },
    { depPaths: 123 },
    { depPaths: {} },
  ];

  invalidConfigs.forEach((config) => {
    expect(() => validateConfig(config)).toThrow("Invalid config structure");
  });
});

test("validateConfig - should reject invalid checkSecurity type", () => {
  const config = {
    checkSecurity: "true",
  };

  expect(() => validateConfig(config)).toThrow("Invalid config structure");
});

test("validateConfig - should accept valid overridePaths", () => {
  const config = {
    overridePaths: {
      path1: {
        "pkg@1.0.0": {
          dependents: { app: "pkg@^1.0.0" },
        },
      },
    },
  };

  const result = validateConfig(config);
  expect(result).toEqual(config);
});

test("validateConfig - should reject invalid overridePaths", () => {
  const config = {
    overridePaths: {
      path1: {
        "pkg@1.0.0": {
          rootDeps: "not-array",
        },
      },
    },
  };

  expect(() => validateConfig(config)).toThrow("Invalid config structure");
});

test("validateConfig - should accept valid resolutionPaths", () => {
  const config = {
    resolutionPaths: {
      path1: {
        "pkg@1.0.0": {
          dependents: { app: "pkg@^1.0.0" },
        },
      },
    },
  };

  const result = validateConfig(config);
  expect(result).toEqual(config);
});

test("validateConfig - should reject invalid resolutionPaths", () => {
  const config = {
    resolutionPaths: {
      path1: {
        "pkg@1.0.0": {
          patches: 123,
        },
      },
    },
  };

  expect(() => validateConfig(config)).toThrow("Invalid config structure");
});

test("validateConfig - should accept all valid security providers", () => {
  const providers = ["osv", "github", "snyk", "npm", "socket"];

  providers.forEach((provider) => {
    const config = { security: { provider } };
    const result = validateConfig(config);
    expect(result).toEqual(config);
  });
});

test("validateConfig - should accept all valid severity thresholds", () => {
  const thresholds = ["low", "medium", "high", "critical"];

  thresholds.forEach((threshold) => {
    const config = { security: { severityThreshold: threshold } };
    const result = validateConfig(config);
    expect(result).toEqual(config);
  });
});

test("safeValidateConfig - should return config for all valid inputs", () => {
  const validConfigs = [
    {},
    { depPaths: "workspace" },
    { security: { provider: "github" } },
    { appendix: { "pkg@1.0.0": { dependents: {} } } },
  ];

  validConfigs.forEach((config) => {
    const result = safeValidateConfig(config);
    expect(result).toEqual(config);
  });
});

test("safeValidateConfig - should return undefined for all invalid inputs", () => {
  const invalidConfigs = [
    { security: { provider: "invalid" } },
    { depPaths: 123 },
    { appendix: { pkg: { rootDeps: "not-array" } } },
  ];

  invalidConfigs.forEach((config) => {
    const result = safeValidateConfig(config);
    expect(result).toBeUndefined();
  });
});

test("validateConfig - accepts valid cves array in ledger", () => {
  const config = {
    appendix: {
      "lodash@4.17.21": {
        ledger: {
          addedDate: "2024-01-01",
          cves: ["CVE-2021-23337", "CVE-2020-28500"],
        },
      },
    },
  };
  expect(() => validateConfig(config)).not.toThrow();
});

test("validateConfig - rejects non-array cves in ledger", () => {
  const config = {
    appendix: {
      "lodash@4.17.21": {
        ledger: {
          addedDate: "2024-01-01",
          cves: "CVE-2021-23337",
        },
      },
    },
  };
  expect(() => validateConfig(config)).toThrow();
});

test("validateConfig - accepts keep: true in ledger", () => {
  const config = {
    appendix: {
      "lodash@4.17.21": {
        ledger: {
          addedDate: "2024-01-01",
          keep: true,
        },
      },
    },
  };
  expect(() => validateConfig(config)).not.toThrow();
});

test("validateConfig - rejects non-boolean keep in ledger", () => {
  const config = {
    appendix: {
      "lodash@4.17.21": {
        ledger: {
          addedDate: "2024-01-01",
          keep: "yes",
        },
      },
    },
  };
  expect(() => validateConfig(config)).toThrow();
});

test("validateConfig - accepts potentiallyFixedIn string in ledger", () => {
  const config = {
    appendix: {
      "lodash@4.17.21": {
        ledger: {
          addedDate: "2024-01-01",
          potentiallyFixedIn: "4.18.0",
        },
      },
    },
  };
  expect(() => validateConfig(config)).not.toThrow();
});

test("validateConfig - rejects non-string potentiallyFixedIn in ledger", () => {
  const config = {
    appendix: {
      "lodash@4.17.21": {
        ledger: {
          addedDate: "2024-01-01",
          potentiallyFixedIn: 418,
        },
      },
    },
  };
  expect(() => validateConfig(config)).toThrow();
});

test("validateConfig - accepts keep as KeepConstraint object with reason", () => {
  const config = {
    appendix: {
      "lodash@4.17.21": {
        ledger: {
          addedDate: "2024-01-01",
          keep: { reason: "awaiting upstream fix", untilVersion: "4.18.0" },
        },
      },
    },
  };
  expect(() => validateConfig(config)).not.toThrow();
});

test("validateConfig - rejects keep object without reason", () => {
  const config = {
    appendix: {
      "lodash@4.17.21": {
        ledger: {
          addedDate: "2024-01-01",
          keep: { untilVersion: "4.18.0" },
        },
      },
    },
  };
  expect(() => validateConfig(config)).toThrow();
});

test("validateConfig - accepts vulnerableRange string in ledger", () => {
  const config = {
    appendix: {
      "lodash@4.17.21": {
        ledger: { addedDate: "2024-01-01", vulnerableRange: "< 4.17.21" },
      },
    },
  };
  expect(() => validateConfig(config)).not.toThrow();
});

test("validateConfig - rejects non-string vulnerableRange in ledger", () => {
  const config = {
    appendix: {
      "lodash@4.17.21": {
        ledger: { addedDate: "2024-01-01", vulnerableRange: 42 },
      },
    },
  };
  expect(() => validateConfig(config)).toThrow();
});

test("validateConfig - accepts valid securityCheckResult values", () => {
  for (const result of ["clean", "error", "skipped"] as const) {
    const config = {
      appendix: {
        "lodash@4.17.21": {
          ledger: { addedDate: "2024-01-01", securityCheckResult: result },
        },
      },
    };
    expect(() => validateConfig(config)).not.toThrow();
  }
});

test("validateConfig - rejects invalid securityCheckResult value", () => {
  const config = {
    appendix: {
      "lodash@4.17.21": {
        ledger: { addedDate: "2024-01-01", securityCheckResult: "unknown" },
      },
    },
  };
  expect(() => validateConfig(config)).toThrow();
});

test("validateConfig - accepts resolvedAt string in ledger", () => {
  const config = {
    appendix: {
      "lodash@4.17.21": {
        ledger: {
          addedDate: "2024-01-01",
          resolvedAt: "2024-06-01T00:00:00.000Z",
        },
      },
    },
  };
  expect(() => validateConfig(config)).not.toThrow();
});

test("validateConfig - accepts valid resolvedBy values", () => {
  for (const resolvedBy of ["upgrade", "not-applicable", "disputed"] as const) {
    const config = {
      appendix: {
        "lodash@4.17.21": {
          ledger: { addedDate: "2024-01-01", resolvedBy },
        },
      },
    };
    expect(() => validateConfig(config)).not.toThrow();
  }
});

test("validateConfig - rejects invalid resolvedBy value", () => {
  const config = {
    appendix: {
      "lodash@4.17.21": {
        ledger: { addedDate: "2024-01-01", resolvedBy: "deleted" },
      },
    },
  };
  expect(() => validateConfig(config)).toThrow();
});

test("validateConfig - accepts resolvedVersion string in ledger", () => {
  const config = {
    appendix: {
      "lodash@4.17.21": {
        ledger: { addedDate: "2024-01-01", resolvedVersion: "4.18.0" },
      },
    },
  };
  expect(() => validateConfig(config)).not.toThrow();
});
