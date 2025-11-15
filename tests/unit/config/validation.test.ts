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
