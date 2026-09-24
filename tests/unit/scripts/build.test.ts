import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { parseBuildTarget } from "../../../scripts/build/index";
import { rolldownConfig } from "../../../scripts/build/rolldown.config";
import { buildRolldownBundleArgs } from "../../../scripts/build/utils";

const cases = [
  {
    name: "parseBuildTarget defaults to the dist build",
    run: () => {
      assert.strictEqual(parseBuildTarget([]), "dist");
    },
  },
  {
    name: "parseBuildTarget accepts explicit build targets",
    run: () => {
      assert.strictEqual(parseBuildTarget(["bundle"]), "bundle");
      assert.strictEqual(parseBuildTarget(["types"]), "types");
      assert.strictEqual(parseBuildTarget(["bin"]), "bin");
      assert.strictEqual(parseBuildTarget(["clean"]), "clean");
    },
  },
  {
    name: "parseBuildTarget rejects unknown targets",
    run: () => {
      assert.throws(() => parseBuildTarget(["release"]), /Invalid build target/);
    },
  },
  {
    name: "buildRolldownBundleArgs translates the bundle config",
    run: () => {
      assert.deepStrictEqual(buildRolldownBundleArgs(rolldownConfig), [
        "src/index.ts",
        "--dir",
        "dist",
        "--platform",
        "node",
        "--format",
        "esm",
        "--minify",
        "--external",
        "fs,path,crypto",
      ]);
    },
  },
];

describe("scripts/build", () => {
  cases.forEach(({ name, run }) => test(name, run));
});
