import { test, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, writeFileSync, rmSync, existsSync } from "fs";
import { resolve } from "path";
import type { Appendix } from "../../../src/types";
import {
  detectPatches,
  getPackagePatches,
  findUnusedPatches,
  attachPatchesToAppendix,
} from "../../../src/core/patches";

const TEST_DIR = resolve(import.meta.dirname, ".test-patches");

const createPatchFile = (filename: string) => {
  const dir = resolve(TEST_DIR, filename.substring(0, filename.lastIndexOf("/")));
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

  assert.deepStrictEqual(result, {});
});

test("detectPatches - should detect simple patch files", () => {
  mkdirSync(resolve(TEST_DIR, "patches"), { recursive: true });
  createPatchFile("patches/lodash+4.17.21.patch");

  const result = detectPatches(TEST_DIR);

  assert.deepStrictEqual(result, {
    lodash: ["patches/lodash+4.17.21.patch"],
  });
});

test("detectPatches - should detect scoped package patches", () => {
  mkdirSync(resolve(TEST_DIR, "patches"), { recursive: true });
  createPatchFile("patches/@babel+core+7.20.0.patch");

  const result = detectPatches(TEST_DIR);

  assert.deepStrictEqual(result, {
    "@babel/core": ["patches/@babel+core+7.20.0.patch"],
  });
});

test("detectPatches - should detect patches without version", () => {
  mkdirSync(resolve(TEST_DIR, "patches"), { recursive: true });
  createPatchFile("patches/my-package.patch");

  const result = detectPatches(TEST_DIR);

  assert.deepStrictEqual(result, {
    "my-package": ["patches/my-package.patch"],
  });
});

test("detectPatches - should group multiple patches for same package", () => {
  mkdirSync(resolve(TEST_DIR, "patches"), { recursive: true });
  createPatchFile("patches/lodash+4.17.20.patch");
  createPatchFile("patches/lodash+4.17.21.patch");

  const result = detectPatches(TEST_DIR);

  assert.deepStrictEqual(result, {
    lodash: ["patches/lodash+4.17.20.patch", "patches/lodash+4.17.21.patch"],
  });
});

test("detectPatches - should handle multiple packages", () => {
  mkdirSync(resolve(TEST_DIR, "patches"), { recursive: true });
  createPatchFile("patches/lodash+4.17.21.patch");
  createPatchFile("patches/react+18.0.0.patch");

  const result = detectPatches(TEST_DIR);

  assert.deepStrictEqual(result, {
    lodash: ["patches/lodash+4.17.21.patch"],
    react: ["patches/react+18.0.0.patch"],
  });
});

test("detectPatches - should ignore non-patch files", () => {
  mkdirSync(resolve(TEST_DIR, "patches"), { recursive: true });
  createPatchFile("patches/lodash+4.17.21.patch");
  writeFileSync(resolve(TEST_DIR, "patches/README.md"), "readme");

  const result = detectPatches(TEST_DIR);

  assert.deepStrictEqual(result, {
    lodash: ["patches/lodash+4.17.21.patch"],
  });
});

test("detectPatches - should handle scoped packages with only scope", () => {
  mkdirSync(resolve(TEST_DIR, "patches"), { recursive: true });
  createPatchFile("patches/@babel.patch");

  const result = detectPatches(TEST_DIR);

  assert.deepStrictEqual(result, {
    "@babel": ["patches/@babel.patch"],
  });
});

test("detectPatches - should return empty object on error", () => {
  const result = detectPatches("/nonexistent/path/that/should/not/exist");

  assert.deepStrictEqual(result, {});
});

test("detectPatches - should use provided root path", () => {
  mkdirSync(resolve(TEST_DIR, "patches"), { recursive: true });
  createPatchFile("patches/test.patch");

  const result = detectPatches(TEST_DIR);

  assert.deepStrictEqual(result.test, ["patches/test.patch"]);
});

test("getPackagePatches - should return patches for existing package", () => {
  const patchMap = {
    lodash: ["patches/lodash+4.17.21.patch"],
  };

  const result = getPackagePatches("lodash", patchMap);

  assert.deepStrictEqual(result, ["patches/lodash+4.17.21.patch"]);
});

test("getPackagePatches - should return empty array for non-existent package", () => {
  const patchMap = {
    lodash: ["patches/lodash+4.17.21.patch"],
  };

  const result = getPackagePatches("react", patchMap);

  assert.deepStrictEqual(result, []);
});

test("getPackagePatches - should return empty array for empty patch map", () => {
  const patchMap = {};

  const result = getPackagePatches("lodash", patchMap);

  assert.deepStrictEqual(result, []);
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

  assert.deepStrictEqual(result, []);
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

  assert.deepStrictEqual(result, ["patches/react+18.0.0.patch"]);
});

test("findUnusedPatches - should find all unused patches", () => {
  const patchMap = {
    lodash: ["patches/lodash+4.17.21.patch"],
    react: ["patches/react+18.0.0.patch"],
  };
  const dependencies = {};

  const result = findUnusedPatches(patchMap, dependencies);

  assert.deepStrictEqual(result, ["patches/lodash+4.17.21.patch", "patches/react+18.0.0.patch"]);
});

test("findUnusedPatches - should handle multiple patches for same package", () => {
  const patchMap = {
    lodash: ["patches/lodash+4.17.20.patch", "patches/lodash+4.17.21.patch"],
  };
  const dependencies = {};

  const result = findUnusedPatches(patchMap, dependencies);

  assert.deepStrictEqual(result, ["patches/lodash+4.17.20.patch", "patches/lodash+4.17.21.patch"]);
});

test("findUnusedPatches - should return empty array for empty patch map", () => {
  const patchMap = {};
  const dependencies = { lodash: "^4.17.21" };

  const result = findUnusedPatches(patchMap, dependencies);

  assert.deepStrictEqual(result, []);
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

  assert.deepStrictEqual(result, {
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

  assert.deepStrictEqual(result, {
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

  assert.deepStrictEqual(result["lodash@4.17.21"].patches, ["patches/lodash+4.17.21.patch"]);
  assert.deepStrictEqual(result["react@18.0.0"].patches, ["patches/react+18.0.0.patch"]);
});

test("attachPatchesToAppendix - should return empty appendix for empty input", () => {
  const appendix: Appendix = {};
  const patchMap = {};

  const result = attachPatchesToAppendix(appendix, patchMap);

  assert.deepStrictEqual(result, {});
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

  assert.deepStrictEqual(result["lodash@4.17.21"].ledger, {
    addedDate: "2024-01-01",
    reason: "Security fix",
  });
  assert.deepStrictEqual(result["lodash@4.17.21"].patches, ["patches/lodash+4.17.21.patch"]);
});

test("attachPatchesToAppendix - should attach patches to scoped package entries", () => {
  const appendix: Appendix = {
    "@babel/core@7.20.0": {
      dependents: { root: "@babel/core@^7.20.0" },
    },
  };
  const patchMap = {
    "@babel/core": ["patches/@babel+core+7.20.0.patch"],
  };

  const result = attachPatchesToAppendix(appendix, patchMap);

  assert.deepStrictEqual(result["@babel/core@7.20.0"].patches, [
    "patches/@babel+core+7.20.0.patch",
  ]);
});
