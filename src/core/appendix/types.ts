import type { AppendixItem } from "../../types";

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
>;

export type PartialSecurityLedger = Partial<SecurityLedgerFields>;

export type CompactAppendixItem = { addedDate: string };

export type CompactAppendix = Record<
  string,
  CompactAppendixItem | AppendixItem
>;
