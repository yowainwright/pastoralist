import { test, expect, mock } from "bun:test";
import type { Appendix } from "../../../src/types";

const mockGlob = {
  sync: mock(() => []),
};

mock.module("../../../src/utils/glob", () => mockGlob);

import {
  detectPatches,
  getPackagePatches,
  findUnusedPatches,
  attachPatchesToAppendix,
} from "../../../src/core/patches";

test("detectPatches - should return empty object when no patches found", () => {
  mockGlob.sync.mockClear();
  mockGlob.sync.mockReturnValue([]);

  const result = detectPatches("./");

  expect(result).toEqual({});
});

test("detectPatches - should detect simple patch files", () => {
  mockGlob.sync.mockClear();
  mockGlob.sync.mockReturnValue(["patches/lodash+4.17.21.patch"]);

  const result = detectPatches("./");

  expect(result).toEqual({
    lodash: ["patches/lodash+4.17.21.patch"],
  });
});

test("detectPatches - should detect scoped package patches", () => {
  mockGlob.sync.mockClear();
  mockGlob.sync.mockReturnValue(["patches/@babel+core+7.20.0.patch"]);

  const result = detectPatches("./");

  expect(result).toEqual({
    "@babel/core": ["patches/@babel+core+7.20.0.patch"],
  });
});

test("detectPatches - should detect patches without version", () => {
  mockGlob.sync.mockClear();
  mockGlob.sync.mockReturnValue(["patches/my-package.patch"]);

  const result = detectPatches("./");

  expect(result).toEqual({
    "my-package": ["patches/my-package.patch"],
  });
});

test("detectPatches - should group multiple patches for same package", () => {
  mockGlob.sync.mockClear();
  mockGlob.sync.mockReturnValue([
    "patches/lodash+4.17.20.patch",
    "patches/lodash+4.17.21.patch",
  ]);

  const result = detectPatches("./");

  expect(result).toEqual({
    lodash: [
      "patches/lodash+4.17.20.patch",
      "patches/lodash+4.17.21.patch",
    ],
  });
});

test("detectPatches - should handle multiple packages", () => {
  mockGlob.sync.mockClear();
  mockGlob.sync.mockReturnValue([
    "patches/lodash+4.17.21.patch",
    "patches/react+18.0.0.patch",
  ]);

  const result = detectPatches("./");

  expect(result).toEqual({
    lodash: ["patches/lodash+4.17.21.patch"],
    react: ["patches/react+18.0.0.patch"],
  });
});

test("detectPatches - should ignore non-patch files", () => {
  mockGlob.sync.mockClear();
  mockGlob.sync.mockReturnValue([
    "patches/lodash+4.17.21.patch",
    "patches/README.md",
  ]);

  const result = detectPatches("./");

  expect(result).toEqual({
    lodash: ["patches/lodash+4.17.21.patch"],
  });
});

test("detectPatches - should handle scoped packages with only scope", () => {
  mockGlob.sync.mockClear();
  mockGlob.sync.mockReturnValue(["patches/@babel.patch"]);

  const result = detectPatches("./");

  expect(result).toEqual({
    "@babel": ["patches/@babel.patch"],
  });
});

test("detectPatches - should return empty object on error", () => {
  mockGlob.sync.mockClear();
  mockGlob.sync.mockImplementation(() => {
    throw new Error("File system error");
  });

  const result = detectPatches("./");

  expect(result).toEqual({});
});

test("detectPatches - should use provided root path", () => {
  mockGlob.sync.mockClear();
  mockGlob.sync.mockReturnValue([]);

  detectPatches("/custom/root");

  expect(mockGlob.sync).toHaveBeenCalledWith(
    expect.any(Array),
    expect.objectContaining({ cwd: "/custom/root" })
  );
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
    lodash: [
      "patches/lodash+4.17.20.patch",
      "patches/lodash+4.17.21.patch",
    ],
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
