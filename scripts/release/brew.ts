import { logger as createLogger } from "../../src/observability";
import { isMainModule } from "../is-main";

const STABLE_VERSION_PATTERN = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;
const LOG_OPTIONS = { file: "scripts/release/brew.ts" };
type CliOptions = { argv?: string[]; env?: Record<string, string | undefined> };

export const validateStableVersion = (version: string): void => {
  if (STABLE_VERSION_PATTERN.test(version)) return;
  throw new Error(`Invalid stable version: ${version}`);
};

export const runBrewCli = ({
  argv = process.argv.slice(2),
  env = process.env,
}: CliOptions = {}): void => {
  const command = argv[0] ?? "validate-version";
  if (command !== "validate-version") throw new Error(`Unknown command: ${command}`);
  const version = env.VERSION;
  if (!version) throw new Error("VERSION is required");
  validateStableVersion(version);
};

const formatBrewError = (error: unknown): string => {
  if (error instanceof Error) {
    const { message } = error;
    return message;
  }
  const message = String(error);
  return message;
};

if (isMainModule(import.meta.url)) {
  try {
    runBrewCli();
  } catch (error) {
    const log = createLogger(LOG_OPTIONS);
    log.fail(formatBrewError(error));
    process.exitCode = 1;
  }
}
