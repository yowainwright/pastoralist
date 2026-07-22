import { describe, expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";

const scriptPath = resolve("scripts/setup-agent-config.sh");
const localDevScriptPath = resolve("scripts/setup-local-dev.sh");
const skillScriptPath = resolve("scripts/setup-pastoralist-skill.sh");
const hookScriptPath = resolve("scripts/install-hooks.ts");
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

const readFixture = (root: string, path: string) => readFileSync(join(root, path), "utf8");

const runScript = (path: string, root: string, args: string[], env: Record<string, string> = {}) =>
  spawnSync("/bin/sh", [path, ...args], {
    cwd: root,
    encoding: "utf8",
    env: { ...baseEnv, ...env },
  });

const runSetup = (root: string, args: string[], env: Record<string, string> = {}) =>
  runScript(scriptPath, root, args, env);

const runHookInstaller = (root: string) =>
  spawnSync(process.execPath, [hookScriptPath], {
    cwd: root,
    encoding: "utf8",
    env: { ...process.env, CI: "" },
  });

describe("scripts/install-hooks", () => {
  test("pre-commit runs legibility and the complete validation sequence", () => {
    withTempRepo((root) => {
      mkdirSync(join(root, ".git"), { recursive: true });

      const result = runHookInstaller(root);
      const hook = readFixture(root, ".git/hooks/pre-commit");

      expect(result.status).toBe(0);
      expect(hook).toContain("pastoralist-managed-hook");
      expect(hook).toContain(
        "await $`node node_modules/eslint-plugin-legibility/bin/lint-changed.js`;",
      );
      expect(hook).toContain("await $`bun run format`;");
      expect(hook).toContain("await $`bun run build`;");
      expect(hook).toContain("await $`cd app && bun run build`;");
      expect(hook).toContain("await $`bun run lint`;");
      expect(hook).toContain("await $`bun test tests/unit/ --coverage --coverage-reporter=lcov`;");
    });
  });
});

describe("scripts/setup-agent-config", () => {
  test("dry run prints Codex writes without touching disk", () => {
    withTempRepo((root) => {
      const result = runSetup(root, ["--dry-run", "--target", "codex"]);

      expect(result.status).toBe(0);
      expect(result.stdout).toContain("Would write AGENTS.md");
      expect(result.stdout).toContain("Would write .codex/config.toml");
      expect(result.stdout).toContain(
        "Would install .agents/skills/eslint-plugin-legibility/SKILL.md",
      );
      expect(existsSync(join(root, "AGENTS.md"))).toBe(false);
      expect(existsSync(join(root, ".codex/config.toml"))).toBe(false);
    });
  });

  test("codex target writes local config and packaged legibility skill", () => {
    withTempRepo((root) => {
      const result = runSetup(root, ["--target", "codex"]);

      expect(result.status).toBe(0);
      expect(result.stderr).toBe("");
      expect(readFixture(root, "AGENTS.md")).toContain("Never run git add");
      expect(readFixture(root, ".codex/config.toml")).toContain("model_reasoning_effort");
      expect(readFixture(root, ".agents/skills/eslint-plugin-legibility/SKILL.md")).toContain(
        "ESLint Plugin Legibility",
      );
      expect(
        readFixture(root, ".agents/skills/eslint-plugin-legibility/.pastoralist-agent-config"),
      ).toContain("pastoralist-agent-config");
    });
  });

  test("codex target preserves unmanaged local files", () => {
    withTempRepo((root) => {
      writeFixture(root, "AGENTS.md", "custom agents\n");
      writeFixture(root, ".codex/config.toml", "custom config\n");
      writeFixture(root, ".agents/skills/eslint-plugin-legibility/SKILL.md", "custom skill\n");

      const result = runSetup(root, ["--target", "codex"]);

      expect(result.status).toBe(0);
      expect(result.stdout).toContain("Skipping AGENTS.md; existing file is unmanaged");
      expect(readFixture(root, "AGENTS.md")).toBe("custom agents\n");
      expect(readFixture(root, ".codex/config.toml")).toBe("custom config\n");
      expect(readFixture(root, ".agents/skills/eslint-plugin-legibility/SKILL.md")).toBe(
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

      expect(result.status).toBe(0);
      expect(readFixture(root, "AGENTS.md")).toContain("pastoralist-agent-config");
      expect(readFixture(root, ".codex/config.toml")).toContain("model_reasoning_effort");
      expect(readFixture(root, ".agents/skills/eslint-plugin-legibility/SKILL.md")).toContain(
        "ESLint Plugin Legibility",
      );
    });
  });

  test("auto defaults to Codex when no agent is detected", () => {
    withTempRepo((root) => {
      const result = runSetup(root, ["--dry-run", "--target", "auto"]);

      expect(result.status).toBe(0);
      expect(result.stdout).toContain("Would write AGENTS.md");
      expect(result.stdout).toContain("Would write .codex/config.toml");
      expect(result.stdout).not.toContain("CLAUDE.md");
    });
  });

  test("CI skips setup", () => {
    withTempRepo((root) => {
      const result = runSetup(root, ["--target", "codex"], { CI: "true" });

      expect(result.status).toBe(0);
      expect(result.stdout).toContain("CI environment detected, skipping local dev setup");
      expect(existsSync(join(root, "AGENTS.md"))).toBe(false);
    });
  });
});

describe("scripts/setup-pastoralist-skill", () => {
  test("dry run prints Pastoralist skill install without touching disk", () => {
    withTempRepo((root) => {
      const result = runScript(skillScriptPath, root, ["--dry-run"]);

      expect(result.status).toBe(0);
      expect(result.stdout).toContain("Would install .agents/skills/pastoralist/SKILL.md");
      expect(existsSync(join(root, ".agents/skills/pastoralist/SKILL.md"))).toBe(false);
    });
  });

  test("installs the bundled Pastoralist skill", () => {
    withTempRepo((root) => {
      const result = runScript(skillScriptPath, root, []);

      expect(result.status).toBe(0);
      expect(readFixture(root, ".agents/skills/pastoralist/SKILL.md")).toContain(
        "npx pastoralist doctor",
      );
      expect(readFixture(root, ".agents/skills/pastoralist/SKILL.md")).toContain(
        "npx pastoralist --init agent-skill",
      );
      expect(readFixture(root, ".agents/skills/pastoralist/.pastoralist-agent-config")).toContain(
        "pastoralist-agent-config",
      );
      expect(existsSync(join(root, "AGENTS.md"))).toBe(false);
    });
  });

  test("preserves unmanaged Pastoralist skills", () => {
    withTempRepo((root) => {
      writeFixture(root, ".agents/skills/pastoralist/SKILL.md", "custom skill\n");

      const result = runScript(skillScriptPath, root, []);

      expect(result.status).toBe(0);
      expect(result.stdout).toContain(
        "Skipping .agents/skills/pastoralist/SKILL.md; existing file is unmanaged",
      );
      expect(readFixture(root, ".agents/skills/pastoralist/SKILL.md")).toBe("custom skill\n");
    });
  });
});

describe("scripts/setup-local-dev", () => {
  test("dry run can select agent, skills, and hooks", () => {
    withTempRepo((root) => {
      const result = runScript(localDevScriptPath, root, [
        "--dry-run",
        "--agent",
        "codex",
        "--skills",
        "all",
        "--hooks",
        "git,postinstall",
      ]);

      expect(result.status).toBe(0);
      expect(result.stdout).toContain("Would write AGENTS.md");
      expect(result.stdout).toContain("Would install .agents/skills/pastoralist/SKILL.md");
      expect(result.stdout).toContain(
        "Would install .agents/skills/eslint-plugin-legibility/SKILL.md",
      );
      expect(result.stdout).toContain("Would install git hooks");
      expect(result.stdout).toContain("Would add Pastoralist postinstall hook");
    });
  });

  test("can skip agent config and hooks while installing selected skills", () => {
    withTempRepo((root) => {
      const result = runScript(localDevScriptPath, root, [
        "--agent",
        "skip",
        "--skills",
        "pastoralist",
        "--hooks",
        "none",
      ]);

      expect(result.status).toBe(0);
      expect(readFixture(root, ".agents/skills/pastoralist/SKILL.md")).toContain("Pastoralist");
      expect(existsSync(join(root, "AGENTS.md"))).toBe(false);
      expect(existsSync(join(root, ".agents/skills/eslint-plugin-legibility/SKILL.md"))).toBe(
        false,
      );
    });
  });
});
