import type { execFile } from "node:child_process";
import type { OverrideValue } from "../types";
import type { PartialSecurityLedger } from "./appendix/types";

export type OverrideType = {
  type: string;
  overrides: Record<string, OverrideValue>;
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
