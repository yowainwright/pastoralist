import { spawnSync } from "node:child_process";
import { chmodSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";

const HOOKS_DIR = ".git/hooks";
const MANAGED_HOOK_MARKER = "pastoralist-managed-hook";

const PRE_COMMIT = `#!/bin/sh
# ${MANAGED_HOOK_MARKER}

echo 'Running pre-commit checks...'

if pnpm run format \
  && pnpm run build \
  && pnpm --dir app install --frozen-lockfile \
  && pnpm --dir app run build \
  && pnpm run lint \
  && pnpm run test:coverage; then
  echo 'All pre-commit checks passed'
else
  echo 'Pre-commit checks failed' >&2
  exit 1
fi
`;

const COMMIT_MSG = `#!/bin/sh
# ${MANAGED_HOOK_MARKER}

commit_msg_file=$1
commit_msg=$(head -n 1 "$commit_msg_file")

if ! printf '%s\\n' "$commit_msg" | grep -Eq '^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)([(][^)]+[)])?: .+'; then
  echo 'Invalid commit message format' >&2
  echo 'Expected format: <type>(<scope>): <message>' >&2
  echo 'Types: feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert' >&2
  echo "Received: $commit_msg" >&2
  exit 1
fi

echo 'Commit message is valid'
`;

const POST_MERGE = `#!/bin/sh
# ${MANAGED_HOOK_MARKER}

echo 'Running post-merge checks...'

changed_files=$(git diff-tree -r --name-only --no-commit-id ORIG_HEAD HEAD)
dependencies_changed=false
for dependency_file in pnpm-lock.yaml package.json app/pnpm-lock.yaml app/package.json; do
  if printf '%s\n' "$changed_files" | grep -Fqx "$dependency_file"; then
    dependencies_changed=true
    break
  fi
done

if [ "$dependencies_changed" = true ]; then
  echo 'Dependencies changed, running pnpm install...'
  if pnpm install && pnpm --dir app install; then
    echo 'Dependencies updated'
  else
    echo 'Dependency installation failed' >&2
    exit 1
  fi
else
  echo 'No dependency changes detected'
fi
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

const incrementStat = (stats: HookStats, key: keyof HookStats): HookStats => {
  const count = stats[key] + 1;
  const updated = Object.assign({}, stats, { [key]: count });
  return updated;
};

const isGeneratedHook = (hookName: HookName, hookContent: string): boolean => {
  if (hookContent.includes(MANAGED_HOOK_MARKER)) return true;
  const hasGeneratedSignature = hookContent.includes(GENERATED_HOOK_SIGNATURES[hookName]);
  return hasGeneratedSignature;
};

const runGitConfig = (args: readonly string[]) =>
  spawnSync("git", ["config"].concat(Array.from(args)), { encoding: "utf8" });

const readHooksPath = (): string => {
  const result = runGitConfig(["--get", "core.hooksPath"]);
  if (result.status !== 0) return "";
  const hooksPath = result.stdout.trim();
  return hooksPath;
};

const unsetHooksPath = (): void => {
  const result = runGitConfig(["--unset", "core.hooksPath"]);
  if (result.status === 0) return;

  const message = result.stderr.trim() || "Unable to unset core.hooksPath";
  throw new Error(message);
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
    const updated = incrementStat(stats, "installed");
    return updated;
  }

  const updated = updateHook(hookName, stats);
  return updated;
};

const updateHook = (hookName: HookName, stats: HookStats): HookStats => {
  const hookPath = join(HOOKS_DIR, hookName);
  const hookContent = HOOKS[hookName];
  const existingHook = readFileSync(hookPath, "utf8");
  const canUpdate = isGeneratedHook(hookName, existingHook);
  const shouldSkip = !canUpdate || existingHook === hookContent;
  if (shouldSkip) {
    const skipped = incrementStat(stats, "skipped");
    return skipped;
  }

  writeHook(hookPath, hookContent);
  console.log(`Updated ${hookName} hook`);
  const updated = incrementStat(stats, "updated");
  return updated;
};

const installHooks = (): void => {
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

  prepareHooksDirectory();
  const hookNames = Object.keys(HOOKS) as HookName[];
  const hookStats = hookNames.reduce(
    (stats, hookName) => installHook(hookName, stats),
    initialHookStats(),
  );
  printHookStats(hookStats);
};

const prepareHooksDirectory = (): void => {
  const hooksPath = readHooksPath();
  const isHuskyPath = hooksPath === ".husky/_";
  if (isHuskyPath) {
    unsetHooksPath();
    console.log("Removed husky hooks path configuration");
  }

  if (!existsSync(HOOKS_DIR)) {
    mkdirSync(HOOKS_DIR, { recursive: true });
  }
};

const printHookStats = (hookStats: HookStats): void => {
  const { installed, skipped, updated } = hookStats;

  if (installed > 0) console.log(`\nInstalled ${installed} git hook(s)`);
  if (updated > 0) console.log(`Updated ${updated} git hook(s)`);
  if (skipped > 0) console.log(`Skipped ${skipped} existing hook(s)`);

  const hasChanges = Boolean(installed || skipped || updated);
  if (!hasChanges) console.log("No hooks to install");
};

installHooks();
