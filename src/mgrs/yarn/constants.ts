import type { RemovalConfig } from "../types";

export const YARN_LOCK_FILENAME = "yarn.lock";
export const LOCKFILES = [YARN_LOCK_FILENAME];
export const YARN_LOCK_PACKAGE_PATTERN = /^[\w@][\w\-./]*@/gm;
export const YARN_BERRY_DEPENDENCY_PATTERN = /^\s{4}(?:"([^"]+)"|([^:\s"]+)):\s/;
export const YARN_CLASSIC_DEPENDENCY_PATTERN = /^\s{4}(?:"([^"]+)"|(\S+))\s/;
export const REMOVAL: RemovalConfig = {
  args: ["install", "--ignore-scripts", "--non-interactive"],
  paths: [".yarnrc", ".yarnrc.yml", ".yarn/patches"],
  guards: [
    { path: ".yarnrc", pattern: /^\s*(?:--)?yarn-path(?:\s|=)/im },
    { path: ".yarnrc.yml", pattern: /(?:^|[\n{,])\s*["']?(?:yarnPath|plugins)["']?\s*:/i },
  ],
  env: {
    YARN_ENABLE_SCRIPTS: "false",
    YARN_IGNORE_PATH: "true",
    YARN_PLUGINS: "",
    YARN_RC_FILENAME: ".yarnrc.yml",
  },
};
