import { test, expect } from "vitest";
import {
  resolveJSON,
  resolveConfig,
  resolveResolutions,
  updateAppendix,
  update,
} from "../scripts";

test("resolveJSON", () => {
  const result = resolveJSON("./foo-package.json");
  expect(result).toEqual("");
});

test("resolveConfig", () => {
  const result = resolveConfig({ options: {} });
  expect(result).toEqual("");
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
  expect(result).toEqual("");
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
  expect(result).toEqual("");
});

test("update", () => {
  const options = {
    depPaths: ["./bar-package.json"],
    path: "./foo-package.json",
  };
  const result = update(options);
  expect(result).toEqual("");
});
