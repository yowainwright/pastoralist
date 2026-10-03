import { readPnpmResolvedGraph } from "../../../../src/mgrs/pnpm/utils";
import { registerResolvedGraphTests } from "../dependency-tracking.test-utils";

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
const fixtures = [
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
];

registerResolvedGraphTests(fixtures, readPnpmResolvedGraph);
