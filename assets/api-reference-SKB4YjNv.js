import{n as e}from"./motion-CF4NsPJN.js";var t=e();function n(e){let n={a:`a`,code:`code`,h2:`h2`,h3:`h3`,li:`li`,p:`p`,pre:`pre`,strong:`strong`,ul:`ul`,...e.components};return(0,t.jsxs)(t.Fragment,{children:[(0,t.jsx)(n.p,{children:`Pastoralist provides both a CLI interface and a Node.js API for programmatic usage.`}),`
`,(0,t.jsxs)(n.p,{children:[`:::tip[Configuration Files]
Most CLI options can be configured using config files. See the `,(0,t.jsx)(n.a,{href:`/docs/configuration`,children:`Configuration`}),` documentation for details on using `,(0,t.jsx)(n.code,{children:`.pastoralistrc`}),`, `,(0,t.jsx)(n.code,{children:`pastoralist.config.js`}),`, or `,(0,t.jsx)(n.code,{children:`package.json`}),` for persistent settings.
:::`]}),`
`,(0,t.jsx)(n.h2,{id:`cli`,children:`CLI`}),`
`,(0,t.jsx)(n.h3,{id:`pastoralist`,children:(0,t.jsx)(n.code,{children:`pastoralist`})}),`
`,(0,t.jsx)(n.p,{children:`Run pastoralist on the current directory's package.json.`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-bash`,children:`npx pastoralist
`})}),`
`,(0,t.jsx)(n.h3,{id:`pastoralist-doctor`,children:(0,t.jsx)(n.code,{children:`pastoralist doctor`})}),`
`,(0,t.jsxs)(n.p,{children:[`Run a read-only setup and override health check. This command enables dry-run
summary mode and does not modify `,(0,t.jsx)(n.code,{children:`package.json`}),`.`]}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-bash`,children:`npx pastoralist doctor
`})}),`
`,(0,t.jsx)(n.h3,{id:`pastoralist-onboard`,children:(0,t.jsx)(n.code,{children:`pastoralist onboard`})}),`
`,(0,t.jsx)(n.p,{children:`Print a first-run onboarding checklist with initial local usage, agent setup,
and GitHub Action setup.`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-bash`,children:`npx pastoralist onboard
`})}),`
`,(0,t.jsx)(n.h3,{id:`pastoralist---path-path`,children:(0,t.jsx)(n.code,{children:`pastoralist --path <path>`})}),`
`,(0,t.jsx)(n.p,{children:`Run pastoralist on a specific package.json file.`}),`
`,(0,t.jsx)(n.p,{children:(0,t.jsx)(n.strong,{children:`params:`})}),`
`,(0,t.jsxs)(n.ul,{children:[`
`,(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.code,{children:`<path>`}),`: path to a package.json file`]}),`
`]}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-bash`,children:`# Run on a specific package
npx pastoralist --path packages/app/package.json

# Run on a nested project
npx pastoralist --path ./nested/project/package.json
`})}),`
`,(0,t.jsx)(n.h3,{id:`pastoralist---deppaths-paths`,children:(0,t.jsx)(n.code,{children:`pastoralist --depPaths [paths...]`})}),`
`,(0,t.jsx)(n.p,{children:`Run pastoralist on multiple package.json files using glob patterns.`}),`
`,(0,t.jsx)(n.p,{children:(0,t.jsx)(n.strong,{children:`params:`})}),`
`,(0,t.jsxs)(n.ul,{children:[`
`,(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.code,{children:`[paths...]`}),`: array of glob patterns`]}),`
`]}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-bash`,children:`# Run on all packages in monorepo
npx pastoralist --depPaths "packages/*/package.json"

# Run on multiple directories
npx pastoralist --depPaths "packages/*/package.json" "apps/*/package.json"
`})}),`
`,(0,t.jsx)(n.h3,{id:`pastoralist---ignore-patterns`,children:(0,t.jsx)(n.code,{children:`pastoralist --ignore [patterns...]`})}),`
`,(0,t.jsx)(n.p,{children:`Exclude files matching glob patterns.`}),`
`,(0,t.jsx)(n.p,{children:(0,t.jsx)(n.strong,{children:`params:`})}),`
`,(0,t.jsxs)(n.ul,{children:[`
`,(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.code,{children:`[patterns...]`}),`: array of glob patterns to ignore`]}),`
`]}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-bash`,children:`# Ignore test directories
npx pastoralist --ignore "**/test/**" "**/dist/**"

# Ignore specific packages
npx pastoralist --depPaths "**/*package.json" --ignore "**/node_modules/**" "**/legacy/**"
`})}),`
`,(0,t.jsx)(n.h3,{id:`pastoralist---root-root`,children:(0,t.jsx)(n.code,{children:`pastoralist --root <root>`})}),`
`,(0,t.jsx)(n.p,{children:`Set the root directory for all operations.`}),`
`,(0,t.jsx)(n.p,{children:(0,t.jsx)(n.strong,{children:`params:`})}),`
`,(0,t.jsxs)(n.ul,{children:[`
`,(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.code,{children:`<root>`}),`: root directory path`]}),`
`]}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-bash`,children:`# Run from different directory
npx pastoralist --root /path/to/project

# Combine with other options
npx pastoralist --root ../my-project --path package.json
`})}),`
`,(0,t.jsx)(n.h3,{id:`pastoralist---init`,children:(0,t.jsx)(n.code,{children:`pastoralist --init`})}),`
`,(0,t.jsx)(n.p,{children:`Initialize configuration with the guided setup. The wizard can configure
workspace paths, security scanning, and where the configuration should be saved.`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-bash`,children:`# Start interactive setup
npx pastoralist --init
`})}),`
`,(0,t.jsx)(n.p,{children:`When run, this will:`}),`
`,(0,t.jsxs)(n.ul,{children:[`
`,(0,t.jsxs)(n.li,{children:[`Detect `,(0,t.jsx)(n.code,{children:`workspaces`}),` entries from `,(0,t.jsx)(n.code,{children:`package.json`})]}),`
`,(0,t.jsxs)(n.li,{children:[`Prompt for `,(0,t.jsx)(n.code,{children:`depPaths: "workspace"`}),` or custom package globs`]}),`
`,(0,t.jsx)(n.li,{children:`Offer security provider and severity threshold setup`}),`
`,(0,t.jsxs)(n.li,{children:[`Save configuration to `,(0,t.jsx)(n.code,{children:`package.json`}),` or a supported config file`]}),`
`]}),`
`,(0,t.jsx)(n.h3,{id:`pastoralist---interactive`,children:(0,t.jsx)(n.code,{children:`pastoralist --interactive`})}),`
`,(0,t.jsxs)(n.p,{children:[`Review security fixes interactively. Use this with `,(0,t.jsx)(n.code,{children:`--checkSecurity`}),` when you
want to approve fixes instead of applying everything with `,(0,t.jsx)(n.code,{children:`--forceSecurityRefactor`}),`.`]}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-bash`,children:`# Review security fixes before applying them
npx pastoralist --checkSecurity --interactive
`})}),`
`,(0,t.jsx)(n.h3,{id:`pastoralist---debug`,children:(0,t.jsx)(n.code,{children:`pastoralist --debug`})}),`
`,(0,t.jsx)(n.p,{children:`Enable detailed debug output.`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-bash`,children:`npx pastoralist --debug
`})}),`
`,(0,t.jsx)(n.h3,{id:`pastoralist---dry-run`,children:(0,t.jsx)(n.code,{children:`pastoralist --dry-run`})}),`
`,(0,t.jsx)(n.p,{children:`Preview changes without modifying package.json.`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-bash`,children:`npx pastoralist --dry-run
`})}),`
`,(0,t.jsx)(n.h3,{id:`pastoralist---outputformat-json`,children:(0,t.jsx)(n.code,{children:`pastoralist --outputFormat json`})}),`
`,(0,t.jsx)(n.p,{children:`Return machine-readable output for CI or custom tooling.`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-bash`,children:`npx pastoralist --summary --outputFormat json
`})}),`
`,(0,t.jsx)(n.h3,{id:`pastoralist---quiet`,children:(0,t.jsx)(n.code,{children:`pastoralist --quiet`})}),`
`,(0,t.jsx)(n.p,{children:`Quiet mode for CI pipelines. Outputs minimal text and uses exit codes.`}),`
`,(0,t.jsxs)(n.ul,{children:[`
`,(0,t.jsx)(n.li,{children:`Exit 0: No vulnerabilities found`}),`
`,(0,t.jsx)(n.li,{children:`Exit 1: Vulnerabilities detected`}),`
`]}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-bash`,children:`npx pastoralist --quiet --checkSecurity
`})}),`
`,(0,t.jsx)(n.h3,{id:`pastoralist---summary`,children:(0,t.jsx)(n.code,{children:`pastoralist --summary`})}),`
`,(0,t.jsx)(n.p,{children:`Display metrics table after run.`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-bash`,children:`npx pastoralist --summary
`})}),`
`,(0,t.jsx)(n.h3,{id:`pastoralist---setup-hook`,children:(0,t.jsx)(n.code,{children:`pastoralist --setup-hook`})}),`
`,(0,t.jsx)(n.p,{children:`Add pastoralist to your postinstall script automatically.`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-bash`,children:`npx pastoralist --setup-hook
`})}),`
`,(0,t.jsx)(n.h3,{id:`pastoralist-setup-skill`,children:(0,t.jsx)(n.code,{children:`pastoralist-setup-skill`})}),`
`,(0,t.jsxs)(n.p,{children:[`Install the bundled Pastoralist agent skill into `,(0,t.jsx)(n.code,{children:`.agents/skills/pastoralist`}),`.`]}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-bash`,children:`npx -p pastoralist pastoralist-setup-skill
`})}),`
`,(0,t.jsx)(n.h3,{id:`pastoralist-setup-local-dev`,children:(0,t.jsx)(n.code,{children:`pastoralist-setup-local-dev`})}),`
`,(0,t.jsx)(n.p,{children:`Set up local agent config, selected skills, and selected local hooks.`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-bash`,children:`npx -p pastoralist pastoralist-setup-local-dev --dry-run
npx -p pastoralist pastoralist-setup-local-dev --skills all --hooks git,postinstall
`})}),`
`,(0,t.jsx)(n.h3,{id:`pastoralist---remove-unused`,children:(0,t.jsx)(n.code,{children:`pastoralist --remove-unused`})}),`
`,(0,t.jsx)(n.p,{children:`Remove overrides that no package in your project depends on. When Pastoralist detects unused overrides during a run, it displays a notice suggesting this flag.`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-bash`,children:`npx pastoralist --remove-unused
`})}),`
`,(0,t.jsx)(n.h3,{id:`pastoralist---checksecurity`,children:(0,t.jsx)(n.code,{children:`pastoralist --checkSecurity`})}),`
`,(0,t.jsx)(n.p,{children:`Enable security vulnerability scanning.`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-bash`,children:`npx pastoralist --checkSecurity
`})}),`
`,(0,t.jsx)(n.h3,{id:`pastoralist---securityprovider-provider`,children:(0,t.jsx)(n.code,{children:`pastoralist --securityProvider <provider...>`})}),`
`,(0,t.jsxs)(n.p,{children:[`Choose one or more security providers. Supported values are `,(0,t.jsx)(n.code,{children:`osv`}),`, `,(0,t.jsx)(n.code,{children:`github`}),`,
`,(0,t.jsx)(n.code,{children:`npm`}),`, `,(0,t.jsx)(n.code,{children:`snyk`}),`, `,(0,t.jsx)(n.code,{children:`socket`}),`, and `,(0,t.jsx)(n.code,{children:`spektion`}),`.`]}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-bash`,children:`npx pastoralist --checkSecurity --securityProvider osv npm
`})}),`
`,(0,t.jsx)(n.h3,{id:`pastoralist---forcesecurityrefactor`,children:(0,t.jsx)(n.code,{children:`pastoralist --forceSecurityRefactor`})}),`
`,(0,t.jsx)(n.p,{children:`Apply security override fixes without prompting.`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-bash`,children:`npx pastoralist --checkSecurity --forceSecurityRefactor
`})}),`
`,(0,t.jsx)(n.h3,{id:`pastoralist---strict`,children:(0,t.jsx)(n.code,{children:`pastoralist --strict`})}),`
`,(0,t.jsx)(n.p,{children:`Fail when a security provider, network request, or API call cannot complete.`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-bash`,children:`npx pastoralist --checkSecurity --strict
`})}),`
`,(0,t.jsx)(n.h3,{id:`cache-options`,children:`Cache Options`}),`
`,(0,t.jsx)(n.p,{children:`Control provider cache behavior for security checks.`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-bash`,children:`npx pastoralist --checkSecurity --cache-dir .cache/pastoralist
npx pastoralist --checkSecurity --cache-ttl 3600
npx pastoralist --checkSecurity --no-cache
npx pastoralist --checkSecurity --refresh-cache
`})}),`
`,(0,t.jsx)(n.h2,{id:`nodejs-api`,children:`Node.js API`}),`
`,(0,t.jsx)(n.h3,{id:`installation`,children:`Installation`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-bash`,children:`npm install pastoralist
`})}),`
`,(0,t.jsx)(n.h3,{id:`updateoptions`,children:(0,t.jsx)(n.code,{children:`update(options)`})}),`
`,(0,t.jsxs)(n.p,{children:[`Update `,(0,t.jsx)(n.code,{children:`package.json`}),` overrides and the appendix. Each appendix entry includes a
`,(0,t.jsx)(n.code,{children:`ledger`}),` with at least `,(0,t.jsx)(n.code,{children:`addedDate`}),`; security metadata is added when security
checks run. This is a low-level API: pass the parsed `,(0,t.jsx)(n.code,{children:`package.json`}),` as `,(0,t.jsx)(n.code,{children:`config`}),`.
The CLI handles config loading for normal command-line use. `,(0,t.jsx)(n.code,{children:`update()`}),` is
synchronous and returns an `,(0,t.jsx)(n.code,{children:`UpdateContext`}),`, so the examples below intentionally
do not use `,(0,t.jsx)(n.code,{children:`await`}),`.`]}),`
`,(0,t.jsx)(n.p,{children:(0,t.jsx)(n.strong,{children:`params:`})}),`
`,(0,t.jsxs)(n.ul,{children:[`
`,(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.code,{children:`options`}),`: configuration object`,`
`,(0,t.jsxs)(n.ul,{children:[`
`,(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.code,{children:`path`}),`: path to package.json (default: './package.json')`]}),`
`,(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.code,{children:`config`}),`: parsed package.json content`]}),`
`,(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.code,{children:`depPaths`}),`: array of glob patterns for multiple files`]}),`
`,(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.code,{children:`ignore`}),`: array of glob patterns to ignore`]}),`
`,(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.code,{children:`root`}),`: root directory path`]}),`
`,(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.code,{children:`debug`}),`: enable debug logging`]}),`
`,(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.code,{children:`dryRun`}),`: preview changes without writing package.json`]}),`
`,(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.code,{children:`summary`}),`: include summary metrics`]}),`
`,(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.code,{children:`removeUnused`}),`: remove overrides with no active dependents`]}),`
`,(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.code,{children:`checkSecurity`}),`: enable security checks`]}),`
`,(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.code,{children:`securityProvider`}),`: security provider to use`]}),`
`,(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.code,{children:`forceSecurityRefactor`}),`: apply security fixes without prompting`]}),`
`,(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.code,{children:`strict`}),`: fail on security provider errors`]}),`
`]}),`
`]}),`
`]}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-javascript`,children:`import { resolveJSON, update } from "pastoralist";

// Basic usage
const path = "./package.json";
const config = resolveJSON(path);

if (config) {
  update({ config, path });
}

// With specific path
const workspacePath = "./packages/app/package.json";
const workspaceConfig = resolveJSON(workspacePath);

if (workspaceConfig) {
  update({ config: workspaceConfig, path: workspacePath });
}

// With debug mode
if (config) {
  update({ config, path, debug: true });
}

// Multiple packages
if (config) {
  update({
    config,
    path,
    depPaths: ["packages/*/package.json"],
    ignore: ["**/test/**"],
  });
}
`})}),`
`,(0,t.jsx)(n.h3,{id:`loggerconfig`,children:(0,t.jsx)(n.code,{children:`logger(config)`})}),`
`,(0,t.jsx)(n.p,{children:`Create a logger instance for custom debugging.`}),`
`,(0,t.jsx)(n.p,{children:(0,t.jsx)(n.strong,{children:`params:`})}),`
`,(0,t.jsxs)(n.ul,{children:[`
`,(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.code,{children:`config`}),`: logger configuration`,`
`,(0,t.jsxs)(n.ul,{children:[`
`,(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.code,{children:`file`}),`: source file name`]}),`
`,(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.code,{children:`isLogging`}),`: enable/disable logging`]}),`
`]}),`
`]}),`
`]}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-javascript`,children:`import { logger } from "pastoralist";

// Create logger
const log = logger({
  file: "my-script.js",
  isLogging: true,
});

// Use logger
log.debug("starting action", "method-name", { data: "value" });
log.error("unexpected error", "method-name", { error: err });
`})}),`
`,(0,t.jsx)(n.h2,{id:`examples`,children:`Examples`}),`
`,(0,t.jsx)(n.h3,{id:`build-tool-integration`,children:`Build Tool Integration`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-javascript`,children:`import { resolveJSON, update } from "pastoralist";

const path = "./package.json";
const config = resolveJSON(path);

// Ensure overrides are up-to-date before building
if (config) {
  update({ config, path });
  console.log("Package overrides verified");
}
`})}),`
`,(0,t.jsx)(n.h3,{id:`workspace-automation`,children:`Workspace Automation`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-javascript`,children:`import { resolveJSON, update } from "pastoralist";
import glob from "glob";

// Update all workspace packages
const packages = glob.sync("packages/*/package.json");

for (const pkgPath of packages) {
  const pkg = resolveJSON(pkgPath);
  if (pkg) {
    update({ config: pkg, path: pkgPath });
    console.log(\`Updated \${pkgPath}\`);
  }
}
`})}),`
`,(0,t.jsx)(n.h3,{id:`cicd-validation`,children:`CI/CD Validation`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-javascript`,children:`import { resolveJSON, update } from "pastoralist";
import { execSync } from "child_process";

const path = "./package.json";
const config = resolveJSON(path);

// Check if overrides are up-to-date
const before = execSync("git status --porcelain").toString();
if (config) {
  update({ config, path });
}
const after = execSync("git status --porcelain").toString();

if (before !== after) {
  console.error("Package.json overrides need updating");
  process.exit(1);
}
`})}),`
`,(0,t.jsx)(n.h3,{id:`custom-logger`,children:`Custom Logger`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-javascript`,children:`import { logger, resolveJSON, update } from "pastoralist";

// Create custom logger
const log = logger({
  file: "my-script.js",
  isLogging: process.env.DEBUG === "true",
});

const path = "./package.json";
const config = resolveJSON(path);

// Log custom events
log.debug("starting", "custom-action", { time: Date.now() });

if (config) {
  update({ config, path, debug: true });
}

log.debug("completed", "custom-action", { time: Date.now() });
`})}),`
`,(0,t.jsx)(n.h3,{id:`error-handling`,children:`Error Handling`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-javascript`,children:`import { resolveJSON, update } from "pastoralist";

try {
  const path = "./package.json";
  const config = resolveJSON(path);
  if (!config) throw new Error("Package.json not found");
  update({ config, path });
} catch (error) {
  if (error.message === "Package.json not found") {
    console.error("Package.json not found");
  } else {
    console.error("Unexpected error:", error);
  }
}
`})}),`
`,(0,t.jsx)(n.h2,{id:`environment-variables`,children:`Environment Variables`}),`
`,(0,t.jsx)(n.h3,{id:`debugtrue`,children:(0,t.jsx)(n.code,{children:`DEBUG=true`})}),`
`,(0,t.jsx)(n.p,{children:`Enable debug output (equivalent to --debug flag).`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-bash`,children:`DEBUG=true npx pastoralist
`})}),`
`,(0,t.jsx)(n.h2,{id:`typescript`,children:`TypeScript`}),`
`,(0,t.jsx)(n.p,{children:`Pastoralist includes full TypeScript support.`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-typescript`,children:`import { resolveJSON, update, type Options } from "pastoralist";

const path = "./package.json";
const config = resolveJSON(path);

if (!config) {
  throw new Error("Package.json not found");
}

const options: Options = {
  config,
  path,
  debug: true,
};

update(options);
`})})]})}function r(e={}){let{wrapper:r}=e.components||{};return r?(0,t.jsx)(r,{...e,children:(0,t.jsx)(n,{...e})}):n(e)}export{r as default};