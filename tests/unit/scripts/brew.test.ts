import { assertContainsText } from "./utils";
import { errorIncludes } from "../setup";
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
} from "../../../scripts/release/brew";

const fetchPublished = () => Promise.resolve(new Response("published tarball"));
const fetchUnavailable = () => Promise.resolve(new Response(null, { status: 404 }));

const cases = [
  {
    name: "builds the published npm tarball URL",
    run: () => {
      assert.strictEqual(
        npmTarballUrl("1.13.0"),
        "https://registry.npmjs.org/pastoralist/-/pastoralist-1.13.0.tgz",
      );
    },
  },
  {
    name: "accepts only stable versions",
    run: () => {
      assert.doesNotThrow(() => validateStableVersion("1.13.0"));
      assert.throws(
        () => validateStableVersion("1.13.0-beta.1"),
        errorIncludes("Invalid stable version"),
      );
      assert.throws(
        () => validateStableVersion("v1.13.0"),
        errorIncludes("Invalid stable version"),
      );
    },
  },
  {
    name: "rejects prereleases before generating",
    run: async () => {
      const argv = ["validate-version"];
      const env = { VERSION: "1.13.0-rc.0" };
      const validation = runBrewCli({
        argv,
        env,
      });
      await assert.rejects(validation, errorIncludes("Invalid stable version"));
    },
  },
  {
    name: "downloads published tarball bytes",
    run: async () => {
      const tarball = await fetchPublishedTarball(npmTarballUrl("1.13.0"), fetchPublished);
      assert.deepStrictEqual(tarball, Buffer.from("published tarball"));
    },
  },
  {
    name: "rejects unavailable published tarballs",
    run: async () => {
      const download = fetchPublishedTarball(npmTarballUrl("1.13.0"), fetchUnavailable);
      await assert.rejects(download, errorIncludes("Unable to download published tarball: 404"));
    },
  },
  {
    name: "computes a hexadecimal SHA256",
    run: () => {
      const digest = sha256(Buffer.from("hello"));
      assert.strictEqual(digest.length, 64);
      assert.match(digest, /^[a-f0-9]+$/);
    },
  },
  {
    name: "renders a Node-backed formula",
    run: () => {
      const url = npmTarballUrl("1.13.0");
      const formula = renderFormula({
        digest: "abc123",
        url,
      });
      assert.doesNotMatch(formula, /^\s+version\s/m);
      assertContainsText(formula, 'depends_on "node"');
      assertContainsText(formula, 'system bin/"pastoralist", "--help"');
    },
  },
  {
    name: "generates a formula from a local tarball",
    run: () => {
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
    },
  },
  {
    name: "generates a formula from a published tarball",
    run: async () => {
      const directory = mkdtempSync(join(tmpdir(), "pastoralist-brew-published-"));
      const outputPath = join(directory, "pastoralist.rb");
      try {
        const options = { fetchImpl: fetchPublished, outputPath, version: "1.13.0" };
        const formula = await createPublishedFormula(options);
        assert.strictEqual(formula.digest, sha256(Buffer.from("published tarball")));
        assertContainsText(readFileSync(outputPath, "utf8"), formula.digest);
      } finally {
        rmSync(directory, { recursive: true });
      }
    },
  },
  {
    name: "runs local generation through the CLI",
    run: () => {
      const directory = mkdtempSync(join(tmpdir(), "pastoralist-brew-cli-"));
      const outputPath = join(directory, "pastoralist.rb");
      const tarballPath = join(directory, "pastoralist.tgz");
      try {
        writeFileSync(tarballPath, "local tarball");
        const env = { FORMULA_PATH: outputPath, TARBALL_PATH: tarballPath, VERSION: "1.13.0" };
        const argv = ["generate-local"];
        runBrewCli({ argv, env });
        assertContainsText(readFileSync(outputPath, "utf8"), sha256(Buffer.from("local tarball")));
      } finally {
        rmSync(directory, { recursive: true });
      }
    },
  },
  {
    name: "rejects unknown CLI commands",
    run: async () => {
      const env = { FORMULA_PATH: "pastoralist.rb", VERSION: "1.13.0" };
      const argv = ["unknown"];
      await assert.rejects(runBrewCli({ argv, env }), errorIncludes("Unknown command: unknown"));
    },
  },
];

describe("scripts/release/brew", () => {
  cases.forEach(({ name, run }) => test(name, run));
});
