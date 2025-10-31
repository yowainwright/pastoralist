import { describe, it, expect, mock, beforeEach } from "bun:test";
import { CLIInstaller } from "../../src/security/cli-installer";
import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

describe("CLIInstaller", () => {
  let installer: CLIInstaller;

  beforeEach(() => {
    installer = new CLIInstaller({ debug: false });
  });

  describe("constructor", () => {
    it("should initialize with default options", () => {
      const installer = new CLIInstaller();
      expect(installer).toBeDefined();
    });

    it("should initialize with debug option", () => {
      const installer = new CLIInstaller({ debug: true });
      expect(installer).toBeDefined();
    });
  });

  describe("isInstalled", () => {
    it("should return true for installed command", async () => {
      const result = await installer.isInstalled("node");
      expect(result).toBe(true);
    });

    it("should return false for non-existent command", async () => {
      const result = await installer.isInstalled("definitely-not-a-real-command-xyz");
      expect(result).toBe(false);
    });

    it("should return true for bun", async () => {
      const result = await installer.isInstalled("bun");
      expect(result).toBe(true);
    });

    it("should return true for npm", async () => {
      const result = await installer.isInstalled("npm");
      expect(result).toBe(true);
    });

    it("should return true for git", async () => {
      const result = await installer.isInstalled("git");
      expect(result).toBe(true);
    });
  });

  describe("isInstalledGlobally", () => {
    it("should return false for non-installed package", async () => {
      const result = await installer.isInstalledGlobally("definitely-not-a-real-package-xyz");
      expect(result).toBe(false);
    }, 30000);

    it("should handle npm list errors gracefully", async () => {
      const result = await installer.isInstalledGlobally("non-existent-package-12345");
      expect(result).toBe(false);
    }, 30000);
  });

  describe("getVersion", () => {
    it("should return version for node", async () => {
      const version = await installer.getVersion("node");
      expect(version).toBeDefined();
      expect(typeof version).toBe("string");
      expect(version!.length).toBeGreaterThan(0);
    });

    it("should return version for npm", async () => {
      const version = await installer.getVersion("npm");
      expect(version).toBeDefined();
      expect(typeof version).toBe("string");
    });

    it("should return version for bun", async () => {
      const version = await installer.getVersion("bun");
      expect(version).toBeDefined();
      expect(typeof version).toBe("string");
    });

    it("should return undefined for non-existent command", async () => {
      const version = await installer.getVersion("definitely-not-a-command-xyz");
      expect(version).toBeUndefined();
    });
  });

  describe("ensureInstalled", () => {
    it("should return true if command is already available", async () => {
      const result = await installer.ensureInstalled({
        packageName: "npm",
        cliCommand: "npm",
      });

      expect(result).toBe(true);
    });

    it("should handle non-existent package without throwing", async () => {
      const result = await installer.ensureInstalled({
        packageName: "definitely-not-a-real-package-xyz",
        cliCommand: "definitely-not-a-real-command-xyz",
      });

      expect(typeof result).toBe("boolean");
    }, 30000);
  });

  describe("installGlobally", () => {
    it("should throw error for invalid package name", async () => {
      let errorThrown = false;
      try {
        await installer.installGlobally("invalid@#$%package!@#$name");
      } catch (error) {
        errorThrown = true;
      }
      expect(errorThrown).toBe(true);
    });
  });
});
