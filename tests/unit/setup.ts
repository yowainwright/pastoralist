import * as nodeModule from "node:module";
import assert from "node:assert/strict";
import { mock as nodeMock, type TestContext } from "node:test";
import { setImmediate as nextTurn } from "node:timers/promises";
import { extname, resolve } from "path";
import { isDeepStrictEqual } from "node:util";
import { fileURLToPath } from "node:url";
import * as fs from "fs";

const TEST_TEMP_DIR = resolve(import.meta.dirname, ".tmp", String(process.pid));
process.env.TMPDIR = TEST_TEMP_DIR;
fs.mkdirSync(TEST_TEMP_DIR, { recursive: true });
process.once("exit", () => fs.rmSync(TEST_TEMP_DIR, { recursive: true, force: true }));

type ResolveHook = NonNullable<Parameters<typeof nodeModule.registerHooks>[0]["resolve"]>;

type ResolveContext = Parameters<ResolveHook>[1];

type NextResolve = Parameters<ResolveHook>[2];

type LoadHook = NonNullable<Parameters<typeof nodeModule.registerHooks>[0]["load"]>;

const appendExtension = (specifier: string, extension: string): string => {
  const queryIndex = specifier.indexOf("?");
  if (queryIndex === -1) {
    const extendedSpecifier = `${specifier}${extension}`;
    return extendedSpecifier;
  }
  const path = specifier.slice(0, queryIndex);
  const query = specifier.slice(queryIndex);
  const extendedSpecifier = `${path}${extension}${query}`;
  return extendedSpecifier;
};

const resolveCandidates = (specifier: string): readonly string[] => [
  appendExtension(specifier, ".ts"),
  appendExtension(specifier, ".tsx"),
  appendExtension(`${specifier}/index`, ".ts"),
  appendExtension(`${specifier}/index`, ".tsx"),
];

const tryResolve = (specifier: string, context: ResolveContext, nextResolve: NextResolve) => {
  try {
    const resolvedModule = nextResolve(specifier, context);
    return resolvedModule;
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
    const resolvedModule = nextResolve(specifier, context);
    return resolvedModule;
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

const createLoadHook = (
  stripTypeScriptTypes: NonNullable<typeof nodeModule.stripTypeScriptTypes>,
): LoadHook => {
  const loadTypeScript = (url: string): string => {
    const source = fs.readFileSync(fileURLToPath(url), "utf8");
    const strippedSource = stripTypeScriptTypes(source, { sourceUrl: url });
    return strippedSource;
  };
  return (url, context, nextLoad) => {
    const isTypeScript = url.startsWith("file:") && extname(new URL(url).pathname) === ".ts";
    if (!isTypeScript) {
      const loadedModule = nextLoad(url, context);
      return loadedModule;
    }
    const source = loadTypeScript(url);
    const moduleSource = { format: "module", shortCircuit: true, source };
    return moduleSource;
  };
};

const registerTypeScriptHooks = (): void => {
  const { registerHooks, stripTypeScriptTypes } = nodeModule;
  const cannotRegister = !registerHooks || !stripTypeScriptTypes;
  if (cannotRegister) return;
  const load = createLoadHook(stripTypeScriptTypes);
  registerHooks({ resolve: resolveTypeScript, load: load });
};
registerTypeScriptHooks();

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

const activeMocks = new Set<{
  mockRestore: () => unknown;
}>();

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
    if (!isConstructorCall) {
      const callResult = Reflect.apply(implementation, this, args);
      return callResult;
    }
    if (isConstructable(implementation)) {
      const constructedInstance = Reflect.construct(implementation, args, new.target);
      return constructedInstance;
    }
    const callResult = Reflect.apply(implementation, this, args);
    return callResult;
  };
  const wrappedImplementation = wrapped as F;
  return wrappedImplementation;
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
  const compatibleMock = decorateMock(nodeMock.fn(wrapImplementation(initialImplementation)));
  return compatibleMock;
};

const restoreMocks = (): void => {
  activeMocks.forEach((fn) => fn.mockRestore());
};

export const mock = Object.assign(createMock, { restore: restoreMocks });

export const advanceTimers = async (
  context: TestContext,
  ...milliseconds: number[]
): Promise<void> => {
  await nextTurn();
  const [duration, ...remaining] = milliseconds;
  if (duration === undefined) return;
  context.mock.timers.tick(duration);
  await advanceTimers(context, ...remaining);
};

export const fulfilledValues = async <T>(promises: Promise<T>[]): Promise<T[]> => {
  const results = await Promise.allSettled(promises);
  const fulfilledResults = results.map((result) => {
    if (result.status === "rejected") throw result.reason;
    const fulfilledValue = result.value;
    return fulfilledValue;
  });
  return fulfilledResults;
};

export const spyOn = <ObjectType extends object, Key extends keyof ObjectType>(
  object: ObjectType,
  key: Key,
): CompatibleMock<Extract<ObjectType[Key], AnyFunction>> => {
  const native = nodeMock.method(object, key as never) as NativeMock<
    Extract<ObjectType[Key], AnyFunction>
  >;
  const decoratedMock = decorateMock(native);
  return decoratedMock;
};

interface AsymmetricMatcher {
  matches: (actual: unknown) => boolean;
}

interface MockFunction {
  mock: {
    calls: readonly (
      | readonly unknown[]
      | {
          arguments: readonly unknown[];
        }
    )[];
  };
}

const isRecord = (value: unknown): value is Record<string, unknown> => {
  const isObject = Boolean(value) && typeof value === "object";
  const isPlainRecord = isObject && !Array.isArray(value);
  return isPlainRecord;
};

const isMatcher = (value: unknown): value is AsymmetricMatcher => {
  const isObject = value !== null && typeof value === "object";
  if (!isObject) return false;
  const hasMatcherMethod = "matches" in value && typeof value.matches === "function";
  return hasMatcherMethod;
};

const matchesObject = (actual: unknown, expected: object): boolean => {
  if (!isRecord(actual)) return false;
  const objectMatches = Object.entries(expected).every(([key, value]) =>
    matchesExpected(actual[key], value),
  );
  return objectMatches;
};

const matchesArray = (actual: readonly unknown[], expected: readonly unknown[]): boolean =>
  actual.length === expected.length &&
  expected.every((value, index) => matchesExpected(actual[index], value));

const hasValue = (key: string, record: Record<string, unknown>): boolean =>
  record[key] !== undefined;

const matchesRecord = (
  actual: Record<string, unknown>,
  expected: Record<string, unknown>,
): boolean => {
  const actualKeys = Object.keys(actual).filter((key) => hasValue(key, actual));
  const expectedKeys = Object.keys(expected).filter((key) => hasValue(key, expected));
  if (actualKeys.length !== expectedKeys.length) return false;
  const keysMatch = expectedKeys.every(
    (key) => Object.hasOwn(actual, key) && matchesExpected(actual[key], expected[key]),
  );
  return keysMatch;
};

const matchesExpected = (actual: unknown, expected: unknown): boolean => {
  if (isMatcher(expected)) {
    const matcherResult = expected.matches(actual);
    return matcherResult;
  }
  const areArrays = Array.isArray(actual) && Array.isArray(expected);
  if (areArrays) {
    const arraysMatch = matchesArray(actual, expected);
    return arraysMatch;
  }
  if (isDeepStrictEqual(actual, expected)) return true;
  const areRecords = isRecord(actual) && isRecord(expected);
  if (areRecords) {
    const recordsMatch = matchesRecord(actual, expected);
    return recordsMatch;
  }
  return false;
};

const hasCallArguments = (
  call:
    | readonly unknown[]
    | {
        arguments: readonly unknown[];
      },
): call is {
  arguments: readonly unknown[];
} => !Array.isArray(call);

const callArguments = (
  call:
    | readonly unknown[]
    | {
        arguments: readonly unknown[];
      },
): readonly unknown[] => (hasCallArguments(call) ? call.arguments : call);

const propertySegments = (path: string | readonly string[]): readonly string[] => {
  if (typeof path !== "string") return path;
  const segments = path.split(".");
  return segments;
};

const getProperty = (actual: unknown, path: string | readonly string[]): [boolean, unknown] => {
  let value = actual;
  for (const segment of propertySegments(path)) {
    const isObject = Boolean(value) && typeof value === "object";
    if (!isObject) {
      const missingProperty: [boolean, unknown] = [false, undefined];
      return missingProperty;
    }
    const record = value as Record<string, unknown>;
    if (!(segment in record)) {
      const missingProperty: [boolean, unknown] = [false, undefined];
      return missingProperty;
    }
    value = record[segment];
  }
  const foundProperty: [boolean, unknown] = [true, value];
  return foundProperty;
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

const PRIMITIVE_MATCHER_TYPES = new Map<Function, string>([
  [String, "string"],
  [Number, "number"],
  [Boolean, "boolean"],
  [Function, "function"],
]);

export const anyValue = (constructor: Function): AsymmetricMatcher => ({
  matches: (actual) => {
    const expectedType = PRIMITIVE_MATCHER_TYPES.get(constructor);
    if (expectedType) {
      const matchesType = typeof actual === expectedType;
      return matchesType;
    }
    const matchesConstructor = actual instanceof constructor;
    return matchesConstructor;
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

export const assertContainsEqual = (actual: readonly unknown[], expected: unknown): void => {
  assert.ok(actual.some((value) => matchesExpected(value, expected)));
};

export const assertDoesNotContainEqual = (actual: readonly unknown[], expected: unknown): void => {
  assert.ok(actual.every((value) => !matchesExpected(value, expected)));
};

export const assertCalledWith = (fn: MockFunction, ...expected: unknown[]): void => {
  assert.ok(fn.mock.calls.some((call) => matchesArray(callArguments(call), expected)));
};

export const assertNotCalledWith = (fn: MockFunction, ...expected: unknown[]): void => {
  assert.ok(fn.mock.calls.every((call) => !matchesArray(callArguments(call), expected)));
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

const ROOT_PACKAGE_JSON = resolve(ORIGINAL_CWD, "package.json");

const SRC_DIR = resolve(ORIGINAL_CWD, "src");

export const UNIT_FIXTURE_DIR = resolve(import.meta.dirname, "fixtures");

export const UNIT_FIXTURE_PACKAGE_JSON = resolve(UNIT_FIXTURE_DIR, "fixture.unit.package.json");

const PROTECTED_PATHS = [ROOT_PACKAGE_JSON, SRC_DIR];

export function isProtectedPath(path: string): boolean {
  const normalizedPath = resolve(path);
  for (const protectedPath of PROTECTED_PATHS) {
    const isExactPath = normalizedPath === protectedPath;
    const isChildPath = normalizedPath.startsWith(protectedPath + "/");
    const isProtected = isExactPath || isChildPath;
    if (isProtected) {
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
  const exists = fs.existsSync(path);
  return exists;
}

export function safeReadFileSync(path: string, encoding?: BufferEncoding): string {
  const normalizedPath = resolve(path);
  const content = fs.readFileSync(normalizedPath, encoding || "utf8");
  return content;
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
    const isValidPackage = isPastoralistPackage || isDocsPackage;
    if (isValidPackage) return;
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
