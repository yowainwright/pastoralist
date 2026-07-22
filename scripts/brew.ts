import { createHash } from "node:crypto";
import { writeFileSync } from "node:fs";
import { logger as createLogger } from "../src/utils";

const STABLE_VERSION_PATTERN = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;
const LOG_OPTIONS = { file: "scripts/brew.ts" };
const FORMULA_HEADER = [
  "class Pastoralist < Formula",
  '  desc "Audit, secure, and clean up package manager overrides"',
  '  homepage "https://jeffry.in/pastoralist/"',
];
const FORMULA_BODY = [
  '  license "MIT"',
  "",
  '  depends_on "node"',
  "",
  "  def install",
  '    system "npm", "install", *std_npm_args, "--ignore-scripts"',
  '    bin.install_symlink libexec.glob("bin/*")',
  "  end",
  "",
  "  test do",
  '    system bin/"pastoralist", "--version"',
  '    system bin/"pastoralist", "--help"',
  "  end",
  "end",
];

type Fetch = typeof fetch;
type FormulaInput = { digest: string; url: string; version: string };
type FormulaOptions = { fetchImpl?: Fetch; outputPath: string; version: string };
type CliOptions = { argv?: string[]; env?: Record<string, string | undefined> };

export const validateStableVersion = (version: string): void => {
  if (STABLE_VERSION_PATTERN.test(version)) return;
  throw new Error(`Invalid stable version: ${version}`);
};

export const npmTarballUrl = (version: string): string =>
  `https://registry.npmjs.org/pastoralist/-/pastoralist-${version}.tgz`;

export const sha256 = (content: Buffer): string =>
  createHash("sha256").update(content).digest("hex");

export const renderFormula = ({ digest, url, version }: FormulaInput): string => {
  const source = [`  url "${url}"`, `  version "${version}"`, `  sha256 "${digest}"`];
  return FORMULA_HEADER.concat(source, FORMULA_BODY, "").join("\n");
};

export const fetchPublishedTarball = async (
  url: string,
  fetchImpl: Fetch = fetch,
): Promise<Buffer> => {
  const response = await fetchImpl(url);
  if (!response.ok) throw new Error(`Unable to download published tarball: ${response.status}`);
  return Buffer.from(await response.arrayBuffer());
};

export const createPublishedFormula = async ({
  fetchImpl = fetch,
  outputPath,
  version,
}: FormulaOptions): Promise<FormulaInput> => {
  validateStableVersion(version);
  const url = npmTarballUrl(version);
  const digest = sha256(await fetchPublishedTarball(url, fetchImpl));
  writeFileSync(outputPath, renderFormula({ digest, url, version }));
  return { digest, url, version };
};

const requiredEnv = (env: Record<string, string | undefined>, name: string): string => {
  const value = env[name];
  if (value) return value;
  throw new Error(`${name} is required`);
};

export const runBrewCli = async ({
  argv = process.argv.slice(2),
  env = process.env,
}: CliOptions = {}): Promise<void> => {
  const command = argv[0] ?? "generate";
  const version = requiredEnv(env, "VERSION");
  validateStableVersion(version);
  if (command === "validate-version") return;
  if (command !== "generate") throw new Error(`Unknown command: ${command}`);
  const outputPath = requiredEnv(env, "FORMULA_PATH");
  await createPublishedFormula({ outputPath, version });
};

if (import.meta.main) {
  runBrewCli().catch((error) => {
    const log = createLogger(LOG_OPTIONS);
    log.fail(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
