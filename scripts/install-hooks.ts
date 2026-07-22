#!/usr/bin/env bun

import { chmodSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";

const HOOKS_DIR = ".git/hooks";
const MANAGED_HOOK_MARKER = "pastoralist-managed-hook";

const PRE_COMMIT = `#!/usr/bin/env bun
// ${MANAGED_HOOK_MARKER}

import { $ } from 'bun';

console.log('Running pre-commit checks...');

try {
  await $\`node node_modules/eslint-plugin-legibility/bin/lint-changed.js\`;
  await $\`bun run format\`;
  await $\`bun run build\`;
  await $\`cd app && bun run build\`;
  await $\`bun run lint\`;
  await $\`bun test tests/unit/ --coverage --coverage-reporter=lcov\`;
  console.log('All pre-commit checks passed');
} catch {
  console.error('Pre-commit checks failed');
  process.exit(1);
}
`;

const COMMIT_MSG = `#!/usr/bin/env bun
// ${MANAGED_HOOK_MARKER}

import { readFileSync } from 'fs';

const commitMsgFile = process.argv[2];
const commitMsg = readFileSync(commitMsgFile, 'utf-8').trim();

const conventionalCommitPattern = /^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)(\\(.+\\))?: .{1,}/;

if (!conventionalCommitPattern.test(commitMsg)) {
  console.error('Invalid commit message format');
  console.error('Expected format: <type>(<scope>): <message>');
  console.error('Types: feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert');
  console.error(\`Received: \${commitMsg}\`);
  process.exit(1);
}

console.log('Commit message is valid');
`;

const POST_MERGE = `#!/usr/bin/env bun
// ${MANAGED_HOOK_MARKER}

import { $ } from 'bun';

console.log('Running post-merge checks...');

const lockfilePath = 'bun.lockb';
const packageJsonPath = 'package.json';

const lockfileChanged = await $\`git diff-tree -r --name-only --no-commit-id ORIG_HEAD HEAD\`.text();

if (lockfileChanged.includes(lockfilePath) || lockfileChanged.includes(packageJsonPath)) {
  console.log('Dependencies changed, running bun install...');
  await $\`bun install\`;
  console.log('Dependencies updated');
} else {
  console.log('No dependency changes detected');
}
`;

const HOOKS = {
  "pre-commit": PRE_COMMIT,
  "commit-msg": COMMIT_MSG,
  "post-merge": POST_MERGE,
} as const;

type HookName = keyof typeof HOOKS;

interface HookStats {
  installed: number;
  skipped: number;
  updated: number;
}

const GENERATED_HOOK_SIGNATURES: Record<HookName, string> = {
  "pre-commit": "Running pre-commit checks...",
  "commit-msg": "Commit message is valid",
  "post-merge": "Running post-merge checks...",
};

const initialHookStats = (): HookStats => ({
  installed: 0,
  skipped: 0,
  updated: 0,
});

const incrementStat = (stats: HookStats, key: keyof HookStats): HookStats =>
  Object.assign({}, stats, { [key]: stats[key] + 1 });

const isGeneratedHook = (hookName: HookName, hookContent: string): boolean => {
  if (hookContent.includes(MANAGED_HOOK_MARKER)) return true;
  return hookContent.includes(GENERATED_HOOK_SIGNATURES[hookName]);
};

const writeHook = (hookPath: string, hookContent: string): void => {
  writeFileSync(hookPath, hookContent, { mode: 0o755 });
  chmodSync(hookPath, 0o755);
};

const installHook = (hookName: HookName, stats: HookStats): HookStats => {
  const hookPath = join(HOOKS_DIR, hookName);
  const hookContent = HOOKS[hookName];
  const hookExists = existsSync(hookPath);

  if (!hookExists) {
    writeHook(hookPath, hookContent);
    console.log(`Installed ${hookName} hook`);
    return incrementStat(stats, "installed");
  }

  const existingHook = readFileSync(hookPath, "utf8");
  const canUpdate = isGeneratedHook(hookName, existingHook);
  if (!canUpdate) return incrementStat(stats, "skipped");
  if (existingHook === hookContent) return incrementStat(stats, "skipped");

  writeHook(hookPath, hookContent);
  console.log(`Updated ${hookName} hook`);
  return incrementStat(stats, "updated");
};

const installHooks = async (): Promise<void> => {
  const isCI = process.env.CI === "true" || process.env.CI === "1";
  if (isCI) {
    console.log("CI environment detected, skipping hook installation");
    return;
  }

  const isGitRepo = existsSync(".git");
  if (!isGitRepo) {
    console.log("Not a git repository, skipping hook installation");
    return;
  }

  const { $ } = await import("bun");

  try {
    const hooksPath = await $`git config --get core.hooksPath`.text();
    const isHuskyPath = hooksPath.trim() === ".husky/_";
    if (isHuskyPath) {
      await $`git config --unset core.hooksPath`;
      console.log("Removed husky hooks path configuration");
    }
  } catch {
    // core.hooksPath not set, which is fine
  }

  const hooksDir = HOOKS_DIR;
  if (!existsSync(hooksDir)) {
    mkdirSync(hooksDir, { recursive: true });
  }

  const hookNames = Object.keys(HOOKS) as HookName[];
  const hookStats = hookNames.reduce(
    (stats, hookName) => installHook(hookName, stats),
    initialHookStats(),
  );
  const { installed, skipped, updated } = hookStats;

  if (installed > 0) console.log(`\nInstalled ${installed} git hook(s)`);
  if (updated > 0) console.log(`Updated ${updated} git hook(s)`);
  if (skipped > 0) console.log(`Skipped ${skipped} existing hook(s)`);

  const noHooksInstalled = installed === 0;
  const noHooksSkipped = skipped === 0;
  const noHooksUpdated = updated === 0;
  const hasNoChanges = noHooksInstalled && noHooksSkipped && noHooksUpdated;
  if (hasNoChanges) console.log("No hooks to install");
};

await installHooks();
