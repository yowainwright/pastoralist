import { relative } from "node:path";
import { findUnusedAppendixEntries } from "../core/appendix/utils";
import type { DependencyDiagnostic, TrackedDependencies } from "../core/dep-tracker";
import type { Options, RemovalVerification } from "../types";
import { pluralSuffix } from "../utils";
import type { CliGraph, UpdateContext } from "./types";

const describeReason = (reason: DependencyDiagnostic["reason"]): string => {
  if (reason === "missing-lockfile") return "Lockfile not found";
  if (reason === "unreadable-lockfile") return "Lockfile could not be read";
  if (reason === "invalid-or-unsupported-lockfile") return "Lockfile is invalid or unsupported";
  if (reason === "unreadable-manifest") return "Workspace manifest could not be read or parsed";
  if (reason === "missing-manifest-root")
    return "Workspace root could not be resolved from lockfile";
  return "Missing lockfile references";
};

const quoteReference = (reference: string): string => {
  const readable = reference.replaceAll("\0", "");
  const quoted = JSON.stringify(readable);
  return quoted;
};

const formatDiagnostic = (
  root: string,
  manifest: string,
  tracking: TrackedDependencies,
): string => {
  const workspace = JSON.stringify(relative(root, manifest));
  const diagnostic = tracking.diagnostic;
  const heading = `Dependency usage incomplete for ${workspace}`;
  if (!diagnostic) return heading;
  const lockfile = JSON.stringify(relative(root, diagnostic.lockfile));
  const reason = describeReason(diagnostic.reason);
  const references = tracking.missingReferences?.map(quoteReference).join(", ");
  const details = references ? `${reason}: ${references}` : reason;
  const message = `${heading}. Lockfile: ${lockfile}. ${details}. Overrides with unknown usage are retained.`;
  return message;
};

export const renderDependencyDiagnostics = (graph: CliGraph, ctx: UpdateContext): void => {
  const entries = Object.entries(ctx.dependencyTracking ?? {});
  entries.forEach(([manifest, tracking]) => {
    if (tracking.complete) return;
    graph.notice(formatDiagnostic(ctx.root, manifest, tracking));
  });
};

export const renderBlockedRemovalNotice = (graph: CliGraph, mergedOptions: Options): void => {
  const blockedKeys = mergedOptions.skipRemovalKeys || [];
  if (blockedKeys.length === 0) return;
  const count = blockedKeys.length;
  graph.notice(
    `${count} override${pluralSuffix(count)} kept after verification - ${blockedKeys.join(", ")}`,
  );
};

export const renderUnusedOverrideNotice = (
  graph: CliGraph,
  updateContext: UpdateContext,
  options: Options,
): void => {
  const unusedEntries = findUnusedAppendixEntries(updateContext.finalAppendix ?? {});
  const shouldSuggestRemoval = unusedEntries.length > 0 && !options.removeUnused;
  if (!shouldSuggestRemoval) return;
  const count = unusedEntries.length;
  graph.notice(
    `${count} unused override${pluralSuffix(count)} detected. Run with --remove-unused to clean up.`,
  );
};

export const renderRemovalVerification = (
  graph: CliGraph,
  comparison: RemovalVerification | undefined,
): void => {
  if (!comparison) return;

  const summary =
    `Removal verification: vulnerabilities ${comparison.beforeAlertCount} -> ${comparison.afterAlertCount}, ` +
    `risk ${comparison.beforeRiskScore} -> ${comparison.afterRiskScore}`;
  graph.notice(summary);
  graph.notice(getRemovalStatusMessage(comparison));
};

const getRemovalStatusMessage = (comparison: RemovalVerification): string => {
  const isSafe = comparison.status === "safe";
  if (isSafe) {
    const count = comparison.removableKeys.length;
    const message = `${count} unused override${pluralSuffix(count)} approved for cleanup.`;
    return message;
  }

  const isDeclined = comparison.status === "declined";
  if (isDeclined) {
    const count = comparison.blockedKeys.length;
    const message = `Cleanup of ${count} override${pluralSuffix(count)} declined by user.`;
    return message;
  }

  const blockedCount = comparison.blockedKeys.length;
  const reason = comparison.reason ? ` ${comparison.reason}` : "";
  const message = `${blockedCount} override${pluralSuffix(blockedCount)} kept after removal verification.${reason}`;
  return message;
};
