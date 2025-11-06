import { test, expect } from "bun:test";
import { SocketCLIProvider } from "../../../../../src/core/security/providers/socket";

test("SocketCLIProvider - constructor initializes with token from options", () => {
  const provider = new SocketCLIProvider({ token: "test-token", debug: false });
  expect(provider).toBeDefined();
});

test("SocketCLIProvider - constructor initializes with token from env", () => {
  const originalToken = process.env.SOCKET_SECURITY_API_KEY;
  process.env.SOCKET_SECURITY_API_KEY = "env-token";

  const provider = new SocketCLIProvider({ debug: false });
  expect(provider).toBeDefined();

  if (originalToken) {
    process.env.SOCKET_SECURITY_API_KEY = originalToken;
  } else {
    delete process.env.SOCKET_SECURITY_API_KEY;
  }
});

test("SocketCLIProvider - isAuthenticated returns true with token", async () => {
  const provider = new SocketCLIProvider({ token: "test-token", debug: false });
  const result = await provider.isAuthenticated();
  expect(result).toBe(true);
});

test("SocketCLIProvider - isAuthenticated returns false without token", async () => {
  const originalToken = process.env.SOCKET_SECURITY_API_KEY;
  delete process.env.SOCKET_SECURITY_API_KEY;

  const provider = new SocketCLIProvider({ debug: false });
  const result = await provider.isAuthenticated();
  expect(result).toBe(false);

  if (originalToken) {
    process.env.SOCKET_SECURITY_API_KEY = originalToken;
  }
});

test("SocketCLIProvider - convertSocketAlerts handles missing packages", () => {
  const provider = new SocketCLIProvider({ debug: false });
  const result = provider['convertSocketAlerts']({} as any);
  expect(result).toEqual([]);
});

test("SocketCLIProvider - convertSocketAlerts filters packages without issues", () => {
  const provider = new SocketCLIProvider({ debug: false });
  const socketResult = {
    packages: [
      { name: "pkg1", version: "1.0.0" },
      { name: "pkg2", version: "2.0.0", issues: [] }
    ]
  };
  const result = provider['convertSocketAlerts'](socketResult as any);
  expect(result).toEqual([]);
});

test("SocketCLIProvider - convertSocketAlerts processes packages with issues", () => {
  const provider = new SocketCLIProvider({ debug: false });
  const socketResult = {
    packages: [
      {
        name: "lodash",
        version: "4.17.20",
        issues: [
          {
            type: "vulnerability",
            severity: "high",
            title: "Prototype Pollution",
            description: "Test vulnerability",
            cve: "CVE-2021-23337",
            url: "https://socket.dev/vuln/CVE-2021-23337"
          }
        ]
      }
    ]
  };

  const result = provider['convertSocketAlerts'](socketResult as any);

  expect(result.length).toBe(1);
  expect(result[0].packageName).toBe("lodash");
  expect(result[0].severity).toBe("high");
});

test("SocketCLIProvider - convertIssueToAlert handles vulnerability type", () => {
  const provider = new SocketCLIProvider({ debug: false });

  const pkg = { name: "test-pkg", version: "1.0.0" };
  const issue = {
    type: "vulnerability",
    severity: "critical",
    title: "Security Issue",
    description: "Test description",
    cve: "CVE-2024-1234",
    url: "https://socket.dev/test"
  };

  const alert = provider['convertIssueToAlert'](pkg as any, issue as any);

  expect(alert.packageName).toBe("test-pkg");
  expect(alert.currentVersion).toBe("1.0.0");
  expect(alert.vulnerableVersions).toBe("<= 1.0.0");
  expect(alert.severity).toBe("critical");
  expect(alert.title).toBe("Security Issue");
  expect(alert.cve).toBe("CVE-2024-1234");
  expect(alert.fixAvailable).toBe(false);
});

test("SocketCLIProvider - convertIssueToAlert handles non-vulnerability type", () => {
  const provider = new SocketCLIProvider({ debug: false });

  const pkg = { name: "test-pkg", version: "1.0.0" };
  const issue = {
    type: "security-risk",
    severity: "medium",
    title: "Risk Issue",
    description: "Test description"
  };

  const alert = provider['convertIssueToAlert'](pkg as any, issue as any);

  expect(alert.vulnerableVersions).toBe("");
  expect(alert.cve).toBeUndefined();
  expect(alert.severity).toBe("medium");
});

test("SocketCLIProvider - convertIssueToAlert uses type as title when title missing", () => {
  const provider = new SocketCLIProvider({ debug: false });

  const pkg = { name: "test-pkg", version: "1.0.0" };
  const issue = {
    type: "typosquat",
    severity: "low",
    description: "Test description"
  };

  const alert = provider['convertIssueToAlert'](pkg as any, issue as any);

  expect(alert.title).toBe("typosquat");
});

test("SocketCLIProvider - convertIssueToAlert generates default url when missing", () => {
  const provider = new SocketCLIProvider({ debug: false });

  const pkg = { name: "test-pkg", version: "1.0.0" };
  const issue = {
    type: "vulnerability",
    severity: "high",
    title: "Test",
    description: "Test"
  };

  const alert = provider['convertIssueToAlert'](pkg as any, issue as any);

  expect(alert.url).toContain("socket.dev");
  expect(alert.url).toContain("test-pkg");
  expect(alert.url).toContain("1.0.0");
});

test("SocketCLIProvider - mapSocketSeverity handles all standard severities", () => {
  const provider = new SocketCLIProvider({ debug: false });

  expect(provider['mapSocketSeverity']("critical")).toBe("critical");
  expect(provider['mapSocketSeverity']("high")).toBe("high");
  expect(provider['mapSocketSeverity']("medium")).toBe("medium");
  expect(provider['mapSocketSeverity']("low")).toBe("low");
});

test("SocketCLIProvider - mapSocketSeverity handles socket-specific severities", () => {
  const provider = new SocketCLIProvider({ debug: false });

  expect(provider['mapSocketSeverity']("moderate")).toBe("medium");
  expect(provider['mapSocketSeverity']("info")).toBe("low");
});

test("SocketCLIProvider - mapSocketSeverity handles uppercase", () => {
  const provider = new SocketCLIProvider({ debug: false });

  expect(provider['mapSocketSeverity']("CRITICAL")).toBe("critical");
  expect(provider['mapSocketSeverity']("HIGH")).toBe("high");
  expect(provider['mapSocketSeverity']("MODERATE")).toBe("medium");
});

test("SocketCLIProvider - mapSocketSeverity handles unknown severity", () => {
  const provider = new SocketCLIProvider({ debug: false });

  expect(provider['mapSocketSeverity']("unknown")).toBe("medium");
  expect(provider['mapSocketSeverity']("")).toBe("medium");
});

test("SocketCLIProvider - convertSocketAlerts handles multiple packages with multiple issues", () => {
  const provider = new SocketCLIProvider({ debug: false });

  const socketResult = {
    packages: [
      {
        name: "pkg1",
        version: "1.0.0",
        issues: [
          {
            type: "vulnerability",
            severity: "high",
            title: "Issue 1",
            description: "Desc 1"
          },
          {
            type: "security-risk",
            severity: "medium",
            title: "Issue 2",
            description: "Desc 2"
          }
        ]
      },
      {
        name: "pkg2",
        version: "2.0.0",
        issues: [
          {
            type: "vulnerability",
            severity: "critical",
            title: "Issue 3",
            description: "Desc 3"
          }
        ]
      }
    ]
  };

  const result = provider['convertSocketAlerts'](socketResult as any);

  expect(result.length).toBe(3);
  expect(result[0].packageName).toBe("pkg1");
  expect(result[1].packageName).toBe("pkg1");
  expect(result[2].packageName).toBe("pkg2");
});
