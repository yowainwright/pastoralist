import type { Options, Appendix, OverridesType } from "../interfaces";
import type { PastoralistConfig } from "../config";
import type { ResolveOverrides } from "../overrides/interfaces";

export interface ProcessingMode {
  mode: "workspace" | "root";
  depPaths: string[] | null;
  hasRootOverrides: boolean;
  missingInRoot: string[];
}

export interface MergedConfig {
  overrides: OverridesType;
  overridesData: ResolveOverrides;
  appendix?: Appendix;
  depPaths?: string[] | "workspace";
  securityOverrideDetails?: Options["securityOverrideDetails"];
  securityProvider?: Options["securityProvider"];
  manualOverrideReasons?: Options["manualOverrideReasons"];
}

export interface LoadedConfig {
  packageJson: import("../interfaces").PastoralistJSON | undefined;
  packageJsonConfig: PastoralistConfig | undefined;
}
