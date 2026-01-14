import type { AppendixItem } from "../../types";

export type Ledger = NonNullable<AppendixItem["ledger"]>;

export type SecurityLedgerFields = Pick<
  Ledger,
  | "securityChecked"
  | "securityCheckDate"
  | "securityProvider"
  | "cve"
  | "severity"
  | "url"
>;

export type PartialSecurityLedger = Partial<SecurityLedgerFields>;

export type CompactAppendixItem = { addedDate: string };

export type CompactAppendix = Record<string, CompactAppendixItem>;
