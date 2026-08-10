import { describe, expect, test } from "bun:test";
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
    expect(npmTarballUrl("1.13.0")).toBe(
      "https://registry.npmjs.org/pastoralist/-/pastoralist-1.13.0.tgz",
    );
  });

  test("accepts only stable versions", () => {
    expect(() => validateStableVersion("1.13.0")).not.toThrow();
    expect(() => validateStableVersion("1.13.0-beta.1")).toThrow("Invalid stable version");
    expect(() => validateStableVersion("v1.13.0")).toThrow("Invalid stable version");
  });

  test("rejects prereleases before generating", async () => {
    const validation = runBrewCli({
      argv: ["validate-version"],
      env: { VERSION: "1.13.0-rc.0" },
    });
    await expect(validation).rejects.toThrow("Invalid stable version");
  });

  test("downloads published tarball bytes", async () => {
    const fetchImpl = () => Promise.resolve(new Response("published tarball"));
    const tarball = await fetchPublishedTarball(npmTarballUrl("1.13.0"), fetchImpl);
    expect(tarball).toEqual(Buffer.from("published tarball"));
  });

  test("rejects unavailable published tarballs", async () => {
    const fetchImpl = () => Promise.resolve(new Response(null, { status: 404 }));
    const download = fetchPublishedTarball(npmTarballUrl("1.13.0"), fetchImpl);
    await expect(download).rejects.toThrow("Unable to download published tarball: 404");
  });

  test("computes a hexadecimal SHA256", () => {
    const digest = sha256(Buffer.from("hello"));
    expect(digest).toHaveLength(64);
    expect(digest).toMatch(/^[a-f0-9]+$/);
  });

  test("renders a Node-backed formula", () => {
    const formula = renderFormula({
      digest: "abc123",
      url: npmTarballUrl("1.13.0"),
    });
    expect(formula).not.toMatch(/^\s+version\s/m);
    expect(formula).toContain('depends_on "node"');
    expect(formula).toContain('system bin/"pastoralist", "--help"');
  });

  test("generates a formula from a local tarball", () => {
    const directory = mkdtempSync(join(tmpdir(), "pastoralist-brew-"));
    const outputPath = join(directory, "pastoralist.rb");
    const tarballPath = join(directory, "pastoralist.tgz");

    try {
      writeFileSync(tarballPath, "local tarball");
      const formula = createLocalFormula({ outputPath, tarballPath, version: "1.13.0" });

      expect(formula.digest).toBe(sha256(Buffer.from("local tarball")));
      expect(readFileSync(outputPath, "utf8")).not.toMatch(/^\s+version\s/m);
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
      expect(formula.digest).toBe(sha256(Buffer.from("published tarball")));
      expect(readFileSync(outputPath, "utf8")).toContain(formula.digest);
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
      expect(readFileSync(outputPath, "utf8")).toContain(sha256(Buffer.from("local tarball")));
    } finally {
      rmSync(directory, { recursive: true });
    }
  });

  test("rejects unknown CLI commands", () => {
    const env = { FORMULA_PATH: "pastoralist.rb", VERSION: "1.13.0" };
    expect(() => runBrewCli({ argv: ["unknown"], env })).toThrow("Unknown command: unknown");
  });
});
