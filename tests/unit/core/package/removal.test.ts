import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { PastoralistJSON } from "../../../../src/types";
import { withRemovalState } from "../../../../src/core/package";
import {
  errorIncludes,
  mock,
  safeExistsSync as existsSync,
  safeMkdirSync as mkdirSync,
  safeReadFileSync as readFileSync,
  safeRmSync as rmSync,
  safeWriteFileSync as writeFileSync,
} from "../../setup";

const projectConfig: PastoralistJSON = {
  name: "removal-project",
  version: "1.0.0",
  dependencies: { parent: "1.0.0" },
  scripts: { postinstall: "node project-hook.js" },
};

const resolvePackageManagerCommand = () => ({ stdout: "", stderr: "" });

const createRemovalProject = (lockfile: string): string => {
  const root = mkdtempSync(join(tmpdir(), "pastoralist-removal-test-"));
  writeFileSync(join(root, "package.json"), JSON.stringify(projectConfig));
  writeFileSync(join(root, lockfile), "removal lock");
  return root;
};

const commandCases = [
  { lockfile: "package-lock.json", command: "npm", expectedFlag: "--package-lock-only" },
  { lockfile: "pnpm-lock.yaml", command: "pnpm", expectedFlag: "--lockfile-only" },
  { lockfile: "yarn.lock", command: "yarn", expectedFlag: "--non-interactive" },
  { lockfile: "bun.lock", command: "bun", expectedFlag: "--lockfile-only" },
];

commandCases.forEach(({ lockfile, command, expectedFlag }) => {
  test(`removal state - resolves ${command} lockfile`, async () => {
    const root = createRemovalProject(lockfile);
    if (command === "yarn") writeFileSync(join(root, ".yarnrc.yml"), "nodeLinker: node-modules\n");
    let stagedRoot = "";
    const execFile = mock(resolvePackageManagerCommand);

    try {
      const inspectedName = await withRemovalState(
        projectConfig,
        { path: join(root, "package.json") },
        (removalRoot) => {
          stagedRoot = removalRoot;
          assert.strictEqual(existsSync(join(removalRoot, lockfile)), true);
          const manifest = JSON.parse(readFileSync(join(removalRoot, "package.json"), "utf8"));
          assert.strictEqual(manifest.scripts, undefined);
          if (command === "yarn") {
            assert.strictEqual(existsSync(join(removalRoot, ".yarnrc.yml")), true);
          }
          return manifest.name;
        },
        { execFile: execFile as any },
      );
      const call = execFile.mock.calls.map((item) =>
        Array.isArray(item) ? item : item.arguments,
      )[0];
      assert.strictEqual(inspectedName, "removal-project");
      assert.strictEqual(call[0], command);
      assert.strictEqual(call[1].includes(expectedFlag), true);
      assert.strictEqual(call[2].cwd, stagedRoot);
      if (command === "yarn") {
        assert.strictEqual(call[2].env.YARN_ENABLE_SCRIPTS, "false");
        assert.strictEqual(call[2].env.YARN_IGNORE_PATH, "true");
        assert.strictEqual(call[2].env.YARN_PLUGINS, "");
      }
      assert.strictEqual(existsSync(stagedRoot), false);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});

test("removal state - fails closed without a lockfile", async () => {
  const root = mkdtempSync(join(tmpdir(), "pastoralist-removal-no-lock-"));
  const execFile = mock(resolvePackageManagerCommand);

  try {
    await assert.rejects(
      withRemovalState(projectConfig, { path: join(root, "package.json") }, () => undefined, {
        execFile: execFile as any,
      }),
      /No npm lockfile is available/,
    );
    assert.strictEqual(execFile.mock.callCount(), 0);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("removal state - updates staged pnpm overrides", async () => {
  const root = createRemovalProject("pnpm-lock.yaml");
  writeFileSync(join(root, "pnpm-workspace.yaml"), "packages: []\noverrides:\n  removed: 1.0.0\n");
  const config = Object.assign({}, projectConfig, {
    pnpm: { overrides: { kept: "2.0.0" } },
  });
  const execFile = mock(resolvePackageManagerCommand);

  try {
    await withRemovalState(
      config,
      { path: join(root, "package.json") },
      (removalRoot) => {
        const workspace = readFileSync(join(removalRoot, "pnpm-workspace.yaml"), "utf8");
        assert.match(workspace, /"kept": "2.0.0"/);
        assert.doesNotMatch(workspace, /removed:/);
        return undefined;
      },
      { execFile: execFile as any },
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("removal state - stages declarative pnpm resolver inputs", async () => {
  const root = createRemovalProject("pnpm-lock.yaml");
  const patchPath = join("patches", "dependency.patch");
  mkdirSync(join(root, "patches"), { recursive: true });
  writeFileSync(join(root, ".npmrc"), "strict-peer-dependencies=true\n");
  writeFileSync(join(root, patchPath), "patch contents");
  const execFile = mock(resolvePackageManagerCommand);

  try {
    await withRemovalState(
      projectConfig,
      { path: join(root, "package.json") },
      (removalRoot) => {
        assert.strictEqual(existsSync(join(removalRoot, ".npmrc")), true);
        assert.strictEqual(readFileSync(join(removalRoot, patchPath), "utf8"), "patch contents");
        return undefined;
      },
      { execFile: execFile as any },
    );
    const call = execFile.mock.calls[0].arguments;
    assert.strictEqual(call[1].includes("--ignore-pnpmfile"), true);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

const executableResolverCases = [
  {
    name: "pnpm hooks",
    lockfile: "pnpm-lock.yaml",
    path: ".pnpmfile.cjs",
    content: "module.exports = { hooks: {} };\n",
  },
  {
    name: "configured pnpm hooks",
    lockfile: "pnpm-lock.yaml",
    path: ".npmrc",
    content: "pnpmfile=.config/hooks.cjs\n",
  },
  {
    name: "Yarn plugins",
    lockfile: "yarn.lock",
    path: ".yarnrc.yml",
    content: "plugins: [./plugin.cjs]\n",
  },
  {
    name: "project-local Yarn binaries",
    lockfile: "yarn.lock",
    path: ".yarnrc.yml",
    content: "yarnPath: .yarn/releases/yarn.cjs\n",
  },
  {
    name: "Bun security scanners",
    lockfile: "bun.lock",
    path: "bunfig.toml",
    content: '[install.security]\nscanner = "project-scanner"\n',
  },
];

executableResolverCases.forEach(({ name, lockfile, path, content }) => {
  test(`removal state - rejects ${name}`, async () => {
    const root = createRemovalProject(lockfile);
    writeFileSync(join(root, path), content);
    const execFile = mock(resolvePackageManagerCommand);

    try {
      await assert.rejects(
        withRemovalState(projectConfig, { path: join(root, "package.json") }, () => undefined, {
          execFile: execFile as any,
        }),
        errorIncludes(`Executable resolver config prevents safe verification: ${path}`),
      );
      assert.strictEqual(execFile.mock.callCount(), 0);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});

test("removal state - stages workspace manifests", async () => {
  const root = createRemovalProject("package-lock.json");
  const workspaceDir = join(root, "packages", "app");
  mkdirSync(workspaceDir, { recursive: true });
  const workspaceManifest = {
    name: "workspace-app",
    version: "1.0.0",
    scripts: { postinstall: "node project-hook.js" },
  };
  writeFileSync(join(workspaceDir, "package.json"), JSON.stringify(workspaceManifest));
  const config = Object.assign({}, projectConfig, { workspaces: ["packages/*"] });
  const execFile = mock(resolvePackageManagerCommand);

  try {
    await withRemovalState(
      config,
      { path: join(root, "package.json") },
      (removalRoot) => {
        const manifestPath = join(removalRoot, "packages", "app", "package.json");
        assert.strictEqual(existsSync(manifestPath), true);
        const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
        assert.strictEqual(manifest.scripts, undefined);
        return undefined;
      },
      { execFile: execFile as any },
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
