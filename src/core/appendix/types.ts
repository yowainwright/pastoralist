import type { AppendixItem, CompactAppendixItem } from "../../types";
import type { LEDGER_CHANGE_FIELDS } from "./constants";
export type {
  ProcessOverrideOptions,
  ProcessedPackageAppendix,
  AppendixUpdateOptions,
  PackageDependencyFields,
  NormalizedAppendixUpdateOptions,
  PackageAppendixArgs,
} from "./process/types";

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

export type AppendixLedgerArgs = [
  securityLedger: Omit<Ledger, "addedDate" | "reason">,
  addedDate?: string,
];

export type DependencyInfoArgs = [
  dependencyTree?: Record<string, string>,
  dependencyGraph?: Record<string, string[]>,
  directDeps?: Set<string>,
  dependencyGraphAmbiguousParents?: Record<string, string[]>,
];

export type CompactAppendix = Record<string, CompactAppendixItem | AppendixItem>;

export type LedgerChangeField = (typeof LEDGER_CHANGE_FIELDS)[number];
