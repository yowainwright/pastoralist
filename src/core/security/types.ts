export interface SecurityAlert {
  packageName: string;
  currentVersion: string;
  vulnerableVersions: string;
  patchedVersion?: string;
  severity: "low" | "medium" | "high" | "critical";
  title: string;
  description?: string;
  cve?: string;
  url?: string;
  fixAvailable: boolean;
}

export type SecurityProviderType = "osv" | "github" | "snyk" | "npm" | "socket";

export interface SecurityCheckOptions {
  provider?: SecurityProviderType | SecurityProviderType[];
  forceRefactor?: boolean;
  interactive?: boolean;
  autoFix?: boolean;
  owner?: string;
  repo?: string;
  token?: string;
}

export interface SecurityOverride {
  packageName: string;
  fromVersion: string;
  toVersion: string;
  reason: string;
  severity: string;
  cve?: string;
  description?: string;
  url?: string;
}

export interface OverrideUpdate {
  packageName: string;
  currentOverride: string;
  newerVersion: string;
  reason: string;
  addedDate?: string;
}

export interface DependabotAlert {
  number: number;
  state: "open" | "fixed" | "dismissed";
  dependency: {
    package: {
      ecosystem: string;
      name: string;
    };
    manifest_path: string;
    scope: "runtime" | "development";
  };
  security_advisory: {
    severity: string;
    summary: string;
    description: string;
    cve_id?: string;
    vulnerabilities: Array<{
      package: {
        ecosystem: string;
        name: string;
      };
      vulnerable_version_range: string;
      first_patched_version?: {
        identifier: string;
      };
    }>;
  };
  security_vulnerability: {
    package: {
      ecosystem: string;
      name: string;
    };
    severity: string;
    vulnerable_version_range: string;
    first_patched_version?: {
      identifier: string;
    };
  };
  url: string;
  html_url: string;
  created_at: string;
  updated_at: string;
  dismissed_at?: string;
  dismissed_by?: {
    login: string;
    id: number;
    type: string;
  };
  dismissed_reason?: string;
  dismissed_comment?: string;
  fixed_at?: string;
}

export interface GithubApiError {
  message: string;
  documentation_url?: string;
  status?: number;
}

import type {
  GitHubSecurityProvider,
  SnykCLIProvider,
  SocketCLIProvider,
  OSVProvider,
} from "./providers";

export type SecurityProvider =
  | GitHubSecurityProvider
  | SnykCLIProvider
  | SocketCLIProvider
  | OSVProvider;

export interface OSVVulnerability {
  id: string;
  summary?: string;
  details?: string;
  aliases?: string[];
  severity?: Array<{ type: string; score: string }>;
  affected?: Array<{
    package?: { name: string; ecosystem: string };
    ranges?: Array<{
      type: string;
      events: Array<{ introduced?: string; fixed?: string }>;
    }>;
  }>;
  references?: Array<{ type: string; url: string }>;
}

export interface SnykVulnerability {
  id: string;
  title: string;
  description?: string;
  severity: string;
  identifiers?: { CVE?: string[] };
  packageName: string;
  version: string;
  from: string[];
  upgradePath?: Array<string | boolean>;
  isUpgradable?: boolean;
  isPatchable?: boolean;
}

export interface SnykResult {
  vulnerabilities: SnykVulnerability[];
  ok: boolean;
  dependencyCount: number;
  org: string;
  policy: string;
  isPrivate: boolean;
  licensesPolicy?: Record<string, unknown>;
  packageManager: string;
}

export interface SocketIssue {
  type: string;
  severity: string;
  title: string;
  description?: string;
  cve?: string;
  url?: string;
}

export interface SocketPackage {
  name: string;
  version: string;
  issues?: SocketIssue[];
}

export interface SocketResult {
  packages: SocketPackage[];
}
