import type { OptionDefinition } from "./types";

export const OPTION_DEFINITIONS: OptionDefinition[] = [
  { flags: ["--debug"], hasValue: false },
  { flags: ["--dry-run"], hasValue: false },
  { flags: ["-p", "--path"], hasValue: true, defaultValue: "package.json" },
  { flags: ["-d", "--depPaths"], hasValue: true, isArray: true },
  { flags: ["--ignore"], hasValue: true, isArray: true },
  { flags: ["-r", "--root"], hasValue: true },
  { flags: ["-t", "--isTestingCLI"], hasValue: false },
  { flags: ["--isTesting"], hasValue: false },
  { flags: ["--isIRLFix"], hasValue: false },
  { flags: ["--isIRLCatch"], hasValue: false },
  { flags: ["--init"], hasValue: false },
  { flags: ["--checkSecurity"], hasValue: false },
  { flags: ["--forceSecurityRefactor"], hasValue: false },
  { flags: ["--securityProvider"], hasValue: true, isArray: true },
  { flags: ["--securityProviderToken"], hasValue: true },
  { flags: ["--interactive"], hasValue: false },
  { flags: ["--hasWorkspaceSecurityChecks"], hasValue: false },
  { flags: ["--promptForReasons"], hasValue: false },
];

export const HELP_TEXT = `
Pastoralist - A utility CLI to manage your dependency overrides

Usage: pastoralist [command] [options]

Commands:
  init                                  Initialize Pastoralist configuration interactively

Options:
  --debug                               Enable debug mode
  --dry-run                             Preview changes without writing to package.json
  -p, --path <path>                     Specifies a path to a package.json (default: "package.json")
  -d, --depPaths [paths...]             Specifies glob paths to package.jsons
  --ignore [paths...]                   Specifies glob paths to ignore
  -r, --root <root>                     Specifies a root path
  -t, --isTestingCLI                    Enable CLI testing (no scripts run)
  --isTesting                           Enable testing mode (no scripts run)
  --init                                Initialize Pastoralist configuration interactively
  --checkSecurity                       Check for security vulnerabilities and generate overrides
  --forceSecurityRefactor               Automatically apply security overrides without prompting
  --securityProvider <provider...>      Security provider(s) to use (osv, github, snyk, npm, socket)
  --securityProviderToken <token>       Security provider token for API access
  --interactive                         Run security checks in interactive mode
  --hasWorkspaceSecurityChecks          Include workspace packages in security scan
  --promptForReasons                    Prompt for reasons when adding manual overrides
`;

export const ARGS_START_INDEX = 2;
