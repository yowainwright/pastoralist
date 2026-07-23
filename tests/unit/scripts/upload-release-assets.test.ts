import { afterEach, describe, expect, test } from "bun:test";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_PATH = fileURLToPath(
  new URL("../../../scripts/upload-release-assets.sh", import.meta.url),
);
const FAKE_GH = `#!/bin/sh
if [ "$1" = "api" ]; then
  printf '%s' "$FAKE_RELEASE_JSON"
  exit 0
fi
printf '%s\n' "$*" >> "$FAKE_GH_LOG"
`;
const tempDirectories = new Set<string>();

type Fixture = { assetPath: string; env: NodeJS.ProcessEnv; logPath: string };

const createFixture = (publishedDigest?: string | null): Fixture => {
  const root = mkdtempSync(join(tmpdir(), "pastoralist-release-assets-"));
  const binPath = join(root, "bin");
  const assetPath = join(root, "pastoralist.tgz");
  const logPath = join(root, "gh.log");
  const hasPublishedAsset = publishedDigest !== undefined;
  const assets = hasPublishedAsset ? [{ name: "pastoralist.tgz", digest: publishedDigest }] : [];
  const path = `${binPath}:${process.env.PATH ?? ""}`;

  tempDirectories.add(root);
  mkdirSync(binPath);
  writeFileSync(assetPath, "release asset");
  writeFileSync(logPath, "");
  writeFileSync(join(binPath, "gh"), FAKE_GH);
  chmodSync(join(binPath, "gh"), 0o755);

  const releaseJson = JSON.stringify({ assets });
  const env = Object.assign({}, process.env, {
    FAKE_GH_LOG: logPath,
    FAKE_RELEASE_JSON: releaseJson,
    GITHUB_REPOSITORY: "yowainwright/pastoralist",
    PATH: path,
  });
  return { assetPath, env, logPath };
};

const runUpload = ({ assetPath, env }: Fixture) =>
  spawnSync("sh", [SCRIPT_PATH, "v1.2.3", assetPath], { encoding: "utf8", env });

afterEach(() => {
  tempDirectories.forEach((directory) => rmSync(directory, { recursive: true }));
  tempDirectories.clear();
});

describe("scripts/upload-release-assets", () => {
  test("uploads a missing asset", () => {
    const fixture = createFixture();
    const result = runUpload(fixture);

    expect(result.status).toBe(0);
    expect(readFileSync(fixture.logPath, "utf8")).toContain("release upload v1.2.3");
  });

  test("skips an existing asset with the expected digest", () => {
    const digest = createHash("sha256").update("release asset").digest("hex");
    const fixture = createFixture(`sha256:${digest}`);
    const result = runUpload(fixture);

    expect(result.status).toBe(0);
    expect(readFileSync(fixture.logPath, "utf8")).toBe("");
  });

  test("rejects an existing asset with a different digest", () => {
    const fixture = createFixture("sha256:unexpected");
    const result = runUpload(fixture);

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("Release asset digest mismatch: pastoralist.tgz");
    expect(readFileSync(fixture.logPath, "utf8")).toBe("");
  });

  test("rejects an existing asset without a published digest", () => {
    const fixture = createFixture(null);
    const result = runUpload(fixture);

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("Release asset digest unavailable: pastoralist.tgz");
    expect(readFileSync(fixture.logPath, "utf8")).toBe("");
  });
});
