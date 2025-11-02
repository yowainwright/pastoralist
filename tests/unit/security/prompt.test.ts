import { describe, it, expect, mock, beforeEach } from "bun:test";
import { InteractiveSecurityManager } from "../../../src/security/prompt";
import { SecurityAlert, SecurityOverride } from "../../../src/security/types";

describe("InteractiveSecurityManager", () => {
  let manager: InteractiveSecurityManager;
  let mockInquirer: any;

  beforeEach(() => {
    manager = new InteractiveSecurityManager();

    mockInquirer = {
      default: {
        prompt: mock(() => Promise.resolve({ proceed: true })),
      },
    };
  });

  describe("constructor", () => {
    it("should initialize without inquirer", () => {
      const manager = new InteractiveSecurityManager();
      expect(manager).toBeDefined();
    });
  });

  describe("promptForSecurityActions", () => {
    it("should return empty array when no vulnerable packages", async () => {
      (manager as any).inquirer = mockInquirer;

      const result = await manager.promptForSecurityActions([], []);

      expect(result).toEqual([]);
    });

    it("should return empty array when user declines to proceed", async () => {
      const mockInquirerDecline = {
        default: {
          prompt: mock(() => Promise.resolve({ proceed: false })),
        },
      };
      (manager as any).inquirer = mockInquirerDecline;

      const vulnerablePackages: SecurityAlert[] = [
        {
          packageName: "lodash",
          currentVersion: "4.17.20",
          vulnerableVersions: "< 4.17.21",
          patchedVersion: "4.17.21",
          severity: "high",
          title: "Prototype Pollution",
          fixAvailable: true,
        },
      ];

      const suggestedOverrides: SecurityOverride[] = [
        {
          packageName: "lodash",
          fromVersion: "4.17.20",
          toVersion: "4.17.21",
          reason: "Security fix",
          severity: "high",
        },
      ];

      const result = await manager.promptForSecurityActions(
        vulnerablePackages,
        suggestedOverrides
      );

      expect(result).toEqual([]);
    });

    it("should handle apply action", async () => {
      const mockInquirerApply = {
        default: {
          prompt: mock()
            .mockResolvedValueOnce({ proceed: true })
            .mockResolvedValueOnce({ action: "apply" })
            .mockResolvedValueOnce({ confirm: true }),
        },
      };
      (manager as any).inquirer = mockInquirerApply;

      const vulnerablePackages: SecurityAlert[] = [
        {
          packageName: "lodash",
          currentVersion: "4.17.20",
          vulnerableVersions: "< 4.17.21",
          patchedVersion: "4.17.21",
          severity: "high",
          title: "Prototype Pollution",
          cve: "CVE-2021-23337",
          fixAvailable: true,
        },
      ];

      const suggestedOverrides: SecurityOverride[] = [
        {
          packageName: "lodash",
          fromVersion: "4.17.20",
          toVersion: "4.17.21",
          reason: "Security fix",
          severity: "high",
        },
      ];

      const result = await manager.promptForSecurityActions(
        vulnerablePackages,
        suggestedOverrides
      );

      expect(result).toHaveLength(1);
      expect(result[0].packageName).toBe("lodash");
      expect(result[0].toVersion).toBe("4.17.21");
    });

    it("should handle skip action", async () => {
      const mockInquirerSkip = {
        default: {
          prompt: mock()
            .mockResolvedValueOnce({ proceed: true })
            .mockResolvedValueOnce({ action: "skip" })
            .mockResolvedValueOnce({ confirm: true }),
        },
      };
      (manager as any).inquirer = mockInquirerSkip;

      const vulnerablePackages: SecurityAlert[] = [
        {
          packageName: "lodash",
          currentVersion: "4.17.20",
          vulnerableVersions: "< 4.17.21",
          patchedVersion: "4.17.21",
          severity: "high",
          title: "Prototype Pollution",
          fixAvailable: true,
        },
      ];

      const suggestedOverrides: SecurityOverride[] = [
        {
          packageName: "lodash",
          fromVersion: "4.17.20",
          toVersion: "4.17.21",
          reason: "Security fix",
          severity: "high",
        },
      ];

      const result = await manager.promptForSecurityActions(
        vulnerablePackages,
        suggestedOverrides
      );

      expect(result).toEqual([]);
    });

    it("should handle custom version action", async () => {
      const mockInquirerCustom = {
        default: {
          prompt: mock()
            .mockResolvedValueOnce({ proceed: true })
            .mockResolvedValueOnce({ action: "custom" })
            .mockResolvedValueOnce({ customVersion: "4.17.22" })
            .mockResolvedValueOnce({ confirm: true }),
        },
      };
      (manager as any).inquirer = mockInquirerCustom;

      const vulnerablePackages: SecurityAlert[] = [
        {
          packageName: "lodash",
          currentVersion: "4.17.20",
          vulnerableVersions: "< 4.17.21",
          patchedVersion: "4.17.21",
          severity: "high",
          title: "Prototype Pollution",
          fixAvailable: true,
        },
      ];

      const suggestedOverrides: SecurityOverride[] = [
        {
          packageName: "lodash",
          fromVersion: "4.17.20",
          toVersion: "4.17.21",
          reason: "Security fix",
          severity: "high",
        },
      ];

      const result = await manager.promptForSecurityActions(
        vulnerablePackages,
        suggestedOverrides
      );

      expect(result).toHaveLength(1);
      expect(result[0].toVersion).toBe("4.17.22");
    });

    it("should return empty array when user declines confirmation", async () => {
      const mockInquirerNoConfirm = {
        default: {
          prompt: mock()
            .mockResolvedValueOnce({ proceed: true })
            .mockResolvedValueOnce({ action: "apply" })
            .mockResolvedValueOnce({ confirm: false }),
        },
      };
      (manager as any).inquirer = mockInquirerNoConfirm;

      const vulnerablePackages: SecurityAlert[] = [
        {
          packageName: "lodash",
          currentVersion: "4.17.20",
          vulnerableVersions: "< 4.17.21",
          patchedVersion: "4.17.21",
          severity: "high",
          title: "Prototype Pollution",
          fixAvailable: true,
        },
      ];

      const suggestedOverrides: SecurityOverride[] = [
        {
          packageName: "lodash",
          fromVersion: "4.17.20",
          toVersion: "4.17.21",
          reason: "Security fix",
          severity: "high",
        },
      ];

      const result = await manager.promptForSecurityActions(
        vulnerablePackages,
        suggestedOverrides
      );

      expect(result).toEqual([]);
    });

    it("should handle multiple vulnerabilities", async () => {
      const mockInquirerMultiple = {
        default: {
          prompt: mock()
            .mockResolvedValueOnce({ proceed: true })
            .mockResolvedValueOnce({ action: "apply" })
            .mockResolvedValueOnce({ action: "skip" })
            .mockResolvedValueOnce({ confirm: true }),
        },
      };
      (manager as any).inquirer = mockInquirerMultiple;

      const vulnerablePackages: SecurityAlert[] = [
        {
          packageName: "lodash",
          currentVersion: "4.17.20",
          vulnerableVersions: "< 4.17.21",
          patchedVersion: "4.17.21",
          severity: "high",
          title: "Prototype Pollution",
          fixAvailable: true,
        },
        {
          packageName: "minimist",
          currentVersion: "1.2.5",
          vulnerableVersions: "< 1.2.6",
          patchedVersion: "1.2.6",
          severity: "medium",
          title: "Prototype Pollution",
          fixAvailable: true,
        },
      ];

      const suggestedOverrides: SecurityOverride[] = [
        {
          packageName: "lodash",
          fromVersion: "4.17.20",
          toVersion: "4.17.21",
          reason: "Security fix",
          severity: "high",
        },
        {
          packageName: "minimist",
          fromVersion: "1.2.5",
          toVersion: "1.2.6",
          reason: "Security fix",
          severity: "medium",
        },
      ];

      const result = await manager.promptForSecurityActions(
        vulnerablePackages,
        suggestedOverrides
      );

      expect(result).toHaveLength(1);
      expect(result[0].packageName).toBe("lodash");
    });

    it("should skip override if no matching vulnerability found", async () => {
      const mockInquirerMismatch = {
        default: {
          prompt: mock()
            .mockResolvedValueOnce({ proceed: true })
            .mockResolvedValueOnce({ confirm: true }),
        },
      };
      (manager as any).inquirer = mockInquirerMismatch;

      const vulnerablePackages: SecurityAlert[] = [
        {
          packageName: "lodash",
          currentVersion: "4.17.20",
          vulnerableVersions: "< 4.17.21",
          patchedVersion: "4.17.21",
          severity: "high",
          title: "Prototype Pollution",
          fixAvailable: true,
        },
      ];

      const suggestedOverrides: SecurityOverride[] = [
        {
          packageName: "different-package",
          fromVersion: "1.0.0",
          toVersion: "1.0.1",
          reason: "Security fix",
          severity: "high",
        },
      ];

      const result = await manager.promptForSecurityActions(
        vulnerablePackages,
        suggestedOverrides
      );

      expect(result).toEqual([]);
    });
  });

  describe("generateSummary", () => {
    it("should generate summary for critical vulnerabilities", () => {
      const vulnerablePackages: SecurityAlert[] = [
        {
          packageName: "lodash",
          currentVersion: "4.17.20",
          vulnerableVersions: "< 4.17.21",
          patchedVersion: "4.17.21",
          severity: "critical",
          title: "Critical Issue",
          fixAvailable: true,
        },
      ];

      const summary = (manager as any).generateSummary(vulnerablePackages);

      expect(summary).toContain("Found 1 vulnerable package");
      expect(summary).toContain("Critical: 1");
    });

    it("should generate summary for high vulnerabilities", () => {
      const vulnerablePackages: SecurityAlert[] = [
        {
          packageName: "lodash",
          currentVersion: "4.17.20",
          vulnerableVersions: "< 4.17.21",
          patchedVersion: "4.17.21",
          severity: "high",
          title: "High Issue",
          fixAvailable: true,
        },
      ];

      const summary = (manager as any).generateSummary(vulnerablePackages);

      expect(summary).toContain("Found 1 vulnerable package");
      expect(summary).toContain("High: 1");
    });

    it("should generate summary for medium vulnerabilities", () => {
      const vulnerablePackages: SecurityAlert[] = [
        {
          packageName: "minimist",
          currentVersion: "1.2.5",
          vulnerableVersions: "< 1.2.6",
          patchedVersion: "1.2.6",
          severity: "medium",
          title: "Medium Issue",
          fixAvailable: true,
        },
      ];

      const summary = (manager as any).generateSummary(vulnerablePackages);

      expect(summary).toContain("Found 1 vulnerable package");
      expect(summary).toContain("Medium: 1");
    });

    it("should generate summary for low vulnerabilities", () => {
      const vulnerablePackages: SecurityAlert[] = [
        {
          packageName: "some-package",
          currentVersion: "1.0.0",
          vulnerableVersions: "< 1.0.1",
          patchedVersion: "1.0.1",
          severity: "low",
          title: "Low Issue",
          fixAvailable: true,
        },
      ];

      const summary = (manager as any).generateSummary(vulnerablePackages);

      expect(summary).toContain("Found 1 vulnerable package");
      expect(summary).toContain("Low: 1");
    });

    it("should generate summary for mixed severities", () => {
      const vulnerablePackages: SecurityAlert[] = [
        {
          packageName: "pkg1",
          currentVersion: "1.0.0",
          vulnerableVersions: "< 2.0.0",
          patchedVersion: "2.0.0",
          severity: "critical",
          title: "Critical",
          fixAvailable: true,
        },
        {
          packageName: "pkg2",
          currentVersion: "1.0.0",
          vulnerableVersions: "< 2.0.0",
          patchedVersion: "2.0.0",
          severity: "high",
          title: "High",
          fixAvailable: true,
        },
        {
          packageName: "pkg3",
          currentVersion: "1.0.0",
          vulnerableVersions: "< 2.0.0",
          patchedVersion: "2.0.0",
          severity: "medium",
          title: "Medium",
          fixAvailable: true,
        },
        {
          packageName: "pkg4",
          currentVersion: "1.0.0",
          vulnerableVersions: "< 2.0.0",
          patchedVersion: "2.0.0",
          severity: "low",
          title: "Low",
          fixAvailable: true,
        },
      ];

      const summary = (manager as any).generateSummary(vulnerablePackages);

      expect(summary).toContain("Found 4 vulnerable package");
      expect(summary).toContain("Critical: 1");
      expect(summary).toContain("High: 1");
      expect(summary).toContain("Medium: 1");
      expect(summary).toContain("Low: 1");
    });
  });

  describe("getSeverityEmoji", () => {
    it("should return correct emoji for critical severity", () => {
      const emoji = (manager as any).getSeverityEmoji("critical");
      expect(emoji).toBe("🚨");
    });

    it("should return correct emoji for high severity", () => {
      const emoji = (manager as any).getSeverityEmoji("high");
      expect(emoji).toBe("🔥");
    });

    it("should return correct emoji for medium severity", () => {
      const emoji = (manager as any).getSeverityEmoji("medium");
      expect(emoji).toBe("⚠️");
    });

    it("should return correct emoji for low severity", () => {
      const emoji = (manager as any).getSeverityEmoji("low");
      expect(emoji).toBe("ℹ️");
    });

    it("should return default emoji for unknown severity", () => {
      const emoji = (manager as any).getSeverityEmoji("unknown");
      expect(emoji).toBe("⚠️");
    });

    it("should handle case-insensitive severity levels", () => {
      expect((manager as any).getSeverityEmoji("CRITICAL")).toBe("🚨");
      expect((manager as any).getSeverityEmoji("High")).toBe("🔥");
      expect((manager as any).getSeverityEmoji("MEDIUM")).toBe("⚠️");
      expect((manager as any).getSeverityEmoji("Low")).toBe("ℹ️");
    });
  });

  describe("loadInquirer", () => {
    it("should lazy load inquirer", async () => {
      const manager = new InteractiveSecurityManager();
      expect((manager as any).inquirer).toBeNull();

      (manager as any).inquirer = mockInquirer;

      const inquirer = await (manager as any).loadInquirer();
      expect(inquirer).toBeDefined();
    });

    it("should reuse loaded inquirer", async () => {
      const manager = new InteractiveSecurityManager();
      (manager as any).inquirer = mockInquirer;

      const inquirer1 = await (manager as any).loadInquirer();
      const inquirer2 = await (manager as any).loadInquirer();

      expect(inquirer1).toBe(inquirer2);
    });
  });
});
