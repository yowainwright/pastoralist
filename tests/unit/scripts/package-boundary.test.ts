import { assertExcludesText, assertContainsText } from "./utils";
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const readRepositoryFile = (path: string): string =>
  readFileSync(new URL(`../../../${path}`, import.meta.url), "utf8");

const readPackage = (path: string): Record<string, unknown> => JSON.parse(readRepositoryFile(path));

const cases = [
  {
    name: "keeps the docs app outside the published package",
    run: () => {
      const rootPackage = readPackage("package.json");
      const docsPackage = readPackage("app/package.json");

      assert.strictEqual(rootPackage.workspaces, undefined);
      assert.strictEqual(docsPackage.private, true);
    },
  },
  {
    name: "keeps the root and docs pnpm lockfiles separate",
    run: () => {
      const rootLock = readRepositoryFile("pnpm-lock.yaml");
      const docsLock = readRepositoryFile("app/pnpm-lock.yaml");

      assertExcludesText(rootLock, "'@base-ui/react':");
      assertContainsText(docsLock, "'@base-ui/react':");
    },
  },
  {
    name: "excludes the docs app from Socket project scans",
    run: () => {
      const socketConfig = readRepositoryFile("socket.yml");

      assertContainsText(socketConfig, '- "app/**"');
    },
  },
  {
    name: "installs workspace dependencies from root setup",
    run: () => {
      const rootPackage = readPackage("package.json");
      const scripts = rootPackage.scripts as Record<string, string>;
      const setupScript = readRepositoryFile("scripts/setup/setup.sh");

      assert.strictEqual(rootPackage.packageManager, "pnpm@12.5.1");
      assert.strictEqual(scripts.setup, "sh scripts/setup/setup.sh bootstrap");
      assertContainsText(setupScript, "pnpm install");
      assertContainsText(setupScript, "pnpm --dir app install");
    },
  },
  {
    name: "keeps setup helpers out of package bin aliases",
    run: () => {
      const rootPackage = readPackage("package.json");
      const bin = rootPackage.bin as Record<string, string>;

      assert.deepStrictEqual(bin, { pastoralist: "./dist/index.js" });
    },
  },
  {
    name: "keeps root tests outside the docs package",
    run: () => {
      const rootPackage = readPackage("package.json");
      const scripts = rootPackage.scripts as Record<string, string>;

      assertContainsText(scripts["test:unit"], "tests/unit");
    },
  },
  {
    name: "keeps package script composition explicit",
    run: () => {
      const rootPackage = readPackage("package.json");
      const docsPackage = readPackage("app/package.json");
      const rootScripts = rootPackage.scripts as Record<string, string>;
      const docsScripts = docsPackage.scripts as Record<string, string>;

      assert.ok(rootScripts["build-dist"].startsWith("jiti scripts/build"));
      assertContainsText(rootScripts["check:test-manifests"], "tests/integration");
      assert.ok(docsScripts.build.startsWith("pnpm run"));
      assert.ok(docsScripts["generate:llms"].startsWith("jiti "));
    },
  },
];

describe("package security boundary", () => {
  cases.forEach(({ name, run }) => test(name, run));
});
