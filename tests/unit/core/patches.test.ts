import { test, expect, beforeEach, afterEach } from "bun:test";
import { mkdirSync, writeFileSync, rmSync, existsSync } from "fs";
import { resolve } from "path";
import type { Appendix } from "../../../src/types";
import {
  detectPatches,
  getPackagePatches,
  findUnusedPatches,
  attachPatchesToAppendix,
} from "../../../src/core/patches";

const TEST_DIR = resolve(__dirname, ".test-patches");

const createPatchFile = (filename: string) => {
  const dir = resolve(
    TEST_DIR,
    filename.substring(0, filename.lastIndexOf("/")),
  );
  if (dir !== TEST_DIR && !existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  writeFileSync(resolve(TEST_DIR, filename), "patch content");
};

beforeEach(() => {
  if (existsSync(TEST_DIR)) {
    rmSync(TEST_DIR, { recursive: true, force: true });
  }
  mkdirSync(TEST_DIR, { recursive: true });
});

afterEach(() => {
  if (existsSync(TEST_DIR)) {
    rmSync(TEST_DIR, { recursive: true, force: true });
  }
});

test("detectPatches - should return empty object when no patches found", () => {
  const result = detectPatches(TEST_DIR);

  expect(result).toEqual({});
});

test("detectPatches - should detect simple patch files", () => {
  mkdirSync(resolve(TEST_DIR, "patches"), { recursive: true });
  createPatchFile("patches/lodash+4.17.21.patch");

  const result = detectPatches(TEST_DIR);

  expect(result).toEqual({
    lodash: ["patches/lodash+4.17.21.patch"],
  });
});

test("detectPatches - should detect scoped package patches", () => {
  mkdirSync(resolve(TEST_DIR, "patches"), { recursive: true });
  createPatchFile("patches/@babel+core+7.20.0.patch");

  const result = detectPatches(TEST_DIR);

  expect(result).toEqual({
    "@babel/core": ["patches/@babel+core+7.20.0.patch"],
  });
});

test("detectPatches - should detect patches without version", () => {
  mkdirSync(resolve(TEST_DIR, "patches"), { recursive: true });
  createPatchFile("patches/my-package.patch");

  const result = detectPatches(TEST_DIR);

  expect(result).toEqual({
    "my-package": ["patches/my-package.patch"],
  });
});

test("detectPatches - should group multiple patches for same package", () => {
  mkdirSync(resolve(TEST_DIR, "patches"), { recursive: true });
  createPatchFile("patches/lodash+4.17.20.patch");
  createPatchFile("patches/lodash+4.17.21.patch");

  const result = detectPatches(TEST_DIR);

  expect(result).toEqual({
    lodash: ["patches/lodash+4.17.20.patch", "patches/lodash+4.17.21.patch"],
  });
});

test("detectPatches - should handle multiple packages", () => {
  mkdirSync(resolve(TEST_DIR, "patches"), { recursive: true });
  createPatchFile("patches/lodash+4.17.21.patch");
  createPatchFile("patches/react+18.0.0.patch");

  const result = detectPatches(TEST_DIR);

  expect(result).toEqual({
    lodash: ["patches/lodash+4.17.21.patch"],
    react: ["patches/react+18.0.0.patch"],
  });
});

test("detectPatches - should ignore non-patch files", () => {
  mkdirSync(resolve(TEST_DIR, "patches"), { recursive: true });
  createPatchFile("patches/lodash+4.17.21.patch");
  writeFileSync(resolve(TEST_DIR, "patches/README.md"), "readme");

  const result = detectPatches(TEST_DIR);

  expect(result).toEqual({
    lodash: ["patches/lodash+4.17.21.patch"],
  });
});

test("detectPatches - should handle scoped packages with only scope", () => {
  mkdirSync(resolve(TEST_DIR, "patches"), { recursive: true });
  createPatchFile("patches/@babel.patch");

  const result = detectPatches(TEST_DIR);

  expect(result).toEqual({
    "@babel": ["patches/@babel.patch"],
  });
});

test("detectPatches - should return empty object on error", () => {
  const result = detectPatches("/nonexistent/path/that/should/not/exist");

  expect(result).toEqual({});
});

test("detectPatches - should use provided root path", () => {
  mkdirSync(resolve(TEST_DIR, "patches"), { recursive: true });
  createPatchFile("patches/test.patch");

  const result = detectPatches(TEST_DIR);

  expect(result.test).toEqual(["patches/test.patch"]);
});

test("getPackagePatches - should return patches for existing package", () => {
  const patchMap = {
    lodash: ["patches/lodash+4.17.21.patch"],
  };

  const result = getPackagePatches("lodash", patchMap);

  expect(result).toEqual(["patches/lodash+4.17.21.patch"]);
});

test("getPackagePatches - should return empty array for non-existent package", () => {
  const patchMap = {
    lodash: ["patches/lodash+4.17.21.patch"],
  };

  const result = getPackagePatches("react", patchMap);

  expect(result).toEqual([]);
});

test("getPackagePatches - should return empty array for empty patch map", () => {
  const patchMap = {};

  const result = getPackagePatches("lodash", patchMap);

  expect(result).toEqual([]);
});

test("findUnusedPatches - should return empty array when all patches are used", () => {
  const patchMap = {
    lodash: ["patches/lodash+4.17.21.patch"],
    react: ["patches/react+18.0.0.patch"],
  };
  const dependencies = {
    lodash: "^4.17.21",
    react: "^18.0.0",
  };

  const result = findUnusedPatches(patchMap, dependencies);

  expect(result).toEqual([]);
});

test("findUnusedPatches - should find unused patches for removed dependencies", () => {
  const patchMap = {
    lodash: ["patches/lodash+4.17.21.patch"],
    react: ["patches/react+18.0.0.patch"],
  };
  const dependencies = {
    lodash: "^4.17.21",
  };

  const result = findUnusedPatches(patchMap, dependencies);

  expect(result).toEqual(["patches/react+18.0.0.patch"]);
});

test("findUnusedPatches - should find all unused patches", () => {
  const patchMap = {
    lodash: ["patches/lodash+4.17.21.patch"],
    react: ["patches/react+18.0.0.patch"],
  };
  const dependencies = {};

  const result = findUnusedPatches(patchMap, dependencies);

  expect(result).toEqual([
    "patches/lodash+4.17.21.patch",
    "patches/react+18.0.0.patch",
  ]);
});

test("findUnusedPatches - should handle multiple patches for same package", () => {
  const patchMap = {
    lodash: ["patches/lodash+4.17.20.patch", "patches/lodash+4.17.21.patch"],
  };
  const dependencies = {};

  const result = findUnusedPatches(patchMap, dependencies);

  expect(result).toEqual([
    "patches/lodash+4.17.20.patch",
    "patches/lodash+4.17.21.patch",
  ]);
});

test("findUnusedPatches - should return empty array for empty patch map", () => {
  const patchMap = {};
  const dependencies = { lodash: "^4.17.21" };

  const result = findUnusedPatches(patchMap, dependencies);

  expect(result).toEqual([]);
});

test("attachPatchesToAppendix - should attach patches to appendix entries", () => {
  const appendix: Appendix = {
    "lodash@4.17.21": {
      dependents: { root: "lodash@^4.17.21" },
    },
  };
  const patchMap = {
    lodash: ["patches/lodash+4.17.21.patch"],
  };

  const result = attachPatchesToAppendix(appendix, patchMap);

  expect(result).toEqual({
    "lodash@4.17.21": {
      dependents: { root: "lodash@^4.17.21" },
      patches: ["patches/lodash+4.17.21.patch"],
    },
  });
});

test("attachPatchesToAppendix - should not modify entries without patches", () => {
  const appendix: Appendix = {
    "react@18.0.0": {
      dependents: { root: "react@^18.0.0" },
    },
  };
  const patchMap = {
    lodash: ["patches/lodash+4.17.21.patch"],
  };

  const result = attachPatchesToAppendix(appendix, patchMap);

  expect(result).toEqual({
    "react@18.0.0": {
      dependents: { root: "react@^18.0.0" },
    },
  });
});

test("attachPatchesToAppendix - should handle multiple appendix entries", () => {
  const appendix: Appendix = {
    "lodash@4.17.21": {
      dependents: { root: "lodash@^4.17.21" },
    },
    "react@18.0.0": {
      dependents: { root: "react@^18.0.0" },
    },
  };
  const patchMap = {
    lodash: ["patches/lodash+4.17.21.patch"],
    react: ["patches/react+18.0.0.patch"],
  };

  const result = attachPatchesToAppendix(appendix, patchMap);

  expect(result["lodash@4.17.21"].patches).toEqual([
    "patches/lodash+4.17.21.patch",
  ]);
  expect(result["react@18.0.0"].patches).toEqual([
    "patches/react+18.0.0.patch",
  ]);
});

test("attachPatchesToAppendix - should return empty appendix for empty input", () => {
  const appendix: Appendix = {};
  const patchMap = {};

  const result = attachPatchesToAppendix(appendix, patchMap);

  expect(result).toEqual({});
});

test("attachPatchesToAppendix - should preserve existing appendix properties", () => {
  const appendix: Appendix = {
    "lodash@4.17.21": {
      dependents: { root: "lodash@^4.17.21" },
      ledger: {
        addedDate: "2024-01-01",
        reason: "Security fix",
      },
    },
  };
  const patchMap = {
    lodash: ["patches/lodash+4.17.21.patch"],
  };

  const result = attachPatchesToAppendix(appendix, patchMap);

  expect(result["lodash@4.17.21"].ledger).toEqual({
    addedDate: "2024-01-01",
    reason: "Security fix",
  });
  expect(result["lodash@4.17.21"].patches).toEqual([
    "patches/lodash+4.17.21.patch",
  ]);
});
