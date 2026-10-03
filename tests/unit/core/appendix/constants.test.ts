import assert from "node:assert/strict";
import { test } from "node:test";
import {
  APPENDIX_SEMVER_PATTERN,
  PACKAGE_NAME_PATTERN,
} from "../../../../src/core/appendix/constants";

test("package name pattern accepts valid names and rejects malformed names", () => {
  const accepted = ["lodash", "@types/node", "@scope/pkg-name", "Foo", "a.b", "a_b", "~pkg"];
  const rejected = ["", "@scope", "@/pkg", "@scope/", "a/b", "_pkg", ".pkg", "a b", "a@1"];
  accepted.forEach((name) => assert.equal(PACKAGE_NAME_PATTERN.test(name), true, name));
  rejected.forEach((name) => assert.equal(PACKAGE_NAME_PATTERN.test(name), false, name));
});

test("version pattern extracts the version and prerelease from surrounding text", () => {
  assert.equal(APPENDIX_SEMVER_PATTERN.exec("lodash@4.17.21")?.[0], "4.17.21");
  assert.equal(APPENDIX_SEMVER_PATTERN.exec("^1.2.3-beta.1+build")?.[0], "1.2.3-beta.1");
  assert.equal(APPENDIX_SEMVER_PATTERN.exec("workspace:*"), null);
});
