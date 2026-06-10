var e=`---
title: API Reference
description: Complete reference for pastoralist CLI and Node.js API
---

Pastoralist provides both a CLI interface and a Node.js API for programmatic usage.

:::tip[Configuration Files]
Most CLI options can be configured using config files. See the [Configuration](/docs/configuration) documentation for details on using \`.pastoralistrc\`, \`pastoralist.config.js\`, or \`package.json\` for persistent settings.
:::

## CLI

### \`pastoralist\`

Run pastoralist on the current directory's package.json.

\`\`\`bash
npx pastoralist
\`\`\`

### \`pastoralist doctor\`

Run a read-only setup and override health check. This command enables dry-run
summary mode and does not modify \`package.json\`.

\`\`\`bash
npx pastoralist doctor
\`\`\`

### \`pastoralist --path <path>\`

Run pastoralist on a specific package.json file.

**params:**

- \`<path>\`: path to a package.json file

\`\`\`bash
# Run on a specific package
npx pastoralist --path packages/app/package.json

# Run on a nested project
npx pastoralist --path ./nested/project/package.json
\`\`\`

### \`pastoralist --depPaths [paths...]\`

Run pastoralist on multiple package.json files using glob patterns.

**params:**

- \`[paths...]\`: array of glob patterns

\`\`\`bash
# Run on all packages in monorepo
npx pastoralist --depPaths "packages/*/package.json"

# Run on multiple directories
npx pastoralist --depPaths "packages/*/package.json" "apps/*/package.json"
\`\`\`

### \`pastoralist --ignore [patterns...]\`

Exclude files matching glob patterns.

**params:**

- \`[patterns...]\`: array of glob patterns to ignore

\`\`\`bash
# Ignore test directories
npx pastoralist --ignore "**/test/**" "**/dist/**"

# Ignore specific packages
npx pastoralist --depPaths "**/*package.json" --ignore "**/node_modules/**" "**/legacy/**"
\`\`\`

### \`pastoralist --root <root>\`

Set the root directory for all operations.

**params:**

- \`<root>\`: root directory path

\`\`\`bash
# Run from different directory
npx pastoralist --root /path/to/project

# Combine with other options
npx pastoralist --root ../my-project --path package.json
\`\`\`

### \`pastoralist --init\`

Initialize configuration with the guided setup. The wizard can configure
workspace paths, security scanning, and where the configuration should be saved.

\`\`\`bash
# Start interactive setup
npx pastoralist --init
\`\`\`

When run, this will:

- Detect \`workspaces\` entries from \`package.json\`
- Prompt for \`depPaths: "workspace"\` or custom package globs
- Offer security provider and severity threshold setup
- Save configuration to \`package.json\` or a supported config file

### \`pastoralist --interactive\`

Review security fixes interactively. Use this with \`--checkSecurity\` when you
want to approve fixes instead of applying everything with \`--forceSecurityRefactor\`.

\`\`\`bash
# Review security fixes before applying them
npx pastoralist --checkSecurity --interactive
\`\`\`

### \`pastoralist --debug\`

Enable detailed debug output.

\`\`\`bash
npx pastoralist --debug
\`\`\`

### \`pastoralist --dry-run\`

Preview changes without modifying package.json.

\`\`\`bash
npx pastoralist --dry-run
\`\`\`

### \`pastoralist --outputFormat json\`

Return machine-readable output for CI or custom tooling.

\`\`\`bash
npx pastoralist --summary --outputFormat json
\`\`\`

### \`pastoralist --quiet\`

Quiet mode for CI pipelines. Outputs minimal text and uses exit codes.

- Exit 0: No vulnerabilities found
- Exit 1: Vulnerabilities detected

\`\`\`bash
npx pastoralist --quiet --checkSecurity
\`\`\`

### \`pastoralist --summary\`

Display metrics table after run.

\`\`\`bash
npx pastoralist --summary
\`\`\`

### \`pastoralist --setup-hook\`

Add pastoralist to your postinstall script automatically.

\`\`\`bash
npx pastoralist --setup-hook
\`\`\`

### \`pastoralist --remove-unused\`

Remove overrides that no package in your project depends on. When Pastoralist detects unused overrides during a run, it displays a notice suggesting this flag.

\`\`\`bash
npx pastoralist --remove-unused
\`\`\`

### \`pastoralist --checkSecurity\`

Enable security vulnerability scanning.

\`\`\`bash
npx pastoralist --checkSecurity
\`\`\`

### \`pastoralist --securityProvider <provider...>\`

Choose one or more security providers. Supported values are \`osv\`, \`github\`,
\`npm\`, \`snyk\`, \`socket\`, and \`spektion\`.

\`\`\`bash
npx pastoralist --checkSecurity --securityProvider osv npm
\`\`\`

### \`pastoralist --forceSecurityRefactor\`

Apply security override fixes without prompting.

\`\`\`bash
npx pastoralist --checkSecurity --forceSecurityRefactor
\`\`\`

### \`pastoralist --strict\`

Fail when a security provider, network request, or API call cannot complete.

\`\`\`bash
npx pastoralist --checkSecurity --strict
\`\`\`

### Cache Options

Control provider cache behavior for security checks.

\`\`\`bash
npx pastoralist --checkSecurity --cache-dir .cache/pastoralist
npx pastoralist --checkSecurity --cache-ttl 3600
npx pastoralist --checkSecurity --no-cache
npx pastoralist --checkSecurity --refresh-cache
\`\`\`

## Node.js API

### Installation

\`\`\`bash
npm install pastoralist
\`\`\`

### \`update(options)\`

Update \`package.json\` overrides and the appendix. Each appendix entry includes a
\`ledger\` with at least \`addedDate\`; security metadata is added when security
checks run. This is a low-level API: pass the parsed \`package.json\` as \`config\`.
The CLI handles config loading for normal command-line use. \`update()\` is
synchronous and returns an \`UpdateContext\`, so the examples below intentionally
do not use \`await\`.

**params:**

- \`options\`: configuration object
  - \`path\`: path to package.json (default: './package.json')
  - \`config\`: parsed package.json content
  - \`depPaths\`: array of glob patterns for multiple files
  - \`ignore\`: array of glob patterns to ignore
  - \`root\`: root directory path
  - \`debug\`: enable debug logging
  - \`dryRun\`: preview changes without writing package.json
  - \`summary\`: include summary metrics
  - \`removeUnused\`: remove overrides with no active dependents
  - \`checkSecurity\`: enable security checks
  - \`securityProvider\`: security provider to use
  - \`forceSecurityRefactor\`: apply security fixes without prompting
  - \`strict\`: fail on security provider errors

\`\`\`javascript
import { resolveJSON, update } from "pastoralist";

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
\`\`\`

### \`logger(config)\`

Create a logger instance for custom debugging.

**params:**

- \`config\`: logger configuration
  - \`file\`: source file name
  - \`isLogging\`: enable/disable logging

\`\`\`javascript
import { logger } from "pastoralist";

// Create logger
const log = logger({
  file: "my-script.js",
  isLogging: true,
});

// Use logger
log.debug("starting action", "method-name", { data: "value" });
log.error("unexpected error", "method-name", { error: err });
\`\`\`

## Examples

### Build Tool Integration

\`\`\`javascript
import { resolveJSON, update } from "pastoralist";

const path = "./package.json";
const config = resolveJSON(path);

// Ensure overrides are up-to-date before building
if (config) {
  update({ config, path });
  console.log("Package overrides verified");
}
\`\`\`

### Workspace Automation

\`\`\`javascript
import { resolveJSON, update } from "pastoralist";
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
\`\`\`

### CI/CD Validation

\`\`\`javascript
import { resolveJSON, update } from "pastoralist";
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
\`\`\`

### Custom Logger

\`\`\`javascript
import { logger, resolveJSON, update } from "pastoralist";

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
\`\`\`

### Error Handling

\`\`\`javascript
import { resolveJSON, update } from "pastoralist";

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
\`\`\`

## Environment Variables

### \`DEBUG=true\`

Enable debug output (equivalent to --debug flag).

\`\`\`bash
DEBUG=true npx pastoralist
\`\`\`

## TypeScript

Pastoralist includes full TypeScript support.

\`\`\`typescript
import { resolveJSON, update, type Options } from "pastoralist";

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
\`\`\`
`;export{e as default};