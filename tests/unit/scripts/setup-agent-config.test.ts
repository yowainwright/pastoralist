import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  chmodSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";

const setupScriptPath = resolve("scripts/setup/setup.sh");
const hookScriptPath = resolve("scripts/setup/install-hooks.ts");
const jitiScriptPath = resolve("node_modules/jiti/lib/jiti-cli.mjs");
const baseEnv = { PATH: "/usr/bin:/bin" };

const withTempRepo = (callback: (root: string) => void) => {
  const root = mkdtempSync(join(tmpdir(), "pastoralist-agent-config-"));

  try {
    callback(root);
  } finally {
    rmSync(root, { force: true, recursive: true });
  }
};

const writeFixture = (root: string, path: string, content: string) => {
  const file = join(root, path);

  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, content);
};

const writeExecutable = (root: string, path: string, content: string) => {
  writeFixture(root, path, content);
  chmodSync(join(root, path), 0o755);
};

const readFixture = (root: string, path: string) => readFileSync(join(root, path), "utf8");

const runScript = (
  path: string,
  root: string,
  args: string[],
  env: Record<string, string> = {},
) => {
  const commandArgs = [path].concat(args);
  const commandEnv = Object.assign({}, baseEnv, env);

  return spawnSync("/bin/sh", commandArgs, {
    cwd: root,
    encoding: "utf8",
    env: commandEnv,
  });
};

const runSetup = (root: string, args: string[], env: Record<string, string> = {}) =>
  runScript(setupScriptPath, root, ["agent-config"].concat(args), env);

const runHookInstaller = (root: string) => {
  const env = Object.assign({}, process.env, { CI: "" });

  return spawnSync("node", [jitiScriptPath, hookScriptPath], {
    cwd: root,
    encoding: "utf8",
    env,
  });
};

const runGeneratedHook = (
  root: string,
  hookName: string,
  args: string[] = [],
  env: Record<string, string> = {},
) =>
  spawnSync(join(root, ".git/hooks", hookName), args, {
    cwd: root,
    encoding: "utf8",
    env: Object.assign({}, process.env, env),
  });

const installHookTestTools = (root: string) => {
  writeExecutable(
    root,
    "bin/pnpm",
    '#!/bin/sh\nprintf \'%s\\n\' "$*" >> "$HOOK_LOG"\nexit ${FAKE_STATUS:-0}\n',
  );
  writeExecutable(
    root,
    "bin/git",
    '#!/bin/sh\nif [ "$1" = "diff-tree" ]; then\n  printf \'%s\\n\' "$FAKE_CHANGED_FILES"\nfi\n',
  );
  writeExecutable(
    root,
    "node_modules/eslint-plugin-legibility/bin/lint-changed.js",
    "process.exit(Number(process.env.LINT_STATUS ?? '0'));\n",
  );
};

const createHookTools = (root: string) => {
  const logPath = join(root, "hook.log");
  const toolPath = join(root, "bin");
  installHookTestTools(root);
  return { env: { HOOK_LOG: logPath, PATH: `${toolPath}:${process.env.PATH ?? ""}` }, logPath };
};

describe("scripts/setup/install-hooks", () => {
  test("pre-commit does not lint changed files before the full lint", () => {
    withTempRepo((root) => {
      mkdirSync(join(root, ".git"), { recursive: true });

      const result = runHookInstaller(root);
      const hook = readFixture(root, ".git/hooks/pre-commit");

      assert.strictEqual(result.status, 0);
      assert.ok(hook.includes("# pastoralist-managed-hook"));
      assert.ok(hook.startsWith("#!/bin/sh"));
      assert.ok(!hook.includes("lint-changed.js"));
      assert.ok(hook.includes("pnpm run format"));
      assert.ok(hook.includes("pnpm run build"));
      assert.ok(hook.includes("pnpm --dir app install --frozen-lockfile"));
      assert.ok(hook.includes("pnpm --dir app run build"));
      assert.ok(hook.includes("pnpm run lint"));
      assert.ok(hook.includes("pnpm run test:coverage"));
      assert.ok(!hook.includes("bun"));
    });
  });

  test("pre-commit executes checks and stops on failure", () => {
    withTempRepo((root) => {
      mkdirSync(join(root, ".git"), { recursive: true });
      assert.strictEqual(runHookInstaller(root).status, 0);
      const { env, logPath } = createHookTools(root);
      const success = runGeneratedHook(root, "pre-commit", [], env);
      assert.strictEqual(success.status, 0);
      assert.strictEqual(readFixture(root, "hook.log").trim().split("\n").length, 6);
      const failure = runGeneratedHook(
        root,
        "pre-commit",
        [],
        Object.assign({}, env, { FAKE_STATUS: "1" }),
      );
      assert.notStrictEqual(failure.status, 0);
      assert.ok(existsSync(logPath));
    });
  });

  test("commit-msg rejects malformed scopes", () => {
    withTempRepo((root) => {
      mkdirSync(join(root, ".git"), { recursive: true });
      assert.strictEqual(runHookInstaller(root).status, 0);
      writeFixture(root, "valid-message", "fix(scope): message\n");
      assert.strictEqual(
        runGeneratedHook(root, "commit-msg", [join(root, "valid-message")]).status,
        0,
      );
      ["feat)api): message\n", "feat(): message\n"].forEach((message, index) => {
        const path = `invalid-message-${index}`;
        writeFixture(root, path, message);
        assert.notStrictEqual(runGeneratedHook(root, "commit-msg", [join(root, path)]).status, 0);
      });
    });
  });

  test("post-merge installs dependencies only when lockfiles change", () => {
    withTempRepo((root) => {
      mkdirSync(join(root, ".git"), { recursive: true });
      assert.strictEqual(runHookInstaller(root).status, 0);
      const { env, logPath } = createHookTools(root);
      const unchanged = runGeneratedHook(
        root,
        "post-merge",
        [],
        Object.assign({}, env, { FAKE_CHANGED_FILES: "src/index.ts" }),
      );
      assert.strictEqual(unchanged.status, 0);
      assert.strictEqual(existsSync(logPath), false);
      const changed = runGeneratedHook(
        root,
        "post-merge",
        [],
        Object.assign({}, env, { FAKE_CHANGED_FILES: "package.json" }),
      );
      assert.strictEqual(changed.status, 0);
      assert.strictEqual(readFixture(root, "hook.log").trim().split("\n").length, 2);
    });
  });
});

describe("scripts/setup setup agent-config", () => {
  test("dry run prints Codex writes without touching disk", () => {
    withTempRepo((root) => {
      const result = runSetup(root, ["--dry-run", "--target", "codex"]);

      assert.strictEqual(result.status, 0);
      assert.ok(result.stdout.includes("Would write AGENTS.md"));
      assert.ok(result.stdout.includes("Would write .codex/config.toml"));
      assert.ok(
        result.stdout.includes("Would install .agents/skills/eslint-plugin-legibility/SKILL.md"),
      );
      assert.strictEqual(existsSync(join(root, "AGENTS.md")), false);
      assert.strictEqual(existsSync(join(root, ".codex/config.toml")), false);
    });
  });

  test("codex target writes local config and packaged legibility skill", () => {
    withTempRepo((root) => {
      const result = runSetup(root, ["--target", "codex"]);

      assert.strictEqual(result.status, 0);
      assert.strictEqual(result.stderr, "");
      assert.ok(readFixture(root, "AGENTS.md").includes("Never run git add"));
      assert.ok(readFixture(root, ".codex/config.toml").includes("model_reasoning_effort"));
      assert.ok(
        readFixture(root, ".agents/skills/eslint-plugin-legibility/SKILL.md").includes(
          "ESLint Plugin Legibility",
        ),
      );
      assert.ok(
        readFixture(
          root,
          ".agents/skills/eslint-plugin-legibility/.pastoralist-agent-config",
        ).includes("pastoralist-agent-config"),
      );
    });
  });

  test("codex target preserves unmanaged local files", () => {
    withTempRepo((root) => {
      writeFixture(root, "AGENTS.md", "custom agents\n");
      writeFixture(root, ".codex/config.toml", "custom config\n");
      writeFixture(root, ".agents/skills/eslint-plugin-legibility/SKILL.md", "custom skill\n");

      const result = runSetup(root, ["--target", "codex"]);

      assert.strictEqual(result.status, 0);
      assert.ok(result.stdout.includes("Skipping AGENTS.md; existing file is unmanaged"));
      assert.strictEqual(readFixture(root, "AGENTS.md"), "custom agents\n");
      assert.strictEqual(readFixture(root, ".codex/config.toml"), "custom config\n");
      assert.strictEqual(
        readFixture(root, ".agents/skills/eslint-plugin-legibility/SKILL.md"),
        "custom skill\n",
      );
    });
  });

  test("force refreshes unmanaged Codex files", () => {
    withTempRepo((root) => {
      writeFixture(root, "AGENTS.md", "custom agents\n");
      writeFixture(root, ".codex/config.toml", "custom config\n");
      writeFixture(root, ".agents/skills/eslint-plugin-legibility/SKILL.md", "custom skill\n");

      const result = runSetup(root, ["--force", "--target", "codex"]);

      assert.strictEqual(result.status, 0);
      assert.ok(readFixture(root, "AGENTS.md").includes("pastoralist-agent-config"));
      assert.ok(readFixture(root, ".codex/config.toml").includes("model_reasoning_effort"));
      assert.ok(
        readFixture(root, ".agents/skills/eslint-plugin-legibility/SKILL.md").includes(
          "ESLint Plugin Legibility",
        ),
      );
    });
  });

  test("auto defaults to Codex when no agent is detected", () => {
    withTempRepo((root) => {
      const result = runSetup(root, ["--dry-run", "--target", "auto"]);

      assert.strictEqual(result.status, 0);
      assert.ok(result.stdout.includes("Would write AGENTS.md"));
      assert.ok(result.stdout.includes("Would write .codex/config.toml"));
      assert.ok(!result.stdout.includes("CLAUDE.md"));
    });
  });

  test("CI skips setup", () => {
    withTempRepo((root) => {
      const result = runSetup(root, ["--target", "codex"], { CI: "true" });

      assert.strictEqual(result.status, 0);
      assert.ok(result.stdout.includes("CI environment detected, skipping local dev setup"));
      assert.strictEqual(existsSync(join(root, "AGENTS.md")), false);
    });
  });
});

describe("scripts/setup setup skill", () => {
  test("dry run prints Pastoralist skill install without touching disk", () => {
    withTempRepo((root) => {
      const result = runScript(setupScriptPath, root, ["skill", "--dry-run"]);

      assert.strictEqual(result.status, 0);
      assert.ok(result.stdout.includes("Would install .agents/skills/pastoralist/SKILL.md"));
      assert.strictEqual(existsSync(join(root, ".agents/skills/pastoralist/SKILL.md")), false);
    });
  });

  test("installs the bundled Pastoralist skill", () => {
    withTempRepo((root) => {
      const result = runScript(setupScriptPath, root, ["skill"]);

      assert.strictEqual(result.status, 0);
      assert.ok(
        readFixture(root, ".agents/skills/pastoralist/SKILL.md").includes("npx pastoralist doctor"),
      );
      assert.ok(
        readFixture(root, ".agents/skills/pastoralist/SKILL.md").includes(
          "npx pastoralist --init agent-skill",
        ),
      );
      assert.ok(
        readFixture(root, ".agents/skills/pastoralist/.pastoralist-agent-config").includes(
          "pastoralist-agent-config",
        ),
      );
      assert.strictEqual(existsSync(join(root, "AGENTS.md")), false);
    });
  });

  test("preserves unmanaged Pastoralist skills", () => {
    withTempRepo((root) => {
      writeFixture(root, ".agents/skills/pastoralist/SKILL.md", "custom skill\n");

      const result = runScript(setupScriptPath, root, ["skill"]);

      assert.strictEqual(result.status, 0);
      assert.ok(
        result.stdout.includes(
          "Skipping .agents/skills/pastoralist/SKILL.md; existing file is unmanaged",
        ),
      );
      assert.strictEqual(
        readFixture(root, ".agents/skills/pastoralist/SKILL.md"),
        "custom skill\n",
      );
    });
  });
});

describe("scripts/setup setup local-dev", () => {
  test("dry run can select agent, skills, and hooks", () => {
    withTempRepo((root) => {
      const result = runScript(setupScriptPath, root, [
        "local-dev",
        "--dry-run",
        "--agent",
        "codex",
        "--skills",
        "all",
        "--hooks",
        "git,postinstall",
      ]);

      assert.strictEqual(result.status, 0);
      assert.ok(result.stdout.includes("Would write AGENTS.md"));
      assert.ok(result.stdout.includes("Would install .agents/skills/pastoralist/SKILL.md"));
      assert.ok(
        result.stdout.includes("Would install .agents/skills/eslint-plugin-legibility/SKILL.md"),
      );
      assert.ok(result.stdout.includes("Would install git hooks"));
      assert.ok(result.stdout.includes("Would add Pastoralist postinstall hook"));
    });
  });

  test("can skip agent config and hooks while installing selected skills", () => {
    withTempRepo((root) => {
      const result = runScript(setupScriptPath, root, [
        "local-dev",
        "--agent",
        "skip",
        "--skills",
        "pastoralist",
        "--hooks",
        "none",
      ]);

      assert.strictEqual(result.status, 0);
      assert.ok(readFixture(root, ".agents/skills/pastoralist/SKILL.md").includes("Pastoralist"));
      assert.strictEqual(existsSync(join(root, "AGENTS.md")), false);
      assert.strictEqual(
        existsSync(join(root, ".agents/skills/eslint-plugin-legibility/SKILL.md")),
        false,
      );
    });
  });
});
