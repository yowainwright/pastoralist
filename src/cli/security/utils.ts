import type {
  Options,
  OverridesType,
  PastoralistJSON,
  RemovalVerification,
  SecurityAlert,
} from "../../types";
import type { SecurityChecker } from "../../core/security";
import type { SecurityCheckRuntimeOptions } from "../../core/security/types";
import { execFile as execFileCallback } from "node:child_process";
import { existsSync } from "node:fs";
import { copyFile, cp, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { promisify } from "node:util";
import {
  applyOverridesToConfig,
  detectPackageManager,
  type PackageManager,
} from "../../core/package";
import {
  applyOverridesToSourceConfig,
  resolveOverrideSource,
  type OverrideSource,
  updatePnpmWorkspaceOverrides,
} from "../../core/overrides";
import {
  extractPackageNames,
  findUnusedAppendixEntries,
  removeOverrideKeys,
} from "../../core/appendix/utils";
import { resolveWorkspaceManifestPaths } from "../../core/workspaces";
import { sync as globSync } from "../../utils/glob";

const execFile = promisify(execFileCallback);
const CANDIDATE_TIMEOUT_MS = 120_000;
const CANDIDATE_MAX_BUFFER = 10 * 1024 * 1024;
const RESOLVER_PATHS: Record<PackageManager, string[]> = {
  npm: [".npmrc"],
  pnpm: [".npmrc", ".pnpmfile.cjs", ".pnpmfile.js", "patches"],
  yarn: [".yarnrc", ".yarnrc.yml", ".yarn/plugins", ".yarn/releases", ".yarn/patches"],
  bun: ["bunfig.toml", "patches"],
};

type CandidateCommand = {
  command: string;
  args: string[];
};

export type CandidateResolverDeps = {
  execFile: typeof execFile;
};

const defaultCandidateDeps: CandidateResolverDeps = { execFile };

const getProjectRoot = (options: Options): string => {
  if (options.root) return resolve(options.root);
  if (options.path) return dirname(resolve(options.path));
  return resolve(".");
};

const getLockfileNames = (packageManager: PackageManager): string[] => {
  if (packageManager === "bun") return ["bun.lock", "bun.lockb"];
  if (packageManager === "pnpm") return ["pnpm-lock.yaml"];
  if (packageManager === "yarn") return ["yarn.lock"];
  return ["package-lock.json"];
};

const getSourceLockfile = (projectRoot: string, packageManager: PackageManager): string => {
  const lockfile = getLockfileNames(packageManager)
    .map((name) => join(projectRoot, name))
    .find(existsSync);
  if (lockfile) return lockfile;
  throw new Error(`No ${packageManager} lockfile is available for removal verification`);
};

const getCandidateCommand = (packageManager: PackageManager): CandidateCommand => {
  if (packageManager === "pnpm") {
    return { command: "pnpm", args: ["install", "--lockfile-only", "--ignore-scripts"] };
  }
  if (packageManager === "yarn") {
    return { command: "yarn", args: ["install", "--ignore-scripts", "--non-interactive"] };
  }
  if (packageManager === "bun") {
    return { command: "bun", args: ["install", "--lockfile-only", "--ignore-scripts"] };
  }
  return {
    command: "npm",
    args: ["install", "--package-lock-only", "--ignore-scripts", "--no-audit", "--no-fund"],
  };
};

const updatePnpmWorkspaceContent = (
  content: string,
  overrides: OverridesType | undefined,
): string => {
  if (!overrides) return content;
  return updatePnpmWorkspaceOverrides(content, overrides);
};

const stagePnpmWorkspace = async (
  projectRoot: string,
  candidateRoot: string,
  config: PastoralistJSON,
): Promise<void> => {
  const sourcePath = join(projectRoot, "pnpm-workspace.yaml");
  if (!existsSync(sourcePath)) return;
  const content = await readFile(sourcePath, "utf8");
  const overrides = config.pnpm?.overrides;
  const candidateContent = updatePnpmWorkspaceContent(content, overrides);
  await writeFile(join(candidateRoot, "pnpm-workspace.yaml"), candidateContent);
};

const copyWorkspaceManifest = async (
  manifestPath: string,
  projectRoot: string,
  candidateRoot: string,
): Promise<void> => {
  const relativePath = relative(projectRoot, manifestPath);
  const escapesProject = relativePath === ".." || relativePath.startsWith(`..${sep}`);
  const invalidTarget = escapesProject || isAbsolute(relativePath);
  if (invalidTarget) {
    throw new Error(`Workspace manifest is outside the project root: ${manifestPath}`);
  }
  const targetPath = join(candidateRoot, relativePath);
  await mkdir(dirname(targetPath), { recursive: true });
  await copyFile(manifestPath, targetPath);
};

const stageWorkspaceManifests = async (
  config: PastoralistJSON,
  projectRoot: string,
  candidateRoot: string,
): Promise<void> => {
  const patterns = resolveWorkspaceManifestPaths(config, projectRoot);
  const manifests = globSync(patterns, { cwd: projectRoot, absolute: true });
  await Promise.all(
    manifests.map((manifestPath) =>
      copyWorkspaceManifest(manifestPath, projectRoot, candidateRoot),
    ),
  );
};

const copyResolverPath = async (
  projectRoot: string,
  candidateRoot: string,
  resolverPath: string,
): Promise<void> => {
  const sourcePath = join(projectRoot, resolverPath);
  if (!existsSync(sourcePath)) return;
  const targetPath = join(candidateRoot, resolverPath);
  await mkdir(dirname(targetPath), { recursive: true });
  await cp(sourcePath, targetPath, { recursive: true });
};

const stageResolverConfig = async (
  projectRoot: string,
  candidateRoot: string,
  packageManager: PackageManager,
): Promise<void> => {
  const resolverPaths = RESOLVER_PATHS[packageManager];
  await Promise.all(
    resolverPaths.map((resolverPath) => copyResolverPath(projectRoot, candidateRoot, resolverPath)),
  );
};

const stageCandidateProject = async (
  config: PastoralistJSON,
  options: Options,
  candidateRoot: string,
): Promise<PackageManager> => {
  const projectRoot = getProjectRoot(options);
  const packageManager = detectPackageManager(projectRoot);
  const sourceLockfile = getSourceLockfile(projectRoot, packageManager);
  await writeFile(join(candidateRoot, "package.json"), JSON.stringify(config, null, 2));
  await copyFile(sourceLockfile, join(candidateRoot, basename(sourceLockfile)));
  await stageResolverConfig(projectRoot, candidateRoot, packageManager);
  if (packageManager === "pnpm") await stagePnpmWorkspace(projectRoot, candidateRoot, config);
  await stageWorkspaceManifests(config, projectRoot, candidateRoot);
  return packageManager;
};

const resolveCandidateLockfile = async (
  candidateRoot: string,
  packageManager: PackageManager,
  deps: CandidateResolverDeps,
): Promise<void> => {
  const command = getCandidateCommand(packageManager);
  const execOptions = {
    cwd: candidateRoot,
    timeout: CANDIDATE_TIMEOUT_MS,
    maxBuffer: CANDIDATE_MAX_BUFFER,
  };
  await deps.execFile(command.command, command.args, execOptions);
};

export const withCandidateDependencyState = async <T>(
  config: PastoralistJSON,
  options: Options,
  inspect: (candidateRoot: string) => Promise<T>,
  deps: CandidateResolverDeps = defaultCandidateDeps,
): Promise<T> => {
  const tempBase = join(tmpdir(), "pastoralist");
  await mkdir(tempBase, { recursive: true });
  const candidateRoot = await mkdtemp(join(tempBase, "removal-check-"));

  try {
    const packageManager = await stageCandidateProject(config, options, candidateRoot);
    await resolveCandidateLockfile(candidateRoot, packageManager, deps);
    return await inspect(candidateRoot);
  } finally {
    await rm(candidateRoot, { recursive: true, force: true });
  }
};

const getRootDependencies = (config: PastoralistJSON): Record<string, string> =>
  Object.assign({}, config.dependencies, config.devDependencies, config.peerDependencies);

const severityScore = (severity: string | undefined): number => {
  const scores: Record<string, number> = {
    low: 1,
    medium: 2,
    high: 3,
    critical: 4,
  };
  const normalizedSeverity = severity?.toLowerCase() || "";
  const score = scores[normalizedSeverity];
  return score || 0;
};

const getRiskScore = (alerts: SecurityAlert[]): number =>
  alerts.reduce((score, alert) => {
    const alertRisk = severityScore(alert.severity);
    return score + alertRisk;
  }, 0);

const getAlertAdvisory = (alert: SecurityAlert): string => {
  if (alert.cves?.length) return alert.cves.slice().sort().join(",");
  if (alert.title) return alert.title;
  if (alert.description) return alert.description;
  return alert.vulnerableVersions || "";
};

const getAlertKey = (alert: SecurityAlert): string =>
  `${alert.packageName}@${alert.currentVersion}:${getAlertAdvisory(alert)}`;

const getNewVulnerabilityKeys = (
  beforeAlerts: SecurityAlert[],
  afterAlerts: SecurityAlert[],
): string[] => {
  const beforeKeys = new Set(beforeAlerts.map(getAlertKey));
  return afterAlerts.map(getAlertKey).filter((key) => !beforeKeys.has(key));
};

const getManifestPath = (options: Options): string => {
  if (!options.path) return resolve(options.root || ".", "package.json");
  if (!options.root) return resolve(options.path);
  return resolve(options.root, options.path);
};

const getOverrideSource = (config: PastoralistJSON, options: Options): OverrideSource =>
  resolveOverrideSource({ config, manifestPath: getManifestPath(options) });

const getCandidateRemovalKeys = (
  config: PastoralistJSON,
  options: Options,
  source: OverrideSource,
): string[] => {
  const appendix = config.pastoralist?.appendix || {};
  const skipKeys = new Set(options.skipRemovalKeys || []);
  const overrideNames = new Set(Object.keys(source.overrides));
  return findUnusedAppendixEntries(appendix, getRootDependencies(config)).filter(
    (key) => !skipKeys.has(key) && overrideNames.has(extractPackageNames([key])[0]),
  );
};

const createCandidateConfig = (
  config: PastoralistJSON,
  removableKeys: string[],
  source: OverrideSource,
): PastoralistJSON => {
  const packageNames = extractPackageNames(removableKeys);
  const overrides = removeOverrideKeys(source.overrides, packageNames);
  if (source.kind !== "yaml") {
    return applyOverridesToSourceConfig(config, source, overrides);
  }
  return applyOverridesToConfig(config, overrides, "pnpm");
};

const getScanOptions = (config: PastoralistJSON, options: Options): SecurityCheckRuntimeOptions => {
  const security = config.pastoralist?.security;
  const scanOptions: SecurityCheckRuntimeOptions = Object.assign({}, options, {
    root: options.root || "./",
  });

  if (security?.excludePackages) scanOptions.excludePackages = security.excludePackages;
  if (security?.severityThreshold) scanOptions.severityThreshold = security.severityThreshold;

  return scanOptions;
};

const getBeforeAlerts = async (
  config: PastoralistJSON,
  securityChecker: SecurityChecker,
  options: Options,
): Promise<SecurityAlert[]> => {
  const scanOptions = Object.assign({}, getScanOptions(config, options), {
    interactive: false,
    requireCompleteScan: true,
    scanFullDependencyInventory: !options.isTesting,
  });
  const result = await securityChecker.checkSecurity(config, scanOptions);
  return result.alerts;
};

const getCandidateScanOptions = (
  config: PastoralistJSON,
  options: Options,
  root: string,
): SecurityCheckRuntimeOptions =>
  Object.assign({}, getScanOptions(config, options), {
    depPaths: [],
    interactive: false,
    refreshCache: true,
    requireCompleteScan: true,
    root,
    scanFullDependencyInventory: !options.isTesting,
    skipCacheWrite: true,
  });

const getAfterAlerts = async (
  config: PastoralistJSON,
  securityChecker: SecurityChecker,
  options: Options,
): Promise<SecurityAlert[]> => {
  const scanCandidate = async (root: string): Promise<SecurityAlert[]> => {
    const scanOptions = getCandidateScanOptions(config, options, root);
    const result = await securityChecker.checkSecurity(config, scanOptions);
    return result.alerts;
  };
  if (options.isTesting) return scanCandidate(options.root || "./");
  return withCandidateDependencyState(config, options, scanCandidate);
};

const getKeysForVulnerableRemovedPackages = (
  removableKeys: string[],
  alerts: SecurityAlert[],
): string[] => {
  const vulnerablePackageNames = new Set(alerts.map((alert) => alert.packageName));
  return removableKeys.filter((key) => {
    const [pkgName] = extractPackageNames([key]);
    return vulnerablePackageNames.has(pkgName);
  });
};

const unique = (values: string[]): string[] => Array.from(new Set(values));

const hasRegression = (
  beforeAlerts: SecurityAlert[],
  afterAlerts: SecurityAlert[],
  newVulnerabilityKeys: string[],
): boolean => {
  if (afterAlerts.length > beforeAlerts.length) return true;
  if (getRiskScore(afterAlerts) > getRiskScore(beforeAlerts)) return true;
  return newVulnerabilityKeys.length > 0;
};

const formatReasonKeys = (keys: string[], limit = 3): string => {
  const visibleKeys = keys.slice(0, limit).join(", ");
  const remainingCount = keys.length - limit;
  if (remainingCount <= 0) return visibleKeys;
  return `${visibleKeys} (+${remainingCount} more)`;
};

const buildBlockedReason = (
  beforeAlerts: SecurityAlert[],
  afterAlerts: SecurityAlert[],
  beforeRiskScore: number,
  afterRiskScore: number,
  newVulnerabilityKeys: string[],
  vulnerableRemovedKeys: string[],
): string | undefined => {
  if (newVulnerabilityKeys.length > 0) {
    return `New vulnerabilities detected after removal: ${formatReasonKeys(newVulnerabilityKeys)}.`;
  }
  if (afterRiskScore > beforeRiskScore) {
    return `Risk score increased from ${beforeRiskScore} to ${afterRiskScore} after removal.`;
  }
  if (afterAlerts.length > beforeAlerts.length) {
    return `Alert count increased from ${beforeAlerts.length} to ${afterAlerts.length} after removal.`;
  }
  if (vulnerableRemovedKeys.length === 0) return undefined;
  return `Removed overrides still resolve to vulnerable packages: ${formatReasonKeys(vulnerableRemovedKeys)}.`;
};

const buildComparison = (
  removableKeys: string[],
  beforeAlerts: SecurityAlert[],
  afterAlerts: SecurityAlert[],
): RemovalVerification => {
  const newVulnerabilityKeys = getNewVulnerabilityKeys(beforeAlerts, afterAlerts);
  const beforeRiskScore = getRiskScore(beforeAlerts);
  const afterRiskScore = getRiskScore(afterAlerts);
  const regressionKeys = hasRegression(beforeAlerts, afterAlerts, newVulnerabilityKeys)
    ? removableKeys
    : [];
  const vulnerableKeys = getKeysForVulnerableRemovedPackages(removableKeys, afterAlerts);
  const blockedKeys = unique(regressionKeys.concat(vulnerableKeys));
  const blockedSet = new Set(blockedKeys);
  const allowedKeys = removableKeys.filter((key) => !blockedSet.has(key));
  const status = blockedKeys.length > 0 ? "blocked" : "safe";
  const reason = buildBlockedReason(
    beforeAlerts,
    afterAlerts,
    beforeRiskScore,
    afterRiskScore,
    newVulnerabilityKeys,
    vulnerableKeys,
  );
  return {
    removableKeys,
    allowedKeys,
    blockedKeys,
    beforeAlertCount: beforeAlerts.length,
    afterAlertCount: afterAlerts.length,
    beforeRiskScore,
    afterRiskScore,
    newVulnerabilityKeys,
    status,
    reason,
  };
};

const buildFailedComparison = (
  removableKeys: string[],
  beforeAlerts: SecurityAlert[],
  error: unknown,
): RemovalVerification => {
  const failure = error instanceof Error ? error.message : String(error);
  const beforeRiskScore = getRiskScore(beforeAlerts);
  return {
    removableKeys,
    allowedKeys: [],
    blockedKeys: removableKeys,
    beforeAlertCount: beforeAlerts.length,
    afterAlertCount: beforeAlerts.length,
    beforeRiskScore,
    afterRiskScore: beforeRiskScore,
    newVulnerabilityKeys: [],
    status: "blocked",
    reason: `Candidate security scan failed: ${failure}`,
  };
};

type RemovalState = {
  allowedKeys: string[];
  blockedKeys: string[];
  afterAlerts: SecurityAlert[];
  blockedReasons: Array<{ key: string; reason: string }>;
};

type RemovalContext = {
  config: PastoralistJSON;
  source: OverrideSource;
  securityChecker: SecurityChecker;
  options: Options;
  beforeAlerts: SecurityAlert[];
};

const blockRemoval = (
  state: RemovalState,
  key: string,
  reason: string | undefined,
): RemovalState => {
  const blockedKeys = state.blockedKeys.concat(key);
  const blockedReason = { key, reason: reason || "Removal could not be verified." };
  const blockedReasons = state.blockedReasons.concat(blockedReason);
  return Object.assign({}, state, { blockedKeys, blockedReasons });
};

const verifyRemoval = async (
  context: RemovalContext,
  state: RemovalState,
  key: string,
): Promise<RemovalState> => {
  const allowedKeys = state.allowedKeys.concat(key);
  const candidateConfig = createCandidateConfig(context.config, allowedKeys, context.source);
  try {
    const afterAlerts = await getAfterAlerts(
      candidateConfig,
      context.securityChecker,
      context.options,
    );
    const comparison = buildComparison([key], state.afterAlerts, afterAlerts);
    if (comparison.blockedKeys.length > 0) return blockRemoval(state, key, comparison.reason);
    return Object.assign({}, state, { allowedKeys, afterAlerts });
  } catch (error) {
    const comparison = buildFailedComparison([key], state.afterAlerts, error);
    return blockRemoval(state, key, comparison.reason);
  }
};

const verifyRemovalSet = async (
  context: RemovalContext,
  removableKeys: string[],
): Promise<RemovalState> => {
  const initialState: RemovalState = {
    allowedKeys: [],
    blockedKeys: [],
    afterAlerts: context.beforeAlerts,
    blockedReasons: [],
  };
  return removableKeys.reduce(
    async (pendingState, key) => verifyRemoval(context, await pendingState, key),
    Promise.resolve(initialState),
  );
};

const formatBlockedReasons = (
  blockedReasons: RemovalState["blockedReasons"],
): string | undefined => {
  if (blockedReasons.length === 0) return undefined;
  if (blockedReasons.length === 1) return blockedReasons[0].reason;
  return blockedReasons.map(({ key, reason }) => `${key}: ${reason}`).join(" ");
};

const buildVerification = (
  removableKeys: string[],
  beforeAlerts: SecurityAlert[],
  state: RemovalState,
): RemovalVerification => {
  const beforeRiskScore = getRiskScore(beforeAlerts);
  const afterRiskScore = getRiskScore(state.afterAlerts);
  const newVulnerabilityKeys = getNewVulnerabilityKeys(beforeAlerts, state.afterAlerts);
  const status = state.blockedKeys.length > 0 ? "blocked" : "safe";
  const reason = formatBlockedReasons(state.blockedReasons);
  return {
    removableKeys,
    allowedKeys: state.allowedKeys,
    blockedKeys: state.blockedKeys,
    beforeAlertCount: beforeAlerts.length,
    afterAlertCount: state.afterAlerts.length,
    beforeRiskScore,
    afterRiskScore,
    newVulnerabilityKeys,
    status,
    reason,
  };
};

export const verifyRemovals = async (
  config: PastoralistJSON,
  securityChecker: SecurityChecker,
  mergedOptions: Options,
): Promise<RemovalVerification | undefined> => {
  const source = getOverrideSource(config, mergedOptions);
  const removableKeys = getCandidateRemovalKeys(config, mergedOptions, source);
  if (removableKeys.length === 0) return undefined;

  const beforeAlerts = await getBeforeAlerts(config, securityChecker, mergedOptions);
  const context = { config, source, securityChecker, options: mergedOptions, beforeAlerts };
  const state = await verifyRemovalSet(context, removableKeys);
  return buildVerification(removableKeys, beforeAlerts, state);
};
