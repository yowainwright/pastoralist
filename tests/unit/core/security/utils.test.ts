import { test, expect } from "bun:test";
import {
  CLIInstaller,
  getSeverityScore,
  deduplicateAlerts,
  extractPackages,
  isVersionVulnerable,
  findVulnerablePackages,
  InteractiveSecurityManager,
} from "../../../../src/core/security/utils";
import type { SecurityAlert } from "../../../../src/core/security/types";
import type { PastoralistJSON } from "../../../../src/types";

test("constructor - should initialize with default options", () => {
  const installer = new CLIInstaller();
  expect(installer).toBeDefined();
});

test("constructor - should initialize with debug option", () => {
  const installer = new CLIInstaller({ debug: true });
  expect(installer).toBeDefined();
});

test("isInstalled - should return true for installed command", async () => {
  const installer = new CLIInstaller({ debug: false });
  const result = await installer.isInstalled("node");
  expect(result).toBe(true);
});

test("isInstalled - should return false for non-existent command", async () => {
  const installer = new CLIInstaller({ debug: false });
  const result = await installer.isInstalled(
    "definitely-not-a-real-command-xyz",
  );
  expect(result).toBe(false);
});

test("isInstalled - should return true for bun", async () => {
  const installer = new CLIInstaller({ debug: false });
  const result = await installer.isInstalled("bun");
  expect(result).toBe(true);
});

test("isInstalled - should return true for npm", async () => {
  const installer = new CLIInstaller({ debug: false });
  const result = await installer.isInstalled("npm");
  expect(result).toBe(true);
});

test("isInstalled - should return true for git", async () => {
  const installer = new CLIInstaller({ debug: false });
  const result = await installer.isInstalled("git");
  expect(result).toBe(true);
});

test("isInstalledGlobally - should return false for non-installed package", async () => {
  const installer = new CLIInstaller({ debug: false });
  const result = await installer.isInstalledGlobally(
    "definitely-not-a-real-package-xyz",
  );
  expect(result).toBe(false);
}, 30000);

test("isInstalledGlobally - should handle npm list errors gracefully", async () => {
  const installer = new CLIInstaller({ debug: false });
  const result = await installer.isInstalledGlobally(
    "non-existent-package-12345",
  );
  expect(result).toBe(false);
}, 30000);

test("getVersion - should return version for node", async () => {
  const installer = new CLIInstaller({ debug: false });
  const version = await installer.getVersion("node");
  expect(version).toBeDefined();
  expect(typeof version).toBe("string");
  expect(version!.length).toBeGreaterThan(0);
});

test("getVersion - should return version for npm", async () => {
  const installer = new CLIInstaller({ debug: false });
  const version = await installer.getVersion("npm");
  expect(version).toBeDefined();
  expect(typeof version).toBe("string");
});

test("getVersion - should return version for bun", async () => {
  const installer = new CLIInstaller({ debug: false });
  const version = await installer.getVersion("bun");
  expect(version).toBeDefined();
  expect(typeof version).toBe("string");
});

test("getVersion - should return undefined for non-existent command", async () => {
  const installer = new CLIInstaller({ debug: false });
  const version = await installer.getVersion("definitely-not-a-command-xyz");
  expect(version).toBeUndefined();
});

test("ensureInstalled - should return true if command is already available", async () => {
  const installer = new CLIInstaller({ debug: false });
  const result = await installer.ensureInstalled({
    packageName: "npm",
    cliCommand: "npm",
  });

  expect(result).toBe(true);
});

test("ensureInstalled - should handle non-existent package without throwing", async () => {
  const installer = new CLIInstaller({ debug: false });
  const result = await installer.ensureInstalled({
    packageName: "definitely-not-a-real-package-xyz",
    cliCommand: "definitely-not-a-real-command-xyz",
  });

  expect(typeof result).toBe("boolean");
}, 30000);

test("installGlobally - should throw error for invalid package name", async () => {
  const installer = new CLIInstaller({ debug: false });
  let errorThrown = false;
  try {
    await installer.installGlobally("invalid@#$%package!@#$name");
  } catch (error) {
    errorThrown = true;
  }
  expect(errorThrown).toBe(true);
});
