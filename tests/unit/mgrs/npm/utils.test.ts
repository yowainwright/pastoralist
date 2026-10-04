import { readNpmResolvedGraph } from "../../../../src/mgrs/npm/utils";
import { registerResolvedGraphTests } from "../dependency-tracking.test-utils";

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

const fixture = {
  name: "npm",
  filename: "package-lock.json",
  content: npmLock,
};

const aliasContent = npmLock.replace(
  '"node_modules/lodash": {',
  '"node_modules/lodash": { "name": "lodash-fork",',
);
const aliasFixture = {
  name: "npm alias",
  filename: "package-lock.json",
  content: aliasContent,
};

registerResolvedGraphTests([fixture, aliasFixture], readNpmResolvedGraph);
