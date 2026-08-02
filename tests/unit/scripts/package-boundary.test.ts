import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";

const readRepositoryFile = (path: string): string =>
  readFileSync(new URL(`../../../${path}`, import.meta.url), "utf8");

const readPackage = (path: string): Record<string, unknown> => JSON.parse(readRepositoryFile(path));

describe("package security boundary", () => {
  test("keeps the docs app outside the published package", () => {
    const rootPackage = readPackage("package.json");
    const docsPackage = readPackage("app/package.json");

    expect(rootPackage.workspaces).toBeUndefined();
    expect(docsPackage.private).toBe(true);
  });

  test("keeps the root and docs lockfiles separate", () => {
    const rootLock = readRepositoryFile("bun.lock");
    const docsLock = readRepositoryFile("app/bun.lock");

    expect(rootLock).not.toContain('"pastoralist-docs"');
    expect(docsLock).toContain('"pastoralist-docs"');
  });

  test("excludes the docs app from Socket project scans", () => {
    const socketConfig = readRepositoryFile("socket.yml");

    expect(socketConfig).toContain('- "app/**"');
  });

  test("installs docs dependencies from root setup", () => {
    const rootPackage = readPackage("package.json");
    const scripts = rootPackage.scripts as Record<string, string>;

    expect(scripts.presetup).toContain("bun install --cwd app");
  });

  test("keeps root tests outside the docs package", () => {
    const rootPackage = readPackage("package.json");
    const scripts = rootPackage.scripts as Record<string, string>;

    expect(scripts["test:unit"]).toBe("bun test ./tests/unit");
  });
});
