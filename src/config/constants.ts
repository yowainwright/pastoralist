export const CONFIG_FILES = [
  ".pastoralistrc",
  ".pastoralistrc.json",
  "pastoralist.json",
  "pastoralist.config.js",
  "pastoralist.config.ts",
] as const;

export type SecurityProvider = "osv" | "github" | "snyk" | "npm" | "socket";
export type SecurityProviders = SecurityProvider | SecurityProvider[];
export type SeverityThreshold = "low" | "medium" | "high" | "critical";

export type AppendixItem = {
  rootDeps?: string[];
  dependents?: Record<string, string>;
  patches?: string[];
  ledger?: {
    addedDate: string;
    reason?: string;
    securityChecked?: boolean;
    securityCheckDate?: string;
    securityProvider?: SecurityProvider;
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
};

export type PastoralistConfig = {
  appendix?: Appendix;
  depPaths?: "workspace" | "workspaces" | string[];
  checkSecurity?: boolean;
  overridePaths?: Record<string, Appendix>;
  resolutionPaths?: Record<string, Appendix>;
  security?: SecurityConfig;
};

const isObject = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null && !Array.isArray(value);
};

export function validateConfig(config: unknown): PastoralistConfig {
  if (!isObject(config)) {
    throw new Error("Config must be an object");
  }
  return config as PastoralistConfig;
}

export function safeValidateConfig(config: unknown): PastoralistConfig | undefined {
  if (!isObject(config)) {
    return undefined;
  }
  return config as PastoralistConfig;
}
