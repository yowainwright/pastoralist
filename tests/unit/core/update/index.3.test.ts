import { test, expect } from "bun:test";
import { update } from "../../../../src/core/update/index";
import type { Options, PastoralistJSON } from "../../../../src/types";

test("update - returns early context when no config provided", () => {
  const options: Options = {
    path: "package.json",
    root: "./",
    isTesting: true,
  };

  const result = update(options);

  expect(result.options).toEqual(options);
  expect(result.path).toBe("package.json");
  expect(result.root).toBe("./");
  expect(result.isTesting).toBe(true);
  expect(result.config).toBeUndefined();
});

test("update - processes simple override in root mode", () => {
  const config: PastoralistJSON = {
    name: "test-app",
    version: "1.0.0",
    dependencies: {
      lodash: "^4.17.20",
    },
    overrides: {
      lodash: "4.17.21",
    },
  };

  const options: Options = {
    config,
    isTesting: true,
    debug: false,
  };

  const result = update(options);

  expect(result.config).toBe(config);
  expect(result.overrides).toBeDefined();
  expect(result.overrides?.lodash).toBe("4.17.21");
  expect(result.appendix).toBeDefined();
  expect(result.mode?.mode).toBe("root");
});

test("update - merges security overrides with config overrides", () => {
  const config: PastoralistJSON = {
    name: "test-app",
    version: "1.0.0",
    dependencies: {
      lodash: "^4.17.20",
      express: "^4.17.0",
    },
    overrides: {
      lodash: "4.17.21",
    },
  };

  const options: Options = {
    config,
    securityOverrides: {
      express: "4.18.2",
    },
    isTesting: true,
  };

  const result = update(options);

  expect(result.overrides?.lodash).toBe("4.17.21");
  expect(result.overrides?.express).toBe("4.18.2");
});

test("update - determines workspace mode without file I/O", () => {
  const config: PastoralistJSON = {
    name: "monorepo-root",
    version: "1.0.0",
    workspaces: ["packages/*"],
    overrides: {
      react: "18.0.0",
    },
  };

  const options: Options = {
    config,
    depPaths: [],
    isTesting: true,
  };

  const result = update(options);

  expect(result.mode).toBeDefined();
  expect(result.overrides?.react).toBe("18.0.0");
});

test("update - detects patches when present", () => {
  const config: PastoralistJSON = {
    name: "test-app",
    version: "1.0.0",
    overrides: {
      lodash: "4.17.21",
    },
  };

  const options: Options = {
    config,
    root: "./",
    isTesting: true,
  };

  const result = update(options);

  expect(result.patchMap).toBeDefined();
  expect(typeof result.patchMap).toBe("object");
});

test("update - determines processing mode correctly", () => {
  const config: PastoralistJSON = {
    name: "test-app",
    version: "1.0.0",
    dependencies: {
      lodash: "^4.17.20",
    },
    overrides: {
      lodash: "4.17.21",
    },
  };

  const options: Options = {
    config,
    isTesting: true,
  };

  const result = update(options);

  expect(result.hasRootOverrides).toBe(true);
  expect(result.rootDeps).toBeDefined();
  expect(result.rootDeps?.lodash).toBe("^4.17.20");
  expect(result.missingInRoot).toBeDefined();
});

test("update - builds appendix with dependents", () => {
  const config: PastoralistJSON = {
    name: "my-app",
    version: "1.0.0",
    dependencies: {
      lodash: "^4.17.20",
    },
    overrides: {
      lodash: "4.17.21",
    },
  };

  const options: Options = {
    config,
    isTesting: true,
  };

  const result = update(options);

  expect(result.appendix).toBeDefined();
  const appendixKey = "lodash@4.17.21";
  expect(result.appendix?.[appendixKey]).toBeDefined();
  expect(result.appendix?.[appendixKey].dependents).toBeDefined();
});

test("update - handles empty overrides", () => {
  const config: PastoralistJSON = {
    name: "test-app",
    version: "1.0.0",
    dependencies: {
      lodash: "^4.17.20",
    },
  };

  const options: Options = {
    config,
    isTesting: true,
  };

  const result = update(options);

  expect(result.mode?.hasRootOverrides).toBe(false);
  expect(result.finalOverrides).toEqual({});
  expect(result.finalAppendix).toEqual({});
});

test("update - sets finalOverrides and finalAppendix in cleanup step", () => {
  const config: PastoralistJSON = {
    name: "test-app",
    version: "1.0.0",
    dependencies: {
      react: "^17.0.0",
    },
    overrides: {
      react: "18.0.0",
    },
  };

  const options: Options = {
    config,
    isTesting: true,
  };

  const result = update(options);

  expect(result.finalOverrides).toBeDefined();
  expect(result.finalAppendix).toBeDefined();
  expect(result.finalOverrides?.react).toBe("18.0.0");
});

test("update - skips write when isTesting is true", () => {
  const config: PastoralistJSON = {
    name: "test-app",
    version: "1.0.0",
    dependencies: {
      lodash: "^4.17.20",
    },
    overrides: {
      lodash: "4.17.21",
    },
  };

  const options: Options = {
    config,
    isTesting: true,
  };

  const result = update(options);

  expect(result.isTesting).toBe(true);
  expect(result.finalOverrides).toBeDefined();
  expect(result.finalAppendix).toBeDefined();
});

test("update - handles devDependencies", () => {
  const config: PastoralistJSON = {
    name: "test-app",
    version: "1.0.0",
    devDependencies: {
      jest: "^28.0.0",
    },
    overrides: {
      jest: "29.0.0",
    },
  };

  const options: Options = {
    config,
    isTesting: true,
  };

  const result = update(options);

  expect(result.appendix).toBeDefined();
  expect(result.appendix?.["jest@29.0.0"]).toBeDefined();
});

test("update - handles peerDependencies", () => {
  const config: PastoralistJSON = {
    name: "test-lib",
    version: "1.0.0",
    peerDependencies: {
      react: "^17.0.0",
    },
    overrides: {
      react: "18.0.0",
    },
  };

  const options: Options = {
    config,
    isTesting: true,
  };

  const result = update(options);

  expect(result.appendix).toBeDefined();
  expect(result.rootDeps?.react).toBe("^17.0.0");
});

test("update - handles nested overrides", () => {
  const config: PastoralistJSON = {
    name: "test-app",
    version: "1.0.0",
    dependencies: {
      react: "^18.0.0",
    },
    overrides: {
      react: {
        "react-dom": "18.2.0",
      },
    },
  };

  const options: Options = {
    config,
    isTesting: true,
  };

  const result = update(options);

  expect(result.appendix).toBeDefined();
});

test("update - includes security override details in appendix", () => {
  const config: PastoralistJSON = {
    name: "test-app",
    version: "1.0.0",
    dependencies: {
      lodash: "^4.17.20",
    },
  };

  const options: Options = {
    config,
    securityOverrides: {
      lodash: "4.17.21",
    },
    securityOverrideDetails: [
      {
        packageName: "lodash",
        reason: "Security vulnerability CVE-2021-23337",
        cve: "CVE-2021-23337",
        severity: "high",
      },
    ],
    securityProvider: "osv",
    isTesting: true,
  };

  const result = update(options);

  expect(result.appendix).toBeDefined();
  const appendixEntry = result.appendix?.["lodash@4.17.21"];
  expect(appendixEntry).toBeDefined();
  expect(appendixEntry?.ledger).toBeDefined();
});

test("update - uses default path when not provided", () => {
  const config: PastoralistJSON = {
    name: "test-app",
    version: "1.0.0",
    overrides: {},
  };

  const options: Options = {
    config,
    isTesting: true,
  };

  const result = update(options);

  expect(result.path).toBe("package.json");
});

test("update - uses default root when not provided", () => {
  const config: PastoralistJSON = {
    name: "test-app",
    version: "1.0.0",
    overrides: {},
  };

  const options: Options = {
    config,
    isTesting: true,
  };

  const result = update(options);

  expect(result.root).toBe("./");
});

test("update - handles yarn resolutions", () => {
  const config: PastoralistJSON = {
    name: "test-app",
    version: "1.0.0",
    dependencies: {
      lodash: "^4.17.20",
    },
    resolutions: {
      lodash: "4.17.21",
    },
  };

  const options: Options = {
    config,
    isTesting: true,
  };

  const result = update(options);

  expect(result.overrides).toBeDefined();
  expect(result.overrides?.lodash).toBe("4.17.21");
});

test("update - handles pnpm overrides", () => {
  const config: PastoralistJSON = {
    name: "test-app",
    version: "1.0.0",
    dependencies: {
      react: "^17.0.0",
    },
    pnpm: {
      overrides: {
        react: "18.0.0",
      },
    },
  };

  const options: Options = {
    config,
    isTesting: true,
  };

  const result = update(options);

  expect(result.overrides).toBeDefined();
  expect(result.overrides?.react).toBe("18.0.0");
});

test("update - preserves existing appendix entries", () => {
  const config: PastoralistJSON = {
    name: "test-app",
    version: "1.0.0",
    dependencies: {
      lodash: "^4.17.20",
    },
    overrides: {
      lodash: "4.17.21",
    },
    pastoralist: {
      appendix: {
        "express@4.18.2": {
          dependents: {
            "old-app": "express@^4.17.0",
          },
        },
      },
    },
  };

  const options: Options = {
    config,
    isTesting: true,
  };

  const result = update(options);

  expect(result.existingAppendix).toBeDefined();
  expect(result.existingAppendix?.["express@4.18.2"]).toBeDefined();
});
