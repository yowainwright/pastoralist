process.env.DEBUG = "true";

import assert from "assert";
import { compareVersions } from "../../src/utils/semver";

function describe(description: string, fn: () => void): void {
  console.log(`\n${description}`);
  fn();
}

function it(testDescription: string, fn: () => void): void {
  try {
    fn();
    console.log(`\t✅ ${testDescription}`);
  } catch (error) {
    console.error(`\t❌ ${testDescription}`);
    console.error(error);
  }
}

describe("compareVersions", () => {
  it("should return 0 for equal versions", () => {
    assert.strictEqual(compareVersions("1.0.0", "1.0.0"), 0);
    assert.strictEqual(compareVersions("2.5.3", "2.5.3"), 0);
    assert.strictEqual(compareVersions("10.20.30", "10.20.30"), 0);
  });

  it("should return positive when v1 > v2", () => {
    assert.ok(compareVersions("2.0.0", "1.0.0") > 0);
    assert.ok(compareVersions("1.1.0", "1.0.0") > 0);
    assert.ok(compareVersions("1.0.1", "1.0.0") > 0);
    assert.ok(compareVersions("10.0.0", "9.99.99") > 0);
  });

  it("should return negative when v1 < v2", () => {
    assert.ok(compareVersions("1.0.0", "2.0.0") < 0);
    assert.ok(compareVersions("1.0.0", "1.1.0") < 0);
    assert.ok(compareVersions("1.0.0", "1.0.1") < 0);
    assert.ok(compareVersions("9.99.99", "10.0.0") < 0);
  });

  it("should handle different length versions", () => {
    assert.strictEqual(compareVersions("1.0", "1.0.0"), 0);
    assert.strictEqual(compareVersions("1", "1.0"), 0);
    assert.strictEqual(compareVersions("1", "1.0.0"), 0);
    assert.ok(compareVersions("1.0", "1.0.1") < 0);
    assert.ok(compareVersions("1.0.1", "1.0") > 0);
  });

  it("should handle multi-digit version numbers", () => {
    assert.ok(compareVersions("1.10.0", "1.9.0") > 0);
    assert.ok(compareVersions("1.100.0", "1.99.0") > 0);
    assert.ok(compareVersions("10.0.0", "9.0.0") > 0);
  });

  it("should compare major versions first", () => {
    assert.ok(compareVersions("2.0.0", "1.99.99") > 0);
    assert.ok(compareVersions("1.99.99", "2.0.0") < 0);
  });

  it("should compare minor versions when major is equal", () => {
    assert.ok(compareVersions("1.2.0", "1.1.99") > 0);
    assert.ok(compareVersions("1.1.99", "1.2.0") < 0);
  });

  it("should compare patch versions when major and minor are equal", () => {
    assert.ok(compareVersions("1.1.2", "1.1.1") > 0);
    assert.ok(compareVersions("1.1.1", "1.1.2") < 0);
  });

  it("should handle real-world lodash versions for security checks", () => {
    assert.ok(compareVersions("4.17.21", "4.17.0") > 0);
    assert.ok(compareVersions("4.17.21", "4.17.20") > 0);
    assert.strictEqual(compareVersions("4.17.21", "4.17.21"), 0);
    assert.ok(compareVersions("4.17.21", "4.18.0") < 0);
    assert.ok(compareVersions("4.17.21", "5.0.0") < 0);
  });

  it("should support security vulnerability range checking", () => {
    const currentVersion = "4.17.0";
    const fixedVersion = "4.17.21";

    assert.ok(compareVersions(currentVersion, fixedVersion) < 0);
    assert.ok(compareVersions(fixedVersion, currentVersion) > 0);
  });
});
