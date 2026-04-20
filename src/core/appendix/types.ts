import type {
  AppendixItem,
  Appendix,
  OverridesType,
  SecurityOverrideDetail,
  SecurityProviderType,
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

export type CompactAppendixItem = { addedDate: string };

export type CompactAppendix = Record<
  string,
  CompactAppendixItem | AppendixItem
>;

export interface ProcessOverrideOptions {
  override: string;
  packageName: string;
  deps: Record<string, string>;
  depList: string[];
  appendix: Appendix;
  cache: Map<string, AppendixItem>;
  reason?: string;
  packageReason?: string;
  securityLedger?: PartialSecurityLedger;
  securityOverrideDetails?: SecurityOverrideDetail[];
  securityProvider?: SecurityProviderType;
  manualOverrideReasons?: Record<string, string>;
  onlyUsedOverrides?: boolean;
  dependencyTree?: Record<string, boolean>;
  addedDate?: string;
  overrides?: OverridesType;
  overrideVersion?: string;
  parentOverride?: string;
}
