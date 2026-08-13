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

  test("keeps the root and docs pnpm lockfiles separate", () => {
    const rootLock = readRepositoryFile("pnpm-lock.yaml");
    const docsLock = readRepositoryFile("app/pnpm-lock.yaml");

    expect(rootLock).not.toContain("'@base-ui/react':");
    expect(docsLock).toContain("'@base-ui/react':");
  });

  test("excludes the docs app from Socket project scans", () => {
    const socketConfig = readRepositoryFile("socket.yml");

    expect(socketConfig).toContain('- "app/**"');
  });

  test("installs workspace dependencies from root setup", () => {
    const rootPackage = readPackage("package.json");
    const scripts = rootPackage.scripts as Record<string, string>;
    const setupScript = readRepositoryFile("scripts/setup.sh");

    expect(rootPackage.packageManager).toBe("pnpm@11.18.0");
    expect(scripts.setup).toBe("sh scripts/setup.sh");
    expect(setupScript).toContain("pnpm install");
    expect(setupScript).toContain("pnpm --dir app install");
  });

  test("keeps root tests outside the docs package", () => {
    const rootPackage = readPackage("package.json");
    const scripts = rootPackage.scripts as Record<string, string>;

    expect(scripts["test:unit"]).toBe("bun test ./tests/unit");
  });

  test("uses pnpm for package script composition", () => {
    const rootPackage = readPackage("package.json");
    const docsPackage = readPackage("app/package.json");
    const rootScripts = rootPackage.scripts as Record<string, string>;
    const docsScripts = docsPackage.scripts as Record<string, string>;

    expect(rootScripts["build-dist"]).toStartWith("pnpm run");
    expect(docsScripts.build).toStartWith("pnpm run");
    expect(docsScripts["generate:llms"]).toStartWith("bun ");
  });
});
