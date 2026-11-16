import { existsSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import { isRecord } from "../../../utils";
import {
  trackDependencies,
  type DependencyDiagnostic,
  type DependencyManifest,
  type DependencyPackageInstance,
  type TrackedDependencies,
} from "../../../core/dep-tracker";
import { normalizeUvName, readUvToml, uvStrings, uvTable } from "../utils";
import type { UvPackage, UvPackageContext, UvPackageIndex } from "./types";

const packageReferences = (value: unknown): Record<string, unknown>[] => {
  const empty: Record<string, unknown>[] = [];
  if (value === undefined) return empty;
  const valid = Array.isArray(value) && value.every(isRecord);
  if (!valid) throw new Error("Invalid uv lockfile dependencies");
  return value;
};

const packageGroups = (value: unknown): Record<string, Record<string, unknown>[]> => {
  const entries = Object.entries(uvTable(value)).map(([name, group]) => [
    normalizeUvName(name),
    packageReferences(group),
  ]);
  const groups = Object.fromEntries(entries);
  return groups;
};

const parsePackage = (value: unknown): UvPackage => {
  const entry = uvTable(value);
  if (typeof entry.name !== "string") throw new Error("Invalid uv package name");
  if (typeof entry.version !== "string") throw new Error("Invalid uv package version");
  const name = normalizeUvName(entry.name);
  const { version } = entry;
  const source = uvTable(entry.source);
  const optionalDependencies = packageGroups(entry["optional-dependencies"]);
  const devDependencies = Object.values(uvTable(entry["dev-dependencies"])).flatMap((group) =>
    packageReferences(group),
  );
  const dependencies = packageReferences(entry.dependencies);
  const pkg = { name, version, source, dependencies, optionalDependencies, devDependencies };
  return pkg;
};

const packageId = (pkg: UvPackage, extras: string[]): string => {
  const source = Object.entries(pkg.source).toSorted(([left], [right]) =>
    left.localeCompare(right),
  );
  const id = JSON.stringify([pkg.name, pkg.version, source, extras]);
  return id;
};

const indexPackages = (packages: UvPackage[]): UvPackageIndex => {
  const index: UvPackageIndex = new Map();
  packages.forEach((pkg) => {
    const matches = index.get(pkg.name) ?? [];
    index.set(pkg.name, matches.concat(pkg));
  });
  return index;
};

const matchesReference = (pkg: UvPackage, reference: Record<string, unknown>): boolean => {
  const hasWrongVersion = reference.version !== undefined && pkg.version !== reference.version;
  if (hasWrongVersion) return false;
  if (reference.source === undefined) return true;
  const source = uvTable(reference.source);
  const matchesSource = Object.entries(source).every(([key, value]) => pkg.source[key] === value);
  return matchesSource;
};

const referenceName = (reference: Record<string, unknown>): string => {
  if (typeof reference.name !== "string") throw new Error("Invalid uv dependency name");
  const name = normalizeUvName(reference.name);
  return name;
};

const referencedPackages = (reference: Record<string, unknown>, index: UvPackageIndex) => {
  const name = referenceName(reference);
  const candidates = index.get(name) ?? [];
  const matches = candidates.filter((pkg) => matchesReference(pkg, reference));
  return matches;
};

const referenceExtras = (reference: Record<string, unknown>): string[] => {
  const normalized = uvStrings(reference.extra).map(normalizeUvName);
  const extras = Array.from(new Set(normalized)).toSorted();
  return extras;
};

const resolveReference = (reference: Record<string, unknown>, index: UvPackageIndex): string[] => {
  const matches = referencedPackages(reference, index);
  const extras = referenceExtras(reference);
  if (matches.length > 0) {
    const ids = matches.map((pkg) => packageId(pkg, extras));
    return ids;
  }
  const missing = [`missing:${JSON.stringify(reference)}`];
  return missing;
};

const graphEntry = (
  context: UvPackageContext,
  index: UvPackageIndex,
): [string, DependencyPackageInstance] => {
  const { pkg, extras } = context;
  const id = packageId(pkg, extras);
  const { name } = pkg;
  const optional = extras.flatMap((extra) => pkg.optionalDependencies[extra] ?? []);
  const references = pkg.dependencies.concat(optional);
  const dependencies = references.flatMap((reference) => resolveReference(reference, index));
  const instance = { name, dependencies };
  const entry: [string, DependencyPackageInstance] = [id, instance];
  return entry;
};

const allPackageReferences = (pkg: UvPackage): Record<string, unknown>[] => {
  const optional = Object.values(pkg.optionalDependencies).flat();
  const references = pkg.dependencies.concat(optional, pkg.devDependencies);
  return references;
};

const referenceContexts = (
  reference: Record<string, unknown>,
  index: UvPackageIndex,
): UvPackageContext[] => {
  const extras = referenceExtras(reference);
  const matches = referencedPackages(reference, index);
  const contexts = matches.map((pkg) => ({ pkg, extras }));
  return contexts;
};

const graphPackages = (locked: UvPackage[], index: UvPackageIndex) => {
  const references = locked.flatMap((pkg) => allPackageReferences(pkg));
  const referenced = references.flatMap((reference) => referenceContexts(reference, index));
  const extras: string[] = [];
  const defaults = locked.map((pkg) => ({ pkg, extras }));
  const contexts = defaults.concat(referenced);
  const entries = contexts.map((context) => [packageId(context.pkg, context.extras), context]);
  const unique: Record<string, UvPackageContext> = Object.fromEntries(entries);
  const graphEntries = Object.values(unique).map((context) => graphEntry(context, index));
  const packages = Object.fromEntries(graphEntries);
  return packages;
};

const matchesManifest = (pkg: UvPackage, manifest: DependencyManifest, root: string): boolean => {
  const path = relative(root, dirname(manifest.path)).replaceAll("\\", "/") || ".";
  const local = pkg.source.editable ?? pkg.source.virtual;
  const matches = pkg.name === manifest.name && local === path;
  return matches;
};

const groupRootReferences = (references: Record<string, unknown>[], index: UvPackageIndex) => {
  const grouped = new Map<string, string[]>();
  references.forEach((reference) => {
    const name = referenceName(reference);
    const current = grouped.get(name) ?? [];
    grouped.set(name, current.concat(resolveReference(reference, index)));
  });
  return grouped;
};

const rootDependencyEntries = (
  manifest: DependencyManifest,
  references: Record<string, unknown>[],
  index: UvPackageIndex,
): Array<[string, DependencyPackageInstance]> => {
  const grouped = groupRootReferences(references, index);
  const entries = Object.keys(manifest.dependencies).map(
    (name): [string, DependencyPackageInstance] => {
      const id = `${manifest.path}:${name}`;
      const dependencies = grouped.get(name) ?? [`missing:${name}`];
      const instance = { name, dependencies };
      const entry: [string, DependencyPackageInstance] = [id, instance];
      return entry;
    },
  );
  return entries;
};

const manifestGraph = (manifest: DependencyManifest, index: UvPackageIndex, root: string) => {
  const candidates = index.get(manifest.name ?? "") ?? [];
  const roots = candidates.filter((pkg) => matchesManifest(pkg, manifest, root));
  const references = roots.flatMap((pkg) => allPackageReferences(pkg));
  const entries = rootDependencyEntries(manifest, references, index);
  const packages = Object.fromEntries(entries);
  const directEntries = entries.map(([id, pkg]) => [pkg.name, id]);
  const directDependencies = Object.fromEntries(directEntries);
  const graphRoot = { directDependencies };
  const result = { packages, graphRoot };
  return result;
};

const snapshotTracking = (tracking: TrackedDependencies, lockfile: string): TrackedDependencies => {
  const diagnostic: DependencyDiagnostic = { lockfile, reason: "unverified-lockfile" };
  const result = Object.assign({}, tracking, { complete: false, diagnostic });
  return result;
};

const trackManifest = (
  manifest: DependencyManifest,
  graph: {
    packages: Record<string, DependencyPackageInstance>;
    index: UvPackageIndex;
    root: string;
  },
): [string, TrackedDependencies] => {
  const local = manifestGraph(manifest, graph.index, graph.root);
  const packages = Object.assign({}, graph.packages, local.packages);
  const { graphRoot } = local;
  const roots = { [manifest.path]: graphRoot };
  const tracking = trackDependencies({ packages, roots });
  const lockfile = resolve(graph.root, "uv.lock");
  const snapshot = snapshotTracking(tracking[manifest.path], lockfile);
  const entry: [string, TrackedDependencies] = [manifest.path, snapshot];
  return entry;
};

const readLockedTracking = (root: string, manifests: DependencyManifest[]) => {
  const path = resolve(root, "uv.lock");
  const lock = readUvToml(path);
  if (lock.version !== 1) throw new Error("Unsupported uv lockfile version");
  if (!Array.isArray(lock.package)) throw new Error("Missing uv lockfile packages");
  const locked = packageReferences(lock.package).map(parsePackage);
  const index = indexPackages(locked);
  const packages = graphPackages(locked, index);
  const graph = { packages, index, root };
  const trackingEntries = manifests.map((manifest) => trackManifest(manifest, graph));
  const tracking = Object.fromEntries(trackingEntries);
  const { length: packageCount } = locked;
  const result = { tracking, packageCount };
  return result;
};

const unknownTracking = (manifest: DependencyManifest, diagnostic: DependencyDiagnostic) => {
  const entries = Object.keys(manifest.dependencies).map((name) => [name, [name]]);
  const dependents = Object.fromEntries(entries);
  const tracking: TrackedDependencies = { dependents, complete: false, diagnostic };
  const entry: [string, TrackedDependencies] = [manifest.path, tracking];
  return entry;
};

export const readUvTracking = (root: string, manifests: DependencyManifest[]) => {
  try {
    const result = readLockedTracking(root, manifests);
    return result;
  } catch {
    const lockfile = resolve(root, "uv.lock");
    const reason = existsSync(lockfile) ? "invalid-or-unsupported-lockfile" : "missing-lockfile";
    const diagnostic: DependencyDiagnostic = { lockfile, reason };
    const entries = manifests.map((manifest) => unknownTracking(manifest, diagnostic));
    const tracking = Object.fromEntries(entries);
    const result = { tracking, packageCount: 0 };
    return result;
  }
};
