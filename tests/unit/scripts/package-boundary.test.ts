import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const readRepositoryFile = (path: string): string =>
  readFileSync(new URL(`../../../${path}`, import.meta.url), "utf8");

const readPackage = (path: string): Record<string, unknown> => JSON.parse(readRepositoryFile(path));

describe("package security boundary", () => {
  test("keeps the docs app outside the published package", () => {
    const rootPackage = readPackage("package.json");
    const docsPackage = readPackage("app/package.json");

    assert.strictEqual(rootPackage.workspaces, undefined);
    assert.strictEqual(docsPackage.private, true);
  });

  test("keeps the root and docs pnpm lockfiles separate", () => {
    const rootLock = readRepositoryFile("pnpm-lock.yaml");
    const docsLock = readRepositoryFile("app/pnpm-lock.yaml");

    assert.ok(!rootLock.includes("'@base-ui/react':"));
    assert.ok(docsLock.includes("'@base-ui/react':"));
  });

  test("excludes the docs app from Socket project scans", () => {
    const socketConfig = readRepositoryFile("socket.yml");

    assert.ok(socketConfig.includes('- "app/**"'));
  });

  test("installs workspace dependencies from root setup", () => {
    const rootPackage = readPackage("package.json");
    const scripts = rootPackage.scripts as Record<string, string>;
    const setupScript = readRepositoryFile("scripts/setup/setup.sh");

    assert.strictEqual(rootPackage.packageManager, "pnpm@11.18.0");
    assert.strictEqual(scripts.setup, "sh scripts/setup/setup.sh bootstrap");
    assert.ok(setupScript.includes("pnpm install"));
    assert.ok(setupScript.includes("pnpm --dir app install"));
  });

  test("keeps root tests outside the docs package", () => {
    const rootPackage = readPackage("package.json");
    const scripts = rootPackage.scripts as Record<string, string>;

    assert.ok(scripts["test:unit"].includes("tests/unit"));
  });

  test("keeps package script composition explicit", () => {
    const rootPackage = readPackage("package.json");
    const docsPackage = readPackage("app/package.json");
    const rootScripts = rootPackage.scripts as Record<string, string>;
    const docsScripts = docsPackage.scripts as Record<string, string>;

    assert.ok(rootScripts["build-dist"].startsWith("jiti scripts/build"));
    assert.ok(rootScripts["check:test-manifests"].includes("tests/integration"));
    assert.ok(docsScripts.build.startsWith("pnpm run"));
    assert.ok(docsScripts["generate:llms"].startsWith("jiti "));
  });
});
