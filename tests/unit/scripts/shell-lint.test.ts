import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { test, type TestContext } from "node:test";

const script = resolve("scripts/lint/shell.sh");
const statuses = [
  { shellcheck: 0, legibility: 0, shfmt: 0 },
  { shellcheck: 1, legibility: 0, shfmt: 0 },
  { shellcheck: 0, legibility: 1, shfmt: 0 },
  { shellcheck: 0, legibility: 0, shfmt: 1 },
];

const writeShellTool = (root: string, name: string, status: number): void => {
  const path = join(root, "bin", name);
  const content = `#!/bin/sh\nprintf '%s\\n' '${name}'\nexit ${status}\n`;
  writeFileSync(path, content, { mode: 0o755 });
};

const createProject = (t: TestContext): string => {
  const root = mkdtempSync(join(tmpdir(), "shell-lint-"));
  t.after(() => {
    rmSync(root, { recursive: true, force: true });
  });
  ["bin", "scripts", "tests/benchmarks", "tests/e2e/scripts"].forEach((path) => {
    mkdirSync(join(root, path), { recursive: true });
  });
  writeFileSync(join(root, "scripts/check.sh"), "#!/bin/sh\nexit 0\n");
  return root;
};

statuses.forEach((status) => {
  const shellcheckStatus = status.shellcheck;
  const legibilityStatus = status.legibility;
  const shfmtStatus = status.shfmt;
  test(`shell lint runs all tools and preserves failures (${shellcheckStatus}, ${legibilityStatus}, ${shfmtStatus})`, (t) => {
    const root = createProject(t);
    writeShellTool(root, "shellcheck", shellcheckStatus);
    writeShellTool(root, "shellcheck-legibility", legibilityStatus);
    writeShellTool(root, "shfmt", shfmtStatus);
    const toolPath = `${join(root, "bin")}:/usr/bin:/bin`;
    const env = Object.assign({}, process.env, { PATH: toolPath });
    const result = spawnSync("/bin/sh", [script], { cwd: root, encoding: "utf8", env });
    const output = result.stdout.trim().split("\n");
    const expectedStatus = Math.max(shellcheckStatus, legibilityStatus, shfmtStatus);
    assert.equal(result.status, expectedStatus, result.stderr);
    assert.deepEqual(output, ["shellcheck", "shfmt", "shellcheck-legibility"]);
  });
});
