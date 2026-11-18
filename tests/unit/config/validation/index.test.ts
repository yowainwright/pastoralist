import { errorIncludes } from "../../setup";
import { test } from "node:test";
import assert from "node:assert/strict";
import schema from "../../../../src/schema.json" with { type: "json" };
import {
  PASTORALIST_SCHEMA_PATH,
  validateConfig,
  safeValidateConfig,
} from "../../../../src/config";
const unknownSecuritySettings = { unknownSecurity: true };
const numericDependents = { root: 42 };
const numericDependentsEntry = { dependents: numericDependents };
const numericDependentsAppendix = { "pkg@1.0.0": numericDependentsEntry };
const unknownFieldEntry = { unknownItemField: true };
const unknownFieldAppendix = { "pkg@1.0.0": unknownFieldEntry };
const numericSeverityLedger = { addedDate: "2026-08-16", severity: 42 };
const numericSeverityEntry = { ledger: numericSeverityLedger };
const numericSeverityAppendix = { "pkg@1.0.0": numericSeverityEntry };
const unknownFieldLedger = { addedDate: "2026-08-16", unknownLedgerField: true };
const unknownLedgerFieldEntry = { ledger: unknownFieldLedger };
const unknownLedgerFieldAppendix = { "pkg@1.0.0": unknownLedgerFieldEntry };
const unknownKeepConstraint = { reason: "compatibility", until: 42 };
const unknownKeepLedger = { addedDate: "2026-08-16", keep: unknownKeepConstraint };
const unknownKeepEntry = {
  ledger: unknownKeepLedger,
};
const unknownKeepAppendix = {
  "pkg@1.0.0": unknownKeepEntry,
};
const incompleteCveDetails = [{ severity: "high" }];
const incompleteCveLedger = { addedDate: "2026-08-16", cveDetails: incompleteCveDetails };
const incompleteCveEntry = { ledger: incompleteCveLedger };
const incompleteCveAppendix = {
  "pkg@1.0.0": incompleteCveEntry,
};
const COMPATIBILITY_CONFIGS = [
  { unknownRoot: true },
  { $schema: "https://example.com/config.schema.json", unknownRoot: true },
  { compactAppendix: "yes" },
  { security: unknownSecuritySettings },
  { appendix: numericDependentsAppendix },
  { appendix: unknownFieldAppendix },
  { appendix: numericSeverityAppendix },
  { appendix: unknownLedgerFieldAppendix },
  {
    appendix: unknownKeepAppendix,
  },
  {
    appendix: incompleteCveAppendix,
  },
];

["npm", "PyPI"].forEach((ecosystem) => {
  test(`validateConfig - accepts ${ecosystem} appendix ownership in strict mode`, () => {
    const item = { addedDate: "2026-11-16", ecosystem };
    const appendix = { "pkg@1": item };
    const config = { $schema: PASTORALIST_SCHEMA_PATH, appendix };
    assert.deepStrictEqual(validateConfig(config), config);
    assert.deepStrictEqual(schema.$defs.appendixItem.properties.ecosystem.enum, ["npm", "PyPI"]);
  });
});

test("validateConfig - rejects unsupported appendix ecosystems", () => {
  const item = { addedDate: "2026-11-16", ecosystem: "unsupported" };
  const appendix = { "pkg@1": item };
  const config = { appendix };
  assert.strictEqual(safeValidateConfig(config), undefined);
  const strictConfig = Object.assign({}, config, { $schema: PASTORALIST_SCHEMA_PATH });
  assert.strictEqual(safeValidateConfig(strictConfig), undefined);
});
test("validateConfig - should reject non-object", () => {
  assert.throws(() => validateConfig(null), errorIncludes("Invalid config structure"));
  assert.throws(() => validateConfig(undefined), errorIncludes("Invalid config structure"));
  assert.throws(() => validateConfig("string"), errorIncludes("Invalid config structure"));
  assert.throws(() => validateConfig(123), errorIncludes("Invalid config structure"));
  assert.throws(() => validateConfig([]), errorIncludes("Invalid config structure"));
});
test("safeValidateConfig - should return undefined for non-object", () => {
  assert.strictEqual(safeValidateConfig(null), undefined);
  assert.strictEqual(safeValidateConfig(undefined), undefined);
  assert.strictEqual(safeValidateConfig("string"), undefined);
  assert.strictEqual(safeValidateConfig(123), undefined);
  assert.strictEqual(safeValidateConfig([]), undefined);
});
const schemaProviders = ["osv", "github"];
const schemaSecurity = {
  provider: schemaProviders,
  severityThreshold: "high",
};
const schemaDependents = { root: "lodash@^4.17.0" };
const schemaCveDetails = [{ cve: "CVE-2026-0001", severity: "high" }];
const schemaSources = ["osv", "github"];
const schemaLedger = {
  addedDate: "2026-08-16",
  source: "security",
  cveDetails: schemaCveDetails,
  confidence: "confirmed",
  sources: schemaSources,
};
const schemaEntry = {
  dependents: schemaDependents,
  ledger: schemaLedger,
};
const schemaAppendix = {
  "lodash@4.17.21": schemaEntry,
};
const schemaReferenceConfig = {
  $schema: PASTORALIST_SCHEMA_PATH,
  compactAppendix: true,
  security: schemaSecurity,
  appendix: schemaAppendix,
};
test("validateConfig - accepts a JSON Schema reference", () => {
  assert.deepStrictEqual(validateConfig(schemaReferenceConfig), schemaReferenceConfig);
});
test("validateConfig - rejects a non-string JSON Schema reference", () => {
  assert.throws(() => validateConfig({ $schema: true }), errorIncludes("Invalid config structure"));
});
test("schema - includes public history metadata", () => {
  assert.strictEqual(schema["x-revision"], 1);
  assert.strictEqual(schema["x-created"], "2025-11-23");
  assert.strictEqual(schema["x-updated"], "2026-08-16");
  assert.strictEqual(
    schema["x-history"],
    "https://github.com/yowainwright/pastoralist/commits/main/src/schema.json",
  );
});
test("validateConfig - preserves permissive validation for schema-less configs", () => {
  COMPATIBILITY_CONFIGS.forEach((config) => {
    assert.deepStrictEqual(validateConfig(config), config);
  });
});
test("validateConfig - enforces the published contract for schema-aware configs", () => {
  const invalidConfigs = COMPATIBILITY_CONFIGS.map((config) => {
    const schemaConfig = Object.assign({}, config, { $schema: PASTORALIST_SCHEMA_PATH });
    return schemaConfig;
  });
  invalidConfigs.forEach((config) => {
    assert.throws(() => validateConfig(config), errorIncludes("Invalid config structure"));
  });
});
const validRootDependencies = ["express"];
const validDependents = { app: "lodash@^4.17.0" };
const validPatches = ["patches/lodash.patch"];
const validLedger = {
  addedDate: "2024-01-01",
  reason: "Security fix",
  securityChecked: true,
  securityCheckDate: "2024-01-02",
  securityProvider: "osv",
};
const validEntry = {
  rootDeps: validRootDependencies,
  dependents: validDependents,
  patches: validPatches,
  ledger: validLedger,
};
const validAppendix = {
  "lodash@4.17.21": validEntry,
};
const validLedgerConfig = {
  appendix: validAppendix,
};
test("validateConfig - should accept valid appendix with ledger", () => {
  const result = validateConfig(validLedgerConfig);
  assert.deepStrictEqual(result, validLedgerConfig);
});
const compactDateEntry = { addedDate: "2024-01-01" };
const compactDateAppendix = {
  "lodash@4.17.21": compactDateEntry,
};
const compactDateConfig = {
  appendix: compactDateAppendix,
};
const numericDateEntry = { addedDate: 20240101 };
const numericDateAppendix = {
  "lodash@4.17.21": numericDateEntry,
};
const numericDateConfig = {
  appendix: numericDateAppendix,
};
test("validateConfig - validates compact appendix added dates", () => {
  assert.deepStrictEqual(validateConfig(compactDateConfig), compactDateConfig);
  assert.throws(() => validateConfig(numericDateConfig), errorIncludes("Invalid config structure"));
});
const projectConstraints = ["Node 20"];
const projectReferences = ["https://example.com/regression"];
const projectReason = {
  type: "project",
  summary: "Pinned while the upstream regression is unresolved",
  pin: "4.17.21",
  patch: "patches/lodash.patch",
  constraints: projectConstraints,
  references: projectReferences,
};
const bestCaseSearch = { evaluatedStates: 12, provenOptimal: true };
const bestCaseImpact = {
  fixedVulnerabilities: 3,
  introducedVulnerabilities: 0,
  remainingVulnerabilities: 1,
};
const bestCaseReason = {
  type: "best-case",
  summary: "Selected as part of the lowest-risk dependency portfolio",
  decisionId: "best-case-abc123",
  policyHash: "def456",
  search: bestCaseSearch,
  impact: bestCaseImpact,
};
const projectLedger = {
  addedDate: "2024-01-01",
  reason: projectReason,
};
const projectEntry = {
  ledger: projectLedger,
};
const bestCaseLedger = {
  addedDate: "2024-01-01",
  reason: bestCaseReason,
};
const bestCaseEntry = {
  ledger: bestCaseLedger,
};
const structuredReasonAppendix = {
  "lodash@4.17.21": projectEntry,
  "minimist@1.2.8": bestCaseEntry,
};
const structuredReasonConfig = {
  appendix: structuredReasonAppendix,
};
test("validateConfig - accepts project and best-case ledger reasons", () => {
  assert.deepStrictEqual(validateConfig(structuredReasonConfig), structuredReasonConfig);
});
const malformedReasonCves = ["CVE-2024-0001"];
const negativeEvaluatedStates = -1;
const invalidReasonSearch = {
  evaluatedStates: negativeEvaluatedStates,
  provenOptimal: true,
};
const invalidReasonImpact = {
  fixedVulnerabilities: 1,
  introducedVulnerabilities: 0,
  remainingVulnerabilities: 0,
};
const malformedReasons = [
  "",
  { type: "project", summary: "" },
  { type: "project", summary: "Pin", cves: malformedReasonCves },
  { type: "best-case", summary: "Choice", decisionId: "id", policyHash: "hash" },
  {
    type: "best-case",
    summary: "Choice",
    decisionId: "id",
    policyHash: "hash",
    search: invalidReasonSearch,
    impact: invalidReasonImpact,
  },
];
test("validateConfig - rejects malformed structured ledger reasons", () => {
  malformedReasons.forEach((reason) => {
    const malformedReasonLedger = { addedDate: "2024-01-01", reason };
    const malformedReasonEntry = { ledger: malformedReasonLedger };
    const malformedReasonAppendix = { "pkg@1.0.0": malformedReasonEntry };
    const config = {
      appendix: malformedReasonAppendix,
    };
    assert.throws(() => validateConfig(config), errorIncludes("Invalid config structure"));
  });
});
const missingDateLedger = {
  reason: "Security fix",
};
const missingDateEntry = {
  ledger: missingDateLedger,
};
const missingDateAppendix = {
  "lodash@4.17.21": missingDateEntry,
};
const missingDateConfig = {
  appendix: missingDateAppendix,
};
test("validateConfig - should reject appendix item with invalid ledger (missing addedDate)", () => {
  assert.throws(() => validateConfig(missingDateConfig), errorIncludes("Invalid config structure"));
});
const numericReasonLedger = {
  addedDate: "2024-01-01",
  reason: 123,
};
const numericReasonEntry = {
  ledger: numericReasonLedger,
};
const numericReasonAppendix = {
  "pkg@1.0.0": numericReasonEntry,
};
const stringCheckedLedger = {
  addedDate: "2024-01-01",
  securityChecked: "true",
};
const stringCheckedEntry = {
  ledger: stringCheckedLedger,
};
const stringCheckedAppendix = {
  "pkg@1.0.0": stringCheckedEntry,
};
const invalidProviderLedger = {
  addedDate: "2024-01-01",
  securityProvider: "invalid",
};
const invalidProviderEntry = {
  ledger: invalidProviderLedger,
};
const invalidProviderAppendix = {
  "pkg@1.0.0": invalidProviderEntry,
};
const invalidLedgerConfigs = [
  {
    appendix: numericReasonAppendix,
  },
  {
    appendix: stringCheckedAppendix,
  },
  {
    appendix: invalidProviderAppendix,
  },
];
test("validateConfig - should reject appendix item with invalid ledger fields", () => {
  invalidLedgerConfigs.forEach((config) => {
    assert.throws(() => validateConfig(config), errorIncludes("Invalid config structure"));
  });
});
const stringRootDepsEntry = {
  rootDeps: "not-an-array",
};
const stringRootDepsAppendix = {
  "pkg@1.0.0": stringRootDepsEntry,
};
const numericRootDeps = [123, 456];
const numericRootDepsEntry = {
  rootDeps: numericRootDeps,
};
const numericRootDepsAppendix = {
  "pkg@1.0.0": numericRootDepsEntry,
};
const stringDependentsEntry = {
  dependents: "not-an-object",
};
const stringDependentsAppendix = {
  "pkg@1.0.0": stringDependentsEntry,
};
const stringPatchesEntry = {
  patches: "not-an-array",
};
const stringPatchesAppendix = {
  "pkg@1.0.0": stringPatchesEntry,
};
const numericPatches = [123];
const numericPatchesEntry = {
  patches: numericPatches,
};
const numericPatchesAppendix = {
  "pkg@1.0.0": numericPatchesEntry,
};
const invalidEntryConfigs = [
  {
    appendix: stringRootDepsAppendix,
  },
  {
    appendix: numericRootDepsAppendix,
  },
  {
    appendix: stringDependentsAppendix,
  },
  {
    appendix: stringPatchesAppendix,
  },
  {
    appendix: numericPatchesAppendix,
  },
];
test("validateConfig - should reject appendix item with invalid fields", () => {
  invalidEntryConfigs.forEach((config) => {
    assert.throws(() => validateConfig(config), errorIncludes("Invalid config structure"));
  });
});
const excludedPackages = ["pkg1", "pkg2"];
const validSecurity = {
  enabled: true,
  provider: "github",
  autoFix: false,
  interactive: true,
  securityProviderToken: "token123",
  severityThreshold: "high",
  excludePackages: excludedPackages,
  hasWorkspaceSecurityChecks: true,
};
const validSecurityConfig = {
  security: validSecurity,
};
test("validateConfig - should accept valid security config", () => {
  const result = validateConfig(validSecurityConfig);
  assert.deepStrictEqual(result, validSecurityConfig);
});
const userOwnedOverrides = ["alpha", "@scope/beta"];
const searchObjectives = ["critical", "high", "package-exposures", "change-count"];
const tunableSearch = {
  mode: "auto",
  exactStateLimit: 256,
  beamWidth: 16,
  maxEvaluations: 1000,
};
const tunableBestCase = {
  enabled: true,
  userOwnedOverrides: userOwnedOverrides,
  riskAggregation: "both",
  objectives: searchObjectives,
  search: tunableSearch,
};
const tunableSearchConfig = {
  bestCase: tunableBestCase,
};
test("validateConfig - accepts tunable best-case search config", () => {
  assert.deepStrictEqual(validateConfig(tunableSearchConfig), tunableSearchConfig);
});
const invalidRiskAggregation = { riskAggregation: "average" };
const emptyObjectives: string[] = [];
const emptyObjectivesCase = {
  objectives: emptyObjectives,
};
const duplicateObjectives = ["critical", "critical"];
const duplicateObjectivesCase = {
  objectives: duplicateObjectives,
};
const emptyOverrideNames = [""];
const emptyOverrideNamesCase = {
  userOwnedOverrides: emptyOverrideNames,
};
const duplicateOverrides = ["alpha", "alpha"];
const duplicateOverridesCase = {
  userOwnedOverrides: duplicateOverrides,
};
const randomSearch = { mode: "random" };
const randomSearchCase = {
  search: randomSearch,
};
const zeroStateSearch = { exactStateLimit: 0 };
const zeroStateSearchCase = {
  search: zeroStateSearch,
};
const negativeBeamWidth = -1;
const negativeBeamSearch = {
  beamWidth: negativeBeamWidth,
};
const negativeBeamSearchCase = {
  search: negativeBeamSearch,
};
const fractionalSearch = { maxEvaluations: 1.5 };
const fractionalSearchCase = {
  search: fractionalSearch,
};
const invalidSearchConfigs = [
  { bestCase: invalidRiskAggregation },
  { bestCase: emptyObjectivesCase },
  { bestCase: duplicateObjectivesCase },
  { bestCase: emptyOverrideNamesCase },
  { bestCase: duplicateOverridesCase },
  { bestCase: randomSearchCase },
  { bestCase: zeroStateSearchCase },
  { bestCase: negativeBeamSearchCase },
  { bestCase: fractionalSearchCase },
];
test("validateConfig - rejects invalid best-case search config", () => {
  invalidSearchConfigs.forEach((config) => {
    assert.throws(() => validateConfig(config), errorIncludes("Invalid config structure"));
  });
});
const multipleProviders = ["github", "osv", "snyk"];
const multipleProviderSettings = {
  provider: multipleProviders,
};
const multipleProviderConfig = {
  security: multipleProviderSettings,
};
test("validateConfig - should accept security provider array", () => {
  const result = validateConfig(multipleProviderConfig);
  assert.deepStrictEqual(result, multipleProviderConfig);
});
const unknownProviderSettings = { provider: "invalid" };
const mixedProviders = ["github", "invalid"];
const mixedProviderSettings = { provider: mixedProviders };
const numericProviderSettings = { provider: 123 };
const invalidProviderConfigs = [
  { security: unknownProviderSettings },
  { security: mixedProviderSettings },
  { security: numericProviderSettings },
];
test("validateConfig - should reject invalid security provider", () => {
  invalidProviderConfigs.forEach((config) => {
    assert.throws(() => validateConfig(config), errorIncludes("Invalid config structure"));
  });
});
const invalidThresholdSettings = {
  severityThreshold: "invalid",
};
const invalidThresholdConfig = {
  security: invalidThresholdSettings,
};
test("validateConfig - should reject invalid severity threshold", () => {
  assert.throws(
    () => validateConfig(invalidThresholdConfig),
    errorIncludes("Invalid config structure"),
  );
});
const stringEnabledSettings = { enabled: "true" };
const stringAutoFixSettings = { autoFix: "false" };
const numericInteractiveSettings = { interactive: 1 };
const numericTokenSettings = { securityProviderToken: 123 };
const stringExclusionsSettings = { excludePackages: "not-array" };
const numericExclusions = [123];
const numericExclusionsSettings = {
  excludePackages: numericExclusions,
};
const stringWorkspaceChecks = { hasWorkspaceSecurityChecks: "true" };
const invalidSecurityConfigs = [
  { security: stringEnabledSettings },
  { security: stringAutoFixSettings },
  { security: numericInteractiveSettings },
  { security: numericTokenSettings },
  { security: stringExclusionsSettings },
  { security: numericExclusionsSettings },
  { security: stringWorkspaceChecks },
];
test("validateConfig - should reject invalid security config fields", () => {
  invalidSecurityConfigs.forEach((config) => {
    assert.throws(() => validateConfig(config), errorIncludes("Invalid config structure"));
  });
});
const workspacePatterns = ["packages/*/package.json", "apps/*/package.json"];
const validDepPathConfigs = [
  { depPaths: "workspace" },
  { depPaths: "workspaces" },
  { depPaths: workspacePatterns },
];
test("validateConfig - should accept valid depPaths values", () => {
  validDepPathConfigs.forEach((config) => {
    const result = validateConfig(config);
    assert.deepStrictEqual(result, config);
  });
});
const mixedDepPaths = ["valid", 123];
const objectDepPaths = {};
const invalidDepPathConfigs = [
  { depPaths: "invalid" },
  { depPaths: mixedDepPaths },
  { depPaths: 123 },
  { depPaths: objectDepPaths },
];
test("validateConfig - should reject invalid depPaths", () => {
  invalidDepPathConfigs.forEach((config) => {
    assert.throws(() => validateConfig(config), errorIncludes("Invalid config structure"));
  });
});
const stringCheckSecurityConfig = {
  checkSecurity: "true",
};
test("validateConfig - should reject invalid checkSecurity type", () => {
  assert.throws(
    () => validateConfig(stringCheckSecurityConfig),
    errorIncludes("Invalid config structure"),
  );
});
const explicitOverrideSourceConfig = { overrideSource: "config/pnpm-overrides.yaml" };
test("validateConfig - should accept an explicit override source", () => {
  assert.deepStrictEqual(
    validateConfig(explicitOverrideSourceConfig),
    explicitOverrideSourceConfig,
  );
});
test("validateConfig - should reject a non-string override source", () => {
  const overrideSource = ["pnpm-workspace.yaml"];
  assert.throws(
    () => validateConfig({ overrideSource }),
    errorIncludes("Invalid config structure"),
  );
});
const explicitAppendixSourceConfig = { appendixSource: "config/ledger.json" };
test("validateConfig - should accept an explicit appendix source", () => {
  assert.deepStrictEqual(
    validateConfig(explicitAppendixSourceConfig),
    explicitAppendixSourceConfig,
  );
});
test("validateConfig - should reject a non-string appendix source", () => {
  const appendixSource = ["ledger.json"];
  assert.throws(
    () => validateConfig({ appendixSource }),
    errorIncludes("Invalid config structure"),
  );
});
const overridePathDependents = { app: "pkg@^1.0.0" };
const overridePathEntry = {
  dependents: overridePathDependents,
};
const overridePathAppendix = {
  "pkg@1.0.0": overridePathEntry,
};
const validOverridePaths = {
  path1: overridePathAppendix,
};
const validOverridePathsConfig = {
  overridePaths: validOverridePaths,
};
test("validateConfig - should accept valid overridePaths", () => {
  const result = validateConfig(validOverridePathsConfig);
  assert.deepStrictEqual(result, validOverridePathsConfig);
});
const invalidOverridePathEntry = {
  rootDeps: "not-array",
};
const invalidOverridePathAppendix = {
  "pkg@1.0.0": invalidOverridePathEntry,
};
const invalidOverridePaths = {
  path1: invalidOverridePathAppendix,
};
const invalidOverridePathsConfig = {
  overridePaths: invalidOverridePaths,
};
test("validateConfig - should reject invalid overridePaths", () => {
  assert.throws(
    () => validateConfig(invalidOverridePathsConfig),
    errorIncludes("Invalid config structure"),
  );
});
const resolutionPathDependents = { app: "pkg@^1.0.0" };
const resolutionPathEntry = {
  dependents: resolutionPathDependents,
};
const resolutionPathAppendix = {
  "pkg@1.0.0": resolutionPathEntry,
};
const validResolutionPaths = {
  path1: resolutionPathAppendix,
};
const validResolutionPathsConfig = {
  resolutionPaths: validResolutionPaths,
};
test("validateConfig - should accept valid resolutionPaths", () => {
  const result = validateConfig(validResolutionPathsConfig);
  assert.deepStrictEqual(result, validResolutionPathsConfig);
});
const invalidResolutionPathEntry = {
  patches: 123,
};
const invalidResolutionPathAppendix = {
  "pkg@1.0.0": invalidResolutionPathEntry,
};
const invalidResolutionPaths = {
  path1: invalidResolutionPathAppendix,
};
const invalidResolutionPathsConfig = {
  resolutionPaths: invalidResolutionPaths,
};
test("validateConfig - should reject invalid resolutionPaths", () => {
  assert.throws(
    () => validateConfig(invalidResolutionPathsConfig),
    errorIncludes("Invalid config structure"),
  );
});
const validProviders = ["osv", "github", "snyk", "npm", "socket"];
test("validateConfig - should accept all valid security providers", () => {
  validProviders.forEach((provider) => {
    const providerSettings = { provider };
    const config = { security: providerSettings };
    const result = validateConfig(config);
    assert.deepStrictEqual(result, config);
  });
});
const validThresholds = ["low", "medium", "high", "critical"];
test("validateConfig - should accept all valid severity thresholds", () => {
  validThresholds.forEach((threshold) => {
    const thresholdSettings = { severityThreshold: threshold };
    const config = { security: thresholdSettings };
    const result = validateConfig(config);
    assert.deepStrictEqual(result, config);
  });
});
const safeValidSecurity = { provider: "github" };
const safeValidDependents = {};
const safeValidEntry = {
  dependents: safeValidDependents,
};
const safeValidAppendix = {
  "pkg@1.0.0": safeValidEntry,
};
const safeValidConfigs = [
  {},
  { depPaths: "workspace" },
  { security: safeValidSecurity },
  { appendix: safeValidAppendix },
];
test("safeValidateConfig - should return config for all valid inputs", () => {
  safeValidConfigs.forEach((config) => {
    const result = safeValidateConfig(config);
    assert.deepStrictEqual(result, config);
  });
});
const safeInvalidSecurity = { provider: "invalid" };
const safeInvalidEntry = { rootDeps: "not-array" };
const safeInvalidAppendix = { pkg: safeInvalidEntry };
const safeInvalidConfigs = [
  { security: safeInvalidSecurity },
  { depPaths: 123 },
  { appendix: safeInvalidAppendix },
];
test("safeValidateConfig - should return undefined for all invalid inputs", () => {
  safeInvalidConfigs.forEach((config) => {
    const result = safeValidateConfig(config);
    assert.strictEqual(result, undefined);
  });
});
const validCves = ["CVE-2021-23337", "CVE-2020-28500"];
const cveLedger = {
  addedDate: "2024-01-01",
  cves: validCves,
};
const cveEntry = {
  ledger: cveLedger,
};
const cveAppendix = {
  "lodash@4.17.21": cveEntry,
};
const cveConfig = {
  appendix: cveAppendix,
};
test("validateConfig - accepts valid cves array in ledger", () => {
  assert.doesNotThrow(() => validateConfig(cveConfig));
});
const stringCveLedger = {
  addedDate: "2024-01-01",
  cves: "CVE-2021-23337",
};
const stringCveEntry = {
  ledger: stringCveLedger,
};
const stringCveAppendix = {
  "lodash@4.17.21": stringCveEntry,
};
const stringCveConfig = {
  appendix: stringCveAppendix,
};
test("validateConfig - rejects non-array cves in ledger", () => {
  assert.throws(() => validateConfig(stringCveConfig));
});
const keptLedger = {
  addedDate: "2024-01-01",
  keep: true,
};
const keptEntry = {
  ledger: keptLedger,
};
const keptAppendix = {
  "lodash@4.17.21": keptEntry,
};
const keptConfig = {
  appendix: keptAppendix,
};
test("validateConfig - accepts keep: true in ledger", () => {
  assert.doesNotThrow(() => validateConfig(keptConfig));
});
const stringKeepLedger = {
  addedDate: "2024-01-01",
  keep: "yes",
};
const stringKeepEntry = {
  ledger: stringKeepLedger,
};
const stringKeepAppendix = {
  "lodash@4.17.21": stringKeepEntry,
};
const stringKeepConfig = {
  appendix: stringKeepAppendix,
};
test("validateConfig - rejects non-boolean keep in ledger", () => {
  assert.throws(() => validateConfig(stringKeepConfig));
});
const potentialFixLedger = {
  addedDate: "2024-01-01",
  potentiallyFixedIn: "4.18.0",
};
const potentialFixEntry = {
  ledger: potentialFixLedger,
};
const potentialFixAppendix = {
  "lodash@4.17.21": potentialFixEntry,
};
const potentialFixConfig = {
  appendix: potentialFixAppendix,
};
test("validateConfig - accepts potentiallyFixedIn string in ledger", () => {
  assert.doesNotThrow(() => validateConfig(potentialFixConfig));
});
const numericFixVersionLedger = {
  addedDate: "2024-01-01",
  potentiallyFixedIn: 418,
};
const numericFixVersionEntry = {
  ledger: numericFixVersionLedger,
};
const numericFixVersionAppendix = {
  "lodash@4.17.21": numericFixVersionEntry,
};
const numericFixVersionConfig = {
  appendix: numericFixVersionAppendix,
};
test("validateConfig - rejects non-string potentiallyFixedIn in ledger", () => {
  assert.throws(() => validateConfig(numericFixVersionConfig));
});
const keepConstraint = {
  reason: "awaiting upstream fix",
  untilVersion: "4.18.0",
};
const constrainedKeepLedger = {
  addedDate: "2024-01-01",
  keep: keepConstraint,
};
const constrainedKeepEntry = {
  ledger: constrainedKeepLedger,
};
const constrainedKeepAppendix = {
  "lodash@4.17.21": constrainedKeepEntry,
};
const constrainedKeepConfig = {
  appendix: constrainedKeepAppendix,
};
test("validateConfig - accepts keep as KeepConstraint object with reason", () => {
  assert.doesNotThrow(() => validateConfig(constrainedKeepConfig));
});
const missingKeepReason = { untilVersion: "4.18.0" };
const missingKeepReasonLedger = {
  addedDate: "2024-01-01",
  keep: missingKeepReason,
};
const missingKeepReasonEntry = {
  ledger: missingKeepReasonLedger,
};
const missingKeepReasonAppendix = {
  "lodash@4.17.21": missingKeepReasonEntry,
};
const missingKeepReasonConfig = {
  appendix: missingKeepReasonAppendix,
};
test("validateConfig - rejects keep object without reason", () => {
  assert.throws(() => validateConfig(missingKeepReasonConfig));
});
const vulnerableRangeLedger = {
  addedDate: "2024-01-01",
  vulnerableRange: "< 4.17.21",
};
const vulnerableRangeEntry = {
  ledger: vulnerableRangeLedger,
};
const vulnerableRangeAppendix = {
  "lodash@4.17.21": vulnerableRangeEntry,
};
const vulnerableRangeConfig = {
  appendix: vulnerableRangeAppendix,
};
test("validateConfig - accepts vulnerableRange string in ledger", () => {
  assert.doesNotThrow(() => validateConfig(vulnerableRangeConfig));
});
const numericRangeLedger = {
  addedDate: "2024-01-01",
  vulnerableRange: 42,
};
const numericRangeEntry = {
  ledger: numericRangeLedger,
};
const numericRangeAppendix = {
  "lodash@4.17.21": numericRangeEntry,
};
const numericRangeConfig = {
  appendix: numericRangeAppendix,
};
test("validateConfig - rejects non-string vulnerableRange in ledger", () => {
  assert.throws(() => validateConfig(numericRangeConfig));
});
test("validateConfig - accepts valid securityCheckResult values", () => {
  for (const result of ["clean", "error", "skipped"] as const) {
    const securityResultLedger = { addedDate: "2024-01-01", securityCheckResult: result };
    const securityResultEntry = {
      ledger: securityResultLedger,
    };
    const securityResultAppendix = {
      "lodash@4.17.21": securityResultEntry,
    };
    const config = {
      appendix: securityResultAppendix,
    };
    assert.doesNotThrow(() => validateConfig(config));
  }
});
const unknownSecurityResultLedger = {
  addedDate: "2024-01-01",
  securityCheckResult: "unknown",
};
const unknownSecurityResultEntry = {
  ledger: unknownSecurityResultLedger,
};
const unknownSecurityResultAppendix = {
  "lodash@4.17.21": unknownSecurityResultEntry,
};
const unknownSecurityResultConfig = {
  appendix: unknownSecurityResultAppendix,
};
test("validateConfig - rejects invalid securityCheckResult value", () => {
  assert.throws(() => validateConfig(unknownSecurityResultConfig));
});
const resolvedAtLedger = {
  addedDate: "2024-01-01",
  resolvedAt: "2024-06-01T00:00:00.000Z",
};
const resolvedAtEntry = {
  ledger: resolvedAtLedger,
};
const resolvedAtAppendix = {
  "lodash@4.17.21": resolvedAtEntry,
};
const resolvedAtConfig = {
  appendix: resolvedAtAppendix,
};
test("validateConfig - accepts resolvedAt string in ledger", () => {
  assert.doesNotThrow(() => validateConfig(resolvedAtConfig));
});
test("validateConfig - accepts valid resolvedBy values", () => {
  for (const resolvedBy of ["upgrade", "not-applicable", "disputed"] as const) {
    const validResolvedLedger = { addedDate: "2024-01-01", resolvedBy };
    const validResolvedEntry = {
      ledger: validResolvedLedger,
    };
    const validResolvedAppendix = {
      "lodash@4.17.21": validResolvedEntry,
    };
    const config = {
      appendix: validResolvedAppendix,
    };
    assert.doesNotThrow(() => validateConfig(config));
  }
});
const invalidResolvedByLedger = { addedDate: "2024-01-01", resolvedBy: "deleted" };
const invalidResolvedByEntry = {
  ledger: invalidResolvedByLedger,
};
const invalidResolvedByAppendix = {
  "lodash@4.17.21": invalidResolvedByEntry,
};
const invalidResolvedByConfig = {
  appendix: invalidResolvedByAppendix,
};
test("validateConfig - rejects invalid resolvedBy value", () => {
  assert.throws(() => validateConfig(invalidResolvedByConfig));
});
const resolvedVersionLedger = {
  addedDate: "2024-01-01",
  resolvedVersion: "4.18.0",
};
const resolvedVersionEntry = {
  ledger: resolvedVersionLedger,
};
const resolvedVersionAppendix = {
  "lodash@4.17.21": resolvedVersionEntry,
};
const resolvedVersionConfig = {
  appendix: resolvedVersionAppendix,
};
test("validateConfig - accepts resolvedVersion string in ledger", () => {
  assert.doesNotThrow(() => validateConfig(resolvedVersionConfig));
});
