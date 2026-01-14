import { test, expect } from "bun:test";
import { OSVProvider } from "../../../../src/core/security/providers/osv";
import { TEST_FIXTURES } from "../../../../src/constants";

const mockFetchBatchAPI = () => Promise.resolve([{ vulns: [] }]);

test("Test Fixtures - OSVProvider appends ALERT_TO_RESOLVE when isIRLFix is true", async () => {
  const provider = new OSVProvider({
    debug: false,
    isIRLFix: true,
    isIRLCatch: false,
  });
  (provider as any).fetchFromOSVBatchAPI = mockFetchBatchAPI;

  const packages = [{ name: "express", version: "4.18.0" }];
  const alerts = await provider.fetchAlerts(packages);

  const hasFixtureAlert = alerts.some(
    (alert) =>
      alert.packageName === TEST_FIXTURES.ALERT_TO_RESOLVE.packageName &&
      alert.cve === TEST_FIXTURES.ALERT_TO_RESOLVE.cve,
  );

  expect(hasFixtureAlert).toBe(true);
});

test("Test Fixtures - OSVProvider appends ALERT_TO_CAPTURE when isIRLCatch is true", async () => {
  const provider = new OSVProvider({
    debug: false,
    isIRLFix: false,
    isIRLCatch: true,
  });
  (provider as any).fetchFromOSVBatchAPI = mockFetchBatchAPI;

  const packages = [{ name: "express", version: "4.18.0" }];
  const alerts = await provider.fetchAlerts(packages);

  const hasCaptureAlert = alerts.some(
    (alert) =>
      alert.packageName === TEST_FIXTURES.ALERT_TO_CAPTURE.packageName &&
      alert.cve === TEST_FIXTURES.ALERT_TO_CAPTURE.cve &&
      alert.fixAvailable === false,
  );

  expect(hasCaptureAlert).toBe(true);
});

test("Test Fixtures - OSVProvider appends both fixtures when both flags are true", async () => {
  const provider = new OSVProvider({
    debug: false,
    isIRLFix: true,
    isIRLCatch: true,
  });
  (provider as any).fetchFromOSVBatchAPI = mockFetchBatchAPI;

  const packages = [{ name: "express", version: "4.18.0" }];
  const alerts = await provider.fetchAlerts(packages);

  const hasFixAlert = alerts.some(
    (alert) => alert.packageName === TEST_FIXTURES.ALERT_TO_RESOLVE.packageName,
  );

  const hasCaptureAlert = alerts.some(
    (alert) => alert.packageName === TEST_FIXTURES.ALERT_TO_CAPTURE.packageName,
  );

  expect(hasFixAlert).toBe(true);
  expect(hasCaptureAlert).toBe(true);
});

test("Test Fixtures - OSVProvider does not append fixtures when flags are false", async () => {
  const provider = new OSVProvider({
    debug: false,
    isIRLFix: false,
    isIRLCatch: false,
  });
  (provider as any).fetchFromOSVBatchAPI = mockFetchBatchAPI;

  const packages = [{ name: "express", version: "4.18.0" }];
  const alerts = await provider.fetchAlerts(packages);

  const hasAnyFixture = alerts.some(
    (alert) =>
      alert.packageName === TEST_FIXTURES.ALERT_TO_RESOLVE.packageName ||
      alert.packageName === TEST_FIXTURES.ALERT_TO_CAPTURE.packageName,
  );

  expect(hasAnyFixture).toBe(false);
});

test("Test Fixtures - ALERT_TO_RESOLVE has correct properties", () => {
  const fixture = TEST_FIXTURES.ALERT_TO_RESOLVE;

  expect(fixture.packageName).toBe("fake-pastoralist-check-2");
  expect(fixture.currentVersion).toBe("1.0.0");
  expect(fixture.patchedVersion).toBe("2.1.0");
  expect(fixture.severity).toBe("critical");
  expect(fixture.fixAvailable).toBe(true);
  expect(fixture.cve).toBe("CVE-FAKE-PASTORALIST-2024-0001");
});

test("Test Fixtures - ALERT_TO_CAPTURE has correct properties", () => {
  const fixture = TEST_FIXTURES.ALERT_TO_CAPTURE;

  expect(fixture.packageName).toBe("fake-pastoralist-check-4");
  expect(fixture.currentVersion).toBe("0.5.0");
  expect(fixture.patchedVersion).toBeUndefined();
  expect(fixture.severity).toBe("high");
  expect(fixture.fixAvailable).toBe(false);
  expect(fixture.cve).toBe("CVE-FAKE-PASTORALIST-2024-0002");
});

test("Test Fixtures - OVERRIDE_TO_KEEP has dependents", () => {
  const fixture = TEST_FIXTURES.OVERRIDE_TO_KEEP;

  expect(fixture.packageName).toBe("fake-pastoralist-check-2");
  expect(fixture.toVersion).toBe("2.1.0");
  expect(fixture.dependents).toBeDefined();
  expect(Object.keys(fixture.dependents)).toHaveLength(1);
  expect(fixture.dependents["fake-pastoralist-check-1"]).toBe("1.0.0");
  expect(fixture.ledger.securityChecked).toBe(true);
});

test("Test Fixtures - OVERRIDE_TO_REMOVE has no dependents", () => {
  const fixture = TEST_FIXTURES.OVERRIDE_TO_REMOVE;

  expect(fixture.packageName).toBe("fake-pastoralist-check-3");
  expect(fixture.toVersion).toBe("1.0.0");
  expect(fixture.dependents).toBeDefined();
  expect(Object.keys(fixture.dependents)).toHaveLength(0);
  expect(fixture.ledger.securityChecked).toBeUndefined();
});

test("Test Fixtures - OSVProvider uses concat for immutable array operations", async () => {
  const provider = new OSVProvider({
    debug: false,
    isIRLFix: true,
    isIRLCatch: false,
  });
  (provider as any).fetchFromOSVBatchAPI = mockFetchBatchAPI;

  const packages = [{ name: "test-package", version: "1.0.0" }];
  const alerts = await provider.fetchAlerts(packages);

  const hasFixture = alerts.some(
    (alert) => alert.packageName === TEST_FIXTURES.ALERT_TO_RESOLVE.packageName,
  );

  expect(hasFixture).toBe(true);
  expect(alerts.length).toBeGreaterThanOrEqual(1);
});
