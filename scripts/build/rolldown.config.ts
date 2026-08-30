import {
  DIST_BUNDLE_EXTERNALS,
  DIST_BUNDLE_TARGET,
  DIST_ENTRY_FILE,
  DIST_OUTPUT_DIR,
} from "./constants";
import type { RolldownBuildConfig } from "./types";

export const rolldownConfig = {
  external: DIST_BUNDLE_EXTERNALS,
  input: DIST_ENTRY_FILE,
  minify: true,
  outDir: DIST_OUTPUT_DIR,
  splitting: true,
  target: DIST_BUNDLE_TARGET,
} satisfies RolldownBuildConfig;

export default rolldownConfig;
