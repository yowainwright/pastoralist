import type {
  DependencyManifestRoot,
  DependencyReachability,
  DependencyTracking,
  DependencyUsage,
  TrackedDependencies,
  ResolvedDependencyGraph,
  TraversalContext,
  TraversalState,
} from "./types";
import {
  addReachablePackage,
  createChildTraversalStates,
  createRootTraversalStates,
  createTraversalContext,
  hasVisitedState,
  markVisitedState,
  recordPackageUsage,
  toReachablePackageRecord,
} from "./utils";

export type {
  DependencyDiagnostic,
  DependencyDiagnosticReporter,
  DependencyManifestRoot,
  DependencyManifest,
  DependencyPackageInstance,
  DependencyReachability,
  DependencyTracking,
  DependencyUsage,
  TrackedDependencies,
  ResolvedDependencyGraph,
} from "./types";

const visitTraversalState = (
  state: TraversalState,
  packages: ResolvedDependencyGraph["packages"],
  context: TraversalContext,
): TraversalState[] => {
  const alreadyVisited = hasVisitedState(context.visited, state);
  const noChildren: TraversalState[] = [];
  if (alreadyVisited) return noChildren;
  markVisitedState(context.visited, state);

  const pkg = packages[state.packageId];
  if (!pkg) {
    context.missing.add(state.packageId);
    return noChildren;
  }
  recordPackageUsage(pkg, state.directDependency, context);

  const childStates = createChildTraversalStates(state, pkg.dependencies);
  return childStates;
};

const findRootReachability = (
  root: DependencyManifestRoot,
  packages: ResolvedDependencyGraph["packages"],
): TrackedDependencies => {
  const context = createTraversalContext();
  let frontier = createRootTraversalStates(root);
  frontier.forEach(({ directDependency }) =>
    addReachablePackage(context.reachable, directDependency, directDependency),
  );
  while (frontier.length > 0) {
    frontier = frontier.flatMap((state) => visitTraversalState(state, packages, context));
  }
  const result = buildTrackingResult(context);
  return result;
};

const buildTrackingResult = (context: TraversalContext): TrackedDependencies => {
  const dependents = toReachablePackageRecord(context.reachable);
  const complete = context.missing.size === 0;
  if (!complete) {
    const missingReferences = Array.from(context.missing).toSorted();
    const incomplete = { dependents, complete, missingReferences };
    return incomplete;
  }
  const result = { dependents, complete };
  return result;
};

export const trackDependencies = (graph: ResolvedDependencyGraph): DependencyTracking => {
  const entries = Object.entries(graph.roots).map(
    ([rootId, root]) => [rootId, findRootReachability(root, graph.packages)] as const,
  );
  const result = Object.fromEntries(entries);
  return result;
};

export const getDependencyUsage = (
  name: string,
  tracking: TrackedDependencies | undefined,
): DependencyUsage => {
  if (!tracking) return "unknown";
  const hasDependents = Boolean(tracking.dependents[name]?.length);
  if (hasDependents) return "used";
  if (!tracking.complete) return "unknown";
  return "unused";
};

export const getProjectDependencyUsage = (
  name: string,
  tracking: DependencyTracking | undefined,
): DependencyUsage => {
  const manifests = Object.values(tracking ?? {});
  if (manifests.length === 0) return "unknown";
  const results = manifests.map((manifest) => getDependencyUsage(name, manifest));
  const usages = new Set(results);
  if (usages.has("used")) return "used";
  if (usages.has("unknown")) return "unknown";
  return "unused";
};

export const findDependencyReachability = (
  graph: ResolvedDependencyGraph,
): DependencyReachability => {
  const tracking = trackDependencies(graph);
  const entries = Object.entries(tracking).map(([path, result]) => [path, result.dependents]);
  const reachability = Object.fromEntries(entries);
  return reachability;
};
