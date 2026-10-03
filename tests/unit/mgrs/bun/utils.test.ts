import { readBunResolvedGraph } from "../../../../src/mgrs/bun/utils";
import { registerResolvedGraphTests } from "../dependency-tracking.test-utils";

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

const fixture = {
  name: "Bun",
  filename: "bun.lock",
  content: bunLock,
};

registerResolvedGraphTests(fixture, readBunResolvedGraph);
