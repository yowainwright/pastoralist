import { afterEach, describe, test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_PATH = fileURLToPath(
  new URL("../../../scripts/release/upload-assets.sh", import.meta.url),
);
const FAKE_GH = `#!/bin/sh
printf '%s\n' "$*" >> "$FAKE_GH_LOG"
if [ "$1" = "api" ] && [ "$2" = "--paginate" ]; then
  printf '%s' "$FAKE_RELEASE_JSON"
  exit 0
fi
`;
const RELEASE_ID = 123;
const UPLOAD_URL =
  "https://uploads.github.com/repos/yowainwright/pastoralist/releases/123/assets{?name,label}";
const tempDirectories = new Set<string>();

type Fixture = { assetPath: string; env: NodeJS.ProcessEnv; logPath: string };

const createReleaseJson = (
  assets: Array<{ digest: string | null; name: string }>,
  exists: boolean,
) => {
  if (!exists) return JSON.stringify([[]]);
  const release = {
    assets,
    draft: true,
    id: RELEASE_ID,
    tag_name: "v1.2.3",
    upload_url: UPLOAD_URL,
  };
  return JSON.stringify([[release]]);
};

const createFixture = (publishedDigest?: string | null, releaseExists = true): Fixture => {
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

  const releaseJson = createReleaseJson(assets, releaseExists);
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

describe("scripts/release/upload-assets", () => {
  test("uploads a missing asset", () => {
    const fixture = createFixture();
    const result = runUpload(fixture);
    const log = readFileSync(fixture.logPath, "utf8");

    assert.strictEqual(result.status, 0);
    assert.strictEqual(result.stdout, "123\n");
    assert.ok(log.includes("api --paginate --slurp"));
    assert.ok(log.includes("api --method POST"));
    assert.ok(log.includes("releases/123/assets?name=pastoralist.tgz"));
    assert.ok(!log.includes("releases/tags"));
  });

  test("skips an existing asset with the expected digest", () => {
    const digest = createHash("sha256").update("release asset").digest("hex");
    const fixture = createFixture(`sha256:${digest}`);
    const result = runUpload(fixture);
    const log = readFileSync(fixture.logPath, "utf8");

    assert.strictEqual(result.status, 0);
    assert.strictEqual(result.stdout, "123\n");
    assert.ok(!log.includes("api --method POST"));
  });

  test("rejects an existing asset with a different digest", () => {
    const fixture = createFixture("sha256:unexpected");
    const result = runUpload(fixture);
    const log = readFileSync(fixture.logPath, "utf8");

    assert.strictEqual(result.status, 1);
    assert.ok(result.stderr.includes("Release asset digest mismatch: pastoralist.tgz"));
    assert.ok(!log.includes("api --method POST"));
  });

  test("rejects an existing asset without a published digest", () => {
    const fixture = createFixture(null);
    const result = runUpload(fixture);
    const log = readFileSync(fixture.logPath, "utf8");

    assert.strictEqual(result.status, 1);
    assert.ok(result.stderr.includes("Release asset digest unavailable: pastoralist.tgz"));
    assert.ok(!log.includes("api --method POST"));
  });

  test("rejects a missing release", () => {
    const fixture = createFixture(undefined, false);
    const result = runUpload(fixture);

    assert.strictEqual(result.status, 1);
    assert.ok(result.stderr.includes("Release not found: v1.2.3"));
  });
});
