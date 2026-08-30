import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { parseBuildTarget } from "../../../scripts/build/index";
import { rolldownConfig } from "../../../scripts/build/rolldown.config";
import { buildRolldownBundleArgs } from "../../../scripts/build/utils";

describe("scripts/build", () => {
  test("parseBuildTarget defaults to the dist build", () => {
    assert.strictEqual(parseBuildTarget([]), "dist");
  });

  test("parseBuildTarget accepts explicit build targets", () => {
    assert.strictEqual(parseBuildTarget(["bundle"]), "bundle");
    assert.strictEqual(parseBuildTarget(["types"]), "types");
    assert.strictEqual(parseBuildTarget(["bin"]), "bin");
    assert.strictEqual(parseBuildTarget(["clean"]), "clean");
  });

  test("parseBuildTarget rejects unknown targets", () => {
    assert.throws(() => parseBuildTarget(["release"]), /Invalid build target/);
  });

  test("buildRolldownBundleArgs translates the bundle config", () => {
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
  });
});
