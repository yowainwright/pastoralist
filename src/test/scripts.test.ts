import { test, expect } from "vitest";
import {
  resolveJSON,
  resolveResolutions,
  updateAppendix,
  update,
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

test("updateAppendix", () => {
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
  const result = updateAppendix({
    dependencies,
    resolutions,
    name: "fiz",
    version: "1.0.0",
  });
  expect(result).toEqual({
    "bar@2.0.0": {
      fiz: "1.0.0",
    },
    "biz@2.0.0": {
      fiz: "1.0.0",
    },
    "foo@2.0.0": {
      fiz: "1.0.0",
    },
  });
});

test("update", () => {
  const options = {
    depPaths: ["./src/test/bar-package.json"],
    path: "./src/test/foo-package.json",
    isTesting: true,
  };
  const result = update(options);
  expect(result).toEqual({
    "biz@2.0.0": {
      bar: "1.0.0",
    },
  });
});
