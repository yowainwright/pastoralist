export type UvPackage = {
  name: string;
  version: string;
  source: Record<string, unknown>;
  dependencies: Record<string, unknown>[];
  optionalDependencies: Record<string, Record<string, unknown>[]>;
  devDependencies: Record<string, unknown>[];
};

export type UvPackageIndex = Map<string, UvPackage[]>;

export type UvPackageContext = { pkg: UvPackage; extras: string[] };
