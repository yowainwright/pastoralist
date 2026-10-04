import type {
  DependencyManifestRoot,
  DependencyPackageInstance,
  TraversalContext,
  TraversalState,
} from "./types";

export const recordPackageUsage = (
  pkg: DependencyPackageInstance,
  directDependency: string,
  context: TraversalContext,
): void => {
  const names = [pkg.name].concat(pkg.dependencyNames ?? []);
  names.forEach((name) => addReachablePackage(context.reachable, name, directDependency));
};

export const hasVisitedState = (
  visited: Map<string, Set<string>>,
  state: TraversalState,
): boolean => Boolean(visited.get(state.packageId)?.has(state.directDependency));

export const markVisitedState = (
  visited: Map<string, Set<string>>,
  state: TraversalState,
): void => {
  const directDependencies = visited.get(state.packageId) ?? new Set<string>();
  directDependencies.add(state.directDependency);
  visited.set(state.packageId, directDependencies);
};

export const addReachablePackage = (
  reachable: Map<string, Set<string>>,
  packageName: string,
  directDependency: string,
): void => {
  const directDependencies = reachable.get(packageName) ?? new Set<string>();
  directDependencies.add(directDependency);
  reachable.set(packageName, directDependencies);
};

export const createTraversalContext = (): TraversalContext => {
  const reachable = new Map<string, Set<string>>();
  const visited = new Map<string, Set<string>>();
  const missing = new Set<string>();
  const context = { reachable, visited, missing };
  return context;
};

export const toReachablePackageRecord = (
  reachable: Map<string, Set<string>>,
): Record<string, string[]> => {
  const entries = Array.from(
    reachable,
    ([name, dependencies]) => [name, Array.from(dependencies).toSorted()] as const,
  );
  const record = Object.fromEntries(entries);
  return record;
};

export const createChildTraversalStates = (
  state: TraversalState,
  packageDependencies: string[],
): TraversalState[] => {
  const childStates = packageDependencies.map((packageId) =>
    Object.assign({}, state, { packageId }),
  );
  return childStates;
};

export const createRootTraversalStates = (root: DependencyManifestRoot): TraversalState[] => {
  const states = Object.entries(root.directDependencies).map(([directDependency, packageId]) => ({
    directDependency,
    packageId,
  }));
  return states;
};
