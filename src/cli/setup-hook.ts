import * as fs from "fs";
import { resolve } from "path";
import type { Options, PastoralistJSON } from "../types";
import { logger as createLogger } from "../utils";
import { resolvePathFromRoot } from "./utils";

type SetupHookDeps = {
  readFileSync: typeof fs.readFileSync;
  writeFileSync: typeof fs.writeFileSync;
  resolve: typeof resolve;
};

const defaultDeps: SetupHookDeps = {
  readFileSync: fs.readFileSync,
  writeFileSync: fs.writeFileSync,
  resolve,
};

const resolvePackagePath = (options: Options, deps: Pick<SetupHookDeps, "resolve">): string =>
  deps.resolve(resolvePathFromRoot(options.path || "package.json", options.root));

const readPackageJson = (
  packagePath: string,
  deps: Pick<SetupHookDeps, "readFileSync">,
): PastoralistJSON & { scripts?: Record<string, string> } =>
  JSON.parse(deps.readFileSync(packagePath, "utf8")) as PastoralistJSON & {
    scripts?: Record<string, string>;
  };

const buildPostinstallScript = (existingPostinstall: string): string => {
  if (existingPostinstall) return `${existingPostinstall} && pastoralist`;
  return "pastoralist";
};

const addPostinstallHook = (
  config: PastoralistJSON & { scripts?: Record<string, string> },
): PastoralistJSON & { scripts: Record<string, string> } => {
  const scripts = config.scripts || {};
  const nextScripts = Object.assign({}, scripts, {
    postinstall: buildPostinstallScript(scripts.postinstall || ""),
  });
  return Object.assign({}, config, { scripts: nextScripts });
};

const writePackageJson = (
  packagePath: string,
  config: PastoralistJSON,
  deps: Pick<SetupHookDeps, "writeFileSync">,
): void => {
  deps.writeFileSync(packagePath, JSON.stringify(config, null, 2) + "\n");
};

export const handleSetupHook = (
  options: Options,
  log: ReturnType<typeof createLogger>,
  deps: SetupHookDeps = defaultDeps,
): boolean => {
  if (options.setupHook !== true) return false;

  try {
    const packagePath = resolvePackagePath(options, deps);
    const config = readPackageJson(packagePath, deps);
    const existingPostinstall = config.scripts?.postinstall || "";

    if (existingPostinstall.includes("pastoralist")) {
      log.print("postinstall hook already configured");
      return true;
    }

    writePackageJson(packagePath, addPostinstallHook(config), deps);
    log.print("added postinstall hook to package.json");
    return true;
  } catch (err) {
    log.error("Failed to setup hook", "handleSetupHook", err);
    return false;
  }
};
