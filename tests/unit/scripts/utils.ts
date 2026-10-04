import assert from "node:assert/strict";
import { spawnSync, type SpawnSyncOptions } from "node:child_process";

export const runTestCommand = (command: string, args: string[], options: SpawnSyncOptions = {}) => {
  const encoding = "utf8" as const;
  const killSignal = "SIGKILL" as const;
  const boundedOptions = Object.assign({}, options, {
    encoding,
    timeout: 30000,
    killSignal,
  });
  const result = spawnSync(command, args, boundedOptions);
  assert.ifError(result.error);
  return result;
};

export const assertContainsText = (actual: string, expected: string): void => {
  assert.ok(actual.includes(expected));
};

export const assertExcludesText = (actual: string, expected: string): void => {
  assert.ok(!actual.includes(expected));
};
