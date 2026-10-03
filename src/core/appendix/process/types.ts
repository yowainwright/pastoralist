import type {
  Appendix,
  AppendixItem,
  AppendixDependencyContext,
  LedgerReason,
  OverridesType,
  PastoralistJSON,
  SecurityOverrideDetail,
  SecurityProviderType,
  UpdateAppendixOptions,
} from "../../../types";
import type { PartialSecurityLedger } from "../types";

export type PackageAppendixArgs = [
  writeAppendixToFile?: boolean,
  dependencyContext?: AppendixDependencyContext,
];

export interface ProcessOverrideOptions {
  override: string;
  packageName: string;
  deps: Record<string, string>;
  appendix: Appendix;
  cache: Map<string, AppendixItem>;
  reason?: LedgerReason;
  packageReason?: LedgerReason;
  securityLedger?: PartialSecurityLedger;
  securityOverrideDetails?: SecurityOverrideDetail[];
  securityProvider?: SecurityProviderType;
  manualOverrideReasons?: Record<string, LedgerReason>;
  onlyUsedOverrides?: boolean;
  dependencyTree?: Record<string, string>;
  dependencyGraph?: Record<string, string[]>;
  dependencyGraphAmbiguousParents?: Record<string, string[]>;
  trackedDependencies?: import("../../dep-tracker").TrackedDependencies;
  addedDate?: string;
  overrides?: OverridesType;
  overrideVersion?: string;
  parentOverride?: string;
}

export interface ProcessedPackageAppendix {
  name: string;
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
  appendix: Appendix;
}

export type AppendixUpdateOptions = UpdateAppendixOptions & {
  cache?: Map<string, AppendixItem>;
  manualOverrideReasons?: Record<string, LedgerReason>;
  dependencyTree?: Record<string, string>;
  dependencyGraph?: Record<string, string[]>;
  addedDate?: string;
};

export type PackageDependencyFields = Required<
  Pick<PastoralistJSON, "dependencies" | "devDependencies" | "peerDependencies">
>;

export interface NormalizedAppendixUpdateOptions extends AppendixUpdateOptions {
  overrides: OverridesType;
  appendix: Appendix;
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
  peerDependencies: Record<string, string>;
  packageName: string;
  cache: Map<string, AppendixItem>;
  onlyUsedOverrides: boolean;
}
