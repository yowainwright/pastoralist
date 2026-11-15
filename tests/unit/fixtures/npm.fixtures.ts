export const BASE_NPM_PACKAGE_INFO = {
  "dist-tags": {
    latest: "4.17.21",
  },
  versions: {
    "4.17.0": {},
    "4.17.1": {},
    "4.17.10": {},
    "4.17.11": {},
    "4.17.15": {},
    "4.17.20": {},
    "4.17.21": {},
  },
} as const;

export const PRERELEASE_VERSIONS = {
  "5.0.0-beta.1": {},
  "5.0.0-alpha.1": {},
} as const;

export const MULTI_MAJOR_VERSIONS = {
  "1.0.0": {},
  "1.0.1": {},
  "1.1.0": {},
  "1.2.0": {},
  "1.2.1": {},
  "2.0.0": {},
  "2.0.1": {},
  "2.0.5": {},
} as const;

export const ZERO_MAJOR_VERSIONS = {
  "0.1.0": {},
  "0.2.0": {},
  "0.3.0": {},
  "0.4.0": {},
  "0.5.0": {},
} as const;

export const mockOkResponse = (data: unknown) =>
  ({
    ok: true,
    json: () => Promise.resolve(data),
  }) as Response;

export const mockNotFoundResponse = () =>
  ({
    ok: false,
    status: 404,
  }) as Response;

export const createNpmPackageInfo = (latest: string, versions: Record<string, object>) => ({
  "dist-tags": { latest },
  versions,
});

const npmLock = `{
  "lockfileVersion": 3,
  "packages": {
    "node_modules/express": { "version": "4.18.0" },
    "packages/pkg-a/node_modules/express": {
      "version": "5.0.0",
      "dependencies": { "bridge": "1.0.0" }
    },
    "packages/pkg-a/node_modules/express/node_modules/bridge": {
      "version": "1.0.0",
      "dependencies": { "lodash": "4.17.21" }
    },
    "node_modules/lodash": { "version": "4.17.21" }
  }
}`;

const npmGraphFixtures = {
  name: "npm",
  filename: "package-lock.json",
  content: npmLock,
};

const aliasContent = npmLock.replace(
  '"node_modules/lodash": {',
  '"node_modules/lodash": { "name": "lodash-fork",',
);
const npmAliasFixture = {
  name: "npm alias",
  filename: "package-lock.json",
  content: aliasContent,
};

export { npmGraphFixtures, npmAliasFixture };

const pnpmImporters = `importers:
  .:
    dependencies:
      express:
        specifier: ^4.18.0
        version: 4.18.0
  packages/pkg-a:
    dependencies:
      express:
        specifier: ^5.0.0
        version: 5.0.0
  packages/pkg-b:
    dependencies:
      express:
        specifier: ^4.18.0
        version: 4.18.0
`;

const pnpmPackages = `  express@4.18.0: {}
  express@5.0.0:
    dependencies:
      bridge: 1.0.0
  bridge@1.0.0:
    dependencies:
      lodash: 4.17.21
  lodash@4.17.21: {}
`;

const pnpmV9Content = `lockfileVersion: '9.0'\n${pnpmImporters}snapshots:\n${pnpmPackages}`;
const pnpmV6Content = `lockfileVersion: '6.0'\n${pnpmImporters}packages:\n${pnpmPackages.replace(/^  (?=\S)/gm, "  /")}`;
const pnpmV5Content = `lockfileVersion: 5.4\n${pnpmImporters}packages:\n${pnpmPackages.replace(/^  ([^ @]+)@/gm, "  /$1/")}`;
const pnpmAliasContent = pnpmV9Content
  .replace("lodash: 4.17.21", "lodash: lodash-fork@4.17.21")
  .replace("lodash@4.17.21:", "lodash-fork@4.17.21:");
const pnpmRegistryContent = pnpmV9Content
  .replace("version: 5.0.0", "version: work:5.0.0(peer@1.0.0)")
  .replace("express@5.0.0:", "express@work:5.0.0(peer@1.0.0):");
const pnpmScopedV5Content = pnpmV5Content.replaceAll("bridge", "@scope/bridge");
const pnpmScopedV6Content = pnpmV6Content
  .replaceAll("bridge", "@scope/bridge")
  .replaceAll("1.0.0", "1.0.0(@types/node@26.6.2)");
const pnpmScopedV9Content = pnpmV9Content
  .replaceAll("bridge", "@scope/bridge")
  .replaceAll("1.0.0", "1.0.0(@types/node@26.6.2)");
const pnpmGraphFixtures = [
  {
    name: "pnpm v9",
    filename: "pnpm-lock.yaml",
    content: pnpmV9Content,
  },
  {
    name: "pnpm v6",
    filename: "pnpm-lock.yaml",
    content: pnpmV6Content,
  },
  {
    name: "pnpm v5",
    filename: "pnpm-lock.yaml",
    content: pnpmV5Content,
  },
  {
    name: "pnpm alias",
    filename: "pnpm-lock.yaml",
    content: pnpmAliasContent,
  },
  {
    name: "pnpm named registry with peer context",
    filename: "pnpm-lock.yaml",
    content: pnpmRegistryContent,
  },
  {
    name: "pnpm v5 scoped package",
    filename: "pnpm-lock.yaml",
    content: pnpmScopedV5Content,
  },
  {
    name: "pnpm v6 scoped package with scoped peer context",
    filename: "pnpm-lock.yaml",
    content: pnpmScopedV6Content,
  },
  {
    name: "pnpm v9 scoped package with scoped peer context",
    filename: "pnpm-lock.yaml",
    content: pnpmScopedV9Content,
  },
];

export { pnpmGraphFixtures };

const yarnClassic = `express@^4.18.0:
  version "4.18.0"

express@^5.0.0:
  version "5.0.0"
  dependencies:
    bridge "1.0.0"

bridge@1.0.0:
  version "1.0.0"
  dependencies:
    lodash "4.17.21"

lodash@4.17.21:
  version "4.17.21"
`;

const yarnBerry = `__metadata:
  version: 8

"express@npm:^4.18.0":
  version: 4.18.0
  resolution: "express@npm:4.18.0"

"express@npm:^5.0.0":
  version: 5.0.0
  resolution: "express@npm:5.0.0"
  dependencies:
    bridge: "npm:1.0.0"

"bridge@npm:1.0.0":
  version: 1.0.0
  dependencies:
    lodash: "npm:4.17.21"

"lodash@npm:4.17.21":
  version: 4.17.21
`;

const yarnGraphFixtures = [
  { name: "Yarn Classic", filename: "yarn.lock", content: yarnClassic },
  { name: "Yarn Berry", filename: "yarn.lock", content: yarnBerry },
];

export { yarnGraphFixtures };

const bunLock = `{
  "lockfileVersion": 1,
  "workspaces": {
    "": { "name": "root-app", "dependencies": { "express": "^4.18.0" } },
    "packages/pkg-a": { "name": "pkg-a", "dependencies": { "express": "^5.0.0" } },
    "packages/pkg-b": { "name": "pkg-b", "dependencies": { "express": "^4.18.0" } }
  },
  "packages": {
    "express": ["express@4.18.0", "", {}],
    "pkg-a": ["pkg-a@workspace:packages/pkg-a"],
    "pkg-b": ["pkg-b@workspace:packages/pkg-b"],
    "pkg-a/express": ["express@5.0.0", "", { "dependencies": { "bridge": "1.0.0" } }],
    "pkg-a/express/bridge": ["bridge@1.0.0", "", { "dependencies": { "lodash": "4.17.21" } }],
    "lodash": ["lodash@4.17.21", "", {}]
  }
}`;

const bunGraphFixtures = {
  name: "Bun",
  filename: "bun.lock",
  content: bunLock,
};

export { bunGraphFixtures };
