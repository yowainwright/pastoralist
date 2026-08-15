import { errorIncludes } from "../setup.ts";
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  createLocalFormula,
  createPublishedFormula,
  fetchPublishedTarball,
  npmTarballUrl,
  renderFormula,
  runBrewCli,
  sha256,
  validateStableVersion,
} from "../../../scripts/brew";

describe("scripts/brew", () => {
  test("builds the published npm tarball URL", () => {
    assert.strictEqual(
      npmTarballUrl("1.13.0"),
      "https://registry.npmjs.org/pastoralist/-/pastoralist-1.13.0.tgz",
    );
  });

  test("accepts only stable versions", () => {
    assert.doesNotThrow(() => validateStableVersion("1.13.0"));
    assert.throws(
      () => validateStableVersion("1.13.0-beta.1"),
      errorIncludes("Invalid stable version"),
    );
    assert.throws(() => validateStableVersion("v1.13.0"), errorIncludes("Invalid stable version"));
  });

  test("rejects prereleases before generating", async () => {
    const validation = runBrewCli({
      argv: ["validate-version"],
      env: { VERSION: "1.13.0-rc.0" },
    });
    await assert.rejects(validation, errorIncludes("Invalid stable version"));
  });

  test("downloads published tarball bytes", async () => {
    const fetchImpl = () => Promise.resolve(new Response("published tarball"));
    const tarball = await fetchPublishedTarball(npmTarballUrl("1.13.0"), fetchImpl);
    assert.deepStrictEqual(tarball, Buffer.from("published tarball"));
  });

  test("rejects unavailable published tarballs", async () => {
    const fetchImpl = () => Promise.resolve(new Response(null, { status: 404 }));
    const download = fetchPublishedTarball(npmTarballUrl("1.13.0"), fetchImpl);
    await assert.rejects(download, errorIncludes("Unable to download published tarball: 404"));
  });

  test("computes a hexadecimal SHA256", () => {
    const digest = sha256(Buffer.from("hello"));
    assert.strictEqual(digest.length, 64);
    assert.match(digest, /^[a-f0-9]+$/);
  });

  test("renders a Node-backed formula", () => {
    const formula = renderFormula({
      digest: "abc123",
      url: npmTarballUrl("1.13.0"),
    });
    assert.doesNotMatch(formula, /^\s+version\s/m);
    assert.ok(formula.includes('depends_on "node"'));
    assert.ok(formula.includes('system bin/"pastoralist", "--help"'));
  });

  test("generates a formula from a local tarball", () => {
    const directory = mkdtempSync(join(tmpdir(), "pastoralist-brew-"));
    const outputPath = join(directory, "pastoralist.rb");
    const tarballPath = join(directory, "pastoralist.tgz");

    try {
      writeFileSync(tarballPath, "local tarball");
      const formula = createLocalFormula({ outputPath, tarballPath, version: "1.13.0" });

      assert.strictEqual(formula.digest, sha256(Buffer.from("local tarball")));
      assert.doesNotMatch(readFileSync(outputPath, "utf8"), /^\s+version\s/m);
    } finally {
      rmSync(directory, { recursive: true });
    }
  });

  test("generates a formula from a published tarball", async () => {
    const directory = mkdtempSync(join(tmpdir(), "pastoralist-brew-published-"));
    const outputPath = join(directory, "pastoralist.rb");
    const fetchImpl = () => Promise.resolve(new Response("published tarball"));
    try {
      const formula = await createPublishedFormula({ fetchImpl, outputPath, version: "1.13.0" });
      assert.strictEqual(formula.digest, sha256(Buffer.from("published tarball")));
      assert.ok(readFileSync(outputPath, "utf8").includes(formula.digest));
    } finally {
      rmSync(directory, { recursive: true });
    }
  });

  test("runs local generation through the CLI", () => {
    const directory = mkdtempSync(join(tmpdir(), "pastoralist-brew-cli-"));
    const outputPath = join(directory, "pastoralist.rb");
    const tarballPath = join(directory, "pastoralist.tgz");
    try {
      writeFileSync(tarballPath, "local tarball");
      const env = { FORMULA_PATH: outputPath, TARBALL_PATH: tarballPath, VERSION: "1.13.0" };
      runBrewCli({ argv: ["generate-local"], env });
      assert.ok(readFileSync(outputPath, "utf8").includes(sha256(Buffer.from("local tarball"))));
    } finally {
      rmSync(directory, { recursive: true });
    }
  });

  test("rejects unknown CLI commands", async () => {
    const env = { FORMULA_PATH: "pastoralist.rb", VERSION: "1.13.0" };
    await assert.rejects(
      runBrewCli({ argv: ["unknown"], env }),
      errorIncludes("Unknown command: unknown"),
    );
  });
});
