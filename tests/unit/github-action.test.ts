import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const actionPath = resolve(import.meta.dir, "../../action.yml");

const readAction = () => readFileSync(actionPath, "utf8");

const extractJsonAwkScript = (actionYml: string): string => {
  const marker = "JSON_OUTPUT=$(printf '%s\\n' \"$RAW_OUTPUT\" | awk '";
  const start = actionYml.indexOf(marker);
  if (start === -1) throw new Error("Missing action JSON awk parser");

  const scriptStart = start + marker.length;
  const end = actionYml.indexOf("\n        ')", scriptStart);
  if (end === -1) throw new Error("Missing action JSON awk parser terminator");

  return actionYml.slice(scriptStart, end);
};

const runAwk = (script: string, input: string): string => {
  const result = spawnSync("awk", [script], { input, encoding: "utf8" });
  if (result.status === 0) return result.stdout.trim();
  throw new Error(result.stderr.trim());
};

describe("github action", () => {
  test("reads the final compact JSON object from Pastoralist output", () => {
    const script = extractJsonAwkScript(readAction());
    const earlierJson = '{"debug":true}';
    const finalJson = '{"success":true,"hasSecurityIssues":false}';

    const output = runAwk(script, ["setup log", earlierJson, "audit log", finalJson].join("\n"));

    expect(output).toBe(finalJson);
  });
});
