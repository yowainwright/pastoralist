import { assertContainsText, assertExcludesText } from "./utils";
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
const skillSourcePath = resolve("skills/pastoralist/SKILL.md");
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

  const result = spawnSync("/bin/sh", commandArgs, {
    cwd: root,
    encoding: "utf8",
    env: commandEnv,
  });
  return result;
};

const runSetup = (root: string, args: string[], env: Record<string, string> = {}) =>
  runScript(setupScriptPath, root, ["agent-config"].concat(args), env);

const runHookInstaller = (root: string) => {
  const env = Object.assign({}, process.env, { CI: "" });

  const result = spawnSync("node", [jitiScriptPath, hookScriptPath], {
    cwd: root,
    encoding: "utf8",
    env,
  });
  return result;
};

const runGeneratedHook = (
  root: string,
  hookName: string,
  args: string[] = [],
  env: Record<string, string> = {},
) => {
  const commandEnv = Object.assign({}, process.env, env);
  const result = spawnSync(join(root, ".git/hooks", hookName), args, {
    cwd: root,
    encoding: "utf8",
    env: commandEnv,
  });
  return result;
};

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
    "node_modules/oxlint-plugin-legibility/bin/lint-changed.js",
    "process.exit(Number(process.env.LINT_STATUS ?? '0'));\n",
  );
};

const createHookTools = (root: string) => {
  const logPath = join(root, "hook.log");
  const toolPath = join(root, "bin");
  installHookTestTools(root);
  const path = `${toolPath}:${process.env.PATH ?? ""}`;
  const env = { HOOK_LOG: logPath, PATH: path };
  const hookTools = {
    env,
    logPath,
  };
  return hookTools;
};

const installHooksCases = [
  {
    name: "pre-commit does not lint changed files before the full lint",
    run: () => {
      withTempRepo((root) => {
        mkdirSync(join(root, ".git"), { recursive: true });

        const result = runHookInstaller(root);
        const hook = readFixture(root, ".git/hooks/pre-commit");

        assert.strictEqual(result.status, 0);
        assertContainsText(hook, "# pastoralist-managed-hook");
        assert.ok(hook.startsWith("#!/bin/sh"));
        assertExcludesText(hook, "lint-changed.js");
        assertContainsText(hook, "pnpm run format");
        assertContainsText(hook, "pnpm run build");
        assertContainsText(hook, "pnpm --dir app install --frozen-lockfile");
        assertContainsText(hook, "pnpm --dir app run build");
        assertContainsText(hook, "pnpm run lint");
        assertContainsText(hook, "pnpm run test:coverage");
        assertExcludesText(hook, "bun");
      });
    },
  },
  {
    name: "pre-commit executes checks and stops on failure",
    run: () => {
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
    },
  },
  {
    name: "commit-msg rejects malformed scopes",
    run: () => {
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
    },
  },
  {
    name: "post-merge installs dependencies only when lockfiles change",
    run: () => {
      withTempRepo((root) => {
        mkdirSync(join(root, ".git"), { recursive: true });
        assert.strictEqual(runHookInstaller(root).status, 0);
        const { env, logPath } = createHookTools(root);
        const unchangedEnv = Object.assign({}, env, { FAKE_CHANGED_FILES: "src/index.ts" });
        const unchanged = runGeneratedHook(root, "post-merge", [], unchangedEnv);
        assert.strictEqual(unchanged.status, 0);
        assert.strictEqual(existsSync(logPath), false);
        const changedEnv = Object.assign({}, env, { FAKE_CHANGED_FILES: "package.json" });
        const changed = runGeneratedHook(root, "post-merge", [], changedEnv);
        assert.strictEqual(changed.status, 0);
        assert.strictEqual(readFixture(root, "hook.log").trim().split("\n").length, 2);
      });
    },
  },
];

describe("scripts/setup/install-hooks", () => {
  installHooksCases.forEach(({ name, run }) => test(name, run));
});

const agentConfigCases = [
  {
    name: "dry run prints Codex writes without touching disk",
    run: () => {
      withTempRepo((root) => {
        const result = runSetup(root, ["--dry-run", "--target", "codex"]);

        assert.strictEqual(result.status, 0);
        assertContainsText(result.stdout, "Would write AGENTS.md");
        assertContainsText(result.stdout, "Would write .codex/config.toml");
        assertContainsText(
          result.stdout,
          "Would install .agents/skills/oxlint-plugin-legibility/SKILL.md",
        );
        assert.strictEqual(existsSync(join(root, "AGENTS.md")), false);
        assert.strictEqual(existsSync(join(root, ".codex/config.toml")), false);
      });
    },
  },
  {
    name: "codex target writes local config and packaged legibility skill",
    run: () => {
      withTempRepo((root) => {
        const result = runSetup(root, ["--target", "codex"]);

        assert.strictEqual(result.status, 0);
        assert.strictEqual(result.stderr, "");
        assertContainsText(readFixture(root, "AGENTS.md"), "Never run git add");
        assertContainsText(readFixture(root, ".codex/config.toml"), "model_reasoning_effort");
        assertContainsText(
          readFixture(root, ".agents/skills/oxlint-plugin-legibility/SKILL.md"),
          "Oxlint Plugin Legibility",
        );
        assertContainsText(
          readFixture(root, ".agents/skills/oxlint-plugin-legibility/.pastoralist-agent-config"),
          "pastoralist-agent-config",
        );
      });
    },
  },
  {
    name: "codex target preserves unmanaged local files",
    run: () => {
      withTempRepo((root) => {
        writeFixture(root, "AGENTS.md", "custom agents\n");
        writeFixture(root, ".codex/config.toml", "custom config\n");
        writeFixture(root, ".agents/skills/oxlint-plugin-legibility/SKILL.md", "custom skill\n");

        const result = runSetup(root, ["--target", "codex"]);

        assert.strictEqual(result.status, 0);
        assertContainsText(result.stdout, "Skipping AGENTS.md; existing file is unmanaged");
        assert.strictEqual(readFixture(root, "AGENTS.md"), "custom agents\n");
        assert.strictEqual(readFixture(root, ".codex/config.toml"), "custom config\n");
        assert.strictEqual(
          readFixture(root, ".agents/skills/oxlint-plugin-legibility/SKILL.md"),
          "custom skill\n",
        );
      });
    },
  },
  {
    name: "force refreshes unmanaged Codex files",
    run: () => {
      withTempRepo((root) => {
        writeFixture(root, "AGENTS.md", "custom agents\n");
        writeFixture(root, ".codex/config.toml", "custom config\n");
        writeFixture(root, ".agents/skills/oxlint-plugin-legibility/SKILL.md", "custom skill\n");

        const result = runSetup(root, ["--force", "--target", "codex"]);

        assert.strictEqual(result.status, 0);
        assertContainsText(readFixture(root, "AGENTS.md"), "pastoralist-agent-config");
        assertContainsText(readFixture(root, ".codex/config.toml"), "model_reasoning_effort");
        assertContainsText(
          readFixture(root, ".agents/skills/oxlint-plugin-legibility/SKILL.md"),
          "Oxlint Plugin Legibility",
        );
      });
    },
  },
  {
    name: "auto defaults to Codex when no agent is detected",
    run: () => {
      withTempRepo((root) => {
        const result = runSetup(root, ["--dry-run", "--target", "auto"]);

        assert.strictEqual(result.status, 0);
        assertContainsText(result.stdout, "Would write AGENTS.md");
        assertContainsText(result.stdout, "Would write .codex/config.toml");
        assertExcludesText(result.stdout, "CLAUDE.md");
      });
    },
  },
  {
    name: "CI skips setup",
    run: () => {
      withTempRepo((root) => {
        const result = runSetup(root, ["--target", "codex"], { CI: "true" });

        assert.strictEqual(result.status, 0);
        assertContainsText(result.stdout, "CI environment detected, skipping local dev setup");
        assert.strictEqual(existsSync(join(root, "AGENTS.md")), false);
      });
    },
  },
];

describe("scripts/setup setup agent-config", () => {
  agentConfigCases.forEach(({ name, run }) => test(name, run));
});

const setupSkillCases = [
  {
    name: "dry run prints Pastoralist skill install without touching disk",
    run: () => {
      withTempRepo((root) => {
        const result = runScript(setupScriptPath, root, ["skill", "--dry-run"]);

        assert.strictEqual(result.status, 0);
        assertContainsText(result.stdout, "Would install .agents/skills/pastoralist/SKILL.md");
        assert.strictEqual(existsSync(join(root, ".agents/skills/pastoralist/SKILL.md")), false);
      });
    },
  },
  {
    name: "installs the bundled Pastoralist skill",
    run: () => {
      withTempRepo((root) => {
        const result = runScript(setupScriptPath, root, ["skill"]);

        assert.strictEqual(result.status, 0);
        assert.strictEqual(
          readFixture(root, ".agents/skills/pastoralist/SKILL.md"),
          readFileSync(skillSourcePath, "utf8"),
        );
        assertContainsText(
          readFixture(root, ".agents/skills/pastoralist/.pastoralist-agent-config"),
          "pastoralist-agent-config",
        );
        assert.strictEqual(existsSync(join(root, "AGENTS.md")), false);
      });
    },
  },
  {
    name: "preserves unmanaged Pastoralist skills",
    run: () => {
      withTempRepo((root) => {
        writeFixture(root, ".agents/skills/pastoralist/SKILL.md", "custom skill\n");

        const result = runScript(setupScriptPath, root, ["skill"]);

        assert.strictEqual(result.status, 0);
        assertContainsText(
          result.stdout,
          "Skipping .agents/skills/pastoralist/SKILL.md; existing file is unmanaged",
        );
        assert.strictEqual(
          readFixture(root, ".agents/skills/pastoralist/SKILL.md"),
          "custom skill\n",
        );
      });
    },
  },
];

describe("scripts/setup setup skill", () => {
  setupSkillCases.forEach(({ name, run }) => test(name, run));
});

const localDevDryRunArgs = [
  "local-dev",
  "--dry-run",
  "--agent",
  "codex",
  "--skills",
  "all",
  "--hooks",
  "git,postinstall",
];

const localDevCases = [
  {
    name: "dry run can select agent, skills, and hooks",
    run: () => {
      withTempRepo((root) => {
        const result = runScript(setupScriptPath, root, localDevDryRunArgs);

        assert.strictEqual(result.status, 0);
        assertContainsText(result.stdout, "Would write AGENTS.md");
        assertContainsText(result.stdout, "Would install .agents/skills/pastoralist/SKILL.md");
        assertContainsText(
          result.stdout,
          "Would install .agents/skills/oxlint-plugin-legibility/SKILL.md",
        );
        assertContainsText(result.stdout, "Would install git hooks");
        assertContainsText(result.stdout, "Would add Pastoralist postinstall hook");
      });
    },
  },
  {
    name: "can skip agent config and hooks while installing selected skills",
    run: () => {
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
        assertContainsText(readFixture(root, ".agents/skills/pastoralist/SKILL.md"), "Pastoralist");
        assert.strictEqual(existsSync(join(root, "AGENTS.md")), false);
        assert.strictEqual(
          existsSync(join(root, ".agents/skills/oxlint-plugin-legibility/SKILL.md")),
          false,
        );
      });
    },
  },
];

describe("scripts/setup setup local-dev", () => {
  localDevCases.forEach(({ name, run }) => test(name, run));
});
