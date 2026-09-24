import type { OptionDefinition } from "./types";

const option = (flags: string[], settings: Omit<OptionDefinition, "flags">): OptionDefinition => {
  const definition = Object.assign({ flags }, settings);
  return definition;
};

export const OPTION_DEFINITIONS: OptionDefinition[] = [
  option(["-h", "--help"], { hasValue: false }),
  option(["-v", "--version"], { hasValue: false }),
  option(["--debug"], { hasValue: false }),
  option(["--dry-run"], { hasValue: false }),
  option(["--outputFormat"], { hasValue: true, defaultValue: "text" }),
  option(["-p", "--path"], { hasValue: true, defaultValue: "package.json" }),
  option(["-d", "--depPaths"], { hasValue: true, isArray: true }),
  option(["--ignore"], { hasValue: true, isArray: true }),
  option(["-r", "--root"], { hasValue: true }),
  option(["-t", "--isTestingCLI"], { hasValue: false }),
  option(["--isTesting"], { hasValue: false }),
  option(["--init"], { hasValue: true, isArray: true, emptyValue: true }),
  option(["--checkSecurity"], { hasValue: false }),
  option(["--forceSecurityRefactor"], { hasValue: false }),
  option(["--securityProvider"], { hasValue: true, isArray: true }),
  option(["--securityProviderToken"], { hasValue: true }),
  option(["--interactive"], { hasValue: false }),
  option(["--hasWorkspaceSecurityChecks"], { hasValue: false }),
  option(["--promptForReasons"], { hasValue: false }),
  option(["--strict"], { hasValue: false }),
  option(["--summary"], { hasValue: false }),
  option(["--styleguide"], { hasValue: false }),
  option(["--onboard", "--onboarding"], { hasValue: false }),
  option(["-q", "--quiet"], { hasValue: false }),
  option(["--setup-hook"], { hasValue: false }),
  option(["--remove-unused"], { hasValue: false }),
  option(["--cache-dir"], { hasValue: true }),
  option(["--cache-ttl"], { hasValue: true }),
  option(["--no-cache"], { hasValue: false }),
  option(["--refresh-cache"], { hasValue: false }),
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
  --styleguide                          Render the Pastoralist DX component styleguide
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
