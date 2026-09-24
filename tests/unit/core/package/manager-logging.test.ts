import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import type { PackageManager } from "../../../../src/mgrs/types";

const originalDebug = process.env.DEBUG;
process.env.DEBUG = "true";
const { getJsManager } = await import("../../../../src/mgrs");
if (originalDebug === undefined) delete process.env.DEBUG;
else process.env.DEBUG = originalDebug;

const managers: PackageManager[] = ["npm", "pnpm", "yarn", "bun"];

managers.forEach((name) => {
  test(`${name} logs failed lockfile reads without changing fallback results`, (t) => {
    const manager = getJsManager(name);
    const root = mkdtempSync(join(tmpdir(), "manager-logging-"));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const lockPath = join(root, manager.lockfiles[0]);
    mkdirSync(lockPath);
    const debug = t.mock.method(console, "debug", () => undefined);
    assert.equal(manager.readPackages(root), undefined);
    assert.equal(manager.readTree(root), undefined);
    assert.equal(manager.readGraph(root), undefined);
    assert.equal(manager.countPackages(root), 0);
    assert.equal(debug.mock.callCount(), 4);
    debug.mock.calls.forEach(({ arguments: args }) => {
      assert.match(String(args[0]), /Could not (read|count)/);
      assert.equal(args[1], lockPath);
    });
  });
});
