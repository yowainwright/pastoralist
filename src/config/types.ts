import type {
  DEP_PATH_ALIASES,
  RESOLVED_BY_VALUES,
  SECURITY_CHECK_RESULTS,
  SECURITY_PROVIDERS,
  SEVERITY_THRESHOLDS,
} from "./constants";
import type { KeepConstraint } from "../types";

export type SecurityProvider = (typeof SECURITY_PROVIDERS)[number];
export type SecurityProviders = SecurityProvider | SecurityProvider[];
export type SeverityThreshold = (typeof SEVERITY_THRESHOLDS)[number];
export type SecurityCheckResult = (typeof SECURITY_CHECK_RESULTS)[number];
export type ResolvedBy = (typeof RESOLVED_BY_VALUES)[number];
export type DepPathAlias = (typeof DEP_PATH_ALIASES)[number];

export type { KeepConstraint };

export type AppendixItem = {
  rootDeps?: string[];
  dependents?: Record<string, string>;
  patches?: string[];
  ledger?: {
    addedDate: string;
    reason?: string;
    securityChecked?: boolean;
    securityCheckDate?: string;
    securityCheckResult?: SecurityCheckResult;
    securityProvider?: SecurityProvider;
    cves?: string[];
    severity?: SeverityThreshold;
    description?: string;
    url?: string;
    vulnerableRange?: string;
    patchedVersion?: string;
    keep?: boolean | KeepConstraint;
    potentiallyFixedIn?: string;
    resolvedAt?: string;
    resolvedBy?: ResolvedBy;
    resolvedVersion?: string;
  };
};

export type Appendix = Record<string, AppendixItem>;

export type SecurityConfig = {
  enabled?: boolean;
  provider?: SecurityProviders;
  autoFix?: boolean;
  interactive?: boolean;
  securityProviderToken?: string;
  severityThreshold?: SeverityThreshold;
  excludePackages?: string[];
  hasWorkspaceSecurityChecks?: boolean;
  strict?: boolean;
};

export type PastoralistConfig = {
  appendix?: Appendix;
  compactAppendix?: boolean;
  depPaths?: DepPathAlias | string[];
  checkSecurity?: boolean;
  overridePaths?: Record<string, Appendix>;
  resolutionPaths?: Record<string, Appendix>;
  security?: SecurityConfig;
};

export type ConfigAppendix = PastoralistConfig["appendix"];

export type FieldValidator = (value: unknown) => boolean;

export type FieldValidation = {
  field: string;
  validator: FieldValidator;
};
