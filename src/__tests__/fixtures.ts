import { Appendix, AppendixItem, PastoralistJSON, OverridesConfig, ResolveResolutionOptions } from './../interfaces';
export const execRunnerFixture = 'npm';
export const execArrayFixture = ['install', '--save', 'commander@7.0.0'];

export const appendixItemFixture: AppendixItem = {
  rootDeps: ["pastoralist-fixture"],
  dependents: {
    "pastoralist-fixture": "0.0.1"
  }
};

export const appendixFixture: Appendix = {
  "commander@7.0.0": appendixItemFixture,
};

export const overridesFixture: OverridesConfig['overrides'] = {
  "commander": "7.0.0"
};

export const resolutionsFixture: OverridesConfig['resolutions'] = {
  "commander": "7.0.0"
};

export const pnpmOverridesFixture: OverridesConfig['pnpm'] = {
  "overrides": {
    "commander": "7.0.0"
  }
};

export const pastoralistPackageJSONFixture: PastoralistJSON = {
  name: "pastoralist-fixture",
  version: "0.0.1",
  dependencies: {
    "commander": "^7.2.0",
    "cross-spawn": "^7.0.3",
    "fs-extra": "^9.0.1",
    "json5": "^2.2.0",
    "lodash": "^4.17.21",
    "rimraf": "^3.0.2",
    "yargs": "^17.2.1"
  },
  devDependencies: {
    "@types/json5": "^2.1.0",
    "@types/lodash": "^4.14.188",
    "@types/node": "^16.7.13",
    "@types/yargs": "^17.0.0"
  },
  resolutions: resolutionsFixture,
  pastoralist: {
    appendix: appendixFixture
  }
};

export const resolveResolutionOptionsFixture: ResolveResolutionOptions = {
  config: {
    resolutions: resolutionsFixture
  }
};
