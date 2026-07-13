import type { OptionDefinition } from "./types";

export const OPTION_DEFINITIONS: OptionDefinition[] = [
  { flags: ["-h", "--help"], hasValue: false },
  { flags: ["-v", "--version"], hasValue: false },
  { flags: ["--debug"], hasValue: false },
  { flags: ["--dry-run"], hasValue: false },
  { flags: ["--outputFormat"], hasValue: true, defaultValue: "text" },
  { flags: ["-p", "--path"], hasValue: true, defaultValue: "package.json" },
  { flags: ["-d", "--depPaths"], hasValue: true, isArray: true },
  { flags: ["--ignore"], hasValue: true, isArray: true },
  { flags: ["-r", "--root"], hasValue: true },
  { flags: ["-t", "--isTestingCLI"], hasValue: false },
  { flags: ["--isTesting"], hasValue: false },
  { flags: ["--init"], hasValue: true, isArray: true, emptyValue: true },
  { flags: ["--checkSecurity"], hasValue: false },
  { flags: ["--forceSecurityRefactor"], hasValue: false },
  { flags: ["--securityProvider"], hasValue: true, isArray: true },
  { flags: ["--securityProviderToken"], hasValue: true },
  { flags: ["--interactive"], hasValue: false },
  { flags: ["--hasWorkspaceSecurityChecks"], hasValue: false },
  { flags: ["--promptForReasons"], hasValue: false },
  { flags: ["--strict"], hasValue: false },
  { flags: ["--summary"], hasValue: false },
  { flags: ["--onboard", "--onboarding"], hasValue: false },
  { flags: ["-q", "--quiet"], hasValue: false },
  { flags: ["--setup-hook"], hasValue: false },
  { flags: ["--remove-unused"], hasValue: false },
  { flags: ["--cache-dir"], hasValue: true },
  { flags: ["--cache-ttl"], hasValue: true },
  { flags: ["--no-cache"], hasValue: false },
  { flags: ["--refresh-cache"], hasValue: false },
];

export const HELP_TEXT = `
Pastoralist - A utility CLI to manage your dependency overrides

Usage: pastoralist [command] [options]

Commands:
  onboard                               Show first-run setup, agent, and GitHub Action guidance
  init [config|agent-skill]             Initialize config or the Pastoralist agent skill
  doctor                                Run a read-only setup and override health check

Options:
  -v, --version                         Print the installed Pastoralist version
  --debug                               Enable debug mode
  --dry-run                             Preview changes without writing to package.json
  --outputFormat <format>               Output format: text (default) or json
  -p, --path <path>                     Specifies a path to a package.json (default: "package.json")
  -d, --depPaths [paths...]             Specifies glob paths to package.jsons
  --ignore [paths...]                   Specifies glob paths to ignore
  -r, --root <root>                     Specifies a root path
  -t, --isTestingCLI                    Enable CLI testing (no scripts run)
  --isTesting                           Enable testing mode (no scripts run)
  --init [type] [args...]               Initialize config or a named init target
  --checkSecurity                       Check for security vulnerabilities and generate overrides
  --forceSecurityRefactor               Automatically apply security overrides without prompting
  --securityProvider <provider...>      Security provider(s) to use (osv, github, snyk, npm, socket, spektion)
  --securityProviderToken <token>       Security provider token for API access
  --interactive                         Run security checks in interactive mode
  --hasWorkspaceSecurityChecks          Include workspace packages in security scan
  --promptForReasons                    Prompt for reasons when adding manual overrides
  --strict                              Fail on any security check errors (network failures, API errors)
  --summary                             Show summary metrics table after run
  --onboard, --onboarding               Show first-run onboarding guidance
  -q, --quiet                           Quiet mode for CI (exit 1 if vulnerabilities, 0 if clean)
  --setup-hook                          Add postinstall script to run pastoralist automatically
  --remove-unused                       Remove unused overrides from package.json
  --cache-dir <path>                    Cache directory (default: node_modules/.cache/pastoralist/)
  --cache-ttl <seconds>                 Override cache TTL in seconds
  --no-cache                            Bypass cache reads and writes
  --refresh-cache                       Bypass cache reads, force refresh (still writes)
`;

export const ARGS_START_INDEX = 2;
