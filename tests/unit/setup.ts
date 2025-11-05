import { resolve } from "path";
import * as fs from "fs";

const ORIGINAL_CWD = process.cwd();
const TEST_CWD = resolve(__dirname);

const ROOT_PACKAGE_JSON = resolve(ORIGINAL_CWD, "package.json");
const SRC_DIR = resolve(ORIGINAL_CWD, "src");

export const UNIT_FIXTURE_DIR = resolve(__dirname, "fixtures");
export const UNIT_FIXTURE_PACKAGE_JSON = resolve(UNIT_FIXTURE_DIR, "fixture.unit.package.json");

const PROTECTED_PATHS = [
  ROOT_PACKAGE_JSON,
  SRC_DIR,
];

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
      `Protected paths are:\n${PROTECTED_PATHS.map(p => `  - ${p}`).join('\n')}\n` +
      `Use fixture files instead:\n` +
      `  - Unit tests: ${UNIT_FIXTURE_PACKAGE_JSON}`
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

export function validateRootPackageJsonIntegrity(): void {
  try {
    const rootPkgContent = safeReadFileSync(ROOT_PACKAGE_JSON, "utf8");
    const rootPkg = JSON.parse(rootPkgContent);

    if (rootPkg.name !== "pastoralist") {
      const error = new Error(
        `[CRITICAL TEST ISOLATION FAILURE] Root package.json has been corrupted!\n` +
        `Expected name: "pastoralist"\n` +
        `Actual name: "${rootPkg.name}"\n` +
        `This means a test wrote to the root package.json file.\n` +
        `All tests must be stopped immediately.`
      );
      console.error(error.message);
      throw error;
    }
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== "ENOENT") {
      throw err;
    }
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
