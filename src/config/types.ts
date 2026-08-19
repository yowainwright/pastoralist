import type {
  DEP_PATH_ALIASES,
  RESOLVED_BY_VALUES,
  SECURITY_CHECK_RESULTS,
  SECURITY_PROVIDERS,
  SEVERITY_THRESHOLDS,
} from "./validation/constants";
import type {
  AppendixItem as SharedAppendixItem,
  AppendixTarget,
  KeepConstraint,
  PastoralistConfig as SharedPastoralistConfig,
  PastoralistJSON,
} from "../types";

export type SecurityProvider = (typeof SECURITY_PROVIDERS)[number];
export type SecurityProviders = SecurityProvider | SecurityProvider[];
export type SeverityThreshold = (typeof SEVERITY_THRESHOLDS)[number];
export type SecurityCheckResult = (typeof SECURITY_CHECK_RESULTS)[number];
export type ResolvedBy = (typeof RESOLVED_BY_VALUES)[number];
export type DepPathAlias = (typeof DEP_PATH_ALIASES)[number];

export type { KeepConstraint };

export type AppendixItem = SharedAppendixItem & { addedDate?: string };
export type Appendix = Record<string, AppendixItem>;
export type SecurityConfig = NonNullable<SharedPastoralistConfig["security"]>;
export type PastoralistConfig = SharedPastoralistConfig;

export type ConfigSource = {
  format: "json" | "javascript";
  path: string;
};

export type LoadedConfig = {
  appendixTarget: AppendixTarget | undefined;
  config: PastoralistConfig | undefined;
  source: ConfigSource | undefined;
};

export type MergedExternalConfig = {
  appendixTarget: AppendixTarget | undefined;
  config: PastoralistJSON;
};

export type ConfigAppendix = PastoralistConfig["appendix"];

export type { FieldValidation, FieldValidator } from "./validation/types";
