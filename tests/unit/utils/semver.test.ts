import { test, expect } from "bun:test";
import { compareVersions } from "../../../src/utils/semver";

test("compareVersions - should return 0 for equal versions", () => {
  expect(compareVersions("1.0.0", "1.0.0")).toBe(0);
  expect(compareVersions("2.5.3", "2.5.3")).toBe(0);
  expect(compareVersions("10.20.30", "10.20.30")).toBe(0);
});

test("compareVersions - should return positive when v1 > v2", () => {
  expect(compareVersions("2.0.0", "1.0.0")).toBeGreaterThan(0);
  expect(compareVersions("1.1.0", "1.0.0")).toBeGreaterThan(0);
  expect(compareVersions("1.0.1", "1.0.0")).toBeGreaterThan(0);
  expect(compareVersions("10.0.0", "9.99.99")).toBeGreaterThan(0);
});

test("compareVersions - should return negative when v1 < v2", () => {
  expect(compareVersions("1.0.0", "2.0.0")).toBeLessThan(0);
  expect(compareVersions("1.0.0", "1.1.0")).toBeLessThan(0);
  expect(compareVersions("1.0.0", "1.0.1")).toBeLessThan(0);
  expect(compareVersions("9.99.99", "10.0.0")).toBeLessThan(0);
});

test("compareVersions - should handle different length versions", () => {
  expect(compareVersions("1.0", "1.0.0")).toBe(0);
  expect(compareVersions("1", "1.0")).toBe(0);
  expect(compareVersions("1", "1.0.0")).toBe(0);
  expect(compareVersions("1.0", "1.0.1")).toBeLessThan(0);
  expect(compareVersions("1.0.1", "1.0")).toBeGreaterThan(0);
});

test("compareVersions - should handle multi-digit version numbers", () => {
  expect(compareVersions("1.10.0", "1.9.0")).toBeGreaterThan(0);
  expect(compareVersions("1.100.0", "1.99.0")).toBeGreaterThan(0);
  expect(compareVersions("10.0.0", "9.0.0")).toBeGreaterThan(0);
});

test("compareVersions - should compare major versions first", () => {
  expect(compareVersions("2.0.0", "1.99.99")).toBeGreaterThan(0);
  expect(compareVersions("1.99.99", "2.0.0")).toBeLessThan(0);
});

test("compareVersions - should compare minor versions when major is equal", () => {
  expect(compareVersions("1.2.0", "1.1.99")).toBeGreaterThan(0);
  expect(compareVersions("1.1.99", "1.2.0")).toBeLessThan(0);
});

test("compareVersions - should compare patch versions when major and minor are equal", () => {
  expect(compareVersions("1.1.2", "1.1.1")).toBeGreaterThan(0);
  expect(compareVersions("1.1.1", "1.1.2")).toBeLessThan(0);
});

test("compareVersions - should handle real-world lodash versions for security checks", () => {
  expect(compareVersions("4.17.21", "4.17.0")).toBeGreaterThan(0);
  expect(compareVersions("4.17.21", "4.17.20")).toBeGreaterThan(0);
  expect(compareVersions("4.17.21", "4.17.21")).toBe(0);
  expect(compareVersions("4.17.21", "4.18.0")).toBeLessThan(0);
  expect(compareVersions("4.17.21", "5.0.0")).toBeLessThan(0);
});

test("compareVersions - should support security vulnerability range checking", () => {
  const currentVersion = "4.17.0";
  const fixedVersion = "4.17.21";

  expect(compareVersions(currentVersion, fixedVersion)).toBeLessThan(0);
  expect(compareVersions(fixedVersion, currentVersion)).toBeGreaterThan(0);
});
