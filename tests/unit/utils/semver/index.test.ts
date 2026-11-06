import assert from "node:assert/strict";
import { test } from "node:test";
import {
  isSameReleaseLine,
  isVersionRangeSupported,
  satisfiesVersionRange,
} from "../../../../src/utils/semver";

const cases: Array<[string, string, boolean]> = [
  ["2.70.3", "^2.70.3", true],
  ["3.0.0", "^2.70.3", false],
  ["1.3.0", "~1.2.0", false],
  ["1.2.9", "~1.2.0", true],
  ["0.3.0", "^0.2.1", false],
  ["0.2.9", "^0.2.1", true],
  ["0.0.4", "^0.0.3", false],
  ["0.0.3", "^0.0.3", true],
  ["1.9.0", "1.x", true],
  ["2.0.0", "1", false],
  ["1.2.9", "1.2.*", true],
  ["1.3.0", "1.2", false],
  ["1.2.0", ">= 1.0.0 < 2.0.0", true],
  ["2.0.0", ">=1 <2", false],
  ["3.0.0", "^1 || ^3", true],
  ["2.0.0", "^1 || ^3", false],
  ["2.3.9", "1.2 - 2.3", true],
  ["2.4.0", "1.2 - 2.3", false],
  ["2.3.4", "1.2.3 - 2.3.4", true],
  ["2.3.5", "1.2.3 - 2.3.4", false],
  ["1.3.0", ">1.2", true],
  ["1.2.9", ">1.2", false],
  ["1.2.9", "<=1.2", true],
  ["1.3.0", "<=1.2", false],
  ["1.2.3-beta.2", ">=1.2.3-beta.1 <2", true],
  ["1.3.0-beta.1", ">=1.2.3-beta.1 <2", false],
  ["1.2.3-beta.1", "*", false],
  ["1.2.3+build.1", "1.2.3", true],
  ["1.2.3", "npm:other@^1", false],
  ["1.2.3", "workspace:*", false],
  ["1.2.3", "^1 || invalid", false],
  ["01.2.3", "*", false],
];

cases.forEach(([version, range, expected]) => {
  test(`${version} satisfies ${range}: ${expected}`, () => {
    assert.equal(satisfiesVersionRange(version, range), expected);
  });
});

test("unsupported ranges fail closed", () => {
  assert.equal(isVersionRangeSupported("https://example.com/package.tgz"), false);
  assert.equal(isVersionRangeSupported("latest"), false);
  assert.equal(isVersionRangeSupported("^1.2.3 || >=2 <3"), true);
});

test("release lines preserve major and pre-1.0 compatibility boundaries", () => {
  assert.equal(isSameReleaseLine("1.2.0", "1.9.0"), true);
  assert.equal(isSameReleaseLine("1.2.0", "2.0.0"), false);
  assert.equal(isSameReleaseLine("0.2.0", "0.3.0"), false);
  assert.equal(isSameReleaseLine("0.0.3", "0.0.4"), false);
});
