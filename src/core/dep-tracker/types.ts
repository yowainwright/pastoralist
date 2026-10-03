export type DependencyPackageInstance = {
  name: string;
  dependencies: string[];
  dependencyNames?: string[];
};

export type DependencyManifestRoot = {
  directDependencies: Record<string, string>;
};

export type DependencyManifest = {
  path: string;
  name?: string;
  dependencies: Record<string, string>;
};

export type TrackedDependencies = {
  dependents: Record<string, string[]>;
  complete: boolean;
  missingReferences?: string[];
  diagnostic?: DependencyDiagnostic;
};

export type DependencyDiagnostic = {
  lockfile: string;
  reason?:
    | "missing-lockfile"
    | "unreadable-lockfile"
    | "invalid-or-unsupported-lockfile"
    | "unreadable-manifest"
    | "missing-manifest-root";
};

export type DependencyDiagnosticReporter = (diagnostic: DependencyDiagnostic) => void;

export type DependencyTracking = Record<string, TrackedDependencies>;

export type DependencyUsage = "used" | "unused" | "unknown";

export type ResolvedDependencyGraph = {
  packages: Record<string, DependencyPackageInstance>;
  roots: Record<string, DependencyManifestRoot>;
};

export type DependencyReachability = Record<string, Record<string, string[]>>;

export type TraversalState = {
  packageId: string;
  directDependency: string;
};

export type TraversalContext = {
  reachable: Map<string, Set<string>>;
  visited: Map<string, Set<string>>;
  missing: Set<string>;
};
