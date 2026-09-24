import type { execFile } from "node:child_process";
import type { PartialSecurityLedger } from "./appendix/types";
import type { Logger } from "../observability";
import type {
  Appendix,
  AppendixDependencyContext,
  CleanupUnusedOverridesContext,
  OverridesType,
  ResolveOverrides,
} from "../types";

export type CleanupArguments = [
  overrides: CleanupUnusedOverridesContext["overrides"],
  overridesData: CleanupUnusedOverridesContext["overridesData"],
  appendix: CleanupUnusedOverridesContext["appendix"],
  allDeps: CleanupUnusedOverridesContext["allDeps"],
  missingInRoot: CleanupUnusedOverridesContext["missingInRoot"],
  overridePaths: CleanupUnusedOverridesContext["overridePaths"],
  logInstance: CleanupUnusedOverridesContext["logInstance"],
  updateOverrides: CleanupUnusedOverridesContext["updateOverrides"],
  root?: string,
];

export type WorkspaceAppendixOptions = {
  constructAppendix: (
    files: string[],
    data: ResolveOverrides,
    log: Logger,
    dependencyContext?: AppendixDependencyContext,
  ) => Appendix;
  dependencyContext?: AppendixDependencyContext;
};

export type UnusedOverrideContext = {
  overrides: OverridesType;
  allDependencies: Record<string, string>;
  dependencyTree: Record<string, string>;
  hasAnyDeps: boolean;
};

export type ExecFileAsync = typeof execFile.__promisify__;

export type SnykCLIProviderOptions = {
  debug?: boolean;
  token?: string;
  strict?: boolean;
  execFileAsync?: ExecFileAsync;
};

export type LedgerTransform = (ledger: PartialSecurityLedger) => PartialSecurityLedger;

export type InlineArrayState = {
  entries: string[];
  current: string;
  quote: string | null;
};

export type WorkspaceParseState = {
  packages: string[];
  isInPackagesBlock: boolean;
  packagesIndent: number;
  isComplete: boolean;
};
