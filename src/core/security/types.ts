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

export interface SecurityCheckProgress {
  phase: "extracting" | "fetching" | "analyzing" | "resolving";
  message: string;
  current?: number;
  total?: number;
}

export interface SecurityCheckOptions {
  provider?: SecurityProviderType | SecurityProviderType[];
  forceRefactor?: boolean;
  interactive?: boolean;
  autoFix?: boolean;
  owner?: string;
  repo?: string;
  token?: string;
  strict?: boolean;
  onProgress?: (progress: SecurityCheckProgress) => void;
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

export class SecurityProviderPermissionError extends Error {
  constructor(
    public provider: string,
    public originalMessage: string,
  ) {
    const guidance =
      SecurityProviderPermissionError.getGuidance(originalMessage);
    super(
      `${provider} security check skipped: ${originalMessage}. ${guidance}`,
    );
    this.name = "SecurityProviderPermissionError";
  }

  private static getGuidance(message: string): string {
    const lowerMessage = message.toLowerCase();

    const isAccessError =
      lowerMessage.includes("resource not accessible") ||
      lowerMessage.includes("must have admin");

    const isNotEnabledError =
      lowerMessage.includes("not enabled") || lowerMessage.includes("disabled");

    const isNotFoundError = lowerMessage.includes("not found");

    if (isAccessError) {
      return "Add 'vulnerability-alerts: read' permission to your workflow or enable Dependabot alerts in repo settings.";
    }

    if (isNotEnabledError) {
      return "Enable Dependabot alerts in Settings > Code security and analysis.";
    }

    if (isNotFoundError) {
      return "Verify the repository exists and you have access, or enable Dependabot alerts.";
    }

    return "Check repository permissions and Dependabot settings.";
  }
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
