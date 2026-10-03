import type {
  DependencyManifestRoot,
  DependencyReachability,
  DependencyTracking,
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
  toReachablePackageRecord,
} from "./utils";

export type {
  DependencyManifestRoot,
  DependencyManifest,
  DependencyPackageInstance,
  DependencyReachability,
  DependencyTracking,
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
  addReachablePackage(context.reachable, pkg.name, state.directDependency);

  const childStates = createChildTraversalStates(state, pkg.dependencies);
  return childStates;
};

const findRootReachability = (
  root: DependencyManifestRoot,
  packages: ResolvedDependencyGraph["packages"],
): TrackedDependencies => {
  const context = createTraversalContext();
  let frontier = createRootTraversalStates(root);
  while (frontier.length > 0) {
    frontier = frontier.flatMap((state) => visitTraversalState(state, packages, context));
  }
  const dependents = toReachablePackageRecord(context.reachable);
  const complete = context.missing.size === 0;
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

export const findDependencyReachability = (
  graph: ResolvedDependencyGraph,
): DependencyReachability => {
  const tracking = trackDependencies(graph);
  const entries = Object.entries(tracking).map(([path, result]) => [path, result.dependents]);
  const reachability = Object.fromEntries(entries);
  return reachability;
};
