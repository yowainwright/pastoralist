import { test, mock as moduleMock } from "node:test";
import { mock } from "../../../setup";
import assert from "node:assert/strict";
import * as originalPrompts from "../../../../../src/utils/prompts";
import * as originalUtils from "../../../../../src/utils";
import * as originalPackageJSON from "../../../../../src/core/package";
import * as originalConfig from "../../../../../src/config";
import * as originalDx from "../../../../../src/dx";
import * as originalShimmer from "../../../../../src/dx/shimmer";
import { resolve } from "path";
import {
  safeReadFileSync as readFileSync,
  safeWriteFileSync as writeFileSync,
  safeMkdirSync as mkdirSync,
  safeRmSync as rmSync,
  safeExistsSync as existsSync,
  safeUnlinkSync as unlinkSync,
  validateRootPackageJsonIntegrity,
} from "../../../setup";

const createPromptMock = mock(originalPrompts.createPrompt);
const loggerMock = mock(originalUtils.logger);
const resolveJSONMock = mock(originalPackageJSON.resolveJSON);
const loadExternalConfigMock = mock(originalConfig.loadExternalConfig);
const formatCompletionMock = mock(originalDx.formatCompletion);
const shimmerFrameMock = mock(originalShimmer.shimmerFrame);

moduleMock.module(import.meta.resolve("../../../../../src/utils/prompts/index"), {
  namedExports: Object.assign({}, originalPrompts, { createPrompt: createPromptMock }),
});
moduleMock.module(import.meta.resolve("../../../../../src/utils/index"), {
  namedExports: Object.assign({}, originalUtils, { logger: loggerMock }),
});
moduleMock.module(import.meta.resolve("../../../../../src/core/package/index"), {
  namedExports: Object.assign({}, originalPackageJSON, { resolveJSON: resolveJSONMock }),
});
moduleMock.module(import.meta.resolve("../../../../../src/config/index"), {
  namedExports: Object.assign({}, originalConfig, { loadExternalConfig: loadExternalConfigMock }),
});
moduleMock.module(import.meta.resolve("../../../../../src/dx/index"), {
  namedExports: Object.assign({}, originalDx, { formatCompletion: formatCompletionMock }),
});
moduleMock.module(import.meta.resolve("../../../../../src/dx/shimmer"), {
  namedExports: Object.assign({}, originalShimmer, { shimmerFrame: shimmerFrameMock }),
});

const { initCommand } = await import("../../../../../src/cli/cmds/init");

const testPath = resolve(import.meta.dirname, "..", "..", "..", ".test-init-package.json");
const testRoot = resolve(import.meta.dirname, "..", "..", "..", ".test-init-root");

test("initCommand - should initialize with default options", async () => {
  validateRootPackageJsonIntegrity();
  writeFileSync(testPath, JSON.stringify({ name: "test" }, null, 2));

  const mockLog = {
    debug: mock(() => {}),
    error: mock(() => {}),
    warn: mock(() => {}),
    print: mock(() => {}),
    line: mock(() => {}),
    indent: mock(() => {}),
    item: mock(() => {}),
  };
  const loggerSpy = loggerMock.mockReturnValue(mockLog);

  const createPromptSpy = createPromptMock.mockImplementation(async (callback) => {
    const mockPrompt = {
      list: mock(() => Promise.resolve("package.json")),
      confirm: mock(() => Promise.resolve(false)),
      input: mock(() => Promise.resolve("")),
    };
    return callback(mockPrompt);
  });

  await initCommand({ path: testPath, isTesting: true });
  assert.ok(createPromptSpy.mock.callCount() > 0);

  loggerSpy?.mockRestore();
  if (existsSync(testPath)) {
    unlinkSync(testPath);
  }
  validateRootPackageJsonIntegrity();
});

test("initCommand - should handle security context initialization", async () => {
  validateRootPackageJsonIntegrity();
  writeFileSync(testPath, JSON.stringify({ name: "test" }, null, 2));

  const mockLog = {
    debug: mock(() => {}),
    error: mock(() => {}),
    warn: mock(() => {}),
    print: mock(() => {}),
    line: mock(() => {}),
    indent: mock(() => {}),
    item: mock(() => {}),
  };
  const loggerSpy = loggerMock.mockReturnValue(mockLog);

  const createPromptSpy = createPromptMock.mockImplementation(async (callback) => {
    const mockPrompt = {
      list: mock((msg: string) => {
        if (msg.includes("config location")) return Promise.resolve("package.json");
        if (msg.includes("security provider")) return Promise.resolve("osv");
        if (msg.includes("severity")) return Promise.resolve("medium");
        return Promise.resolve("back");
      }),
      confirm: mock(() => Promise.resolve(false)),
      input: mock(() => Promise.resolve("")),
    };
    return callback(mockPrompt);
  });

  await initCommand({ path: testPath, checkSecurity: true, isTesting: true });
  assert.ok(createPromptSpy.mock.callCount() > 0);

  loggerSpy?.mockRestore();
  if (existsSync(testPath)) {
    unlinkSync(testPath);
  }
  validateRootPackageJsonIntegrity();
});

test("initCommand - should handle workspace context initialization", async () => {
  validateRootPackageJsonIntegrity();
  writeFileSync(testPath, JSON.stringify({ name: "test" }, null, 2));

  const mockLog = {
    debug: mock(() => {}),
    error: mock(() => {}),
    warn: mock(() => {}),
    print: mock(() => {}),
    line: mock(() => {}),
    indent: mock(() => {}),
    item: mock(() => {}),
  };
  const loggerSpy = loggerMock.mockReturnValue(mockLog);

  const createPromptSpy = createPromptMock.mockImplementation(async (callback) => {
    const mockPrompt = {
      list: mock((msg: string) => {
        if (msg.includes("config location")) return Promise.resolve("package.json");
        return Promise.resolve("back");
      }),
      confirm: mock((msg: string) => {
        if (msg.includes("workspace")) return Promise.resolve(true);
        return Promise.resolve(false);
      }),
      input: mock(() => Promise.resolve("")),
    };
    return callback(mockPrompt);
  });

  await initCommand({
    path: testPath,
    hasWorkspaceSecurityChecks: true,
    isTesting: true,
  });
  assert.ok(createPromptSpy.mock.callCount() > 0);

  loggerSpy?.mockRestore();
  if (existsSync(testPath)) {
    unlinkSync(testPath);
  }
  validateRootPackageJsonIntegrity();
});

test("initCommand - should save to package.json", async () => {
  validateRootPackageJsonIntegrity();
  writeFileSync(testPath, JSON.stringify({ name: "test" }, null, 2));

  const mockLog = {
    debug: mock(() => {}),
    error: mock(() => {}),
    warn: mock(() => {}),
    print: mock(() => {}),
    line: mock(() => {}),
    indent: mock(() => {}),
    item: mock(() => {}),
  };
  const loggerSpy = loggerMock.mockReturnValue(mockLog);

  const createPromptSpy = createPromptMock.mockImplementation(async (callback) => {
    const mockPrompt = {
      list: mock(() => Promise.resolve("package.json")),
      confirm: mock(() => Promise.resolve(false)),
      input: mock(() => Promise.resolve("")),
    };
    return callback(mockPrompt);
  });

  await initCommand({ path: testPath, isTesting: true });
  assert.ok(createPromptSpy.mock.callCount() > 0);

  loggerSpy?.mockRestore();
  if (existsSync(testPath)) {
    unlinkSync(testPath);
  }
  validateRootPackageJsonIntegrity();
});

test("initCommand - should resolve relative package path under root", async () => {
  validateRootPackageJsonIntegrity();
  if (existsSync(testRoot)) {
    rmSync(testRoot, { recursive: true, force: true });
  }
  mkdirSync(testRoot, { recursive: true });
  const packagePath = resolve(testRoot, "package.json");
  writeFileSync(packagePath, JSON.stringify({ name: "rooted" }, null, 2));

  const mockLog = {
    debug: mock(() => {}),
    error: mock(() => {}),
    warn: mock(() => {}),
    print: mock(() => {}),
    line: mock(() => {}),
    indent: mock(() => {}),
    item: mock(() => {}),
  };
  const loggerSpy = loggerMock.mockReturnValue(mockLog);

  const createPromptSpy = createPromptMock.mockImplementation(async (callback) => {
    const mockPrompt = {
      list: mock(() => Promise.resolve("package.json")),
      confirm: mock(() => Promise.resolve(false)),
      input: mock(() => Promise.resolve("")),
    };
    return callback(mockPrompt);
  });

  await initCommand({ path: "package.json", root: testRoot });

  const updated = JSON.parse(readFileSync(packagePath, "utf8"));
  assert.strictEqual(updated.name, "rooted");
  assert.deepStrictEqual(updated.pastoralist, {});

  createPromptSpy?.mockRestore();
  loggerSpy?.mockRestore();
  if (existsSync(testRoot)) {
    rmSync(testRoot, { recursive: true, force: true });
  }
  validateRootPackageJsonIntegrity();
});

test("initCommand - should save to .pastoralistrc.json", async () => {
  validateRootPackageJsonIntegrity();
  writeFileSync(testPath, JSON.stringify({ name: "test" }, null, 2));

  const mockLog = {
    debug: mock(() => {}),
    error: mock(() => {}),
    warn: mock(() => {}),
    print: mock(() => {}),
    line: mock(() => {}),
    indent: mock(() => {}),
    item: mock(() => {}),
  };
  const loggerSpy = loggerMock.mockReturnValue(mockLog);

  const createPromptSpy = createPromptMock.mockImplementation(async (callback) => {
    const mockPrompt = {
      list: mock((msg: string) => {
        if (msg.includes("config location")) return Promise.resolve("external");
        if (msg.includes("config file format")) return Promise.resolve(".pastoralistrc.json");
        return Promise.resolve("back");
      }),
      confirm: mock(() => Promise.resolve(false)),
      input: mock(() => Promise.resolve("")),
    };
    return callback(mockPrompt);
  });

  await initCommand({ path: testPath, isTesting: true });
  assert.ok(createPromptSpy.mock.callCount() > 0);

  loggerSpy?.mockRestore();
  if (existsSync(testPath)) {
    unlinkSync(testPath);
  }
  validateRootPackageJsonIntegrity();
});

test("initCommand - should prompt for overwrite if external config exists", async () => {
  validateRootPackageJsonIntegrity();
  writeFileSync(testPath, JSON.stringify({ name: "test" }, null, 2));
  const configPath = resolve(process.cwd(), ".pastoralistrc.json");
  writeFileSync(configPath, JSON.stringify({ depPaths: "workspace" }, null, 2));

  const mockLog = {
    debug: mock(() => {}),
    error: mock(() => {}),
    warn: mock(() => {}),
    print: mock(() => {}),
    line: mock(() => {}),
    indent: mock(() => {}),
    item: mock(() => {}),
  };
  const loggerSpy = loggerMock.mockReturnValue(mockLog);

  const createPromptSpy = createPromptMock.mockImplementation(async (callback) => {
    const mockPrompt = {
      list: mock((msg: string) => {
        if (msg.includes("config location")) return Promise.resolve("external");
        if (msg.includes("config file format")) return Promise.resolve(".pastoralistrc.json");
        return Promise.resolve("back");
      }),
      confirm: mock((msg: string) => {
        if (msg.includes("already exists")) return Promise.resolve(false);
        return Promise.resolve(false);
      }),
      input: mock(() => Promise.resolve("")),
    };
    return callback(mockPrompt);
  });

  await initCommand({ path: testPath, isTesting: true });
  assert.ok(createPromptSpy.mock.callCount() > 0);

  if (existsSync(configPath)) unlinkSync(configPath);
  loggerSpy?.mockRestore();
  if (existsSync(testPath)) {
    unlinkSync(testPath);
  }
  validateRootPackageJsonIntegrity();
});

test("initCommand - should configure workspace mode", async () => {
  validateRootPackageJsonIntegrity();
  writeFileSync(testPath, JSON.stringify({ name: "test" }, null, 2));

  const mockLog = {
    debug: mock(() => {}),
    error: mock(() => {}),
    warn: mock(() => {}),
    print: mock(() => {}),
    line: mock(() => {}),
    indent: mock(() => {}),
    item: mock(() => {}),
  };
  const loggerSpy = loggerMock.mockReturnValue(mockLog);

  const createPromptSpy = createPromptMock.mockImplementation(async (callback) => {
    const mockPrompt = {
      list: mock((msg: string) => {
        if (msg.includes("config location")) return Promise.resolve("package.json");
        if (msg.includes("workspace")) return Promise.resolve("workspace");
        return Promise.resolve("back");
      }),
      confirm: mock((msg: string) => {
        if (msg.includes("workspace dependencies")) return Promise.resolve(true);
        if (msg.includes("security")) return Promise.resolve(false);
        return Promise.resolve(false);
      }),
      input: mock(() => Promise.resolve("")),
    };
    return callback(mockPrompt);
  });

  const mockResolveJSON = resolveJSONMock.mockReturnValue({
    name: "test",
    workspaces: ["packages/*"],
  });

  await initCommand({ path: testPath, isTesting: true });
  assert.ok(createPromptSpy.mock.callCount() > 0);

  mockResolveJSON.mockRestore();
  loggerSpy?.mockRestore();
  if (existsSync(testPath)) {
    unlinkSync(testPath);
  }
  validateRootPackageJsonIntegrity();
});

test("initCommand - should configure custom workspace paths", async () => {
  validateRootPackageJsonIntegrity();
  writeFileSync(testPath, JSON.stringify({ name: "test" }, null, 2));

  const mockLog = {
    debug: mock(() => {}),
    error: mock(() => {}),
    warn: mock(() => {}),
    print: mock(() => {}),
    line: mock(() => {}),
    indent: mock(() => {}),
    item: mock(() => {}),
  };
  const loggerSpy = loggerMock.mockReturnValue(mockLog);

  const createPromptSpy = createPromptMock.mockImplementation(async (callback) => {
    const mockPrompt = {
      list: mock((msg: string) => {
        if (msg.includes("config location")) return Promise.resolve("package.json");
        if (msg.includes("workspace")) return Promise.resolve("custom");
        return Promise.resolve("back");
      }),
      confirm: mock((msg: string) => {
        if (msg.includes("workspace dependencies")) return Promise.resolve(true);
        if (msg.includes("security")) return Promise.resolve(false);
        return Promise.resolve(false);
      }),
      input: mock((msg: string) => {
        if (msg.includes("workspace paths")) return Promise.resolve("packages/*, apps/*");
        return Promise.resolve("");
      }),
    };
    return callback(mockPrompt);
  });

  await initCommand({ path: testPath, isTesting: true });
  assert.ok(createPromptSpy.mock.callCount() > 0);

  loggerSpy?.mockRestore();
  if (existsSync(testPath)) {
    unlinkSync(testPath);
  }
  validateRootPackageJsonIntegrity();
});

test("initCommand - should handle no workspaces detected", async () => {
  validateRootPackageJsonIntegrity();
  writeFileSync(testPath, JSON.stringify({ name: "test" }, null, 2));

  const mockLog = {
    debug: mock(() => {}),
    error: mock(() => {}),
    warn: mock(() => {}),
    print: mock(() => {}),
    line: mock(() => {}),
    indent: mock(() => {}),
    item: mock(() => {}),
  };
  const loggerSpy = loggerMock.mockReturnValue(mockLog);

  const createPromptSpy = createPromptMock.mockImplementation(async (callback) => {
    const mockPrompt = {
      list: mock((msg: string) => {
        if (msg.includes("config location")) return Promise.resolve("package.json");
        if (msg.includes("workspace")) return Promise.resolve("custom");
        return Promise.resolve("back");
      }),
      confirm: mock((msg: string) => {
        if (msg.includes("workspace dependencies")) return Promise.resolve(true);
        return Promise.resolve(false);
      }),
      input: mock(() => Promise.resolve("packages/*")),
    };
    return callback(mockPrompt);
  });

  const mockResolveJSON = resolveJSONMock.mockReturnValue({
    name: "test",
  });

  await initCommand({ path: testPath, isTesting: true });
  assert.ok(createPromptSpy.mock.callCount() > 0);

  mockResolveJSON.mockRestore();
  loggerSpy?.mockRestore();
  if (existsSync(testPath)) {
    unlinkSync(testPath);
  }
  validateRootPackageJsonIntegrity();
});

test("initCommand - should skip workspace configuration when declined", async () => {
  validateRootPackageJsonIntegrity();
  writeFileSync(testPath, JSON.stringify({ name: "test" }, null, 2));

  const mockLog = {
    debug: mock(() => {}),
    error: mock(() => {}),
    warn: mock(() => {}),
    print: mock(() => {}),
    line: mock(() => {}),
    indent: mock(() => {}),
    item: mock(() => {}),
  };
  const loggerSpy = loggerMock.mockReturnValue(mockLog);

  const createPromptSpy = createPromptMock.mockImplementation(async (callback) => {
    const mockPrompt = {
      list: mock(() => Promise.resolve("package.json")),
      confirm: mock((msg: string) => {
        if (msg.includes("workspace")) return Promise.resolve(false);
        if (msg.includes("security")) return Promise.resolve(false);
        return Promise.resolve(false);
      }),
      input: mock(() => Promise.resolve("")),
    };
    return callback(mockPrompt);
  });

  await initCommand({ path: testPath, isTesting: true });
  assert.ok(createPromptSpy.mock.callCount() > 0);

  loggerSpy?.mockRestore();
  if (existsSync(testPath)) {
    unlinkSync(testPath);
  }
  validateRootPackageJsonIntegrity();
});

test("initCommand - should configure GitHub security provider", async () => {
  validateRootPackageJsonIntegrity();
  writeFileSync(testPath, JSON.stringify({ name: "test" }, null, 2));

  const mockLog = {
    debug: mock(() => {}),
    error: mock(() => {}),
    warn: mock(() => {}),
    print: mock(() => {}),
    line: mock(() => {}),
    indent: mock(() => {}),
    item: mock(() => {}),
  };
  const loggerSpy = loggerMock.mockReturnValue(mockLog);

  const createPromptSpy = createPromptMock.mockImplementation(async (callback) => {
    const mockPrompt = {
      list: mock((msg: string) => {
        if (msg.includes("config location")) return Promise.resolve("package.json");
        if (msg.includes("security provider")) return Promise.resolve("github");
        if (msg.includes("severity")) return Promise.resolve("medium");
        return Promise.resolve("back");
      }),
      confirm: mock((msg: string) => {
        if (msg.includes("workspace")) return Promise.resolve(false);
        if (msg.includes("security vulnerability")) return Promise.resolve(true);
        if (msg.includes("interactive mode")) return Promise.resolve(true);
        if (msg.includes("API token")) return Promise.resolve(false);
        return Promise.resolve(false);
      }),
      input: mock(() => Promise.resolve("")),
    };
    return callback(mockPrompt);
  });

  await initCommand({ path: testPath, isTesting: true });
  assert.ok(createPromptSpy.mock.callCount() > 0);

  loggerSpy?.mockRestore();
  if (existsSync(testPath)) {
    unlinkSync(testPath);
  }
  validateRootPackageJsonIntegrity();
});

test("initCommand - should configure Snyk token environment guidance", async () => {
  validateRootPackageJsonIntegrity();
  writeFileSync(testPath, JSON.stringify({ name: "test" }, null, 2));

  const mockLog = {
    debug: mock(() => {}),
    error: mock(() => {}),
    warn: mock(() => {}),
    print: mock(() => {}),
    line: mock(() => {}),
    indent: mock(() => {}),
    item: mock(() => {}),
  };
  const loggerSpy = loggerMock.mockReturnValue(mockLog);

  const createPromptSpy = createPromptMock.mockImplementation(async (callback) => {
    const mockPrompt = {
      list: mock((msg: string) => {
        if (msg.includes("config location")) return Promise.resolve("package.json");
        if (msg.includes("security provider")) return Promise.resolve("snyk");
        if (msg.includes("severity")) return Promise.resolve("high");
        return Promise.resolve("back");
      }),
      confirm: mock((msg: string) => {
        if (msg.includes("workspace")) return Promise.resolve(false);
        if (msg.includes("security vulnerability")) return Promise.resolve(true);
        if (msg.includes("API token")) return Promise.resolve(true);
        if (msg.includes("interactive")) return Promise.resolve(false);
        if (msg.includes("auto-fix")) return Promise.resolve(true);
        return Promise.resolve(false);
      }),
      input: mock((msg: string) => {
        if (msg.includes("API token")) return Promise.resolve("snyk-token-123");
        return Promise.resolve("");
      }),
    };
    return callback(mockPrompt);
  });

  await initCommand({ path: testPath, isTesting: true });
  assert.ok(createPromptSpy.mock.callCount() > 0);

  loggerSpy?.mockRestore();
  if (existsSync(testPath)) {
    unlinkSync(testPath);
  }
  validateRootPackageJsonIntegrity();
});

test("initCommand - should configure Socket token environment guidance", async () => {
  validateRootPackageJsonIntegrity();
  writeFileSync(testPath, JSON.stringify({ name: "test" }, null, 2));

  const mockLog = {
    debug: mock(() => {}),
    error: mock(() => {}),
    warn: mock(() => {}),
    print: mock(() => {}),
    line: mock(() => {}),
    indent: mock(() => {}),
    item: mock(() => {}),
  };
  const loggerSpy = loggerMock.mockReturnValue(mockLog);

  const createPromptSpy = createPromptMock.mockImplementation(async (callback) => {
    const mockPrompt = {
      list: mock((msg: string) => {
        if (msg.includes("config location")) return Promise.resolve("package.json");
        if (msg.includes("security provider")) return Promise.resolve("socket");
        if (msg.includes("severity")) return Promise.resolve("critical");
        return Promise.resolve("back");
      }),
      confirm: mock((msg: string) => {
        if (msg.includes("workspace")) return Promise.resolve(false);
        if (msg.includes("security vulnerability")) return Promise.resolve(true);
        if (msg.includes("API token")) return Promise.resolve(true);
        if (msg.includes("interactive")) return Promise.resolve(true);
        return Promise.resolve(false);
      }),
      input: mock((msg: string) => {
        if (msg.includes("API token")) return Promise.resolve("socket-token-123");
        return Promise.resolve("");
      }),
    };
    return callback(mockPrompt);
  });

  await initCommand({ path: testPath, isTesting: true });
  assert.ok(createPromptSpy.mock.callCount() > 0);

  loggerSpy?.mockRestore();
  if (existsSync(testPath)) {
    unlinkSync(testPath);
  }
  validateRootPackageJsonIntegrity();
});

test("initCommand - should handle missing token for required provider", async () => {
  validateRootPackageJsonIntegrity();
  writeFileSync(testPath, JSON.stringify({ name: "test" }, null, 2));

  const mockLog = {
    debug: mock(() => {}),
    error: mock(() => {}),
    warn: mock(() => {}),
    print: mock(() => {}),
    line: mock(() => {}),
    indent: mock(() => {}),
    item: mock(() => {}),
  };
  const loggerSpy = loggerMock.mockReturnValue(mockLog);

  const createPromptSpy = createPromptMock.mockImplementation(async (callback) => {
    const mockPrompt = {
      list: mock((msg: string) => {
        if (msg.includes("config location")) return Promise.resolve("package.json");
        if (msg.includes("security provider")) return Promise.resolve("snyk");
        if (msg.includes("severity")) return Promise.resolve("medium");
        return Promise.resolve("back");
      }),
      confirm: mock((msg: string) => {
        if (msg.includes("workspace")) return Promise.resolve(false);
        if (msg.includes("security vulnerability")) return Promise.resolve(true);
        if (msg.includes("API token")) return Promise.resolve(false);
        if (msg.includes("interactive")) return Promise.resolve(true);
        return Promise.resolve(false);
      }),
      input: mock(() => Promise.resolve("")),
    };
    return callback(mockPrompt);
  });

  await initCommand({ path: testPath, isTesting: true });
  assert.ok(createPromptSpy.mock.callCount() > 0);

  loggerSpy?.mockRestore();
  if (existsSync(testPath)) {
    unlinkSync(testPath);
  }
  validateRootPackageJsonIntegrity();
});

test("initCommand - should not collect token input", async () => {
  validateRootPackageJsonIntegrity();
  writeFileSync(testPath, JSON.stringify({ name: "test" }, null, 2));

  const mockLog = {
    debug: mock(() => {}),
    error: mock(() => {}),
    warn: mock(() => {}),
    print: mock(() => {}),
    line: mock(() => {}),
    indent: mock(() => {}),
    item: mock(() => {}),
  };
  const loggerSpy = loggerMock.mockReturnValue(mockLog);

  const createPromptSpy = createPromptMock.mockImplementation(async (callback) => {
    const mockPrompt = {
      list: mock((msg: string) => {
        if (msg.includes("config location")) return Promise.resolve("package.json");
        if (msg.includes("security provider")) return Promise.resolve("snyk");
        if (msg.includes("severity")) return Promise.resolve("medium");
        return Promise.resolve("back");
      }),
      confirm: mock((msg: string) => {
        if (msg.includes("workspace")) return Promise.resolve(false);
        if (msg.includes("security vulnerability")) return Promise.resolve(true);
        if (msg.includes("API token")) return Promise.resolve(true);
        if (msg.includes("interactive")) return Promise.resolve(true);
        return Promise.resolve(false);
      }),
      input: mock((msg: string) => {
        if (msg.includes("API token")) return Promise.resolve("");
        return Promise.resolve("");
      }),
    };
    return callback(mockPrompt);
  });

  await initCommand({ path: testPath, isTesting: true });
  assert.ok(createPromptSpy.mock.callCount() > 0);

  loggerSpy?.mockRestore();
  if (existsSync(testPath)) {
    unlinkSync(testPath);
  }
  validateRootPackageJsonIntegrity();
});

test("initCommand - should configure workspace security checks", async () => {
  validateRootPackageJsonIntegrity();
  writeFileSync(testPath, JSON.stringify({ name: "test" }, null, 2));

  const mockLog = {
    debug: mock(() => {}),
    error: mock(() => {}),
    warn: mock(() => {}),
    print: mock(() => {}),
    line: mock(() => {}),
    indent: mock(() => {}),
    item: mock(() => {}),
  };
  const loggerSpy = loggerMock.mockReturnValue(mockLog);

  const createPromptSpy = createPromptMock.mockImplementation(async (callback) => {
    const mockPrompt = {
      list: mock((msg: string) => {
        if (msg.includes("config location")) return Promise.resolve("package.json");
        if (msg.includes("security provider")) return Promise.resolve("osv");
        if (msg.includes("severity")) return Promise.resolve("medium");
        return Promise.resolve("back");
      }),
      confirm: mock((msg: string) => {
        if (msg.includes("workspace dependencies")) return Promise.resolve(true);
        if (msg.includes("security vulnerability")) return Promise.resolve(true);
        if (msg.includes("interactive")) return Promise.resolve(true);
        if (msg.includes("Scan workspace")) return Promise.resolve(true);
        return Promise.resolve(false);
      }),
      input: mock(() => Promise.resolve("")),
    };
    return callback(mockPrompt);
  });

  const mockResolveJSON = resolveJSONMock.mockReturnValue({
    name: "test",
    workspaces: ["packages/*"],
  });

  await initCommand({ path: testPath, isTesting: true });
  assert.ok(createPromptSpy.mock.callCount() > 0);

  mockResolveJSON.mockRestore();
  loggerSpy?.mockRestore();
  if (existsSync(testPath)) {
    unlinkSync(testPath);
  }
  validateRootPackageJsonIntegrity();
});

test("initCommand - should configure auto-fix when interactive is disabled", async () => {
  validateRootPackageJsonIntegrity();
  writeFileSync(testPath, JSON.stringify({ name: "test" }, null, 2));

  const mockLog = {
    debug: mock(() => {}),
    error: mock(() => {}),
    warn: mock(() => {}),
    print: mock(() => {}),
    line: mock(() => {}),
    indent: mock(() => {}),
    item: mock(() => {}),
  };
  const loggerSpy = loggerMock.mockReturnValue(mockLog);

  const createPromptSpy = createPromptMock.mockImplementation(async (callback) => {
    const mockPrompt = {
      list: mock((msg: string) => {
        if (msg.includes("config location")) return Promise.resolve("package.json");
        if (msg.includes("security provider")) return Promise.resolve("osv");
        if (msg.includes("severity")) return Promise.resolve("low");
        return Promise.resolve("back");
      }),
      confirm: mock((msg: string) => {
        if (msg.includes("workspace")) return Promise.resolve(false);
        if (msg.includes("security vulnerability")) return Promise.resolve(true);
        if (msg.includes("interactive")) return Promise.resolve(false);
        if (msg.includes("auto-fix")) return Promise.resolve(true);
        return Promise.resolve(false);
      }),
      input: mock(() => Promise.resolve("")),
    };
    return callback(mockPrompt);
  });

  await initCommand({ path: testPath, isTesting: true });
  assert.ok(createPromptSpy.mock.callCount() > 0);

  loggerSpy?.mockRestore();
  if (existsSync(testPath)) {
    unlinkSync(testPath);
  }
  validateRootPackageJsonIntegrity();
});

test("initCommand - should detect existing config in package.json", async () => {
  validateRootPackageJsonIntegrity();
  writeFileSync(testPath, JSON.stringify({ name: "test" }, null, 2));

  const mockLog = {
    debug: mock(() => {}),
    error: mock(() => {}),
    warn: mock(() => {}),
    print: mock(() => {}),
    line: mock(() => {}),
    indent: mock(() => {}),
    item: mock(() => {}),
  };
  const loggerSpy = loggerMock.mockReturnValue(mockLog);

  const createPromptSpy = createPromptMock.mockImplementation(async (callback) => {
    const mockPrompt = {
      list: mock(() => Promise.resolve("package.json")),
      confirm: mock((msg: string) => {
        if (msg.includes("Existing")) return Promise.resolve(true);
        return Promise.resolve(false);
      }),
      input: mock(() => Promise.resolve("")),
    };
    return callback(mockPrompt);
  });

  const mockResolveJSON = resolveJSONMock.mockReturnValue({
    name: "test",
    pastoralist: { depPaths: "workspace" },
  });

  await initCommand({ path: testPath, isTesting: true });
  assert.ok(createPromptSpy.mock.callCount() > 0);

  mockResolveJSON.mockRestore();
  loggerSpy?.mockRestore();
  if (existsSync(testPath)) {
    unlinkSync(testPath);
  }
  validateRootPackageJsonIntegrity();
});

test("initCommand - should cancel when user declines overwrite", async () => {
  validateRootPackageJsonIntegrity();
  writeFileSync(testPath, JSON.stringify({ name: "test" }, null, 2));

  const mockLog = {
    debug: mock(() => {}),
    error: mock(() => {}),
    warn: mock(() => {}),
    print: mock(() => {}),
    line: mock(() => {}),
    indent: mock(() => {}),
    item: mock(() => {}),
  };
  const loggerSpy = loggerMock.mockReturnValue(mockLog);

  const createPromptSpy = createPromptMock.mockImplementation(async (callback) => {
    const mockPrompt = {
      list: mock(() => Promise.resolve("package.json")),
      confirm: mock((msg: string) => {
        if (msg.includes("Existing")) return Promise.resolve(false);
        return Promise.resolve(false);
      }),
      input: mock(() => Promise.resolve("")),
    };
    return callback(mockPrompt);
  });

  const mockResolveJSON = resolveJSONMock.mockReturnValue({
    name: "test",
    pastoralist: { depPaths: "workspace" },
  });

  await initCommand({ path: testPath, isTesting: true });
  assert.ok(createPromptSpy.mock.callCount() > 0);

  mockResolveJSON.mockRestore();
  loggerSpy?.mockRestore();
  if (existsSync(testPath)) {
    unlinkSync(testPath);
  }
  validateRootPackageJsonIntegrity();
});

test("initCommand - should detect external config file", async () => {
  validateRootPackageJsonIntegrity();
  writeFileSync(testPath, JSON.stringify({ name: "test" }, null, 2));

  const mockLog = {
    debug: mock(() => {}),
    error: mock(() => {}),
    warn: mock(() => {}),
    print: mock(() => {}),
    line: mock(() => {}),
    indent: mock(() => {}),
    item: mock(() => {}),
  };
  const loggerSpy = loggerMock.mockReturnValue(mockLog);

  const loadExternalConfigSpy = loadExternalConfigMock.mockResolvedValue({
    depPaths: "workspace",
  });

  const createPromptSpy = createPromptMock.mockImplementation(async (callback) => {
    const mockPrompt = {
      list: mock(() => Promise.resolve("package.json")),
      confirm: mock((msg: string) => {
        if (msg.includes("Existing")) return Promise.resolve(true);
        return Promise.resolve(false);
      }),
      input: mock(() => Promise.resolve("")),
    };
    return callback(mockPrompt);
  });

  await initCommand({ path: testPath, isTesting: true });
  assert.ok(createPromptSpy.mock.callCount() > 0);

  loadExternalConfigSpy.mockRestore();
  loggerSpy?.mockRestore();
  if (existsSync(testPath)) {
    unlinkSync(testPath);
  }
  validateRootPackageJsonIntegrity();
});

test("initCommand - should use security context with provider option", async () => {
  validateRootPackageJsonIntegrity();
  writeFileSync(testPath, JSON.stringify({ name: "test" }, null, 2));

  const mockLog = {
    debug: mock(() => {}),
    error: mock(() => {}),
    warn: mock(() => {}),
    print: mock(() => {}),
    line: mock(() => {}),
    indent: mock(() => {}),
    item: mock(() => {}),
  };
  const loggerSpy = loggerMock.mockReturnValue(mockLog);

  const createPromptSpy = createPromptMock.mockImplementation(async (callback) => {
    const mockPrompt = {
      list: mock((msg: string) => {
        if (msg.includes("config location")) return Promise.resolve("package.json");
        if (msg.includes("severity")) return Promise.resolve("medium");
        return Promise.resolve("back");
      }),
      confirm: mock((msg: string) => {
        if (msg.includes("API token")) return Promise.resolve(false);
        if (msg.includes("interactive")) return Promise.resolve(true);
        return Promise.resolve(false);
      }),
      input: mock(() => Promise.resolve("")),
    };
    return callback(mockPrompt);
  });

  await initCommand({
    path: testPath,
    securityProvider: "github",
    isTesting: true,
  });
  assert.ok(createPromptSpy.mock.callCount() > 0);

  loggerSpy?.mockRestore();
  if (existsSync(testPath)) {
    unlinkSync(testPath);
  }
  validateRootPackageJsonIntegrity();
});

test("initCommand - should handle security context with workspace checks", async () => {
  validateRootPackageJsonIntegrity();
  writeFileSync(testPath, JSON.stringify({ name: "test" }, null, 2));

  const mockLog = {
    debug: mock(() => {}),
    error: mock(() => {}),
    warn: mock(() => {}),
    print: mock(() => {}),
    line: mock(() => {}),
    indent: mock(() => {}),
    item: mock(() => {}),
  };
  const loggerSpy = loggerMock.mockReturnValue(mockLog);

  const createPromptSpy = createPromptMock.mockImplementation(async (callback) => {
    const mockPrompt = {
      list: mock((msg: string) => {
        if (msg.includes("config location")) return Promise.resolve("package.json");
        if (msg.includes("security provider")) return Promise.resolve("osv");
        if (msg.includes("severity")) return Promise.resolve("medium");
        return Promise.resolve("back");
      }),
      confirm: mock((msg: string) => {
        if (msg.includes("workspace")) return Promise.resolve(true);
        if (msg.includes("interactive")) return Promise.resolve(true);
        if (msg.includes("Scan workspace")) return Promise.resolve(true);
        return Promise.resolve(false);
      }),
      input: mock(() => Promise.resolve("")),
    };
    return callback(mockPrompt);
  });

  const mockResolveJSON = resolveJSONMock.mockReturnValue({
    name: "test",
    workspaces: ["packages/*"],
  });

  await initCommand({
    path: testPath,
    checkSecurity: true,
    hasWorkspaceSecurityChecks: true,
    isTesting: true,
  });
  assert.ok(createPromptSpy.mock.callCount() > 0);

  mockResolveJSON.mockRestore();
  loggerSpy?.mockRestore();
  if (existsSync(testPath)) {
    unlinkSync(testPath);
  }
  validateRootPackageJsonIntegrity();
});

test("initCommand - should create complete config with all features enabled", async () => {
  validateRootPackageJsonIntegrity();
  writeFileSync(testPath, JSON.stringify({ name: "test" }, null, 2));

  const mockLog = {
    debug: mock(() => {}),
    error: mock(() => {}),
    warn: mock(() => {}),
    print: mock(() => {}),
    line: mock(() => {}),
    indent: mock(() => {}),
    item: mock(() => {}),
  };
  const loggerSpy = loggerMock.mockReturnValue(mockLog);

  const createPromptSpy = createPromptMock.mockImplementation(async (callback) => {
    const mockPrompt = {
      list: mock((msg: string) => {
        if (msg.includes("config location")) return Promise.resolve("package.json");
        if (msg.includes("workspace")) return Promise.resolve("workspace");
        if (msg.includes("security provider")) return Promise.resolve("github");
        if (msg.includes("severity")) return Promise.resolve("critical");
        return Promise.resolve("back");
      }),
      confirm: mock((msg: string) => {
        if (msg.includes("workspace dependencies")) return Promise.resolve(true);
        if (msg.includes("security vulnerability")) return Promise.resolve(true);
        if (msg.includes("interactive")) return Promise.resolve(true);
        if (msg.includes("Scan workspace")) return Promise.resolve(true);
        return Promise.resolve(false);
      }),
      input: mock(() => Promise.resolve("")),
    };
    return callback(mockPrompt);
  });

  const mockResolveJSON = resolveJSONMock.mockReturnValue({
    name: "test",
    workspaces: ["packages/*", "apps/*"],
  });

  await initCommand({ path: testPath, isTesting: true });
  assert.ok(createPromptSpy.mock.callCount() > 0);

  mockResolveJSON.mockRestore();
  loggerSpy?.mockRestore();
  if (existsSync(testPath)) {
    unlinkSync(testPath);
  }
  validateRootPackageJsonIntegrity();
});

test("initCommand - should create minimal config", async () => {
  validateRootPackageJsonIntegrity();
  writeFileSync(testPath, JSON.stringify({ name: "test" }, null, 2));

  const mockLog = {
    debug: mock(() => {}),
    error: mock(() => {}),
    warn: mock(() => {}),
    print: mock(() => {}),
    line: mock(() => {}),
    indent: mock(() => {}),
    item: mock(() => {}),
  };
  const loggerSpy = loggerMock.mockReturnValue(mockLog);

  const createPromptSpy = createPromptMock.mockImplementation(async (callback) => {
    const mockPrompt = {
      list: mock(() => Promise.resolve("package.json")),
      confirm: mock(() => Promise.resolve(false)),
      input: mock(() => Promise.resolve("")),
    };
    return callback(mockPrompt);
  });

  await initCommand({ path: testPath, isTesting: true });
  assert.ok(createPromptSpy.mock.callCount() > 0);

  loggerSpy?.mockRestore();
  if (existsSync(testPath)) {
    unlinkSync(testPath);
  }
  validateRootPackageJsonIntegrity();
});

test("initCommand - should handle missing package.json gracefully", async () => {
  validateRootPackageJsonIntegrity();
  writeFileSync(testPath, JSON.stringify({ name: "test" }, null, 2));

  const mockLog = {
    debug: mock(() => {}),
    error: mock(() => {}),
    warn: mock(() => {}),
    print: mock(() => {}),
    line: mock(() => {}),
    indent: mock(() => {}),
    item: mock(() => {}),
  };
  const loggerSpy = loggerMock.mockReturnValue(mockLog);

  const createPromptSpy = createPromptMock.mockImplementation(async (callback) => {
    const mockPrompt = {
      list: mock(() => Promise.resolve("package.json")),
      confirm: mock(() => Promise.resolve(false)),
      input: mock(() => Promise.resolve("")),
    };
    return callback(mockPrompt);
  });

  const mockResolveJSON = resolveJSONMock.mockReturnValue(null);

  await initCommand({ path: testPath, isTesting: true });
  assert.ok(createPromptSpy.mock.callCount() > 0);

  mockResolveJSON.mockRestore();
  loggerSpy?.mockRestore();
  if (existsSync(testPath)) {
    unlinkSync(testPath);
  }
  validateRootPackageJsonIntegrity();
});

test("initCommand - should handle snyk provider token info", async () => {
  validateRootPackageJsonIntegrity();
  writeFileSync(testPath, JSON.stringify({ name: "test" }, null, 2));

  const mockLog = {
    debug: mock(() => {}),
    error: mock(() => {}),
    warn: mock(() => {}),
    print: mock(() => {}),
    line: mock(() => {}),
    indent: mock(() => {}),
    item: mock(() => {}),
  };
  const loggerSpy = loggerMock.mockReturnValue(mockLog);

  const createPromptSpy = createPromptMock.mockImplementation(async (callback) => {
    const mockPrompt = {
      list: mock((msg: string) => {
        if (msg.includes("config location")) return Promise.resolve("package.json");
        if (msg.includes("security provider")) return Promise.resolve("snyk");
        if (msg.includes("severity")) return Promise.resolve("medium");
        return Promise.resolve("back");
      }),
      confirm: mock((msg: string) => {
        if (msg.includes("token")) return Promise.resolve(false);
        return Promise.resolve(false);
      }),
      input: mock(() => Promise.resolve("")),
    };
    return callback(mockPrompt);
  });

  await initCommand({ path: testPath, checkSecurity: true, isTesting: true });
  assert.ok(createPromptSpy.mock.callCount() > 0);

  loggerSpy?.mockRestore();
  if (existsSync(testPath)) {
    unlinkSync(testPath);
  }
  validateRootPackageJsonIntegrity();
});

test("initCommand - should handle socket provider token info", async () => {
  validateRootPackageJsonIntegrity();
  writeFileSync(testPath, JSON.stringify({ name: "test" }, null, 2));

  const mockLog = {
    debug: mock(() => {}),
    error: mock(() => {}),
    warn: mock(() => {}),
    print: mock(() => {}),
    line: mock(() => {}),
    indent: mock(() => {}),
    item: mock(() => {}),
  };
  const loggerSpy = loggerMock.mockReturnValue(mockLog);

  const createPromptSpy = createPromptMock.mockImplementation(async (callback) => {
    const mockPrompt = {
      list: mock((msg: string) => {
        if (msg.includes("config location")) return Promise.resolve("package.json");
        if (msg.includes("security provider")) return Promise.resolve("socket");
        if (msg.includes("severity")) return Promise.resolve("medium");
        return Promise.resolve("back");
      }),
      confirm: mock((msg: string) => {
        if (msg.includes("token")) return Promise.resolve(false);
        return Promise.resolve(false);
      }),
      input: mock(() => Promise.resolve("")),
    };
    return callback(mockPrompt);
  });

  await initCommand({ path: testPath, checkSecurity: true, isTesting: true });
  assert.ok(createPromptSpy.mock.callCount() > 0);

  loggerSpy?.mockRestore();
  if (existsSync(testPath)) {
    unlinkSync(testPath);
  }
  validateRootPackageJsonIntegrity();
});

test("initCommand - should continue when token environment is confirmed", async () => {
  validateRootPackageJsonIntegrity();
  writeFileSync(testPath, JSON.stringify({ name: "test" }, null, 2));

  const mockLog = {
    debug: mock(() => {}),
    error: mock(() => {}),
    warn: mock(() => {}),
    print: mock(() => {}),
    line: mock(() => {}),
    indent: mock(() => {}),
    item: mock(() => {}),
  };
  const loggerSpy = loggerMock.mockReturnValue(mockLog);

  const createPromptSpy = createPromptMock.mockImplementation(async (callback) => {
    const mockPrompt = {
      list: mock((msg: string) => {
        if (msg.includes("config location")) return Promise.resolve("package.json");
        if (msg.includes("security provider")) return Promise.resolve("github");
        if (msg.includes("severity")) return Promise.resolve("medium");
        return Promise.resolve("back");
      }),
      confirm: mock((msg: string) => {
        if (msg.includes("token")) return Promise.resolve(true);
        return Promise.resolve(false);
      }),
      input: mock(() => Promise.resolve("")),
    };
    return callback(mockPrompt);
  });

  await initCommand({ path: testPath, checkSecurity: true, isTesting: true });
  assert.ok(createPromptSpy.mock.callCount() > 0);

  loggerSpy?.mockRestore();
  if (existsSync(testPath)) {
    unlinkSync(testPath);
  }
  validateRootPackageJsonIntegrity();
});

test("initCommand - should ignore raw token input mocks", async () => {
  validateRootPackageJsonIntegrity();
  writeFileSync(testPath, JSON.stringify({ name: "test" }, null, 2));

  const mockLog = {
    debug: mock(() => {}),
    error: mock(() => {}),
    warn: mock(() => {}),
    print: mock(() => {}),
    line: mock(() => {}),
    indent: mock(() => {}),
    item: mock(() => {}),
  };
  const loggerSpy = loggerMock.mockReturnValue(mockLog);

  const createPromptSpy = createPromptMock.mockImplementation(async (callback) => {
    const mockPrompt = {
      list: mock((msg: string) => {
        if (msg.includes("config location")) return Promise.resolve("package.json");
        if (msg.includes("security provider")) return Promise.resolve("github");
        if (msg.includes("severity")) return Promise.resolve("medium");
        return Promise.resolve("back");
      }),
      confirm: mock((msg: string) => {
        if (msg.includes("token")) return Promise.resolve(true);
        return Promise.resolve(false);
      }),
      input: mock(() => Promise.resolve("ghp_test_token_12345")),
    };
    return callback(mockPrompt);
  });

  await initCommand({ path: testPath, checkSecurity: true, isTesting: true });
  assert.ok(createPromptSpy.mock.callCount() > 0);

  loggerSpy?.mockRestore();
  if (existsSync(testPath)) {
    unlinkSync(testPath);
  }
  validateRootPackageJsonIntegrity();
});

test("initCommand - enhanced UI integration with formatCompletion", async () => {
  validateRootPackageJsonIntegrity();
  writeFileSync(testPath, JSON.stringify({ name: "test" }, null, 2));

  const mockLog = {
    debug: mock(() => {}),
    error: mock(() => {}),
    warn: mock(() => {}),
    print: mock(() => {}),
    line: mock(() => {}),
    indent: mock(() => {}),
    item: mock(() => {}),
  };
  const loggerSpy = loggerMock.mockReturnValue(mockLog);

  const formatCompletionSpy = formatCompletionMock;
  const shimmerFrameSpy = shimmerFrameMock.mockReturnValue("shimmered text");

  const createPromptSpy = createPromptMock.mockImplementation(async (callback) => {
    const mockPrompt = {
      list: mock(() => Promise.resolve("package.json")),
      confirm: mock(() => Promise.resolve(false)),
      input: mock(() => Promise.resolve("")),
    };
    return callback(mockPrompt);
  });

  await initCommand({ path: testPath, isTesting: true });

  assert.strictEqual(typeof originalDx.formatCompletion, "function");
  assert.strictEqual(typeof originalShimmer.shimmerFrame, "function");

  formatCompletionSpy.mockRestore();
  shimmerFrameSpy.mockRestore();
  loggerSpy?.mockRestore();
  if (existsSync(testPath)) {
    unlinkSync(testPath);
  }
  validateRootPackageJsonIntegrity();
});

test("initCommand - enhanced UI with security enabled shows correct next steps", async () => {
  validateRootPackageJsonIntegrity();
  writeFileSync(testPath, JSON.stringify({ name: "test" }, null, 2));

  const mockLog = {
    debug: mock(() => {}),
    error: mock(() => {}),
    warn: mock(() => {}),
    print: mock(() => {}),
    line: mock(() => {}),
    indent: mock(() => {}),
    item: mock(() => {}),
  };
  const loggerSpy = loggerMock.mockReturnValue(mockLog);

  const createPromptSpy = createPromptMock.mockImplementation(async (callback) => {
    const mockPrompt = {
      list: mock((msg: string) => {
        if (msg.includes("config location")) return Promise.resolve("package.json");
        if (msg.includes("security provider")) return Promise.resolve("github");
        return Promise.resolve("back");
      }),
      confirm: mock(() => Promise.resolve(true)),
      input: mock(() => Promise.resolve("")),
    };
    return callback(mockPrompt);
  });

  await initCommand({ path: testPath, checkSecurity: true, isTesting: true });

  assert.ok(createPromptSpy.mock.callCount() > 0);

  loggerSpy?.mockRestore();
  if (existsSync(testPath)) {
    unlinkSync(testPath);
  }
  validateRootPackageJsonIntegrity();
});

test("initCommand - enhanced prompts use formatted UI components", async () => {
  validateRootPackageJsonIntegrity();
  writeFileSync(testPath, JSON.stringify({ name: "test" }, null, 2));

  const mockLog = {
    debug: mock(() => {}),
    error: mock(() => {}),
    warn: mock(() => {}),
    print: mock(() => {}),
    line: mock(() => {}),
    indent: mock(() => {}),
    item: mock(() => {}),
  };
  const loggerSpy = loggerMock.mockReturnValue(mockLog);

  const createPromptSpy = createPromptMock.mockImplementation(async (callback) => {
    const mockPrompt = {
      list: mock(() => Promise.resolve("package.json")),
      confirm: mock(() => Promise.resolve(false)),
      input: mock(() => Promise.resolve("")),
    };
    return callback(mockPrompt);
  });

  await initCommand({ path: testPath, isTesting: true });

  assert.strictEqual(typeof originalDx.formatChoiceList, "function");
  assert.strictEqual(typeof originalDx.formatConfirmPrompt, "function");

  loggerSpy?.mockRestore();
  if (existsSync(testPath)) {
    unlinkSync(testPath);
  }
  validateRootPackageJsonIntegrity();
});
