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
  dismissed_by?: any;
  dismissed_reason?: string;
  dismissed_comment?: string;
  fixed_at?: string;
}

export interface GithubApiError {
  message: string;
  documentation_url?: string;
  status?: number;
}

import type { GitHubSecurityProvider } from "./github";
import type { SnykCLIProvider } from "./snyk";
import type { SocketCLIProvider } from "./socket";
import type { OSVProvider } from "./index";

export type SecurityProvider = GitHubSecurityProvider | SnykCLIProvider | SocketCLIProvider | OSVProvider;