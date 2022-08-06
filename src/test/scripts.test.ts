import { test, expect, vi } from "vitest";
import {
  resolveJSON,
  resolveResolutions,
  updateAppendix,
  updatePackageJSON,
  update,
  getRootDeps,
} from "../scripts";

test("resolveJSON success", () => {
  const result = resolveJSON("./src/test/foo-package.json", true);
  expect(result).toEqual({
    dependencies: {
      bar: "1.0.0",
    },
    name: "foo",
    overrides: {
      biz: "2.0.0",
    },
    version: "1.0.0",
  });
});

test("resolveJSON failure", () => {
  const result = resolveJSON("./src/test/malformed.json", true);
  expect(result).toBeUndefined();
});

test("resolveResolutions", () => {
  const config = {
    overrides: {
      foo: "2.0.0",
    },
    pnpm: {
      overrides: {
        bar: "2.0.0",
      },
    },
    resolutions: {
      baz: "2.0.0",
    },
  };
  const result = resolveResolutions({ config });
  expect(result).toEqual({ bar: "2.0.0", baz: "2.0.0", foo: "2.0.0" });
});

test("updateAppendix", async () => {
  const dependencies = {
    foo: "1.0.0",
    bar: "1.0.0",
    biz: "1.0.0",
  };
  const resolutions = {
    foo: "2.0.0",
    bar: "2.0.0",
    biz: "2.0.0",
  };
  const exec = vi.fn(() => ({ "dependencies": { "biz": { "version": "1.0.0" } } }));
  const result = await updateAppendix({
    dependencies,
    resolutions,
    name: "fiz",
    version: "1.0.0",
    debug: true,
    rootDependencies: {
      fix: "1.0.0",
    },
    packageJSONs: [
      "./src/test/foo-package.json",
      "./src/test/bar-package.json",
    ],
    exec,
  });
  expect(result).toEqual({
    "bar@2.0.0": {
      dependents: {
        fiz: "1.0.0",
      },
      rootDeps: ['biz@1.0.0']
    },
    "biz@2.0.0": {
      dependents: {
        fiz: "1.0.0",
      },
      rootDeps: ['biz@1.0.0']
    },
    "foo@2.0.0": {
      dependents: {
        fiz: "1.0.0",
      },
      rootDeps: ['biz@1.0.0']
    },
  });
});

test("updatePackageJSON", () => {
  const appendix = {
    "bar@2.0.0": {
      dependents: {
        fiz: "1.0.0",
      },
    },
  };

  const config = {
    name: "test",
    version: "1.0.0",
    overrides: {
      fiz: "1.0.0",
    },
    pastoralist: {
      appendix,
    },
  };
  const resolutions = {
    fiz: "1.0.0",
    buzz: "1.0.0",
  };
  const options = {
    appendix,
    config,
    path: "./src/test/foo-package.json",
    resolutions,
    isTesting: true,
    debug: true,
  };
  const result = updatePackageJSON(options);
  expect(result).toEqual({
    name: "test",
    version: "1.0.0",
    overrides: {
      fiz: "1.0.0",
      buzz: "1.0.0",
    },
    pastoralist: {
      appendix: {
        "bar@2.0.0": {
          dependents: {
            fiz: "1.0.0",
          },
        },
      },
    },
  });
});

test("update", async () => {
  const exec = vi.fn(() => ({ "dependencies": { "biz": { "version": "1.0.0" } } }));
  const options = {
    depPaths: ["./src/test/bar-package.json"],
    path: "./src/test/foo-package.json",
    isTesting: true,
    exec
  };
  const result = await update(options);
  expect(result).toEqual({
    "biz@2.0.0": {
      dependents: {
        bar: "1.0.0",
      },
      rootDeps: ['biz@1.0.0']
    },
  });
});

test('getRootDeps', async () => {
  const resolutions = ['foo', 'bar'];
  const exec = vi.fn(() => ({ "dependencies": { "biz": { "version": "1.0.0" } } }));
  const result = await getRootDeps({ resolutions, exec, debug: true });
  expect(result[0]).toEqual({
    "resolution": "foo",
    "rootDeps": ["biz@1.0.0",]
  });
  expect(result[1]).toEqual({
    "resolution": "bar",
    "rootDeps": ["biz@1.0.0",]
  });
});
