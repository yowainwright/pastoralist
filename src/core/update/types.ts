import type {
  Options,
  Appendix,
  OverridesType,
  PastoralistJSON,
} from "../../types";
import type { PastoralistConfig } from "../../config";
import type { ResolveOverrides } from "../../types";
import type { ConsoleObject } from "../../utils";

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
  depPaths?: string[] | "workspace" | "workspaces";
  securityOverrideDetails?: Options["securityOverrideDetails"];
  securityProvider?: Options["securityProvider"];
  manualOverrideReasons?: Options["manualOverrideReasons"];
}

export interface LoadedConfig {
  packageJson: PastoralistJSON | undefined;
  packageJsonConfig: PastoralistConfig | undefined;
}

export interface RemovedOverride {
  packageName: string;
  version: string;
}

export interface UpdateMetrics {
  packagesScanned: number;
  workspacePackagesScanned: number;
  appendixEntriesUpdated: number;
  vulnerabilitiesBlocked: number;
  overridesAdded: number;
  overridesRemoved: number;
  removedOverridePackages: RemovedOverride[];
  severityCritical: number;
  severityHigh: number;
  severityMedium: number;
  severityLow: number;
  writeSuccess: boolean;
  writeSkipped: boolean;
}

export interface UpdateContext {
  options: Options;
  path: string;
  root: string;
  isTesting: boolean;
  log: ConsoleObject;
  config?: PastoralistJSON;
  patchMap?: Record<string, string[]>;
  overridesData?: ResolveOverrides;
  overrides?: OverridesType;
  hasRootOverrides?: boolean;
  rootDeps?: Record<string, string>;
  missingInRoot?: string[];
  mode?: ProcessingMode;
  existingAppendix?: Appendix;
  depPaths?: string[] | null;
  appendix?: Appendix;
  workspaceAppendix?: Appendix;
  allWorkspaceDeps?: Record<string, string>;
  allDeps?: Record<string, string>;
  overridePaths?: Record<string, Appendix>;
  finalOverrides?: OverridesType;
  finalAppendix?: Appendix;
  unusedPatchCount?: number;
  writeSkipped?: boolean;
  writeSuccess?: boolean;
  metrics?: UpdateMetrics;
}

export interface WriteResultContext {
  path: string;
  config: PastoralistJSON;
  finalAppendix: Appendix;
  finalOverrides: OverridesType;
  options: { dryRun?: boolean; outputFormat?: "text" | "json" };
  isTesting: boolean;
}
