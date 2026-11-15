import { yarnGraphFixtures } from "../../fixtures/npm.fixtures";

import { parseYarnLockedPackages } from "../../../../src/mgrs/yarn/utils";
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

test("Yarn inventory preserves scoped npm alias registry identities", (t) => {
  const root = mkdtempSync(resolve(".yarn-alias-inventory-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const content = '"alias@npm:@scope/actual@^1.0.0":\n  version: "1.2.3"\n';
  writeFileSync(resolve(root, "yarn.lock"), content);
  assert.deepEqual(parseYarnLockedPackages(root), [
    { name: "alias", version: "1.2.3", registryName: "@scope/actual" },
  ]);
});

yarnGraphFixtures.forEach(({ name, content }) => {
  test(`${name} inventory preserves ordinary registry identities`, (t) => {
    const root = mkdtempSync(resolve(".yarn-inventory-"));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    writeFileSync(resolve(root, "yarn.lock"), content);
    assert.deepStrictEqual(parseYarnLockedPackages(root), [
      { name: "express", version: "4.18.0" },
      { name: "express", version: "5.0.0" },
      { name: "bridge", version: "1.0.0" },
      { name: "lodash", version: "4.17.21" },
    ]);
  });
});
