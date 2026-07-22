import { describe, expect, test } from "bun:test";
import {
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
    const fetchImpl = async () => new Response("published tarball");
    const tarball = await fetchPublishedTarball(npmTarballUrl("1.13.0"), fetchImpl);
    expect(tarball).toEqual(Buffer.from("published tarball"));
  });

  test("rejects unavailable published tarballs", async () => {
    const fetchImpl = async () => new Response(null, { status: 404 });
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
      version: "1.13.0",
    });
    expect(formula).toContain('version "1.13.0"');
    expect(formula).toContain('depends_on "node"');
    expect(formula).toContain('system bin/"pastoralist", "--help"');
  });
});
