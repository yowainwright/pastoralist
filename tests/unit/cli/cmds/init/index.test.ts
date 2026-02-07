import { test, expect, mock, spyOn } from "bun:test";
import { initCommand } from "../../../../../src/cli/cmds/init";
import * as prompt from "../../../../../src/utils/prompts";
import * as scripts from "../../../../../src";
import * as configLoader from "../../../../../src/config";
import * as dxPrompts from "../../../../../src/dx/prompts";
import * as shimmer from "../../../../../src/dx/shimmer";
import { resolve } from "path";
import {
  safeWriteFileSync as writeFileSync,
  safeExistsSync as existsSync,
  safeUnlinkSync as unlinkSync,
  validateRootPackageJsonIntegrity,
} from "../../../setup";

const testPath = resolve(
  __dirname,
  "..",
  "..",
  "..",
  ".test-init-package.json",
);

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
  const loggerSpy = spyOn(scripts, "logger").mockReturnValue(mockLog);

  const createPromptSpy = spyOn(prompt, "createPrompt").mockImplementation(
    async (callback) => {
      const mockPrompt = {
        list: mock(() => Promise.resolve("package.json")),
        confirm: mock(() => Promise.resolve(false)),
        input: mock(() => Promise.resolve("")),
      };
      return callback(mockPrompt);
    },
  );

  await initCommand({ path: testPath, isTesting: true });
  expect(createPromptSpy).toHaveBeenCalled();

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
  const loggerSpy = spyOn(scripts, "logger").mockReturnValue(mockLog);

  const createPromptSpy = spyOn(prompt, "createPrompt").mockImplementation(
    async (callback) => {
      const mockPrompt = {
        list: mock((msg: string) => {
          if (msg.includes("config location"))
            return Promise.resolve("package.json");
          if (msg.includes("security provider")) return Promise.resolve("osv");
          if (msg.includes("severity")) return Promise.resolve("medium");
          return Promise.resolve("back");
        }),
        confirm: mock(() => Promise.resolve(false)),
        input: mock(() => Promise.resolve("")),
      };
      return callback(mockPrompt);
    },
  );

  await initCommand({ path: testPath, checkSecurity: true, isTesting: true });
  expect(createPromptSpy).toHaveBeenCalled();

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
  const loggerSpy = spyOn(scripts, "logger").mockReturnValue(mockLog);

  const createPromptSpy = spyOn(prompt, "createPrompt").mockImplementation(
    async (callback) => {
      const mockPrompt = {
        list: mock((msg: string) => {
          if (msg.includes("config location"))
            return Promise.resolve("package.json");
          return Promise.resolve("back");
        }),
        confirm: mock((msg: string) => {
          if (msg.includes("workspace")) return Promise.resolve(true);
          return Promise.resolve(false);
        }),
        input: mock(() => Promise.resolve("")),
      };
      return callback(mockPrompt);
    },
  );

  await initCommand({
    path: testPath,
    hasWorkspaceSecurityChecks: true,
    isTesting: true,
  });
  expect(createPromptSpy).toHaveBeenCalled();

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
  const loggerSpy = spyOn(scripts, "logger").mockReturnValue(mockLog);

  const createPromptSpy = spyOn(prompt, "createPrompt").mockImplementation(
    async (callback) => {
      const mockPrompt = {
        list: mock(() => Promise.resolve("package.json")),
        confirm: mock(() => Promise.resolve(false)),
        input: mock(() => Promise.resolve("")),
      };
      return callback(mockPrompt);
    },
  );

  await initCommand({ path: testPath, isTesting: true });
  expect(createPromptSpy).toHaveBeenCalled();

  loggerSpy?.mockRestore();
  if (existsSync(testPath)) {
    unlinkSync(testPath);
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
  const loggerSpy = spyOn(scripts, "logger").mockReturnValue(mockLog);

  const createPromptSpy = spyOn(prompt, "createPrompt").mockImplementation(
    async (callback) => {
      const mockPrompt = {
        list: mock((msg: string) => {
          if (msg.includes("config location"))
            return Promise.resolve("external");
          if (msg.includes("config file format"))
            return Promise.resolve(".pastoralistrc.json");
          return Promise.resolve("back");
        }),
        confirm: mock(() => Promise.resolve(false)),
        input: mock(() => Promise.resolve("")),
      };
      return callback(mockPrompt);
    },
  );

  await initCommand({ path: testPath, isTesting: true });
  expect(createPromptSpy).toHaveBeenCalled();

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
  const loggerSpy = spyOn(scripts, "logger").mockReturnValue(mockLog);

  const createPromptSpy = spyOn(prompt, "createPrompt").mockImplementation(
    async (callback) => {
      const mockPrompt = {
        list: mock((msg: string) => {
          if (msg.includes("config location"))
            return Promise.resolve("external");
          if (msg.includes("config file format"))
            return Promise.resolve(".pastoralistrc.json");
          return Promise.resolve("back");
        }),
        confirm: mock((msg: string) => {
          if (msg.includes("already exists")) return Promise.resolve(false);
          return Promise.resolve(false);
        }),
        input: mock(() => Promise.resolve("")),
      };
      return callback(mockPrompt);
    },
  );

  await initCommand({ path: testPath, isTesting: true });
  expect(createPromptSpy).toHaveBeenCalled();

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
  const loggerSpy = spyOn(scripts, "logger").mockReturnValue(mockLog);

  const createPromptSpy = spyOn(prompt, "createPrompt").mockImplementation(
    async (callback) => {
      const mockPrompt = {
        list: mock((msg: string) => {
          if (msg.includes("config location"))
            return Promise.resolve("package.json");
          if (msg.includes("workspace")) return Promise.resolve("workspace");
          return Promise.resolve("back");
        }),
        confirm: mock((msg: string) => {
          if (msg.includes("workspace dependencies"))
            return Promise.resolve(true);
          if (msg.includes("security")) return Promise.resolve(false);
          return Promise.resolve(false);
        }),
        input: mock(() => Promise.resolve("")),
      };
      return callback(mockPrompt);
    },
  );

  const mockResolveJSON = spyOn(scripts, "resolveJSON").mockReturnValue({
    name: "test",
    workspaces: ["packages/*"],
  });

  await initCommand({ path: testPath, isTesting: true });
  expect(createPromptSpy).toHaveBeenCalled();

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
  const loggerSpy = spyOn(scripts, "logger").mockReturnValue(mockLog);

  const createPromptSpy = spyOn(prompt, "createPrompt").mockImplementation(
    async (callback) => {
      const mockPrompt = {
        list: mock((msg: string) => {
          if (msg.includes("config location"))
            return Promise.resolve("package.json");
          if (msg.includes("workspace")) return Promise.resolve("custom");
          return Promise.resolve("back");
        }),
        confirm: mock((msg: string) => {
          if (msg.includes("workspace dependencies"))
            return Promise.resolve(true);
          if (msg.includes("security")) return Promise.resolve(false);
          return Promise.resolve(false);
        }),
        input: mock((msg: string) => {
          if (msg.includes("workspace paths"))
            return Promise.resolve("packages/*, apps/*");
          return Promise.resolve("");
        }),
      };
      return callback(mockPrompt);
    },
  );

  await initCommand({ path: testPath, isTesting: true });
  expect(createPromptSpy).toHaveBeenCalled();

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
  const loggerSpy = spyOn(scripts, "logger").mockReturnValue(mockLog);

  const createPromptSpy = spyOn(prompt, "createPrompt").mockImplementation(
    async (callback) => {
      const mockPrompt = {
        list: mock((msg: string) => {
          if (msg.includes("config location"))
            return Promise.resolve("package.json");
          if (msg.includes("workspace")) return Promise.resolve("custom");
          return Promise.resolve("back");
        }),
        confirm: mock((msg: string) => {
          if (msg.includes("workspace dependencies"))
            return Promise.resolve(true);
          return Promise.resolve(false);
        }),
        input: mock(() => Promise.resolve("packages/*")),
      };
      return callback(mockPrompt);
    },
  );

  const mockResolveJSON = spyOn(scripts, "resolveJSON").mockReturnValue({
    name: "test",
  });

  await initCommand({ path: testPath, isTesting: true });
  expect(createPromptSpy).toHaveBeenCalled();

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
  const loggerSpy = spyOn(scripts, "logger").mockReturnValue(mockLog);

  const createPromptSpy = spyOn(prompt, "createPrompt").mockImplementation(
    async (callback) => {
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
    },
  );

  await initCommand({ path: testPath, isTesting: true });
  expect(createPromptSpy).toHaveBeenCalled();

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
  const loggerSpy = spyOn(scripts, "logger").mockReturnValue(mockLog);

  const createPromptSpy = spyOn(prompt, "createPrompt").mockImplementation(
    async (callback) => {
      const mockPrompt = {
        list: mock((msg: string) => {
          if (msg.includes("config location"))
            return Promise.resolve("package.json");
          if (msg.includes("security provider"))
            return Promise.resolve("github");
          if (msg.includes("severity")) return Promise.resolve("medium");
          return Promise.resolve("back");
        }),
        confirm: mock((msg: string) => {
          if (msg.includes("workspace")) return Promise.resolve(false);
          if (msg.includes("security vulnerability"))
            return Promise.resolve(true);
          if (msg.includes("interactive mode")) return Promise.resolve(true);
          if (msg.includes("API token")) return Promise.resolve(false);
          return Promise.resolve(false);
        }),
        input: mock(() => Promise.resolve("")),
      };
      return callback(mockPrompt);
    },
  );

  await initCommand({ path: testPath, isTesting: true });
  expect(createPromptSpy).toHaveBeenCalled();

  loggerSpy?.mockRestore();
  if (existsSync(testPath)) {
    unlinkSync(testPath);
  }
  validateRootPackageJsonIntegrity();
});

test("initCommand - should configure Snyk with token", async () => {
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
  const loggerSpy = spyOn(scripts, "logger").mockReturnValue(mockLog);

  const createPromptSpy = spyOn(prompt, "createPrompt").mockImplementation(
    async (callback) => {
      const mockPrompt = {
        list: mock((msg: string) => {
          if (msg.includes("config location"))
            return Promise.resolve("package.json");
          if (msg.includes("security provider")) return Promise.resolve("snyk");
          if (msg.includes("severity")) return Promise.resolve("high");
          return Promise.resolve("back");
        }),
        confirm: mock((msg: string) => {
          if (msg.includes("workspace")) return Promise.resolve(false);
          if (msg.includes("security vulnerability"))
            return Promise.resolve(true);
          if (msg.includes("API token")) return Promise.resolve(true);
          if (msg.includes("interactive")) return Promise.resolve(false);
          if (msg.includes("auto-fix")) return Promise.resolve(true);
          return Promise.resolve(false);
        }),
        input: mock((msg: string) => {
          if (msg.includes("API token"))
            return Promise.resolve("snyk-token-123");
          return Promise.resolve("");
        }),
      };
      return callback(mockPrompt);
    },
  );

  await initCommand({ path: testPath, isTesting: true });
  expect(createPromptSpy).toHaveBeenCalled();

  loggerSpy?.mockRestore();
  if (existsSync(testPath)) {
    unlinkSync(testPath);
  }
  validateRootPackageJsonIntegrity();
});

test("initCommand - should configure Socket with token", async () => {
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
  const loggerSpy = spyOn(scripts, "logger").mockReturnValue(mockLog);

  const createPromptSpy = spyOn(prompt, "createPrompt").mockImplementation(
    async (callback) => {
      const mockPrompt = {
        list: mock((msg: string) => {
          if (msg.includes("config location"))
            return Promise.resolve("package.json");
          if (msg.includes("security provider"))
            return Promise.resolve("socket");
          if (msg.includes("severity")) return Promise.resolve("critical");
          return Promise.resolve("back");
        }),
        confirm: mock((msg: string) => {
          if (msg.includes("workspace")) return Promise.resolve(false);
          if (msg.includes("security vulnerability"))
            return Promise.resolve(true);
          if (msg.includes("API token")) return Promise.resolve(true);
          if (msg.includes("interactive")) return Promise.resolve(true);
          return Promise.resolve(false);
        }),
        input: mock((msg: string) => {
          if (msg.includes("API token"))
            return Promise.resolve("socket-token-123");
          return Promise.resolve("");
        }),
      };
      return callback(mockPrompt);
    },
  );

  await initCommand({ path: testPath, isTesting: true });
  expect(createPromptSpy).toHaveBeenCalled();

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
  const loggerSpy = spyOn(scripts, "logger").mockReturnValue(mockLog);

  const createPromptSpy = spyOn(prompt, "createPrompt").mockImplementation(
    async (callback) => {
      const mockPrompt = {
        list: mock((msg: string) => {
          if (msg.includes("config location"))
            return Promise.resolve("package.json");
          if (msg.includes("security provider")) return Promise.resolve("snyk");
          if (msg.includes("severity")) return Promise.resolve("medium");
          return Promise.resolve("back");
        }),
        confirm: mock((msg: string) => {
          if (msg.includes("workspace")) return Promise.resolve(false);
          if (msg.includes("security vulnerability"))
            return Promise.resolve(true);
          if (msg.includes("API token")) return Promise.resolve(false);
          if (msg.includes("interactive")) return Promise.resolve(true);
          return Promise.resolve(false);
        }),
        input: mock(() => Promise.resolve("")),
      };
      return callback(mockPrompt);
    },
  );

  await initCommand({ path: testPath, isTesting: true });
  expect(createPromptSpy).toHaveBeenCalled();

  loggerSpy?.mockRestore();
  if (existsSync(testPath)) {
    unlinkSync(testPath);
  }
  validateRootPackageJsonIntegrity();
});

test("initCommand - should handle empty token input", async () => {
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
  const loggerSpy = spyOn(scripts, "logger").mockReturnValue(mockLog);

  const createPromptSpy = spyOn(prompt, "createPrompt").mockImplementation(
    async (callback) => {
      const mockPrompt = {
        list: mock((msg: string) => {
          if (msg.includes("config location"))
            return Promise.resolve("package.json");
          if (msg.includes("security provider")) return Promise.resolve("snyk");
          if (msg.includes("severity")) return Promise.resolve("medium");
          return Promise.resolve("back");
        }),
        confirm: mock((msg: string) => {
          if (msg.includes("workspace")) return Promise.resolve(false);
          if (msg.includes("security vulnerability"))
            return Promise.resolve(true);
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
    },
  );

  await initCommand({ path: testPath, isTesting: true });
  expect(createPromptSpy).toHaveBeenCalled();

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
  const loggerSpy = spyOn(scripts, "logger").mockReturnValue(mockLog);

  const createPromptSpy = spyOn(prompt, "createPrompt").mockImplementation(
    async (callback) => {
      const mockPrompt = {
        list: mock((msg: string) => {
          if (msg.includes("config location"))
            return Promise.resolve("package.json");
          if (msg.includes("security provider")) return Promise.resolve("osv");
          if (msg.includes("severity")) return Promise.resolve("medium");
          return Promise.resolve("back");
        }),
        confirm: mock((msg: string) => {
          if (msg.includes("workspace dependencies"))
            return Promise.resolve(true);
          if (msg.includes("security vulnerability"))
            return Promise.resolve(true);
          if (msg.includes("interactive")) return Promise.resolve(true);
          if (msg.includes("Scan workspace")) return Promise.resolve(true);
          return Promise.resolve(false);
        }),
        input: mock(() => Promise.resolve("")),
      };
      return callback(mockPrompt);
    },
  );

  const mockResolveJSON = spyOn(scripts, "resolveJSON").mockReturnValue({
    name: "test",
    workspaces: ["packages/*"],
  });

  await initCommand({ path: testPath, isTesting: true });
  expect(createPromptSpy).toHaveBeenCalled();

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
  const loggerSpy = spyOn(scripts, "logger").mockReturnValue(mockLog);

  const createPromptSpy = spyOn(prompt, "createPrompt").mockImplementation(
    async (callback) => {
      const mockPrompt = {
        list: mock((msg: string) => {
          if (msg.includes("config location"))
            return Promise.resolve("package.json");
          if (msg.includes("security provider")) return Promise.resolve("osv");
          if (msg.includes("severity")) return Promise.resolve("low");
          return Promise.resolve("back");
        }),
        confirm: mock((msg: string) => {
          if (msg.includes("workspace")) return Promise.resolve(false);
          if (msg.includes("security vulnerability"))
            return Promise.resolve(true);
          if (msg.includes("interactive")) return Promise.resolve(false);
          if (msg.includes("auto-fix")) return Promise.resolve(true);
          return Promise.resolve(false);
        }),
        input: mock(() => Promise.resolve("")),
      };
      return callback(mockPrompt);
    },
  );

  await initCommand({ path: testPath, isTesting: true });
  expect(createPromptSpy).toHaveBeenCalled();

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
  const loggerSpy = spyOn(scripts, "logger").mockReturnValue(mockLog);

  const createPromptSpy = spyOn(prompt, "createPrompt").mockImplementation(
    async (callback) => {
      const mockPrompt = {
        list: mock(() => Promise.resolve("package.json")),
        confirm: mock((msg: string) => {
          if (msg.includes("Existing")) return Promise.resolve(true);
          return Promise.resolve(false);
        }),
        input: mock(() => Promise.resolve("")),
      };
      return callback(mockPrompt);
    },
  );

  const mockResolveJSON = spyOn(scripts, "resolveJSON").mockReturnValue({
    name: "test",
    pastoralist: { depPaths: "workspace" },
  });

  await initCommand({ path: testPath, isTesting: true });
  expect(createPromptSpy).toHaveBeenCalled();

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
  const loggerSpy = spyOn(scripts, "logger").mockReturnValue(mockLog);

  const createPromptSpy = spyOn(prompt, "createPrompt").mockImplementation(
    async (callback) => {
      const mockPrompt = {
        list: mock(() => Promise.resolve("package.json")),
        confirm: mock((msg: string) => {
          if (msg.includes("Existing")) return Promise.resolve(false);
          return Promise.resolve(false);
        }),
        input: mock(() => Promise.resolve("")),
      };
      return callback(mockPrompt);
    },
  );

  const mockResolveJSON = spyOn(scripts, "resolveJSON").mockReturnValue({
    name: "test",
    pastoralist: { depPaths: "workspace" },
  });

  await initCommand({ path: testPath, isTesting: true });
  expect(createPromptSpy).toHaveBeenCalled();

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
  const loggerSpy = spyOn(scripts, "logger").mockReturnValue(mockLog);

  const loadExternalConfigSpy = spyOn(
    configLoader,
    "loadExternalConfig",
  ).mockResolvedValue({
    depPaths: "workspace",
  });

  const createPromptSpy = spyOn(prompt, "createPrompt").mockImplementation(
    async (callback) => {
      const mockPrompt = {
        list: mock(() => Promise.resolve("package.json")),
        confirm: mock((msg: string) => {
          if (msg.includes("Existing")) return Promise.resolve(true);
          return Promise.resolve(false);
        }),
        input: mock(() => Promise.resolve("")),
      };
      return callback(mockPrompt);
    },
  );

  await initCommand({ path: testPath, isTesting: true });
  expect(createPromptSpy).toHaveBeenCalled();

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
  const loggerSpy = spyOn(scripts, "logger").mockReturnValue(mockLog);

  const createPromptSpy = spyOn(prompt, "createPrompt").mockImplementation(
    async (callback) => {
      const mockPrompt = {
        list: mock((msg: string) => {
          if (msg.includes("config location"))
            return Promise.resolve("package.json");
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
    },
  );

  await initCommand({
    path: testPath,
    securityProvider: "github",
    isTesting: true,
  });
  expect(createPromptSpy).toHaveBeenCalled();

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
  const loggerSpy = spyOn(scripts, "logger").mockReturnValue(mockLog);

  const createPromptSpy = spyOn(prompt, "createPrompt").mockImplementation(
    async (callback) => {
      const mockPrompt = {
        list: mock((msg: string) => {
          if (msg.includes("config location"))
            return Promise.resolve("package.json");
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
    },
  );

  const mockResolveJSON = spyOn(scripts, "resolveJSON").mockReturnValue({
    name: "test",
    workspaces: ["packages/*"],
  });

  await initCommand({
    path: testPath,
    checkSecurity: true,
    hasWorkspaceSecurityChecks: true,
    isTesting: true,
  });
  expect(createPromptSpy).toHaveBeenCalled();

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
  const loggerSpy = spyOn(scripts, "logger").mockReturnValue(mockLog);

  const createPromptSpy = spyOn(prompt, "createPrompt").mockImplementation(
    async (callback) => {
      const mockPrompt = {
        list: mock((msg: string) => {
          if (msg.includes("config location"))
            return Promise.resolve("package.json");
          if (msg.includes("workspace")) return Promise.resolve("workspace");
          if (msg.includes("security provider"))
            return Promise.resolve("github");
          if (msg.includes("severity")) return Promise.resolve("critical");
          return Promise.resolve("back");
        }),
        confirm: mock((msg: string) => {
          if (msg.includes("workspace dependencies"))
            return Promise.resolve(true);
          if (msg.includes("security vulnerability"))
            return Promise.resolve(true);
          if (msg.includes("interactive")) return Promise.resolve(true);
          if (msg.includes("Scan workspace")) return Promise.resolve(true);
          return Promise.resolve(false);
        }),
        input: mock(() => Promise.resolve("")),
      };
      return callback(mockPrompt);
    },
  );

  const mockResolveJSON = spyOn(scripts, "resolveJSON").mockReturnValue({
    name: "test",
    workspaces: ["packages/*", "apps/*"],
  });

  await initCommand({ path: testPath, isTesting: true });
  expect(createPromptSpy).toHaveBeenCalled();

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
  const loggerSpy = spyOn(scripts, "logger").mockReturnValue(mockLog);

  const createPromptSpy = spyOn(prompt, "createPrompt").mockImplementation(
    async (callback) => {
      const mockPrompt = {
        list: mock(() => Promise.resolve("package.json")),
        confirm: mock(() => Promise.resolve(false)),
        input: mock(() => Promise.resolve("")),
      };
      return callback(mockPrompt);
    },
  );

  await initCommand({ path: testPath, isTesting: true });
  expect(createPromptSpy).toHaveBeenCalled();

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
  const loggerSpy = spyOn(scripts, "logger").mockReturnValue(mockLog);

  const createPromptSpy = spyOn(prompt, "createPrompt").mockImplementation(
    async (callback) => {
      const mockPrompt = {
        list: mock(() => Promise.resolve("package.json")),
        confirm: mock(() => Promise.resolve(false)),
        input: mock(() => Promise.resolve("")),
      };
      return callback(mockPrompt);
    },
  );

  const mockResolveJSON = spyOn(scripts, "resolveJSON").mockReturnValue(null);

  await initCommand({ path: testPath, isTesting: true });
  expect(createPromptSpy).toHaveBeenCalled();

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
  const loggerSpy = spyOn(scripts, "logger").mockReturnValue(mockLog);

  const createPromptSpy = spyOn(prompt, "createPrompt").mockImplementation(
    async (callback) => {
      const mockPrompt = {
        list: mock((msg: string) => {
          if (msg.includes("config location"))
            return Promise.resolve("package.json");
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
    },
  );

  await initCommand({ path: testPath, checkSecurity: true, isTesting: true });
  expect(createPromptSpy).toHaveBeenCalled();

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
  const loggerSpy = spyOn(scripts, "logger").mockReturnValue(mockLog);

  const createPromptSpy = spyOn(prompt, "createPrompt").mockImplementation(
    async (callback) => {
      const mockPrompt = {
        list: mock((msg: string) => {
          if (msg.includes("config location"))
            return Promise.resolve("package.json");
          if (msg.includes("security provider"))
            return Promise.resolve("socket");
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
    },
  );

  await initCommand({ path: testPath, checkSecurity: true, isTesting: true });
  expect(createPromptSpy).toHaveBeenCalled();

  loggerSpy?.mockRestore();
  if (existsSync(testPath)) {
    unlinkSync(testPath);
  }
  validateRootPackageJsonIntegrity();
});

test("initCommand - should handle token input when user confirms but provides empty token", async () => {
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
  const loggerSpy = spyOn(scripts, "logger").mockReturnValue(mockLog);

  const createPromptSpy = spyOn(prompt, "createPrompt").mockImplementation(
    async (callback) => {
      const mockPrompt = {
        list: mock((msg: string) => {
          if (msg.includes("config location"))
            return Promise.resolve("package.json");
          if (msg.includes("security provider"))
            return Promise.resolve("github");
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
    },
  );

  await initCommand({ path: testPath, checkSecurity: true, isTesting: true });
  expect(createPromptSpy).toHaveBeenCalled();

  loggerSpy?.mockRestore();
  if (existsSync(testPath)) {
    unlinkSync(testPath);
  }
  validateRootPackageJsonIntegrity();
});

test("initCommand - should handle token input when user provides valid token", async () => {
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
  const loggerSpy = spyOn(scripts, "logger").mockReturnValue(mockLog);

  const createPromptSpy = spyOn(prompt, "createPrompt").mockImplementation(
    async (callback) => {
      const mockPrompt = {
        list: mock((msg: string) => {
          if (msg.includes("config location"))
            return Promise.resolve("package.json");
          if (msg.includes("security provider"))
            return Promise.resolve("github");
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
    },
  );

  await initCommand({ path: testPath, checkSecurity: true, isTesting: true });
  expect(createPromptSpy).toHaveBeenCalled();

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
  const loggerSpy = spyOn(scripts, "logger").mockReturnValue(mockLog);

  const formatCompletionSpy = spyOn(dxPrompts, "formatCompletion");
  const shimmerFrameSpy = spyOn(shimmer, "shimmerFrame").mockReturnValue(
    "shimmered text",
  );

  const createPromptSpy = spyOn(prompt, "createPrompt").mockImplementation(
    async (callback) => {
      const mockPrompt = {
        list: mock(() => Promise.resolve("package.json")),
        confirm: mock(() => Promise.resolve(false)),
        input: mock(() => Promise.resolve("")),
      };
      return callback(mockPrompt);
    },
  );

  await initCommand({ path: testPath, isTesting: true });

  expect(typeof dxPrompts.formatCompletion).toBe("function");
  expect(typeof shimmer.shimmerFrame).toBe("function");

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
  const loggerSpy = spyOn(scripts, "logger").mockReturnValue(mockLog);

  const createPromptSpy = spyOn(prompt, "createPrompt").mockImplementation(
    async (callback) => {
      const mockPrompt = {
        list: mock((msg: string) => {
          if (msg.includes("config location"))
            return Promise.resolve("package.json");
          if (msg.includes("security provider"))
            return Promise.resolve("github");
          return Promise.resolve("back");
        }),
        confirm: mock(() => Promise.resolve(true)),
        input: mock(() => Promise.resolve("")),
      };
      return callback(mockPrompt);
    },
  );

  await initCommand({ path: testPath, checkSecurity: true, isTesting: true });

  expect(createPromptSpy).toHaveBeenCalled();

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
  const loggerSpy = spyOn(scripts, "logger").mockReturnValue(mockLog);

  const createPromptSpy = spyOn(prompt, "createPrompt").mockImplementation(
    async (callback) => {
      const mockPrompt = {
        list: mock(() => Promise.resolve("package.json")),
        confirm: mock(() => Promise.resolve(false)),
        input: mock(() => Promise.resolve("")),
      };
      return callback(mockPrompt);
    },
  );

  await initCommand({ path: testPath, isTesting: true });

  expect(typeof dxPrompts.formatChoiceList).toBe("function");
  expect(typeof dxPrompts.formatConfirmPrompt).toBe("function");

  loggerSpy?.mockRestore();
  if (existsSync(testPath)) {
    unlinkSync(testPath);
  }
  validateRootPackageJsonIntegrity();
});
