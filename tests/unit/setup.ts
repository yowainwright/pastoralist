import { registerHooks, stripTypeScriptTypes } from "node:module";
import assert from "node:assert/strict";
import { mock as nodeMock } from "node:test";
import { extname, resolve } from "path";
import { fileURLToPath } from "node:url";
import { isDeepStrictEqual } from "node:util";
import * as fs from "fs";

const TEST_TEMP_DIR = resolve(import.meta.dirname, ".tmp", String(process.pid));
process.env.TMPDIR = TEST_TEMP_DIR;
fs.mkdirSync(TEST_TEMP_DIR, { recursive: true });
process.once("exit", () => fs.rmSync(TEST_TEMP_DIR, { recursive: true, force: true }));

type ResolveHook = NonNullable<Parameters<typeof registerHooks>[0]["resolve"]>;
type ResolveContext = Parameters<ResolveHook>[1];
type NextResolve = Parameters<ResolveHook>[2];

const appendExtension = (specifier: string, extension: string): string => {
  const queryIndex = specifier.indexOf("?");
  if (queryIndex === -1) return `${specifier}${extension}`;
  const path = specifier.slice(0, queryIndex);
  const query = specifier.slice(queryIndex);
  return `${path}${extension}${query}`;
};

const resolveCandidates = (specifier: string): readonly string[] => [
  appendExtension(specifier, ".ts"),
  appendExtension(specifier, ".tsx"),
  appendExtension(`${specifier}/index`, ".ts"),
  appendExtension(`${specifier}/index`, ".tsx"),
];

const tryResolve = (specifier: string, context: ResolveContext, nextResolve: NextResolve) => {
  try {
    return nextResolve(specifier, context);
  } catch {
    return undefined;
  }
};

const resolveTypeScript = (
  specifier: string,
  context: ResolveContext,
  nextResolve: NextResolve,
) => {
  try {
    return nextResolve(specifier, context);
  } catch (error) {
    const isFileUrl = specifier.startsWith("file:");
    const isLocal = isFileUrl || specifier.startsWith(".") || specifier.startsWith("/");
    if (!isLocal) throw error;

    const results = resolveCandidates(specifier).map((candidate) =>
      tryResolve(candidate, context, nextResolve),
    );
    const resolved = results.find((result) => result !== undefined);
    if (!resolved) throw error;
    return resolved;
  }
};

const loadTypeScript = (url: string): string => {
  const source = fs.readFileSync(fileURLToPath(url), "utf8");
  return stripTypeScriptTypes(source, { sourceUrl: url });
};

registerHooks({
  resolve: resolveTypeScript,
  load: (url, context, nextLoad) => {
    const isTypeScript = url.startsWith("file:") && extname(new URL(url).pathname) === ".ts";
    if (!isTypeScript) return nextLoad(url, context);
    return { format: "module", shortCircuit: true, source: loadTypeScript(url) };
  },
});

type AnyFunction = (...args: any[]) => any;
type NativeMock<F extends AnyFunction> = ReturnType<typeof nodeMock.fn<F>>;

interface CompatibleMethods<F extends AnyFunction> {
  mockClear: () => CompatibleMock<F>;
  mockImplementation: (implementation: F) => CompatibleMock<F>;
  mockImplementationOnce: (implementation: F) => CompatibleMock<F>;
  mockRejectedValue: (error: unknown) => CompatibleMock<F>;
  mockRejectedValueOnce: (error: unknown) => CompatibleMock<F>;
  mockResolvedValue: (value: unknown) => CompatibleMock<F>;
  mockRestore: () => CompatibleMock<F>;
  mockReturnValue: (value: ReturnType<F>) => CompatibleMock<F>;
}

export type CompatibleMock<F extends AnyFunction = AnyFunction> = NativeMock<F> &
  CompatibleMethods<F>;

const activeMocks = new Set<{ mockRestore: () => unknown }>();

const isConstructable = (fn: AnyFunction): boolean => {
  try {
    Reflect.construct(String, [], fn);
    return true;
  } catch {
    return false;
  }
};

const wrapImplementation = <F extends AnyFunction>(implementation: F): F => {
  const wrapped = function (this: unknown, ...args: Parameters<F>): ReturnType<F> {
    const isConstructorCall = new.target !== undefined;
    if (!isConstructorCall) return Reflect.apply(implementation, this, args);
    if (isConstructable(implementation)) return Reflect.construct(implementation, args, new.target);
    return Reflect.apply(implementation, this, args);
  };
  return wrapped as F;
};

const addImplementationMethods = <F extends AnyFunction>(
  compatible: CompatibleMock<F>,
  fn: NativeMock<F>,
): void => {
  compatible.mockImplementation = (implementation) => {
    fn.mock.mockImplementation(wrapImplementation(implementation));
    return compatible;
  };
  compatible.mockImplementationOnce = (implementation) => {
    fn.mock.mockImplementationOnce(wrapImplementation(implementation));
    return compatible;
  };
};

const addValueMethods = <F extends AnyFunction>(compatible: CompatibleMock<F>): void => {
  compatible.mockRejectedValue = (error) =>
    compatible.mockImplementation((() => Promise.reject(error)) as F);
  compatible.mockRejectedValueOnce = (error) =>
    compatible.mockImplementationOnce((() => Promise.reject(error)) as F);
  compatible.mockResolvedValue = (value) =>
    compatible.mockImplementation((() => Promise.resolve(value)) as F);
  compatible.mockReturnValue = (value) => compatible.mockImplementation((() => value) as F);
};

const addLifecycleMethods = <F extends AnyFunction>(
  compatible: CompatibleMock<F>,
  fn: NativeMock<F>,
): void => {
  compatible.mockClear = () => {
    fn.mock.resetCalls();
    return compatible;
  };
  compatible.mockRestore = () => {
    fn.mock.restore();
    fn.mock.resetCalls();
    return compatible;
  };
};

const decorateMock = <F extends AnyFunction>(fn: NativeMock<F>): CompatibleMock<F> => {
  const compatible = fn as CompatibleMock<F>;
  addImplementationMethods(compatible, fn);
  addValueMethods(compatible);
  addLifecycleMethods(compatible, fn);
  activeMocks.add(compatible);
  return compatible;
};

const createMock = <F extends AnyFunction = AnyFunction>(implementation?: F): CompatibleMock<F> => {
  const initialImplementation = implementation ?? ((() => undefined) as F);
  return decorateMock(nodeMock.fn(wrapImplementation(initialImplementation)));
};

const restoreMocks = (): void => {
  activeMocks.forEach((fn) => fn.mockRestore());
};

export const mock = Object.assign(createMock, { restore: restoreMocks });

export const spyOn = <ObjectType extends object, Key extends keyof ObjectType>(
  object: ObjectType,
  key: Key,
): CompatibleMock<Extract<ObjectType[Key], AnyFunction>> => {
  const native = nodeMock.method(object, key as never) as NativeMock<
    Extract<ObjectType[Key], AnyFunction>
  >;
  return decorateMock(native);
};

interface AsymmetricMatcher {
  matches: (actual: unknown) => boolean;
}

interface MockFunction {
  mock: {
    calls: readonly (readonly unknown[] | { arguments: readonly unknown[] })[];
  };
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const isMatcher = (value: unknown): value is AsymmetricMatcher => {
  if (!value || typeof value !== "object") return false;
  return "matches" in value && typeof value.matches === "function";
};

const matchesObject = (actual: unknown, expected: object): boolean => {
  if (!isRecord(actual)) return false;
  return Object.entries(expected).every(([key, value]) => matchesExpected(actual[key], value));
};

const matchesArray = (actual: readonly unknown[], expected: readonly unknown[]): boolean =>
  actual.length === expected.length &&
  expected.every((value, index) => matchesExpected(actual[index], value));

const matchesRecord = (
  actual: Record<string, unknown>,
  expected: Record<string, unknown>,
): boolean => {
  const hasValue = (key: string, record: Record<string, unknown>): boolean =>
    record[key] !== undefined;
  const actualKeys = Object.keys(actual).filter((key) => hasValue(key, actual));
  const expectedKeys = Object.keys(expected).filter((key) => hasValue(key, expected));
  if (actualKeys.length !== expectedKeys.length) return false;
  return expectedKeys.every(
    (key) => Object.hasOwn(actual, key) && matchesExpected(actual[key], expected[key]),
  );
};

const matchesExpected = (actual: unknown, expected: unknown): boolean => {
  if (isMatcher(expected)) return expected.matches(actual);
  if (Array.isArray(actual) && Array.isArray(expected)) return matchesArray(actual, expected);
  if (isDeepStrictEqual(actual, expected)) return true;
  if (isRecord(actual) && isRecord(expected)) return matchesRecord(actual, expected);
  return false;
};

const callMatches = (actual: readonly unknown[], expected: readonly unknown[]): boolean =>
  matchesArray(actual, expected);

const hasCallArguments = (
  call: readonly unknown[] | { arguments: readonly unknown[] },
): call is { arguments: readonly unknown[] } => !Array.isArray(call);

const callArguments = (
  call: readonly unknown[] | { arguments: readonly unknown[] },
): readonly unknown[] => (hasCallArguments(call) ? call.arguments : call);

const propertySegments = (path: string | readonly string[]): readonly string[] =>
  typeof path === "string" ? path.split(".") : path;

const getProperty = (actual: unknown, path: string | readonly string[]): [boolean, unknown] => {
  let value = actual;
  for (const segment of propertySegments(path)) {
    if (!value || typeof value !== "object") return [false, undefined];
    const record = value as Record<string, unknown>;
    if (!(segment in record)) return [false, undefined];
    value = record[segment];
  }
  return [true, value];
};

export const stringContaining = (expected: string): AsymmetricMatcher => ({
  matches: (actual) => typeof actual === "string" && actual.includes(expected),
});

export const notStringContaining = (expected: string): AsymmetricMatcher => ({
  matches: (actual) => typeof actual !== "string" || !actual.includes(expected),
});

export const stringMatching = (expected: RegExp): AsymmetricMatcher => ({
  matches: (actual) => typeof actual === "string" && expected.test(actual),
});

export const objectContaining = (expected: object): AsymmetricMatcher => ({
  matches: (actual) => matchesObject(actual, expected),
});

export const anyValue = (constructor: Function): AsymmetricMatcher => ({
  matches: (actual) => {
    if (constructor === String) return typeof actual === "string";
    if (constructor === Number) return typeof actual === "number";
    if (constructor === Boolean) return typeof actual === "boolean";
    if (constructor === Function) return typeof actual === "function";
    return actual instanceof constructor;
  },
});

export const anything = (): AsymmetricMatcher => ({
  matches: (actual) => actual !== null && actual !== undefined,
});

export const errorIncludes =
  (expected: string) =>
  (error: unknown): boolean =>
    error instanceof Error && error.message.includes(expected);

export const assertMatches = (actual: unknown, expected: unknown): void => {
  assert.ok(matchesExpected(actual, expected));
};

export const assertDoesNotMatch = (actual: unknown, expected: unknown): void => {
  assert.ok(!matchesExpected(actual, expected));
};

export const assertContainsEqual = (actual: readonly unknown[], expected: unknown): void => {
  assert.ok(actual.some((value) => matchesExpected(value, expected)));
};

export const assertDoesNotContainEqual = (actual: readonly unknown[], expected: unknown): void => {
  assert.ok(actual.every((value) => !matchesExpected(value, expected)));
};

export const assertCalledWith = (fn: MockFunction, ...expected: unknown[]): void => {
  assert.ok(fn.mock.calls.some((call) => callMatches(callArguments(call), expected)));
};

export const assertNotCalledWith = (fn: MockFunction, ...expected: unknown[]): void => {
  assert.ok(fn.mock.calls.every((call) => !callMatches(callArguments(call), expected)));
};

export const assertHasProperty = (
  actual: unknown,
  path: string | readonly string[],
  ...expected: [] | [unknown]
): void => {
  const [hasProperty, value] = getProperty(actual, path);
  assert.ok(hasProperty);
  if (expected.length === 1) assertMatches(value, expected[0]);
};

export const assertLacksProperty = (actual: unknown, path: string | readonly string[]): void => {
  const [hasProperty] = getProperty(actual, path);
  assert.ok(!hasProperty);
};

export const assertMatchObject = (actual: unknown, expected: object): void => {
  assert.ok(matchesObject(actual, expected));
};

const ORIGINAL_CWD = process.cwd();
const TEST_CWD = resolve(import.meta.dirname);

const ROOT_PACKAGE_JSON = resolve(ORIGINAL_CWD, "package.json");
const SRC_DIR = resolve(ORIGINAL_CWD, "src");

export const UNIT_FIXTURE_DIR = resolve(import.meta.dirname, "fixtures");
export const UNIT_FIXTURE_PACKAGE_JSON = resolve(UNIT_FIXTURE_DIR, "fixture.unit.package.json");

const PROTECTED_PATHS = [ROOT_PACKAGE_JSON, SRC_DIR];

export function isProtectedPath(path: string): boolean {
  const normalizedPath = resolve(path);

  for (const protectedPath of PROTECTED_PATHS) {
    if (normalizedPath === protectedPath || normalizedPath.startsWith(protectedPath + "/")) {
      return true;
    }
  }

  return false;
}

export function validateTestPath(path: string, operationName: string): void {
  if (isProtectedPath(path)) {
    const error = new Error(
      `[TEST ISOLATION VIOLATION] Attempted to ${operationName} protected path: ${path}\n` +
        `Protected paths are:\n${PROTECTED_PATHS.map((p) => `  - ${p}`).join("\n")}\n` +
        `Use fixture files instead:\n` +
        `  - Unit tests: ${UNIT_FIXTURE_PACKAGE_JSON}`,
    );

    console.error(error.message);
    throw error;
  }

  const packageJsonName = path.split("/").pop();
  if (packageJsonName) {
    console.log(`[TEST] Operating on: ${packageJsonName} at ${path}`);
  }
}

export function safeWriteFileSync(path: string, data: string | Buffer): void {
  validateTestPath(path, "write");
  fs.writeFileSync(path, data);
}

export function safeMkdirSync(path: string, options?: fs.MakeDirectoryOptions): void {
  validateTestPath(path, "create directory");
  fs.mkdirSync(path, options);
}

export function safeRmSync(path: string, options?: fs.RmOptions): void {
  validateTestPath(path, "delete");
  fs.rmSync(path, options);
}

export function safeUnlinkSync(path: string): void {
  validateTestPath(path, "delete file");
  fs.unlinkSync(path);
}

export function safeExistsSync(path: string): boolean {
  return fs.existsSync(path);
}

export function safeReadFileSync(path: string, encoding?: BufferEncoding): string {
  const normalizedPath = resolve(path);
  return fs.readFileSync(normalizedPath, encoding || "utf8");
}

export function safeResolve(...pathSegments: string[]): string {
  const resolvedPath = resolve(...pathSegments);

  if (isProtectedPath(resolvedPath)) {
    console.warn(`[TEST WARNING] Resolved path points to protected location: ${resolvedPath}`);
  }

  return resolvedPath;
}

const rootPackageCorruptionError = (actualName: unknown): Error =>
  new Error(
    `[CRITICAL TEST ISOLATION FAILURE] Root package.json has been corrupted!\n` +
      `Expected a Pastoralist package name\n` +
      `Actual name: "${actualName}"\n` +
      `This means a test wrote to the root package.json file.\n` +
      `All tests must be stopped immediately.`,
  );

export function validateRootPackageJsonIntegrity(): void {
  try {
    const rootPkgContent = safeReadFileSync(ROOT_PACKAGE_JSON, "utf8");
    const rootPkg = JSON.parse(rootPkgContent);
    const isPastoralistPackage = rootPkg.name === "pastoralist";
    const isDocsPackage = rootPkg.name === "pastoralist-docs";
    if (isPastoralistPackage || isDocsPackage) return;

    const error = rootPackageCorruptionError(rootPkg.name);
    console.error(error.message);
    throw error;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err;
  }
}

if (typeof globalThis !== "undefined") {
  Object.assign(globalThis, {
    __TEST_VALIDATE_PATH__: validateTestPath,
    __TEST_UNIT_FIXTURE__: UNIT_FIXTURE_PACKAGE_JSON,
  });
}

validateRootPackageJsonIntegrity();

console.log("[TEST SETUP] Unit test isolation configured");
console.log(`[TEST SETUP] Unit fixture: ${UNIT_FIXTURE_PACKAGE_JSON}`);
console.log(`[TEST SETUP] Protected paths: ${PROTECTED_PATHS.join(", ")}`);
