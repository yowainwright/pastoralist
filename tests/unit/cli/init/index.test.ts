import { test, mock as moduleMock } from "node:test";
import { mock } from "../../setup";
import assert from "node:assert/strict";
import * as originalPrompts from "../../../../src/cli/prompts";
import * as originalUtils from "../../../../src/utils";
import * as originalObservability from "../../../../src/observability";
import * as originalPackageJSON from "../../../../src/core/package";
import * as originalConfig from "../../../../src/config";
import * as originalDx from "../../../../src/dx";
import { resolve } from "path";
import type { InitOptions, OnboardingDeps } from "../../../../src/cli/init/types";
import type { PromptChoice } from "../../../../src/cli/prompts/types";
import type { PastoralistConfig } from "../../../../src/types";
import {
  safeReadFileSync as readFileSync,
  safeWriteFileSync as writeFileSync,
  safeMkdirSync as mkdirSync,
  safeRmSync as rmSync,
  safeExistsSync as existsSync,
  safeUnlinkSync as unlinkSync,
  validateRootPackageJsonIntegrity,
} from "../../setup";

const createPromptMock = mock(originalPrompts.createPrompt);
const loggerMock = mock(originalObservability.logger);
const resolveJSONMock = mock(originalPackageJSON.resolveJSON);
const loadExternalConfigMock = mock(originalConfig.loadExternalConfig);
const formatCompletionMock = mock(originalDx.formatCompletion);
const shimmerFrameMock = mock(originalDx.shimmerFrame);
const formatStepHeaderMock = mock(originalDx.formatStepHeader);

const promptExports = Object.assign({}, originalPrompts, { createPrompt: createPromptMock });
moduleMock.module(import.meta.resolve("../../../../src/cli/prompts/index"), {
  namedExports: promptExports,
});
moduleMock.module(import.meta.resolve("../../../../src/utils/index"), {
  namedExports: originalUtils,
});

const observabilityExports = Object.assign({}, originalObservability, { logger: loggerMock });
moduleMock.module(import.meta.resolve("../../../../src/observability/index"), {
  namedExports: observabilityExports,
});

const packageExports = Object.assign({}, originalPackageJSON, { resolveJSON: resolveJSONMock });
moduleMock.module(import.meta.resolve("../../../../src/core/package/index"), {
  namedExports: packageExports,
});

const configExports = Object.assign({}, originalConfig, {
  loadExternalConfig: loadExternalConfigMock,
});
moduleMock.module(import.meta.resolve("../../../../src/config/index"), {
  namedExports: configExports,
});

const dxExports = Object.assign({}, originalDx, {
  formatCompletion: formatCompletionMock,
  shimmerFrame: shimmerFrameMock,
  formatStepHeader: formatStepHeaderMock,
});
moduleMock.module(import.meta.resolve("../../../../src/dx/index"), {
  namedExports: dxExports,
});

const { initCommand, showOnboarding } = await import("../../../../src/cli/init");

const testPath = resolve(import.meta.dirname, "..", "..", ".test-init-package.json");

const testRoot = resolve(import.meta.dirname, "..", "..", ".test-init-root");
type InitPromptFixture = Pick<originalPrompts.Prompt, "list" | "confirm" | "input">;

const createPromptFixture = (
  listResponse: InitPromptFixture["list"],
  confirmResponse: InitPromptFixture["confirm"],
  inputResponse: InitPromptFixture["input"],
): InitPromptFixture => {
  const list = mock(listResponse);
  const confirm = mock(confirmResponse);
  const input = mock(inputResponse);
  const prompt = { list, confirm, input };
  return prompt;
};

const installPromptMock = (
  listResponse: InitPromptFixture["list"] = initializeWithDefaultOptionsList,
  confirmResponse: InitPromptFixture["confirm"] = initializeWithDefaultOptionsConfirm,
  inputResponse: InitPromptFixture["input"] = initializeWithDefaultOptionsInput,
) => {
  const prompt = createPromptFixture(listResponse, confirmResponse, inputResponse);
  const spy = createPromptMock.mockImplementation(async (callback) => {
    const result = callback(prompt as originalPrompts.Prompt);
    return result;
  });
  return spy;
};

const createMockLog = () => {
  const debug = mock(() => {});
  const error = mock(() => {});
  const warn = mock(() => {});
  const print = mock(() => {});
  const line = mock(() => {});
  const indent = mock(() => {});
  const item = mock(() => {});
  const log = { debug, error, warn, print, line, indent, item };
  return log;
};

const createLoggerFixture = () => {
  const mockLog = createMockLog();
  const loggerSpy = loggerMock.mockReturnValue(mockLog);
  const fixture = { mockLog, loggerSpy };
  return fixture;
};

const prepareInitFixture = () => {
  validateRootPackageJsonIntegrity();
  writeFileSync(testPath, JSON.stringify({ name: "test" }, null, 2));
};

const cleanupInitFixture = (loggerSpy: ReturnType<typeof loggerMock.mockReturnValue>) => {
  loggerSpy?.mockRestore();
  if (existsSync(testPath)) unlinkSync(testPath);
  validateRootPackageJsonIntegrity();
};

const initializeWithDefaultOptionsList = async () => "package.json";

const initializeWithDefaultOptionsConfirm = async () => false;

const initializeWithDefaultOptionsInput = async () => "";

const handleSecurityContextInitializationList = async (msg: string) => {
  if (msg.includes("config location")) return "package.json";
  if (msg.includes("security provider")) return "osv";
  if (msg.includes("severity")) return "medium";
  return "back";
};

const handleWorkspaceContextInitializationList = async (msg: string) => {
  if (msg.includes("config location")) return "package.json";
  return "back";
};

const handleWorkspaceContextInitializationConfirm = async (msg: string) => {
  if (msg.includes("workspace")) return true;
  return false;
};

const saveToPastoralistrcJsonList = async (msg: string) => {
  if (msg.includes("config location")) return "external";
  if (msg.includes("config file format")) return ".pastoralistrc.json";
  return "back";
};

const promptForOverwriteIfExternalConfigExistsConfirm = async (msg: string) => {
  if (msg.includes("already exists")) return false;
  return false;
};

const configureWorkspaceModeList = async (msg: string) => {
  if (msg.includes("config location")) return "package.json";
  if (msg.includes("workspace")) return "workspace";
  return "back";
};

const configureWorkspaceModeConfirm = async (msg: string) => {
  if (msg.includes("workspace dependencies")) return true;
  if (msg.includes("security")) return false;
  return false;
};

const configureCustomWorkspacePathsList = async (msg: string) => {
  if (msg.includes("config location")) return "package.json";
  if (msg.includes("workspace")) return "custom";
  return "back";
};

const configureCustomWorkspacePathsInput = async (msg: string) => {
  if (msg.includes("workspace paths")) return "packages/*, apps/*";
  return "";
};

const handleNoWorkspacesDetectedConfirm = async (msg: string) => {
  if (msg.includes("workspace dependencies")) return true;
  return false;
};

const handleNoWorkspacesDetectedInput = async () => "packages/*";

const skipWorkspaceConfigurationWhenDeclinedConfirm = async (msg: string) => {
  if (msg.includes("workspace")) return false;
  if (msg.includes("security")) return false;
  return false;
};

const configureGitHubSecurityProviderList = async (msg: string) => {
  if (msg.includes("config location")) return "package.json";
  if (msg.includes("security provider")) return "github";
  if (msg.includes("severity")) return "medium";
  return "back";
};

const configureGitHubSecurityProviderConfirm = async (msg: string) => {
  if (msg.includes("workspace")) return false;
  if (msg.includes("security vulnerability")) return true;
  if (msg.includes("interactive mode")) return true;
  if (msg.includes("API token")) return false;
  return false;
};

const configureSnykTokenEnvironmentGuidanceList = async (msg: string) => {
  if (msg.includes("config location")) return "package.json";
  if (msg.includes("security provider")) return "snyk";
  if (msg.includes("severity")) return "high";
  return "back";
};

const configureSnykTokenEnvironmentGuidanceConfirm = async (msg: string) => {
  if (msg.includes("workspace")) return false;
  if (msg.includes("security vulnerability")) return true;
  if (msg.includes("API token")) return true;
  if (msg.includes("interactive")) return false;
  if (msg.includes("auto-fix")) return true;
  return false;
};

const configureSnykTokenEnvironmentGuidanceInput = async (msg: string) => {
  if (msg.includes("API token")) return "snyk-token-123";
  return "";
};

const configureSocketTokenEnvironmentGuidanceList = async (msg: string) => {
  if (msg.includes("config location")) return "package.json";
  if (msg.includes("security provider")) return "socket";
  if (msg.includes("severity")) return "critical";
  return "back";
};

const configureSocketTokenEnvironmentGuidanceConfirm = async (msg: string) => {
  if (msg.includes("workspace")) return false;
  if (msg.includes("security vulnerability")) return true;
  if (msg.includes("API token")) return true;
  if (msg.includes("interactive")) return true;
  return false;
};

const configureSocketTokenEnvironmentGuidanceInput = async (msg: string) => {
  if (msg.includes("API token")) return "socket-token-123";
  return "";
};

const handleMissingTokenForRequiredProviderList = async (msg: string) => {
  if (msg.includes("config location")) return "package.json";
  if (msg.includes("security provider")) return "snyk";
  if (msg.includes("severity")) return "medium";
  return "back";
};

const handleMissingTokenForRequiredProviderConfirm = async (msg: string) => {
  if (msg.includes("workspace")) return false;
  if (msg.includes("security vulnerability")) return true;
  if (msg.includes("API token")) return false;
  if (msg.includes("interactive")) return true;
  return false;
};

const notCollectTokenInputInput = async (msg: string) => {
  if (msg.includes("API token")) return "";
  return "";
};

const configureWorkspaceSecurityChecksConfirm = async (msg: string) => {
  if (msg.includes("workspace dependencies")) return true;
  if (msg.includes("security vulnerability")) return true;
  if (msg.includes("interactive")) return true;
  if (msg.includes("Scan workspace")) return true;
  return false;
};

const configureAutoFixWhenInteractiveIsDisabledList = async (msg: string) => {
  if (msg.includes("config location")) return "package.json";
  if (msg.includes("security provider")) return "osv";
  if (msg.includes("severity")) return "low";
  return "back";
};

const configureAutoFixWhenInteractiveIsDisabledConfirm = async (msg: string) => {
  if (msg.includes("workspace")) return false;
  if (msg.includes("security vulnerability")) return true;
  if (msg.includes("interactive")) return false;
  if (msg.includes("auto-fix")) return true;
  return false;
};

const detectExistingConfigInPackageJsonConfirm = async (msg: string) => {
  if (msg.includes("Existing")) return true;
  return false;
};

const cancelWhenUserDeclinesOverwriteConfirm = async (msg: string) => {
  if (msg.includes("Existing")) return false;
  return false;
};

const useSecurityContextWithProviderOptionList = async (msg: string) => {
  if (msg.includes("config location")) return "package.json";
  if (msg.includes("severity")) return "medium";
  return "back";
};

const useSecurityContextWithProviderOptionConfirm = async (msg: string) => {
  if (msg.includes("API token")) return false;
  if (msg.includes("interactive")) return true;
  return false;
};

const handleSecurityContextWithWorkspaceChecksConfirm = async (msg: string) => {
  if (msg.includes("workspace")) return true;
  if (msg.includes("interactive")) return true;
  if (msg.includes("Scan workspace")) return true;
  return false;
};

const createCompleteConfigWithAllFeaturesEnabledList = async (msg: string) => {
  if (msg.includes("config location")) return "package.json";
  if (msg.includes("workspace")) return "workspace";
  if (msg.includes("security provider")) return "github";
  if (msg.includes("severity")) return "critical";
  return "back";
};

const handleSnykProviderTokenInfoConfirm = async (msg: string) => {
  if (msg.includes("token")) return false;
  return false;
};

const handleSocketProviderTokenInfoList = async (msg: string) => {
  if (msg.includes("config location")) return "package.json";
  if (msg.includes("security provider")) return "socket";
  if (msg.includes("severity")) return "medium";
  return "back";
};

const continueWhenTokenEnvironmentIsConfirmedConfirm = async (msg: string) => {
  if (msg.includes("token")) return true;
  return false;
};

const ignoreRawTokenInputMocksInput = async () => "ghp_test_token_12345";

const enhancedUIWithSecurityEnabledShowsCorrectNextStepsList = async (msg: string) => {
  if (msg.includes("config location")) return "package.json";
  if (msg.includes("security provider")) return "github";
  return "back";
};

const enhancedUIWithSecurityEnabledShowsCorrectNextStepsConfirm = async () => true;

test("initCommand - should initialize with default options", async () => {
  prepareInitFixture();
  const { loggerSpy } = createLoggerFixture();
  const createPromptSpy = installPromptMock();
  await initCommand({ path: testPath, isTesting: true });
  assert.ok(createPromptSpy.mock.callCount() > 0);
  cleanupInitFixture(loggerSpy);
});

test("interactive onboarding offers three paths and uses the existing config wizard", async () => {
  const fixture = createDeps("interactive");
  const options = { root: "/project", path: "custom.json" };
  const output = await captureOnboarding(fixture.deps, options);
  assert.strictEqual(output, "");
  assert.deepStrictEqual(fixture.init.mock.calls[0].arguments, [options]);
  const [question, choices] = fixture.select.mock.calls[0].arguments;
  assert.match(question, /How would you like to set up/);
  const names = choices.map(({ name }) => name);
  assert.deepStrictEqual(names, [
    "Set up interactively",
    "Use an AI agent",
    "Set up GitHub Actions",
  ]);
});

test("agent onboarding prints its setup prompt and verification without unrelated paths", async () => {
  const fixture = createDeps("agent");
  const text = await captureOnboarding(fixture.deps);
  assert.match(text, /Agent quick setup/);
  assert.match(text, /Set up Pastoralist in this repository\./);
  assert.match(text, /npx pastoralist --dry-run/);
  assert.doesNotMatch(text, /Human quick start|GitHub Action setup|maintenance agent/);
  assert.strictEqual(fixture.init.mock.callCount(), 0);
});

test("GitHub Actions onboarding prints the workflow and its verification", async () => {
  const fixture = createDeps("github");
  const text = await captureOnboarding(fixture.deps);
  assert.match(text, /\.github\/workflows\/pastoralist\.yml/);
  assert.match(text, /uses: yowainwright\/pastoralist@v1/);
  assert.match(text, /confirm the Override Check workflow succeeds/);
  assert.doesNotMatch(text, /Human quick start|Agent quick setup|Prompt for/);
  assert.strictEqual(fixture.init.mock.callCount(), 0);
});

test("noninteractive onboarding never prompts or starts the config wizard", async () => {
  const fixture = createDeps();
  const deps = Object.assign({}, fixture.deps, { interactive: false });
  const text = await captureOnboarding(deps);
  assert.ok(text.split("\n").length <= 8);
  assert.match(text, /npx pastoralist init agent-skill/);
  assert.strictEqual(fixture.select.mock.callCount(), 0);
  assert.strictEqual(fixture.init.mock.callCount(), 0);
});

test("unknown onboarding choices cannot start the config wizard", async () => {
  const fixture = createDeps("invalid");
  await assert.rejects(captureOnboarding(fixture.deps), /Unknown onboarding setup path/);
  assert.strictEqual(fixture.init.mock.callCount(), 0);
});

test("cancelled onboarding does not fall through to the config wizard", async () => {
  const fixture = createDeps();
  const error = new Error("Prompt cancelled");
  const select = () => Promise.reject(error);
  const deps = Object.assign({}, fixture.deps, { select });
  await assert.rejects(captureOnboarding(deps), /Prompt cancelled/);
  assert.strictEqual(fixture.init.mock.callCount(), 0);
});

function createDeps(choice = "agent") {
  const select = moduleMock.fn((_question: string, _choices: PromptChoice[]) =>
    Promise.resolve(choice),
  );
  const init = moduleMock.fn((_options?: InitOptions) => Promise.resolve());
  const deps: OnboardingDeps = { interactive: true, select, init };
  const fixture = { deps, select, init };
  return fixture;
}

async function captureOnboarding(deps: OnboardingDeps, options: InitOptions = {}): Promise<string> {
  const print = moduleMock.fn((_message: string) => undefined);
  const original = originalObservability.logger({ file: "onboarding-test" });
  const logger = Object.assign({}, original, { print });
  const loggerSpy = loggerMock.mockReturnValue(logger);
  try {
    await showOnboarding(options, deps);
    const lines = print.mock.calls.map(({ arguments: args }) => args[0]);
    const text = lines.join("\n");
    return text;
  } finally {
    loggerSpy?.mockRestore();
  }
}

test("initCommand - should handle security context initialization", async () => {
  prepareInitFixture();
  const { loggerSpy } = createLoggerFixture();
  const createPromptSpy = installPromptMock(
    handleSecurityContextInitializationList,
    initializeWithDefaultOptionsConfirm,
    initializeWithDefaultOptionsInput,
  );
  await initCommand({ path: testPath, checkSecurity: true, isTesting: true });
  assert.ok(createPromptSpy.mock.callCount() > 0);
  cleanupInitFixture(loggerSpy);
});

test("initCommand - should handle workspace context initialization", async () => {
  prepareInitFixture();
  const { loggerSpy } = createLoggerFixture();
  const createPromptSpy = installPromptMock(
    handleWorkspaceContextInitializationList,
    handleWorkspaceContextInitializationConfirm,
    initializeWithDefaultOptionsInput,
  );
  await initCommand({
    path: testPath,
    hasWorkspaceSecurityChecks: true,
    isTesting: true,
  });
  assert.ok(createPromptSpy.mock.callCount() > 0);
  cleanupInitFixture(loggerSpy);
});

test("initCommand - should save to package.json", async () => {
  prepareInitFixture();
  const { loggerSpy } = createLoggerFixture();
  const createPromptSpy = installPromptMock();
  await initCommand({ path: testPath, isTesting: true });
  assert.ok(createPromptSpy.mock.callCount() > 0);
  cleanupInitFixture(loggerSpy);
});

const prepareRootedInitFixture = () => {
  validateRootPackageJsonIntegrity();
  if (existsSync(testRoot)) {
    rmSync(testRoot, { recursive: true, force: true });
  }
  mkdirSync(testRoot, { recursive: true });
  const packagePath = resolve(testRoot, "package.json");
  writeFileSync(packagePath, JSON.stringify({ name: "rooted" }, null, 2));
  return packagePath;
};

const cleanupRootedInitFixture = () => {
  if (existsSync(testRoot)) rmSync(testRoot, { recursive: true, force: true });
  validateRootPackageJsonIntegrity();
};

test("initCommand - should resolve relative package path under root", async () => {
  const packagePath = prepareRootedInitFixture();
  const { loggerSpy } = createLoggerFixture();
  const createPromptSpy = installPromptMock();
  await initCommand({ path: "package.json", root: testRoot });
  const updated = JSON.parse(readFileSync(packagePath, "utf8"));
  assert.strictEqual(updated.name, "rooted");
  assert.deepStrictEqual(updated.pastoralist, {});
  createPromptSpy?.mockRestore();
  loggerSpy?.mockRestore();
  cleanupRootedInitFixture();
});

test("initCommand - should save to .pastoralistrc.json", async () => {
  prepareInitFixture();
  const { loggerSpy } = createLoggerFixture();
  const createPromptSpy = installPromptMock(
    saveToPastoralistrcJsonList,
    initializeWithDefaultOptionsConfirm,
    initializeWithDefaultOptionsInput,
  );
  await initCommand({ path: testPath, isTesting: true });
  assert.ok(createPromptSpy.mock.callCount() > 0);
  cleanupInitFixture(loggerSpy);
});

test("initCommand - should prompt for overwrite if external config exists", async () => {
  prepareInitFixture();
  const configPath = resolve(process.cwd(), ".pastoralistrc.json");
  writeFileSync(configPath, JSON.stringify({ depPaths: "workspace" }, null, 2));
  const { loggerSpy } = createLoggerFixture();
  const createPromptSpy = installPromptMock(
    saveToPastoralistrcJsonList,
    promptForOverwriteIfExternalConfigExistsConfirm,
    initializeWithDefaultOptionsInput,
  );
  await initCommand({ path: testPath, isTesting: true });
  assert.ok(createPromptSpy.mock.callCount() > 0);
  if (existsSync(configPath)) unlinkSync(configPath);
  cleanupInitFixture(loggerSpy);
});

test("initCommand - should configure workspace mode", async () => {
  prepareInitFixture();
  const { loggerSpy } = createLoggerFixture();
  const createPromptSpy = installPromptMock(
    configureWorkspaceModeList,
    configureWorkspaceModeConfirm,
    initializeWithDefaultOptionsInput,
  );
  const workspaces = ["packages/*"];
  const mockResolveJSON = resolveJSONMock.mockReturnValue({
    name: "test",
    workspaces,
  });
  await initCommand({ path: testPath, isTesting: true });
  assert.ok(createPromptSpy.mock.callCount() > 0);
  mockResolveJSON.mockRestore();
  cleanupInitFixture(loggerSpy);
});

test("initCommand - should configure custom workspace paths", async () => {
  prepareInitFixture();
  const { loggerSpy } = createLoggerFixture();
  const createPromptSpy = installPromptMock(
    configureCustomWorkspacePathsList,
    configureWorkspaceModeConfirm,
    configureCustomWorkspacePathsInput,
  );
  await initCommand({ path: testPath, isTesting: true });
  assert.ok(createPromptSpy.mock.callCount() > 0);
  cleanupInitFixture(loggerSpy);
});

test("initCommand - should handle no workspaces detected", async () => {
  prepareInitFixture();
  const { loggerSpy } = createLoggerFixture();
  const createPromptSpy = installPromptMock(
    configureCustomWorkspacePathsList,
    handleNoWorkspacesDetectedConfirm,
    handleNoWorkspacesDetectedInput,
  );
  const mockResolveJSON = resolveJSONMock.mockReturnValue({
    name: "test",
  });
  await initCommand({ path: testPath, isTesting: true });
  assert.ok(createPromptSpy.mock.callCount() > 0);
  mockResolveJSON.mockRestore();
  cleanupInitFixture(loggerSpy);
});

test("initCommand - should skip workspace configuration when declined", async () => {
  prepareInitFixture();
  const { loggerSpy } = createLoggerFixture();
  const createPromptSpy = installPromptMock(
    initializeWithDefaultOptionsList,
    skipWorkspaceConfigurationWhenDeclinedConfirm,
    initializeWithDefaultOptionsInput,
  );
  await initCommand({ path: testPath, isTesting: true });
  assert.ok(createPromptSpy.mock.callCount() > 0);
  cleanupInitFixture(loggerSpy);
});

test("initCommand - should configure GitHub security provider", async () => {
  prepareInitFixture();
  const { loggerSpy } = createLoggerFixture();
  const createPromptSpy = installPromptMock(
    configureGitHubSecurityProviderList,
    configureGitHubSecurityProviderConfirm,
    initializeWithDefaultOptionsInput,
  );
  await initCommand({ path: testPath, isTesting: true });
  assert.ok(createPromptSpy.mock.callCount() > 0);
  cleanupInitFixture(loggerSpy);
});

test("initCommand - should configure Snyk token environment guidance", async () => {
  prepareInitFixture();
  const { loggerSpy } = createLoggerFixture();
  const createPromptSpy = installPromptMock(
    configureSnykTokenEnvironmentGuidanceList,
    configureSnykTokenEnvironmentGuidanceConfirm,
    configureSnykTokenEnvironmentGuidanceInput,
  );
  await initCommand({ path: testPath, isTesting: true });
  assert.ok(createPromptSpy.mock.callCount() > 0);
  cleanupInitFixture(loggerSpy);
});

test("initCommand - should configure Socket token environment guidance", async () => {
  prepareInitFixture();
  const { loggerSpy } = createLoggerFixture();
  const createPromptSpy = installPromptMock(
    configureSocketTokenEnvironmentGuidanceList,
    configureSocketTokenEnvironmentGuidanceConfirm,
    configureSocketTokenEnvironmentGuidanceInput,
  );
  await initCommand({ path: testPath, isTesting: true });
  assert.ok(createPromptSpy.mock.callCount() > 0);
  cleanupInitFixture(loggerSpy);
});

test("initCommand - should handle missing token for required provider", async () => {
  prepareInitFixture();
  const { loggerSpy } = createLoggerFixture();
  const createPromptSpy = installPromptMock(
    handleMissingTokenForRequiredProviderList,
    handleMissingTokenForRequiredProviderConfirm,
    initializeWithDefaultOptionsInput,
  );
  await initCommand({ path: testPath, isTesting: true });
  assert.ok(createPromptSpy.mock.callCount() > 0);
  cleanupInitFixture(loggerSpy);
});

test("initCommand - should not collect token input", async () => {
  prepareInitFixture();
  const { loggerSpy } = createLoggerFixture();
  const createPromptSpy = installPromptMock(
    handleMissingTokenForRequiredProviderList,
    configureSocketTokenEnvironmentGuidanceConfirm,
    notCollectTokenInputInput,
  );
  await initCommand({ path: testPath, isTesting: true });
  assert.ok(createPromptSpy.mock.callCount() > 0);
  cleanupInitFixture(loggerSpy);
});

test("initCommand - should configure workspace security checks", async () => {
  prepareInitFixture();
  const { loggerSpy } = createLoggerFixture();
  const createPromptSpy = installPromptMock(
    handleSecurityContextInitializationList,
    configureWorkspaceSecurityChecksConfirm,
    initializeWithDefaultOptionsInput,
  );
  const workspaces = ["packages/*"];
  const mockResolveJSON = resolveJSONMock.mockReturnValue({
    name: "test",
    workspaces,
  });
  await initCommand({ path: testPath, isTesting: true });
  assert.ok(createPromptSpy.mock.callCount() > 0);
  mockResolveJSON.mockRestore();
  cleanupInitFixture(loggerSpy);
});

test("initCommand - should configure auto-fix when interactive is disabled", async () => {
  prepareInitFixture();
  const { loggerSpy } = createLoggerFixture();
  const createPromptSpy = installPromptMock(
    configureAutoFixWhenInteractiveIsDisabledList,
    configureAutoFixWhenInteractiveIsDisabledConfirm,
    initializeWithDefaultOptionsInput,
  );
  await initCommand({ path: testPath, isTesting: true });
  assert.ok(createPromptSpy.mock.callCount() > 0);
  cleanupInitFixture(loggerSpy);
});

test("initCommand - should detect existing config in package.json", async () => {
  prepareInitFixture();
  const { loggerSpy } = createLoggerFixture();
  const createPromptSpy = installPromptMock(
    initializeWithDefaultOptionsList,
    detectExistingConfigInPackageJsonConfirm,
    initializeWithDefaultOptionsInput,
  );
  const pastoralist: PastoralistConfig = { depPaths: "workspace" };
  const mockResolveJSON = resolveJSONMock.mockReturnValue({
    name: "test",
    pastoralist,
  });
  await initCommand({ path: testPath, isTesting: true });
  assert.ok(createPromptSpy.mock.callCount() > 0);
  mockResolveJSON.mockRestore();
  cleanupInitFixture(loggerSpy);
});

test("initCommand - should cancel when user declines overwrite", async () => {
  prepareInitFixture();
  const { loggerSpy } = createLoggerFixture();
  const createPromptSpy = installPromptMock(
    initializeWithDefaultOptionsList,
    cancelWhenUserDeclinesOverwriteConfirm,
    initializeWithDefaultOptionsInput,
  );
  const pastoralist: PastoralistConfig = { depPaths: "workspace" };
  const mockResolveJSON = resolveJSONMock.mockReturnValue({
    name: "test",
    pastoralist,
  });
  await initCommand({ path: testPath, isTesting: true });
  assert.ok(createPromptSpy.mock.callCount() > 0);
  mockResolveJSON.mockRestore();
  cleanupInitFixture(loggerSpy);
});

test("initCommand - should detect external config file", async () => {
  prepareInitFixture();
  const { loggerSpy } = createLoggerFixture();
  const loadExternalConfigSpy = loadExternalConfigMock.mockResolvedValue({
    depPaths: "workspace",
  });
  const createPromptSpy = installPromptMock(
    initializeWithDefaultOptionsList,
    detectExistingConfigInPackageJsonConfirm,
    initializeWithDefaultOptionsInput,
  );
  await initCommand({ path: testPath, isTesting: true });
  assert.ok(createPromptSpy.mock.callCount() > 0);
  loadExternalConfigSpy.mockRestore();
  cleanupInitFixture(loggerSpy);
});

test("initCommand - should use security context with provider option", async () => {
  prepareInitFixture();
  const { loggerSpy } = createLoggerFixture();
  const createPromptSpy = installPromptMock(
    useSecurityContextWithProviderOptionList,
    useSecurityContextWithProviderOptionConfirm,
    initializeWithDefaultOptionsInput,
  );
  await initCommand({
    path: testPath,
    securityProvider: "github",
    isTesting: true,
  });
  assert.ok(createPromptSpy.mock.callCount() > 0);
  cleanupInitFixture(loggerSpy);
});

const workspaceSecurityOptions: InitOptions = {
  path: testPath,
  checkSecurity: true,
  hasWorkspaceSecurityChecks: true,
  isTesting: true,
};

test("initCommand - should handle security context with workspace checks", async () => {
  prepareInitFixture();
  const { loggerSpy } = createLoggerFixture();
  const createPromptSpy = installPromptMock(
    handleSecurityContextInitializationList,
    handleSecurityContextWithWorkspaceChecksConfirm,
    initializeWithDefaultOptionsInput,
  );
  const workspaces = ["packages/*"];
  const mockResolveJSON = resolveJSONMock.mockReturnValue({
    name: "test",
    workspaces,
  });
  await initCommand(workspaceSecurityOptions);
  assert.ok(createPromptSpy.mock.callCount() > 0);
  mockResolveJSON.mockRestore();
  cleanupInitFixture(loggerSpy);
});

test("initCommand - should create complete config with all features enabled", async () => {
  prepareInitFixture();
  const { loggerSpy } = createLoggerFixture();
  const createPromptSpy = installPromptMock(
    createCompleteConfigWithAllFeaturesEnabledList,
    configureWorkspaceSecurityChecksConfirm,
    initializeWithDefaultOptionsInput,
  );
  const workspaces = ["packages/*", "apps/*"];
  const mockResolveJSON = resolveJSONMock.mockReturnValue({
    name: "test",
    workspaces,
  });
  await initCommand({ path: testPath, isTesting: true });
  assert.ok(createPromptSpy.mock.callCount() > 0);
  mockResolveJSON.mockRestore();
  cleanupInitFixture(loggerSpy);
});

test("initCommand - should create minimal config", async () => {
  prepareInitFixture();
  const { loggerSpy } = createLoggerFixture();
  const createPromptSpy = installPromptMock();
  await initCommand({ path: testPath, isTesting: true });
  assert.ok(createPromptSpy.mock.callCount() > 0);
  cleanupInitFixture(loggerSpy);
});

test("initCommand - should handle missing package.json gracefully", async () => {
  prepareInitFixture();
  const { loggerSpy } = createLoggerFixture();
  const createPromptSpy = installPromptMock();
  const mockResolveJSON = resolveJSONMock.mockReturnValue(null);
  await initCommand({ path: testPath, isTesting: true });
  assert.ok(createPromptSpy.mock.callCount() > 0);
  mockResolveJSON.mockRestore();
  cleanupInitFixture(loggerSpy);
});

test("initCommand - should handle snyk provider token info", async () => {
  prepareInitFixture();
  const { loggerSpy } = createLoggerFixture();
  const createPromptSpy = installPromptMock(
    handleMissingTokenForRequiredProviderList,
    handleSnykProviderTokenInfoConfirm,
    initializeWithDefaultOptionsInput,
  );
  await initCommand({ path: testPath, checkSecurity: true, isTesting: true });
  assert.ok(createPromptSpy.mock.callCount() > 0);
  cleanupInitFixture(loggerSpy);
});

test("initCommand - should handle socket provider token info", async () => {
  prepareInitFixture();
  const { loggerSpy } = createLoggerFixture();
  const createPromptSpy = installPromptMock(
    handleSocketProviderTokenInfoList,
    handleSnykProviderTokenInfoConfirm,
    initializeWithDefaultOptionsInput,
  );
  await initCommand({ path: testPath, checkSecurity: true, isTesting: true });
  assert.ok(createPromptSpy.mock.callCount() > 0);
  cleanupInitFixture(loggerSpy);
});

test("initCommand - should continue when token environment is confirmed", async () => {
  prepareInitFixture();
  const { loggerSpy } = createLoggerFixture();
  const createPromptSpy = installPromptMock(
    configureGitHubSecurityProviderList,
    continueWhenTokenEnvironmentIsConfirmedConfirm,
    initializeWithDefaultOptionsInput,
  );
  await initCommand({ path: testPath, checkSecurity: true, isTesting: true });
  assert.ok(createPromptSpy.mock.callCount() > 0);
  cleanupInitFixture(loggerSpy);
});

test("initCommand - should ignore raw token input mocks", async () => {
  prepareInitFixture();
  const { loggerSpy } = createLoggerFixture();
  const createPromptSpy = installPromptMock(
    configureGitHubSecurityProviderList,
    continueWhenTokenEnvironmentIsConfirmedConfirm,
    ignoreRawTokenInputMocksInput,
  );
  await initCommand({ path: testPath, checkSecurity: true, isTesting: true });
  assert.ok(createPromptSpy.mock.callCount() > 0);
  cleanupInitFixture(loggerSpy);
});

const assertCompletionOutput = (mockLog: ReturnType<typeof createMockLog>) => {
  assert.equal(formatCompletionMock.mock.callCount(), 1);
  const [title, steps, shimmerTitle] = formatCompletionMock.mock.calls[0].arguments;
  assert.equal(title, "Pastoralist initialization complete!");
  assert.equal(steps.length, 2);
  assert.match(shimmerTitle, /^shimmered text/);
  assert.deepEqual(shimmerFrameMock.mock.calls[0].arguments, [title, 0]);
  const formatted = originalDx.formatCompletion(title, steps, shimmerTitle);
  assert.ok(mockLog.print.mock.calls.some(({ arguments: args }) => args[0] === formatted));
};

test("initCommand - enhanced UI integration with formatCompletion", async () => {
  prepareInitFixture();
  const { mockLog, loggerSpy } = createLoggerFixture();
  const shimmerFrameSpy = shimmerFrameMock.mockReturnValue("shimmered text");
  installPromptMock();
  formatCompletionMock.mockClear();
  shimmerFrameSpy.mockClear();
  loadExternalConfigMock.mockResolvedValue(null);
  resolveJSONMock.mockReturnValue({ name: "test" });
  await initCommand({ path: testPath, isTesting: true });
  assertCompletionOutput(mockLog);
  formatCompletionMock.mockRestore();
  shimmerFrameSpy.mockRestore();
  loadExternalConfigMock.mockRestore();
  resolveJSONMock.mockRestore();
  cleanupInitFixture(loggerSpy);
});

test("initCommand - enhanced UI with security enabled shows correct next steps", async () => {
  prepareInitFixture();
  const { loggerSpy } = createLoggerFixture();
  const createPromptSpy = installPromptMock(
    enhancedUIWithSecurityEnabledShowsCorrectNextStepsList,
    enhancedUIWithSecurityEnabledShowsCorrectNextStepsConfirm,
    initializeWithDefaultOptionsInput,
  );
  await initCommand({ path: testPath, checkSecurity: true, isTesting: true });
  assert.ok(createPromptSpy.mock.callCount() > 0);
  cleanupInitFixture(loggerSpy);
});

const assertConfigurationHeaders = (mockLog: ReturnType<typeof createMockLog>) => {
  assert.deepEqual(
    formatStepHeaderMock.mock.calls.map(({ arguments: args }) => args),
    [
      [1, "Configuration Location"],
      [2, "Workspace Configuration"],
      [3, "Security Configuration"],
    ],
  );
  const header = originalDx.formatStepHeader(1, "Configuration Location");
  assert.ok(mockLog.print.mock.calls.some(({ arguments: args }) => args[0] === header));
};

test("initCommand - prints formatted configuration step headers", async () => {
  prepareInitFixture();
  const { mockLog, loggerSpy } = createLoggerFixture();
  installPromptMock();
  formatStepHeaderMock.mockClear();
  loadExternalConfigMock.mockResolvedValue(null);
  resolveJSONMock.mockReturnValue({ name: "test" });
  await initCommand({ path: testPath, isTesting: true });
  assertConfigurationHeaders(mockLog);
  loadExternalConfigMock.mockRestore();
  resolveJSONMock.mockRestore();
  cleanupInitFixture(loggerSpy);
});
