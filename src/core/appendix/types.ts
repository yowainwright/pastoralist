import type {
  AppendixItem,
  Appendix,
  CompactAppendixItem,
  LedgerReason,
  OverridesType,
  PastoralistJSON,
  SecurityOverrideDetail,
  SecurityProviderType,
  UpdateAppendixOptions,
} from "../../types";

export type Ledger = NonNullable<AppendixItem["ledger"]>;

export type SecurityLedgerFields = Pick<
  Ledger,
  | "source"
  | "securityChecked"
  | "securityCheckDate"
  | "securityCheckResult"
  | "securityProvider"
  | "cves"
  | "cveDetails"
  | "severity"
  | "url"
  | "vulnerableRange"
  | "patchedVersion"
  | "confidence"
  | "sources"
>;

export type PartialSecurityLedger = Partial<SecurityLedgerFields>;

export type CompactAppendix = Record<string, CompactAppendixItem | AppendixItem>;

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

export interface NestedAppendixItemOptions extends Pick<
  ProcessOverrideOptions,
  "securityOverrideDetails" | "securityProvider" | "manualOverrideReasons" | "addedDate"
> {
  nestedPkg: string;
}
