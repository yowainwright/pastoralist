import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { withRemovalState } from "../../../../src/core/package";
import {
  mock,
  safeExistsSync as existsSync,
  safeMkdirSync as mkdirSync,
  safeReadFileSync as readFileSync,
  safeRmSync as rmSync,
  safeWriteFileSync as writeFileSync,
} from "../../setup";

const config = { name: "yarn-config-check", version: "1.0.0" };
const pluginPath = ".yarn/patches/plugin.cjs";
const plugin = `require("node:fs").writeFileSync("plugin-ran", "unsafe");\n`;
const unsafeConfigs = [
  ["hex key", String.raw`"\x70lugins": [${pluginPath}]`],
  ["Unicode key", String.raw`"\u0070lugins": [${pluginPath}]`],
  ["long Unicode key", String.raw`"\U00000070lugins": [${pluginPath}]`],
  ["continued key", `"plu\\\n  gins": [${pluginPath}]`],
  ["explicit key", `? plugins\n: [${pluginPath}]`],
  ["tagged key", `!!str plugins: [${pluginPath}]`],
  ["anchored key", `&key plugins: [${pluginPath}]`],
  ["alias key", `name: &key plugins\n*key: [${pluginPath}]`],
  ["block key", `? |-\n  plugins\n: [${pluginPath}]`],
  ["flow mapping", `{ "plugins": [${pluginPath}] }`],
  ["CR line ending", `nodeLinker: node-modules\rplugins: [${pluginPath}]`],
  ["BOM", `\uFEFFplugins: [${pluginPath}]\nnodeLinker: node-modules`],
  ["indented mapping", `  nodeLinker: node-modules\n  plugins: [${pluginPath}]`],
  ["quoted key", `'plugins': [${pluginPath}]`],
  ["escaped binary key", String.raw`"\x79arnPath": .yarn/patches/plugin.cjs`],
  ["explicit binary key", "? yarnPath\n: .yarn/patches/plugin.cjs"],
  [
    "legacy header",
    String.raw`# yarn lockfile v1
"\u0070lugins": [${pluginPath}]`,
  ],
  ["hidden indentation", `  nodeLinker: "value\nsafe: value"\n  plugins: [${pluginPath}]`],
  ["unsupported root", `[plugins, ${pluginPath}]`],
  ["root sequence", "- nodeLinker: node-modules"],
  ["list before plugins", `unsafeHttpWhitelist:\n- localhost\nplugins: [${pluginPath}]`],
  [
    "list before escaped plugins",
    `unsafeHttpWhitelist:\n- localhost\n"\\u0070lugins": [${pluginPath}]`,
  ],
  ["list before binary key", `unsafeHttpWhitelist:\n- localhost\nyarnPath: ${pluginPath}`],
  [
    "indented list before plugins",
    `  unsafeHttpWhitelist:\n  - localhost\n  plugins: [${pluginPath}]`,
  ],
  ["dedented list", "  unsafeHttpWhitelist:\n- localhost"],
];

const createProject = (content: string): string => {
  const root = mkdtempSync(join(tmpdir(), "yarn-config-"));
  mkdirSync(join(root, ".yarn/patches"), { recursive: true });
  writeFileSync(join(root, "package.json"), JSON.stringify(config));
  writeFileSync(join(root, "yarn.lock"), "# yarn lockfile v1\n");
  writeFileSync(join(root, ".yarnrc.yml"), content);
  writeFileSync(join(root, pluginPath), plugin);
  return root;
};

unsafeConfigs.forEach(([name, content]) => {
  test(`Yarn removal rejects ${name} before starting the manager`, async (t) => {
    const root = createProject(content);
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const execFile = mock(async () => ({ stdout: "", stderr: "" }));
    const inspect = mock(() => undefined);
    await assert.rejects(
      withRemovalState(config, { root }, inspect, { execFile: execFile as any }),
      /(?:Executable resolver config|Unsupported Yarn config syntax) prevents safe verification: \.yarnrc\.yml/,
    );
    assert.equal(execFile.mock.callCount(), 0);
    assert.equal(inspect.mock.callCount(), 0);
    assert.equal(readFileSync(join(root, ".yarnrc.yml")), content);
    assert.equal(readFileSync(join(root, pluginPath)), plugin);
    assert.equal(existsSync(join(root, "plugin-ran")), false);
  });
});

const safeConfigs = [
  "",
  "# plugins are not configured here\n",
  "nodeLinker: node-modules\n",
  "  nodeLinker: node-modules\n  enableGlobalCache: true\n",
  "\uFEFF---\nnodeLinker: node-modules\n",
  "unsafeHttpWhitelist:\n- localhost\n",
  "unsafeHttpWhitelist:\n- localhost\n\n# Another host\n- example.test\nnodeLinker: node-modules\n",
  "  unsafeHttpWhitelist:\n  - localhost\n  enableGlobalCache: true\n",
  "unsafeHttpWhitelist:\n  - localhost\nnodeLinker: node-modules\n",
  "logFilters:\n- code: YN0005\n  level: discard\nnodeLinker: node-modules\n",
  `# Keep registry settings and patch files
nodeLinker: node-modules
"npmRegistryServer": "https://registry.npmjs.org"
npmScopes:
  plugins:
    npmRegistryServer: "https://example.test/plugins"
packageExtensions:
  "some-package@*": { dependencies: { helper: "1.0.0" } }
`,
];

safeConfigs.forEach((content, index) => {
  test(`Yarn removal preserves declarative config ${index + 1}`, async (t) => {
    const root = createProject(content);
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const execFile = mock(async () => ({ stdout: "", stderr: "" }));
    await withRemovalState(
      config,
      { root },
      (stagedRoot) => {
        assert.equal(readFileSync(join(stagedRoot, ".yarnrc.yml")), content);
        assert.equal(readFileSync(join(stagedRoot, pluginPath)), plugin);
      },
      { execFile: execFile as any },
    );
    assert.equal(execFile.mock.callCount(), 1);
    assert.equal(readFileSync(join(root, ".yarnrc.yml")), content);
  });
});
