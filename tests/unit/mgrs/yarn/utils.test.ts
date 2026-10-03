import { readYarnResolvedGraph } from "../../../../src/mgrs/yarn/utils";
import { registerResolvedGraphTests } from "../dependency-tracking.test-utils";

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

const fixtures = [
  { name: "Yarn Classic", filename: "yarn.lock", content: yarnClassic },
  { name: "Yarn Berry", filename: "yarn.lock", content: yarnBerry },
];

registerResolvedGraphTests(fixtures, readYarnResolvedGraph);
