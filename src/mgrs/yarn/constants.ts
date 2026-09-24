import type { RemovalConfig } from "../types";

export const YARN_LOCK_FILENAME = "yarn.lock";
export const LOCKFILES = [YARN_LOCK_FILENAME];
export const YARN_LOCK_PACKAGE_PATTERN = /^[\w@][\w\-./]*@/gm;
export const YARN_BERRY_DEPENDENCY_PATTERN = /^\s{4}(?:"([^"]+)"|([^:\s"]+)):\s/;
export const YARN_CLASSIC_DEPENDENCY_PATTERN = /^\s{4}(?:"([^"]+)"|(\S+))\s/;
export const YARN_CONFIG_KEY_PATTERN = /^ *(?:([\w-]+)|"([\w-]+)"|'([\w-]+)')[ \t]*:/;
export const YARN_CONFIG_LIST_PATTERN = /^ *-(?:[ \t]|$)/;
const args = ["install", "--ignore-scripts", "--non-interactive"];
const paths = [".yarnrc", ".yarnrc.yml", ".yarn/patches"];
const guards = [{ path: ".yarnrc", pattern: /^\s*(?:--)?yarn-path(?:\s|=)/im }];
const env = {
  YARN_ENABLE_SCRIPTS: "false",
  YARN_IGNORE_PATH: "true",
  YARN_PLUGINS: "",
  YARN_RC_FILENAME: ".yarnrc.yml",
};
export const REMOVAL: RemovalConfig = { args, paths, guards, env };
